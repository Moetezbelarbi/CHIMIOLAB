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
  const state = { f0: 440, v: 20, theta: 20, approaching: true, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pond03-v">${t("pond03.input.v")}</label>
      <input id="pond03-v" type="range" min="5" max="80" step="1" value="${state.v}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>5 m/s</span><span id="pond03-v-val">${state.v} m/s</span><span>80 m/s</span>
      </div>
    </div>
    <div class="field"><label for="pond03-dir">${t("pond03.input.dir")}</label>
      <select id="pond03-dir">
        <option value="app">${t("pond03.dir.app")}</option>
        <option value="rec">${t("pond03.dir.rec")}</option>
      </select></div>
    <div class="actions">
      <button class="btn" id="pond03-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pond03-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 240");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pond03-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pond03-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pond03-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pond03-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(f) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    const c = soundSpeed(state.theta);
    const T = 1 / state.f0;
    const n = 6;
    for (let k = 0; k < n; k++) {
      const tEmit = k * T;
      const xEmit = state.approaching ? 100 + state.v * tEmit * 3 : 520 - state.v * tEmit * 3;
      const r = c * (n - k) * T * 3;
      if (r > 0) svg.appendChild(mk("circle", { cx: xEmit, cy: 120, r, fill: "none", stroke: "#1565C0", "stroke-width": "1.5", opacity: "0.6" }));
    }
    const xS = state.approaching ? 100 + state.v * (n - 1) * T * 3 : 520 - state.v * (n - 1) * T * 3;
    svg.appendChild(mk("circle", { cx: xS, cy: 120, r: "8", fill: "#FF1744" }));
    svg.appendChild(mk("circle", { cx: state.approaching ? 580 : 40, cy: 120, r: "10", fill: "#2E7D32" }));
    svg.appendChild(mk("text", { x: "600", y: "100", "text-anchor": "end", fill: "#2E7D32", "font-size": "12", "font-weight": "bold" }, "f = " + f.toFixed(1) + " Hz"));
    svg.appendChild(mk("text", { x: "320", y: "220", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "f₀ = " + state.f0 + " Hz"));
  }

  function runMeasurement() {
    state.v = parseFloat(document.getElementById("pond03-v").value);
    state.approaching = document.getElementById("pond03-dir").value === "app";
    document.getElementById("pond03-v-val").textContent = state.v + " m/s";
    const c = soundSpeed(state.theta);
    const f = dopplerFreq(state.f0, state.v, c, state.approaching);
    drawSchema(f);
    const grid = document.getElementById("pond03-measures");
    grid.innerHTML = "";
    [
      { label: "f₀", value: state.f0.toFixed(0), unit: "Hz" },
      { label: "v source", value: state.v.toFixed(0), unit: "m/s" },
      { label: "f perçue", value: f.toFixed(1), unit: "Hz" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pond03-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Fréquence perçue</div>
      <div class="measure-value" style="font-size:26px">${f.toFixed(1)} Hz</div>
    </div>`;
    const steps = document.getElementById("pond03-steps");
    steps.innerHTML = "";
    [
      { title: "Effet Doppler", body: `Le mouvement relatif de la source modifie la fréquence perçue.` },
      { title: "Formule", body: `<span class="step-formula">f = f₀ · c / (c ∓ v)</span>` },
      { title: "Célérité", body: `c = 331,3 + 0,606 × ${state.theta} = ${c.toFixed(1)} m/s` },
      { title: "Calcul", body: `<span class="step-formula">f = ${state.f0} × ${c.toFixed(1)} / (${c.toFixed(1)} ${state.approaching ? "−" : "+"} ${state.v}) = ${f.toFixed(1)} Hz</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pond03-v").addEventListener("input", (e) => {
    document.getElementById("pond03-v-val").textContent = e.target.value + " m/s";
  });
  document.getElementById("pond03-run").addEventListener("click", runMeasurement);
  document.getElementById("pond03-rand").addEventListener("click", () => {
    const v = Number((10 + rng() * 60).toFixed(0));
    document.getElementById("pond03-v").value = v;
    document.getElementById("pond03-v-val").textContent = v + " m/s";
    document.getElementById("pond03-dir").value = rng() < 0.5 ? "app" : "rec";
    runMeasurement();
  });
  document.getElementById("pond03-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pond03-steps");
    const btn = document.getElementById("pond03-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
