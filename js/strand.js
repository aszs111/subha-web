/* الخيط والخرز: رسم وحركة وإيماءات — نقل مطابق لنسخة أندرويد. */
'use strict';

const BEAD_STYLES = [
  { id: 'olive', name: 'زيتون', thread: '#C9A25A', accent: '#E2C27A', button: '#B8873F' },
  { id: 'amber', name: 'كهرمان', thread: '#8E1F1F', accent: '#F0A63A', button: '#E27A12', translucent: true },
  { id: 'turquoise', name: 'فيروز', thread: '#3E6FA8', accent: '#4FD4E8', button: '#27A7C2' },
  { id: 'yusr', name: 'يُسر', thread: '#A08A55', accent: '#D9C08A', button: '#3A3530' },
  { id: 'agate', name: 'عقيق', thread: '#D9B95B', accent: '#F08A6A', button: '#B8301F' },
  { id: 'lapis', name: 'لازورد', thread: '#D9B95B', accent: '#9DB4FF', button: '#2B48B0' },
  { id: 'pearl', name: 'لؤلؤ', thread: '#E8E0CC', accent: '#F3E6BE', button: '#E6DDCB' },
  { id: 'jade', name: 'يَشْم', thread: '#D9B95B', accent: '#7BD9A0', button: '#2F8F5B' },
];
const beadStyle = id => BEAD_STYLES.find(s => s.id === id) || BEAD_STYLES[0];

/** صور الخرز تُحمَّل مرة وتُحفظ. */
const BeadArt = (() => {
  const cache = new Map();
  const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src; });
  return {
    async load(id) {
      if (cache.has(id)) return cache.get(id);
      const p = (async () => {
        const base = 'assets/beads/';
        const [b0, b1, b2, disc, imam] = await Promise.all([
          img(`${base}bead_${id}_0.webp`), img(`${base}bead_${id}_1.webp`), img(`${base}bead_${id}_2.webp`),
          img(`${base}disc_${id}.webp`), img(`${base}imam_${id}.webp`),
        ]);
        return { style: beadStyle(id), beads: [b0, b1, b2], disc, imam };
      })();
      cache.set(id, p);
      return p;
    },
  };
})();

const mod100 = i => ((i % 100) + 100) % 100;
const clamp01 = x => Math.min(1, Math.max(0, x));
const easeOut = x => 1 - (1 - x) * (1 - x) * (1 - x);

/** هندسة الخيط: الوحدة i خرزة، وفوقها فاصلة إن كانت ٣٣ أو ٦٦، والخرزة ١٠٠ هي المئذنة. */
class StrandGeom {
  constructor(art, w, h, beadW, topBase, botTop, px1) {
    this.art = art; this.w = w; this.h = h; this.topBase = topBase; this.botTop = botTop; this.px1 = px1;
    this.s = beadW / art.beads[0].naturalWidth; this.cx = w / 2;
  }
  variant(i) { return (((i * 7 + Math.trunc(i / 3)) % 3) + 3) % 3; }
  item(i) { return mod100(i) === 0 ? this.art.imam : this.art.beads[this.variant(i)]; }
  hasDisc(i) { const m = mod100(i); return m === 33 || m === 66; }
  get discH() { return this.art.disc.naturalHeight * this.s; }
  unitH(i) { return this.item(i).naturalHeight * this.s + (this.hasDisc(i) ? this.discH : 0) + this.px1; }
}

function drawImg(ctx, g, im, top) {
  const w = im.naturalWidth * g.s, h = im.naturalHeight * g.s;
  ctx.drawImage(im, Math.round(g.cx - w / 2), Math.round(top), Math.round(w), Math.round(h));
}
function drawUnit(ctx, g, i, top) {
  let y = top;
  if (g.hasDisc(i)) { drawImg(ctx, g, g.art.disc, y); y += g.discH; }
  drawImg(ctx, g, g.item(i), y);
}
function drawRope(ctx, g, color, dp, W, H) {
  const tw = 2.6 * dp;
  ctx.strokeStyle = color; ctx.globalAlpha = 0.9; ctx.lineWidth = tw;
  ctx.beginPath(); ctx.moveTo(g.cx, -H * 0.1); ctx.lineTo(g.cx, H * 1.1); ctx.stroke();
  ctx.globalAlpha = 1;
  const step = 4 * dp;
  ctx.lineWidth = 0.9 * dp; ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath();
  for (let y = -H * 0.1; y < H * 1.1; y += step) { ctx.moveTo(g.cx - tw / 2, y); ctx.lineTo(g.cx + tw / 2, y + step * 0.6); }
  ctx.stroke();
  ctx.lineWidth = 0.7 * dp; ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  for (let y = -H * 0.1; y < H * 1.1; y += step) { ctx.moveTo(g.cx - tw / 2, y + step * 0.5); ctx.lineTo(g.cx + tw / 2, y + step * 1.1); }
  ctx.stroke();
}

