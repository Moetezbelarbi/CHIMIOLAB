import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mod = async rel => import("file://" + resolve(root, rel));

const spec = await mod("js/activities/matiere/pmat01_spectro.js");
const cond = await mod("js/activities/matiere/pmat02_conducto_etalonnage.js");
const colori = await mod("js/activities/matiere/pmat03_titrage_colorimetrique.js");
const diss = await mod("js/activities/matiere/pmat06_dissolution_dilution.js");

let pass = 0, fail = 0;
function check(name, fn) { try { fn(); console.log("OK  " + name); pass++; } catch (e) { console.log("FAIL " + name + " - " + e.message); fail++; } }
function close(a, b, tol) { if (Math.abs(a - b) > tol) throw new Error("attendu " + b + ", obtenu " + a); }

check("P-MAT-01 A(KMnO4,1e-3) = 2,3", () => close(spec.absorbanceAtMax("kmno4", 1e-3), 2.3, 0.05));
check("P-MAT-01 A(CuSO4,0,1) = 1,25", () => close(spec.absorbanceAtMax("cuso4", 0.1), 1.25, 0.05));
check("P-MAT-02 sigma(KCl 0,0100, 25) = 0,1413 S/m", () => close(cond.sigmaKCl(0.0100, 25), 0.1413, 0.0005));
check("P-MAT-03 phenolphtaleine pH 7 incolore", () => { if (colori.colorAt(7, "phenolphtaleine") !== "#FAFAFA") throw new Error("couleur"); });
check("P-MAT-03 phenolphtaleine pH 11 rose", () => { if (colori.colorAt(11, "phenolphtaleine") !== "#E91E63") throw new Error("couleur"); });
check("P-MAT-06 C0(CuSO4 2,50 g / 100 mL) = 0,1566", () => close(diss.concentrationAfterDissolution(2.50, 159.6, 100), 0.1566, 0.001));
check("P-MAT-06 dilution 20/100 -> C0/5", () => close(diss.concentrationAfterDilution(0.1566, 20, 100), 0.03132, 0.0005));

console.log("\n" + pass + " reussis, " + fail + " echoues.");
if (fail > 0) process.exit(1);
