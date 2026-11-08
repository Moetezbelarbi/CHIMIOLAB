import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const { DICT } = await import("file://" + resolve(root, "js/i18n.js"));

const fr = DICT.fr, en = DICT.en;
let fail = 0;
const missingFR = Object.keys(en).filter(k => !(k in fr));
const missingEN = Object.keys(fr).filter(k => !(k in en));
if (missingFR.length) { console.log("Cles manquantes FR:", missingFR); fail++; }
if (missingEN.length) { console.log("Cles manquantes EN:", missingEN); fail++; }
const whitelist = new Set(["app.author", "pmat04.indicator.none"]);
const identical = Object.keys(fr).filter(k => fr[k] === en[k] && !whitelist.has(k));
if (identical.length) { console.log("Valeurs identiques FR/EN:", identical); fail++; }
console.log(fail === 0 ? "i18n OK" : "i18n FAIL");
if (fail > 0) process.exit(1);