/** يرسم الخيط كله (بوحدات بكسل اللوحة). */
function drawStrand(ctx, g, pos, falling, pendingAt, drag, bg, jolt = 0, tilt = 0, dp = 1) {
  const W = g.w, H = g.h;
  ctx.save();
  // الخيط معلّق من نقطة فوق الشاشة
  ctx.translate(g.cx, -H * 0.25); ctx.rotate(tilt * Math.PI / 180); ctx.translate(-g.cx, H * 0.25);
  drawRope(ctx, g, g.art.style.thread, dp, W, H);
  // السفلى
  const base = pos - falling.length;
  let push = 0;
  for (const [i, top] of falling) push += Math.min(g.unitH(i), Math.max(0, top + g.unitH(i) - g.botTop));
  let y = g.botTop + push + jolt, i = base, guard = 0;
  while (y < H && guard++ < 60) { drawUnit(ctx, g, i, y); y += g.unitH(i); i--; }
  // العليا: تنزل متتابعة
  let stack = 0;
  for (let m = 0; m < 60; m++) {
    const k = pos + 1 + m;
    const bottomEdge = g.topBase - pendingAt(m) - stack;
    if (bottomEdge < -H * 0.1) break;
    const hh = g.unitH(k);
    drawUnit(ctx, g, k, bottomEdge - hh + (m === 0 ? drag : 0));
    stack += hh;
  }
  for (const [k, top] of falling) drawUnit(ctx, g, k, top);
  if (g.art.style.translucent) {
    ctx.globalAlpha = 0.55; ctx.strokeStyle = g.art.style.thread; ctx.lineWidth = 1.6 * dp;
    ctx.beginPath(); ctx.moveTo(g.cx, -H * 0.1); ctx.lineTo(g.cx, H * 1.1); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
  // تلاشٍ أعلى وأسفل
  const f = H * 0.12;
  let gr = ctx.createLinearGradient(0, 0, 0, f);
  gr.addColorStop(0, bg); gr.addColorStop(1, bg + '00');
  ctx.fillStyle = gr; ctx.fillRect(-W, 0, W * 3, f);
  gr = ctx.createLinearGradient(0, H - f, 0, H);
  gr.addColorStop(0, bg + '00'); gr.addColorStop(1, bg);
  ctx.fillStyle = gr; ctx.fillRect(-W, H - f, W * 3, f + 2);
}

/** خيط ثابت للمعاينة. */
function drawPreview(canvas, art, bg) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const beadW = Math.min(w * 0.66, 90 * dpr);
  const g = new StrandGeom(art, w, h, beadW, h * 0.40, h * 0.62, 0.5 * dpr);
  drawStrand(ctx, g, 32, [], () => 0, 0, bg, 0, 0, dpr);
}

/** نوّاس مخمَّد للتأرجح (بالدرجات). */
class Swing {
  constructor() { this.target = 0; this.angle = 0; this.vel = 0; }
  kick() { this.vel += (Math.random() < 0.5 ? 1 : -1) * (5 + Math.random() * 3); }
  step(dt) { const acc = -38 * (this.angle - this.target) - 3.2 * this.vel; this.vel += acc * dt; this.angle += this.vel * dt; }
  settled() { return Math.abs(this.angle - this.target) < 0.01 && Math.abs(this.vel) < 0.02; }
}

/**
 * الخيط التفاعلي على لوحة الرسم: السحبة الواحدة تُسقط خرزة واحدة،
 * واللمسة بلا سحب تستدعي onTap، وtap() يُسقط خرزة من زر النقر أو من الصوت.
 */
