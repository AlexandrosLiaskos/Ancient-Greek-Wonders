const UNESCO = (id, title = 'UNESCO World Heritage Centre') => ({ title, url: `https://whc.unesco.org/en/list/${id}/` });
const BRITANNICA = (slug, title = 'Encyclopaedia Britannica') => ({ title, url: `https://www.britannica.com/topic/${slug}` });
const CULTURE_GR = { title: 'Hellenic Ministry of Culture', url: 'https://www.culture.gov.gr/' };

export const WONDERS = [
  {
    id: 'statue-zeus-olympia', order: 1,
    name: { en: 'Statue of Zeus at Olympia', el: 'Άγαλμα του Διός στην Ολυμπία' },
    location: { en: 'Olympia, Elis, Greece', el: 'Ολυμπία, Ηλεία, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.6379, lng: 21.6300 }, category: 'monument', status: 'lost', sevenWonder: true,
    period: { en: 'Classical, c. 430 BC', el: 'Κλασική περίοδος, περ. 430 π.Χ.' },
    description: { en: 'Phidias’s colossal seated Zeus, made of gold and ivory over a wooden core, occupied the cella of the Temple of Zeus. The lost cult image was counted among the Seven Wonders.', el: 'Το κολοσσιαίο καθιστό άγαλμα του Δία από τον Φειδία, κατασκευασμένο από χρυσό και ελεφαντόδοντο πάνω σε ξύλινο πυρήνα, βρισκόταν στον σηκό του ναού του Διός. Το χαμένο λατρευτικό άγαλμα συγκαταλεγόταν στα Επτά Θαύματα.' },
    heroImage: '', gallery: [], sources: [BRITANNICA('Statue-of-Zeus')]
  },
  {
    id: 'temple-artemis-ephesus', order: 2,
    name: { en: 'Temple of Artemis at Ephesus', el: 'Ναός της Αρτέμιδος στην Έφεσο' },
    location: { en: 'Ephesus, Selçuk, Türkiye', el: 'Έφεσος, Σελτσούκ, Τουρκία' }, country: 'Türkiye',
    coordinates: { lat: 37.9497, lng: 27.3639 }, category: 'temple', status: 'ruins', sevenWonder: true,
    period: { en: 'Archaic–Hellenistic, 6th–4th c. BC', el: 'Αρχαϊκή–Ελληνιστική περίοδος, 6ος–4ος αι. π.Χ.' },
    description: { en: 'A monumental Ionic dipteral temple rebuilt more than once on a long-established sacred site. Its scale and sculptural decoration made the Artemision one of the Seven Wonders.', el: 'Μνημειακός ιωνικός δίπτερος ναός που ανοικοδομήθηκε περισσότερες από μία φορές σε έναν πανάρχαιο ιερό τόπο. Η κλίμακα και ο γλυπτός του διάκοσμος κατέστησαν το Αρτεμίσιο ένα από τα Επτά Θαύματα.' },
    heroImage: '', gallery: [], sources: [UNESCO(1018, 'UNESCO — Ephesus')]
  },
  {
    id: 'mausoleum-halicarnassus', order: 3,
    name: { en: 'Mausoleum at Halicarnassus', el: 'Μαυσωλείο της Αλικαρνασσού' },
    location: { en: 'Bodrum, Türkiye', el: 'Αλικαρνασσός (Μπόντρουμ), Τουρκία' }, country: 'Türkiye',
    coordinates: { lat: 37.0379, lng: 27.4241 }, category: 'tomb', status: 'ruins', sevenWonder: true,
    period: { en: 'Late Classical, c. 353–350 BC', el: 'Ύστερη κλασική περίοδος, περ. 353–350 π.Χ.' },
    description: { en: 'The dynastic tomb of Mausolus and Artemisia II combined a high podium, Ionic colonnade, stepped roof, and sculptural teams from the Greek world. Its name became the generic word “mausoleum.”', el: 'Ο δυναστικός τάφος του Μαύσωλου και της Αρτεμισίας Β΄ συνδύαζε ψηλό βάθρο, ιωνική κιονοστοιχία, βαθμιδωτή στέγη και γλυπτά από εργαστήρια του ελληνικού κόσμου. Το όνομά του έγινε ο γενικός όρος «μαυσωλείο».' },
    heroImage: '', gallery: [], sources: [BRITANNICA('Mausoleum-of-Halicarnassus')]
  },
  {
    id: 'colossus-rhodes', order: 4,
    name: { en: 'Colossus of Rhodes', el: 'Κολοσσός της Ρόδου' },
    location: { en: 'Rhodes, Greece', el: 'Ρόδος, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 36.4510, lng: 28.2278 }, category: 'monument', status: 'lost', sevenWonder: true,
    period: { en: 'Hellenistic, c. 294–282 BC', el: 'Ελληνιστική περίοδος, περ. 294–282 π.Χ.' },
    description: { en: 'Chares of Lindos created the colossal bronze Helios after Rhodes resisted a siege. Its exact position and appearance remain uncertain; the familiar harbour-straddling pose is a later invention.', el: 'Ο Χάρης ο Λίνδιος δημιούργησε το κολοσσιαίο χάλκινο άγαλμα του Ηλίου μετά την επιτυχή αντίσταση της Ρόδου σε πολιορκία. Η ακριβής θέση και μορφή του παραμένουν άγνωστες· η γνωστή στάση πάνω από την είσοδο του λιμανιού είναι μεταγενέστερη επινόηση.' },
    heroImage: '', gallery: [], sources: [BRITANNICA('Colossus-of-Rhodes')]
  },
  {
    id: 'lighthouse-alexandria', order: 5,
    name: { en: 'Lighthouse of Alexandria (Pharos)', el: 'Φάρος της Αλεξάνδρειας' },
    location: { en: 'Pharos, Alexandria, Egypt', el: 'Φάρος, Αλεξάνδρεια, Αίγυπτος' }, country: 'Egypt',
    coordinates: { lat: 31.2139, lng: 29.8856 }, category: 'engineering', status: 'lost', sevenWonder: true,
    period: { en: 'Early Hellenistic, early 3rd c. BC', el: 'Πρώιμη ελληνιστική περίοδος, αρχές 3ου αι. π.Χ.' },
    description: { en: 'Built under the Ptolemies on Pharos island, the multi-storeyed beacon guided ships into Alexandria’s harbours. Earthquakes ruined it, and the Citadel of Qaitbay later occupied its site.', el: 'Χτισμένος επί Πτολεμαίων στη νήσο Φάρο, ο πολυώροφος πύργος καθοδηγούσε τα πλοία στα λιμάνια της Αλεξάνδρειας. Καταστράφηκε από σεισμούς και στη θέση του ανεγέρθηκε αργότερα το φρούριο του Καΐτ Μπέη.' },
    heroImage: '', gallery: [], sources: [BRITANNICA('lighthouse-of-Alexandria')]
  },
  {
    id: 'theatre-epidaurus', order: 6,
    name: { en: 'Ancient Theatre of Epidaurus', el: 'Αρχαίο Θέατρο Επιδαύρου' },
    location: { en: 'Epidaurus, Argolis, Greece', el: 'Επίδαυρος, Αργολίδα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.5960, lng: 23.0790 }, category: 'theatre', status: 'standing', sevenWonder: false,
    period: { en: 'Late Classical, late 4th c. BC', el: 'Ύστερη κλασική περίοδος, τέλη 4ου αι. π.Χ.' },
    description: { en: 'The exceptionally preserved theatre of the Asklepieion is traditionally associated with Polykleitos the Younger. Its geometry, setting, and clear sound support performances to this day.', el: 'Το εξαιρετικά διατηρημένο θέατρο του Ασκληπιείου αποδίδεται παραδοσιακά στον Πολύκλειτο τον Νεότερο. Η γεωμετρία, το τοπίο και η καθαρότητα του ήχου του επιτρέπουν παραστάσεις μέχρι σήμερα.' },
    heroImage: '', gallery: [], sources: [UNESCO(491, 'UNESCO — Sanctuary of Asklepios at Epidaurus')]
  },
  {
    id: 'temple-apollo-delphi', order: 7,
    name: { en: 'Temple of Apollo at Delphi', el: 'Ναός του Απόλλωνα στους Δελφούς' },
    location: { en: 'Delphi, Phocis, Greece', el: 'Δελφοί, Φωκίδα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 38.4824, lng: 22.5010 }, category: 'temple', status: 'ruins', sevenWonder: false,
    period: { en: 'Classical rebuilding, 4th c. BC', el: 'Κλασική ανοικοδόμηση, 4ος αι. π.Χ.' },
    description: { en: 'The Doric temple at the centre of Apollo’s sanctuary housed the Delphic oracle. The visible remains belong chiefly to the 4th-century BC rebuilding after an earlier temple was destroyed.', el: 'Ο δωρικός ναός στο κέντρο του ιερού του Απόλλωνα στέγαζε το δελφικό μαντείο. Τα ορατά κατάλοιπα ανήκουν κυρίως στην ανοικοδόμηση του 4ου αιώνα π.Χ., μετά την καταστροφή προγενέστερου ναού.' },
    heroImage: '', gallery: [], sources: [UNESCO(393, 'UNESCO — Archaeological Site of Delphi')]
  },
  {
    id: 'akrotiri', order: 8,
    name: { en: 'Settlement of Akrotiri', el: 'Προϊστορικός Οικισμός Ακρωτηρίου' },
    location: { en: 'Santorini, Greece', el: 'Σαντορίνη, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 36.3514, lng: 25.4037 }, category: 'settlement', status: 'excavated', sevenWonder: false,
    period: { en: 'Late Bronze Age, buried in the 17th c. BC', el: 'Ύστερη Εποχή του Χαλκού, καταχώθηκε τον 17ο αι. π.Χ.' },
    description: { en: 'Volcanic deposits preserved a prosperous Aegean town with multi-storeyed buildings, streets, furnishings, and celebrated wall paintings. No bodies have been found, suggesting evacuation before the eruption.', el: 'Οι ηφαιστειακές αποθέσεις διατήρησαν μια ακμαία αιγαιακή πόλη με πολυώροφα κτίρια, δρόμους, εξοπλισμό και περίφημες τοιχογραφίες. Η απουσία σορών υποδηλώνει εκκένωση πριν από την έκρηξη.' },
    heroImage: '', gallery: [], sources: [CULTURE_GR]
  },
  {
    id: 'knossos', order: 9,
    name: { en: 'Palace of Knossos', el: 'Ανάκτορο της Κνωσού' },
    location: { en: 'Heraklion, Crete, Greece', el: 'Ηράκλειο, Κρήτη, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 35.2989, lng: 25.1631 }, category: 'palace', status: 'partly-restored', sevenWonder: false,
    period: { en: 'Minoan, chiefly c. 1700–1450 BC', el: 'Μινωική περίοδος, κυρίως περ. 1700–1450 π.Χ.' },
    description: { en: 'The largest Minoan palatial centre combined courts, magazines, workshops, ceremonial rooms, and sophisticated water systems. Arthur Evans’s extensive modern restorations shape how parts of the site appear today.', el: 'Το μεγαλύτερο μινωικό ανακτορικό κέντρο συνδύαζε αυλές, αποθήκες, εργαστήρια, τελετουργικούς χώρους και προηγμένα συστήματα ύδρευσης. Οι εκτεταμένες νεότερες αποκαταστάσεις του Άρθουρ Έβανς καθορίζουν τη σημερινή εικόνα τμημάτων του χώρου.' },
    heroImage: '', gallery: [], sources: [{ title: 'UNESCO — Minoan Palatial Centres', url: 'https://whc.unesco.org/en/list/1733/' }]
  },
  {
    id: 'parthenon', order: 10,
    name: { en: 'Parthenon', el: 'Παρθενώνας' },
    location: { en: 'Acropolis of Athens, Greece', el: 'Ακρόπολη Αθηνών, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9715, lng: 23.7267 }, category: 'temple', status: 'partly-standing', sevenWonder: false,
    period: { en: 'Classical, 447–432 BC', el: 'Κλασική περίοδος, 447–432 π.Χ.' },
    description: { en: 'The marble Doric temple of Athena Parthenos was designed by Iktinos and Kallikrates under Perikles’s building programme, with Phidias overseeing its sculpture. It later served as church and mosque.', el: 'Ο μαρμάρινος δωρικός ναός της Αθηνάς Παρθένου σχεδιάστηκε από τον Ικτίνο και τον Καλλικράτη στο οικοδομικό πρόγραμμα του Περικλή, με τον Φειδία να επιβλέπει τον γλυπτό διάκοσμο. Αργότερα χρησιμοποιήθηκε ως εκκλησία και τζαμί.' },
    heroImage: '', gallery: [], sources: [UNESCO(404, 'UNESCO — Acropolis, Athens')]
  },
  {
    id: 'olympieion-athens', order: 11,
    name: { en: 'Temple of Olympian Zeus (Olympieion)', el: 'Ναός του Ολυμπίου Διός (Ολυμπιείο)' },
    location: { en: 'Athens, Greece', el: 'Αθήνα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9693, lng: 23.7331 }, category: 'temple', status: 'partly-standing', sevenWonder: false,
    period: { en: 'Archaic foundations; completed AD 131/132', el: 'Αρχαϊκή θεμελίωση· ολοκλήρωση 131/132 μ.Χ.' },
    description: { en: 'Begun under the Peisistratids and completed centuries later by Hadrian, the enormous Corinthian dipteral temple originally carried 104 columns. Fifteen remain standing.', el: 'Άρχισε επί Πεισιστρατιδών και ολοκληρώθηκε αιώνες αργότερα από τον Αδριανό. Ο τεράστιος κορινθιακός δίπτερος ναός διέθετε αρχικά 104 κίονες· δεκαπέντε παραμένουν όρθιοι.' },
    heroImage: '', gallery: [], sources: [CULTURE_GR]
  },
  {
    id: 'hephaestion', order: 12,
    name: { en: 'Temple of Hephaestus (Hephaisteion)', el: 'Ναός του Ηφαίστου (Ηφαιστείο)' },
    location: { en: 'Ancient Agora of Athens, Greece', el: 'Αρχαία Αγορά Αθηνών, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9756, lng: 23.7214 }, category: 'temple', status: 'standing', sevenWonder: false,
    period: { en: 'Classical, mid-5th c. BC', el: 'Κλασική περίοδος, μέσα 5ου αι. π.Χ.' },
    description: { en: 'This unusually complete Doric peripteral temple overlooks the Agora. Its conversion into a Christian church helped preserve its columns, entablature, pediments, and much of its roof.', el: 'Αυτός ο ασυνήθιστα ακέραιος δωρικός περίπτερος ναός δεσπόζει πάνω από την Αγορά. Η μετατροπή του σε χριστιανική εκκλησία συνέβαλε στη διατήρηση των κιόνων, του θριγκού, των αετωμάτων και μεγάλου μέρους της στέγης.' },
    heroImage: '', gallery: [], sources: [CULTURE_GR]
  },
  {
    id: 'erechtheion', order: 13,
    name: { en: 'Erechtheion', el: 'Ερέχθειο' },
    location: { en: 'Acropolis of Athens, Greece', el: 'Ακρόπολη Αθηνών, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9721, lng: 23.7266 }, category: 'temple', status: 'partly-standing', sevenWonder: false,
    period: { en: 'Classical, c. 421–406 BC', el: 'Κλασική περίοδος, περ. 421–406 π.Χ.' },
    description: { en: 'An asymmetrical Ionic building accommodating several ancient cults and a difficult sloping site. Its south porch is carried by six sculpted maidens, the Caryatids; those outside today are replicas.', el: 'Ασύμμετρο ιωνικό οικοδόμημα που στέγαζε πολλές αρχαίες λατρείες σε έντονα επικλινές έδαφος. Η νότια πρόστασή του στηρίζεται σε έξι γλυπτές Κόρες, τις Καρυάτιδες· οι σημερινές εξωτερικές μορφές είναι αντίγραφα.' },
    heroImage: '', gallery: [], sources: [UNESCO(404, 'UNESCO — Acropolis, Athens')]
  },
  {
    id: 'athena-nike', order: 14,
    name: { en: 'Temple of Athena Nike', el: 'Ναός Αθηνάς Νίκης' },
    location: { en: 'Acropolis of Athens, Greece', el: 'Ακρόπολη Αθηνών, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9715, lng: 23.7247 }, category: 'temple', status: 'restored', sevenWonder: false,
    period: { en: 'Classical, c. 427–424 BC', el: 'Κλασική περίοδος, περ. 427–424 π.Χ.' },
    description: { en: 'A compact Ionic amphiprostyle temple designed by Kallikrates on the bastion beside the Propylaea. Its sculpted parapet celebrated victory; the building has been dismantled and reassembled more than once.', el: 'Μικρός ιωνικός αμφιπρόστυλος ναός του Καλλικράτη πάνω στον πύργο δίπλα στα Προπύλαια. Το γλυπτό του θωράκιο εξυμνούσε τη νίκη· το κτίριο έχει αποσυναρμολογηθεί και αναστηλωθεί περισσότερες από μία φορές.' },
    heroImage: '', gallery: [], sources: [UNESCO(404, 'UNESCO — Acropolis, Athens')]
  },
  {
    id: 'poseidon-sounion', order: 15,
    name: { en: 'Temple of Poseidon at Sounion', el: 'Ναός του Ποσειδώνα στο Σούνιο' },
    location: { en: 'Cape Sounion, Attica, Greece', el: 'Ακρωτήριο Σούνιο, Αττική, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.6500, lng: 24.0245 }, category: 'temple', status: 'partly-standing', sevenWonder: false,
    period: { en: 'Classical, c. 444–440 BC', el: 'Κλασική περίοδος, περ. 444–440 π.Χ.' },
    description: { en: 'The marble Doric hexastyle temple occupies a commanding headland above the Aegean sea lanes. It replaced an Archaic predecessor destroyed during the Persian invasion.', el: 'Ο μαρμάρινος δωρικός εξάστυλος ναός δεσπόζει σε ακρωτήριο πάνω από τους θαλάσσιους δρόμους του Αιγαίου. Αντικατέστησε αρχαϊκό προκάτοχο που καταστράφηκε κατά την περσική εισβολή.' },
    heroImage: '', gallery: [], sources: [CULTURE_GR]
  },
  {
    id: 'temple-zeus-olympia', order: 16,
    name: { en: 'Temple of Zeus at Olympia', el: 'Ναός του Διός στην Ολυμπία' },
    location: { en: 'Olympia, Elis, Greece', el: 'Ολυμπία, Ηλεία, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.6383, lng: 21.6302 }, category: 'temple', status: 'ruins', sevenWonder: false,
    period: { en: 'Early Classical, c. 470–457 BC', el: 'Πρώιμη κλασική περίοδος, περ. 470–457 π.Χ.' },
    description: { en: 'The great Doric hexastyle temple by Libon of Elis formed the architectural centre of the sanctuary and housed Phidias’s Statue of Zeus. Earthquakes brought down its massive columns.', el: 'Ο μεγάλος δωρικός εξάστυλος ναός του Λίβωνα του Ηλείου αποτελούσε το αρχιτεκτονικό κέντρο του ιερού και στέγαζε το άγαλμα του Δία από τον Φειδία. Σεισμοί κατέρριψαν τους ογκώδεις κίονές του.' },
    heroImage: '', gallery: [], sources: [UNESCO(517, 'UNESCO — Archaeological Site of Olympia')]
  },
  {
    id: 'temple-hera-olympia', order: 17,
    name: { en: 'Temple of Hera at Olympia', el: 'Ναός της Ήρας στην Ολυμπία' },
    location: { en: 'Olympia, Elis, Greece', el: 'Ολυμπία, Ηλεία, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.6388, lng: 21.6294 }, category: 'temple', status: 'ruins', sevenWonder: false,
    period: { en: 'Archaic, c. 600–590 BC', el: 'Αρχαϊκή περίοδος, περ. 600–590 π.Χ.' },
    description: { en: 'One of the earliest monumental Doric temples, the Heraion preserves evidence for the gradual replacement of wooden columns by stone ones. The modern Olympic flame ceremony takes place nearby.', el: 'Ένας από τους πρωιμότερους μνημειακούς δωρικούς ναούς, το Ηραίο διατηρεί ενδείξεις για τη σταδιακή αντικατάσταση ξύλινων κιόνων με λίθινους. Σε κοντινό σημείο πραγματοποιείται η σύγχρονη τελετή αφής της Ολυμπιακής Φλόγας.' },
    heroImage: '', gallery: [], sources: [UNESCO(517, 'UNESCO — Archaeological Site of Olympia')]
  },
  {
    id: 'apollo-epicurius-bassae', order: 18,
    name: { en: 'Temple of Apollo Epicurius at Bassae', el: 'Ναός Επικουρίου Απόλλωνα στις Βάσσες' },
    location: { en: 'Bassae, Arcadia, Greece', el: 'Βάσσες, Αρκαδία, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.4297, lng: 21.9002 }, category: 'temple', status: 'standing', sevenWonder: false,
    period: { en: 'Classical, late 5th c. BC', el: 'Κλασική περίοδος, τέλη 5ου αι. π.Χ.' },
    description: { en: 'A remote mountain temple remarkable for combining Doric, Ionic, and an early Corinthian capital within one design. A protective shelter now covers the monument during conservation.', el: 'Απομονωμένος ορεινός ναός, αξιοσημείωτος για τον συνδυασμό δωρικού, ιωνικού και ενός πρώιμου κορινθιακού κιονοκράνου στο ίδιο σχέδιο. Σήμερα προστατεύεται από προσωρινό στέγαστρο κατά τις εργασίες συντήρησης.' },
    heroImage: '', gallery: [], sources: [UNESCO(392, 'UNESCO — Temple of Apollo Epicurius at Bassae')]
  },
  {
    id: 'temple-aphaia', order: 19,
    name: { en: 'Temple of Aphaia', el: 'Ναός της Αφαίας' },
    location: { en: 'Aegina, Greece', el: 'Αίγινα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.7543, lng: 23.5330 }, category: 'temple', status: 'partly-standing', sevenWonder: false,
    period: { en: 'Late Archaic, c. 500–490 BC', el: 'Ύστερη αρχαϊκή περίοδος, περ. 500–490 π.Χ.' },
    description: { en: 'The Doric peripteral temple crowns a wooded hill in Aegina. Its celebrated pedimental sculpture marks the transition from Archaic to Early Classical style.', el: 'Ο δωρικός περίπτερος ναός στεφανώνει έναν δασωμένο λόφο της Αίγινας. Τα περίφημα αετωματικά γλυπτά του σηματοδοτούν τη μετάβαση από την αρχαϊκή στην πρώιμη κλασική τέχνη.' },
    heroImage: '', gallery: [], sources: [CULTURE_GR]
  },
  {
    id: 'sanctuary-apollo-delos', order: 20,
    name: { en: 'Sanctuary of Apollo on Delos', el: 'Ιερό του Απόλλωνα στη Δήλο' },
    location: { en: 'Delos, Cyclades, Greece', el: 'Δήλος, Κυκλάδες, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.4009, lng: 25.2674 }, category: 'sanctuary', status: 'ruins', sevenWonder: false,
    period: { en: 'Archaic–Hellenistic', el: 'Αρχαϊκή–Ελληνιστική περίοδος' },
    description: { en: 'The mythic birthplace of Apollo and Artemis became a major pan-Hellenic sanctuary and later a cosmopolitan trading centre. Temples, treasuries, stoas, houses, and mosaics cover the small island.', el: 'Η μυθική γενέτειρα του Απόλλωνα και της Αρτέμιδος εξελίχθηκε σε μεγάλο πανελλήνιο ιερό και αργότερα σε κοσμοπολίτικο εμπορικό κέντρο. Ναοί, θησαυροί, στοές, οικίες και ψηφιδωτά καλύπτουν το μικρό νησί.' },
    heroImage: '', gallery: [], sources: [UNESCO(530, 'UNESCO — Delos')]
  },
  {
    id: 'valley-temples-concordia', order: 21,
    name: { en: 'Valley of the Temples / Temple of Concordia', el: 'Κοιλάδα των Ναών / Ναός της Ομόνοιας' },
    location: { en: 'Agrigento, Sicily, Italy', el: 'Ακράγας, Σικελία, Ιταλία' }, country: 'Italy',
    coordinates: { lat: 37.2907, lng: 13.5924 }, category: 'complex', status: 'standing', sevenWonder: false,
    period: { en: 'Classical, chiefly 5th c. BC', el: 'Κλασική περίοδος, κυρίως 5ος αι. π.Χ.' },
    description: { en: 'The monumental ridge of ancient Akragas preserves a sequence of Doric temples. Concordia, built around 430 BC and later converted into a church, is among the best-preserved Greek temples.', el: 'Η μνημειακή ράχη του αρχαίου Ακράγαντα διατηρεί σειρά δωρικών ναών. Ο ναός της Ομόνοιας, χτισμένος γύρω στο 430 π.Χ. και αργότερα μετατρεμμένος σε εκκλησία, είναι ένας από τους καλύτερα διατηρημένους ελληνικούς ναούς.' },
    heroImage: '', gallery: [], sources: [UNESCO(831, 'UNESCO — Archaeological Area of Agrigento')]
  },
  {
    id: 'hera-paestum', order: 22,
    name: { en: 'Temple of Hera at Paestum', el: 'Ναός της Ήρας στην Ποσειδωνία' },
    location: { en: 'Paestum, Campania, Italy', el: 'Ποσειδωνία (Παίστο), Καμπανία, Ιταλία' }, country: 'Italy',
    coordinates: { lat: 40.4194, lng: 15.0051 }, category: 'temple', status: 'standing', sevenWonder: false,
    period: { en: 'Archaic, c. 560–520 BC', el: 'Αρχαϊκή περίοδος, περ. 560–520 π.Χ.' },
    description: { en: 'The oldest of Paestum’s three great temples is an unusually broad Doric enneastyle building, traditionally called the “Basilica.” Its surviving structure reveals early experiments in western Greek architecture.', el: 'Ο αρχαιότερος από τους τρεις μεγάλους ναούς της Ποσειδωνίας είναι ένα ασυνήθιστα πλατύ δωρικό εννεάστυλο κτίριο, γνωστό παραδοσιακά ως «Βασιλική». Η διατήρησή του φανερώνει πρώιμους πειραματισμούς της δυτικοελληνικής αρχιτεκτονικής.' },
    heroImage: '', gallery: [], sources: [UNESCO(842, 'UNESCO — Paestum and Velia')]
  },
  {
    id: 'poseidon-paestum', order: 23,
    name: { en: '“Temple of Poseidon” at Paestum', el: '«Ναός του Ποσειδώνα» στην Ποσειδωνία' },
    location: { en: 'Paestum, Campania, Italy', el: 'Ποσειδωνία (Παίστο), Καμπανία, Ιταλία' }, country: 'Italy',
    coordinates: { lat: 40.4226, lng: 15.0050 }, category: 'temple', status: 'standing', sevenWonder: false,
    period: { en: 'Classical, c. 460–450 BC', el: 'Κλασική περίοδος, περ. 460–450 π.Χ.' },
    description: { en: 'This exceptionally complete Doric hexastyle temple is often called the Temple of Poseidon, although Hera may have been its deity. Its two-tiered interior colonnade survives with unusual clarity.', el: 'Αυτός ο εξαιρετικά ακέραιος δωρικός εξάστυλος ναός αποκαλείται συχνά ναός του Ποσειδώνα, αν και πιθανότερα ήταν αφιερωμένος στην Ήρα. Η διώροφη εσωτερική κιονοστοιχία σώζεται με ασυνήθιστη πληρότητα.' },
    heroImage: '', gallery: [], sources: [UNESCO(842, 'UNESCO — Paestum and Velia')]
  },
  {
    id: 'temple-e-selinunte', order: 24,
    name: { en: 'Temple E (Hera) at Selinunte', el: 'Ναός Ε (Ήρας) στον Σελινούντα' },
    location: { en: 'Selinunte, Sicily, Italy', el: 'Σελινούντας, Σικελία, Ιταλία' }, country: 'Italy',
    coordinates: { lat: 37.5867, lng: 12.8340 }, category: 'temple', status: 're-erected', sevenWonder: false,
    period: { en: 'Classical, c. 460–450 BC', el: 'Κλασική περίοδος, περ. 460–450 π.Χ.' },
    description: { en: 'Temple E is conventionally attributed to Hera and was re-erected by anastylosis in the 20th century. Its prominent present form must therefore be read as a modern reconstruction from ancient material.', el: 'Ο ναός Ε αποδίδεται συμβατικά στην Ήρα και αναστηλώθηκε με αναστήλωση κατά τον 20ό αιώνα. Η επιβλητική σημερινή μορφή του πρέπει συνεπώς να διαβάζεται ως νεότερη ανασύνθεση αρχαίου υλικού.' },
    heroImage: '', gallery: [], sources: [{ title: 'Sicilian Archaeological Parks — Selinunte', url: 'https://parchiarcheologici.regione.sicilia.it/' }]
  },
  {
    id: 'temple-segesta', order: 25,
    name: { en: 'Doric Temple of Segesta', el: 'Δωρικός Ναός της Σεγέστας' },
    location: { en: 'Segesta, Sicily, Italy', el: 'Σεγέστα, Σικελία, Ιταλία' }, country: 'Italy',
    coordinates: { lat: 37.9416, lng: 12.8325 }, category: 'temple', status: 'unfinished', sevenWonder: false,
    period: { en: 'Late Classical, late 5th c. BC', el: 'Ύστερη κλασική περίοδος, τέλη 5ου αι. π.Χ.' },
    description: { en: 'The remarkably preserved Doric peristyle was never completed: column fluting, cella, and roof are absent, and lifting bosses remain on the blocks. Its patronage and intended cult are still debated.', el: 'Η εντυπωσιακά διατηρημένη δωρική περίσταση δεν ολοκληρώθηκε ποτέ: λείπουν οι ραβδώσεις των κιόνων, ο σηκός και η στέγη, ενώ στους λίθους παραμένουν οι εξοχές ανύψωσης. Η ανάθεση και η προβλεπόμενη λατρεία παραμένουν υπό συζήτηση.' },
    heroImage: '', gallery: [], sources: [{ title: 'Sicilian Archaeological Parks — Segesta', url: 'https://parchiarcheologici.regione.sicilia.it/' }]
  },
  {
    id: 'apollo-didyma', order: 26,
    name: { en: 'Temple of Apollo at Didyma', el: 'Ναός του Απόλλωνα στα Δίδυμα' },
    location: { en: 'Didyma, Aydın, Türkiye', el: 'Δίδυμα, Αϊδίνιο, Τουρκία' }, country: 'Türkiye',
    coordinates: { lat: 37.3847, lng: 27.2566 }, category: 'temple', status: 'ruins', sevenWonder: false,
    period: { en: 'Hellenistic rebuilding, from c. 300 BC', el: 'Ελληνιστική ανοικοδόμηση, από περ. 300 π.Χ.' },
    description: { en: 'The immense Ionic oracle temple was planned with 120 columns, although it was never finished. Monumental stairways and tunnels led to an open-air inner court containing the sacred spring and smaller shrine.', el: 'Ο τεράστιος ιωνικός μαντικός ναός σχεδιάστηκε με 120 κίονες, αλλά δεν ολοκληρώθηκε ποτέ. Μνημειακές κλίμακες και σήραγγες οδηγούσαν σε υπαίθρια εσωτερική αυλή με την ιερή πηγή και μικρότερο ναΐσκο.' },
    heroImage: '', gallery: [], sources: [{ title: 'Turkish Museums — Didyma', url: 'https://www.turkishmuseums.com/' }]
  },
  {
    id: 'athena-polias-priene', order: 27,
    name: { en: 'Temple of Athena Polias at Priene', el: 'Ναός της Αθηνάς Πολιάδος στην Πριήνη' },
    location: { en: 'Priene, Aydın, Türkiye', el: 'Πριήνη, Αϊδίνιο, Τουρκία' }, country: 'Türkiye',
    coordinates: { lat: 37.6592, lng: 27.2970 }, category: 'temple', status: 'ruins', sevenWonder: false,
    period: { en: 'Late Classical, begun c. 350 BC', el: 'Ύστερη κλασική περίοδος, έναρξη περ. 350 π.Χ.' },
    description: { en: 'Designed by Pythius, the Ionic peripteral temple became an influential model of proportion and planning. Alexander the Great helped finance its completion and is named in a surviving dedication.', el: 'Σχεδιασμένος από τον Πύθεο, ο ιωνικός περίπτερος ναός έγινε επιδραστικό πρότυπο αναλογιών και σχεδιασμού. Ο Μέγας Αλέξανδρος συνέβαλε στην ολοκλήρωσή του και αναφέρεται σε σωζόμενη αναθηματική επιγραφή.' },
    heroImage: '', gallery: [], sources: [{ title: 'UNESCO Tentative List — Priene', url: 'https://whc.unesco.org/en/tentativelists/6039/' }]
  },
  {
    id: 'temple-zeus-cyrene', order: 28,
    name: { en: 'Temple of Zeus at Cyrene', el: 'Ναός του Διός στην Κυρήνη' },
    location: { en: 'Cyrene, Libya', el: 'Κυρήνη, Λιβύη' }, country: 'Libya',
    coordinates: { lat: 32.8240, lng: 21.8560 }, category: 'temple', status: 'partly-restored', sevenWonder: false,
    period: { en: 'Greek and Roman phases, from 6th c. BC', el: 'Ελληνικές και ρωμαϊκές φάσεις, από τον 6ο αι. π.Χ.' },
    description: { en: 'One of the largest Doric temples in the Greek world, the sanctuary was repeatedly rebuilt after destruction. Modern anastylosis has re-erected part of its colonnade.', el: 'Ένας από τους μεγαλύτερους δωρικούς ναούς του ελληνικού κόσμου, το ιερό ανοικοδομήθηκε επανειλημμένα μετά από καταστροφές. Νεότερη αναστήλωση έχει επαναφέρει τμήμα της κιονοστοιχίας.' },
    heroImage: '', gallery: [], sources: [UNESCO(190, 'UNESCO — Archaeological Site of Cyrene')]
  },
  {
    id: 'asklepieion-epidaurus', order: 29,
    name: { en: 'Sanctuary of Asclepius at Epidaurus', el: 'Ιερό του Ασκληπιού στην Επίδαυρο' },
    location: { en: 'Epidaurus, Argolis, Greece', el: 'Επίδαυρος, Αργολίδα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.5988, lng: 23.0741 }, category: 'sanctuary', status: 'ruins', sevenWonder: false,
    period: { en: 'Classical–Roman', el: 'Κλασική–Ρωμαϊκή περίοδος' },
    description: { en: 'The foremost healing sanctuary of Asclepius combined ritual, incubation, bathing, exercise, and performance. It reflects ancient Greek healing practice, but should not be described as institutionally linked to Hippocrates.', el: 'Το σημαντικότερο θεραπευτικό ιερό του Ασκληπιού συνδύαζε τελετουργία, εγκοίμηση, λουτρά, άσκηση και θέαμα. Αντανακλά την αρχαία ελληνική θεραπευτική πρακτική, χωρίς να τεκμηριώνεται θεσμικός δεσμός με τον Ιπποκράτη.' },
    heroImage: '', gallery: [], sources: [UNESCO(491, 'UNESCO — Sanctuary of Asklepios at Epidaurus')]
  },
  {
    id: 'mycenae', order: 30,
    name: { en: 'Mycenae', el: 'Μυκήνες' },
    location: { en: 'Argolis, Greece', el: 'Αργολίδα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.7308, lng: 22.7560 }, category: 'citadel', status: 'ruins', sevenWonder: false,
    period: { en: 'Late Bronze Age, chiefly 16th–12th c. BC', el: 'Ύστερη Εποχή του Χαλκού, κυρίως 16ος–12ος αι. π.Χ.' },
    description: { en: 'The fortified centre gave its name to Mycenaean civilisation. Cyclopean walls, the Lion Gate, Grave Circles, palace remains, and nearby tholos tombs—including the Treasury of Atreus—express elite power and long-distance connections.', el: 'Το οχυρωμένο κέντρο έδωσε το όνομά του στον μυκηναϊκό πολιτισμό. Τα κυκλώπεια τείχη, η Πύλη των Λεόντων, οι Ταφικοί Κύκλοι, το ανάκτορο και οι γειτονικοί θολωτοί τάφοι—μεταξύ τους ο Θησαυρός του Ατρέως—εκφράζουν την ισχύ και τις μακρινές διασυνδέσεις της ελίτ.' },
    heroImage: '', gallery: [], sources: [UNESCO(941, 'UNESCO — Mycenae and Tiryns')]
  },
  {
    id: 'olympia-sanctuary-stadium', order: 31,
    name: { en: 'Sanctuary and Stadium of Olympia', el: 'Ιερό και Στάδιο της Ολυμπίας' },
    location: { en: 'Olympia, Elis, Greece', el: 'Ολυμπία, Ηλεία, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.6386, lng: 21.6346 }, category: 'complex', status: 'ruins', sevenWonder: false,
    period: { en: 'Archaic–Roman', el: 'Αρχαϊκή–Ρωμαϊκή περίοδος' },
    description: { en: 'Olympia developed around the sanctuary of Zeus and hosted the Panhellenic Olympic Games at four-year intervals. The stadium, temples, training buildings, treasuries, and civic facilities document the festival’s religious and athletic life.', el: 'Η Ολυμπία αναπτύχθηκε γύρω από το ιερό του Δία και φιλοξενούσε τους πανελλήνιους Ολυμπιακούς Αγώνες ανά τετραετία. Το στάδιο, οι ναοί, τα γυμναστικά κτίρια, οι θησαυροί και οι δημόσιες εγκαταστάσεις τεκμηριώνουν τη θρησκευτική και αθλητική ζωή της γιορτής.' },
    heroImage: '', gallery: [], sources: [UNESCO(517, 'UNESCO — Archaeological Site of Olympia')]
  },
  {
    id: 'delphi-sanctuary', order: 32,
    name: { en: 'Archaeological Sanctuary of Delphi', el: 'Αρχαιολογικό Ιερό των Δελφών' },
    location: { en: 'Delphi, Phocis, Greece', el: 'Δελφοί, Φωκίδα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 38.4819, lng: 22.5012 }, category: 'complex', status: 'ruins', sevenWonder: false,
    period: { en: 'Archaic–Roman', el: 'Αρχαϊκή–Ρωμαϊκή περίοδος' },
    description: { en: 'Set beneath Mount Parnassus, Delphi includes Apollo’s sanctuary, treasuries, theatre, stadium, sacred way, Castalian spring, and the sanctuary of Athena Pronaia with its celebrated Tholos.', el: 'Χτισμένοι κάτω από τον Παρνασσό, οι Δελφοί περιλαμβάνουν το ιερό του Απόλλωνα, θησαυρούς, θέατρο, στάδιο, Ιερά Οδό, Κασταλία πηγή και το ιερό της Αθηνάς Προναίας με την περίφημη Θόλο.' },
    heroImage: '', gallery: [], sources: [UNESCO(393, 'UNESCO — Archaeological Site of Delphi')]
  },
  {
    id: 'athenian-agora', order: 33,
    name: { en: 'Athenian Agora', el: 'Αρχαία Αγορά Αθηνών' },
    location: { en: 'Athens, Greece', el: 'Αθήνα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9753, lng: 23.7220 }, category: 'civic', status: 'ruins', sevenWonder: false,
    period: { en: 'Archaic–Roman', el: 'Αρχαϊκή–Ρωμαϊκή περίοδος' },
    description: { en: 'The civic and commercial centre of ancient Athens contained assembly, administrative, judicial, religious, and market buildings. The restored Stoa of Attalos houses the site museum, while the Hephaisteion survives above it.', el: 'Το πολιτικό και εμπορικό κέντρο της αρχαίας Αθήνας περιλάμβανε χώρους συνέλευσης, διοίκησης, δικαιοσύνης, λατρείας και αγοράς. Η αναστηλωμένη Στοά του Αττάλου στεγάζει το μουσείο, ενώ ψηλότερα διατηρείται το Ηφαιστείο.' },
    heroImage: '', gallery: [], sources: [{ title: 'American School of Classical Studies — Athenian Agora Excavations', url: 'https://www.agathe.gr/' }]
  },
  {
    id: 'odeon-herodes-atticus', order: 34,
    name: { en: 'Odeon of Herodes Atticus', el: 'Ωδείο Ηρώδου του Αττικού' },
    location: { en: 'Athens, Greece', el: 'Αθήνα, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9708, lng: 23.7246 }, category: 'theatre', status: 'restored', sevenWonder: false,
    period: { en: 'Roman, AD 161', el: 'Ρωμαϊκή περίοδος, 161 μ.Χ.' },
    description: { en: 'Herodes Atticus built the roofed odeon on the south slope of the Acropolis in memory of his wife Regilla. Its modern seating and stage restoration support major performances, while the ancient façade remains prominent.', el: 'Ο Ηρώδης Αττικός έκτισε το στεγασμένο ωδείο στη νότια κλιτύ της Ακρόπολης στη μνήμη της συζύγου του Ρήγιλλας. Οι νεότερες επεμβάσεις σε κοίλο και σκηνή επιτρέπουν μεγάλες παραστάσεις, ενώ η αρχαία πρόσοψη παραμένει κυρίαρχη.' },
    heroImage: '', gallery: [], sources: [UNESCO(404, 'UNESCO — Acropolis, Athens')]
  },
  {
    id: 'propylaea-athens', order: 35,
    name: { en: 'Propylaea of the Acropolis', el: 'Προπύλαια της Ακρόπολης' },
    location: { en: 'Acropolis of Athens, Greece', el: 'Ακρόπολη Αθηνών, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9717, lng: 23.7250 }, category: 'gateway', status: 'partly-standing', sevenWonder: false,
    period: { en: 'Classical, 437–432 BC', el: 'Κλασική περίοδος, 437–432 π.Χ.' },
    description: { en: 'Mnesikles designed the monumental marble entrance to negotiate the Acropolis’s steep terrain and multiple routes. Work stopped during the Peloponnesian War, leaving the ambitious complex incomplete.', el: 'Ο Μνησικλής σχεδίασε τη μνημειακή μαρμάρινη είσοδο ώστε να αντιμετωπίσει το απότομο έδαφος και τις πολλαπλές διαδρομές της Ακρόπολης. Οι εργασίες διακόπηκαν κατά τον Πελοποννησιακό Πόλεμο, αφήνοντας το φιλόδοξο συγκρότημα ημιτελές.' },
    heroImage: '', gallery: [], sources: [UNESCO(404, 'UNESCO — Acropolis, Athens')]
  },
  {
    id: 'tunnel-eupalinos', order: 36,
    name: { en: 'Tunnel of Eupalinos', el: 'Ευπαλίνειο Όρυγμα' },
    location: { en: 'Pythagoreion, Samos, Greece', el: 'Πυθαγόρειο, Σάμος, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.6906, lng: 26.9336 }, category: 'engineering', status: 'standing', sevenWonder: false,
    period: { en: 'Archaic, 6th c. BC', el: 'Αρχαϊκή περίοδος, 6ος αι. π.Χ.' },
    description: { en: 'A 1,036-metre aqueduct tunnel driven through Mount Kastro from both ends and joined underground. Herodotus named its engineer, Eupalinos of Megara, making it a landmark of ancient surveying and hydraulic engineering.', el: 'Υδραγωγική σήραγγα μήκους 1.036 μέτρων διανοίχθηκε μέσα στο όρος Κάστρο ταυτόχρονα από δύο μέτωπα που συναντήθηκαν στο υπέδαφος. Ο Ηρόδοτος κατονομάζει τον μηχανικό Ευπαλίνο τον Μεγαρέα, καθιστώντας το έργο ορόσημο της αρχαίας τοπογραφίας και υδραυλικής.' },
    heroImage: '', gallery: [], sources: [UNESCO(595, 'UNESCO — Pythagoreion and Heraion of Samos')]
  },
  {
    id: 'diolkos', order: 37,
    name: { en: 'Diolkos', el: 'Δίολκος' },
    location: { en: 'Isthmus of Corinth, Greece', el: 'Ισθμός της Κορίνθου, Ελλάδα' }, country: 'Greece',
    coordinates: { lat: 37.9312, lng: 22.9933 }, category: 'engineering', status: 'ruins', sevenWonder: false,
    period: { en: 'Archaic, probably 6th c. BC', el: 'Αρχαϊκή περίοδος, πιθανότατα 6ος αι. π.Χ.' },
    description: { en: 'The paved trackway across the Corinthian Isthmus allowed wheeled carriers to move vessels or cargo between the Saronic and Corinthian gulfs. Surviving sections preserve wheel grooves and engineered surfaces.', el: 'Ο λιθόστρωτος δρόμος πάνω από τον Ισθμό της Κορίνθου επέτρεπε σε τροχοφόρα οχήματα να μεταφέρουν πλοία ή φορτία μεταξύ Σαρωνικού και Κορινθιακού κόλπου. Σωζόμενα τμήματα διατηρούν αυλακώσεις τροχών και διαμορφωμένες επιφάνειες.' },
    heroImage: '', gallery: [], sources: [CULTURE_GR]
  }
];
