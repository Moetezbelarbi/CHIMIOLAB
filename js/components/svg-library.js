export function svgRoot(w = 600, h = 400) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 " + w + " " + h);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("role", "img");
  return svg;
}
function el(tag, attrs) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
export function beaker(x, y, w = 100, h = 120, fillLevel = 0.5) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 6, fill: "#ffffff", stroke: "#607D8B", "stroke-width": 2 }));
  const fh = h * fillLevel;
  g.appendChild(el("rect", { x: x + 2, y: y + h - fh, width: w - 4, height: fh - 2, fill: "#90CAF9", opacity: 0.6 }));
  for (let i = 1; i < 5; i++) { const gy = y + h * i / 5; g.appendChild(el("line", { x1: x, y1: gy, x2: x + 10, y2: gy, stroke: "#455A64", "stroke-width": 1 })); }
  return g;
}
export function fioleJaugee(x, y, w = 80, h = 180, fillLevel = 0.6) {
  const g = el("g", {});
  g.appendChild(el("path", { d: `M${x + w / 2 - 6} ${y} L${x + w / 2 - 6} ${y + 30} L${x + 10} ${y + 80} L${x + 10} ${y + h - 10} Q${x + 10} ${y + h} ${x + 20} ${y + h} L${x + w - 20} ${y + h} Q${x + w - 10} ${y + h} ${x + w - 10} ${y + h - 10} L${x + w - 10} ${y + 80} L${x + w / 2 + 6} ${y + 30} L${x + w / 2 + 6} ${y} Z`, fill: "#ffffff", stroke: "#607D8B", "stroke-width": 2 }));
  g.appendChild(el("line", { x1: x + w / 2 - 8, y1: y + 40, x2: x + w / 2 + 8, y2: y + 40, stroke: "#C62828", "stroke-width": 2 }));
  const fh = h * fillLevel;
  g.appendChild(el("rect", { x: x + 12, y: y + h - fh, width: w - 24, height: fh - 8, fill: "#90CAF9", opacity: 0.5 }));
  return g;
}
export function burette(x, y, w = 30, h = 300, fillLevel = 0.7) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 3, fill: "#ffffff", stroke: "#607D8B", "stroke-width": 2 }));
  const fh = h * fillLevel;
  g.appendChild(el("rect", { x: x + 2, y: y + 2, width: w - 4, height: fh - 2, fill: "#90CAF9", opacity: 0.5 }));
  g.appendChild(el("path", { d: `M${x + 2} ${y + fh} Q${x + w / 2} ${y + fh + 6} ${x + w - 2} ${y + fh}`, stroke: "#0D47A1", "stroke-width": 1.5, fill: "none" }));
  for (let i = 0; i < 25; i++) { const gy = y + h * i / 25; const len = i % 5 === 0 ? 10 : 5; g.appendChild(el("line", { x1: x + w - len, y1: gy, x2: x + w, y2: gy, stroke: "#455A64", "stroke-width": 0.8 })); }
  g.appendChild(el("rect", { x: x + w / 2 - 4, y: y + h, width: 8, height: 16, fill: "#546E7A" }));
  return g;
}
export function pipetteJaugee(x, y, w = 14, h = 200) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 4, fill: "#ffffff", stroke: "#607D8B", "stroke-width": 2 }));
  g.appendChild(el("line", { x1: x - 2, y1: y + 40, x2: x + w + 2, y2: y + 40, stroke: "#C62828", "stroke-width": 2 }));
  g.appendChild(el("path", { d: `M${x + w / 2} ${y + h} L${x + w / 2 - 3} ${y + h + 12} L${x + w / 2 + 3} ${y + h + 12} Z`, fill: "#607D8B" }));
  return g;
}
export function balance(x, y, w = 140, h = 80) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y: y + 20, width: w, height: h - 20, rx: 8, fill: "#ECEFF1", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + 10, y: y + 30, width: w - 20, height: 30, fill: "#263238" }));
  const t = el("text", { x: x + w / 2, y: y + 50, "text-anchor": "middle", fill: "#00E676", "font-size": 14, "font-family": "monospace" }); t.textContent = "0.00 g"; g.appendChild(t);
  g.appendChild(el("ellipse", { cx: x + w / 2, cy: y + 20, rx: w / 2 - 4, ry: 8, fill: "#B0BEC5", stroke: "#455A64", "stroke-width": 2 }));
  return g;
}
export function spectrophotometer(x, y, w = 260, h = 120) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 6, fill: "#ECEFF1", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("circle", { cx: x + 24, cy: y + h / 2, r: 10, fill: "#FFEB3B", stroke: "#F57F17", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + 44, y: y + h / 2 - 16, width: 30, height: 32, fill: "#B0BEC5", stroke: "#455A64" }));
  g.appendChild(el("rect", { x: x + 90, y: y + h / 2 - 20, width: 30, height: 40, fill: "#90CAF9", stroke: "#455A64" }));
  g.appendChild(el("rect", { x: x + 140, y: y + h / 2 - 16, width: 24, height: 32, fill: "#546E7A", stroke: "#455A64" }));
  g.appendChild(el("rect", { x: x + 180, y: y + h / 2 - 16, width: 60, height: 32, fill: "#263238" }));
  const t = el("text", { x: x + 210, y: y + h / 2 + 5, "text-anchor": "middle", fill: "#00E676", "font-size": 12, "font-family": "monospace" }); t.textContent = "A = 0.000"; g.appendChild(t);
  return g;
}
export function bancOptique(x, y, w = 500, h = 40) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 4, fill: "#BCAAA4", stroke: "#5D4037", "stroke-width": 2 }));
  for (let i = 0; i <= 50; i++) { const gx = x + w * i / 50; g.appendChild(el("line", { x1: gx, y1: y, x2: gx, y2: y + (i % 5 === 0 ? 12 : 6), stroke: "#3E2723", "stroke-width": 0.8 })); }
  return g;
}
export function laserFenteEcran(x, y, w = 500, h = 200) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y: y + h / 2 - 10, width: 60, height: 20, rx: 3, fill: "#37474F" }));
  g.appendChild(el("circle", { cx: x + 60, cy: y + h / 2, r: 4, fill: "#FF1744" }));
  g.appendChild(el("rect", { x: x + 200, y: y + 20, width: 6, height: h - 40, fill: "#263238" }));
  g.appendChild(el("rect", { x: x + 200, y: y + h / 2 - 6, width: 6, height: 12, fill: "#FFFFFF" }));
  g.appendChild(el("rect", { x: x + w - 20, y: y + 10, width: 14, height: h - 20, fill: "#FAFAFA", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("ellipse", { cx: x + w - 13, cy: y + h / 2, rx: 3, ry: 18, fill: "#FF1744", opacity: 0.8 }));
  g.appendChild(el("ellipse", { cx: x + w - 13, cy: y + h / 2 - 40, rx: 2, ry: 6, fill: "#FF1744", opacity: 0.4 }));
  g.appendChild(el("ellipse", { cx: x + w - 13, cy: y + h / 2 + 40, rx: 2, ry: 6, fill: "#FF1744", opacity: 0.4 }));
  return g;
}
export function dynamometre(x, y, w = 30, h = 180) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 4, fill: "#FFFDE7", stroke: "#F57F17", "stroke-width": 2 }));
  for (let i = 0; i < 10; i++) { const gy = y + h * i / 10; g.appendChild(el("line", { x1: x, y1: gy, x2: x + (i % 2 === 0 ? 10 : 5), y2: gy, stroke: "#F57F17", "stroke-width": 0.8 })); }
  g.appendChild(el("rect", { x: x + w / 2 - 2, y: y - 8, width: 4, height: 8, fill: "#F57F17" }));
  return g;
}
export function tubesPiezometriques(x, y, w = 400, h = 200) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y: y + h / 2 - 15, width: w, height: 30, fill: "#E3F2FD", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + w * 0.55, y: y + h / 2 - 8, width: w * 0.2, height: 16, fill: "#90CAF9", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + w * 0.2, y: y + 20, width: 14, height: h / 2 - 35, fill: "#BBDEFB", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + w * 0.65, y: y + 40, width: 14, height: h / 2 - 55, fill: "#BBDEFB", stroke: "#455A64", "stroke-width": 2 }));
  return g;
}
export function seringueCapteur(x, y, w = 220, h = 80) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y: y + h / 2 - 14, width: w * 0.55, height: 28, rx: 4, fill: "#FFFFFF", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + w * 0.55, y: y + h / 2 - 4, width: 40, height: 8, fill: "#90A4AE" }));
  g.appendChild(el("rect", { x: x + w * 0.55 + 40, y: y + h / 2 - 14, width: 8, height: 28, fill: "#455A64" }));
  g.appendChild(el("rect", { x: x + w - 70, y: y + 20, width: 60, height: 40, rx: 4, fill: "#263238" }));
  const t = el("text", { x: x + w - 40, y: y + 44, "text-anchor": "middle", fill: "#00E676", "font-size": 12, "font-family": "monospace" }); t.textContent = "P = 1013 hPa"; g.appendChild(t);
  return g;
}
export function agitateurBarreau(x, y, w = 120, h = 30) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 4, fill: "#ECEFF1", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("circle", { cx: x + w / 2, cy: y - 8, r: 3, fill: "#546E7A" }));
  return g;
}
export function phMetreSonde(x, y, w = 200, h = 140) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w * 0.5, height: h * 0.6, rx: 6, fill: "#ECEFF1", stroke: "#455A64", "stroke-width": 2 }));
  g.appendChild(el("rect", { x: x + 10, y: y + 10, width: w * 0.5 - 20, height: 30, fill: "#263238" }));
  const t = el("text", { x: x + w * 0.25, y: y + 32, "text-anchor": "middle", fill: "#00E676", "font-size": 14, "font-family": "monospace" }); t.textContent = "pH = 7.00"; g.appendChild(t);
  g.appendChild(el("line", { x1: x + w * 0.5, y1: y + h * 0.3, x2: x + w * 0.9, y2: y + h * 0.8, stroke: "#455A64", "stroke-width": 4 }));
  g.appendChild(el("circle", { cx: x + w * 0.9, cy: y + h * 0.8, r: 6, fill: "#90A4AE", stroke: "#455A64" }));
  return g;
}
export function celluleConductimetrique(x, y, w = 80, h = 120) {
  const g = el("g", {});
  g.appendChild(el("rect", { x, y, width: w, height: h, rx: 4, fill: "#E3F2FD", stroke: "#455A64", "stroke-width": 2, opacity: 0.7 }));
  g.appendChild(el("rect", { x: x + 14, y: y + 10, width: 8, height: h - 30, fill: "#B0BEC5", stroke: "#37474F" }));
  g.appendChild(el("rect", { x: x + w - 22, y: y + 10, width: 8, height: h - 30, fill: "#B0BEC5", stroke: "#37474F" }));
  return g;
}
