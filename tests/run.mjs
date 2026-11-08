import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mod = async rel => import("file://" + resolve(root, rel));

const { pHExact, pHExactBaseFaible, findEquivalence: eqPH } = await mod("js/activities/matiere/pmat04_titrage_ph.js");
const { sigmaExact, findEquivalence: eqCond } = await mod("js/activities/matiere/pmat05_titrage_conducto.js");

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); console.log("OK  " + name); pass++; }
  catch (e) { console.log("FAIL " + name + " - " + e.message); fail++; }
}
function close(a, b, tol) {
  if (!isFinite(a) || !isFinite(b)) throw new Error("non fini " + a + "/" + b);
  if (Math.abs(a - b) > tol) throw new Error("attendu " + b + " +/- " + tol + ", obtenu " + a);
}

check("P-MAT-04 pH(0) = 2,95", () => close(pHExact(0.070, 10, 0.050, 0), 2.95, 0.05));
check("P-MAT-04 pH(7 mL) = 4,75", () => close(pHExact(0.070, 10, 0.050, 7), 4.75, 0.05));
check("P-MAT-04 pH(14 mL) = 8,6", () => close(pHExact(0.070, 10, 0.050, 14), 8.6, 0.05));
check("P-MAT-04 V_E = 14 mL", () => close(eqPH(0.070, 10, 0.050), 14, 0.05));
check("P-MAT-04 pH(0) NH3 = 11,07", () => close(pHExactBaseFaible(0.080, 10, 0.10, 0), 11.07, 0.05));
check("P-MAT-04 pH(4 mL) NH3 = 9,25", () => close(pHExactBaseFaible(0.080, 10, 0.10, 4), 9.25, 0.05));
check("P-MAT-05 sigma(0) = 42,6 mS/cm", () => close(sigmaExact(0.10, 10, 0.10, 0, 1.0) * 10, 42.6, 0.5));
check("P-MAT-05 sigma(10 mL) = 6,3 mS/cm", () => close(sigmaExact(0.10, 10, 0.10, 10, 1.0) * 10, 6.3, 0.5));
check("P-MAT-05 V_E = 10 mL", () => close(eqCond(0.10, 10, 0.10), 10, 0.05));

console.log("\n" + pass + " reussis, " + fail + " echoues.");
if (fail > 0) process.exit(1);
