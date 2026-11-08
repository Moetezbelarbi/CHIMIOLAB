import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

const SELS = {
  CuSO4: { label: "CuSO4", M: 159.6 },
  CuSO4_5H2O: { label: "CuSO4.5H2O", M: 249.7 },
  NaCl: { label: "NaCl", M: 58.5 }
};
export function concentrationAfterDissolution(massG, M, fioleMl) { return massG / M / (fioleMl * 1e-3); }
export function concentrationAfterDilution(C0, VpipetteMl, VfioleMl) { return C0 * VpipetteMl / VfioleMl; }
export function propagationDissolution(massG, uMass, M, fioleMl, uFioleMl) {
  const C = massG / M / (fioleMl * 1e-3);
  const uC = C * Math.sqrt(Math.pow(uMass / massG, 2) + Math.pow(uFioleMl / fioleMl, 2));
  return { C, uC };
}

export const id = "pmat06";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat06.title";

export function mount(container) {
  const state = { sel: "CuSO4", mass: 2.50, fiole: 100.0, pipette: 20.00, fioleDil: 100.0, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmat06.title")}</div>
    <p>${t("pmat06.desc")}</p>
    <div class="field"><label for="pmat06-sel">${t("pmat06.input.sel")}</label>
      <select id="pmat06-sel"><option value="CuSO4">CuSO4 anhydre (159,6 g/mol)</option><option value="CuSO4_5H2O">CuSO4.5H2O (249,7 g/mol)</option><option value="NaCl">NaCl (58,5 g/mol)</option></select></div>
    <div class="field"><label for="pmat06-mass">${t("pmat06.input.mass")}</label><input id="pmat06-mass" type="number" step="0.01" min="0.01" max="100" value="${state.mass}"></div>
    <div class="field"><label for="pmat06-fiole">${t("pmat06.input.fiole")}</label><input id="pmat06-fiole" type="number" step="1" min="10" max="1000" value="${state.fiole}"></div>
    <div class="field"><label for="pmat06-pip">${t("pmat06.input.pipette")}</label><input id="pmat06-pip" type="number" step="0.01" min="1" max="50" value="${state.pipette}"></div>
    <div class="field"><label for="pmat06-fioledil">${t("pmat06.input.fioleDil")}</label><input id="pmat06-fioledil" type="number" step="1" min="10" max="1000" value="${state.fioleDil}"></div>
    <div class="actions"><button class="btn" id="pmat06-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pmat06-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmat06.answer.title")}</div>
    <div class="field"><label for="pmat06-c">${t("pmat06.answer.cfinal")}</label><input id="pmat06-c" type="number" step="1e-6" min="0" max="10"></div>
    <div class="actions"><button class="btn-check" id="pmat06-check">${t("action.check")}</button></div>
    <div id="pmat06-status" class="status" role="status"></div>
    <div id="pmat06-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    state.sel = document.getElementById("pmat06-sel").value;
    const m = parseFloat(document.getElementById("pmat06-mass").value);
    const f = parseFloat(document.getElementById("pmat06-fiole").value);
    const p = parseFloat(document.getElementById("pmat06-pip").value);
    const fd = parseFloat(document.getElementById("pmat06-fioledil").value);
    if (isFinite(m)) state.mass = m; if (isFinite(f)) state.fiole = f; if (isFinite(p)) state.pipette = p; if (isFinite(fd)) state.fioleDil = fd;
  }
  function compute() {
    const sel = SELS[state.sel];
    const C0 = concentrationAfterDissolution(state.mass, sel.M, state.fiole);
    const C1 = concentrationAfterDilution(C0, state.pipette, state.fioleDil);
    const { uC } = propagationDissolution(state.mass, 0.01, sel.M, state.fiole, 0.08);
    return { C0, C1, uC, sel };
  }
  function refresh() { readInputs(); }
  function randomize() {
    const keys = Object.keys(SELS);
    state.sel = keys[Math.floor(rng() * keys.length)];
    state.mass = Number((0.5 + rng() * 10).toFixed(2));
    state.fiole = [50, 100, 200, 250][Math.floor(rng() * 4)];
    state.pipette = [5.00, 10.00, 20.00, 25.00][Math.floor(rng() * 4)];
    state.fioleDil = [50, 100, 200, 250][Math.floor(rng() * 4)];
    document.getElementById("pmat06-sel").value = state.sel;
    document.getElementById("pmat06-mass").value = state.mass;
    document.getElementById("pmat06-fiole").value = state.fiole;
    document.getElementById("pmat06-pip").value = state.pipette;
    document.getElementById("pmat06-fioledil").value = state.fioleDil;
    state.validated = false;
    document.getElementById("pmat06-status").className = "status"; document.getElementById("pmat06-status").textContent = "";
    document.getElementById("pmat06-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pmat06-c").value);
    const { C0, C1 } = compute();
    const status = document.getElementById("pmat06-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const diff = Math.abs(ans - C1) / C1;
    if (diff <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (C = " + formatSigFigs(C1, 3) + " mol/L)"; }
    else { status.className = "status status-err"; let msg = t("status.incorrect") + " - C = " + formatSigFigs(C1, 3) + " mol/L"; if (diff > 20) msg += " - " + t("status.dilutionForgotten"); status.textContent = msg; }
    document.getElementById("pmat06-corr").style.display = "block";
    document.getElementById("pmat06-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> C0 = " + formatSigFigs(C0, 3) + " mol/L ; C1 = C0*V_pip/V_fiole = " + formatSigFigs(C1, 3) + " mol/L.";
  }
  document.getElementById("pmat06-rand").addEventListener("click", randomize);
  document.getElementById("pmat06-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pmat06-c").value = "";
    document.getElementById("pmat06-status").className = "status"; document.getElementById("pmat06-status").textContent = "";
    document.getElementById("pmat06-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmat06-check").addEventListener("click", check);
  ["pmat06-sel", "pmat06-mass", "pmat06-fiole", "pmat06-pip", "pmat06-fioledil"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pmat06-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
