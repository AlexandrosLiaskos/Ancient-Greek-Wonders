import { WONDERS } from './data/wonders.js';
import { filterWonders, normalizeSearchText, summarizeSurvival } from './core/catalog.js';
import { parseUrlState, serializeUrlState } from './core/url-state.js';
import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, formatResultCount, localizeRecord, t } from './i18n.js';
import { createDetailMarkup, createResultMarkup } from './ui/render.js';
import { initializeGallery } from './ui/gallery.js';
import { createWondersMap, WONDER_MAP_CATEGORIES, getWonderMapCategory } from './map/map.js';

class AncientGreekWondersApp {
  constructor() {
    this.wonders = WONDERS;
    this.state = parseUrlState(location.search, this.wonders);
    if (!this.state.language) this.state.language = 'en';

    this.currentRecords = this.wonders;
    this.mapController = null;
    this.atlasInterface = null;
    this.detailGallery = null;
    this.activeFilterField = 'status';

    this.elements = {
      app: document.getElementById('app'),
      sidebar: document.getElementById('sidebar'),
      map: document.getElementById('map'),
      languageToggle: document.getElementById('language-toggle'),
      mobileFilters: document.getElementById('mobile-filters-toggle'),
      mobileSearch: document.getElementById('mobile-search-toggle'),
      mobileStats: document.getElementById('mobile-stats-toggle'),
      mobileSidebarClose: document.getElementById('mobile-sidebar-close'),
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      
      // Welcome modal
      welcomeModal: document.getElementById('welcome-modal'),
      closeWelcome: document.getElementById('close-welcome'),
      aboutBtn: document.getElementById('about-btn'),
      headerHomeLink: document.getElementById('header-home-link'),
      
      // References modal
      referencesModal: document.getElementById('references-modal'),
      referencesBtn: document.getElementById('references-btn'),
      closeReferences: document.getElementById('close-references'),
      
      // Submit data modal
      submitDataModal: document.getElementById('submit-data-modal'),
      submitDataBtn: document.getElementById('submit-data-btn'),
      closeSubmitData: document.getElementById('close-submit-data'),
      
      // Wonder detail modal
      wonderModal: document.getElementById('wonder-modal'),
      wonderTitleblock: document.getElementById('wonder-modal-titleblock'),
      wonderDetails: document.getElementById('wonder-details'),
      closeWonderModal: document.getElementById('close-wonder-modal'),
      
      // Stats glossary modal
      statsGlossaryModal: document.getElementById('stats-glossary-modal'),
      statsGlossaryBtn: document.getElementById('stats-glossary-btn'),
      closeStatsGlossary: document.getElementById('close-stats-glossary'),
      
      // Search
      globalSearchInput: document.getElementById('global-search-input'),
      globalSearchResults: document.getElementById('global-search-results'),
      
      // Summary stats
      totalWonders: document.getElementById('total-wonders'),
      visibleWonders: document.getElementById('visible-wonders'),
      visibleCountries: document.getElementById('visible-countries'),
      visibleExtant: document.getElementById('visible-extant'),
      visibleRuins: document.getElementById('visible-ruins'),
      visibleAltered: document.getElementById('visible-altered'),
      visibleLost: document.getElementById('visible-lost'),
      visibleSeven: document.getElementById('visible-seven')
    };

    this.init();
  }

  init() {
    this.applyLanguage(this.state.language, false);
    this.initMap();
    this.initSidebarTabs();
    this.initModals();
    this.initSearch();
    this.initCommonAtlasInterface();
    this.applyFilters();
    this.initWelcomeModalAutoReveal();
  }

  initMap() {
    this.mapController = createWondersMap(this.elements.map, this.currentRecords, {
      language: this.state.language,
      onSelect: (wonderId) => this.showWonderDetails(wonderId)
    });
  }

