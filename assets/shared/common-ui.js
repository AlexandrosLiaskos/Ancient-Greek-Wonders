(function () {
    'use strict';

    function valueOf(record, field) {
        if (typeof field === 'function') return field(record);
        return record && field ? record[field] : undefined;
    }

    function displayValue(value, locale) {
        if (value === null || value === undefined || value === '') return '—';
        if (typeof value === 'number') return value.toLocaleString(locale || undefined);
        return String(value);
    }

    function formatTemplate(template, values) {
        return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, function (_match, key) {
            return Object.prototype.hasOwnProperty.call(values || {}, key) ? values[key] : '';
        });
    }

    function isMissingValue(value, field) {
        if (value === null || value === undefined) return true;
        var text = String(value).trim();
        if (!text) return true;
        var defaults = ['_', '—', 'N/A', 'NA', 'NULL', 'NAN'];
        var tokens = field && Array.isArray(field.missingValues) ? field.missingValues : defaults;
        return tokens.some(function (token) {
            return text.toLocaleUpperCase() === String(token).trim().toLocaleUpperCase();
        });
    }

    function fieldDisplayValue(field, value, locale) {
        if (field && typeof field.formatValue === 'function') return field.formatValue(value);
        var labels = field && field.valueLabels;
        var key = String(value);
        if (labels && Object.prototype.hasOwnProperty.call(labels, key)) return labels[key];
        return displayValue(value, locale);
    }

    function formatNumber(value, locale, maximumFractionDigits) {
        if (!Number.isFinite(Number(value))) return '—';
        if (maximumFractionDigits === undefined) {
            var absolute = Math.abs(Number(value));
            if (absolute > 0 && absolute < 0.001) {
                return Number(value).toExponential(2);
            }
            maximumFractionDigits = absolute >= 100 ? 1 : (absolute >= 10 ? 2 : 3);
        }
        return Number(value).toLocaleString(locale || undefined, {
            maximumFractionDigits: maximumFractionDigits
        });
    }

    function quantile(sorted, probability) {
        if (!sorted.length) return NaN;
        var position = (sorted.length - 1) * probability;
        var lower = Math.floor(position);
        var fraction = position - lower;
        if (sorted[lower + 1] === undefined) return sorted[lower];
        return sorted[lower] + (fraction * (sorted[lower + 1] - sorted[lower]));
    }

    function recordWeight(record, config) {
        return typeof config.getRecordWeight === 'function' ? config.getRecordWeight(record) : 1;
    }

    function recordCount(records, config) {
        return records.reduce(function (sum, record) { return sum + recordWeight(record, config); }, 0);
    }

    function numericSummary(values, weights) {
        if (weights) {
            var pairs = values.map(function (value, index) { return { value: value, weight: weights[index] }; })
                .sort(function (a, b) { return a.value - b.value; });
            var n = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
            var weightedMean = pairs.reduce(function (sum, pair) { return sum + pair.value * pair.weight; }, 0) / n;
            var weightedVariance = n > 1 ? pairs.reduce(function (sum, pair) {
                return sum + pair.weight * Math.pow(pair.value - weightedMean, 2);
            }, 0) / (n - 1) : 0;
            function valueAt(index) {
                var cumulative = 0;
                for (var i = 0; i < pairs.length; i += 1) {
                    cumulative += pairs[i].weight;
                    if (index < cumulative) return pairs[i].value;
                }
                return pairs[pairs.length - 1].value;
            }
            function weightedQuantile(probability) {
                var position = (n - 1) * probability;
                var lower = Math.floor(position);
                return valueAt(lower) + (position - lower) * (valueAt(Math.min(n - 1, lower + 1)) - valueAt(lower));
            }
            var weightedSd = Math.sqrt(weightedVariance);
            var weightedQ1 = weightedQuantile(0.25), weightedQ3 = weightedQuantile(0.75);
            return {
                n: n, mean: weightedMean, median: weightedQuantile(0.5), standardDeviation: weightedSd,
                minimum: pairs[0].value, maximum: pairs[pairs.length - 1].value,
                range: pairs[pairs.length - 1].value - pairs[0].value,
                q1: weightedQ1, q3: weightedQ3, iqr: weightedQ3 - weightedQ1,
                skewness: n > 2 && weightedSd > 0 ? pairs.reduce(function (sum, pair) {
                    return sum + pair.weight * Math.pow(pair.value - weightedMean, 3);
                }, 0) / n / Math.pow(weightedSd, 3) : 0
            };
        }
        var sorted = values.slice().sort(function (left, right) { return left - right; });
        var sum = sorted.reduce(function (total, value) { return total + value; }, 0);
        var mean = sum / sorted.length;
        var variance = sorted.length > 1
            ? sorted.reduce(function (total, value) { return total + Math.pow(value - mean, 2); }, 0) / (sorted.length - 1)
            : 0;
        var q1 = quantile(sorted, 0.25);
        var median = quantile(sorted, 0.5);
        var q3 = quantile(sorted, 0.75);
        var standardDeviation = Math.sqrt(variance);
        var skewness = 0;
        if (sorted.length > 2 && standardDeviation > 0) {
            var thirdMoment = sorted.reduce(function (total, value) {
                return total + Math.pow(value - mean, 3);
            }, 0) / sorted.length;
            skewness = thirdMoment / Math.pow(standardDeviation, 3);
        }
        return {
            n: sorted.length,
            mean: mean,
            median: median,
            standardDeviation: standardDeviation,
            minimum: sorted[0],
            maximum: sorted[sorted.length - 1],
            range: sorted[sorted.length - 1] - sorted[0],
            q1: q1,
            q3: q3,
            iqr: q3 - q1,
            skewness: skewness
        };
    }

    function clear(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function renderSummary(node, rows, locale) {
        if (!node) return;
        clear(node);
        (rows || []).forEach(function (row) {
            var line = document.createElement('div');
            line.className = 'stats-row';
            var label = document.createElement('span');
            label.className = 'stats-row-label';
            label.textContent = row.label;
            var dots = document.createElement('span');
            dots.className = 'stats-row-dots';
            var value = document.createElement('strong');
            value.className = 'stats-row-value';
            if (row.id) value.id = row.id;
            value.textContent = displayValue(row.value, locale);
            line.appendChild(label);
            line.appendChild(dots);
            line.appendChild(value);
            node.appendChild(line);
        });
    }

    function chooseLogScale(field, summary) {
        var requested = field && field.scale;
        if (requested === 'linear') return false;
        if (requested === 'log') return (summary.minimum > 0 || field.allowNonPositiveLog) && summary.maximum > summary.minimum;
        return summary.minimum > 0 && summary.maximum > summary.minimum && summary.skewness > 1.5;
    }

    function numericHistogram(items, summary, requestedCount, useLog) {
        var symmetricLog = useLog && summary.minimum <= 0;
        var linearThreshold = symmetricLog ? items.reduce(function (minimum, item) {
            return item.value === 0 ? minimum : Math.min(minimum, Math.abs(item.value));
        }, Infinity) : 1;
        if (!Number.isFinite(linearThreshold)) linearThreshold = 1;
        var project = symmetricLog
            ? function (value) { return Math.sign(value) * Math.log1p(Math.abs(value) / linearThreshold) / Math.LN10; }
            : useLog ? Math.log10 : function (value) { return value; };
        var unproject = symmetricLog
            ? function (value) { return Math.sign(value) * Math.expm1(Math.abs(value) * Math.LN10) * linearThreshold; }
            : useLog ? function (value) { return Math.pow(10, value); } : function (value) { return value; };
        var minimumProjected = project(summary.minimum);
        var maximumProjected = project(summary.maximum);

        if (minimumProjected === maximumProjected) {
            return {
                bins: [{
                    x0: summary.minimum,
                    x1: summary.maximum,
                    count: summary.n,
                    records: items.map(function (item) { return item.record; })
                }],
                maximumCount: summary.n,
                logScale: useLog,
                symmetricLog: symmetricLog,
                linearThreshold: linearThreshold,
                project: project
            };
        }

        var count = Number(requestedCount);
        if (!Number.isFinite(count) || count < 2) {
            if (!useLog && summary.iqr > 0) {
                var fdWidth = 2 * summary.iqr * Math.cbrt(1 / summary.n);
                count = Math.ceil((summary.maximum - summary.minimum) / fdWidth);
            } else {
                count = Math.ceil(Math.log2(summary.n) + 1);
            }
        }
        if (!Number.isFinite(count)) count = Math.ceil(Math.sqrt(summary.n));
        count = Math.min(30, Math.max(5, Math.round(count)));

        var width = (maximumProjected - minimumProjected) / count;
        var bins = [];
        for (var i = 0; i < count; i += 1) {
            bins.push({
                x0: unproject(minimumProjected + (i * width)),
                x1: unproject(minimumProjected + ((i + 1) * width)),
                count: 0,
                records: []
            });
        }
        items.forEach(function (item) {
            var index = Math.floor((project(item.value) - minimumProjected) / width);
            index = Math.max(0, Math.min(count - 1, index));
            bins[index].count += item.weight === undefined ? 1 : item.weight;
            bins[index].records.push(item.record);
        });
        return {
            bins: bins,
            maximumCount: bins.reduce(function (maximum, bin) { return Math.max(maximum, bin.count); }, 0),
            logScale: useLog,
            symmetricLog: symmetricLog,
            linearThreshold: linearThreshold,
            project: project
        };
    }

    function categories(items, maxItems, field, locale, otherLabel) {
        var counts = {};
        var totalWeight = items.reduce(function (sum, item) { return sum + (item.weight === undefined ? 1 : item.weight); }, 0);
        items.forEach(function (item) {
            var key = String(item.value);
            if (!counts[key]) counts[key] = { count: 0, records: [] };
            counts[key].count += item.weight === undefined ? 1 : item.weight;
            counts[key].records.push(item.record);
        });
        var points = Object.keys(counts).map(function (key) {
            return {
                key: key,
                label: fieldDisplayValue(field, key, locale),
                value: counts[key].count,
                records: counts[key].records,
                ratio: totalWeight ? counts[key].count / totalWeight : 0
            };
        }).sort(function (a, b) {
            return b.value - a.value || a.label.localeCompare(b.label);
        });
        var limit = Math.max(2, maxItems || 8);
        if (points.length <= limit) return points;
        var visible = points.slice(0, limit - 1);
        var overflow = points.slice(limit - 1);
        visible.push({
            label: otherLabel || 'Other',
            value: overflow.reduce(function (total, point) { return total + point.value; }, 0),
            records: overflow.reduce(function (records, point) { return records.concat(point.records); }, []),
            ratio: totalWeight ? overflow.reduce(function (total, point) { return total + point.value; }, 0) / totalWeight : 0,
            isOther: true
        });
        return visible;
    }

    function svgElement(name, attrs) {
        var node = document.createElementNS('http://www.w3.org/2000/svg', name);
        Object.keys(attrs || {}).forEach(function (key) {
            node.setAttribute(key, attrs[key]);
        });
        return node;
    }

    function renderEmptyChart(node, label) {
        clear(node);
        var empty = document.createElement('p');
        empty.className = 'stats-empty';
        empty.textContent = label || 'No records in the current selection.';
        node.appendChild(empty);
    }

    function niceStep(span) {
        if (span <= 0) return 1;
        var exponent = Math.floor(Math.log10(span));
        var base = Math.pow(10, exponent);
        var normalized = span / base;
        var multiplier = normalized < 1.5 ? 1 : (normalized < 3 ? 2 : (normalized < 7 ? 5 : 10));
        return multiplier * base;
    }

    function niceTicks(lower, upper, count) {
        if (lower === upper) return [lower];
        var step = niceStep((upper - lower) / (count || 5));
        var start = Math.ceil(lower / step) * step;
        var ticks = [];
        for (var value = start; value <= upper + (step * 1e-9); value += step) {
            ticks.push(Number(value.toFixed(12)));
        }
        return ticks;
    }

    function countTicks(maximum, count) {
        if (maximum <= 4) {
            return Array.from({ length: maximum + 1 }, function (_value, index) { return index; });
        }
        var step = Math.max(1, niceStep(maximum / (count || 4)));
        var ticks = [];
        for (var value = 0; value <= maximum; value += step) ticks.push(value);
        if (ticks[ticks.length - 1] !== maximum) ticks.push(maximum);
        return ticks;
    }

    function logTicks(lower, upper) {
        if (lower <= 0 || upper <= 0 || lower === upper) return [];
        var ticks = [];
        for (var exponent = Math.floor(Math.log10(lower)); exponent <= Math.ceil(Math.log10(upper)); exponent += 1) {
            ticks.push(Math.pow(10, exponent));
        }
        return ticks;
    }

    function symmetricLogTicks(lower, upper, threshold) {
        var maximum = Math.max(Math.abs(lower), Math.abs(upper));
        var magnitudes = logTicks(threshold, maximum).filter(function (tick) { return tick >= threshold; });
        if (magnitudes.indexOf(threshold) === -1) magnitudes.unshift(threshold);
        return [0].concat(magnitudes, magnitudes.map(function (tick) { return -tick; }))
            .filter(function (tick) { return tick >= lower && tick <= upper; })
            .sort(function (a, b) { return a - b; });
    }

    function superscript(value) {
        var glyphs = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
        return String(value).split('').map(function (character) { return glyphs[character] || character; }).join('');
    }

    function formatTickLabel(value, useLog, locale) {
        if (!useLog) return formatNumber(value, locale, Math.abs(value) >= 100 ? 0 : 2);
        if (value >= 1 && value < 1000) return formatNumber(value, locale, 0);
        if (value >= 0.001 && value < 1) return formatNumber(value, locale, 3);
        return '10' + superscript(Math.round(Math.log10(value)));
    }

    function removeStatsTooltip() {
        var existing = document.querySelector('.stats-tooltip[data-common-tooltip="true"]');
        if (existing) existing.remove();
    }

    function positionStatsTooltip(tooltip, event) {
        if (!tooltip) return;
        var padding = 8;
        var offset = 12;
        var bounds = tooltip.getBoundingClientRect();
        var left = Math.min(event.clientX + offset, window.innerWidth - bounds.width - padding);
        var top = Math.min(event.clientY + offset, window.innerHeight - bounds.height - padding);
        tooltip.style.left = Math.max(padding, left) + 'px';
        tooltip.style.top = Math.max(padding, top) + 'px';
    }

    function attachChartInteraction(target, tooltipText, onActivate) {
        var title = svgElement('title');
        title.textContent = tooltipText;
        target.appendChild(title);
        target.setAttribute('aria-label', tooltipText);
        target.addEventListener('mouseenter', function (event) {
            removeStatsTooltip();
            var tooltip = document.createElement('div');
            tooltip.className = 'stats-tooltip';
            tooltip.dataset.commonTooltip = 'true';
            tooltip.textContent = tooltipText;
            document.body.appendChild(tooltip);
            positionStatsTooltip(tooltip, event);
        });
        target.addEventListener('mousemove', function (event) {
            var tooltip = document.querySelector('.stats-tooltip[data-common-tooltip="true"]');
            positionStatsTooltip(tooltip, event);
        });
        target.addEventListener('mouseleave', removeStatsTooltip);
        if (typeof onActivate !== 'function') return;
        target.setAttribute('role', 'button');
        target.setAttribute('tabindex', '0');
        target.addEventListener('click', onActivate);
        target.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onActivate();
        });
    }

    function renderNumericChart(node, histogram, summary, config) {
        clear(node);
        var width = 320;
        var height = 190;
        var margin = { top: 14, right: 12, bottom: 30, left: 38 };
        var innerWidth = width - margin.left - margin.right;
        var innerHeight = height - margin.top - margin.bottom;
        var useLog = histogram.logScale;
        var project = histogram.project;
        var minimumProjected = project(summary.minimum);
        var maximumProjected = project(summary.maximum);
        var projectedRange = maximumProjected - minimumProjected;
        var xScale = function (value) {
            return projectedRange ? ((project(value) - minimumProjected) / projectedRange) * innerWidth : innerWidth / 2;
        };
        var maximumCount = histogram.maximumCount || 1;
        var yScale = function (value) { return innerHeight - ((value / maximumCount) * innerHeight); };
        var svg = svgElement('svg', {
            class: 'stats-svg stats-histogram' + (useLog ? ' is-log' : ''),
            viewBox: '0 0 ' + width + ' ' + height,
            preserveAspectRatio: 'xMidYMid meet',
            role: 'img',
            'aria-label': (config.histogramOf || 'Histogram of') + ' ' + config.fieldLabel + (useLog ? ' (' + (config.logScaleLabel || 'log scale') + ')' : '')
        });
        var group = svgElement('g', { transform: 'translate(' + margin.left + ',' + margin.top + ')' });
        svg.appendChild(group);

        countTicks(maximumCount, 4).forEach(function (tick) {
            group.appendChild(svgElement('line', {
                x1: 0, x2: innerWidth, y1: yScale(tick), y2: yScale(tick), class: 'stats-gridline'
            }));
            var label = svgElement('text', {
                x: -6, y: yScale(tick), class: 'stats-tick-label stats-tick-y',
                'text-anchor': 'end', 'dominant-baseline': 'middle'
            });
            label.textContent = String(Math.round(tick));
            group.appendChild(label);
        });

        var bars = svgElement('g', { class: 'stats-bars' });
        histogram.bins.forEach(function (bin) {
            var x = projectedRange ? xScale(bin.x0) : (innerWidth / 2) - 24;
            var barWidth = projectedRange ? Math.max(1, xScale(bin.x1) - xScale(bin.x0) - 1) : 48;
            var y = yScale(bin.count);
            var bar = svgElement('rect', {
                x: x, y: y, width: barWidth, height: Math.max(0, innerHeight - y), class: 'stats-bar stats-bar-numeric'
            });
            var rangeLabel = projectedRange
                ? '[' + formatNumber(bin.x0, config.locale) + ', ' + formatNumber(bin.x1, config.locale) + ']'
                : formatNumber(summary.minimum, config.locale);
            var tooltipText = rangeLabel + ' · n=' + bin.count;
            attachChartInteraction(bar, tooltipText, bin.records.length && config.onGroupSelect ? function () {
                config.onGroupSelect({ label: rangeLabel, records: bin.records, numeric: true });
            } : null);
            bars.appendChild(bar);
        });
        group.appendChild(bars);

        if (projectedRange) {
            var referenceLines = svgElement('g', { class: 'stats-ref-lines' });
            var drawReference = function (value, className, labelText, yOffset) {
                var x = xScale(value);
                referenceLines.appendChild(svgElement('line', {
                    x1: x, x2: x, y1: 0, y2: innerHeight, class: 'stats-refline ' + className
                }));
                var label = svgElement('text', {
                    x: x + 3, y: yOffset, class: 'stats-reflabel ' + className, 'dominant-baseline': 'hanging'
                });
                label.textContent = labelText;
                referenceLines.appendChild(label);
            };
            var referencesOverlap = Math.abs(xScale(summary.mean) - xScale(summary.median)) < 20;
            drawReference(summary.median, 'is-median', 'med', referencesOverlap ? 15 : 4);
            drawReference(summary.mean, 'is-mean', 'μ', 4);
            group.appendChild(referenceLines);
        }

        var axis = svgElement('g', { class: 'stats-axis', transform: 'translate(0,' + innerHeight + ')' });
        axis.appendChild(svgElement('line', { x1: 0, x2: innerWidth, y1: 0, y2: 0, class: 'stats-axis-line' }));
        var xTicks = histogram.symmetricLog
            ? symmetricLogTicks(summary.minimum, summary.maximum, histogram.linearThreshold)
            : useLog
            ? logTicks(summary.minimum, summary.maximum).filter(function (tick) { return tick >= summary.minimum * 0.95 && tick <= summary.maximum * 1.05; })
            : niceTicks(summary.minimum, summary.maximum, 4);
        if (!xTicks.length) xTicks = [summary.minimum, summary.maximum];
        if (histogram.symmetricLog) {
            var zeroVisible = summary.minimum <= 0 && summary.maximum >= 0;
            var previousTickX = -Infinity;
            xTicks = xTicks.filter(function (tick) {
                var x = xScale(tick);
                if (zeroVisible && tick !== 0 && Math.abs(x - xScale(0)) < 32) return false;
                if (tick !== 0 && x - previousTickX < 32) return false;
                previousTickX = x; return true;
            });
        }
        xTicks.forEach(function (tick) {
            var x = xScale(tick);
            if (x < -2 || x > innerWidth + 2) return;
            axis.appendChild(svgElement('line', { x1: x, x2: x, y1: 0, y2: 4, class: 'stats-tick' }));
            var label = svgElement('text', {
                x: x, y: 16, class: 'stats-tick-label stats-tick-x', 'text-anchor': 'middle'
            });
            label.textContent = histogram.symmetricLog ? formatNumber(tick, config.locale) : formatTickLabel(tick, useLog, config.locale);
            axis.appendChild(label);
        });
        group.appendChild(axis);
        node.appendChild(svg);
    }

    function renderCategoricalChart(node, points, config) {
        clear(node);
        var rowHeight = 22;
        var gap = 4;
        var width = 320;
        var margin = { top: 8, right: 48, bottom: 8, left: 104 };
        var innerWidth = width - margin.left - margin.right;
        var innerHeight = points.length * (rowHeight + gap) - gap;
        var height = innerHeight + margin.top + margin.bottom;
        var svg = svgElement('svg', {
            class: 'stats-svg stats-barchart',
            viewBox: '0 0 ' + width + ' ' + height,
            preserveAspectRatio: 'xMidYMid meet',
            role: 'img',
            'aria-label': (config.frequencyOf || 'Frequency of') + ' ' + config.fieldLabel
        });
        var group = svgElement('g', { transform: 'translate(' + margin.left + ',' + margin.top + ')' });
        svg.appendChild(group);
        var nonOther = points.filter(function (point) { return !point.isOther; });
        var maximum = (nonOther[0] && nonOther[0].value) || points[0].value || 1;

        points.forEach(function (point, index) {
            var y = index * (rowHeight + gap);
            var rawWidth = (point.value / maximum) * innerWidth;
            var overflowed = rawWidth > innerWidth + 0.5;
            var barWidth = Math.max(1, Math.min(innerWidth, rawWidth));
            var label = svgElement('text', {
                x: -8, y: y + (rowHeight / 2),
                class: 'stats-cat-label' + (point.isOther ? ' is-other' : ''),
                'text-anchor': 'end', 'dominant-baseline': 'middle'
            });
            label.textContent = point.label.length > 14 ? point.label.slice(0, 13) + '…' : point.label;
            var fullLabel = svgElement('title');
            fullLabel.textContent = point.label;
            label.appendChild(fullLabel);
            group.appendChild(label);
            group.appendChild(svgElement('line', {
                x1: 0, x2: innerWidth, y1: y + (rowHeight / 2), y2: y + (rowHeight / 2), class: 'stats-bar-track'
            }));
            var bar = svgElement('rect', {
                x: 0, y: y, width: barWidth, height: rowHeight,
                class: 'stats-bar stats-bar-cat' + (point.isOther ? ' is-other' : '') + (overflowed ? ' is-overflow' : '')
            });
            var percentage = new Intl.NumberFormat(config.locale || undefined, {
                style: 'percent', maximumFractionDigits: 1
            }).format(point.ratio || 0);
            attachChartInteraction(bar, point.label + ' · n=' + point.value + ' (' + percentage + ')', point.records.length && config.onGroupSelect ? function () {
                config.onGroupSelect({ label: point.label, records: point.records, numeric: false });
            } : null);
            group.appendChild(bar);
            if (overflowed) {
                group.appendChild(svgElement('rect', {
                    x: innerWidth - 6, y: y, width: 6, height: rowHeight, class: 'stats-bar-overflow-cap'
                }));
            }
            var count = svgElement('text', {
                x: barWidth + 6, y: y + (rowHeight / 2), class: 'stats-bar-value', 'dominant-baseline': 'middle'
            });
            count.textContent = String(point.value);
            group.appendChild(count);
        });
        node.appendChild(svg);
    }

    function renderStatistics(config) {
        config = config || {};
        removeStatsTooltip();
        var panel = document.getElementById(config.containerId || 'stats-tab');
        if (!panel) return;
        var records = Array.isArray(config.records) ? config.records : [];
        var fieldConfig = config.fieldConfig || {};
        var items = records.map(function (record) {
            return { record: record, value: valueOf(record, config.field), weight: recordWeight(record, config) };
        }).filter(function (item) {
            return !isMissingValue(item.value, fieldConfig);
        });
        var sample = panel.querySelector('.stats-sample');
        var title = panel.querySelector('.stats-figure-title');
        var axis = panel.querySelector('.stats-axis-label');
        if (sample) sample.textContent = recordCount(records, config).toLocaleString(config.locale || undefined) + ' visible records';
        if (title && config.figureTitle) title.textContent = config.figureTitle;
        var chart = panel.querySelector('.stats-chart-wrap');
        if (config.type === 'numeric') {
            var numericItems = items.map(function (item) {
                return { record: item.record, value: Number(item.value), weight: item.weight };
            }).filter(function (item) { return Number.isFinite(item.value); });
            if (!numericItems.length) {
                renderEmptyChart(chart, config.emptyLabel);
                if (axis) axis.textContent = config.axisLabel || '';
            } else {
                var summary = numericSummary(numericItems.map(function (item) { return item.value; }),
                    config.getRecordWeight ? numericItems.map(function (item) { return item.weight; }) : null);
                var useLog = chooseLogScale(fieldConfig, summary);
                var histogram = numericHistogram(numericItems, summary, config.binCount, useLog);
                var scaleLabel = histogram.symmetricLog ? 'symmetric log scale' : config.logScaleLabel || 'log scale';
                if (axis) {
                    clear(axis);
                    var axisMain = document.createElement('span');
                    axisMain.className = 'stats-axis-label-main';
                    axisMain.textContent = config.axisLabel || '';
                    axis.appendChild(axisMain);
                    if (useLog) {
                        var scaleTag = document.createElement('span');
                        scaleTag.className = 'stats-axis-scale-tag';
                        scaleTag.textContent = scaleLabel;
                        if (histogram.symmetricLog) {
                            scaleTag.title = 'Includes zero and negative values. Linear near zero, logarithmic for larger magnitudes; transition scale: '
                                + formatNumber(histogram.linearThreshold, config.locale) + (fieldConfig.unit ? ' ' + fieldConfig.unit : '')
                                + '. Axis labels and summary statistics use original units.';
                        }
                        axis.appendChild(scaleTag);
                    }
                }
                renderNumericChart(chart, histogram, summary, {
                    locale: config.locale,
                    fieldLabel: fieldConfig.label || config.axisLabel || String(config.field),
                    histogramOf: config.histogramOf,
                    logScaleLabel: scaleLabel,
                    onGroupSelect: config.onGroupSelect
                });
            }
        } else {
            var points = categories(items, config.maxItems || 12, fieldConfig, config.locale, config.otherLabel);
            if (!points.length) renderEmptyChart(chart, config.emptyLabel);
            else renderCategoricalChart(chart, points, {
                locale: config.locale,
                fieldLabel: fieldConfig.label || config.axisLabel || String(config.field),
                frequencyOf: config.frequencyOf,
                onGroupSelect: config.onGroupSelect
            });
            if (axis) axis.textContent = config.countLabel || 'Count';
        }
        renderSummary(panel.querySelector('.stats-summary'), config.summaryRows || [], config.locale);
    }

    function setupSearch(config) {
        config = config || {};
        var input = document.getElementById(config.inputId || 'search-input');
        var results = document.getElementById(config.resultsId || 'search-results');
        if (!input || !results || input.dataset.nkuaSearchReady === 'true') return;
        input.dataset.nkuaSearchReady = 'true';
        results.classList.add('hidden');

        function render() {
            var query = input.value.trim().toLocaleLowerCase(config.locale || undefined);
            clear(results);
            if (!query) {
                results.classList.add('hidden');
                return;
            }
            results.classList.remove('hidden');
            var records = typeof config.getRecords === 'function' ? config.getRecords() : [];
            var matches = (records || []).filter(function (record) {
                return (config.fields || []).some(function (field) {
                    return displayValue(valueOf(record, field)).toLocaleLowerCase(config.locale || undefined).indexOf(query) !== -1;
                });
            }).slice(0, config.limit || 30);

            if (!matches.length) {
                var empty = document.createElement('p');
                empty.className = 'search-no-results';
                empty.textContent = config.emptyLabel || 'No matching records.';
                results.appendChild(empty);
                return;
            }

            matches.forEach(function (record) {
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'search-result search-result-item';
                var name = document.createElement('strong');
                name.className = 'search-result-name';
                name.textContent = displayValue(valueOf(record, config.label));
                var meta = document.createElement('span');
                meta.className = 'search-result-meta';
                meta.textContent = (config.meta || []).map(function (field) {
                    return valueOf(record, field);
                }).filter(function (value) {
                    return value !== null && value !== undefined && value !== '';
                }).join(' · ');
                button.appendChild(name);
                if (meta.textContent) button.appendChild(meta);
                button.addEventListener('click', function () {
                    if (typeof config.onSelect === 'function') config.onSelect(record);
                });
                results.appendChild(button);
            });
        }

        input.addEventListener('input', render);
    }

    function makeElement(tagName, className, id) {
        var node = document.createElement(tagName);
        if (className) node.className = className;
        if (id) node.id = id;
        return node;
    }

    function makeSvgChevron(className) {
        var svg = svgElement('svg', {
            class: className || '',
            width: '16',
            height: '16',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.5',
            'aria-hidden': 'true'
        });
        svg.appendChild(svgElement('polyline', { points: '6 9 12 15 18 9' }));
        return svg;
    }

    function makeQueryIcon(kind) {
        var svg = svgElement('svg', {
            class: 'query-action-icon',
            width: '16',
            height: '16',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.7',
            'stroke-linecap': 'round',
            'aria-hidden': 'true'
        });
        if (kind === 'plus') {
            svg.appendChild(svgElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }));
            svg.appendChild(svgElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' }));
        } else {
            svg.appendChild(svgElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }));
            svg.appendChild(svgElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' }));
        }
        return svg;
    }

    function localeText(config, key, fallback) {
        return config && config.text && config.text[key] ? config.text[key] : fallback;
    }

    function advancedLocaleText(config, key, english, greek) {
        if (config && config.text && config.text[key]) return config.text[key];
        var locale = (config && config.locale) || document.documentElement.lang || 'en';
        return /^el(?:-|$)/i.test(locale) ? greek : english;
    }

    function annotateAdvancedConditionRows(container, config) {
        if (!container) return;
        var labels = {
            logic: advancedLocaleText(config, 'queryJoin', 'Join', 'Σύνδεση'),
            field: advancedLocaleText(config, 'queryField', 'Field', 'Πεδίο'),
            operator: advancedLocaleText(config, 'queryRelation', 'Relation', 'Σχέση'),
            value: advancedLocaleText(config, 'queryValue', 'Value', 'Τιμή'),
            remove: advancedLocaleText(config, 'removeCondition', 'Remove condition', 'Αφαίρεση συνθήκης')
        };

        function annotate() {
            Array.prototype.forEach.call(container.querySelectorAll('.query-condition-row'), function (row) {
                [
                    ['.condition-logic', labels.logic],
                    ['.condition-field', labels.field],
                    ['.condition-operator', labels.operator],
                    ['.condition-value', labels.value]
                ].forEach(function (entry) {
                    var wrapper = row.querySelector(entry[0]);
                    if (!wrapper) return;
                    wrapper.dataset.queryLabel = entry[1];
                    var control = wrapper.querySelector('select, input, .eds-btn');
                    if (control && !control.getAttribute('aria-label')) control.setAttribute('aria-label', entry[1]);
                });

                var remove = row.querySelector('.condition-remove');
                if (remove && !remove.getAttribute('aria-label')) remove.setAttribute('aria-label', labels.remove);
            });

            Array.prototype.forEach.call(container.querySelectorAll('button'), function (button) {
                if (!button.getAttribute('type')) button.type = 'button';
            });
        }

        annotate();
        if (!container._nkuaQueryObserver) {
            container._nkuaQueryObserver = new MutationObserver(annotate);
            container._nkuaQueryObserver.observe(container, { childList: true, subtree: true });
        }
    }

    function prepareAdvancedQueryModal(modal, config) {
        if (!modal) return;
        var content = modal.querySelector('.modal-content');
        var header = modal.querySelector('.modal-header');
        var body = modal.querySelector('.modal-body');
        var conditions = modal.querySelector('#query-conditions');
        var controls = modal.querySelector('.query-builder-controls');
        if (!content || !header || !body || !conditions || !controls) return;

        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        content.classList.add('query-modal-content');
        header.classList.add('query-modal-header');
        body.classList.add('query-modal-body');

        var title = header.querySelector('h3');
        if (title) {
            if (!title.id) title.id = 'sql-filter-modal-title';
            modal.setAttribute('aria-labelledby', title.id);
        }

        var heading = header.querySelector('.query-modal-heading');
        if (!heading && title) {
            heading = makeElement('div', 'query-modal-heading');
            header.insertBefore(heading, title);
            heading.appendChild(title);
        }

        var description = header.querySelector('.query-modal-description');
        if (!description && heading) {
            description = makeElement('p', 'query-modal-description', 'sql-filter-modal-description');
            description.textContent = advancedLocaleText(
                config,
                'queryBuilderHelp',
                'Combine fields and relationships to narrow the visible records.',
                'Συνδυάστε πεδία και σχέσεις για να περιορίσετε τις ορατές εγγραφές.'
            );
            heading.appendChild(description);
            modal.setAttribute('aria-describedby', description.id);
        }

        var close = header.querySelector('.modal-close');
        if (close) {
            close.type = 'button';
            if (!close.getAttribute('aria-label')) {
                close.setAttribute('aria-label', advancedLocaleText(config, 'close', 'Close', 'Κλείσιμο'));
            }
        }

        var composer = conditions.closest('.query-composer');
        if (!composer) {
            composer = makeElement('section', 'query-composer');
            composer.setAttribute('aria-labelledby', 'query-conditions-title');
            body.insertBefore(composer, conditions);

            var sectionHeading = makeElement('div', 'query-section-heading');
            var sectionTitle = makeElement('h4', '', 'query-conditions-title');
            sectionTitle.textContent = advancedLocaleText(config, 'queryConditions', 'Conditions', 'Συνθήκες');
            sectionHeading.appendChild(sectionTitle);

            var columnHead = makeElement('div', 'query-column-head');
            [
                ['query-column-logic', advancedLocaleText(config, 'queryJoin', 'Join', 'Σύνδεση')],
                ['query-column-field', advancedLocaleText(config, 'queryField', 'Field', 'Πεδίο')],
                ['query-column-operator', advancedLocaleText(config, 'queryRelation', 'Relation', 'Σχέση')],
                ['query-column-value', advancedLocaleText(config, 'queryValue', 'Value', 'Τιμή')]
            ].forEach(function (entry) {
                var label = makeElement('span', entry[0]);
                label.textContent = entry[1];
                columnHead.appendChild(label);
            });
            columnHead.setAttribute('aria-hidden', 'true');

            composer.appendChild(sectionHeading);
            composer.appendChild(columnHead);
            composer.appendChild(conditions);
            composer.appendChild(controls);
        }

        var preview = modal.querySelector('.query-preview');
        var active = modal.querySelector('#sql-filter-active');
        var review = preview && preview.closest('.query-review');
        if (preview && !review) {
            review = makeElement('section', 'query-review');
            body.insertBefore(review, preview);
            review.appendChild(preview);
            if (active) review.appendChild(active);
        }

        var error = modal.querySelector('#sql-filter-error');
        var actions = modal.querySelector('.sql-filter-actions');
        if (actions) {
            actions.classList.add('query-modal-actions');
            if (error && error.nextElementSibling !== actions) body.insertBefore(error, actions);
        }

        Array.prototype.forEach.call(controls.querySelectorAll('button'), function (button) {
            if (!button.getAttribute('type')) button.type = 'button';
        });
        annotateAdvancedConditionRows(conditions, config);
    }

    function CommonFilterPanel(config) {
        this.config = config || {};
        this.fields = this.config.fields || [];
        this.advancedFields = this.config.advancedFields || this.fields;
        this.selectedKey = this.fields.length ? this.fields[0].key : null;
        this.currentRecords = [];
        this.allRecords = [];
        this.searchTerms = {};
        this.elements = {};
        this.advancedConditions = [];
        this.advancedConditionId = 0;
        this.advancedBaseRecords = [];
        this.advancedActive = false;
        this.generatedAdvanced = false;
    }

    CommonFilterPanel.prototype.init = function () {
        if (!this.fields.length || !document.getElementById('filters-tab')) return;
        this.buildShell();
        this.bindEvents();
        this.populatePicker();
        this.render();
    };

    CommonFilterPanel.prototype.buildShell = function () {
        var tab = document.getElementById('filters-tab');
        var existingPanel = document.getElementById('fbc-panel');
        if (existingPanel) {
            var modal = document.getElementById('fbc-variable-modal');
            var clearButton = existingPanel.querySelector('#clear-filters') || tab.querySelector('#clear-filters');
            var advancedButton = existingPanel.querySelector('#sql-filter-btn') || tab.querySelector('#sql-filter-btn');
            this.elements = {
                tab: tab,
                picker: existingPanel.querySelector('#fbc-picker-btn') || document.getElementById('fbc-picker-btn'),
                pickerValue: existingPanel.querySelector('#fbc-picker-value') || document.getElementById('fbc-picker-value'),
                content: existingPanel.querySelector('#fbc-content') || document.getElementById('fbc-content'),
                activeSection: existingPanel.querySelector('#fbc-active-section') || document.getElementById('fbc-active-section'),
                activeList: existingPanel.querySelector('#fbc-active-list') || document.getElementById('fbc-active-list'),
                clearButton: clearButton,
                advancedButton: advancedButton,
                modal: modal,
                modalClose: modal ? (modal.querySelector('#close-fbc-variable') || modal.querySelector('.modal-close')) : null,
                modalSearch: modal ? (modal.querySelector('#fbc-variable-search-input') || modal.querySelector('.filter-modal-search-input')) : null,
                modalList: modal ? (modal.querySelector('#fbc-variable-list') || modal.querySelector('.filter-modal-list')) : null
            };
            var advModal = document.getElementById('sql-filter-modal');
            if (advModal) {
                this.elements.advancedModal = advModal;
                this.elements.advancedClose = advModal.querySelector('#close-sql-filter') || advModal.querySelector('.modal-close');
                this.elements.advancedConditions = advModal.querySelector('#query-conditions');
                this.elements.advancedAdd = advModal.querySelector('#add-condition');
                this.elements.advancedPreview = advModal.querySelector('#query-preview-text');
                this.elements.advancedError = advModal.querySelector('#sql-filter-error');
                this.elements.advancedApply = advModal.querySelector('#apply-sql-filter');
                this.elements.advancedClear = advModal.querySelector('#clear-sql-filter');
                this.elements.advancedActive = advModal.querySelector('#sql-filter-active');
                this.elements.advancedActiveText = advModal.querySelector('#sql-active-text');
                this.generatedAdvanced = true;
            }
            return;
        }

        var legacy = tab.querySelector('#filter-controls');
        if (!legacy) {
            legacy = makeElement('div', 'nkua-legacy-controls');
            Array.prototype.slice.call(tab.querySelectorAll('.filter-group, #active-filters-summary')).forEach(function (node) {
                legacy.appendChild(node);
            });
            tab.appendChild(legacy);
        }

        var clearButton = legacy.querySelector('#clear-filters') || tab.querySelector('#clear-filters');
        var advancedButton = legacy.querySelector('#sql-filter-btn') || tab.querySelector('#sql-filter-btn');
        if (!advancedButton && this.config.enableAdvancedQuery !== false) {
            advancedButton = makeElement('button', '', 'sql-filter-btn');
            advancedButton.type = 'button';
            this.generatedAdvanced = true;
        }
        legacy.classList.add('nkua-legacy-controls');
        legacy.hidden = true;

        var panel = makeElement('div', 'fbc-panel', 'fbc-panel');
        var picker = makeElement('button', 'fbc-picker-btn', 'fbc-picker-btn');
        picker.type = 'button';
        picker.setAttribute('aria-haspopup', 'dialog');
        picker.setAttribute('aria-controls', 'fbc-variable-modal');

        var eyebrow = makeElement('span', 'fbc-picker-eyebrow');
        eyebrow.textContent = localeText(this.config, 'filterBy', 'filter by');
        var pickerRow = makeElement('span', 'fbc-picker-row');
        var pickerValue = makeElement('span', 'fbc-picker-value', 'fbc-picker-value');
        pickerRow.appendChild(pickerValue);
        pickerRow.appendChild(makeSvgChevron('fbc-picker-chev'));
        picker.appendChild(eyebrow);
        picker.appendChild(pickerRow);

        var content = makeElement('div', 'fbc-content', 'fbc-content');
        content.setAttribute('aria-live', 'polite');
        var activeSection = makeElement('section', 'fbc-active-section hidden', 'fbc-active-section');
        var activeList = makeElement('div', 'fbc-active-list', 'fbc-active-list');
        activeSection.appendChild(activeList);
        var actions = makeElement('div', 'fbc-actions');

        if (clearButton) {
            clearButton.className = 'fbc-link fbc-link-secondary';
            clearButton.removeAttribute('style');
            clearButton.type = 'button';
            clearButton.textContent = localeText(this.config, 'resetAll', 'Reset all');
            actions.appendChild(clearButton);
        }
        if (advancedButton) {
            advancedButton.className = 'fbc-link';
            advancedButton.removeAttribute('style');
            advancedButton.type = 'button';
            advancedButton.textContent = localeText(this.config, 'advancedQuery', 'Advanced query') + ' →';
            actions.appendChild(advancedButton);
        }

        panel.appendChild(picker);
        panel.appendChild(content);
        panel.appendChild(activeSection);
        panel.appendChild(actions);

        var error = tab.querySelector('#filter-error');
        tab.insertBefore(panel, error || legacy);

        var modal = makeElement('div', 'modal filter-selection-modal stats-variable-modal', 'fbc-variable-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'fbc-variable-modal-title');
        var modalContent = makeElement('div', 'modal-content');
        var modalHeader = makeElement('div', 'modal-header');
        var modalTitle = makeElement('h3', '', 'fbc-variable-modal-title');
        modalTitle.textContent = localeText(this.config, 'chooseFilter', 'Choose a filter variable');
        var modalClose = makeElement('button', 'modal-close', 'close-fbc-variable');
        modalClose.type = 'button';
        modalClose.setAttribute('aria-label', localeText(this.config, 'close', 'Close'));
        modalClose.textContent = '×';
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(modalClose);
        var modalBody = makeElement('div', 'modal-body');
        var modalSearch = makeElement('input', 'filter-modal-search-input', 'fbc-variable-search-input');
        modalSearch.type = 'search';
        modalSearch.autocomplete = 'off';
        modalSearch.placeholder = localeText(this.config, 'searchVariables', 'Search variables…');
        var modalList = makeElement('div', 'filter-modal-list stats-variable-list', 'fbc-variable-list');
        modalBody.appendChild(modalSearch);
        modalBody.appendChild(modalList);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        this.elements = {
            tab: tab,
            picker: picker,
            pickerValue: pickerValue,
            content: content,
            activeSection: activeSection,
            activeList: activeList,
            clearButton: clearButton,
            advancedButton: advancedButton,
            modal: modal,
            modalClose: modalClose,
            modalSearch: modalSearch,
            modalList: modalList
        };

        if (this.generatedAdvanced) this.buildAdvancedShell();
    };

    CommonFilterPanel.prototype.bindEvents = function () {
        var self = this;
        if (!this.elements.picker) return;
        this.elements.picker.addEventListener('click', function () { self.openPicker(); });
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', function () { self.closePicker(); });
        }
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', function (event) {
                if (event.target === self.elements.modal) self.closePicker();
            });
        }
        if (this.elements.modalSearch) {
            this.elements.modalSearch.addEventListener('input', function () { self.populatePicker(); });
        }
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', function () {
                self.fields.forEach(function (field) {
                    var input = document.getElementById(field.inputId || (field.key + '-filter'));
                    if (input) input.value = '';
                    if (typeof self.config.onApply === 'function') {
                        self.config.onApply(field, '');
                    }
                });
                self.resetAdvanced(false);
                self.renderActiveList();
                window.setTimeout(function () { self.render(); }, 0);
            });
        }
        if (this.generatedAdvanced && this.elements.advancedButton) {
            this.elements.advancedButton.addEventListener('click', function () { self.openAdvanced(); });
            if (this.elements.advancedClose) {
                this.elements.advancedClose.addEventListener('click', function () { self.closeAdvanced(); });
            }
            if (this.elements.advancedModal) {
                this.elements.advancedModal.addEventListener('click', function (event) {
                    if (event.target === self.elements.advancedModal) self.closeAdvanced();
                });
            }
            if (this.elements.advancedAdd) {
                this.elements.advancedAdd.addEventListener('click', function () { self.addAdvancedCondition(); });
            }
            if (this.elements.advancedApply) {
                this.elements.advancedApply.addEventListener('click', function () { self.applyAdvanced(); });
            }
            if (this.elements.advancedClear) {
                this.elements.advancedClear.addEventListener('click', function () { self.resetAdvanced(true); });
            }
        }
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && self.elements.modal && self.elements.modal.classList.contains('active')) self.closePicker();
            if (event.key === 'Escape' && self.elements.advancedModal && self.elements.advancedModal.classList.contains('active')) self.closeAdvanced();
        });
    };

    CommonFilterPanel.prototype.buildAdvancedShell = function () {
        var modal = makeElement('div', 'modal sql-filter-modal', 'sql-filter-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'sql-filter-modal-title');

        var modalContent = makeElement('div', 'modal-content');
        var modalHeader = makeElement('div', 'modal-header');
        var title = makeElement('h3', '', 'sql-filter-modal-title');
        title.textContent = localeText(this.config, 'queryBuilder', 'Query builder');
        var closeButton = makeElement('button', 'modal-close', 'close-sql-filter');
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', localeText(this.config, 'close', 'Close'));
        closeButton.textContent = '×';
        modalHeader.appendChild(title);
        modalHeader.appendChild(closeButton);

        var body = makeElement('div', 'modal-body');
        var conditions = makeElement('div', 'query-conditions', 'query-conditions');
        var controls = makeElement('div', 'query-builder-controls');
        var addButton = makeElement('button', 'btn-add-condition', 'add-condition');
        addButton.type = 'button';
        addButton.appendChild(makeQueryIcon('plus'));
        addButton.appendChild(document.createTextNode(localeText(this.config, 'addCondition', 'Add condition')));
        controls.appendChild(addButton);

        var preview = makeElement('div', 'query-preview');
        var previewLabel = makeElement('label');
        previewLabel.textContent = localeText(this.config, 'generatedQuery', 'Generated query:');
        var previewText = makeElement('div', 'query-preview-text', 'query-preview-text');
        preview.appendChild(previewLabel);
        preview.appendChild(previewText);

        var error = makeElement('div', 'sql-filter-error hidden', 'sql-filter-error');
        var actions = makeElement('div', 'sql-filter-actions');
        var applyButton = makeElement('button', 'btn-primary', 'apply-sql-filter');
        applyButton.type = 'button';
        applyButton.textContent = localeText(this.config, 'applyFilter', 'Apply filter');
        var clearButton = makeElement('button', 'btn-secondary', 'clear-sql-filter');
        clearButton.type = 'button';
        clearButton.textContent = localeText(this.config, 'clearAll', 'Clear all');
        actions.appendChild(applyButton);
        actions.appendChild(clearButton);

        var active = makeElement('div', 'sql-filter-active hidden', 'sql-filter-active');
        var activeLabel = makeElement('span', 'sql-active-label');
        activeLabel.textContent = localeText(this.config, 'activeFilter', 'Active filter:');
        var activeText = makeElement('span', '', 'sql-active-text');
        active.appendChild(activeLabel);
        active.appendChild(activeText);

        body.appendChild(conditions);
        body.appendChild(controls);
        body.appendChild(preview);
        body.appendChild(error);
        body.appendChild(actions);
        body.appendChild(active);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        prepareAdvancedQueryModal(modal, this.config);

        this.elements.advancedModal = modal;
        this.elements.advancedClose = closeButton;
        this.elements.advancedConditions = conditions;
        this.elements.advancedAdd = addButton;
        this.elements.advancedPreview = previewText;
        this.elements.advancedError = error;
        this.elements.advancedApply = applyButton;
        this.elements.advancedClear = clearButton;
        this.elements.advancedActive = active;
        this.elements.advancedActiveText = activeText;
    };

    CommonFilterPanel.prototype.openAdvanced = function () {
        if (!this.elements.advancedModal) return;
        if (!this.advancedActive) this.advancedBaseRecords = this.currentRecords.slice();
        if (!this.advancedConditions.length) this.addAdvancedCondition();
        this.elements.advancedError.classList.add('hidden');
        this.elements.advancedModal.classList.add('active');
        document.body.classList.add('modal-open');
    };

    CommonFilterPanel.prototype.closeAdvanced = function () {
        if (!this.elements.advancedModal) return;
        this.elements.advancedModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    };

    CommonFilterPanel.prototype.addAdvancedCondition = function () {
        var firstField = this.advancedFields[0];
        if (!firstField) return;
        this.advancedConditionId += 1;
        this.advancedConditions.push({
            id: this.advancedConditionId,
            logic: this.advancedConditions.length ? 'AND' : '',
            field: firstField.key,
            operator: 'eq',
            value: ''
        });
        this.renderAdvancedConditions();
    };

    CommonFilterPanel.prototype.advancedField = function (key) {
        return this.advancedFields.find(function (field) { return field.key === key; }) || this.advancedFields[0];
    };

    CommonFilterPanel.prototype.advancedOperators = function (field) {
        var numeric = field && field.type === 'numeric';
        var common = [
            { value: 'eq', label: localeText(this.config, 'equals', 'equals') },
            { value: 'neq', label: localeText(this.config, 'notEquals', 'does not equal') }
        ];
        if (numeric) {
            common = common.concat([
                { value: 'gt', label: localeText(this.config, 'greaterThan', 'is greater than') },
                { value: 'gte', label: localeText(this.config, 'greaterThanOrEqual', 'is at least') },
                { value: 'lt', label: localeText(this.config, 'lessThan', 'is less than') },
                { value: 'lte', label: localeText(this.config, 'lessThanOrEqual', 'is at most') }
            ]);
        } else {
            common = common.concat([
                { value: 'contains', label: localeText(this.config, 'contains', 'contains') },
                { value: 'not_contains', label: localeText(this.config, 'notContains', 'does not contain') },
                { value: 'starts', label: localeText(this.config, 'startsWith', 'starts with') },
                { value: 'ends', label: localeText(this.config, 'endsWith', 'ends with') }
            ]);
        }
        return common.concat([
            { value: 'is_null', label: localeText(this.config, 'isEmpty', 'is empty') },
            { value: 'is_not_null', label: localeText(this.config, 'isNotEmpty', 'is not empty') }
        ]);
    };

    CommonFilterPanel.prototype.advancedValues = function (field) {
        var self = this;
        var records = this.advancedBaseRecords.length ? this.advancedBaseRecords : this.currentRecords;
        var seen = {};
        records.forEach(function (record) {
            var value = self.fieldValue(record, field);
            if (isMissingValue(value, field)) return;
            seen[String(value)] = value;
        });
        return Object.keys(seen).map(function (key) { return seen[key]; }).sort(function (left, right) {
            return String(left).localeCompare(String(right), self.config.locale || undefined, { numeric: true });
        });
    };

    CommonFilterPanel.prototype.renderAdvancedConditions = function () {
        var self = this;
        var container = this.elements.advancedConditions;
        if (!container) return;
        clear(container);

        this.advancedConditions.forEach(function (condition, index) {
            var field = self.advancedField(condition.field);
            var row = makeElement('div', 'query-condition-row');
            row.dataset.id = String(condition.id);

            var logicWrap = makeElement('div', 'condition-logic');
            if (index === 0) {
                var where = makeElement('span', 'condition-where');
                where.textContent = localeText(self.config, 'where', 'Where');
                logicWrap.appendChild(where);
            } else {
                var logic = makeElement('select', 'common-query-select');
                [['AND', localeText(self.config, 'and', 'AND')], ['OR', localeText(self.config, 'or', 'OR')]].forEach(function (entry) {
                    var option = makeElement('option');
                    option.value = entry[0];
                    option.textContent = entry[1];
                    option.selected = condition.logic === entry[0];
                    logic.appendChild(option);
                });
                logic.addEventListener('change', function () {
                    condition.logic = logic.value;
                    self.updateAdvancedPreview();
                });
                logicWrap.appendChild(logic);
            }

            var fieldWrap = makeElement('div', 'condition-field');
            var fieldSelect = makeElement('select', 'common-query-select');
            self.advancedFields.forEach(function (candidate) {
                var option = makeElement('option');
                option.value = candidate.key;
                option.textContent = candidate.unit ? candidate.label + ' (' + candidate.unit + ')' : candidate.label;
                option.selected = condition.field === candidate.key;
                fieldSelect.appendChild(option);
            });
            fieldSelect.addEventListener('change', function () {
                condition.field = fieldSelect.value;
                condition.operator = 'eq';
                condition.value = '';
                self.renderAdvancedConditions();
            });
            fieldWrap.appendChild(fieldSelect);

            var operatorWrap = makeElement('div', 'condition-operator');
            var operatorSelect = makeElement('select', 'common-query-select');
            self.advancedOperators(field).forEach(function (operator) {
                var option = makeElement('option');
                option.value = operator.value;
                option.textContent = operator.label;
                option.selected = condition.operator === operator.value;
                operatorSelect.appendChild(option);
            });
            operatorSelect.addEventListener('change', function () {
                condition.operator = operatorSelect.value;
                if (condition.operator === 'is_null' || condition.operator === 'is_not_null') condition.value = '';
                self.renderAdvancedConditions();
            });
            operatorWrap.appendChild(operatorSelect);

            var valueWrap = makeElement('div', 'condition-value');
            if (condition.operator !== 'is_null' && condition.operator !== 'is_not_null') {
                if (field && field.type === 'numeric') {
                    var input = makeElement('input', 'common-query-input');
                    input.type = 'number';
                    input.step = 'any';
                    input.placeholder = localeText(self.config, 'enterValue', 'Enter value…');
                    input.value = condition.value;
                    input.addEventListener('input', function () {
                        condition.value = input.value;
                        self.updateAdvancedPreview();
                    });
                    valueWrap.appendChild(input);
                } else {
                    var valueSelect = makeElement('select', 'common-query-select');
                    var placeholder = makeElement('option');
                    placeholder.value = '';
                    placeholder.textContent = localeText(self.config, 'chooseValue', 'Choose value…');
                    valueSelect.appendChild(placeholder);
                    self.advancedValues(field).forEach(function (value) {
                        var option = makeElement('option');
                        option.value = String(value);
                        option.textContent = self.formatFieldValue(field, value);
                        option.selected = String(condition.value) === String(value);
                        valueSelect.appendChild(option);
                    });
                    valueSelect.addEventListener('change', function () {
                        condition.value = valueSelect.value;
                        self.updateAdvancedPreview();
                    });
                    valueWrap.appendChild(valueSelect);
                }
            }

            var remove = makeElement('button', 'condition-remove');
            remove.type = 'button';
            remove.setAttribute('aria-label', localeText(self.config, 'removeCondition', 'Remove condition'));
            remove.appendChild(makeQueryIcon('remove'));
            remove.addEventListener('click', function () {
                self.advancedConditions = self.advancedConditions.filter(function (item) { return item.id !== condition.id; });
                if (self.advancedConditions.length) self.advancedConditions[0].logic = '';
                self.renderAdvancedConditions();
            });

            row.appendChild(logicWrap);
            row.appendChild(fieldWrap);
            row.appendChild(operatorWrap);
            row.appendChild(valueWrap);
            row.appendChild(remove);
            container.appendChild(row);
        });

        this.updateAdvancedPreview();
    };

    CommonFilterPanel.prototype.validAdvancedConditions = function () {
        return this.advancedConditions.filter(function (condition) {
            return condition.operator === 'is_null' || condition.operator === 'is_not_null' || condition.value !== '';
        });
    };

    CommonFilterPanel.prototype.advancedQueryText = function () {
        var self = this;
        return this.validAdvancedConditions().map(function (condition, index) {
            var field = self.advancedField(condition.field);
            var operator = self.advancedOperators(field).find(function (item) { return item.value === condition.operator; });
            var value = condition.operator === 'is_null' || condition.operator === 'is_not_null'
                ? ''
                : ' “' + self.formatFieldValue(field, condition.value) + '”';
            return (index ? (condition.logic || 'AND') + ' ' : '') + field.label + ' ' + operator.label + value;
        }).join(' ');
    };

    CommonFilterPanel.prototype.updateAdvancedPreview = function () {
        if (!this.elements.advancedPreview) return;
        var text = this.advancedQueryText();
        this.elements.advancedPreview.textContent = text || localeText(this.config, 'noConditions', 'No complete conditions yet.');
    };

    CommonFilterPanel.prototype.matchesAdvancedCondition = function (record, condition) {
        var field = this.advancedField(condition.field);
        var raw = this.fieldValue(record, field);
        var missing = isMissingValue(raw, field);
        if (condition.operator === 'is_null') return missing;
        if (condition.operator === 'is_not_null') return !missing;
        if (missing) return false;

        if (field && field.type === 'numeric') {
            var leftNumber = Number(raw);
            var rightNumber = Number(condition.value);
            if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) return false;
            if (condition.operator === 'eq') return leftNumber === rightNumber;
            if (condition.operator === 'neq') return leftNumber !== rightNumber;
            if (condition.operator === 'gt') return leftNumber > rightNumber;
            if (condition.operator === 'gte') return leftNumber >= rightNumber;
            if (condition.operator === 'lt') return leftNumber < rightNumber;
            if (condition.operator === 'lte') return leftNumber <= rightNumber;
            return false;
        }

        var left = String(raw).toLocaleLowerCase(this.config.locale || undefined);
        var right = String(condition.value).toLocaleLowerCase(this.config.locale || undefined);
        if (condition.operator === 'eq') return left === right;
        if (condition.operator === 'neq') return left !== right;
        if (condition.operator === 'contains') return left.indexOf(right) !== -1;
        if (condition.operator === 'not_contains') return left.indexOf(right) === -1;
        if (condition.operator === 'starts') return left.indexOf(right) === 0;
        if (condition.operator === 'ends') return left.slice(-right.length) === right;
        return false;
    };

    CommonFilterPanel.prototype.applyAdvanced = function () {
        var self = this;
        var conditions = this.validAdvancedConditions();
        if (!conditions.length) {
            this.elements.advancedError.textContent = localeText(this.config, 'conditionRequired', 'Add at least one complete condition.');
            this.elements.advancedError.classList.remove('hidden');
            return;
        }

        if (!this.advancedActive) this.advancedBaseRecords = this.currentRecords.slice();
        var filtered = this.advancedBaseRecords.filter(function (record) {
            var result = null;
            conditions.forEach(function (condition) {
                var match = self.matchesAdvancedCondition(record, condition);
                result = result === null ? match : (condition.logic === 'OR' ? result || match : result && match);
            });
            return result === null ? true : result;
        });

        this.advancedActive = true;
        this.elements.advancedError.classList.add('hidden');
        this.elements.advancedActiveText.textContent = this.advancedQueryText();
        this.elements.advancedActive.classList.remove('hidden');
        if (typeof this.config.onAdvancedApply === 'function') {
            Promise.resolve(this.config.onAdvancedApply(filtered, conditions.slice())).catch(function (error) {
                console.error('Advanced query application failed', error);
            });
        }
        this.closeAdvanced();
    };

    CommonFilterPanel.prototype.resetAdvanced = function (reload) {
        var self = this;
        var wasActive = this.advancedActive;
        this.advancedConditions = [];
        this.advancedConditionId = 0;
        this.advancedBaseRecords = [];
        this.advancedActive = false;
        if (this.elements.advancedActive) this.elements.advancedActive.classList.add('hidden');
        if (this.elements.advancedError) this.elements.advancedError.classList.add('hidden');
        if (this.elements.advancedConditions) this.renderAdvancedConditions();
        if (reload && wasActive && typeof this.config.onAdvancedClear === 'function') {
            Promise.resolve(this.config.onAdvancedClear()).then(function () { self.render(); }).catch(function (error) {
                console.error('Advanced query reset failed', error);
            });
        }
    };

    CommonFilterPanel.prototype.openPicker = function () {
        if (this.elements.modalSearch) this.elements.modalSearch.value = '';
        this.populatePicker();
        if (this.elements.modal) {
            this.elements.modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
        var search = this.elements.modalSearch;
        if (search) window.setTimeout(function () { search.focus(); }, 80);
    };

    CommonFilterPanel.prototype.closePicker = function () {
        if (this.elements.modal) this.elements.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    };

    CommonFilterPanel.prototype.populatePicker = function () {
        var self = this;
        var list = this.elements.modalList;
        if (!list) return;
        clear(list);
        var term = ((this.elements.modalSearch && this.elements.modalSearch.value) || '').toLocaleLowerCase(this.config.locale || undefined).trim();
        var groups = {};
        this.fields.forEach(function (field) {
            var group = field.group || localeText(self.config, 'variables', 'Variables');
            if (!groups[group]) groups[group] = [];
            if (!term || field.label.toLocaleLowerCase(self.config.locale || undefined).indexOf(term) !== -1) {
                groups[group].push(field);
            }
        });

        Object.keys(groups).forEach(function (groupName) {
            if (!groups[groupName].length) return;
            var heading = makeElement('div', 'stats-variable-group');
            heading.textContent = groupName;
            list.appendChild(heading);
            groups[groupName].forEach(function (field) {
                var row = makeElement('button', 'filter-modal-option stats-variable-option' + (field.key === self.selectedKey ? ' selected-current' : ''));
                row.type = 'button';
                var main = makeElement('span', 'stats-variable-main');
                main.textContent = field.unit ? field.label + ' (' + field.unit + ')' : field.label;
                var type = makeElement('span', 'stats-variable-type is-' + (field.type || 'categorical'));
                type.textContent = field.type === 'numeric' ? 'numeric' : 'list';
                row.appendChild(main);
                row.appendChild(type);
                row.addEventListener('click', function () {
                    self.selectedKey = field.key;
                    self.closePicker();
                    self.render();
                });
                list.appendChild(row);
            });
        });

        if (!list.children.length) {
            var empty = makeElement('div', 'filter-modal-no-results');
            empty.textContent = localeText(this.config, 'noMatchingVariables', 'No matching variables');
            list.appendChild(empty);
        }
    };

    CommonFilterPanel.prototype.fieldValue = function (record, field) {
        return valueOf(record, field.dataField || field.key);
    };

    CommonFilterPanel.prototype.currentValue = function (field) {
        if (typeof field.getValue === 'function') return String(field.getValue() || '');
        if (typeof this.config.getValue === 'function') return String(this.config.getValue(field) || '');
        var input = document.getElementById(field.inputId || (field.key + '-filter'));
        return input && input.value !== undefined ? String(input.value) : '';
    };

    CommonFilterPanel.prototype.formatFieldValue = function (field, value) {
        if (typeof field.formatValue === 'function') return field.formatValue(value);
        if (field.valueLabels && Object.prototype.hasOwnProperty.call(field.valueLabels, String(value))) {
            return field.valueLabels[String(value)];
        }
        return String(value);
    };

    CommonFilterPanel.prototype.getOptions = function (field) {
        var values = [];
        if (typeof this.config.getOptions === 'function') {
            values = this.config.getOptions(field) || [];
        }
        if (!values.length) {
            var input = document.getElementById(field.inputId || (field.key + '-filter'));
            if (input && input.options) {
                values = Array.prototype.slice.call(input.options).map(function (option) { return option.value; }).filter(Boolean);
            }
        }
        return values;
    };

    CommonFilterPanel.prototype.render = function () {
        var self = this;
        if (!this.elements.content) return;
        var field = this.fields.find(function (item) { return item.key === self.selectedKey; }) || this.fields[0];
        if (!field) return;
        if (this.elements.pickerValue) {
            this.elements.pickerValue.textContent = field.unit ? field.label + ' (' + field.unit + ')' : field.label;
        }
        this.renderActiveList();
        clear(this.elements.content);

        var records = this.allRecords.length ? this.allRecords : this.currentRecords;
        var counts = {};
        records.forEach(function (record) {
            var raw = self.fieldValue(record, field);
            if (raw === null || raw === undefined || raw === '') return;
            if ((field.type === 'boolean' || field.key === 'sevenWonder') && raw !== true && raw !== 'true') return;
            var key = String(raw);
            counts[key] = (counts[key] || 0) + recordWeight(record, self.config);
        });
        this.getOptions(field).forEach(function (value) {
            var key = String(value);
            if (!Object.prototype.hasOwnProperty.call(counts, key)) counts[key] = 0;
        });

        var values = Object.keys(counts);
        var current = this.currentValue(field);
        values.sort(function (left, right) {
            if (left === current) return -1;
            if (right === current) return 1;
            if (field.sort === 'desc') return right.localeCompare(left, self.config.locale || undefined, { numeric: true });
            if (counts[left] !== counts[right]) return counts[right] - counts[left];
            return left.localeCompare(right, self.config.locale || undefined, { numeric: true });
        });

        if (!values.length) {
            var loading = makeElement('div', 'fbc-empty');
            loading.textContent = localeText(this.config, 'loadingData', 'Loading data…');
            this.elements.content.appendChild(loading);
            return;
        }

        var wrap = makeElement('div', 'fbc-list');
        var rows = makeElement('div', 'fbc-list-rows');
        var search = makeElement('input', 'fbc-list-search');
        var searchLabel = localeText(this.config, 'searchValues', 'Search') + ' ' + field.label.toLocaleLowerCase(this.config.locale || undefined);
        search.type = 'search';
        search.autocomplete = 'off';
        search.placeholder = searchLabel + '…';
        search.setAttribute('aria-label', searchLabel);
        search.value = this.searchTerms[field.key] || '';
        wrap.appendChild(search);
        wrap.appendChild(rows);
        this.elements.content.appendChild(wrap);

        function drawRows() {
            var term = search ? search.value.toLocaleLowerCase(self.config.locale || undefined).trim() : '';
            self.searchTerms[field.key] = term;
            clear(rows);
            var shown = values.filter(function (value) {
                return !term || self.formatFieldValue(field, value).toLocaleLowerCase(self.config.locale || undefined).indexOf(term) !== -1;
            });
            shown.forEach(function (value) {
                var row = makeElement('button', 'fbc-list-row' + (value === self.currentValue(field) ? ' is-active' : ''));
                row.type = 'button';
                row.title = self.formatFieldValue(field, value);
                var label = makeElement('span', 'fbc-list-label');
                label.textContent = self.formatFieldValue(field, value);
                var count = makeElement('span', 'fbc-list-count');
                count.textContent = counts[value].toLocaleString(self.config.locale || undefined);
                var tick = makeElement('span', 'fbc-list-tick');
                tick.setAttribute('aria-hidden', 'true');
                tick.textContent = value === self.currentValue(field) ? '✓' : '';
                row.appendChild(label);
                row.appendChild(count);
                row.appendChild(tick);
                row.addEventListener('click', function () { self.applyValue(field, value); });
                rows.appendChild(row);
            });
            if (!shown.length) {
                var noMatches = makeElement('div', 'fbc-list-empty');
                noMatches.textContent = localeText(self.config, 'noMatches', 'No matches.');
                rows.appendChild(noMatches);
            }
        }
        if (search) search.addEventListener('input', drawRows);
        drawRows();
    };

    CommonFilterPanel.prototype.applyValue = function (field, value) {
        var self = this;
        var current = this.currentValue(field);
        var next = current === String(value) ? '' : String(value);
        var input = document.getElementById(field.inputId || (field.key + '-filter'));
        if (input) input.value = next;
        this.render();
        if (typeof this.config.onApply === 'function') {
            Promise.resolve(this.config.onApply(field, next)).then(function () { self.render(); }).catch(function (error) {
                console.error('Common filter application failed', error);
            });
        }
    };

    CommonFilterPanel.prototype.renderActiveList = function () {
        var self = this;
        if (!this.elements.activeList) return;
        clear(this.elements.activeList);
        var active = this.fields.map(function (field) {
            return { field: field, value: self.currentValue(field) };
        }).filter(function (item) { return item.value !== ''; });
        this.elements.activeSection.classList.toggle('hidden', active.length === 0);
        active.forEach(function (item) {
            var chip = makeElement('span', 'fbc-chip');
            var text = makeElement('button', 'fbc-chip-text');
            text.type = 'button';
            text.textContent = item.field.label + ': ' + self.formatFieldValue(item.field, item.value);
            text.addEventListener('click', function () {
                self.selectedKey = item.field.key;
                self.render();
            });
            var remove = makeElement('button', 'fbc-chip-x');
            remove.type = 'button';
            remove.setAttribute('aria-label', localeText(self.config, 'clear', 'Clear') + ' ' + item.field.label);
            remove.textContent = '×';
            remove.addEventListener('click', function () { self.applyValue(item.field, item.value); });
            chip.appendChild(text);
            chip.appendChild(remove);
            self.elements.activeList.appendChild(chip);
        });
    };

    CommonFilterPanel.prototype.setRecords = function (records) {
        this.currentRecords = Array.isArray(records) ? records.slice() : [];
        if (!this.allRecords.length || this.currentRecords.length > this.allRecords.length) {
            this.allRecords = this.currentRecords.slice();
        }
        this.render();
    };

    function CommonStatisticsPanel(config) {
        this.config = config || {};
        this.fields = this.config.fields || [];
        this.selectedKey = this.fields.length ? this.fields[0].key : null;
        this.records = [];
        this.elements = {};
    }

    CommonStatisticsPanel.prototype.init = function () {
        var tab = document.getElementById(this.config.containerId || 'stats-tab') || document.getElementById('statistics-tab');
        if (!tab || !this.fields.length || tab.querySelector('#stats-field-btn')) return;
        this.buildShell(tab);
        this.bindEvents();
        this.populatePicker();
        this.render();
    };

    CommonStatisticsPanel.prototype.buildShell = function (tab) {
        this.classicLayout = tab.dataset.statisticsLayout === 'classic';
        var legacy = makeElement('div', 'nkua-legacy-statistics');
        legacy.hidden = true;
        while (tab.firstChild) legacy.appendChild(tab.firstChild);

        var panel = makeElement('div', 'statistics-panel common-statistics-panel');
        var hint = makeElement('p', 'stats-hint stats-hint-top');
        hint.textContent = localeText(this.config, 'statisticsHint', 'Filter changes apply to statistics; reset filters to view the full dataset. Hover bars for exact counts; select a bar to list its records.');
        var label = makeElement('label', 'search-label');
        label.setAttribute('for', 'stats-field-btn');
        label.textContent = localeText(this.config, 'variable', 'Variable:');
        var fieldGroup = makeElement('div', 'filter-group stats-field-group');
        var fieldButton = makeElement('button', 'filter-selector has-value', 'stats-field-btn');
        fieldButton.type = 'button';
        fieldButton.setAttribute('aria-haspopup', 'dialog');
        fieldButton.setAttribute('aria-controls', 'stats-variable-modal');
        var fieldValue = makeElement('span', 'filter-selector-value', 'stats-field-btn-value');
        var typeBadge = makeElement('span', 'stats-type-badge', 'stats-type-badge');
        typeBadge.setAttribute('aria-hidden', 'true');
        fieldButton.appendChild(fieldValue);
        fieldButton.appendChild(typeBadge);
        fieldButton.appendChild(makeSvgChevron('filter-selector-arrow'));
        fieldGroup.appendChild(fieldButton);

        var fieldContext = makeElement('div', 'stats-field-context');
        var description = makeElement('p', 'stats-variable-description', 'stats-variable-description');
        var coverage = makeElement('p', 'stats-coverage-note', 'stats-coverage-note');
        coverage.setAttribute('aria-live', 'polite');
        fieldContext.appendChild(description);
        fieldContext.appendChild(coverage);

        var figure = makeElement('figure', 'stats-figure');
        var caption = makeElement('figcaption', 'stats-figcaption', 'stats-figure-caption');
        var figureNumber = makeElement('span', 'stats-fig-num');
        figureNumber.textContent = localeText(this.config, 'figure', 'Fig.');
        var figureTitle = makeElement('span', 'stats-figure-title', 'stats-figure-title');
        caption.appendChild(figureNumber);
        caption.appendChild(figureTitle);
        var chart = makeElement('div', 'stats-chart-wrap', 'stats-chart-wrap');
        chart.setAttribute('aria-live', 'polite');
        var axis = makeElement('div', 'stats-axis-label', 'stats-axis-label');
        figure.appendChild(caption);
        figure.appendChild(chart);
        figure.appendChild(axis);

        var summaryHead = makeElement('div', 'stats-summary-head');
        var summaryLabel = makeElement('span', 'stats-summary-eyebrow');
        summaryLabel.textContent = localeText(this.config, 'summaryStatistics', 'Summary statistics');
        var glossaryButton = makeElement('button', 'stats-glossary-btn', 'stats-glossary-btn');
        glossaryButton.type = 'button';
        glossaryButton.setAttribute('aria-label', localeText(this.config, 'statisticsGuide', 'What do these statistics mean?'));
        if (this.classicLayout) {
            var infoIcon = svgElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'aria-hidden': 'true' });
            infoIcon.appendChild(svgElement('circle', { cx: 12, cy: 12, r: 10 }));
            infoIcon.appendChild(svgElement('line', { x1: 12, y1: 16, x2: 12, y2: 12 }));
            infoIcon.appendChild(svgElement('circle', { cx: 12, cy: 8, r: 0.5, fill: 'currentColor' }));
            glossaryButton.appendChild(infoIcon);
        }
        var glossaryLabel = makeElement('span');
        glossaryLabel.textContent = localeText(this.config, 'whatTheseMean', 'What do these mean?');
        glossaryButton.appendChild(glossaryLabel);
        summaryHead.appendChild(summaryLabel);
        summaryHead.appendChild(glossaryButton);
        var summary = makeElement('div', 'stats-summary', 'stats-summary');
        summary.setAttribute('aria-live', 'polite');

        panel.appendChild(hint);
        panel.appendChild(label);
        panel.appendChild(fieldGroup);
        if (!this.classicLayout) panel.appendChild(fieldContext);
        panel.appendChild(figure);
        panel.appendChild(summaryHead);
        panel.appendChild(summary);
        tab.appendChild(panel);
        tab.appendChild(legacy);
        tab.dataset.commonStatistics = 'true';

        var pickerModal = this.buildPickerModal();
        var glossaryModal = this.buildGlossaryModal();
        var binModal = this.buildBinModal();
        var variableHeading;
        if (this.classicLayout) {
            variableHeading = makeElement('h4', 'stats-glossary-section');
            fieldContext.classList.add('stats-glossary-selected-variable');
            description.classList.add('stats-glossary-lead');
            fieldContext.insertBefore(variableHeading, description);
            var glossaryBody = glossaryModal.modal.querySelector('.modal-body');
            glossaryBody.insertBefore(fieldContext, glossaryBody.firstElementChild.nextSibling);
        }
        document.body.appendChild(pickerModal.modal);
        document.body.appendChild(glossaryModal.modal);
        document.body.appendChild(binModal.modal);

        this.elements = {
            tab: tab,
            fieldButton: fieldButton,
            fieldValue: fieldValue,
            typeBadge: typeBadge,
            description: description,
            coverage: coverage,
            variableHeading: variableHeading,
            figureTitle: figureTitle,
            pickerModal: pickerModal.modal,
            pickerClose: pickerModal.close,
            pickerSearch: pickerModal.search,
            pickerList: pickerModal.list,
            glossaryButton: glossaryButton,
            glossaryModal: glossaryModal.modal,
            glossaryClose: glossaryModal.close,
            binModal: binModal.modal,
            binClose: binModal.close,
            binTitle: binModal.title,
            binSummary: binModal.summary,
            binList: binModal.list
        };
    };

    CommonStatisticsPanel.prototype.buildPickerModal = function () {
        var modal = makeElement('div', 'modal filter-selection-modal stats-variable-modal', 'stats-variable-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'stats-variable-modal-title');
        modal.setAttribute('aria-modal', 'true');
        var content = makeElement('div', 'modal-content' + (this.classicLayout ? ' filter-selection-modal-content' : ''));
        var header = makeElement('div', 'modal-header');
        var title = makeElement('h3', '', 'stats-variable-modal-title');
        title.textContent = localeText(this.config, 'chooseStatistic', 'Choose a statistics variable');
        var closeButton = makeElement('button', 'modal-close', 'close-stats-variable');
        closeButton.type = 'button';
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', localeText(this.config, 'close', 'Close'));
        var body = makeElement('div', 'modal-body');
        var search = makeElement('input', 'filter-modal-search-input', 'stats-variable-search-input');
        search.type = 'search';
        search.autocomplete = 'off';
        search.placeholder = localeText(this.config, 'searchVariables', 'Search variables…');
        var list = makeElement('div', 'filter-modal-list stats-variable-list', 'stats-variable-list');
        header.appendChild(title);
        header.appendChild(closeButton);
        if (this.classicLayout) {
            var searchGroup = makeElement('div', 'filter-modal-search');
            searchGroup.appendChild(search);
            body.appendChild(searchGroup);
        } else body.appendChild(search);
        body.appendChild(list);
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        return { modal: modal, close: closeButton, search: search, list: list };
    };

    CommonStatisticsPanel.prototype.buildGlossaryModal = function () {
        var modal = makeElement('div', 'modal stats-glossary-modal', 'stats-glossary-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'stats-glossary-title');
        modal.setAttribute('aria-modal', 'true');
        var content = makeElement('div', 'modal-content' + (this.classicLayout ? ' stats-glossary-content' : ''));
        var header = makeElement('div', 'modal-header');
        var title = makeElement('h3', '', 'stats-glossary-title');
        title.textContent = localeText(this.config, 'statisticsGuide', this.classicLayout ? 'Statistics — quick reference' : 'Reading the statistics');
        var closeButton = makeElement('button', 'modal-close', 'close-stats-glossary');
        closeButton.type = 'button';
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', localeText(this.config, 'close', 'Close'));
        var body = makeElement('div', 'modal-body stats-glossary-body');
        var copy = makeElement('p', 'stats-glossary-lead');
        copy.textContent = localeText(this.config, 'statisticsGuideText', 'All statistics use the records currently visible after filtering. Records without a usable value for the selected variable are excluded from its chart and sample size.');

        function appendSection(label) {
            var section = makeElement('h4', 'stats-glossary-section');
            section.textContent = label;
            body.appendChild(section);
        }

        function appendTable(headers, rows, className) {
            var table = makeElement('table', 'stats-glossary-table' + (className ? ' ' + className : ''));
            var head = document.createElement('thead');
            var headRow = document.createElement('tr');
            headers.forEach(function (heading) {
                var cell = document.createElement('th');
                cell.textContent = heading;
                headRow.appendChild(cell);
            });
            head.appendChild(headRow);
            var tableBody = document.createElement('tbody');
            rows.forEach(function (values) {
                var row = document.createElement('tr');
                values.forEach(function (value) {
                    var cell = document.createElement('td');
                    cell.textContent = value;
                    row.appendChild(cell);
                });
                tableBody.appendChild(row);
            });
            table.appendChild(head);
            table.appendChild(tableBody);
            body.appendChild(table);
        }

        header.appendChild(title);
        header.appendChild(closeButton);
        body.appendChild(copy);

        appendSection(localeText(this.config, 'glossaryPanelTerms', 'How to read the panel'));
        var termRows = [
            [localeText(this.config, 'visibleRecords', 'Visible records'), localeText(this.config, 'visibleRecordsDefinition', 'All records remaining after the active map filters.')],
            ['n', localeText(this.config, 'sampleSizeDefinition', 'Records that contain a usable value for the selected variable.')],
            [localeText(this.config, 'uniqueValues', 'Unique values'), localeText(this.config, 'uniqueValuesDefinition', 'Number of distinct categories represented in n.')],
            [localeText(this.config, 'mode', 'Mode'), localeText(this.config, 'modeDefinition', 'Most frequent category, followed by its count and share of n.')]
        ];
        if (this.fields.some(function (field) { return field.type === 'numeric'; })) {
            termRows.push(
                [localeText(this.config, 'mean', 'Mean'), localeText(this.config, 'meanDefinition', 'Arithmetic average: the sum of the values divided by n.')],
                [localeText(this.config, 'median', 'Median'), localeText(this.config, 'medianDefinition', 'Middle value: half of the observations fall below it and half above.')],
                [localeText(this.config, 'standardDeviation', 'Std. dev.'), localeText(this.config, 'standardDeviationDefinition', 'Typical spread of observations around the mean.')],
                [localeText(this.config, 'minimumMaximum', 'Min / max'), localeText(this.config, 'minimumMaximumDefinition', 'Smallest and largest observed values.')],
                ['Q1 / Q3', localeText(this.config, 'quartilesDefinition', '25th and 75th percentiles; the middle half of values lies between them.')],
                ['IQR', localeText(this.config, 'iqrDefinition', 'Interquartile range: Q3 minus Q1.')],
                ['g₁', localeText(this.config, 'skewnessDefinition', 'Skewness: asymmetry of the distribution. A strong positive value indicates a long right tail.')],
                [localeText(this.config, 'logScale', 'Log scale'), localeText(this.config, 'logScaleDefinition', 'Used automatically for strongly right-skewed, strictly positive variables so both small and large values remain readable. The badge below the chart always identifies it.')]
            );
        }
        appendTable(
            [localeText(this.config, 'glossaryTerm', 'Term'), localeText(this.config, 'glossaryMeaning', 'Meaning')],
            termRows,
            'common-stats-terms-table'
        );

        appendSection(localeText(this.config, 'glossaryVariables', 'Variables in this atlas'));
        appendTable(
            [localeText(this.config, 'glossaryVariable', 'Variable'), localeText(this.config, 'glossaryType', 'Type'), localeText(this.config, 'glossaryMeaning', 'Meaning')],
            this.fields.map(function (field) {
                return [
                    field.unit ? field.label + ' (' + field.unit + ')' : field.label,
                    field.type === 'numeric'
                        ? localeText(this.config, 'numericType', 'numeric')
                        : localeText(this.config, 'categoricalType', 'categorical'),
                    field.description || localeText(this.config, 'noVariableDefinition', 'Definition follows the source catalogue.')
                ];
            }, this),
            'common-stats-variables-table'
        );

        var codeRows = [];
        this.fields.forEach(function (field) {
            (field.glossary || []).forEach(function (entry) {
                codeRows.push([field.label, entry.term, entry.meaning]);
            });
        });
        if (codeRows.length) {
            appendSection(localeText(this.config, 'glossaryCodes', 'Codes and specialist terms'));
            appendTable(
                [localeText(this.config, 'glossaryVariable', 'Variable'), localeText(this.config, 'glossaryCode', 'Code'), localeText(this.config, 'glossaryMeaning', 'Meaning')],
                codeRows,
                'common-stats-codes-table'
            );
        }
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        return { modal: modal, close: closeButton };
    };

    CommonStatisticsPanel.prototype.buildBinModal = function () {
        var modal = makeElement('div', 'modal filter-selection-modal stats-bin-modal', 'stats-bin-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'stats-bin-modal-title');
        modal.setAttribute('aria-modal', 'true');
        var content = makeElement('div', 'modal-content filter-selection-modal-content');
        var header = makeElement('div', 'modal-header');
        var title = makeElement('h3', '', 'stats-bin-modal-title');
        title.textContent = localeText(this.config, 'recordsInSelection', 'Records in selection');
        var closeButton = makeElement('button', 'modal-close', 'close-stats-bin');
        closeButton.type = 'button';
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', localeText(this.config, 'close', 'Close'));
        var body = makeElement('div', 'modal-body');
        var summary = makeElement('div', 'stats-bin-summary', 'stats-bin-summary');
        summary.setAttribute('aria-live', 'polite');
        var list = makeElement('div', 'filter-modal-list stats-bin-list', 'stats-bin-list');
        header.appendChild(title);
        header.appendChild(closeButton);
        body.appendChild(summary);
        body.appendChild(list);
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        return { modal: modal, close: closeButton, title: title, summary: summary, list: list };
    };

    CommonStatisticsPanel.prototype.bindEvents = function () {
        var self = this;
        this.elements.fieldButton.addEventListener('click', function () { self.openPicker(); });
        this.elements.pickerClose.addEventListener('click', function () { self.closeModal(self.elements.pickerModal); });
        this.elements.pickerSearch.addEventListener('input', function () { self.populatePicker(); });
        this.elements.pickerModal.addEventListener('click', function (event) {
            if (event.target === self.elements.pickerModal) self.closeModal(self.elements.pickerModal);
        });
        this.elements.glossaryButton.addEventListener('click', function () { self.openModal(self.elements.glossaryModal); });
        this.elements.glossaryClose.addEventListener('click', function () { self.closeModal(self.elements.glossaryModal); });
        this.elements.glossaryModal.addEventListener('click', function (event) {
            if (event.target === self.elements.glossaryModal) self.closeModal(self.elements.glossaryModal);
        });
        this.elements.binClose.addEventListener('click', function () { self.closeModal(self.elements.binModal); });
        this.elements.binModal.addEventListener('click', function (event) {
            if (event.target === self.elements.binModal) self.closeModal(self.elements.binModal);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            self.closeModal(self.elements.pickerModal);
            self.closeModal(self.elements.glossaryModal);
            self.closeModal(self.elements.binModal);
        });
    };

    CommonStatisticsPanel.prototype.openModal = function (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    };

    CommonStatisticsPanel.prototype.closeModal = function (modal) {
        modal.classList.remove('active');
        removeStatsTooltip();
        if (!document.querySelector('.modal.active')) document.body.classList.remove('modal-open');
    };

    CommonStatisticsPanel.prototype.openPicker = function () {
        this.elements.pickerSearch.value = '';
        this.populatePicker();
        this.openModal(this.elements.pickerModal);
        var search = this.elements.pickerSearch;
        window.setTimeout(function () { search.focus(); }, 80);
    };

    CommonStatisticsPanel.prototype.populatePicker = function () {
        var self = this;
        var list = this.elements.pickerList;
        if (!list) return;
        clear(list);
        var term = (this.elements.pickerSearch.value || '').toLocaleLowerCase(this.config.locale || undefined).trim();
        var groups = {};
        this.fields.forEach(function (field) {
            if (term && field.label.toLocaleLowerCase(self.config.locale || undefined).indexOf(term) === -1) return;
            var group = field.group || localeText(self.config, 'variables', 'Variables');
            if (!groups[group]) groups[group] = [];
            groups[group].push(field);
        });
        Object.keys(groups).forEach(function (groupName) {
            var heading = makeElement('div', 'stats-variable-group');
            heading.textContent = groupName;
            list.appendChild(heading);
            groups[groupName].forEach(function (field) {
                var row = makeElement('button', 'filter-modal-option stats-variable-option' + (field.key === self.selectedKey ? ' selected-current' : ''));
                row.type = 'button';
                var main = makeElement('span', 'stats-variable-main');
                main.textContent = field.unit ? field.label + ' (' + field.unit + ')' : field.label;
                var type = makeElement('span', 'stats-variable-type is-' + (field.type || 'categorical'));
                type.textContent = field.type === 'numeric'
                    ? localeText(self.config, 'numericType', 'numeric')
                    : localeText(self.config, 'categoricalType', 'categorical');
                row.appendChild(main);
                row.appendChild(type);
                row.addEventListener('click', function () {
                    self.selectedKey = field.key;
                    self.closeModal(self.elements.pickerModal);
                    self.render();
                });
                list.appendChild(row);
            });
        });
    };

    CommonStatisticsPanel.prototype.recordLabel = function (record) {
        if (typeof this.config.recordLabel === 'function') return displayValue(this.config.recordLabel(record), this.config.locale);
        return displayValue(
            record.name_en || record.name_gr || record.site || record.flood_event_name ||
            record.location_name || record.municipality || record.id,
            this.config.locale
        );
    };

    CommonStatisticsPanel.prototype.recordMeta = function (record) {
        if (typeof this.config.recordMeta === 'function') return displayValue(this.config.recordMeta(record), this.config.locale);
        var fields = Array.isArray(this.config.recordMeta) ? this.config.recordMeta : [
            'location_name', 'country', 'ocean_sea', 'prefecture_en', 'island_en',
            'region_name', 'regional_unit', 'municipality', 'year', 'date_of_commencement'
        ];
        return fields.map(function (field) { return record[field]; }).filter(function (value) {
            return value !== null && value !== undefined && value !== '';
        }).join(' · ');
    };

    CommonStatisticsPanel.prototype.openBinModal = function (field, selection) {
        if (typeof this.config.onGroupSelect === 'function') {
            this.config.onGroupSelect(field, selection, this);
            return;
        }
        var self = this;
        var records = (selection.records || []).slice().sort(function (left, right) {
            if (typeof self.config.recordSort === 'function') return self.config.recordSort(left, right);
            return self.recordLabel(left).localeCompare(self.recordLabel(right), self.config.locale || undefined, { numeric: true });
        });
        this.elements.binTitle.textContent = field.label + ': ' + selection.label + (field.unit && selection.numeric ? ' ' + field.unit : '');
        clear(this.elements.binSummary);
        var count = makeElement('span', 'stats-bin-summary-count');
        count.textContent = formatTemplate(
            localeText(this.config, 'selectionCount', '{count} records'),
            { count: records.length.toLocaleString(this.config.locale || undefined) }
        );
        this.elements.binSummary.appendChild(count);
        clear(this.elements.binList);

        records.forEach(function (record) {
            var actionable = typeof self.config.onRecordSelect === 'function';
            var row = makeElement(actionable ? 'button' : 'div', 'filter-modal-option stats-bin-option');
            if (actionable) row.type = 'button';
            var main = makeElement('span', 'stats-bin-main');
            var name = makeElement('span', 'stats-bin-name');
            name.textContent = self.recordLabel(record);
            main.appendChild(name);
            var metaText = self.recordMeta(record);
            if (metaText) {
                var meta = makeElement('span', 'stats-bin-sub');
                meta.textContent = metaText;
                main.appendChild(meta);
            }
            var value = valueOf(record, field.dataField || field.key);
            var formatted = makeElement('span', 'stats-bin-value');
            formatted.textContent = field.type === 'numeric' && Number.isFinite(Number(value))
                ? formatNumber(Number(value), self.config.locale) + (field.unit ? ' ' + field.unit : '')
                : fieldDisplayValue(field, value, self.config.locale);
            row.appendChild(main);
            row.appendChild(formatted);
            if (actionable) {
                row.addEventListener('click', function () {
                    self.closeModal(self.elements.binModal);
                    self.config.onRecordSelect(record);
                });
            }
            self.elements.binList.appendChild(row);
        });
        this.openModal(this.elements.binModal);
    };

    CommonStatisticsPanel.prototype.summaryRows = function (field, values) {
        var self = this;
        var valid = values.filter(function (value) { return !isMissingValue(value, field); });
        var validRecords = this.records.filter(function (record) {
            var value = valueOf(record, field.dataField || field.key);
            return !isMissingValue(value, field) && (field.type !== 'numeric' || Number.isFinite(Number(value)));
        });
        var validCount = recordCount(validRecords, this.config);
        if (field.type !== 'numeric') {
            var counts = {};
            validRecords.forEach(function (record) {
                var value = valueOf(record, field.dataField || field.key);
                var key = String(value);
                counts[key] = (counts[key] || 0) + recordWeight(record, self.config);
            });
            var ranked = Object.keys(counts).sort(function (left, right) {
                return counts[right] - counts[left] || left.localeCompare(right);
            });
            var rows = [
                { label: 'n', value: validCount },
                { label: localeText(this.config, 'uniqueValues', 'Unique values'), value: ranked.length }
            ];
            if (ranked.length) {
                var mode = ranked[0];
                var share = new Intl.NumberFormat(this.config.locale || undefined, {
                    style: 'percent',
                    maximumFractionDigits: 1
                }).format(counts[mode] / validCount);
                rows.push({
                    label: localeText(this.config, 'mode', 'Mode'),
                    value: fieldDisplayValue(field, mode, this.config.locale) + ' · ' + counts[mode].toLocaleString(this.config.locale || undefined) + ' (' + share + ')'
                });
            }
            return rows;
        }
        var numbers = valid.map(Number).filter(function (value) { return Number.isFinite(value); });
        if (!numbers.length) return [{ label: 'n', value: 0 }];
        var stats = numericSummary(numbers, this.config.getRecordWeight ? validRecords.map(function (record) {
            return recordWeight(record, self.config);
        }) : null);
        var unit = field.unit ? ' ' + field.unit : '';
        var locale = this.config.locale;
        return [
            { label: 'n', value: stats.n },
            { label: localeText(this.config, 'mean', 'Mean'), value: formatNumber(stats.mean, locale) + unit },
            { label: localeText(this.config, 'median', 'Median'), value: formatNumber(stats.median, locale) + unit },
            { label: localeText(this.config, 'standardDeviation', 'Std. dev.'), value: formatNumber(stats.standardDeviation, locale) + unit },
            { label: localeText(this.config, 'minimum', 'Minimum'), value: formatNumber(stats.minimum, locale) + unit },
            { label: localeText(this.config, 'maximum', 'Maximum'), value: formatNumber(stats.maximum, locale) + unit },
            { label: localeText(this.config, 'range', 'Range'), value: formatNumber(stats.range, locale) + unit },
            { label: 'Q1 (25%)', value: formatNumber(stats.q1, locale) + unit },
            { label: 'Q3 (75%)', value: formatNumber(stats.q3, locale) + unit },
            { label: 'IQR', value: formatNumber(stats.iqr, locale) + unit },
            { label: localeText(this.config, 'skewness', 'Skewness'), value: formatNumber(stats.skewness, locale, 2) }
        ];
    };

    CommonStatisticsPanel.prototype.render = function () {
        var self = this;
        var revision = this.renderRevision = (this.renderRevision || 0) + 1;
        var field = this.fields.find(function (item) { return item.key === self.selectedKey; }) || this.fields[0];
        if (!this.elements.tab || !field) return;
        var supplied = typeof this.config.getRecordsForField === 'function'
            ? this.config.getRecordsForField(field, this.sourceRecords || this.records)
            : this.sourceRecords || this.records;
        if (supplied && typeof supplied.then === 'function') {
            this.elements.fieldValue.textContent = field.label + (field.unit ? ' (' + field.unit + ')' : '');
            this.elements.typeBadge.textContent = field.type;
            this.elements.typeBadge.classList.toggle('is-numeric', field.type === 'numeric');
            this.elements.typeBadge.classList.toggle('is-categorical', field.type !== 'numeric');
            this.elements.description.textContent = field.description || '';
            this.elements.description.hidden = !field.description;
            this.elements.coverage.textContent = localeText(this.config, 'loadingStatistics', 'Loading observations for this variable…');
            this.elements.tab.setAttribute('aria-busy', 'true');
            clear(this.elements.tab.querySelector('#stats-chart-wrap'));
            clear(this.elements.tab.querySelector('#stats-summary'));
            this.elements.figureTitle.textContent = '';
            this.elements.tab.querySelector('#stats-axis-label').textContent = '';
            Promise.resolve(supplied).then(function (records) {
                if (self.renderRevision !== revision) return;
                self.records = records;
                self.elements.tab.removeAttribute('aria-busy');
                self.renderRecords();
            }).catch(function () {
                if (self.renderRevision !== revision) return;
                self.elements.tab.removeAttribute('aria-busy');
                self.elements.coverage.textContent = localeText(self.config, 'statisticsLoadError', 'These observations could not be loaded.');
                var retry = makeElement('button', 'btn-secondary');
                retry.type = 'button'; retry.textContent = localeText(self.config, 'retry', 'Try again');
                retry.addEventListener('click', function () { self.render(); });
                self.elements.tab.querySelector('#stats-chart-wrap').appendChild(retry);
            });
            return;
        }
        this.elements.tab.removeAttribute('aria-busy');
        this.records = supplied || [];
        this.renderRecords();
    };

    CommonStatisticsPanel.prototype.renderRecords = function () {
        var self = this;
        if (!this.elements.tab) return;
        var field = this.fields.find(function (item) { return item.key === self.selectedKey; }) || this.fields[0];
        var values = this.records.map(function (record) { return valueOf(record, field.dataField || field.key); });
        var valid = values.filter(function (value) {
            if (isMissingValue(value, field)) return false;
            return field.type !== 'numeric' || Number.isFinite(Number(value));
        });
        var label = field.unit ? field.label + ' (' + field.unit + ')' : field.label;
        this.elements.fieldValue.textContent = label;
        if (this.elements.variableHeading) this.elements.variableHeading.textContent = label;
        this.elements.typeBadge.textContent = field.type === 'numeric'
            ? localeText(this.config, 'numericType', 'numeric')
            : localeText(this.config, 'categoricalType', 'categorical');
        this.elements.typeBadge.classList.toggle('is-numeric', field.type === 'numeric');
        this.elements.typeBadge.classList.toggle('is-categorical', field.type !== 'numeric');
        this.elements.description.textContent = field.description || '';
        this.elements.description.hidden = !field.description;
        var totalCount = recordCount(this.records, this.config);
        var usableCount = this.records.reduce(function (sum, record) {
            var value = valueOf(record, field.dataField || field.key);
            return sum + (!isMissingValue(value, field) && (field.type !== 'numeric' || Number.isFinite(Number(value)))
                ? recordWeight(record, self.config) : 0);
        }, 0);
        var percentage = totalCount ? usableCount / totalCount : 0;
        var coverageText = formatTemplate(
            localeText(this.config, 'statisticsCoverage', '{valid} of {total} visible records have a value ({percent}).'),
            {
                valid: usableCount.toLocaleString(this.config.locale || undefined),
                total: totalCount.toLocaleString(this.config.locale || undefined),
                percent: new Intl.NumberFormat(this.config.locale || undefined, { style: 'percent', maximumFractionDigits: 1 }).format(percentage)
            }
        );
        if (valid.length < this.records.length) {
            coverageText += ' ' + localeText(this.config, 'statisticsMissingNote', 'Records without a usable value are excluded from the chart.');
        }
        this.elements.coverage.textContent = coverageText;
        var figureTitle = field.type === 'numeric'
            ? localeText(this.config, 'distributionOf', 'Distribution of') + ' ' + field.label.toLocaleLowerCase(this.config.locale || undefined) + (field.unit ? ' (' + field.unit + ')' : '') + '.'
            : localeText(this.config, 'frequencyOf', 'Frequency of') + ' ' + field.label.toLocaleLowerCase(this.config.locale || undefined) + '.';
        renderStatistics({
            containerId: this.elements.tab.id,
            records: this.records,
            getRecordWeight: this.config.getRecordWeight,
            field: field.dataField || field.key,
            type: field.type === 'numeric' ? 'numeric' : 'categorical',
            figureTitle: figureTitle,
            axisLabel: label,
            locale: this.config.locale,
            maxItems: field.maxItems || 12,
            binCount: field.binCount,
            fieldConfig: field,
            otherLabel: localeText(this.config, 'otherCategory', 'Other'),
            countLabel: localeText(this.config, 'count', 'Count'),
            logScaleLabel: localeText(this.config, 'logScale', 'log scale'),
            histogramOf: localeText(this.config, 'histogramOf', 'Histogram of'),
            frequencyOf: localeText(this.config, 'frequencyOf', 'Frequency of'),
            emptyLabel: localeText(this.config, 'emptyStatistics', 'No records in the current selection.'),
            summaryRows: this.summaryRows(field, values),
            onGroupSelect: function (selection) { self.openBinModal(field, selection); }
        });
    };

    CommonStatisticsPanel.prototype.setRecords = function (records) {
        this.sourceRecords = Array.isArray(records) ? records.slice() : [];
        this.records = this.sourceRecords;
        this.render();
    };

    function CommonAtlasInterface(config) {
        this.config = config || {};
        var advancedFields = (this.config.advancedFields || [])
            .concat(this.config.filterFields || [])
            .concat((this.config.statisticsFields || []).filter(function (field) { return field.filterable !== false; }))
            .filter(function (field, index, fields) {
                return fields.findIndex(function (candidate) { return candidate.key === field.key; }) === index;
            });
        this.filterPanel = new CommonFilterPanel({
            fields: this.config.filterFields || [],
            advancedFields: advancedFields,
            locale: this.config.locale,
            text: this.config.text,
            getOptions: this.config.getOptions,
            onApply: this.config.onApply,
            onAdvancedApply: this.config.onAdvancedApply,
            onAdvancedClear: this.config.onAdvancedClear,
            enableAdvancedQuery: this.config.enableAdvancedQuery,
            getRecordWeight: this.config.getRecordWeight
        });
        this.statisticsPanel = new CommonStatisticsPanel({
            fields: this.config.statisticsFields || [],
            containerId: this.config.statisticsContainerId || 'stats-tab',
            locale: this.config.locale,
            text: this.config.text,
            recordLabel: this.config.statisticsRecordLabel,
            recordMeta: this.config.statisticsRecordMeta,
            recordSort: this.config.statisticsRecordSort,
            onRecordSelect: this.config.onStatisticsRecordSelect,
            getRecordsForField: this.config.getStatisticsRecords,
            getRecordWeight: this.config.getRecordWeight,
            onGroupSelect: this.config.onStatisticsGroupSelect
        });
    }

    CommonAtlasInterface.prototype.init = function () {
        var self = this;
        this.filterPanel.init();
        this.statisticsPanel.init();
        if (this.config.eventBus && typeof this.config.eventBus.on === 'function') {
            this.config.eventBus.on('data:loaded', function () { self.refresh(); });
            this.config.eventBus.on('filterOptions:loaded', function () { self.filterPanel.render(); });
            this.config.eventBus.on('filters:apply', function () { window.setTimeout(function () { self.filterPanel.render(); }, 0); });
            this.config.eventBus.on('stats:updated', function () { self.refresh(); });
        }
        this.refresh();
    };

    CommonAtlasInterface.prototype.refresh = function () {
        var records = typeof this.config.getRecords === 'function' ? this.config.getRecords() : [];
        this.setRecords(records || []);
    };

    CommonAtlasInterface.prototype.setRecords = function (records) {
        this.filterPanel.setRecords(records);
        this.statisticsPanel.setRecords(records);
    };

    function initialiseActiveTabState() {
        var tabs = document.querySelectorAll('.sidebar .tab-content[id$="-tab"]');
        if (!tabs.length || !document.body) return;

        function syncActiveTab() {
            var active = document.querySelector('.sidebar .tab-content.active[id$="-tab"]');
            if (!active) return;
            document.body.dataset.activeTab = active.id.replace(/-tab$/, '');
        }

        var observer = new MutationObserver(syncActiveTab);
        tabs.forEach(function (tab) {
            observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
        });
        syncActiveTab();
    }

    function initialiseVisitCounters() {
        var counters = document.querySelectorAll('[data-visit-count]');
        counters.forEach(function (counter) {
            var endpoint = counter.getAttribute('data-endpoint');
            var storageKey = counter.getAttribute('data-storage-key');
            var locale = counter.getAttribute('data-locale') || 'en';
            var unavailableText = counter.getAttribute('data-unavailable') || 'Unavailable';
            var alreadyCounted = false;

            if (!endpoint || !storageKey) return;

            try {
                alreadyCounted = window.sessionStorage.getItem(storageKey) === 'yes';
            } catch (_error) {
                alreadyCounted = false;
            }

            window.fetch(endpoint, {
                method: alreadyCounted ? 'GET' : 'POST',
                cache: 'no-store',
                headers: { Accept: 'application/json' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            }).then(function (payload) {
                var count = Number(payload.count);
                if (!Number.isFinite(count) || count < 0) throw new Error('Invalid visit count');
                counter.textContent = count.toLocaleString(locale);
                if (!alreadyCounted) {
                    try {
                        window.sessionStorage.setItem(storageKey, 'yes');
                    } catch (_error) {
                        // The aggregate counter still works when browser storage is unavailable.
                    }
                }
            }).catch(function () {
                counter.textContent = unavailableText;
            });
        });
    }

    function revealWelcomeModal(modal, closeModal) {
        if (!modal || modal.classList.contains('is-revealing')) return;

        var enterButton = modal.querySelector('#enter-webgis');
        var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var duration = reducedMotion ? 180 : 720;
        var finished = false;

        function finishReveal() {
            if (finished) return;
            finished = true;
            if (typeof closeModal === 'function') closeModal();
            else modal.classList.remove('active');
            modal.classList.remove('is-revealing');
            document.body.classList.remove('app-is-revealing');
            document.body.classList.remove('modal-open');
            if (enterButton) enterButton.disabled = false;
        }

        if (enterButton) enterButton.disabled = true;
        modal.classList.add('is-revealing');
        document.body.classList.add('app-is-revealing');
        window.setTimeout(finishReveal, duration);
    }

    function createAtlasInterface(config) {
        var atlas = new CommonAtlasInterface(config || {});
        atlas.init();
        return atlas;
    }

    window.NkuaWebGISUI = {
        renderStatistics: renderStatistics,
        setupSearch: setupSearch,
        revealWelcomeModal: revealWelcomeModal,
        createAtlasInterface: createAtlasInterface
    };

    prepareAdvancedQueryModal(document.getElementById('sql-filter-modal'), {});
    initialiseActiveTabState();
    initialiseVisitCounters();
}());
