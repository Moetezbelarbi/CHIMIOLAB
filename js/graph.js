export class Graph {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = Object.assign({
      xmin: 0, xmax: 10,
      ymin: 0, ymax: 10,
      y2min: null, y2max: null, // Secondary Y-axis if needed
      xlabel: "", ylabel: "", y2label: "",
      padding: { l: 56, r: 50, t: 24, b: 44 },
      bg: "#ffffff",
      fg: "#1e293b",
      grid: "#e2e8f0",
      series: []
    }, opts);

    this.cursor = null; // { x, y } in data space
    this._initEvents();
    this.resize();
  }

  _initEvents() {
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.canvas.parentElement || this.canvas);
    }

    const onPointer = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      this.cursor = this._pxToData(px, py);
      this.draw();
    };

    const onLeave = () => {
      this.cursor = null;
      this.draw();
    };

    this.canvas.addEventListener("mousemove", onPointer);
    this.canvas.addEventListener("mouseleave", onLeave);
    this.canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.cursor = this._pxToData(touch.clientX - rect.left, touch.clientY - rect.top);
        this.draw();
      }
    }, { passive: true });
    this.canvas.addEventListener("touchend", onLeave);
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    if (this._ro) this._ro.disconnect();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height || 320));

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w;
    this.H = h;
    this.draw();
  }

  setSeries(series) {
    this.opts.series = series || [];
    this.draw();
  }

  setBounds(bounds) {
    Object.assign(this.opts, bounds);
    this.draw();
  }

  _xToPx(x) {
    const { padding, xmin, xmax } = this.opts;
    const span = (xmax - xmin) || 1;
    const w = this.W - padding.l - padding.r;
    return padding.l + ((x - xmin) / span) * w;
  }

  _yToPx(y, useY2 = false) {
    const { padding, ymin, ymax, y2min, y2max } = this.opts;
    const yLo = (useY2 && y2min !== null) ? y2min : ymin;
    const yHi = (useY2 && y2max !== null) ? y2max : ymax;
    const span = (yHi - yLo) || 1;
    const h = this.H - padding.t - padding.b;
    return this.H - padding.b - ((y - yLo) / span) * h;
  }

  _pxToData(px, py) {
    const { padding, xmin, xmax, ymin, ymax } = this.opts;
    const w = this.W - padding.l - padding.r;
    const h = this.H - padding.t - padding.b;
    if (px < padding.l || px > this.W - padding.r || py < padding.t || py > this.H - padding.b) {
      return null;
    }
    const x = xmin + ((px - padding.l) / w) * (xmax - xmin);
    const y = ymax - ((py - padding.t) / h) * (ymax - ymin);
    return { x, y, px, py };
  }

  _fmt(v) {
    if (!isFinite(v)) return "";
    if (Math.abs(v) >= 1000) return v.toFixed(0);
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    if (Math.abs(v) >= 1) return v.toFixed(2);
    if (Math.abs(v) >= 0.01) return v.toFixed(3);
    return v.toExponential(1);
  }

  draw() {
    const { ctx, W, H, opts } = this;
    if (!W || !H) return;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, W, H);

    const { padding } = opts;
    const plotW = W - padding.l - padding.r;
    const plotH = H - padding.t - padding.b;

    // Grille X
    ctx.strokeStyle = opts.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const x = opts.xmin + (opts.xmax - opts.xmin) * (i / xTicks);
      const px = this._xToPx(x);
      ctx.beginPath();
      ctx.moveTo(px, padding.t);
      ctx.lineTo(px, H - padding.b);
      ctx.stroke();
    }

    // Grille Y (Left)
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = opts.ymin + (opts.ymax - opts.ymin) * (i / yTicks);
      const py = this._yToPx(y);
      ctx.beginPath();
      ctx.moveTo(padding.l, py);
      ctx.lineTo(W - padding.r, py);
      ctx.stroke();
    }

    // Axes principaux
    ctx.strokeStyle = opts.fg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Axe Y
    ctx.moveTo(padding.l, padding.t);
    ctx.lineTo(padding.l, H - padding.b);
    // Axe X
    ctx.lineTo(W - padding.r, H - padding.b);
    // Axe Y2 (si présent)
    if (opts.y2min !== null && opts.y2max !== null) {
      ctx.moveTo(W - padding.r, padding.t);
      ctx.lineTo(W - padding.r, H - padding.b);
    }
    ctx.stroke();

    // Graduations & Labels X
    ctx.fillStyle = opts.fg;
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= xTicks; i++) {
      const x = opts.xmin + (opts.xmax - opts.xmin) * (i / xTicks);
      ctx.fillText(this._fmt(x), this._xToPx(x), H - padding.b + 6);
    }

    // Graduations & Labels Y1
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= yTicks; i++) {
      const y = opts.ymin + (opts.ymax - opts.ymin) * (i / yTicks);
      ctx.fillText(this._fmt(y), padding.l - 8, this._yToPx(y));
    }

    // Graduations & Labels Y2
    if (opts.y2min !== null && opts.y2max !== null) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#E65100";
      for (let i = 0; i <= yTicks; i++) {
        const y2 = opts.y2min + (opts.y2max - opts.y2min) * (i / yTicks);
        ctx.fillText(this._fmt(y2), W - padding.r + 8, this._yToPx(y2, true));
      }
    }

    // Titres des axes
    ctx.fillStyle = opts.fg;
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(opts.xlabel, padding.l + plotW / 2, H - 4);

    ctx.save();
    ctx.translate(14, padding.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(opts.ylabel, 0, 0);
    ctx.restore();

    if (opts.y2label && opts.y2min !== null) {
      ctx.save();
      ctx.translate(W - 12, padding.t + plotH / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#E65100";
      ctx.textAlign = "center";
      ctx.fillText(opts.y2label, 0, 0);
      ctx.restore();
    }

    // Tracé des séries
    (opts.series || []).forEach(s => this._drawSeries(s));

    // Curseur de survol interactif (crosshair)
    if (this.cursor) {
      ctx.save();
      ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Ligne verticale
      ctx.beginPath();
      ctx.moveTo(this.cursor.px, padding.t);
      ctx.lineTo(this.cursor.px, H - padding.b);
      ctx.stroke();

      // Ligne horizontale
      ctx.beginPath();
      ctx.moveTo(padding.l, this.cursor.py);
      ctx.lineTo(W - padding.r, this.cursor.py);
      ctx.stroke();

      // Bulle de coordonnées
      ctx.setLineDash([]);
      const text = `(${this.cursor.x.toFixed(2)} ; ${this.cursor.y.toFixed(2)})`;
      ctx.font = "bold 11px system-ui, sans-serif";
      const tm = ctx.measureText(text);
      const bx = Math.min(W - padding.r - tm.width - 12, Math.max(padding.l + 4, this.cursor.px + 8));
      const by = Math.max(padding.t + 16, this.cursor.py - 8);

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(bx - 4, by - 14, tm.width + 8, 18, 4);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx, by - 5);
      ctx.restore();
    }
  }

  _drawSeries(s) {
    if (!s || !s.points || s.points.length === 0) return;
    const ctx = this.ctx;
    const useY2 = !!s.useY2;
    ctx.save();
    ctx.strokeStyle = s.color || "#1565C0";
    ctx.fillStyle = s.color || "#1565C0";
    ctx.lineWidth = s.width !== undefined ? s.width : 2;

    if (s.dash) ctx.setLineDash(s.dash);
    else ctx.setLineDash([]);

    // Tracé de ligne
    if (s.type !== "scatter") {
      ctx.beginPath();
      let started = false;
      for (const p of s.points) {
        if (!isFinite(p.x) || !isFinite(p.y)) { started = false; continue; }
        const px = this._xToPx(p.x);
        const py = this._yToPx(p.y, useY2);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Points / Scatter
    if (s.type === "scatter" || s.showPoints) {
      const radius = s.pointRadius || 3.5;
      for (const p of s.points) {
        if (!isFinite(p.x) || !isFinite(p.y)) continue;
        const px = this._xToPx(p.x);
        const py = this._yToPx(p.y, useY2);

        ctx.beginPath();
        if (s.pointSymbol === "square") {
          ctx.rect(px - radius, py - radius, radius * 2, radius * 2);
        } else if (s.pointSymbol === "cross") {
          ctx.moveTo(px - radius, py - radius); ctx.lineTo(px + radius, py + radius);
          ctx.moveTo(px - radius, py + radius); ctx.lineTo(px + radius, py - radius);
        } else {
          ctx.arc(px, py, radius, 0, 2 * Math.PI);
        }
        ctx.fill();
        if (s.pointSymbol === "cross") ctx.stroke();
      }
    }

    ctx.restore();
  }
}
