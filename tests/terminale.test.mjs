import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mod = async rel => import("file://" + resolve(root, rel));

const tmat01 = await mod("js/activities/matiere/tmat01_acide_faible.js");
const tmat02 = await mod("js/activities/matiere/tmat02_tampon.js");
const tmat03 = await mod("js/activities/matiere/tmat03_pile.js");
const tmat04 = await mod("js/activities/matiere/tmat04_cinetique.js");
const tmat05 = await mod("js/activities/matiere/tmat05_radioactivite.js");
const tmou01 = await mod("js/activities/mouvement/tmou01_newton_euler.js");
const tmou02 = await mod("js/activities/mouvement/tmou02_champ_electrique.js");
const tene01 = await mod("js/activities/energie/tene01_rc.js");
const tene02 = await mod("js/activities/energie/tene02_thermique.js");
const tond01 = await mod("js/activities/ondes/tond01_photoelectrique.js");
const tond02 = await mod("js/activities/ondes/tond02_son.js");
const tond03 = await mod("js/activities/ondes/tond03_venturi.js");
const tond04 = await mod("js/activities/ondes/tond04_archimede.js");

let pass = 0, fail = 0;
function check(name, fn) { try { fn(); console.log("OK  " + name); pass++; } catch (e) { console.log("FAIL " + name + " - " + e.message); fail++; } }
function close(a, b, tol) { if (!isFinite(a) || !isFinite(b)) throw new Error("non fini " + a + "/" + b); if (Math.abs(a - b) > tol) throw new Error("attendu " + b + " +/- " + tol + ", obtenu " + a); }

check("T-MAT-01 pH(CH3COOH 0,070) = 2,95", () => close(tmat01.pHFaible(0.070, Math.pow(10, -4.75)), 2.95, 0.05));
check("T-MAT-02 tampon equimolaire -> pH = pKa", () => close(tmat02.pHBuffer(4.75, 0.10, 0.10), 4.75, 0.01));
check("T-MAT-03 pile Cu/Zn E = 1,10 V", () => close(tmat03.fem(tmat03.E0["Cu2+/Cu"], tmat03.E0["Zn2+/Zn"]), 1.10, 0.01));
check("T-MAT-04 t1/2 = ln2/k pour k=0,05", () => close(tmat04.halfLife(0.05), 13.8629, 0.001));
check("T-MAT-05 t1/2 = ln2/lambda pour lambda=0,01", () => close(tmat05.demiVie(0.01), 69.3147, 0.001));
check("T-MOU-01 a = F/m = 2/1 = 2 m/s2", () => { const tr = tmou01.simulateConstantForce(1, 2, 0, 0.01, 1); close(tr[tr.length - 1].v, 2, 0.1); });
check("T-MOU-02 deviation electron coherente", () => { const y = tmou02.deviation(1.602176634e-19, 1e4, 9.11e-31, 0.05, 1e7); if (!(y > 1e-6 && y < 1)) throw new Error("y " + y); });
check("T-ENE-01 tau = RC = 1 s", () => close(tene01.tau(1000, 1e-3), 1, 0.001));
check("T-ENE-02 Rth = 2,5 K/W", () => close(tene02.resistanceThermique(0.10, 0.040, 1.0), 2.5, 0.01));
check("T-OND-01 E(500 nm) = 2,48 eV", () => close(tond01.photonEnergyEV(500), 2.48, 0.02));
check("T-OND-02 L(1e-6) = 60 dB", () => close(tond02.niveau(1e-6), 60, 0.1));
check("T-OND-03 v2 = 4 m/s", () => close(tond03.vitesse2(10, 5, 1), 4, 0.01));
check("T-OND-03 dP = 7485 Pa", () => close(tond03.deltaP(10, 5, 1), 7485, 50));
check("T-OND-04 Pi(10 L eau) = 97,9 N", () => close(tond04.poussee(10, 998), 97.9, 0.5));
check("T-OND-04 glace flotte", () => { if (!tond04.flotte(917, 998)) throw new Error("devrait flotter"); });
check("T-OND-04 fer coule", () => { if (tond04.flotte(7870, 998)) throw new Error("ne devrait pas flotter"); });

console.log("\n" + pass + " reussis, " + fail + " echoues.");
if (fail > 0) process.exit(1);
