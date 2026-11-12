import { LANG_DEFAULT, STORAGE_KEY_LANG } from "./config.js";

const DICT = {
  fr: {
    // Navigation & Global UI
    "app.title": "Chimiolab",
    "app.subtitle": "Laboratoire Virtuel de Physique-Chimie",
    "app.author": "Auteur",
    "nav.home": "Accueil",
    "nav.back": "Retour",
    "nav.search": "Rechercher une manipulation...",
    "nav.all": "Toutes les activités",
    "ui.chooseLevel": "Choisissez votre niveau",
    "ui.chooseSubject": "Choisissez votre discipline",
    "ui.chooseTheme": "Choisissez un thème d'apprentissage",
    "ui.experience": "Paillasse d'expérience",
    "ui.measure": "Mesures & Analyses",
    "ui.result": "Résultats & Démarche",
    "ui.yourChoice": "Paramètres de la manipulation",
    "ui.reset": "Réinitialiser la paillasse",
    "ui.printReport": "Exporter le compte-rendu",
    "ui.showSteps": "Afficher la démarche scientifique",
    "ui.hideSteps": "Masquer la démarche",
    "ui.eceMode": "Mode Évaluation (ECE)",
    "ui.freeMode": "Mode Libre",
    "ui.themeDark": "Mode sombre",
    "ui.themeLight": "Mode clair",
    "ui.offlineReady": "Disponible hors-ligne",

    // Niveaux scolaires (BOEN)
    "level.seconde": "Seconde",
    "level.seconde.desc": "Découverte des méthodes et protocoles expérimentaux fondamentaux",
    "level.premiere": "Première Spécialité",
    "level.premiere.desc": "Dosages par étalonnage, spectrophotométrie, optique géométrique et synthèses",
    "level.terminale": "Terminale Spécialité",
    "level.terminale.desc": "Titrages instrumentés (pH, conductimétrie), cinétique, ondes, diffraction et mécanique",

    // Disciplines & Thèmes
    "subject.chimie": "Chimie",
    "subject.chimie.desc": "Transformations de la matière, dosages, équilibres et cinétique",
    "subject.physique": "Physique",
    "subject.physique.desc": "Ondes, signaux, optique, électricité et mécanique",
    "theme.suivi": "Constitution et transformations de la matière",
    "theme.ondes": "Ondes et signaux",
    "theme.mouvement": "Mouvement et interactions",

    // ACTIVITÉ 1 : Titrage pH-métrique et conductimétrique (Terminale)
    "pmat04.title": "Titrage pH-métrique & Conductimétrique",
    "pmat04.desc": "Suivi acido-basique instrumenté avec méthode des tangentes parallèles et dérivée dpH/dV",
    "pmat04.mode": "Type de suivi",
    "pmat04.mode.ph": "pH-métrie seule",
    "pmat04.mode.cond": "Conductimétrie seule",
    "pmat04.mode.both": "Suivi combiné (pH-mètre + Conductimètre)",
    "pmat04.acid": "Acide à doser (solution titrée)",
    "pmat04.acid.ethanoique": "Acide éthanoïque / vinaigre (CH₃COOH, pKa = 4,76)",
    "pmat04.acid.chloro": "Acide chlorhydrique (H₃O⁺ + Cl⁻, acide fort)",
    "pmat04.acid.lactique": "Acide lactique (pKa = 3,86)",
    "pmat04.acid.methanoique": "Acide méthanoïque (pKa = 3,75)",
    "pmat04.volumeSample": "Prise d'essai de la solution titrée (V_a)",
    "pmat04.titrantConc": "Concentration de la solution titrante (NaOH)",
    "pmat04.indicator": "Indicateur coloré optionnel",
    "pmat04.ind.none": "Aucun (titrage instrumenté seul)",
    "pmat04.ind.bbt": "Bleu de bromothymol (virage 6,0 - 7,6 : jaune → vert → bleu)",
    "pmat04.ind.pp": "Phénolphtaléine (virage 8,2 - 10,0 : incolore → rose violacé)",
    "pmat04.ind.helianthine": "Hélianthine / Méthylorange (virage 3,1 - 4,4 : rouge → jaune)",
    "pmat04.drop": "Verser une goutte (0,05 mL)",
    "pmat04.add05": "Verser 0,5 mL",
    "pmat04.add1": "Verser 1,0 mL",
    "pmat04.tap": "Robinet de burette",
    "pmat04.tapOpen": "Ouvrir l'écoulement continu",
    "pmat04.tapClose": "Fermer le robinet",
    "pmat04.measureZero": "Mesurer à V = 0 mL (initial)",
    "pmat04.table.v": "V versé (mL)",
    "pmat04.table.ph": "pH",
    "pmat04.table.deriv": "dpH/dV",
    "pmat04.table.sigma": "Conductivité σ (mS/cm)",
    "pmat04.tools.tangents": "Méthode des tangentes parallèles",
    "pmat04.tools.derivative": "Tracer la courbe dérivée",
    "pmat04.eval.title": "Exploitation pédagogique",
    "pmat04.eval.askVe": "Volume équivalent estimé V_E (mL) :",
    "pmat04.eval.askCa": "Concentration calculée C_a (mol/L) :",
    "pmat04.eval.validate": "Valider mon analyse",
    "pmat04.eval.correct": "Excellente analyse ! Votre valeur de V_E et votre calcul de concentration sont rigoureusement exacts.",
    "pmat04.eval.incorrect": "Attention à la lecture graphique ou au respect des chiffres significatifs. Consultez la démarche détaillée.",

    // ACTIVITÉ 2 : Spectrophotométrie / Beer-Lambert (Première)
    "pmat01.title": "Dosage spectrophotométrique — Loi de Beer-Lambert",
    "pmat01.desc": "Étalonnage d'une gamme de solutions étalons, mesure d'absorbance et dosage d'un inconnu",
    "pmat01.solute": "Espèce chimique colorée",
    "pmat01.solute.kmno4": "Permanganate de potassium (KMnO₄, magenta, λmax = 525 nm)",
    "pmat01.solute.cuso4": "Sulfate de cuivre (CuSO₄, bleu, λmax = 810 nm / filtre 630 nm)",
    "pmat01.solute.e133": "Colorant alimentaire Bleu Brillant E133 (λmax = 630 nm)",
    "pmat01.solute.e102": "Tartrazine jaune E102 (λmax = 427 nm)",
    "pmat01.wavelength": "Longueur d'onde d'analyse (λ)",
    "pmat01.zeroBlank": "Faire le blanc (zéro au solvant)",
    "pmat01.insertCuvette": "Insérer dans la cuve :",
    "pmat01.blank": "Solvant pur (eau distillée)",
    "pmat01.standard": "Solution étalon",
    "pmat01.unknown": "Solution inconnue à doser",
    "pmat01.absorbance": "Absorbance (A)",
    "pmat01.curveTitle": "Droite d'étalonnage A = f(C)",
    "pmat01.measurePoint": "Enregistrer la mesure",
    "pmat01.linearFit": "Régression linéaire (Loi de Beer-Lambert)",
    "pmat01.eval.askC": "Concentration de la solution inconnue (mol/L) :",

    // ACTIVITÉ 3 : Banc d'optique & Lentilles minces convergentes (Première / Seconde)
    "pmat06.title": "Banc d'optique — Lentilles minces convergentes",
    "pmat06.desc": "Formation des images, relation de conjugaison de Descartes et mesure de vergence",
    "pmat06.focal": "Focale de la lentille mince (f')",
    "pmat06.objectPos": "Position de l'objet lumineux (x_A en cm)",
    "pmat06.lensPos": "Position de la lentille (x_O en cm)",
    "pmat06.screenPos": "Position de l'écran (x_A' en cm)",
    "pmat06.autofocus": "Ajuster l'écran pour image nette",
    "pmat06.sharpness": "Netteté de l'image :",
    "pmat06.sharp": "Image parfaitement nette !",
    "pmat06.blurred": "Image floue (hors plan focal image)",
    "pmat06.virtual": "Image virtuelle (non projetable sur écran)",
    "pmat06.gamma": "Grandissement mesuré (γ)",
    "pmat06.conjugaison": "Relation de conjugaison : 1/OA' - 1/OA = 1/f'",

    // ACTIVITÉ 4 : Diffraction de la lumière par un fil ou une fente (Terminale)
    "pmat07.title": "Diffraction de la lumière & Source Laser",
    "pmat07.desc": "Étude de la tache centrale de diffraction, relation θ = λ/a et mesure de diamètre de fil",
    "pmat07.laser": "Source laser monochromatique",
    "pmat07.laser.red": "Laser Rouge (He-Ne / 633 nm)",
    "pmat07.laser.green": "Laser Vert (DPSS / 532 nm)",
    "pmat07.laser.violet": "Laser Violet (Diode / 405 nm)",
    "pmat07.obstacle": "Obstacle diffractant",
    "pmat07.obstacle.slit": "Fente calibrée",
    "pmat07.obstacle.wire": "Fil calibré",
    "pmat07.obstacle.hair": "Cheveu humain inconnu",
    "pmat07.slitWidth": "Largeur de l'obstacle a (µm)",
    "pmat07.distD": "Distance obstacle - écran D (m)",
    "pmat07.spotWidth": "Largeur de la tache centrale L (mm)",
    "pmat07.ruler": "Réglet millimétrique virtuel",
    "pmat07.curveL": "Courbe L = f(1/a)",

    // Rapport & Export
    "report.title": "Compte-rendu de Travaux Pratiques",
    "report.student": "Élève / Binôme",
    "report.date": "Date de manipulation",
    "report.activity": "Intitulé du TP",
    "report.measures": "Tableau des valeurs expérimentales",
    "report.graph": "Tracé graphique expérimental",
    "report.conclusion": "Exploitation didactique et conclusion"
  },
  en: {
    // Navigation & Global UI
    "app.title": "Chimiolab",
    "app.subtitle": "Virtual Physics & Chemistry Laboratory",
    "app.author": "Author",
    "nav.home": "Home",
    "nav.back": "Back",
    "nav.search": "Search an experiment...",
    "nav.all": "All experiments",
    "ui.chooseLevel": "Choose your grade level",
    "ui.chooseSubject": "Choose your subject",
    "ui.chooseTheme": "Choose a learning theme",
    "ui.experience": "Virtual Lab Bench",
    "ui.measure": "Measurements & Analysis",
    "ui.result": "Results & Method",
    "ui.yourChoice": "Experiment Parameters",
    "ui.reset": "Reset lab bench",
    "ui.printReport": "Export lab report",
    "ui.showSteps": "Show scientific method",
    "ui.hideSteps": "Hide method",
    "ui.eceMode": "Evaluation Mode (ECE)",
    "ui.freeMode": "Free Sandbox Mode",
    "ui.themeDark": "Dark mode",
    "ui.themeLight": "Light mode",
    "ui.offlineReady": "Available offline",

    // Grade levels (French Lycée)
    "level.seconde": "10th Grade (Seconde)",
    "level.seconde.desc": "Fundamentals of experimental protocols, solutions and measurement",
    "level.premiere": "11th Grade (Première Spécialité)",
    "level.premiere.desc": "Spectrophotometric calibration, Beer-Lambert law, geometric optics",
    "level.terminale": "12th Grade (Terminale Spécialité)",
    "level.terminale.desc": "Instrumented titrations (pH, conductivity), kinetics, laser diffraction and mechanics",

    // Subjects & Themes
    "subject.chimie": "Chemistry",
    "subject.chimie.desc": "Transformations of matter, titrations, equilibria and kinetics",
    "subject.physique": "Physics",
    "subject.physique.desc": "Waves, signals, optics, electricity and mechanics",
    "theme.suivi": "Constitution and transformations of matter",
    "theme.ondes": "Waves and signals",
    "theme.mouvement": "Movement and interactions",

    // ACTIVITY 1: pH-metric & conductimetric titration
    "pmat04.title": "pH-metric & Conductimetric Titration",
    "pmat04.desc": "Acid-base titration with parallel tangent method and derivative curve dpH/dV",
    "pmat04.mode": "Monitoring mode",
    "pmat04.mode.ph": "pH-metry only",
    "pmat04.mode.cond": "Conductimetry only",
    "pmat04.mode.both": "Combined (pH-meter + Conductimeter)",
    "pmat04.acid": "Titrated acid solution",
    "pmat04.acid.ethanoique": "Acetic / ethanoic acid (CH₃COOH, pKa = 4.76)",
    "pmat04.acid.chloro": "Hydrochloric acid (H₃O⁺ + Cl⁻, strong acid)",
    "pmat04.acid.lactique": "Lactic acid (pKa = 3.86)",
    "pmat04.acid.methanoique": "Methanoic acid (pKa = 3.75)",
    "pmat04.volumeSample": "Sample volume of titrated acid (V_a)",
    "pmat04.titrantConc": "Titrant concentration (NaOH)",
    "pmat04.indicator": "Optional colored indicator",
    "pmat04.ind.none": "None (instrumented only)",
    "pmat04.ind.bbt": "Bromothymol Blue (virage 6.0 - 7.6: yellow → green → blue)",
    "pmat04.ind.pp": "Phenolphthalein (virage 8.2 - 10.0: colorless → pink)",
    "pmat04.ind.helianthine": "Methyl Orange (virage 3.1 - 4.4: red → yellow)",
    "pmat04.drop": "Pour a drop (0.05 mL)",
    "pmat04.add05": "Pour 0.5 mL",
    "pmat04.add1": "Pour 1.0 mL",
    "pmat04.tap": "Burette tap",
    "pmat04.tapOpen": "Start continuous flow",
    "pmat04.tapClose": "Close tap",
    "pmat04.measureZero": "Measure at V = 0 mL (initial)",
    "pmat04.table.v": "Delivered V (mL)",
    "pmat04.table.ph": "pH",
    "pmat04.table.deriv": "dpH/dV",
    "pmat04.table.sigma": "Conductivity σ (mS/cm)",
    "pmat04.tools.tangents": "Parallel tangent method",
    "pmat04.tools.derivative": "Plot derivative curve",
    "pmat04.eval.title": "Student analysis",
    "pmat04.eval.askVe": "Estimated equivalence volume V_E (mL):",
    "pmat04.eval.askCa": "Calculated concentration C_a (mol/L):",
    "pmat04.eval.validate": "Validate my analysis",
    "pmat04.eval.correct": "Excellent analysis! Your equivalence volume and concentration are accurate.",
    "pmat04.eval.incorrect": "Please recheck your graphical reading or significant figures.",

    // ACTIVITY 2: Spectrophotometry (Beer-Lambert)
    "pmat01.title": "Spectrophotometric Assay — Beer-Lambert Law",
    "pmat01.desc": "Calibration curve of standard solutions, absorbance reading and unknown assay",
    "pmat01.solute": "Colored chemical species",
    "pmat01.solute.kmno4": "Potassium permanganate (KMnO₄, magenta, λmax = 525 nm)",
    "pmat01.solute.cuso4": "Copper sulfate (CuSO₄, blue, λmax = 810 nm / 630 nm filter)",
    "pmat01.solute.e133": "Brilliant Blue FCF E133 (λmax = 630 nm)",
    "pmat01.solute.e102": "Tartrazine yellow E102 (λmax = 427 nm)",
    "pmat01.wavelength": "Analysis wavelength (λ)",
    "pmat01.zeroBlank": "Set blank (zero with solvent)",
    "pmat01.insertCuvette": "Insert into cuvette slot:",
    "pmat01.blank": "Pure solvent (distilled water)",
    "pmat01.standard": "Standard solution",
    "pmat01.unknown": "Unknown solution to assay",
    "pmat01.absorbance": "Absorbance (A)",
    "pmat01.curveTitle": "Calibration curve A = f(C)",
    "pmat01.measurePoint": "Record measurement",
    "pmat01.linearFit": "Linear fit (Beer-Lambert law)",
    "pmat01.eval.askC": "Unknown solution concentration (mol/L):",

    // ACTIVITY 3: Optical bench
    "pmat06.title": "Optical Bench — Thin Converging Lenses",
    "pmat06.desc": "Image formation, Descartes conjugate relationship and vergence measurement",
    "pmat06.focal": "Focal length of lens (f')",
    "pmat06.objectPos": "Object position (x_A in cm)",
    "pmat06.lensPos": "Lens position (x_O in cm)",
    "pmat06.screenPos": "Screen position (x_A' in cm)",
    "pmat06.autofocus": "Autofocus screen for sharp image",
    "pmat06.sharpness": "Image sharpness:",
    "pmat06.sharp": "Image perfectly sharp!",
    "pmat06.blurred": "Image blurred (off focal plane)",
    "pmat06.virtual": "Virtual image (cannot project on screen)",
    "pmat06.gamma": "Measured magnification (γ)",
    "pmat06.conjugaison": "Conjugate formula: 1/OA' - 1/OA = 1/f'",

    // ACTIVITY 4: Laser Diffraction
    "pmat07.title": "Laser Light Diffraction",
    "pmat07.desc": "Central diffraction pattern, θ = λ/a relation and wire diameter determination",
    "pmat07.laser": "Monochromatic laser source",
    "pmat07.laser.red": "Red Laser (He-Ne / 633 nm)",
    "pmat07.laser.green": "Green Laser (DPSS / 532 nm)",
    "pmat07.laser.violet": "Violet Laser (Diode / 405 nm)",
    "pmat07.obstacle": "Diffraction obstacle",
    "pmat07.obstacle.slit": "Calibrated slit",
    "pmat07.obstacle.wire": "Calibrated wire",
    "pmat07.obstacle.hair": "Unknown human hair",
    "pmat07.slitWidth": "Obstacle width a (µm)",
    "pmat07.distD": "Obstacle-to-screen distance D (m)",
    "pmat07.spotWidth": "Central spot width L (mm)",
    "pmat07.ruler": "Virtual millimetric ruler",
    "pmat07.curveL": "Plot L = f(1/a)",

    // Report
    "report.title": "Laboratory Practical Work Report",
    "report.student": "Student / Pair",
    "report.date": "Date of experiment",
    "report.activity": "Lab Title",
    "report.measures": "Experimental Data Table",
    "report.graph": "Experimental Graph Plot",
    "report.conclusion": "Didactic Analysis & Conclusion"
  }
};

let currentLang = LANG_DEFAULT;
const listeners = new Set();

export function getLang() { return currentLang; }

export function setLang(lang) {
  currentLang = (lang === "en") ? "en" : "fr";
  try { localStorage.setItem(STORAGE_KEY_LANG, currentLang); } catch (_) {}
  listeners.forEach(fn => { try { fn(currentLang); } catch (_) {} });
}

export function initLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved === "en" || saved === "fr") currentLang = saved;
    else {
      const navLang = navigator.language || "";
      if (navLang.startsWith("en")) currentLang = "en";
    }
  } catch (_) {}
}

export function t(key, fallback = "") {
  return (DICT[currentLang] && DICT[currentLang][key]) ||
         (DICT.fr && DICT.fr[key]) ||
         fallback || key;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
