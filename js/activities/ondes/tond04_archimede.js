import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";
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
  const state = { V: 10, fluide: "eau", solide: "glace", seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tond04-v">${t("tond04.input.V")}</label>
      <input id="tond04-v" type="range" min="0.5" max="50" step="0.5" value="${state.V}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,5 L</span><span id="tond04-v-val">${state.V.toFixed(1)} L</span><span>50 L</span>
      </div>
    </div>
    <div class="field"><label for="tond04-fl">${t("tond04.input.fluide")}</label>
      <select id="tond04-fl">
        <option value="eau">Eau (998 kg/m³)</option>
        <option value="eau_salee">Eau salée (1025 kg/m³)</option>
        <option value="mercure">Mercure (13600 kg/m³)</option>
      </select></div>
    <div class="field"><label for="tond04-so">${t("tond04.input.solide")}</label>
      <select id="tond04-so">
        <option value="glace">Glace (917 kg/m³)</option>
        <option value="fer">Fer (7870 kg/m³)</option>
      </select></div>
    <div class="actions">
      <button class="btn" id="tond04-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tond04-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 220");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tond04-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tond04-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tond04-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tond04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(Pi, fl) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "80", y: "80", width: "220", height: "120", rx: "6", fill: "#E3F2FD", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "82", y: "120", width: "216", height: "78", fill: "#90CAF9", opacity: "0.5" }));
    svg.appendChild(mk("text", { x: "190", y: "215", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, state.fluide));
    // objet
    svg.appendChild(mk("rect", { x: "150", y: fl ? "110" : "160", width: "80", height: "40", rx: "4", fill: fl ? "#ECEFF1" : "#546E7A", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "190", y: fl ? "135" : "185", "text-anchor": "middle", fill: fl ? "#455A64" : "#fff", "font-size": "11" }, state.solide));
    // dynamomètre
    svg.appendChild(mk("rect", { x: "420", y: "60", width: "30", height: "130", rx: "4", fill: "#FFFDE7", stroke: "#F57F17", "stroke-width": "2" }));
    for (let i = 0; i < 10; i++) {
      svg.appendChild(mk("line", { x1: "420", y1: String(60 + i * 13), x2: "430", y2: String(60 + i * 13), stroke: "#F57F17", "stroke-width": "1" }));
    }
    svg.appendChild(mk("text", { x: "480", y: "100", "text-anchor": "middle", fill: "#F57F17", "font-size": "14", "font-weight": "bold" }, "Π = " + Pi.toFixed(1) + " N"));
    svg.appendChild(mk("text", { x: "480", y: "130", "text-anchor": "middle", fill: fl ? "#2E7D32" : "#C62828", "font-size": "13", "font-weight": "bold" }, fl ? "flotte" : "coule"));
  }

  function runMeasurement() {
    state.V = parseFloat(document.getElementById("tond04-v").value);
    state.fluide = document.getElementById("tond04-fl").value;
    state.solide = document.getElementById("tond04-so").value;
    document.getElementById("tond04-v-val").textContent = state.V.toFixed(1) + " L";
    const Pi = poussee(state.V, RHO[state.fluide]);
    const fl = flotte(RHO[state.solide], RHO[state.fluide]);
    drawSchema(Pi, fl);
    const grid = document.getElementById("tond04-measures");
    grid.innerHTML = "";
    [
      { label: "V", value: state.V.toFixed(1), unit: "L" },
      { label: "ρ fluide", value: RHO[state.fluide].toString(), unit: "kg/m³" },
      { label: "Π", value: Pi.toFixed(1), unit: "N" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tond04-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Poussée d'Archimède</div>
      <div class="measure-value" style="font-size:26px">Π = ${Pi.toFixed(1)} N</div>
      <div class="measure-unit">${fl ? "L'objet flotte" : "L'objet coule"}</div>
    </div>`;
    const steps = document.getElementById("tond04-steps");
    steps.innerHTML = "";
    [
      { title: "Poussée d'Archimède", body: `<span class="step-formula">Π = ρ_fluide · V_immergé · g</span>` },
      { title: "Données", body: `V = ${state.V.toFixed(1)} L = ${(state.V * 1e-3).toExponential(2)} m³ · ρ = ${RHO[state.fluide]} kg/m³ · g = 9,81 m/s²` },
      { title: "Calcul", body: `<span class="step-formula">Π = ${RHO[state.fluide]} × ${(state.V * 1e-3).toExponential(2)} × 9,81 = ${Pi.toFixed(1)} N</span>` },
      { title: "Flottabilité", body: `ρ_solide = ${RHO[state.solide]} kg/m³ ${fl ? "<" : ">"} ρ_fluide = ${RHO[state.fluide]} kg/m³ → ${fl ? "flotte" : "coule"}` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tond04-v").addEventListener("input", (e) => {
    document.getElementById("tond04-v-val").textContent = parseFloat(e.target.value).toFixed(1) + " L";
  });
  document.getElementById("tond04-run").addEventListener("click", runMeasurement);
  document.getElementById("tond04-rand").addEventListener("click", () => {
    const v = Number((1 + rng() * 40).toFixed(1));
    document.getElementById("tond04-v").value = v;
    document.getElementById("tond04-v-val").textContent = v.toFixed(1) + " L";
    document.getElementById("tond04-fl").value = ["eau", "eau_salee", "mercure"][Math.floor(rng() * 3)];
    document.getElementById("tond04-so").value = ["glace", "fer"][Math.floor(rng() * 2)];
    runMeasurement();
  });
  document.getElementById("tond04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tond04-steps");
    const btn = document.getElementById("tond04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
