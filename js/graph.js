export class Graph {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = Object.assign({
      xmin: 0, xmax: 1, ymin: 0, ymax: 1,
      xlabel: "", ylabel: "",
      padding: { l: 48, r: 16, t: 16, b: 40 },
      bg: "#ffffff", fg: "#222222", grid: "#e0e0e0",
      series: []
    }, opts);
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);
    this.resize();
  }
  destroy() { window.removeEventListener("resize", this._onResize); }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
    this.draw();
  }
  setSeries(series) { this.opts.series = series; this.draw(); }
  setBounds(b) { Object.assign(this.opts, b); this.draw(); }
  _xToPx(x) { const { padding, xmin, xmax } = this.opts; const w = this.W - padding.l - padding.r; return padding.l + (x - xmin) / (xmax - xmin) * w; }
  _yToPx(y) { const { padding, ymin, ymax } = this.opts; const h = this.H - padding.t - padding.b; return this.H - padding.b - (y - ymin) / (ymax - ymin) * h; }
  draw() {
    const { ctx, W, H, opts } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, W, H);
    const { padding } = opts;
    ctx.strokeStyle = opts.grid; ctx.lineWidth = 1;
    const nx = 5, ny = 5;
    for (let i = 0; i <= nx; i++) { const x = opts.xmin + (opts.xmax - opts.xmin) * i / nx; const px = this._xToPx(x); ctx.beginPath(); ctx.moveTo(px, padding.t); ctx.lineTo(px, H - padding.b); ctx.stroke(); }
    for (let i = 0; i <= ny; i++) { const y = opts.ymin + (opts.ymax - opts.ymin) * i / ny; const py = this._yToPx(y); ctx.beginPath(); ctx.moveTo(padding.l, py); ctx.lineTo(W - padding.r, py); ctx.stroke(); }
    ctx.strokeStyle = opts.fg; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padding.l, padding.t); ctx.lineTo(padding.l, H - padding.b); ctx.lineTo(W - padding.r, H - padding.b); ctx.stroke();
    ctx.fillStyle = opts.fg; ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let i = 0; i <= nx; i++) { const x = opts.xmin + (opts.xmax - opts.xmin) * i / nx; const px = this._xToPx(x); ctx.fillText(this._fmt(x), px, H - padding.b + 4); }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let i = 0; i <= ny; i++) { const y = opts.ymin + (opts.ymax - opts.ymin) * i / ny; const py = this._yToPx(y); ctx.fillText(this._fmt(y), padding.l - 6, py); }
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(opts.xlabel, padding.l + (W - padding.l - padding.r) / 2, H - 4);
    ctx.save(); ctx.translate(12, padding.t + (H - padding.t - padding.b) / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "top"; ctx.fillText(opts.ylabel, 0, 0); ctx.restore();
    (opts.series || []).forEach(s => this._drawSeries(s));
  }
  _fmt(v) { if (Math.abs(v) >= 1000) return v.toFixed(0); if (Math.abs(v) >= 10) return v.toFixed(1); if (Math.abs(v) >= 1) return v.toFixed(2); return v.toFixed(3); }
  _drawSeries(s) {
    if (!s || !s.points || s.points.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = s.color || "#1565C0";
    ctx.fillStyle = s.color || "#1565C0";
    ctx.lineWidth = s.width || 2;
    if (s.width === 0) {
      for (const p of s.points) { const px = this._xToPx(p.x), py = this._yToPx(p.y); ctx.beginPath(); ctx.arc(px, py, 3, 0, 2 * Math.PI); ctx.fill(); }
    } else {
      if (s.dash) ctx.setLineDash(s.dash);
      ctx.beginPath();
      let started = false;
      for (const p of s.points) {
        if (!isFinite(p.x) || !isFinite(p.y)) { started = false; continue; }
        const px = this._xToPx(p.x), py = this._yToPx(p.y);
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}