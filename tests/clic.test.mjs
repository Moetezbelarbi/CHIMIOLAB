import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const reg = await import("file://" + resolve(root, "js/registry.js"));

const all = reg.listActivities();
const expected = [
  "pmat01","pmat02","pmat03","pmat04","pmat05","pmat06",
  "pmou02","pmou04",
  "pond01","pond02","pond03","pond04","pond05",
  "tmat01","tmat02","tmat03","tmat04","tmat05",
  "tmou01","tmou02",
  "tene01","tene02",
  "tond01","tond02","tond03","tond04"
];
let fail = 0;
const ids = all.map(a => a.id);
for (const id of expected) if (!ids.includes(id)) { console.log("MANQUANT:", id); fail++; }
for (const a of all) {
  if (!a.titleKey) { console.log("titleKey manquant:", a.id); fail++; }
  if (!a.level || !a.domain) { console.log("level/domain manquant:", a.id); fail++; }
  const mod = reg.getActivity(a.id);
  if (typeof mod.mount !== "function") { console.log("mount manquant:", a.id); fail++; }
}
console.log(fail === 0 ? "clic/registre OK (" + ids.length + " activites)" : "FAIL");
if (fail > 0) process.exit(1);
