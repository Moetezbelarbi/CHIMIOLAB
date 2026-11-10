import { LANG_DEFAULT, STORAGE_KEY_LANG } from "./config.js";

const DICT = {
  fr: {
    "app.title": "Chimiolab",
    "nav.back": "Retour",
    "ui.chooseLevel": "Choisis ton niveau",
    "ui.chooseSubject": "Choisis ta matière",
    "ui.chooseTheme": "Choisis un thème",
    "ui.experience": "Expérience",
    "ui.measure": "Mesurer",
    "ui.result": "Résultat",
    "ui.yourChoice": "Ton choix",
    "ui.randomize": "Nouvelle situation",
    "ui.showSteps": "Voir la démarche",
    "ui.hideSteps": "Masquer la démarche",
    "level.premiere": "Première",
    "level.terminale": "Terminale",
    "subject.chimie": "Chimie",
    "subject.physique": "Physique",
    "theme.suivi": "Suivi de l'évolution d'un système",
    
    // Titrage pH-métrique
    "pmat04.title": "Titrage pH-métrique",
    "pmat04.input.cacid": "Concentration de la solution titrée (acide acétique)",
    "pmat04.input.vacid": "Volume de solution titrée (prise d'essai)",
    "pmat04.input.cbase": "Concentration du titrant (soude)",
    "pmat04.robinet": "Robinet de la burette",
    "pmat04.open": "Ouvrir",
    "pmat04.close": "Fermer",
    "pmat04.addDrop": "Ajouter une goutte (0,05 mL)",
    "pmat04.add1mL": "Verser 1 mL",
    "pmat04.add5mL": "Verser 5 mL",
    "pmat04.reset": "Vider la burette / Recommencer",
    "pmat04.table.title": "Tableau de valeurs",
    "pmat04.table.volume": "V versé (mL)",
    "pmat04.table.pH": "pH mesuré",
    "pmat04.table.deriv": "ΔpH/ΔV",
    "pmat04.table.empty": "Aucune mesure pour l'instant. Ouvre le robinet pour commencer.",
    "pmat04.print": "Imprimer le compte-rendu",
    "pmat04.answer.ve": "Volume équivalent V_E",
    "pmat04.answer.conc": "Concentration de la solution titrée",
    "pmat04.finished": "Titrage terminé. Méthode des tangentes tracée.",
    "pmat04.print.title": "Compte rendu - Titrage pH-métrique",
    "pmat04.print.calc": "Calcul de la concentration",
    "pmat04.print.result": "La concentration de la solution titrée est de",

    // À venir (Titrage colorimétrique, conductimétrique, spectro...)
    "pmat01.title": "Dosage par étalonnage spectrophotométrique",
    "pmat02.title": "Dosage par étalonnage conductimétrique",
    "pmat03.title": "Titrage colorimétrique",
    "pmat05.title": "Titrage conductimétrique"
  },
  en: {
    "app.title": "Chimiolab",
    "nav.back": "Back",
    "ui.chooseLevel": "Choose your level",
    "ui.chooseSubject": "Choose your subject",
    "ui.chooseTheme": "Choose a theme",
    "ui.experience": "Experiment",
    "ui.measure": "Measure",
    "ui.result": "Result",
    "ui.yourChoice": "Your choice",
    "ui.randomize": "New situation",
    "ui.showSteps": "Show steps",
    "ui.hideSteps": "Hide steps",
    "level.premiere": "Première",
    "level.terminale": "Terminale",
    "subject.chimie": "Chemistry",
    "subject.physique": "Physics",
    "theme.suivi": "Following a system's evolution",
    
    // pH-metric titration
    "pmat04.title": "pH-metric titration",
    "pmat04.input.cacid": "Titrated solution concentration (acetic acid)",
    "pmat04.input.vacid": "Titrated solution volume (sample)",
    "pmat04.input.cbase": "Titrant concentration (sodium hydroxide)",
    "pmat04.robinet": "Burette tap",
    "pmat04.open": "Open",
    "pmat04.close": "Close",
    "pmat04.addDrop": "Add a drop (0.05 mL)",
    "pmat04.add1mL": "Pour 1 mL",
    "pmat04.add5mL": "Pour 5 mL",
    "pmat04.reset": "Empty burette / Restart",
    "pmat04.table.title": "Data table",
    "pmat04.table.volume": "V delivered (mL)",
    "pmat04.table.pH": "Measured pH",
    "pmat04.table.deriv": "ΔpH/ΔV",
    "pmat04.table.empty": "No measurement yet. Open the tap to start.",
    "pmat04.print": "Print report",
    "pmat04.answer.ve": "Equivalence volume V_E",
    "pmat04.answer.conc": "Titrated solution concentration",
    "pmat04.finished": "Titration complete. Tangent method drawn.",
    "pmat04.print.title": "Report - pH-metric titration",
    "pmat04.print.calc": "Concentration calculation",
    "pmat04.print.result": "The titrated solution concentration is",

    // Upcoming
    "pmat01.title": "Spectrophotometric calibration",
    "pmat02.title": "Conductimetric calibration",
    "pmat03.title": "Colorimetric titration",
    "pmat05.title": "Conductimetric titration"
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
  } catch (_) {}
}

export function t(key) {
  return (DICT[currentLang] && DICT[currentLang][key]) || (DICT.fr[key]) || key;
}

export function onLangChange(fn) { 
  listeners.add(fn); 
  return () => listeners.delete(fn); 
}
