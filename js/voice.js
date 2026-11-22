/* بصمة الصوت والعدّ بالصوت — نقل مطابق لنسخة أندرويد.
 * يعمل كله داخل المتصفح: لا يُرسل الصوت ولا يُحفظ، بل تُحفظ بصمته فقط. */
'use strict';

const Mfcc = (() => {
  const SR = 16000, WIN = 400, HOP = 160, NFFT = 512, NMEL = 26, NCEP = 13;
  const win = new Float32Array(WIN);
  for (let i = 0; i < WIN; i++) win[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (WIN - 1));
  const hz2mel = h => 2595 * Math.log10(1 + h / 700);
  const mel2hz = m => 700 * (Math.pow(10, m / 2595) - 1);
  const lo = hz2mel(80), hi = hz2mel(7600);
  const bins = [];
  for (let i = 0; i < NMEL + 2; i++) bins.push(Math.floor((NFFT + 1) * mel2hz(lo + (hi - lo) * i / (NMEL + 1)) / SR));
  const fb = [];
  for (let m = 0; m < NMEL; m++) {
    const row = new Float32Array(NFFT / 2 + 1);
    const a = bins[m], b = bins[m + 1], c = bins[m + 2];
    for (let k = 0; k <= NFFT / 2; k++) {
      if (k >= a && k < b && b > a) row[k] = (k - a) / (b - a);
      else if (k >= b && k <= c && c > b) row[k] = (c - k) / (c - b);
    }
    fb.push(row);
  }
  const dct = [];
  for (let i = 0; i < NCEP; i++) {
    const r = new Float32Array(NMEL);
    for (let j = 0; j < NMEL; j++) r[j] = Math.cos(Math.PI * i * (j + 0.5) / NMEL);
    dct.push(r);
  }

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const br = re[b] * cr - im[b] * ci, bi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - br; im[b] = im[a] - bi; re[a] += br; im[a] += bi;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  /** بصمة مقطع (Int16 أو Float بمقياس Int16): مصفوفة إطارات × ١٣ بعد توحيد المتوسط والتباين. */
  function features(x) {
    const n = x.length;
    if (n < WIN) return [];
    const frames = 1 + Math.floor((n - WIN) / HOP);
    const out = [];
    const re = new Float32Array(NFFT), im = new Float32Array(NFFT), mel = new Float32Array(NMEL);
    for (let f = 0; f < frames; f++) {
      const off = f * HOP;
      re.fill(0); im.fill(0);
      for (let i = 0; i < WIN; i++) {
        const prev = off + i > 0 ? x[off + i - 1] : 0;
        re[i] = (x[off + i] - 0.97 * prev) * win[i];
      }
      fft(re, im);
      for (let m = 0; m < NMEL; m++) {
        let s = 0; const row = fb[m];
        for (let k = 0; k <= NFFT / 2; k++) if (row[k]) s += row[k] * (re[k] * re[k] + im[k] * im[k]);
        mel[m] = Math.log(Math.max(s, 1e-3));
      }
      const c = new Float32Array(NCEP);
      for (let i = 0; i < NCEP; i++) { let s = 0; for (let m = 0; m < NMEL; m++) s += dct[i][m] * mel[m]; c[i] = s; }
      out.push(c);
    }
    for (let c = 0; c < NCEP; c++) {
      let mean = 0; for (const fr of out) mean += fr[c]; mean /= frames;
      let v = 0; for (const fr of out) { fr[c] -= mean; v += fr[c] * fr[c]; }
      const sd = Math.sqrt(v / frames) + 1e-3;
      for (const fr of out) fr[c] /= sd;
    }
    return out;
  }

  function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); }

  /** [المتوسط الكلي، أسوأ ربع] على مسار المواءمة الزمنية. */
  function dtw(a, b) {
    const n = a.length, m = b.length, BAD = [1e9, 1e9];
    if (!n || !m) return BAD;
    const band = Math.max(Math.abs(n - m), Math.floor(Math.max(n, m) * 0.3)) + 2;
    const INF = 1e30;
    const D = [], P = [], C = [];
    for (let i = 0; i <= n; i++) { D.push(new Float64Array(m + 1).fill(INF)); P.push(new Uint8Array(m + 1)); C.push(new Float32Array(m + 1)); }
    D[0][0] = 0;
    for (let i = 1; i <= n; i++) {
      const center = Math.floor(i * m / n);
      for (let j = Math.max(1, center - band); j <= Math.min(m, center + band); j++) {
        const d = dist(a[i - 1], b[j - 1]); C[i][j] = d;
        let best = D[i - 1][j - 1], bp = 0;
        if (D[i - 1][j] < best) { best = D[i - 1][j]; bp = 1; }
        if (D[i][j - 1] < best) { best = D[i][j - 1]; bp = 2; }
        if (best < INF) { D[i][j] = best + d; P[i][j] = bp; }
      }
    }
    if (D[n][m] >= INF) return BAD;
    const q = [0, 0, 0, 0], cnt = [0, 0, 0, 0];
    let i = n, j = m, steps = 0, tot = 0;
    while (i > 0 && j > 0) {
      const k = Math.min(3, Math.floor((i / n) * 4 - 1e-4));
      q[k] += C[i][j]; cnt[k]++; tot += C[i][j]; steps++;
      const p = P[i][j];
      if (p === 0) { i--; j--; } else if (p === 1) i--; else j--;
    }
    let worst = 0;
    for (let k = 0; k < 4; k++) if (cnt[k]) worst = Math.max(worst, q[k] / cnt[k]);
    return [tot / Math.max(1, steps), worst];
  }
  return { features, dtw, NCEP };
})();

