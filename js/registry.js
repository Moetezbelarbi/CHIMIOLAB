import * as pmat04 from "./activities/pmat04_titrage_ph.js";
import * as pmat01 from "./activities/pmat01_spectro.js";
import * as pmat06 from "./activities/pmat06_optique.js";
import * as pmat07 from "./activities/pmat07_diffraction.js";

export const ACTIVITIES = new Map();

function register(mod) {
  if (!mod || !mod.id || typeof mod.mount !== "function") {
    throw new Error("Activité invalide : " + (mod && mod.id));
  }
  ACTIVITIES.set(mod.id, mod);
}

[pmat04, pmat01, pmat06, pmat07].forEach(m => {
  if (m && m.id) register(m);
});

export function getActivity(id) {
  return ACTIVITIES.get(id) || null;
}

export function listActivities() {
  return Array.from(ACTIVITIES.values()).map(a => ({
    id: a.id,
    level: a.level,
    domain: a.domain,
    theme: a.theme,
    titleKey: a.titleKey,
    descKey: a.id + ".desc"
  }));
}
