import { WONDERS } from './data/wonders.js';
import { filterWonders, normalizeSearchText, summarizeSurvival, MAP_CATEGORY_KEYS, MAP_CATEGORY_LABELS, getWonderMapCategoryKey } from './core/catalog.js';
import { parseUrlState, serializeUrlState } from './core/url-state.js';
import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, formatResultCount, localizeRecord, t } from './i18n.js';
import { createDetailMarkup, createResultMarkup, escapeHtml } from './ui/render.js';
import { initializeGallery } from './ui/gallery.js';
import { ImageLightbox } from './ui/lightbox.js';
import { createWondersMap, WONDER_MAP_CATEGORIES, getWonderMapCategory } from './map/map.js';

const MAP_CATEGORY_COLORS = {
  extant: '#0d9488',
  ruins: '#ea580c',
  lost: '#b91c1c'
};

const ATLAS_TEXT = {
  el: {
    variable: 'Μεταβλητή:',
    figure: 'Σχ.',
    summaryStatistics: 'Συνοπτικά στατιστικά',
    statisticsGuide: 'Τι σημαίνουν αυτά τα στατιστικά;',
    whatTheseMean: 'Τι σημαίνουν αυτά;',
    uniqueValues: 'Μοναδικές τιμές',
    mode: 'Επικρατούσα τιμή',
    numericType: 'αριθμητικό',
    categoricalType: 'κατηγορικό',
    chooseStatistic: 'Επιλέξτε μεταβλητή στατιστικών',
    close: 'Κλείσιμο',
    selectionCount: '{count} μνημεία',
    loadingStatistics: 'Φόρτωση παρατηρήσεων για τη μεταβλητή…',
    statisticsCoverage: '{valid} από {total} ορατά μνημεία διαθέτουν τιμή ({percent}).',
    statisticsMissingNote: 'Μνημεία χωρίς έγκυρη τιμή εξαιρούνται από το διάγραμμα.',
    distributionOf: 'Κατανομή',
    frequencyOf: 'Συχνότητα',
    emptyStatistics: 'Δεν υπάρχουν μνημεία στην τρέχουσα επιλογή.',
    otherCategory: 'Άλλα',
    count: 'Πλήθος',
    logScale: 'λογαριθμική κλίμακα',
    histogramOf: 'Ιστόγραμμα',
    mean: 'Μέση τιμή',
    median: 'Διάμεσος',
    standardDeviation: 'Τυπική απόκλιση',
    minimum: 'Ελάχιστο',
    maximum: 'Μέγιστο',
    range: 'Εύρος',
    skewness: 'Ασυμμετρία',
    searchVariables: 'Αναζήτηση μεταβλητών…',
    variables: 'Μεταβλητές',
    loadingData: 'Φόρτωση δεδομένων…',
    searchValues: 'Αναζήτηση',
    noMatches: 'Δεν βρέθηκαν αποτελέσματα.',
    queryBuilder: 'Σύνθετο ερώτημα',
    addCondition: 'Προσθήκη συνθήκης',
    where: 'Όπου',
    and: 'ΚΑΙ',
    or: 'Ή'
  },
  en: {
    variable: 'Variable:',
    figure: 'Fig.',
    summaryStatistics: 'Summary statistics',
    statisticsGuide: 'What do these statistics mean?',
    whatTheseMean: 'What do these mean?',
    uniqueValues: 'Unique values',
    mode: 'Mode',
    numericType: 'numeric',
    categoricalType: 'categorical',
    chooseStatistic: 'Choose a statistics variable',
    close: 'Close',
    selectionCount: '{count} records',
    loadingStatistics: 'Loading observations for this variable…',
    statisticsCoverage: '{valid} of {total} visible records have a value ({percent}).',
    statisticsMissingNote: 'Records without a usable value are excluded from the chart.',
    distributionOf: 'Distribution of',
    frequencyOf: 'Frequency of',
    emptyStatistics: 'No records in the current selection.',
    otherCategory: 'Other',
    count: 'Count',
    logScale: 'log scale',
    histogramOf: 'Histogram of',
    mean: 'Mean',
    median: 'Median',
    standardDeviation: 'Std. dev.',
    minimum: 'Minimum',
    maximum: 'Maximum',
    range: 'Range',
    skewness: 'Skewness',
    searchVariables: 'Search variables…',
    variables: 'Variables',
    loadingData: 'Loading data…',
    searchValues: 'Search',
    noMatches: 'No matching records.',
    queryBuilder: 'Query builder',
    addCondition: 'Add condition',
    where: 'Where',
    and: 'AND',
    or: 'OR'
  }
};

function getFilterFields(lang) {
  const isEl = lang === 'el';
  return [
    {
      key: 'mapCategory',
      dataField: 'mapCategory',
      label: isEl ? 'Σημερινή κατάσταση' : 'Survival condition',
      group: isEl ? 'Αρχαιολογία' : 'Archaeology',
      getColor: (val) => MAP_CATEGORY_COLORS[val] || null,
      formatValue: (val) => MAP_CATEGORY_LABELS[val]?.[lang] || val
    },
    {
      key: 'status',
      dataField: 'status',
      label: isEl ? 'Λεπτομερής κατάσταση' : 'Detailed preservation state',
      group: isEl ? 'Αρχαιολογία' : 'Archaeology',
      formatValue: (val) => STATUS_LABELS[val]?.[lang] || val
    },
    {
      key: 'category',
      dataField: 'category',
      label: isEl ? 'Τύπος μνημείου' : 'Monument typology',
      group: isEl ? 'Αρχιτεκτονική' : 'Architecture',
      formatValue: (val) => CATEGORY_LABELS[val]?.[lang] || val
    },
    {
      key: 'country',
      dataField: 'country',
      label: isEl ? 'Σύγχρονη χώρα' : 'Modern country',
      group: isEl ? 'Γεωγραφία' : 'Geography',
      formatValue: (val) => COUNTRY_LABELS[val]?.[lang] || val
    },
    {
      key: 'sevenWonder',
      dataField: 'sevenWonder',
      inputId: 'seven-filter',
      label: isEl ? 'Επτά Θαύματα' : 'Seven Wonders',
      group: isEl ? 'Κλασικά' : 'Canonical',
      formatValue: (val) => (val === true || val === 'true' || val === '1')
        ? (isEl ? 'Κανονικά Επτά Θαύματα' : 'Canonical Seven Wonders')
        : (isEl ? 'Όλα τα μνημεία' : 'All monuments')
    }
  ];
}

