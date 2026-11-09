import * as pmat04 from "./activities/pmat04_titrage_ph.js";

export const ACTIVITIES = new Map();
function register(mod) {
  if (!mod || !mod.id || typeof mod.mount !== "function") throw new Error("Activité invalide: " + (mod && mod.id));
  ACTIVITIES.set(mod.id, mod);
}
[pmat04].forEach(m => { if (m && m.id) register(m); });

export function getActivity(id) { return ACTIVITIES.get(id) || null; }
export function listActivities() {
  return Array.from(ACTIVITIES.values()).map(a => ({
    id: a.id, level: a.level, domain: a.domain, theme: a.theme, titleKey: a.titleKey
  }));
}
