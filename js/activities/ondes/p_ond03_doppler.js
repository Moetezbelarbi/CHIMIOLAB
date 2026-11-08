import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function soundSpeed(thetaC) { return 331.3 + 0.606 * thetaC; }
export function dopplerFreq(f0, vSource, c, approaching) {
  return approaching ? f0 * c / (c - vSource) : f0 * c / (c + vSource);
}

export const id = "pond03";
export const level = "premiere";
export const domain = "ondes";
export const theme = "ondes";
export const titleKey = "pond03.title";

export function mount(container) {
  const state = { f0: 440, v: 20, theta: 20, approaching: true, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pond03.title")}</div>
    <p>${t("pond03.desc")}</p>
    <div class="field"><label for="pond03-f0">${t("pond03.input.f0")}</label><input id="pond03-f0" type="number" step="1" min="100" max="2000" value="${state.f0}"></div>
    <div class="field"><label for="pond03-v">${t("pond03.input.v")}</label><input id="pond03-v" type="number" step="0.5" min="0" max="100" value="${state.v}"></div>
    <div class="field"><label for="pond03-t">${t("pond03.input.theta")}</label><input id="pond03-t" type="number" step="0.5" min="0" max="40" value="${state.theta}"></div>
    <div class="field"><label for="pond03-dir">${t("pond03.input.dir")}</label>
      <select id="pond03-dir"><option value="app">${t("pond03.dir.app")}</option><option value="rec">${t("pond03.dir.rec")}</option></select></div>
    <div class="actions"><button class="btn" id="pond03-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pond03-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 600 220");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pond03.answer.title")}</div>
    <div class="field"><label for="pond03-f">${t("pond03.answer.f")}</label><input id="pond03-f" type="number" step="0.1" min="0" max="5000"></div>
    <div class="actions"><button class="btn-check" id="pond03-check">${t("action.check")}</button></div>
    <div id="pond03-status" class="status" role="status"></div>
    <div id="pond03-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function drawFronts() {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    const c = soundSpeed(state.theta);
    const T = 1 / state.f0;
    const n = 6;
    for (let k = 0; k < n; k++) {
      const tEmit = k * T;
      const xEmit = state.approaching ? 100 + state.v * tEmit * 2 : 500 - state.v * tEmit * 2;
      const r = c * (n - k) * T * 2;
      if (r > 0) svg.appendChild(mk("circle", { cx: xEmit, cy: 110, r, fill: "none", stroke: "#1565C0", "stroke-width": 1.5, opacity: 0.7 }));
    }
    const xS = state.approaching ? 100 + state.v * (n - 1) * T * 2 : 500 - state.v * (n - 1) * T * 2;
    svg.appendChild(mk("circle", { cx: xS, cy: 110, r: 6, fill: "#FF1744" }));
    svg.appendChild(mk("circle", { cx: state.approaching ? 560 : 40, cy: 110, r: 8, fill: "#2E7D32" }));
  }
  function readInputs() {
    const f0 = parseFloat(document.getElementById("pond03-f0").value);
    const v = parseFloat(document.getElementById("pond03-v").value);
    const th = parseFloat(document.getElementById("pond03-t").value);
    const dir = document.getElementById("pond03-dir").value;
    if (isFinite(f0)) state.f0 = f0; if (isFinite(v)) state.v = v; if (isFinite(th)) state.theta = th;
    state.approaching = dir === "app";
  }
  function refresh() { readInputs(); drawFronts(); }
  function randomize() {
    state.f0 = Number((200 + rng() * 800).toFixed(0));
    state.v = Number((5 + rng() * 60).toFixed(1));
    state.theta = Number((0 + rng() * 35).toFixed(1));
    state.approaching = rng() < 0.5;
    document.getElementById("pond03-f0").value = state.f0;
    document.getElementById("pond03-v").value = state.v;
    document.getElementById("pond03-t").value = state.theta;
    document.getElementById("pond03-dir").value = state.approaching ? "app" : "rec";
    state.validated = false;
    document.getElementById("pond03-status").className = "status"; document.getElementById("pond03-status").textContent = "";
    document.getElementById("pond03-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pond03-f").value);
    const c = soundSpeed(state.theta);
    const f = dopplerFreq(state.f0, state.v, c, state.approaching);
    const status = document.getElementById("pond03-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const rel = Math.abs(ans - f) / f;
    if (rel <= 0.01) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (f = " + formatSigFigs(f, 4) + " Hz)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - f = " + formatSigFigs(f, 4) + " Hz"; }
    document.getElementById("pond03-corr").style.display = "block";
    document.getElementById("pond03-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> f = f0*c/(c-/+v) = " + formatSigFigs(f, 4) + " Hz.";
  }
  document.getElementById("pond03-rand").addEventListener("click", randomize);
  document.getElementById("pond03-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pond03-f").value = "";
    document.getElementById("pond03-status").className = "status"; document.getElementById("pond03-status").textContent = "";
    document.getElementById("pond03-corr").style.display = "none"; refresh();
  });
  document.getElementById("pond03-check").addEventListener("click", check);
  ["pond03-f0", "pond03-v", "pond03-t", "pond03-dir"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pond03-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