  initSidebarTabs() {
    this.elements.tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        this.switchTab(tab);
      });
    });

    const openSidebarTab = (tab) => {
      this.switchTab(tab);
      this.elements.sidebar.classList.add('mobile-open');
      document.body.classList.add('mobile-sidebar-active');
    };

    this.elements.mobileFilters?.addEventListener('click', () => openSidebarTab('filters'));
    this.elements.mobileSearch?.addEventListener('click', () => openSidebarTab('search'));
    this.elements.mobileStats?.addEventListener('click', () => openSidebarTab('stats'));

    this.elements.mobileSidebarClose?.addEventListener('click', () => {
      this.elements.sidebar.classList.remove('mobile-open');
      document.body.classList.remove('mobile-sidebar-active');
    });
  }

  switchTab(tabName) {
    this.elements.tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    this.elements.tabContents.forEach((content) => {
      const match = content.id === `${tabName}-tab` || (tabName === 'stats' && content.id === 'stats-tab');
      content.classList.toggle('active', match);
    });
    if (document.body) {
      document.body.dataset.activeTab = tabName;
    }
  }

  initModals() {
    // Welcome modal
    const openWelcome = () => {
      this.elements.welcomeModal.classList.add('active');
      document.body.classList.add('modal-open');
    };
    const closeWelcome = () => {
      this.elements.welcomeModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    };
    this.elements.aboutBtn?.addEventListener('click', openWelcome);
    this.elements.headerHomeLink?.addEventListener('click', (e) => {
      e.preventDefault();
      openWelcome();
    });
    this.elements.closeWelcome?.addEventListener('click', closeWelcome);
    this.elements.welcomeModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.welcomeModal) closeWelcome();
    });

    // References modal
    const openRef = () => {
      this.elements.referencesModal.classList.add('active');
      document.body.classList.add('modal-open');
    };
    const closeRef = () => {
      this.elements.referencesModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    };
    this.elements.referencesBtn?.addEventListener('click', openRef);
    this.elements.closeReferences?.addEventListener('click', closeRef);
    this.elements.referencesModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.referencesModal) closeRef();
    });

    // Submit data modal
    const openSubmit = () => {
      this.elements.submitDataModal.classList.add('active');
      document.body.classList.add('modal-open');
    };
    const closeSubmit = () => {
      this.elements.submitDataModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    };
    this.elements.submitDataBtn?.addEventListener('click', openSubmit);
    this.elements.closeSubmitData?.addEventListener('click', closeSubmit);
    this.elements.submitDataModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.submitDataModal) closeSubmit();
    });

    // Wonder details modal
    this.elements.closeWonderModal?.addEventListener('click', () => {
      this.elements.wonderModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    });
    this.elements.wonderModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.wonderModal) {
        this.elements.wonderModal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    });

    // Stats glossary modal
    const openGlossary = () => {
      this.elements.statsGlossaryModal.classList.add('active');
      document.body.classList.add('modal-open');
    };
    const closeGlossary = () => {
      this.elements.statsGlossaryModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    };
    this.elements.statsGlossaryBtn?.addEventListener('click', openGlossary);
    this.elements.closeStatsGlossary?.addEventListener('click', closeGlossary);
    this.elements.statsGlossaryModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.statsGlossaryModal) closeGlossary();
    });

    // Language switcher
    this.elements.languageToggle?.addEventListener('click', () => {
      const nextLang = this.state.language === 'en' ? 'el' : 'en';
      this.applyLanguage(nextLang, true);
    });

    // Filter reset wiring
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Global keyboard listener for Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
          activeModal.classList.remove('active');
          document.body.classList.remove('modal-open');
        }
      }
    });
  }

  initWelcomeModalAutoReveal() {
    try {
      const seen = window.sessionStorage.getItem('wonders-welcome-seen-v1');
      if (!seen && this.elements.welcomeModal) {
        this.elements.welcomeModal.classList.add('active');
        document.body.classList.add('modal-open');
        window.sessionStorage.setItem('wonders-welcome-seen-v1', 'yes');
      }
    } catch (_error) {
      // Storage unavailable fallback
    }
  }

  initSearch() {
    const input = this.elements.globalSearchInput;
    if (!input) return;

    input.addEventListener('input', () => {
      this.state.query = input.value.trim();
      this.syncUrl();
      this.applyFilters();
    });
  }

  clearAllFilters() {
    this.state.status = '';
    this.state.category = '';
    this.state.country = '';
    this.state.sevenWonder = false;
    this.state.query = '';
    if (this.elements.globalSearchInput) this.elements.globalSearchInput.value = '';
    ['status', 'category', 'country', 'sevenWonder', 'seven', 'period'].forEach((k) => {
      const input = document.getElementById(`${k}-filter`);
      if (input) input.value = '';
    });
    this.syncUrl();
    this.applyFilters();
  }

  initCommonAtlasInterface() {
    if (!window.NkuaWebGISUI?.createAtlasInterface) return;

    this.atlasInterface = window.NkuaWebGISUI.createAtlasInterface({
      getRecords: () => this.currentRecords,
      getValue: (field) => {
        const key = field.key;
        if (key === 'sevenWonder') {
          return this.state.sevenWonder ? 'true' : '';
        }
        return this.state[key] ? String(this.state[key]) : '';
      },
      getOptions: (field) => {
        if (field.key === 'sevenWonder') {
          return ['true'];
        }
        const values = new Set();
        this.wonders.forEach((w) => {
          const val = w[field.dataField || field.key];
          if (val !== undefined && val !== null && val !== '') values.add(String(val));
        });
        return Array.from(values).sort();
      },
      onApply: (field, value) => {
        const key = field.key;
        if (key === 'sevenWonder') {
          this.state.sevenWonder = value === true || value === 'true' || value === '1';
        } else {
          this.state[key] = value;
        }
        this.syncUrl();
        this.applyFilters();
      },
      onAdvancedApply: (records) => {
        this.currentRecords = records;
        this.updateView();
      },
      onAdvancedClear: () => {
        this.applyFilters();
      },
      statisticsRecordLabel: (record) => {
        const item = localizeRecord(record, this.state.language);
        return item.name;
      },
      statisticsRecordMeta: (record) => {
        const item = localizeRecord(record, this.state.language);
        return [item.location, item.period, item.statusLabel].filter(Boolean).join(' · ');
      },
      onStatisticsRecordSelect: (record) => {
        this.mapController.focus(record);
        this.showWonderDetails(record.id);
      },
      filterFields: [
        {
          key: 'status',
          dataField: 'status',
          label: this.state.language === 'el' ? 'Κατάσταση' : 'Survival condition',
          group: this.state.language === 'el' ? 'Αρχαιολογία' : 'Archaeology',
          formatValue: (val) => STATUS_LABELS[val]?.[this.state.language] || val
        },
        {
          key: 'category',
          dataField: 'category',
          label: this.state.language === 'el' ? 'Τύπος μνημείου' : 'Monument typology',
          group: this.state.language === 'el' ? 'Αρχιτεκτονική' : 'Architecture',
          formatValue: (val) => CATEGORY_LABELS[val]?.[this.state.language] || val
        },
        {
          key: 'country',
          dataField: 'country',
          label: this.state.language === 'el' ? 'Σύγχρονη χώρα' : 'Modern country',
          group: this.state.language === 'el' ? 'Γεωγραφία' : 'Geography',
          formatValue: (val) => COUNTRY_LABELS[val]?.[this.state.language] || val
        },
        {
          key: 'sevenWonder',
          dataField: 'sevenWonder',
          inputId: 'seven-filter',
          label: this.state.language === 'el' ? 'Επτά Θαύματα' : 'Seven Wonders',
          group: this.state.language === 'el' ? 'Κλασικά' : 'Canonical',
          formatValue: (val) => (val === true || val === 'true' || val === '1')
            ? (this.state.language === 'el' ? 'Κανονικά Επτά Θαύματα' : 'Canonical Seven Wonders')
            : (this.state.language === 'el' ? 'Όλα τα μνημεία' : 'All monuments')
        }
      ],
      statisticsFields: [
        {
          key: 'status',
          dataField: 'status',
          label: this.state.language === 'el' ? 'Σημερινή κατάσταση' : 'Survival condition',
          type: 'categorical',
          group: 'Archaeology',
          maxItems: 10,
          description: this.state.language === 'el'
            ? 'Κατάσταση διατήρησης του μνημείου (όρθιο, ερείπια, ανασκαμμένο, ανοικοδομημένο, χαμένο).'
            : 'Preservation state of the ancient wonder according to contemporary archaeological documentation.'
        },
        {
          key: 'category',
          dataField: 'category',
          label: this.state.language === 'el' ? 'Τυπολογία' : 'Typology',
          type: 'categorical',
          group: 'Architecture',
          maxItems: 12,
          description: this.state.language === 'el'
            ? 'Αρχιτεκτονικός και λειτουργικός τύπος του μνημείου ή του χώρου.'
            : 'Architectural and functional typology of the monument or complex.'
        },
        {
          key: 'country',
          dataField: 'country',
          label: this.state.language === 'el' ? 'Σύγχρονη χώρα' : 'Country',
          type: 'categorical',
          group: 'Geography',
          maxItems: 11,
          description: this.state.language === 'el'
            ? 'Σύγχρονο κράτος στο οποίο βρίσκεται σήμερα ο αρχαιολογικός χώρος.'
            : 'Modern nation-state encompassing the ancient archaeological site.'
        }
      ]
    });
  }

  applyFilters() {
    this.currentRecords = filterWonders(this.wonders, this.state);
    this.updateView();
  }

  updateView() {
    this.mapController?.update(this.currentRecords, this.state.language);
    this.updateSearchResults();
    this.updateSummaryStats();
    if (this.atlasInterface) {
      this.atlasInterface.setRecords(this.currentRecords);
    }
  }

  updateSearchResults() {
    const list = this.elements.globalSearchResults;
    if (!list) return;

    if (!this.currentRecords.length) {
      list.innerHTML = `<div class="fbc-empty" style="padding: 1rem; text-align: center; color: var(--text-muted);">${t(this.state.language, 'noResults')}</div>`;
      return;
    }

    list.innerHTML = this.currentRecords.map((record) => createResultMarkup(record, this.state.language)).join('');

    list.querySelectorAll('.result-item').forEach((item) => {
      const wonderId = item.dataset.wonderId;
      const record = this.wonders.find((w) => w.id === wonderId);
      if (!record) return;

      item.querySelector('[data-result-action="focus"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.mapController.focus(record);
        if (window.innerWidth <= 768) {
          this.elements.sidebar.classList.remove('mobile-open');
          document.body.classList.remove('mobile-sidebar-active');
        }
      });

      item.querySelector('[data-result-action="details"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.showWonderDetails(wonderId);
      });
    });
  }

  updateSummaryStats() {
    const summary = summarizeSurvival(this.currentRecords);
    const countries = new Set(this.currentRecords.map((r) => r.country)).size;
    const sevenCount = this.currentRecords.filter((r) => r.sevenWonder).length;

    if (this.elements.totalWonders) this.elements.totalWonders.textContent = this.wonders.length;
    if (this.elements.visibleWonders) this.elements.visibleWonders.textContent = this.currentRecords.length;
    if (this.elements.visibleCountries) this.elements.visibleCountries.textContent = countries;
    if (this.elements.visibleExtant) this.elements.visibleExtant.textContent = summary.extant;
    if (this.elements.visibleRuins) this.elements.visibleRuins.textContent = summary.ruins;
    if (this.elements.visibleAltered) this.elements.visibleAltered.textContent = summary.altered;
    if (this.elements.visibleLost) this.elements.visibleLost.textContent = summary.lost;
    if (this.elements.visibleSeven) this.elements.visibleSeven.textContent = sevenCount;
  }

  showWonderDetails(wonderId) {
    const record = this.wonders.find((w) => w.id === wonderId);
    if (!record) return;

    const item = localizeRecord(record, this.state.language);
    const cat = getWonderMapCategory(record);

    this.elements.wonderTitleblock.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span class="cluster-badge" style="position: static; background: ${cat.color};">${item.statusLabel}</span>
        ${record.sevenWonder ? '<span class="badge--altered" style="font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Seven Wonders</span>' : ''}
      </div>
      <h2 style="font-family: var(--font-serif); font-size: 1.45rem; font-weight: 600; margin: 0;">${item.name}</h2>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 2px 0 0;">${item.location}</p>
    `;

    this.elements.wonderDetails.innerHTML = createDetailMarkup(record, this.state.language);
    this.detailGallery = initializeGallery(this.elements.wonderDetails);

    this.elements.wonderModal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  applyLanguage(language, triggerUpdate = true) {
    this.state.language = language;
    document.documentElement.lang = language;
    const isEl = language === 'el';

    // Update Language Toggle text
    if (this.elements.languageToggle) {
      this.elements.languageToggle.textContent = isEl ? 'EN' : 'ΕΛ';
      this.elements.languageToggle.setAttribute('aria-label', isEl ? 'Switch to English' : 'Μετάβαση στα Ελληνικά');
    }

    // Update document title & metadata
    document.title = isEl ? 'Θαύματα του Αρχαίου Ελληνικού Κόσμου' : 'Wonders of the Ancient Greek World';
    const metaDesc = document.getElementById('meta-description');
    if (metaDesc) {
      metaDesc.content = isEl
        ? 'Δίγλωσσος διαδραστικός άτλας WebGIS 77 μνημειακών ιερών, ναών, θεάτρων και τεχνικών έργων του αρχαίου ελληνικού κόσμου.'
        : 'Interactive WebGIS atlas of 77 monumental sanctuaries, temples, theatres, colossal statues, and engineering marvels across the ancient Mediterranean and Near East.';
    }

    // Header Title
    const headerTitle = document.getElementById('header-title-text');
    if (headerTitle) {
      headerTitle.innerHTML = isEl
        ? 'Θαύματα <em>του Αρχαίου Ελληνικού Κόσμου</em>'
        : 'Wonders <em>of the Ancient Greek World</em>';
    }

    // Emblem
    const headerEmblem = document.getElementById('header-emblem');
    const wmEmblem = document.getElementById('wm-emblem');
    const emblemSrc = isEl ? './assets/shared/nkua-190-el-horizontal.png' : './assets/shared/nkua-190-en-horizontal.png';
    if (headerEmblem) headerEmblem.src = emblemSrc;
    if (wmEmblem) wmEmblem.src = emblemSrc;

    // Welcome modal
    const wmTitle = document.getElementById('wm-title');
    const wmDeck = document.getElementById('wm-deck');
    const wmEyebrow = document.getElementById('wm-eyebrow');
    const wmCov1 = document.getElementById('wm-cov-label-1');
    const wmCov2 = document.getElementById('wm-cov-label-2');
    const wmCov3 = document.getElementById('wm-cov-label-3');
    const wmTeamEyebrow = document.getElementById('wm-team-eyebrow');
    const wmSigEyebrow = document.getElementById('wm-sig-eyebrow');
    const wmVisitsLabel = document.getElementById('wm-visits-label');
    const footerAuthorship = document.getElementById('footer-authorship-label');

    if (wmTitle) {
      wmTitle.innerHTML = isEl
        ? 'Θαύματα<br><em class="wm-title-italic">του Αρχαίου Ελληνικού Κόσμου</em>'
        : 'Wonders<br><em class="wm-title-italic">of the Ancient Greek World</em>';
    }
    if (wmDeck) {
      wmDeck.textContent = isEl
        ? 'Εξερευνήστε 77 μνημειακά ιερά, ναούς, θέατρα, κολοσσιαία αγάλματα και επιτεύγματα μηχανικής σε ολόκληρη τη Μεσόγειο και την Εγγύς Ανατολή. Συγκρίνετε αρχιτεκτονικές τυπολογίες, ιστορικές χρονολογίες, σημερινή κατάσταση διατήρησης και τα κανονικά Επτά Θαύματα μέσα από δεδομένα συνδεδεμένα με την κλασική γραμματεία και τη σύγχρονη αρχαιολογική έρευνα.'
        : 'Explore 77 monumental sanctuaries, temples, theatres, colossal statues, and engineering achievements across the ancient Mediterranean and Near East. Compare architectural typologies, historical chronologies, present survival conditions, and canonical Seven Wonders through records linked to classical literature and modern archaeological research.';
    }
    if (wmEyebrow) wmEyebrow.textContent = isEl ? 'Ένα WebGIS · 2026' : 'A WebGIS · 2026';
    if (wmCov1) wmCov1.textContent = isEl ? 'Μνημεία στον χάρτη' : 'Monuments mapped';
    if (wmCov2) wmCov2.textContent = isEl ? 'Γεωγραφικό εύρος' : 'Geographic scope';
    if (wmCov3) wmCov3.textContent = isEl ? 'Χρονολόγηση' : 'Chronology';
    if (wmTeamEyebrow) wmTeamEyebrow.textContent = isEl ? 'Ερευνητική & επιστημονική επιμέλεια' : 'Research & project lead';
    if (wmSigEyebrow) wmSigEyebrow.textContent = isEl ? 'Ανάπτυξη ιστοτόπου' : 'Website developed by';
    if (wmVisitsLabel) wmVisitsLabel.textContent = isEl ? 'Καταγεγραμμένες επισκέψεις' : 'Recorded visits';
    const wmVisitCount = document.querySelector('[data-visit-count]');
    if (wmVisitCount) wmVisitCount.setAttribute('data-locale', isEl ? 'el' : 'en');
    if (footerAuthorship) footerAuthorship.textContent = isEl ? 'Ερευνητική & επιστημονική επιμέλεια' : 'Research & project lead';

    // Tabs
    const tabFilters = document.getElementById('tab-label-filters');
    const tabSearch = document.getElementById('tab-label-search');
    const tabStats = document.getElementById('tab-label-stats');
    if (tabFilters) tabFilters.textContent = isEl ? 'Φίλτρα' : 'Filters';
    if (tabSearch) tabSearch.textContent = isEl ? 'Αναζήτηση' : 'Search';
    if (tabStats) tabStats.textContent = isEl ? 'Στατιστικά' : 'Statistics';

    // Filter controls
    const fbcEyebrow = document.getElementById('fbc-eyebrow');
    const fbcModalTitle = document.getElementById('fbc-variable-modal-title');
    const fbcSearchInput = document.getElementById('fbc-variable-search-input');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const sqlFilterBtn = document.getElementById('sql-filter-btn');
    if (fbcEyebrow) fbcEyebrow.textContent = isEl ? 'φιλτράρισμα κατά' : 'filter by';
    if (fbcModalTitle) fbcModalTitle.textContent = isEl ? 'Επιλογή μεταβλητής' : 'Filter by';
    if (fbcSearchInput) fbcSearchInput.placeholder = isEl ? 'Αναζήτηση μεταβλητών…' : 'Search variables…';
    if (clearFiltersBtn) clearFiltersBtn.textContent = isEl ? 'Επαναφορά όλων' : 'Reset all';
    if (sqlFilterBtn) sqlFilterBtn.innerHTML = isEl ? 'Σύνθετο ερώτημα<span class="fbc-link-arrow" aria-hidden="true"> →</span>' : 'Advanced query<span class="fbc-link-arrow" aria-hidden="true"> →</span>';

    // Search panel
    const searchHint = document.getElementById('search-hint');
    const searchLabel = document.getElementById('search-label');
    const searchInput = document.getElementById('global-search-input');
    if (searchHint) searchHint.textContent = isEl
      ? 'Αναζητήστε ένα θαύμα με βάση το όνομα, τη χώρα, την αρχαία περιοχή, τον αρχιτεκτονικό τύπο ή την περίοδο.'
      : 'Find a wonder by name, country, ancient region, architectural type, or period.';
    if (searchLabel) searchLabel.textContent = isEl ? 'Καθολική αναζήτηση' : 'Global Search';
    if (searchInput) searchInput.placeholder = isEl ? 'Αναζήτηση Παρθενώνας, Δελφοί, Ολυμπία, Κολοσσός…' : 'Search Parthenon, Delphi, Olympia, Colossus…';

    // Statistics panel
    const statsHint = document.getElementById('stats-hint');
    const statsVarLabel = document.getElementById('stats-var-label');
    const statsSummaryEyebrow = document.getElementById('stats-summary-eyebrow');
    const statsGlossaryText = document.getElementById('stats-glossary-btn-text');
    if (statsHint) statsHint.textContent = isEl
      ? 'Οι επιλογές φίλτρων εφαρμόζονται στα στατιστικά. Καθαρίστε όλα τα φίλτρα για να δείτε το πλήρες σύνολο. Επιλέξτε μια στήλη για να δείτε τα μνημεία της.'
      : 'Filter changes apply to statistics; clear all filters to view the full dataset. Hover bars for exact counts; click a bar to list its monuments.';
    if (statsVarLabel) statsVarLabel.textContent = isEl ? 'Μεταβλητή:' : 'Variable:';
    if (statsSummaryEyebrow) statsSummaryEyebrow.textContent = isEl ? 'Συνοπτικά στατιστικά' : 'Summary statistics';
    if (statsGlossaryText) statsGlossaryText.textContent = isEl ? 'Τι σημαίνουν αυτά;' : 'What do these mean?';

    // Feature guide modal
    const fgTitle = document.getElementById('feature-guide-title');
    const fgDef = document.getElementById('feature-guide-definition');
    const fgBtn = document.getElementById('feature-guide-btn');
    if (fgTitle) fgTitle.textContent = isEl ? 'Τι είναι ένα Αρχαίο Ελληνικό Θαύμα;' : 'What is an Ancient Greek Wonder?';
    if (fgDef) fgDef.textContent = isEl
      ? 'Τα θαύματα του αρχαίου ελληνικού κόσμου περιλαμβάνουν μνημειακούς ναούς, ιερά, δημόσιους χώρους, τεχνικά έργα και κολοσσιαία γλυπτά που δημιουργήθηκαν στον ελλαδικό χώρο, στα νησιά του Αιγαίου, στη Μεγάλη Ελλάδα και στα ελληνιστικά βασίλεια (περ. 1600 π.Χ. – 300 μ.Χ.). Από τα κανονικά Επτά Θαύματα έως τα μνημειακά αρχαία θέατρα και τα πανελλήνια ιερά, αντανακλούν τα κορυφαία επιτεύγματα της κλασικής αρχιτεκτονικής, της γεωμετρίας και της πολιτειακής ζωής.'
      : 'The wonders of the ancient Greek world encompass monumental temples, sanctuaries, civic spaces, engineering achievements, and colossal artworks created across the Greek mainland, Aegean islands, Magna Graecia, and the Hellenistic kingdoms (c. 1600 BC – 300 AD). From the canonical Seven Wonders to monumental amphitheatres and panhellenic sanctuaries, they reflect the pinnacles of classical architecture, geometry, religious devotion, and civic life.';
    if (fgBtn) fgBtn.textContent = isEl ? 'Αρχαία Θαύματα' : 'Ancient Wonders';

    // Footer nav
    const aboutBtn = document.getElementById('about-btn');
    const refBtn = document.getElementById('references-btn');
    const submitBtn = document.getElementById('submit-data-btn');
    if (aboutBtn) aboutBtn.textContent = isEl ? 'Καλωσόρισμα' : 'Welcome';
    if (refBtn) refBtn.textContent = isEl ? 'Πηγές' : 'Sources';
    if (submitBtn) submitBtn.textContent = isEl ? 'Υποβολή δεδομένων' : 'Submit data';

    this.syncUrl();
    if (triggerUpdate) {
      if (this.atlasInterface) {
        this.initCommonAtlasInterface();
      }
      this.updateView();
    }
  }

  syncUrl() {
    const next = serializeUrlState(this.state);
    history.replaceState({}, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ancientGreekWonders = new AncientGreekWondersApp();
});