function getStatisticsFields(lang) {
  const isEl = lang === 'el';
  return [
    {
      key: 'mapCategory',
      dataField: 'mapCategory',
      label: isEl ? 'Σημερινή κατάσταση' : 'Survival condition',
      type: 'categorical',
      group: isEl ? 'Αρχαιολογία' : 'Archaeology',
      maxItems: 5,
      getColor: (key) => MAP_CATEGORY_COLORS[key] || null,
      formatValue: (val) => MAP_CATEGORY_LABELS[val]?.[lang] || val,
      description: isEl
        ? 'Κατηγοριοποίηση κατάστασης επιβίωσης στον χάρτη (Όρθιο / αναστηλωμένο, Ερείπια / ανασκαμμένο, Χαμένο / βυθισμένο).'
        : 'Standardized survival categories matching map markers (Standing / restored, Ruins / excavated, Lost / submerged).'
    },
    {
      key: 'status',
      dataField: 'status',
      label: isEl ? 'Λεπτομερής κατάσταση' : 'Detailed preservation state',
      type: 'categorical',
      group: isEl ? 'Αρχαιολογία' : 'Archaeology',
      maxItems: 12,
      formatValue: (val) => STATUS_LABELS[val]?.[lang] || val,
      description: isEl
        ? 'Αναλυτική αρχαιολογική κατάσταση διατήρησης σύμφωνα με σύγχρονες αναφορές ανασκαφών.'
        : 'Detailed preservation state of the ancient wonder according to contemporary archaeological documentation.'
    },
    {
      key: 'category',
      dataField: 'category',
      label: isEl ? 'Τυπολογία μνημείου' : 'Monument typology',
      type: 'categorical',
      group: isEl ? 'Αρχιτεκτονική' : 'Architecture',
      maxItems: 12,
      formatValue: (val) => CATEGORY_LABELS[val]?.[lang] || val,
      description: isEl
        ? 'Αρχιτεκτονικός και λειτουργικός τύπος του μνημείου ή του χώρου.'
        : 'Architectural and functional typology of the monument or complex.'
    },
    {
      key: 'country',
      dataField: 'country',
      label: isEl ? 'Σύγχρονη χώρα' : 'Modern country',
      type: 'categorical',
      group: isEl ? 'Γεωγραφία' : 'Geography',
      maxItems: 12,
      formatValue: (val) => COUNTRY_LABELS[val]?.[lang] || val,
      description: isEl
        ? 'Σύγχρονο κράτος στο οποίο βρίσκεται σήμερα ο αρχαιολογικός χώρος.'
        : 'Modern nation-state encompassing the ancient archaeological site.'
    },
    {
      key: 'sevenWonder',
      dataField: 'sevenWonder',
      label: isEl ? 'Κλασικά Επτά Θαύματα' : 'Canonical Seven Wonders',
      type: 'categorical',
      group: isEl ? 'Κλασικά' : 'Canonical',
      maxItems: 3,
      formatValue: (val) => (val === true || val === 'true' || val === 1)
        ? (isEl ? 'Επτά Θαύματα' : 'Seven Wonders')
        : (isEl ? 'Λοιπά αρχαία θαύματα' : 'Other ancient wonders'),
      description: isEl
        ? 'Συμπερίληψη στον κλασικό κανόνα των Επτά Θαυμάτων του Αρχαίου Κόσμου.'
        : 'Inclusion in the canonical Hellenistic lists of the Seven Wonders of the Ancient World.'
    }
  ];
}