/** بصمة ذكر: تسجيلات المستخدم الثلاثة. */
class VoiceModel {
  constructor(templates, durMs) {
    this.templates = templates; this.durMs = durMs;
    let a = 0, b = 0, n = 0;
    for (let i = 0; i < templates.length; i++) for (let j = i + 1; j < templates.length; j++) {
      const d = Mfcc.dtw(templates[i], templates[j]); a += d[0]; b += d[1]; n++;
    }
    this.mu = n ? a / n : 1; this.muQ = n ? b / n : 1;
  }
  score(f) {
    let best = 1e9, bestQ = 1e9;
    for (const t of this.templates) { const d = Mfcc.dtw(f, t); best = Math.min(best, d[0]); bestQ = Math.min(bestQ, d[1]); }
    return [best / this.mu, bestQ / this.muQ];
  }
  toJSON() { return { d: this.durMs, t: this.templates.map(t => t.map(fr => Array.from(fr, v => Math.round(v * 1000) / 1000))) }; }
  static from(o) { return new VoiceModel(o.t.map(t => t.map(fr => Float32Array.from(fr))), o.d); }
}

const VoiceStore = (() => {
  const cache = new Map();
  const key = id => 'subha.voice.' + id;
  return {
    has: id => localStorage.getItem(key(id)) !== null,
    get(id) {
      if (cache.has(id)) return cache.get(id);
      let m = null;
      try { const raw = localStorage.getItem(key(id)); if (raw) m = VoiceModel.from(JSON.parse(raw)); } catch (e) { m = null; }
      cache.set(id, m); return m;
    },
    save(id, templates, durMs) {
      const m = new VoiceModel(templates, durMs);
      localStorage.setItem(key(id), JSON.stringify(m)); cache.set(id, m); return m;
    },
    remove(id) { localStorage.removeItem(key(id)); cache.delete(id); },
  };
})();

/**
 * يستمع للميكروفون ويقطّع الكلام إلى تكرارات (إطارات ٢٠ مللي ثانية بمعدل ١٦ ألفًا)،
 * ويقارن كل تكرار ببصمة الذكر. في وضع التسجيل (enrollSink) يسلّم المقطع كما هو.
 */
class VoiceCounter {
  constructor({ onUtterance, onLevel, onReject }) {
    this.onUtterance = onUtterance; this.onLevel = onLevel; this.onReject = onReject || (() => {});
    this.model = null; this.others = []; this.strict = 1.22; this.sensitivity = 0.75; this.enrollSink = null;
    this.ctx = null; this.stream = null;
  }
  get running() { return !!this.ctx; }

  decide(seg) {
    const m = this.model; if (!m) return 0;
    const durMs = seg.length / 16;
    if (durMs < m.durMs * 0.45) return 0;
    const reps = durMs >= m.durMs * 1.7 ? Math.min(4, Math.round(durMs / m.durMs)) : 1;
    const part = Math.floor(seg.length / reps);
    let ok = 0;
    for (let r = 0; r < reps; r++) {
      const piece = seg.subarray(r * part, r === reps - 1 ? seg.length : (r + 1) * part);
      const f = Mfcc.features(piece);
      if (f.length < 8) continue;
      const s = m.score(f);
      if (s[0] > this.strict || s[1] > this.strict + 0.12) continue;
      if (this.others.some(o => o.score(f)[0] < s[0] * 0.95)) continue;
      ok++;
    }
    return ok;
  }