class BeadStrand {
  constructor(canvas, { onDrop, onLand, onTap }) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.onDrop = onDrop; this.onLand = onLand; this.onTap = onTap;
    this.art = null; this.pos = 0; this.drops = []; this.drag = 0; this.dragAnim = null;
    this.jolt = 0; this.joltV = 0; this.swing = new Swing(); this.swayOn = true;
    this.bg = '#040404'; this.dirty = true; this.last = 0;
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.bindGestures();
    requestAnimationFrame(t => this.loop(t));
  }
  resize() {
    const dpr = this.dpr = window.devicePixelRatio || 1;
    this.W = this.cv.clientWidth * dpr; this.H = this.cv.clientHeight * dpr;
    this.cv.width = this.W; this.cv.height = this.H;
    this.geom(); this.dirty = true;
  }
  geom() {
    if (!this.art) return;
    const d = this.dpr;
    const beadW = Math.min(this.W * 0.62, 118 * d);
    this.g = new StrandGeom(this.art, this.W, this.H, beadW, this.H * 0.36, this.H * 0.64, 0.5 * d);
    this.releaseT = Math.min(this.g.unitH(1) * 0.45, 52 * d);
  }
  setArt(art) { this.art = art; this.geom(); this.dirty = true; }
  setCount(n) { if (n !== this.pos) { this.drops = []; this.drag = 0; this.pos = n; this.dirty = true; } }
  pendingAt(m, now) {
    let s = 0;
    for (const d of this.drops) {
      const t = clamp01((now - d.t0) / d.dur) - 0.07 * Math.min(m, 6);
      s += (1 - easeOut(clamp01(t / 0.5))) * this.g.unitH(d.index);
    }
    return s;
  }
  release() {
    if (!this.g) return;
    const now = performance.now();
    const i = this.pos + 1;
    const top = this.g.topBase - this.pendingAt(0, now) - this.g.unitH(i) + this.drag;
    const dur = Math.min(420, Math.max(140, Math.sqrt(Math.max(0.01, (this.g.botTop - top) / this.H)) * 520));
    this.drops.push({ index: i, y0: top, t0: now, dur });
    this.drag = 0; this.dragAnim = null; this.pos = i;
    this.onDrop();
  }
  tap() { this.drag = 0; this.release(); }

  bindGestures() {
    const cv = this.cv;
    let id = null, sx = 0, sy = 0, lastY = 0, dragging = false, released = false, hist = [];
    cv.addEventListener('pointerdown', e => {
      if (id !== null) return;
      id = e.pointerId; cv.setPointerCapture(id);
      sx = e.clientX; sy = e.clientY; lastY = sy; dragging = false; released = false; hist = [[e.timeStamp, sy]];
    });
    cv.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      hist.push([e.timeStamp, e.clientY]); if (hist.length > 6) hist.shift();
      if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) { dragging = true; lastY = e.clientY; }
      if (dragging && !released && this.g) {
        this.drag = Math.max(0, this.drag + (e.clientY - lastY) * this.dpr);
        this.dirty = true;
        if (this.drag >= this.releaseT) { this.release(); released = true; }
      }
      lastY = e.clientY;
    });
    const end = e => {
      if (e.pointerId !== id) return;
      id = null;
      if (!dragging) { this.onTap(); return; }
      if (!released && this.drag > 0) {
        const [t0, y0] = hist[0], [t1, y1] = hist[hist.length - 1];
        const v = t1 > t0 ? (y1 - y0) / (t1 - t0) * 1000 : 0; // px/s (CSS)
        if (v > 700) this.release();
        else this.dragAnim = { from: this.drag, t0: performance.now() };
      }
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', e => { if (e.pointerId === id) { id = null; this.dragAnim = { from: this.drag, t0: performance.now() }; } });
  }

  loop(t) {
    requestAnimationFrame(tt => this.loop(tt));
    const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0.016;
    this.last = t;
    if (!this.g) return;
    let active = this.dirty || this.drops.length > 0 || this.dragAnim || Math.abs(this.jolt) > 0.05 || Math.abs(this.joltV) > 0.05;
    // الخرزات التي وصلت
    for (const d of this.drops.slice()) {
      if (t - d.t0 >= d.dur) {
        this.drops.splice(this.drops.indexOf(d), 1);
        this.onLand();
        this.swing.kick();
        this.jolt = 6 * this.dpr; this.joltV = 0;
        active = true;
      }
    }
    if (this.dragAnim) {
      const p = clamp01((t - this.dragAnim.t0) / 180);
      this.drag = this.dragAnim.from * (1 - p);
      if (p >= 1) this.dragAnim = null;
    }
    // ارتداد (نابض)
    if (Math.abs(this.jolt) > 0.05 || Math.abs(this.joltV) > 0.05) {
      const k = 650, c = 2 * 0.3 * Math.sqrt(k);
      const steps = 4;
      for (let s = 0; s < steps; s++) { const a = -k * this.jolt - c * this.joltV; this.joltV += a * dt / steps; this.jolt += this.joltV * dt / steps; }
    } else { this.jolt = 0; this.joltV = 0; }
    if (this.swayOn || this.swing.angle !== 0) {
      if (!this.swayOn) this.swing.target = 0;
      if (!this.swing.settled()) { this.swing.step(dt); active = true; }
    }
    if (!active) return;
    this.dirty = false;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    const falling = this.drops.map(d => { const tt = clamp01((t - d.t0) / d.dur); return [d.index, d.y0 + (this.g.botTop - d.y0) * tt * tt]; });
    drawStrand(ctx, this.g, this.pos, falling, m => this.pendingAt(m, t), this.drag, this.bg, this.jolt, this.swing.angle, this.dpr);
  }
}

/** ميل الجوال: زاوية «الأسفل» الحقيقي بالنسبة للشاشة، مخففة ومحدودة بـ ٢٫٥ درجة. */
const Tilt = (() => {
  let smooth = 0, swing = null, on = false;
  function handler(e) {
    const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
    let deg = Math.atan2(a.x, a.y) * 180 / Math.PI;
    if (deg > 90) deg -= 180; else if (deg < -90) deg += 180;    // يوحّد إشارات iOS وأندرويد
    smooth += (deg - smooth) * 0.15;
    if (swing && on) swing.target = Math.max(-2.5, Math.min(2.5, smooth * 0.25));
  }
  return {
    attach(s) { swing = s; window.addEventListener('devicemotion', handler); },
    setOn(v) { on = v; if (!v && swing) swing.target = 0; },
    /** iOS يطلب الإذن من لمسة المستخدم. */
    async ask() {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try { await DeviceMotionEvent.requestPermission(); } catch (e) {}
      }
    },
  };
})();
