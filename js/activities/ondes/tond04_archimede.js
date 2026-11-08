import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";
import { G_VALUE } from "../../config.js";

export const RHO = { eau: 998, eau_salee: 1025, mercure: 13600, glace: 917, fer: 7870 };
export function poussee(Vliters, rhoFluide, g = G_VALUE) { return rhoFluide * Vliters * 1e-3 * g; }
export function flotte(rhoSolide, rhoFluide) { return rhoSolide < rhoFluide; }
export const id = "tond04";
export const level = "terminale";
export const domain = "ondes";
export const theme = "archimede";
export const titleKey = "tond04.title";

export function mount(container) {
  const state = { V: 10, fluide: "eau", solide: "glace", validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tond04.title")}</div>
    <p>${t("tond04.desc")}</p>
    <div class="field"><label for="tond04-v">${t("tond04.input.V")}</label><input id="tond04-v" type="number" step="0.1" min="0.1" max="100" value="${state.V}"></div>
    <div class="field"><label for="tond04-fl">${t("tond04.input.fluide")}</label>
      <select id="tond04-fl"><option value="eau">Eau (998 kg/m3)</option><option value="eau_salee">Eau salee (1025 kg/m3)</option><option value="mercure">Mercure (13600 kg/m3)</option></select></div>
    <div class="field"><label for="tond04-so">${t("tond04.input.solide")}</label>
      <select id="tond04-so"><option value="glace">Glace (917 kg/m3)</option><option value="fer">Fer (7870 kg/m3)</option></select></div>
    <div class="actions"><button class="btn" id="tond04-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tond04-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tond04.answer.title")}</div>
    <div class="field"><label for="tond04-p">${t("tond04.answer.Pi")}</label><input id="tond04-p" type="number" step="0.1" min="0" max="1e6"></div>
    <div class="actions"><button class="btn-check" id="tond04-check">${t("action.check")}</button></div>
    <div id="tond04-status" class="status" role="status"></div>
    <div id="tond04-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const v = parseFloat(document.getElementById("tond04-v").value);
    if (isFinite(v) && v > 0) state.V = v;
    state.fluide = document.getElementById("tond04-fl").value;
    state.solide = document.getElementById("tond04-so").value;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.V = Number((0.5 + rng() * 50).toFixed(1));
    state.fluide = ["eau", "eau_salee", "mercure"][Math.floor(rng() * 3)];
    state.solide = ["glace", "fer"][Math.floor(rng() * 2)];
    document.getElementById("tond04-v").value = state.V;
    document.getElementById("tond04-fl").value = state.fluide;
    document.getElementById("tond04-so").value = state.solide;
    state.validated = false;
    document.getElementById("tond04-status").className = "status"; document.getElementById("tond04-status").textContent = "";
    document.getElementById("tond04-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tond04-p").value);
    const Pi = poussee(state.V, RHO[state.fluide]);
    const fl = flotte(RHO[state.solide], RHO[state.fluide]);
    const status = document.getElementById("tond04-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - Pi) / Pi <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (Pi = " + formatSigFigs(Pi, 3) + " N ; " + (fl ? "flotte" : "coule") + ")"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - Pi = " + formatSigFigs(Pi, 3) + " N"; }
    document.getElementById("tond04-corr").style.display = "block";
    document.getElementById("tond04-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> Pi = rho*V*g = " + formatSigFigs(Pi, 3) + " N ; " + (fl ? "flotte" : "coule") + ".";
  }
  document.getElementById("tond04-rand").addEventListener("click", randomize);
  document.getElementById("tond04-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tond04-p").value = "";
    document.getElementById("tond04-status").className = "status"; document.getElementById("tond04-status").textContent = "";
    document.getElementById("tond04-corr").style.display = "none"; refresh();
  });
  document.getElementById("tond04-check").addEventListener("click", check);
  ["tond04-v", "tond04-fl", "tond04-so"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tond04-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