  handle(seg) {
    if (this.enrollSink) { this.enrollSink(seg); return; }
    const n = this.decide(seg);
    if (!n) this.onReject(); else for (let i = 0; i < n; i++) this.onUtterance();
  }

  async start() {
    if (this.ctx) return true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
    } catch (e) { return false; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    if (ctx.state === 'suspended') await ctx.resume();
    const src = ctx.createMediaStreamSource(this.stream);
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    const ratio = ctx.sampleRate / 16000;
    let carry = 0, last = 0;                // موضع إعادة التشكيل، وآخر عينة من الدفعة السابقة
    let pending = [];                        // عينات ١٦ ألفًا تنتظر إكمال إطار
    const st = { floor: -1, n: 0, speaking: false, above: 0, speechMs: 0, quietMs: 0, peak: 0, pre: [], seg: [], lastVoiced: 0 };
    const reset = () => { st.seg = []; st.speaking = false; st.speechMs = 0; st.quietMs = 0; };
    const finish = () => {
      const keep = Math.min(st.seg.length, st.lastVoiced + 4);
      let total = 0; for (let k = 0; k < keep; k++) total += st.seg[k].length;
      const out = new Float32Array(total); let o = 0;
      for (let k = 0; k < keep; k++) { out.set(st.seg[k], o); o += st.seg[k].length; }
      reset();
      setTimeout(() => this.handle(out), 0);
    };
    const frame = chunk => {
      let sum = 0; for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
      const rms = Math.sqrt(sum / chunk.length);
      st.n++;
      if (st.floor < 0) st.floor = rms;
      else if (rms < st.floor) st.floor = st.floor * 0.85 + rms * 0.15;
      else if (!st.speaking) st.floor = Math.min(st.floor * 1.004 + 0.2, rms);
      const factor = 3.6 - this.sensitivity * 2.4;
      const thrOn = Math.max(st.floor * factor, 60 + (1 - this.sensitivity) * 260);
      if (st.n % 3 === 0) this.onLevel(Math.min(1, rms / (thrOn * 3)));
      if (st.n < 10) return;
      if (!st.speaking) {
        st.pre.push(chunk); if (st.pre.length > 10) st.pre.shift();
        st.above = rms > thrOn ? st.above + 1 : 0;
        if (st.above >= 2) {
          st.speaking = true; st.above = 0; st.speechMs = 40; st.quietMs = 0; st.peak = rms;
          st.seg = st.pre.slice(); st.pre = []; st.lastVoiced = st.seg.length;
        }
        return;
      }
      st.seg.push(chunk);
      st.peak = Math.max(rms, st.peak * 0.996);
      const quiet = rms < Math.max(thrOn * 0.6, st.peak * 0.2);
      if (quiet) st.quietMs += 20; else { st.speechMs += 20 + st.quietMs; st.quietMs = 0; st.lastVoiced = st.seg.length; }
      if (this.enrollSink) {
        if (st.quietMs >= 450) { if (st.speechMs >= 250) finish(); else reset(); }
      } else {
        const exp = this.model ? this.model.durMs : 900;
        if (st.quietMs >= 100 && st.speechMs >= exp * 0.6) finish();
        else if (st.quietMs >= 1300) { if (st.speechMs >= 200) finish(); else reset(); }
        else if (st.speechMs >= exp * 4.5) finish();
      }
      if (st.seg.length > 600) reset();
    };
    proc.onaudioprocess = e => {
      const x = e.inputBuffer.getChannelData(0);
      // إعادة التشكيل إلى ١٦ ألفًا بالاستيفاء الخطي، وبمقياس Int16 كنسخة أندرويد
      let p = carry;
      while (p < x.length - 1) {
        const i = Math.floor(p), f = p - i;
        const a = i < 0 ? last : x[i];
        pending.push((a * (1 - f) + x[i + 1] * f) * 32767);
        p += ratio;
      }
      carry = p - x.length; last = x[x.length - 1];
      while (pending.length >= 320) frame(Float32Array.from(pending.splice(0, 320)));
      e.outputBuffer.getChannelData(0).fill(0);
    };
    src.connect(proc); proc.connect(ctx.destination);
    this.nodes = [src, proc];
    return true;
  }

  stop() {
    if (!this.ctx) return;
    try { this.nodes.forEach(n => n.disconnect()); } catch (e) {}
    this.stream.getTracks().forEach(t => t.stop());
    this.ctx.close(); this.ctx = null; this.stream = null;
    this.onLevel(0);
  }
}
