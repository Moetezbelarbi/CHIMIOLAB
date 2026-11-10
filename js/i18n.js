import { LANG_DEFAULT, STORAGE_KEY_LANG } from "./config.js";

const DICT = {
  fr: {
    "app.title": "Chimiolab",
    "nav.back": "Retour",
    "ui.chooseLevel": "Choisis ton niveau",
    "ui.chooseSubject": "Choisis ta matière",
    "ui.chooseTheme": "Choisis un thème",
    "ui.chooseActivity": "Choisis une activité",
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
    "pmat04.title": "Titrage pH-métrique",
    "pmat04.input.cacid": "Concentration de l'acide",
    "pmat04.answer.ve": "Volume équivalent",
    "status.correct": "Correct"
  },
  en: {
    "app.title": "Chimiolab",
    "nav.back": "Back",
    "ui.chooseLevel": "Choose your level",
    "ui.chooseSubject": "Choose your subject",
    "ui.chooseTheme": "Choose a theme",
    "ui.chooseActivity": "Choose an activity",
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
    "pmat04.title": "pH-metric titration",
    "pmat04.input.cacid": "Acid concentration",
    "pmat04.answer.ve": "Equivalence volume",
    "status.correct": "Correct"
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
export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
