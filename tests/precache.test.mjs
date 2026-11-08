import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sw = readFileSync(resolve(root, "sw.js"), "utf8");
const match = sw.match(/const PRECACHE\s*=\s*\[([\s\S]*?)\];/);
if (!match) { console.log("PRECACHE introuvable"); process.exit(1); }
const paths = [...match[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
let fail = 0;
for (const p of paths) {
  if (p === "./") continue;
  const abs = resolve(root, p.replace(/^\.\//, ""));
  if (!existsSync(abs)) { console.log("MANQUANT:", p); fail++; }
}
console.log(fail === 0 ? "precache OK (" + paths.length + " entrees)" : fail + " fichier(s) manquant(s)");
if (fail > 0) process.exit(1);
