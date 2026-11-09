import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";

export const E0 = { "Cu2+/Cu": 0.34, "Zn2+/Zn": -0.76, "Ag+/Ag": 0.80, "Fe2+/Fe": -0.44 };
export function fem(E0cathode, E0anode) { return E0cathode - E0anode; }

export const id = "tmat03";
export const level = "terminale";
export const domain = "matiere";
export const theme = "oxydoreduction";
export const titleKey = "tmat03.title";

export function mount(container) {
  const state = { cat: "Cu2+/Cu", an: "Zn2+/Zn", seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const opts = Object.keys(E0).map(k => `<option value="${k}">${k} (${E0[k]} V)</option>`).join("");
  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field"><label for="tmat03-cat">${t("tmat03.input.cathode")}</label>
      <select id="tmat03-cat">${opts}</select></div>
    <div class="field"><label for="tmat03-an">${t("tmat03.input.anode")}</label>
      <select id="tmat03-an">${opts}</select></div>
    <div class="actions">
      <button class="btn" id="tmat03-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmat03-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);
  document.getElementById("tmat03-cat").value = state.cat;
  document.getElementById("tmat03-an").value = state.an;

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 280");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tmat03-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmat03-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmat03-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmat03-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(E) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // béchers
    svg.appendChild(mk("rect", { x: "60", y: "100", width: "120", height: "120", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "62", y: "140", width: "116", height: "78", fill: "#90CAF9", opacity: "0.5" }));
    svg.appendChild(mk("rect", { x: "460", y: "100", width: "120", height: "120", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "462", y: "140", width: "116", height: "78", fill: "#A5D6A7", opacity: "0.5" }));
    // électrodes
    svg.appendChild(mk("rect", { x: "110", y: "50", width: "12", height: "160", fill: "#455A64" }));
    svg.appendChild(mk("rect", { x: "510", y: "50", width: "12", height: "160", fill: "#455A64" }));
    svg.appendChild(mk("text", { x: "116", y: "40", "text-anchor": "middle", fill: "#1565C0", "font-size": "11", "font-weight": "bold" }, "anode"));
    svg.appendChild(mk("text", { x: "516", y: "40", "text-anchor": "middle", fill: "#C62828", "font-size": "11", "font-weight": "bold" }, "cathode"));
    svg.appendChild(mk("text", { x: "120", y: "240", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, state.an));
    svg.appendChild(mk("text", { x: "520", y: "240", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, state.cat));
    // pont salin
    svg.appendChild(mk("path", { d: "M180 130 Q320 80 460 130", stroke: "#7B1FA2", "stroke-width": "4", fill: "none" }));
    svg.appendChild(mk("text", { x: "320", y: "70", "text-anchor": "middle", fill: "#7B1FA2", "font-size": "11" }, "pont salin"));
    // voltmètre
    svg.appendChild(mk("circle", { cx: "320", cy: "180", r: "30", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "320", y: "186", "text-anchor": "middle", fill: "#00E676", "font-size": "16", "font-family": "monospace", "font-weight": "bold" }, E.toFixed(2)));
    svg.appendChild(mk("text", { x: "320", y: "220", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "voltmètre (V)"));
    // fils
    svg.appendChild(mk("line", { x1: "116", y1: "50", x2: "116", y2: "20", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "116", y1: "20", x2: "320", y2: "20", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "320", y1: "20", x2: "320", y2: "150", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "516", y1: "50", x2: "516", y2: "20", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "516", y1: "20", x2: "320", y2: "20", stroke: "#455A64", "stroke-width": "2" }));
  }

  function runMeasurement() {
    state.cat = document.getElementById("tmat03-cat").value;
    state.an = document.getElementById("tmat03-an").value;
    const E = fem(E0[state.cat], E0[state.an]);
    drawSchema(E);
    const grid = document.getElementById("tmat03-measures");
    grid.innerHTML = "";
    [
      { label: "E° cathode", value: E0[state.cat].toFixed(2), unit: "V" },
      { label: "E° anode", value: E0[state.an].toFixed(2), unit: "V" },
      { label: "Force électromotrice", value: E.toFixed(2), unit: "V" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmat03-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Force électromotrice</div>
      <div class="measure-value" style="font-size:26px">E = ${E.toFixed(2)} V</div>
      <div class="measure-unit">${E > 0 ? "Pile qui fonctionne" : "Sens inverse"}</div>
    </div>`;
    const steps = document.getElementById("tmat03-steps");
    steps.innerHTML = "";
    [
      { title: "Principe de la pile", body: `Oxydation à l'anode, réduction à la cathode.` },
      { title: "Formule", body: `<span class="step-formula">E = E°(cathode) − E°(anode)</span>` },
      { title: "Données", body: `E°(${state.cat}) = ${E0[state.cat]} V · E°(${state.an}) = ${E0[state.an]} V` },
      { title: "Calcul", body: `<span class="step-formula">E = ${E0[state.cat]} − (${E0[state.an]}) = ${E.toFixed(2)} V</span>` },
      { title: "Interprétation", body: E > 0 ? "La pile débite : la réaction est spontanée." : "Le sens est inversé : il faut choisir l'autre cathode." }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmat03-run").addEventListener("click", runMeasurement);
  document.getElementById("tmat03-rand").addEventListener("click", () => {
    const keys = Object.keys(E0);
    let a = keys[Math.floor(rng() * keys.length)];
    let b = keys[Math.floor(rng() * keys.length)];
    if (a === b) b = keys[(keys.indexOf(a) + 1) % keys.length];
    if (E0[a] < E0[b]) { const tmp = a; a = b; b = tmp; }
    document.getElementById("tmat03-cat").value = a;
    document.getElementById("tmat03-an").value = b;
    runMeasurement();
  });
  document.getElementById("tmat03-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmat03-steps");
    const btn = document.getElementById("tmat03-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
