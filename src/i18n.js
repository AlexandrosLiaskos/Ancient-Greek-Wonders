const UI = {
  en: {
    explore: 'Explore', searchTab: 'Search', about: 'About', search: 'Search monuments',
    searchHint: 'Name, place, period, or description…', filters: 'Filters', category: 'Type',
    country: 'Modern country', status: 'Survival', all: 'All', sevenOnly: 'Seven Wonders only',
    reset: 'Reset', results: 'monuments shown', noResults: 'No monuments match these filters.',
    resetFilters: 'Show all monuments', mapUnavailable: 'The interactive map is unavailable. Open the catalog to browse all monuments.',
    sources: 'Sources', representative: 'Representative location', period: 'Period', missingImage: 'Image reserved',
    missingImageHelp: 'Select a licensed source in media/manifest.json and run npm run build:media.',
    close: 'Close', openDetails: 'Open details', viewOnMap: 'View on map', removeFilter: 'Remove filter', canonical: 'One of the Seven Wonders',
    methodology: 'Methodology', methodologyText: 'Coordinates identify the archaeological site or the commonly accepted historical location. They do not claim an exact footprint for lost monuments. Dates marked “c.” are approximate.',
    imagePolicy: 'Every hero image is stored locally and linked to its creator, source page, and reusable license.',
    mediaType_artwork: 'Historic artwork', mediaType_engraving: 'Historic engraving', mediaType_model: 'Scale model', mediaType_reconstruction: 'Scholarly reconstruction',
    dataNote: 'A bilingual geographic catalog of 37 monuments across the ancient Greek world.',
    language: 'ΕΛ', languageLabel: 'ΕΛ — Switch to Greek', basemap: 'Basemap', list: 'Catalog', openCatalog: 'Open catalog', closeCatalog: 'Close catalog',
    sections: 'Sections', catalogControls: 'Catalog controls', mapLabel: 'Map of ancient Greek wonders',
    skipToMap: 'Skip to map', legendLabel: 'Map legend', mastheadKicker: 'Ἑλληνικὰ θαύματα · Mediterranean atlas',
    metaDescription: 'A bilingual interactive atlas of 37 wonders of the ancient Greek world.',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', mapLayers: 'Map layers'
  },
  el: {
    explore: 'Εξερεύνηση', searchTab: 'Αναζήτηση', about: 'Σχετικά', search: 'Αναζήτηση μνημείων',
    searchHint: 'Όνομα, τόπος, περίοδος ή περιγραφή…', filters: 'Φίλτρα', category: 'Τύπος',
    country: 'Σύγχρονη χώρα', status: 'Κατάσταση διατήρησης', all: 'Όλα', sevenOnly: 'Μόνο τα Επτά Θαύματα',
    reset: 'Επαναφορά', results: 'μνημεία εμφανίζονται', noResults: 'Κανένα μνημείο δεν αντιστοιχεί στα φίλτρα.',
    resetFilters: 'Εμφάνιση όλων', mapUnavailable: 'Ο διαδραστικός χάρτης δεν είναι διαθέσιμος. Άνοιξε τον κατάλογο για να δεις όλα τα μνημεία.',
    sources: 'Πηγές', representative: 'Ενδεικτική θέση', period: 'Περίοδος', missingImage: 'Δεσμευμένη θέση εικόνας',
    missingImageHelp: 'Επίλεξε αδειοδοτημένη πηγή στο media/manifest.json και εκτέλεσε npm run build:media.',
    close: 'Κλείσιμο', openDetails: 'Άνοιγμα πληροφοριών', viewOnMap: 'Προβολή στον χάρτη', removeFilter: 'Αφαίρεση φίλτρου', canonical: 'Ένα από τα Επτά Θαύματα',
    methodology: 'Μεθοδολογία', methodologyText: 'Οι συντεταγμένες προσδιορίζουν τον αρχαιολογικό χώρο ή την κοινώς αποδεκτή ιστορική θέση. Δεν δηλώνουν ακριβές αποτύπωμα για χαμένα μνημεία. Οι χρονολογίες με «περ.» είναι κατά προσέγγιση.',
    imagePolicy: 'Κάθε κεντρική εικόνα αποθηκεύεται τοπικά και συνδέεται με τον δημιουργό, την πηγή και την άδεια επανάχρησης.',
    mediaType_artwork: 'Ιστορική απεικόνιση', mediaType_engraving: 'Ιστορικό χαρακτικό', mediaType_model: 'Μακέτα', mediaType_reconstruction: 'Επιστημονική αναπαράσταση',
    dataNote: 'Δίγλωσσος γεωγραφικός κατάλογος 37 μνημείων του αρχαίου ελληνικού κόσμου.',
    language: 'EN', languageLabel: 'EN — Μετάβαση στα Αγγλικά', basemap: 'Υπόβαθρο', list: 'Κατάλογος', openCatalog: 'Άνοιγμα καταλόγου', closeCatalog: 'Κλείσιμο καταλόγου',
    sections: 'Ενότητες', catalogControls: 'Χειριστήρια καταλόγου', mapLabel: 'Χάρτης των θαυμάτων του αρχαίου ελληνικού κόσμου',
    skipToMap: 'Μετάβαση στον χάρτη', legendLabel: 'Υπόμνημα χάρτη', mastheadKicker: 'Ἑλληνικὰ θαύματα · Μεσογειακός άτλας',
    metaDescription: 'Δίγλωσσος διαδραστικός άτλας 37 θαυμάτων του αρχαίου ελληνικού κόσμου.',
    zoomIn: 'Μεγέθυνση', zoomOut: 'Σμίκρυνση', mapLayers: 'Επίπεδα χάρτη'
  }
};

