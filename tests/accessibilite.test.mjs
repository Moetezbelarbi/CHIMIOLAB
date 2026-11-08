import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const { DICT } = await import("file://" + resolve(root, "js/i18n.js"));

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}
const files = walk(resolve(root, "js"));
const used = new Set();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\(\s*["']([^"']+)["']\s*\)/g)) used.add(m[1]);
  for (const m of src.matchAll(/titleKey\s*=\s*["']([^"']+)["']/g)) used.add(m[1]);
}
let fail = 0;
const missingFR = [...used].filter(k => !(k in DICT.fr));
const missingEN = [...used].filter(k => !(k in DICT.en));
if (missingFR.length) { console.log("Cles utilisees absentes FR:", missingFR); fail++; }
if (missingEN.length) { console.log("Cles utilisees absentes EN:", missingEN); fail++; }
const whitelist = new Set(["app.author", "pmat04.indicator.none"]);
const identical = Object.keys(DICT.fr).filter(k => DICT.fr[k] === DICT.en[k] && !whitelist.has(k));
if (identical.length) { console.log("Valeurs identiques FR/EN:", identical); fail++; }
console.log(fail === 0 ? "accessibilite/i18n OK (" + used.size + " cles utilisees)" : "FAIL");
if (fail > 0) process.exit(1);