class AncientGreekWondersApp {
  constructor() {
    this.wonders = WONDERS;
    this.state = parseUrlState(location.search, this.wonders);
    if (!this.state.language) this.state.language = 'en';

    this.currentRecords = this.wonders;
    this.mapController = null;
    this.atlasInterface = null;
    this.detailGallery = null;
    this.lightbox = null;
    this.activeFilterField = 'mapCategory';

    this.elements = {
      app: document.getElementById('app'),
      sidebar: document.getElementById('sidebar'),
      map: document.getElementById('map'),
      languageToggle: document.getElementById('language-toggle'),
      footerLanguageToggle: document.getElementById('footer-language-toggle'),
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
      
      // Image Lightbox modal
      lightboxModal: document.getElementById('image-lightbox-modal'),
      lightboxTitle: document.getElementById('lightbox-title'),
      lightboxCounter: document.getElementById('lightbox-counter'),
      lightboxImage: document.getElementById('lightbox-image'),
      lightboxDesc: document.getElementById('lightbox-desc'),
      lightboxCredit: document.getElementById('lightbox-credit'),
      lightboxClose: document.getElementById('lightbox-close'),
      lightboxPrev: document.getElementById('lightbox-prev'),
      lightboxNext: document.getElementById('lightbox-next'),
      lightboxZoomIn: document.getElementById('lightbox-zoom-in'),
      lightboxZoomOut: document.getElementById('lightbox-zoom-out'),
      lightboxZoomReset: document.getElementById('lightbox-zoom-reset'),
      lightboxZoomLevel: document.getElementById('lightbox-zoom-level'),
      lightboxDownload: document.getElementById('lightbox-download'),
      lightboxViewport: document.getElementById('lightbox-viewport'),
      
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
      onSelect: (wonderId) => this.showWonderDetails(wonderId),
      onCategorySelect: (categoryKey) => this.toggleMapCategory(categoryKey)
    });
  }

  toggleMapCategory(categoryKey) {
    if (this.state.mapCategory === categoryKey) {
      this.state.mapCategory = '';
    } else {
      this.state.mapCategory = categoryKey;
    }
    this.syncUrl();
    this.applyFilters();
  }

  initSidebarTabs() {
    const mobileButtons = [
      { btn: this.elements.mobileFilters, tab: 'filters' },
      { btn: this.elements.mobileSearch, tab: 'search' },
      { btn: this.elements.mobileStats, tab: 'stats' }
    ];

    const updateMobileButtonStates = (activeTab) => {
      const isOpen = this.elements.sidebar?.classList.contains('active') ||
                     this.elements.sidebar?.classList.contains('mobile-open');
      mobileButtons.forEach(({ btn, tab }) => {
        if (btn) {
          btn.classList.toggle('active', Boolean(isOpen && tab === activeTab));
        }
      });
    };

    const closeSidebar = () => {
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.remove('active', 'mobile-open');
      }
      document.body.classList.remove('sidebar-open', 'mobile-sidebar-active');
      updateMobileButtonStates(null);
      this.mapController?.invalidateSize?.();
    };

    const openSidebarTab = (tab) => {
      const isSidebarOpen = this.elements.sidebar?.classList.contains('active') ||
                            this.elements.sidebar?.classList.contains('mobile-open');
      const currentTab = document.body.dataset.activeTab;

      if (isSidebarOpen && currentTab === tab) {
        closeSidebar();
        return;
      }

      this.switchTab(tab);
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.add('active', 'mobile-open');
      }
      document.body.classList.add('sidebar-open', 'mobile-sidebar-active');
      updateMobileButtonStates(tab);

      if (tab === 'search') {
        setTimeout(() => {
          this.elements.globalSearchInput?.focus();
        }, 120);
      }
    };

    this.closeMobileSidebar = closeSidebar;

    this.elements.tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        this.switchTab(tab);
        updateMobileButtonStates(tab);
      });
    });

    this.elements.mobileFilters?.addEventListener('click', () => openSidebarTab('filters'));
    this.elements.mobileSearch?.addEventListener('click', () => openSidebarTab('search'));
    this.elements.mobileStats?.addEventListener('click', () => openSidebarTab('stats'));

    this.elements.mobileSidebarClose?.addEventListener('click', closeSidebar);
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
    const closeWelcome = () => {
      const finish = () => {
        this.elements.welcomeModal?.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.mapController?.invalidateSize?.();
      };
      if (window.NkuaWebGISUI?.revealWelcomeModal && this.elements.welcomeModal) {
        window.NkuaWebGISUI.revealWelcomeModal(this.elements.welcomeModal, finish);
      } else {
        finish();
      }
    };
    const openWelcome = () => {
      this.elements.welcomeModal.classList.add('active');
      document.body.classList.add('modal-open');
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

    // Image lightbox initialization
    if (this.elements.lightboxModal) {
      this.lightbox = new ImageLightbox({
        modal: this.elements.lightboxModal,
        title: this.elements.lightboxTitle,
        counter: this.elements.lightboxCounter,
        image: this.elements.lightboxImage,
        desc: this.elements.lightboxDesc,
        credit: this.elements.lightboxCredit,
        closeBtn: this.elements.lightboxClose,
        prevBtn: this.elements.lightboxPrev,
        nextBtn: this.elements.lightboxNext,
        zoomInBtn: this.elements.lightboxZoomIn,
        zoomOutBtn: this.elements.lightboxZoomOut,
        zoomResetBtn: this.elements.lightboxZoomReset,
        zoomLevel: this.elements.lightboxZoomLevel,
        downloadBtn: this.elements.lightboxDownload,
        viewport: this.elements.lightboxViewport
      }, { language: this.state.language });
    }

    // Language switcher (header pill and footer link)
    const toggleLanguage = () => {
      const nextLang = this.state.language === 'en' ? 'el' : 'en';
      this.applyLanguage(nextLang, true);
    };
    this.elements.languageToggle?.addEventListener('click', toggleLanguage);
    this.elements.footerLanguageToggle?.addEventListener('click', toggleLanguage);

    // Filter reset wiring
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Global keyboard listener for Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.lightbox?.isOpen()) {
          this.lightbox.close();
          return;
        }
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
    const resultsContainer = this.elements.globalSearchResults;
    if (!input || !resultsContainer) return;

    input.addEventListener('input', () => {
      const query = input.value.trim();
      this.state.query = query;
      this.syncUrl();

      if (!query || query.length < 1) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        this.applyFilters();
        return;
      }

      this.renderAutocomplete(query);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        this.state.query = '';
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        this.syncUrl();
        this.applyFilters();
      }
    });

    input.addEventListener('focus', () => {
      const query = input.value.trim();
      if (query.length >= 1) {
        this.renderAutocomplete(query);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-tab')) {
        resultsContainer.classList.add('hidden');
      }
    });
  }

  renderAutocomplete(query) {
    const container = this.elements.globalSearchResults;
    if (!container) return;

    const normQuery = normalizeSearchText(query);
    const lang = this.state.language;
    const isEl = lang === 'el';

    // 1. Monuments (wonders)
    const wonderMatches = [];
    for (const record of this.wonders) {
      const normNameEn = normalizeSearchText(record.name.en);
      const normNameEl = normalizeSearchText(record.name.el);
      const normLocEn = normalizeSearchText(record.location.en);
      const normLocEl = normalizeSearchText(record.location.el);

      if (normNameEn.includes(normQuery) || normNameEl.includes(normQuery) || normLocEn.includes(normQuery) || normLocEl.includes(normQuery)) {
        const primaryName = isEl ? record.name.el : record.name.en;
        const subLocation = isEl ? record.location.el : record.location.en;
        wonderMatches.push({
          record,
          primaryText: primaryName,
          secondaryText: subLocation
        });
        if (wonderMatches.length >= 6) break;
      }
    }

    // 2. Locations / Regions
    const locationSet = new Map();
    for (const record of this.wonders) {
      const locStr = isEl ? record.location.el : record.location.en;
      const parts = locStr.split(',').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (!locationSet.has(part.toLowerCase())) {
          if (normalizeSearchText(part).includes(normQuery)) {
            locationSet.set(part.toLowerCase(), { value: part, filterKey: 'location' });
          }
        }
      }
    }
    const locationMatches = Array.from(locationSet.values()).slice(0, 5);

    // 3. Countries
    const countrySet = new Map();
    for (const record of this.wonders) {
      const rawCountry = record.country;
      const countryDisplay = COUNTRY_LABELS[rawCountry]?.[lang] ?? rawCountry;
      if (normalizeSearchText(countryDisplay).includes(normQuery) || normalizeSearchText(rawCountry).includes(normQuery)) {
        if (!countrySet.has(rawCountry)) {
          countrySet.set(rawCountry, { value: rawCountry, display: countryDisplay, filterKey: 'country' });
        }
      }
    }
    const countryMatches = Array.from(countrySet.values()).slice(0, 5);

    // 4. Typology / Categories
    const categorySet = new Map();
    for (const record of this.wonders) {
      const rawCat = record.category;
      const catDisplay = CATEGORY_LABELS[rawCat]?.[lang] ?? rawCat;
      if (normalizeSearchText(catDisplay).includes(normQuery) || normalizeSearchText(rawCat).includes(normQuery)) {
        if (!categorySet.has(rawCat)) {
          categorySet.set(rawCat, { value: rawCat, display: catDisplay, filterKey: 'category' });
        }
      }
    }
    const categoryMatches = Array.from(categorySet.values()).slice(0, 5);

    const totalMatches = wonderMatches.length + locationMatches.length + countryMatches.length + categoryMatches.length;

    if (totalMatches === 0) {
      container.innerHTML = `<div class="search-empty">${isEl ? 'Δεν βρέθηκαν αποτελέσματα' : 'No results found'}</div>`;
      container.classList.remove('hidden');
      return;
    }

    const highlight = (text, q) => {
      const escaped = escapeHtml(text);
      if (!q) return escaped;
      const re = new RegExp(`(${escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return escaped.replace(re, '<mark>$1</mark>');
    };

    let html = '';

    if (wonderMatches.length > 0) {
      html += `<div class="search-results-section">
        <div class="search-results-header">${isEl ? 'Θαύματα' : 'Wonders'}</div>
        ${wonderMatches.map((m) => `
          <button class="search-result-item" type="button" data-autocomplete-type="wonder" data-wonder-id="${m.record.id}">
            <span class="search-result-text">
              <strong>${highlight(m.primaryText, query)}</strong>
              <small style="display: block; font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(m.secondaryText)}</small>
            </span>
          </button>
        `).join('')}
      </div>`;
    }

    if (locationMatches.length > 0) {
      html += `<div class="search-results-section">
        <div class="search-results-header">${isEl ? 'Τοποθεσίες' : 'Locations'}</div>
        ${locationMatches.map((m) => `
          <button class="search-result-item" type="button" data-autocomplete-type="filter" data-filter-key="query" data-filter-val="${escapeHtml(m.value)}">
            <span class="search-result-text">${highlight(m.value, query)}</span>
          </button>
        `).join('')}
      </div>`;
    }

    if (countryMatches.length > 0) {
      html += `<div class="search-results-section">
        <div class="search-results-header">${isEl ? 'Χώρες' : 'Countries'}</div>
        ${countryMatches.map((m) => `
          <button class="search-result-item" type="button" data-autocomplete-type="filter" data-filter-key="country" data-filter-val="${escapeHtml(m.value)}">
            <span class="search-result-text">${highlight(m.display, query)}</span>
          </button>
        `).join('')}
      </div>`;
    }

    if (categoryMatches.length > 0) {
      html += `<div class="search-results-section">
        <div class="search-results-header">${isEl ? 'Τυπολογία' : 'Typology'}</div>
        ${categoryMatches.map((m) => `
          <button class="search-result-item" type="button" data-autocomplete-type="filter" data-filter-key="category" data-filter-val="${escapeHtml(m.value)}">
            <span class="search-result-text">${highlight(m.display, query)}</span>
          </button>
        `).join('')}
      </div>`;
    }

    container.innerHTML = html;
    container.classList.remove('hidden');

    container.querySelectorAll('[data-autocomplete-type="wonder"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.wonderId;
        const record = this.wonders.find((w) => w.id === id);
        if (record) {
          this.mapController?.focus(record);
          this.showWonderDetails(id);
          container.classList.add('hidden');
          if (window.innerWidth <= 768) {
            this.closeMobileSidebar?.();
          }
        }
      });
    });

    container.querySelectorAll('[data-autocomplete-type="filter"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.filterKey;
        const val = btn.dataset.filterVal;
        if (key === 'query') {
          this.state.query = val;
          if (this.elements.globalSearchInput) this.elements.globalSearchInput.value = val;
        } else {
          this.state[key] = val;
          const input = document.getElementById(`${key}-filter`);
          if (input) input.value = val;
        }
        this.syncUrl();
        this.applyFilters();
        container.classList.add('hidden');
        if (window.innerWidth <= 768) {
          this.closeMobileSidebar?.();
        }
      });
    });
  }

  clearAllFilters() {
    this.state.mapCategory = '';
    this.state.status = '';
    this.state.category = '';
    this.state.country = '';
    this.state.sevenWonder = false;
    this.state.query = '';
    if (this.elements.globalSearchInput) this.elements.globalSearchInput.value = '';
    if (this.elements.globalSearchResults) {
      this.elements.globalSearchResults.classList.add('hidden');
      this.elements.globalSearchResults.innerHTML = '';
    }
    ['mapCategory', 'status', 'category', 'country', 'sevenWonder', 'seven', 'period'].forEach((k) => {
      const input = document.getElementById(`${k}-filter`);
      if (input) input.value = '';
    });
    this.syncUrl();
    this.applyFilters();
  }

  initCommonAtlasInterface() {
    if (!window.NkuaWebGISUI?.createAtlasInterface) return;

    this.atlasInterface = window.NkuaWebGISUI.createAtlasInterface({
      locale: this.state.language === 'el' ? 'el-GR' : 'en-US',
      text: ATLAS_TEXT[this.state.language] || ATLAS_TEXT.en,
      getRecords: () => this.currentRecords,
      getValue: (field) => {
        const key = field.key;
        if (key === 'sevenWonder') {
          return this.state.sevenWonder ? 'true' : '';
        }
        return this.state[key] ? String(this.state[key]) : '';
      },
      getOptions: (field) => {
        if (field.key === 'mapCategory') {
          return MAP_CATEGORY_KEYS.slice();
        }
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
        if (window.innerWidth <= 768) {
          this.closeMobileSidebar?.();
        }
        this.mapController.focus(record);
        this.showWonderDetails(record.id);
      },
      getSummaryRows: (field, values, records, defaultRows) => {
        const isEl = this.state.language === 'el';
        const totalCount = this.wonders.length;
        const visibleCount = records.length;
        return [
          { label: isEl ? 'Σύνολο καταλόγου' : 'Catalogue total', value: totalCount },
          { label: isEl ? 'Ορατά μνημεία' : 'Visible records', value: visibleCount }
        ].concat(defaultRows);
      },
      filterFields: getFilterFields(this.state.language),
      statisticsFields: getStatisticsFields(this.state.language)
    });
  }

  applyFilters() {
    this.currentRecords = filterWonders(this.wonders, this.state);
    this.updateView();
  }

  updateView() {
    this.mapController?.update(this.currentRecords, this.state.language);
    this.mapController?.setActiveCategory?.(this.state.mapCategory || '');
    this.updateSearchResults();
    this.updateSummaryStats();
    if (this.atlasInterface) {
      this.atlasInterface.setRecords(this.currentRecords);
    }
  }

  updateSearchResults() {
    const list = this.elements.globalSearchResults;
    if (!list) return;

    if (!this.state.query || this.state.query.trim().length === 0) {
      list.classList.add('hidden');
      list.innerHTML = '';
      return;
    }

    this.renderAutocomplete(this.state.query);
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
    if (window.innerWidth <= 768) {
      this.closeMobileSidebar?.();
    }
    const record = this.wonders.find((w) => w.id === wonderId);
    if (!record) return;

    const item = localizeRecord(record, this.state.language);
    const isEl = this.state.language === 'el';

    this.elements.wonderTitleblock.innerHTML = `
      <span class="lagoon-eyebrow">${isEl ? 'Αρχαίο Ελληνικό Θαύμα' : 'Ancient Greek Wonder'}</span>
      <h2 class="lagoon-name">
        <span class="lagoon-name-en">${escapeHtml(record.name.en)}</span>
        ${record.name.el ? `<span class="lagoon-name-sep" aria-hidden="true">/</span><span class="lagoon-name-gr">${escapeHtml(record.name.el)}</span>` : ''}
      </h2>
      <p class="lagoon-locality">
        <span class="lagoon-pin-icon" aria-hidden="true">📍</span> <em>${escapeHtml(item.location)}</em>
      </p>
    `;

    this.elements.wonderDetails.innerHTML = createDetailMarkup(record, this.state.language);
    this.detailGallery = initializeGallery(this.elements.wonderDetails);

    // Lightbox triggers on gallery figures
    this.elements.wonderDetails.querySelectorAll('[data-lightbox-slide]').forEach((img) => {
      img.addEventListener('click', () => {
        const slideIndex = parseInt(img.dataset.lightboxSlide, 10) || 0;
        this.lightbox?.open(record, slideIndex, this.state.language);
      });
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const slideIndex = parseInt(img.dataset.lightboxSlide, 10) || 0;
          this.lightbox?.open(record, slideIndex, this.state.language);
        }
      });
    });

    this.elements.wonderModal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  applyLanguage(language, triggerUpdate = true) {
    this.state.language = language;
    document.documentElement.lang = language;
    if (this.lightbox) {
      this.lightbox.language = language;
    }
    if (this.mapController?.setToponymLanguage) {
      this.mapController.setToponymLanguage(language);
    }
    const isEl = language === 'el';

    // Update Language Toggle (header pill & footer link) with segmented bilingual badge: ΕΛ | EN
    const toggleAria = isEl ? 'Switch to English' : 'Μετάβαση στα Ελληνικά';
    const toggleMarkup = `<span class="lang-opt lang-opt-el${isEl ? ' is-active' : ''}">ΕΛ</span><span class="lang-sep" aria-hidden="true">|</span><span class="lang-opt lang-opt-en${!isEl ? ' is-active' : ''}">EN</span>`;
    if (this.elements.languageToggle) {
      this.elements.languageToggle.innerHTML = toggleMarkup;
      this.elements.languageToggle.setAttribute('aria-label', toggleAria);
    }
    if (this.elements.footerLanguageToggle) {
      this.elements.footerLanguageToggle.innerHTML = toggleMarkup;
      this.elements.footerLanguageToggle.setAttribute('aria-label', toggleAria);
    }

    // Update footer collection title & license metadata
    const footerCollection = document.querySelector('.footer-collection-name');
    if (footerCollection) {
      footerCollection.innerHTML = isEl
        ? 'Θαύματα <em>του Αρχαίου Ελληνικού Κόσμου</em>'
        : 'Wonders <em>of the Ancient Greek World</em>';
    }
    const footerCreditMeta = document.querySelector('.footer-credit-meta');
    if (footerCreditMeta) {
      footerCreditMeta.innerHTML = isEl
        ? '<span>© 2026</span><span class="footer-credit-dot" aria-hidden="true">·</span><span>Περιεχόμενο υπό άδεια <a class="footer-license-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a></span>'
        : '<span>© 2026</span><span class="footer-credit-dot" aria-hidden="true">·</span><span>Content under <a class="footer-license-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a></span>';
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
    if (wmVisitsLabel) wmVisitsLabel.textContent = isEl ? 'Καταγεγραμμένες επισκέψεις σελίδας' : 'Recorded page visits';
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
      ? 'Η επιλογή αποτελέσματος εφαρμόζεται ως φίλτρο — επηρεάζοντας τον χάρτη, τα στατιστικά και το πλήθος των μνημείων.'
      : 'Selecting a result applies it as a filter — affecting the map, statistics, and monument counts.';
    if (searchLabel) searchLabel.textContent = isEl ? 'Καθολική αναζήτηση' : 'Global Search';
    if (searchInput) searchInput.placeholder = isEl ? 'Αναζήτηση ονόματος, τοποθεσίας, τυπολογίας…' : 'Search name, location, typology…';

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

    const wmCta = document.getElementById('wm-cta-label');
    if (wmCta) wmCta.textContent = isEl ? 'Είσοδος στον άτλαντα' : 'Enter the atlas';

    // Footer nav
    const aboutBtn = document.getElementById('about-btn');
    const refBtn = document.getElementById('references-btn');
    const submitBtn = document.getElementById('submit-data-btn');
    if (aboutBtn) aboutBtn.textContent = isEl ? 'Σχετικά' : 'About';
    if (refBtn) refBtn.textContent = isEl ? 'Πηγές' : 'Sources';
    if (submitBtn) submitBtn.textContent = isEl ? 'Υποβολή δεδομένων' : 'Submit data';

    // Mobile controls
    const mobFilters = document.getElementById('mobile-filters-toggle');
    const mobSearch = document.getElementById('mobile-search-toggle');
    const mobStats = document.getElementById('mobile-stats-toggle');
    if (mobFilters) mobFilters.textContent = isEl ? 'Φίλτρα' : 'Filters';
    if (mobSearch) mobSearch.textContent = isEl ? 'Αναζήτηση' : 'Search';
    if (mobStats) mobStats.textContent = isEl ? 'Στατιστικά' : 'Statistics';

    // Header & Welcome modal metadata
    const lastUpdated = document.querySelector('.last-updated');
    if (lastUpdated) {
      lastUpdated.innerHTML = isEl
        ? 'Τελευταία ενημέρωση: <time datetime="2026-09-12">12 Σεπτεμβρίου 2026</time>'
        : 'Last updated: <time datetime="2026-09-12">12 September 2026</time>';
    }
    const covVal2 = document.getElementById('wm-cov-val-2');
    const covVal3 = document.getElementById('wm-cov-val-3');
    if (covVal2) covVal2.textContent = isEl ? '11 χώρες' : '11 countries';
    if (covVal3) covVal3.textContent = isEl ? 'περ. 1600 π.Χ. – 300 μ.Χ.' : 'c. 1600 BC – 300 AD';

    // Summary statistics labels in sidebar
    const summaryLabelsEl = [
      'Σύνολο καταλόγου',
      'Ορατά μνημεία',
      'Χώρες',
      'Όρθια / αναστηλωμένα',
      'Ερείπια / ανασκαμμένα',
      'Επαναστημένα / ημιτελή',
      'Χαμένα / βυθισμένα',
      'Κανονικά Επτά Θαύματα'
    ];
    const summaryLabelsEn = [
      'Catalogue total',
      'Visible records',
      'Countries represented',
      'Standing / restored',
      'Ruins / excavated',
      'Re-erected / unfinished',
      'Lost / submerged',
      'Canonical Seven Wonders'
    ];
    document.querySelectorAll('#stats-summary .stats-row-label').forEach((row, i) => {
      row.textContent = isEl ? summaryLabelsEl[i] : summaryLabelsEn[i];
    });

    // Statistics chart labels
    const statsFigTitle = document.getElementById('stats-figure-title');
    const statsAxisLabel = document.getElementById('stats-axis-label');
    const statsTypeBadge = document.getElementById('stats-type-badge');
    if (statsFigTitle) statsFigTitle.textContent = isEl ? 'Μνημεία κατά κατάσταση' : 'Wonders by condition';
    if (statsAxisLabel) statsAxisLabel.textContent = isEl ? 'Κατάσταση' : 'Condition';
    if (statsTypeBadge) statsTypeBadge.textContent = isEl ? 'κατηγορική' : 'categorical';

    // Atlas Interface Panels
    if (this.atlasInterface?.setLanguage) {
      this.atlasInterface.setLanguage(isEl ? 'el-GR' : 'en-US', ATLAS_TEXT[language], {
        filterFields: getFilterFields(language),
        statisticsFields: getStatisticsFields(language)
      });
    } else {
      if (this.atlasInterface?.filterPanel) {
        this.atlasInterface.filterPanel.fields = getFilterFields(language);
        this.atlasInterface.filterPanel.populatePicker?.();
        this.atlasInterface.filterPanel.render?.();
      }
      if (this.atlasInterface?.statisticsPanel) {
        this.atlasInterface.statisticsPanel.fields = getStatisticsFields(language);
        this.atlasInterface.statisticsPanel.populatePicker?.();
        this.atlasInterface.statisticsPanel.render?.();
      }
    }

    // References modal
    const refModalTitle = document.getElementById('ref-modal-title');
    const refModalDesc = document.getElementById('ref-modal-desc');
    const wondersPlatformTitle = document.getElementById('wonders-platform-title');
    const refPlatformDesc = document.getElementById('ref-platform-desc');
    const wondersDatasetTitle = document.getElementById('wonders-dataset-title');
    const refDatasetDesc = document.getElementById('ref-dataset-desc');
    const refDatasetCopy = document.getElementById('ref-dataset-copy');
    const wondersLicenceTitle = document.getElementById('wonders-licence-title');
    const refLicenceDesc = document.getElementById('ref-licence-desc');

    if (refModalTitle) refModalTitle.textContent = isEl ? 'Πηγές & αναφορές' : 'Sources & citations';
    if (refModalDesc) refModalDesc.textContent = isEl ? 'Χρησιμοποιήστε την αναφορά που αντιστοιχεί σε αυτό που παραθέτετε.' : 'Use the reference that matches what you are citing.';
    if (wondersPlatformTitle) wondersPlatformTitle.textContent = isEl ? 'Διαδικτυακή πλατφόρμα' : 'Web platform';
    if (refPlatformDesc) refPlatformDesc.textContent = isEl ? 'Παραθέστε τον διαδραστικό ιστότοπο και τη διεπαφή WebGIS.' : 'Cite the interactive website and interface.';
    if (wondersDatasetTitle) wondersDatasetTitle.textContent = isEl ? 'Πρωτογενείς & αρχαιολογικές πηγές' : 'Primary & archaeological sources';
    if (refDatasetDesc) refDatasetDesc.textContent = isEl ? 'Κλασικά κείμενα, αρχαιολογικά ινστιτούτα και κατάλογοι κληρονομιάς.' : 'Classical texts, archaeological institutes, and heritage registries.';
    if (refDatasetCopy) {
      refDatasetCopy.innerHTML = isEl
        ? 'Οι κλασικές πηγές περιλαμβάνουν την «Ελλάδος Περιήγησιν» του Παυσανία, τις «Ιστορίες» του Ηροδότου, τα «Γεωγραφικά» του Στράβωνα και τη «Φυσική Ιστορία» (<em>Naturalis Historia</em>) του Πλινίου του Πρεσβύτερου. Η αρχαιολογική τεκμηρίωση, οι ανασκαφικές εκθέσεις και τα δελτία συντήρησης προέρχονται από το Υπουργείο Πολιτισμού, το Γερμανικό Αρχαιολογικό Ινστιτούτο (DAI), τη Βρετανική Σχολή Αθηνών (BSA), την Αμερικανική Σχολή Κλασικών Σπουδών στην Αθήνα (ASCSA) και το Κέντρο Παγκόσμιας Κληρονομιάς της UNESCO.'
        : 'Classical sources include Pausanias’s <em>Description of Greece</em> (Ἑλλάδος Περιήγησις), Herodotus’s <em>Histories</em>, Strabo’s <em>Geographica</em>, and Pliny the Elder’s <em>Naturalis Historia</em>. Archaeological documentation, excavation reports, and conservation records are curated from the Hellenic Ministry of Culture, the German Archaeological Institute (DAI), the British School at Athens (BSA), the American School of Classical Studies at Athens (ASCSA), and the UNESCO World Heritage Centre.';
    }
    if (wondersLicenceTitle) wondersLicenceTitle.textContent = isEl ? 'Άδεια χρήσης & επανάχρηση' : 'Licence & reuse';
    if (refLicenceDesc) refLicenceDesc.textContent = isEl ? 'Όροι για το πρωτότυπο περιεχόμενο της πλατφόρμας.' : 'Terms for original platform content.';

    // Submit data modal
    const submitDataTitle = document.getElementById('submit-data-title');
    const submitDataIntroText = document.getElementById('submit-data-intro-text');
    const submitPrepTitle = document.getElementById('submit-prep-title');
    const submitPrepDesc = document.getElementById('submit-prep-desc');
    const submitEmailBtn = document.getElementById('submit-email-btn');
    const submitDataNoteText = document.getElementById('submit-data-note-text');

    if (submitDataTitle) submitDataTitle.textContent = isEl ? 'Υποβολή δεδομένων Αρχαίων Θαυμάτων' : 'Submit Ancient Wonders data';
    if (submitDataIntroText) submitDataIntroText.textContent = isEl
      ? 'Υποβάλετε ένα αρχαίο ελληνικό μνημείο, αρχαιολογικό χώρο ή διόρθωση βασισμένη σε δημοσιευμένη επιστημονική ή αρχαιολογική βιβλιογραφία. Περιγράψτε συντεταγμένες, ιστορική εποχή, τυπολογία και σημερινή κατάσταση.'
      : 'Submit an ancient Greek monument, archaeological site, or a correction supported by published scientific or archaeological literature. Describe coordinates, historical epoch, typology, and present condition.';
    if (submitPrepTitle) submitPrepTitle.textContent = isEl ? 'Προετοιμάστε την υποβολή σας' : 'Prepare your submission';
    if (submitPrepDesc) submitPrepDesc.textContent = isEl
      ? 'Συμπεριλάβετε όνομα μνημείου (δίγλωσσο αν είναι δυνατόν), συντεταγμένες σε WGS84, αρχαία περιοχή, σύγχρονη χώρα, ιστορική εποχή και επιστημονικές παραπομπές (DOI / επίσημη βιβλιογραφία).'
      : 'Include monument name (bilingual if possible), coordinates in WGS84, ancient region, modern country, historical epoch, and peer-reviewed or institutional citations.';
    if (submitEmailBtn) submitEmailBtn.textContent = isEl ? 'Αποστολή υποβολής μέσω email' : 'Send submission by email';
    if (submitDataNoteText) submitDataNoteText.textContent = isEl
      ? 'Οι υποβολές εξετάζονται και επαληθεύονται πριν ενταχθούν στον άτλαντα.'
      : 'Submissions are reviewed and verified before inclusion in the atlas.';

    // Statistics Glossary modal
    const statsGlossaryTitle = document.getElementById('stats-glossary-modal-title');
    const statsGlossaryContent = document.getElementById('stats-glossary-content');
    if (statsGlossaryTitle) statsGlossaryTitle.textContent = isEl ? 'Στατιστικοί Ορισμοί' : 'Statistical Definitions';
    if (statsGlossaryContent) {
      statsGlossaryContent.innerHTML = isEl ? `
        <dl class="stats-glossary-list">
          <dt>Μέγεθος δείγματος (n)</dt>
          <dd>Ο αριθμός των έγκυρων, τεκμηριωμένων μνημείων που εμφανίζονται ή έχουν επιλεγεί στον άτλαντα.</dd>
          <dt>Κατανομή / Συχνότητα</dt>
          <dd>Το σχετικό πλήθος και η αναλογία των μνημείων που ταξινομούνται σε κάθε τυπολογική κατηγορία ή γεωγραφική επικράτεια.</dd>
          <dt>Σημερινή Κατάσταση</dt>
          <dd>Ταξινόμηση σε τέσσερις βασικές καταστάσεις διατήρησης: Όρθιο/αναστηλωμένο (διατηρημένη ανωδομή), Ερείπια/ανασκαμμένο (θεμέλια, στυλοβάτες ή ανασκαφικά κατάλοιπα), Επαναστημένο/ημιτελές (αναστήλωση ή αρχαία ημιτελή έργα) και Χαμένο/βυθισμένο (καταστραμμένο, λιθολογημένο ή υποθαλάσσιο).</dd>
          <dt>Κανονικά Επτά Θαύματα</dt>
          <dd>Τα μνημεία που περιλαμβάνονται στους κλασικούς ελληνιστικούς καταλόγους των Επτά Θαυμάτων του Αρχαίου Κόσμου (Φίλων ο Βυζάντιος, Αντίπατρος ο Σιδώνιος).</dd>
        </dl>
      ` : `
        <dl class="stats-glossary-list">
          <dt>Sample size (n)</dt>
          <dd>The number of valid, documented monuments currently visible or selected.</dd>
          <dt>Distribution / Frequency</dt>
          <dd>The relative count and proportion of monuments classified within each category or geographical region.</dd>
          <dt>Survival Condition</dt>
          <dd>Classification into four primary survival states: Standing/restored (preserved structural elevation), Ruins/excavated (substructure, foundational elements, or column stumps), Re-erected/unfinished (anastylosis or ancient abandoned projects), and Lost/submerged (destroyed, quarried away, or submerged).</dd>
          <dt>Canonical Seven Wonders</dt>
          <dd>The monuments included in classical Hellenistic lists of the Seven Wonders of the Ancient World (Phaedo of Byzantium, Antipater of Sidon).</dd>
        </dl>
      `;
    }

    // Feature guide modal details
    const fgCaption = document.getElementById('feature-guide-caption');
    const fgSource = document.getElementById('feature-guide-source');
    if (fgCaption) {
      fgCaption.innerHTML = isEl
        ? '<span>Ο Παρθενώνας (447–432 π.Χ.) στην Ακρόπολη των Αθηνών.</span><span>Σχεδιασμένος από τον Ικτίνο και τον Καλλικράτη υπό την καλλιτεχνική εποπτεία του Φειδία.</span>'
        : '<span>The Parthenon (447–432 BC) on the Acropolis of Athens, Greece.</span><span>Designed by Ictinus and Callicrates under the artistic direction of Phidias.</span>';
    }
    if (fgSource) {
      fgSource.innerHTML = isEl
        ? 'Επιστημονικές αναφορές: Παυσανίας (<em>Ελλάδος Περιήγησις</em>), Ηρόδοτος (<em>Ιστορίαι</em>), Στράβων (<em>Γεωγραφικά</em>) και Κέντρο Παγκόσμιας Κληρονομιάς UNESCO.'
        : 'Academic references: Pausanias (<em>Description of Greece</em>), Herodotus (<em>Histories</em>), Strabo (<em>Geographica</em>), and UNESCO World Heritage Centre.';
    }

    // SQL filter modal
    const sqlModalTitle = document.querySelector('#sql-filter-modal .modal-header h3');
    const addCondBtn = document.getElementById('add-condition');
    const addGrpBtn = document.getElementById('add-group');
    const queryPrevLabel = document.querySelector('#sql-filter-modal .query-preview label');
    const applySqlBtn = document.getElementById('apply-sql-filter');
    const clearSqlBtn = document.getElementById('clear-sql-filter');
    if (sqlModalTitle) sqlModalTitle.textContent = isEl ? 'Δομητής Ερωτημάτων' : 'Query Builder';
    if (addCondBtn) {
      addCondBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>${isEl ? 'Προσθήκη συνθήκης' : 'Add Condition'}`;
    }
    if (addGrpBtn) {
      addGrpBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>${isEl ? 'Προσθήκη ομάδας' : 'Add Group'}`;
    }
    if (queryPrevLabel) queryPrevLabel.textContent = isEl ? 'Παραγόμενο ερώτημα:' : 'Generated Query:';
    if (applySqlBtn) applySqlBtn.textContent = isEl ? 'Εφαρμογή φίλτρου' : 'Apply Filter';
    if (clearSqlBtn) clearSqlBtn.textContent = isEl ? 'Καθαρισμός όλων' : 'Clear All';

    this.syncUrl();
    if (triggerUpdate) {
      if (this.atlasInterface) {
        this.atlasInterface.setRecords(this.currentRecords);
        this.atlasInterface.filterPanel?.render?.();
        this.atlasInterface.statisticsPanel?.render?.();
      }
      this.updateView();
    }
  }

  syncUrl() {
    const next = serializeUrlState(this.state);
    const query = next ? next.toString() : '';
    history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ancientGreekWonders = new AncientGreekWondersApp();
});
