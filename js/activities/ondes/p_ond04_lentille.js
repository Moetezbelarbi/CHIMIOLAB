import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function conjugate(OAcm, fprimeCm) {
  const inv = 1 / fprimeCm + 1 / OAcm;
  if (Math.abs(inv) < 1e-9) return { OAprime: Infinity, gamma: Infinity, infinite: true };
  const OAprime = 1 / inv;
  return { OAprime, gamma: OAprime / OAcm, infinite: false };
}

export const id = "pond04";
export const level = "premiere";
export const domain = "ondes";
export const theme = "optique";
export const titleKey = "pond04.title";

export function mount(container) {
  const state = { fprime: 10, OA: -15, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pond04.title")}</div>
    <p>${t("pond04.desc")}</p>
    <div class="field"><label for="pond04-f">${t("pond04.input.f")}</label><input id="pond04-f" type="number" step="1" min="5" max="50" value="${state.fprime}"></div>
    <div class="field"><label for="pond04-oa">${t("pond04.input.OA")}</label><input id="pond04-oa" type="number" step="0.5" min="-100" max="-1" value="${state.OA}"></div>
    <div class="actions"><button class="btn" id="pond04-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pond04-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 600 260");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pond04.answer.title")}</div>
    <div class="field"><label for="pond04-oap">${t("pond04.answer.OAprime")}</label><input id="pond04-oap" type="number" step="0.1" min="-1000" max="1000"></div>
    <div class="actions"><button class="btn-check" id="pond04-check">${t("action.check")}</button></div>
    <div id="pond04-status" class="status" role="status"></div>
    <div id="pond04-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function drawLens() {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
    svg.appendChild(mk("line", { x1: 20, y1: 130, x2: 580, y2: 130, stroke: "#455A64", "stroke-width": 1 }));
    svg.appendChild(mk("ellipse", { cx: 300, cy: 130, rx: 10, ry: 60, fill: "#90CAF9", stroke: "#1565C0", "stroke-width": 2 }));
    svg.appendChild(mk("circle", { cx: 300 + state.fprime * 8, cy: 130, r: 3, fill: "#F57C00" }));
    svg.appendChild(mk("circle", { cx: 300 - state.fprime * 8, cy: 130, r: 3, fill: "#F57C00" }));
    const objX = 300 + state.OA * 8;
    svg.appendChild(mk("line", { x1: objX, y1: 130, x2: objX, y2: 70, stroke: "#2E7D32", "stroke-width": 3 }));
    svg.appendChild(mk("polygon", { points: `${objX - 5},80 ${objX + 5},80 ${objX},68`, fill: "#2E7D32" }));
    const { OAprime, infinite } = conjugate(state.OA, state.fprime);
    if (!infinite && isFinite(OAprime)) {
      const imgX = 300 + OAprime * 8;
      const h = 60 * Math.abs(OAprime / state.OA);
      const up = OAprime / state.OA > 0;
      svg.appendChild(mk("line", { x1: imgX, y1: 130, x2: imgX, y2: up ? 130 - h : 130 + h, stroke: "#C62828", "stroke-width": 3 }));
    }
    svg.appendChild(mk("line", { x1: objX, y1: 70, x2: 300, y2: 70, stroke: "#1565C0", "stroke-width": 1 }));
    svg.appendChild(mk("line", { x1: 300, y1: 70, x2: 300 + state.fprime * 8, y2: 130, stroke: "#1565C0", "stroke-width": 1 }));
  }
  function readInputs() {
    const f = parseFloat(document.getElementById("pond04-f").value);
    const oa = parseFloat(document.getElementById("pond04-oa").value);
    if (isFinite(f)) state.fprime = f; if (isFinite(oa)) state.OA = oa;
  }
  function refresh() { readInputs(); drawLens(); }
  function randomize() {
    state.fprime = [10, 15, 20, 25][Math.floor(rng() * 4)];
    state.OA = -Number((3 + rng() * 40).toFixed(1));
    document.getElementById("pond04-f").value = state.fprime;
    document.getElementById("pond04-oa").value = state.OA;
    state.validated = false;
    document.getElementById("pond04-status").className = "status"; document.getElementById("pond04-status").textContent = "";
    document.getElementById("pond04-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pond04-oap").value);
    const { OAprime, infinite } = conjugate(state.OA, state.fprime);
    const status = document.getElementById("pond04-status");
    state.validated = true;
    if (infinite) { status.className = "status status-hint"; status.textContent = t("pond04.answer.infinity"); return; }
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    const rel = Math.abs(ans - OAprime) / Math.max(1, Math.abs(OAprime));
    if (rel <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (OA' = " + formatSigFigs(OAprime, 3) + " cm)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - OA' = " + formatSigFigs(OAprime, 3) + " cm"; }
    document.getElementById("pond04-corr").style.display = "block";
    document.getElementById("pond04-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> OA' = " + formatSigFigs(OAprime, 3) + " cm ; gamma = " + formatSigFigs(OAprime / state.OA, 3) + ".";
  }
  document.getElementById("pond04-rand").addEventListener("click", randomize);
  document.getElementById("pond04-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pond04-oap").value = "";
    document.getElementById("pond04-status").className = "status"; document.getElementById("pond04-status").textContent = "";
    document.getElementById("pond04-corr").style.display = "none"; refresh();
  });
  document.getElementById("pond04-check").addEventListener("click", check);
  ["pond04-f", "pond04-oa"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pond04-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
