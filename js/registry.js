import * as pmat01 from "./activities/matiere/pmat01_spectro.js";
import * as pmat02 from "./activities/matiere/pmat02_conducto_etalonnage.js";
import * as pmat03 from "./activities/matiere/pmat03_titrage_colorimetrique.js";
import * as pmat04 from "./activities/matiere/pmat04_titrage_ph.js";
import * as pmat05 from "./activities/matiere/pmat05_titrage_conducto.js";
import * as pmat06 from "./activities/matiere/pmat06_dissolution_dilution.js";
import * as pmou02 from "./activities/mouvement/pmou02_boyle.js";
import * as pmou04 from "./activities/mouvement/pmou04_chute_libre.js";
import * as pond01 from "./activities/ondes/p_ond01_diffraction.js";
import * as pond02 from "./activities/ondes/p_ond02_interferences.js";
import * as pond03 from "./activities/ondes/p_ond03_doppler.js";
import * as pond04 from "./activities/ondes/p_ond04_lentille.js";
import * as pond05 from "./activities/ondes/p_ond05_lunette.js";
import * as tmat01 from "./activities/matiere/tmat01_acide_faible.js";
import * as tmat02 from "./activities/matiere/tmat02_tampon.js";
import * as tmat03 from "./activities/matiere/tmat03_pile.js";
import * as tmat04 from "./activities/matiere/tmat04_cinetique.js";
import * as tmat05 from "./activities/matiere/tmat05_radioactivite.js";
import * as tmou01 from "./activities/mouvement/tmou01_newton_euler.js";
import * as tmou02 from "./activities/mouvement/tmou02_champ_electrique.js";
import * as tene01 from "./activities/energie/tene01_rc.js";
import * as tene02 from "./activities/energie/tene02_thermique.js";
import * as tond01 from "./activities/ondes/tond01_photoelectrique.js";
import * as tond02 from "./activities/ondes/tond02_son.js";
import * as tond03 from "./activities/ondes/tond03_venturi.js";
import * as tond04 from "./activities/ondes/tond04_archimede.js";

// Métadonnées de navigation : subject = "chimie" ou "physique" ; theme = clé i18n
const META = {
  pmat01: { subject: "chimie", theme: "suivi" },
  pmat02: { subject: "chimie", theme: "suivi" },
  pmat03: { subject: "chimie", theme: "suivi" },
  pmat04: { subject: "chimie", theme: "suivi" },
  pmat05: { subject: "chimie", theme: "suivi" },
  pmat06: { subject: "chimie", theme: "suivi" },
  pmou02: { subject: "physique", theme: "fluide" },
  pmou04: { subject: "physique", theme: "mouvement" },
  pond01: { subject: "physique", theme: "ondes" },
  pond02: { subject: "physique", theme: "ondes" },
  pond03: { subject: "physique", theme: "ondes" },
  pond04: { subject: "physique", theme: "optique" },
  pond05: { subject: "physique", theme: "optique" },
  tmat01: { subject: "chimie", theme: "acide_base" },
  tmat02: { subject: "chimie", theme: "acide_base" },
  tmat03: { subject: "chimie", theme: "oxydo" },
  tmat04: { subject: "chimie", theme: "cinetique" },
  tmat05: { subject: "chimie", theme: "radioactivite" },
  tmou01: { subject: "physique", theme: "lois_newton" },
  tmou02: { subject: "physique", theme: "champ" },
  tene01: { subject: "physique", theme: "rc" },
  tene02: { subject: "physique", theme: "thermique" },
  tond01: { subject: "physique", theme: "photons" },
  tond02: { subject: "physique", theme: "son" },
  tond03: { subject: "physique", theme: "venturi" },
  tond04: { subject: "physique", theme: "archimede" }
};

export const ACTIVITIES = new Map();
function register(mod) {
  if (!mod || !mod.id || typeof mod.mount !== "function") throw new Error("Activité invalide: " + (mod && mod.id));
  ACTIVITIES.set(mod.id, mod);
}
[pmat01, pmat02, pmat03, pmat04, pmat05, pmat06, pmou02, pmou04,
 pond01, pond02, pond03, pond04, pond05,
 tmat01, tmat02, tmat03, tmat04, tmat05,
 tmou01, tmou02, tene01, tene02,
 tond01, tond02, tond03, tond04].forEach(m => { if (m && m.id) register(m); });

export function getActivity(id) { return ACTIVITIES.get(id) || null; }
export function getMeta(id) { return META[id] || { subject: "physique", theme: "ondes" }; }
export function listActivities() {
  return Array.from(ACTIVITIES.values()).map(a => ({
    id: a.id, level: a.level, domain: a.domain, theme: a.theme, titleKey: a.titleKey,
    ...getMeta(a.id)
  }));
}