export const CATEGORY_LABELS = {
  monument: { en: 'Colossal monument', el: 'Κολοσσιαίο μνημείο' }, temple: { en: 'Temple', el: 'Ναός' },
  tomb: { en: 'Tomb', el: 'Τάφος' }, engineering: { en: 'Engineering', el: 'Μηχανική' },
  theatre: { en: 'Theatre', el: 'Θέατρο' }, settlement: { en: 'Settlement', el: 'Οικισμός' },
  palace: { en: 'Palace', el: 'Ανάκτορο' }, sanctuary: { en: 'Sanctuary', el: 'Ιερό' },
  complex: { en: 'Archaeological complex', el: 'Αρχαιολογικό σύνολο' }, citadel: { en: 'Citadel', el: 'Ακρόπολη' },
  civic: { en: 'Civic space', el: 'Δημόσιος χώρος' }, gateway: { en: 'Monumental gateway', el: 'Μνημειακή πύλη' }
};

export const STATUS_LABELS = {
  lost: { en: 'Lost', el: 'Χαμένο' }, ruins: { en: 'Ruins', el: 'Ερείπια' }, standing: { en: 'Standing', el: 'Όρθιο' },
  'partly-standing': { en: 'Partly standing', el: 'Μερικώς όρθιο' }, restored: { en: 'Restored', el: 'Αναστηλωμένο' },
  'partly-restored': { en: 'Partly restored', el: 'Μερικώς αναστηλωμένο' }, excavated: { en: 'Excavated', el: 'Ανασκαμμένο' },
  're-erected': { en: 'Re-erected', el: 'Επαναστημένο' }, unfinished: { en: 'Unfinished', el: 'Ημιτελές' }
};

export const COUNTRY_LABELS = {
  Greece: { en: 'Greece', el: 'Ελλάδα' }, Türkiye: { en: 'Türkiye', el: 'Τουρκία' }, Egypt: { en: 'Egypt', el: 'Αίγυπτος' },
  Italy: { en: 'Italy', el: 'Ιταλία' }, Libya: { en: 'Libya', el: 'Λιβύη' }
};

export function t(language, key) {
  return UI[language]?.[key] ?? UI.en[key] ?? key;
}

export function formatResultCount(language, count) {
  if (language === 'el') return count === 1 ? 'Εμφανίζεται 1 μνημείο' : `Εμφανίζονται ${count} μνημεία`;
  return `${count} ${count === 1 ? 'monument' : 'monuments'} shown`;
}

export function formatClusterCount(language, count) {
  return `${count} ${language === 'el' ? 'μνημεία' : count === 1 ? 'monument' : 'monuments'}`;
}

export function localizeRecord(record, language) {
  return {
    ...record,
    name: record.name[language], location: record.location[language],
    description: record.description[language], period: record.period[language],
    categoryLabel: CATEGORY_LABELS[record.category]?.[language] ?? record.category,
    statusLabel: STATUS_LABELS[record.status]?.[language] ?? record.status,
    countryLabel: COUNTRY_LABELS[record.country]?.[language] ?? record.country
  };
}
