import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mod = async rel => import("file://" + resolve(root, rel));

const boyle = await mod("js/activities/mouvement/pmou02_boyle.js");
const chute = await mod("js/activities/mouvement/pmou04_chute_libre.js");
const diff = await mod("js/activities/ondes/p_ond01_diffraction.js");
const young = await mod("js/activities/ondes/p_ond02_interferences.js");
const doppler = await mod("js/activities/ondes/p_ond03_doppler.js");
const lentille = await mod("js/activities/ondes/p_ond04_lentille.js");
const lunette = await mod("js/activities/ondes/p_ond05_lunette.js");

let pass = 0, fail = 0;
function check(name, fn) { try { fn(); console.log("OK  " + name); pass++; } catch (e) { console.log("FAIL " + name + " - " + e.message); fail++; } }
function close(a, b, tol) { if (!isFinite(a) || !isFinite(b)) throw new Error("non fini " + a + "/" + b); if (Math.abs(a - b) > tol) throw new Error("attendu " + b + " +/- " + tol + ", obtenu " + a); }

check("P-MOU-02 Boyle P(V0) = P_atm", () => close(boyle.pressureBoyle(0, 2.0, 101325), 101325, 1));
check("P-MOU-04 v_lim coherente", () => { const v = chute.terminalVelocity(0.010, 0.020); if (!(v > 5 && v < 500)) throw new Error("v_lim " + v); });
check("P-OND-01 L = 52 mm", () => close(diff.widthCentral(650, 50, 2) * 1000, 52, 0.5));
check("P-OND-02 i = 1,2 mm", () => close(young.interfrange(600, 0.5, 1) * 1000, 1.2, 0.05));
check("P-OND-03 f = 467 Hz", () => close(doppler.dopplerFreq(440, 20, 343, true), 467, 1));
check("P-OND-04 OA' = +30 cm", () => close(lentille.conjugate(-15, 10).OAprime, 30, 0.05));
check("P-OND-04 gamma = -2", () => close(lentille.conjugate(-15, 10).gamma, -2, 0.05));
check("P-OND-04 OA=-f' -> infini", () => { const r = lentille.conjugate(-10, 10); if (!r.infinite) throw new Error("devrait etre infini"); if (isFinite(r.OAprime)) throw new Error("OA' devrait etre Infinity"); });
check("P-OND-05 G = 10", () => close(lunette.grossissement(100, 10), 10, 0.01));

console.log("\n" + pass + " reussis, " + fail + " echoues.");
if (fail > 0) process.exit(1);
