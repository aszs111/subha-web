/* سُبحة — نسخة المتصفح */
'use strict';

const $ = s => document.querySelector(s);
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const en = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const todayEpoch = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8l11-11-3.8-3.8zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"/></svg>',
  micNone: '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1-9a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0zm6.3 6a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"/></svg>',
  add: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" style="transform:scaleX(-1)"><path d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M7.4 15.4 12 10.8l4.6 4.6L18 14l-6-6-6 6z"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"/></svg>',
};

/* ───────────── الحالة ───────────── */
const DEFAULTS = [
  ['سُبْحَانَ اللهِ', 33, 'olive'], ['الْحَمْدُ لِلّٰهِ', 33, 'olive'], ['اللهُ أَكْبَرُ', 33, 'olive'],
  ['سُبْحَانَ اللهِ وَبِحَمْدِهِ', 100, 'yusr'], ['أَسْتَغْفِرُ اللهَ', 100, 'amber'],
  ['لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', 100, 'turquoise'],
  ['اللَّهُمَّ صَلِّ عَلَى نَبِيِّنَا مُحَمَّدٍ', 100, 'agate'],
];
const S = (() => {
  let st = null;
  try { st = JSON.parse(localStorage.getItem('subha.state')); } catch (e) {}
  if (!st || !Array.isArray(st.adhkar) || !st.adhkar.length) {
    st = { adhkar: DEFAULTS.map(([t, g, b], i) => ({ id: i + 1, text: t, target: g, count: 0, total: 0, bead: b, today: 0, day: 0 })), current: 1 };
  }
  const defs = { sound: true, vibrate: true, keepOn: true, autoNext: true, sway: true, volume: 0.8, bg: 'black', voiceSens: 0.75, matchStrict: 0.5, tipsOff: false };
  for (const k in defs) if (st[k] === undefined) st[k] = defs[k];
  for (const d of st.adhkar) if (d.fadl === undefined) d.fadl = fadlOf(d.text);
  if (!st.adhkar.some(d => d.id === st.current)) st.current = st.adhkar[0].id;
  return st;
})();
const save = () => localStorage.setItem('subha.state', JSON.stringify(S));
const cur = () => S.adhkar.find(d => d.id === S.current) || S.adhkar[0];
const todayOf = d => d.day === todayEpoch() ? d.today : 0;
const strictValue = () => 1.38 - 0.28 * S.matchStrict;

function tick() {
  const d = cur(), td = todayEpoch();
  d.today = (d.day === td ? d.today : 0) + 1; d.day = td;
  d.count++; d.total++; save();
  return d.target > 0 && d.count === d.target;
}
function goNext() {
  if (S.adhkar.length < 2) return;
  const i = S.adhkar.findIndex(d => d.id === S.current);
  const n = S.adhkar[(i + 1) % S.adhkar.length];
  S.current = n.id; n.count = 0; save();
}
function browse(step) {
  if (S.adhkar.length < 2) return;
  const i = S.adhkar.findIndex(d => d.id === S.current);
  S.current = S.adhkar[((i + step) % S.adhkar.length + S.adhkar.length) % S.adhkar.length].id; save();
}

/* ───────────── الصوت والاهتزاز ───────────── */
const Sound = (() => {
  let ctx = null; const buf = {};
  const files = { c1: 'clack_1', c2: 'clack_2', c3: 'clack_3', done: 'done' };
  async function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (const [k, f] of Object.entries(files)) {
      fetch(`assets/sounds/${f}.wav`).then(r => r.arrayBuffer()).then(a => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej))).then(b => { buf[k] = b; }).catch(() => {});
    }
  }
  function play(k, vol, rate = 1) {
    if (!ctx || !buf[k]) return;
    if (ctx.state === 'suspended') ctx.resume();
    const s = ctx.createBufferSource(); s.buffer = buf[k]; s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(ctx.destination); s.start();
  }
  return {
    init,
    clack() { play(['c1', 'c2', 'c3'][Math.floor(Math.random() * 3)], (0.75 + Math.random() * 0.25) * S.volume, 0.94 + Math.random() * 0.12); },
    done() { play('done', S.volume); },
  };
})();
const vib = p => { if (S.vibrate && navigator.vibrate) navigator.vibrate(p); };

// أول لمسة: تفعيل الصوت، وإذن الحركة في iOS
let unlocked = false;
document.addEventListener('pointerdown', () => {
  if (unlocked) return; unlocked = true;
  Sound.init(); if (S.sway) Tilt.ask();
}, { capture: true });

/* ───────────── إبقاء الشاشة مضاءة ───────────── */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && document.visibilityState === 'visible') { if (!wakeLock) wakeLock = await navigator.wakeLock.request('screen'); }
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wakeLock = null; keepAwake(S.keepOn && !pageOpen()); }
  else { stopVoice(); }
});

/* ───────────── شريط الرسائل ───────────── */
let snackTimer = null;
function snack(text, action, onAction, ms = 4000) {
  const el = $('#snackbar');
  $('#snackText').textContent = text;
  const b = $('#snackAction');
  b.textContent = action || ''; b.classList.toggle('hidden', !action);
  b.onclick = () => { el.classList.add('hidden'); onAction && onAction(); };
  el.classList.remove('hidden');
  clearTimeout(snackTimer); snackTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

/* ───────────── الشاشة الرئيسية ───────────── */
const app = $('#app');
const strand = new BeadStrand($('#strand'), {
  onDrop() {
    const d = cur();
    if (S.autoNext && S.adhkar.length > 1 && d.target > 0 && d.count >= d.target) {
      goNext(); tick(); render(true); return;
    }
    const reached = tick();
    renderCount(true);
    if (reached) {
      const id = S.current;
      setTimeout(() => {
        vib([0, 70, 90, 70, 90, 160]);
        if (S.sound) Sound.done();
        if (S.autoNext && S.adhkar.length > 1) setTimeout(() => { if (S.current === id) { goNext(); render(true); } }, 700);
      }, 380);
    }
  },
  onLand() { if (S.sound) Sound.clack(); vib(12); },
  onTap() { openBeads(); },
});
Tilt.attach(strand.swing);

let shownId = null;
async function render(fade) {
  const d = cur(), st = beadStyle(d.bead);
  app.classList.toggle('bg-black', S.bg !== 'green');
  app.classList.toggle('bg-green', S.bg === 'green');
  strand.bg = S.bg === 'green' ? '#062B1C' : '#040404';
  strand.swayOn = S.sway; Tilt.setOn(S.sway);
  document.documentElement.style.setProperty('--accent', st.accent);
  document.documentElement.style.setProperty('--btn', st.button);
  const t = $('#dhikrText');
  const len = d.text.length;
  t.style.fontSize = (len <= 16 ? 42 : len <= 30 ? 35 : len <= 70 ? 28 : 23) + 'px';
  if (fade && shownId !== d.id) { $('#panel').animate([{ opacity: 0 }, { opacity: 1 }], 450); $('#strand').animate([{ opacity: 0 }, { opacity: 1 }], 450); }
  t.textContent = d.text;
  if (shownId !== d.id || strand.art?.style.id !== st.id) {
    strand.setArt(await BeadArt.load(st.id));
  }
  shownId = d.id;
  strand.setCount(d.count);
  $('#vol').value = S.volume;
  renderCount(false);
}
function renderCount(pop) {
  const d = cur(), done = d.target > 0 && d.count >= d.target;
  const c = $('#count');
  c.textContent = ar(d.count);
  c.style.fontSize = d.count < 1000 ? '112px' : '82px';
  c.style.color = done ? 'var(--accent)' : 'var(--cream)';
  if (pop) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
  $('#of').textContent = d.target > 0 ? `من ${ar(d.target)}` : 'بلا حد';
  const filled = d.target > 0 ? Math.min(3, Math.floor(d.count * 3 / d.target)) : Math.floor(d.count / 33) % 4;
  document.querySelectorAll('#diamonds i').forEach((el, k) => el.classList.toggle('on', k < filled));
  const td = $('#today');
  td.textContent = done && d.target === 100 ? 'مئةٌ اليوم' : done ? 'اكتمل الورد' : `اليوم: ${ar(todayOf(d))}`;
  td.classList.toggle('done', done);
}

function doReset() {
  const d = cur(), old = d.count;
  d.count = 0; save(); render();
  if (old > 0) snack('أُعيد العدّ إلى الصفر', 'تراجع', () => { cur().count = old; save(); render(); });
}

$('#btnReset').onclick = doReset;
$('#btnSettings').onclick = () => openSettings();
$('#vol').oninput = e => { S.volume = +e.target.value; save(); };
$('#vol').onchange = () => { if (S.sound) Sound.clack(); };

// الذكر: ضغطة مطولة = قائمة الأذكار، نقرتان = فضل الذكر، نقرة = تلميح، سحب أفقي = التنقل
(() => {
  const box = $('#dhikrBox');
  let x0 = null, y0 = 0, moved = false, longT = null, long = false, lastTap = 0, tapT = null;
  box.addEventListener('pointerdown', e => {
    x0 = e.clientX; y0 = e.clientY; moved = false; long = false;
    longT = setTimeout(() => { long = true; vib(30); openAdhkar(); }, 550);
  });
  box.addEventListener('pointermove', e => {
    if (x0 !== null && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) { moved = true; clearTimeout(longT); }
  });
  box.addEventListener('pointerup', e => {
    clearTimeout(longT);
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (long) return;
    if (moved) { if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(e.clientY - y0)) { browse(dx < 0 ? 1 : -1); render(true); } return; }
    const now = Date.now();
    if (now - lastTap < 320) { clearTimeout(tapT); lastTap = 0; fadlDialog(cur()); return; }
    lastTap = now;
    tapT = setTimeout(() => snack('اضغط مطولًا لقائمة الأذكار، وانقر نقرتين لفضل الذكر'), 330);
  });
  box.addEventListener('pointercancel', () => { clearTimeout(longT); x0 = null; });
  box.addEventListener('contextmenu', e => e.preventDefault());
})();

// زر النقر: ضغطة تُسقط خرزة، وضغطة مطولة تصفّر العداد
(() => {
  const b = $('#tapBtn');
  let timer = null, long = false;
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); b.classList.add('down'); long = false;
    timer = setTimeout(() => { long = true; vib(40); doReset(); }, 550);
  });
  const up = fire => () => {
    b.classList.remove('down'); clearTimeout(timer);
    if (fire && !long) strand.tap();
  };
  b.addEventListener('pointerup', up(true));
  b.addEventListener('pointerleave', up(false));
  b.addEventListener('pointercancel', up(false));
  b.addEventListener('contextmenu', e => e.preventDefault());
})();

/* ───────────── العدّ بالصوت ───────────── */
const micBtn = $('#micBtn'), ring = micBtn.querySelector('.ring');
const voice = new VoiceCounter({
  onUtterance: () => strand.tap(),
  onLevel: lv => { ring.style.opacity = voice.running ? (0.25 + 0.5 * lv) : 0; ring.style.transform = `scale(${0.78 + 0.22 * lv})`; },
  onReject: () => { micBtn.classList.add('reject'); setTimeout(() => micBtn.classList.remove('reject'), 600); },
});
function syncVoiceModel() {
  voice.model = VoiceStore.get(S.current);
  voice.others = S.adhkar.filter(d => d.id !== S.current).map(d => VoiceStore.get(d.id)).filter(Boolean);
  voice.sensitivity = S.voiceSens; voice.strict = strictValue();
}
async function startVoice() {
  syncVoiceModel();
  if (!voice.model) { openEnroll(cur(), saved => { if (saved) startVoice(); }); return; }
  const ok = await voice.start();
  if (!ok) { snack('العدّ بالصوت يحتاج إذن الميكروفون'); return; }
  micBtn.classList.add('on');
  snack('قل الذكر، وتسقط خرزة مع كل مرة يطابق فيها بصمتك');
}
function stopVoice() { voice.stop(); micBtn.classList.remove('on'); ring.style.opacity = 0; }
micBtn.onclick = () => voice.running ? stopVoice() : startVoice();
// عند تغيّر الذكر أثناء الاستماع
const _render = render;
render = async function (fade) {
  await _render(fade);
  if (voice.running) {
    syncVoiceModel();
    if (!voice.model) { stopVoice(); snack('لم تُسجَّل بصمة هذا الذكر بعد', 'سجّلها', () => openEnroll(cur(), s => { if (s) startVoice(); })); }
  }
};

/* ───────────── الصفحات ───────────── */
const page = $('#page');
const pageOpen = () => !page.classList.contains('hidden');
// التنقل: كل صفحة وكل حوار يُضاف إلى سجل المتصفح ليعمل زر الرجوع
const stack = [];
let ignorePop = 0;
const OPENERS = () => ({ adhkar: openAdhkar, beads: openBeads, settings: openSettings });
function showPage(name, html, bind, push = true) {
  if (push) { stack.push(name); history.pushState({ p: name }, ''); }
  page.innerHTML = html; page.classList.remove('hidden');
  if (push) page.scrollTop = 0;
  page.querySelectorAll('[data-back]').forEach(b => b.onclick = back);
  bind && bind();
  keepAwake(false);
}
function back() { history.back(); }
function closeAllPages() {
  const n = stack.length; stack.length = 0;
  page.classList.add('hidden'); page.innerHTML = ''; render(); keepAwake(S.keepOn);
  if (n) { ignorePop++; history.go(-n); }
}
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop--; return; }
  if (!$('#dialog').classList.contains('hidden')) { closeDialog(true); return; }
  if (!stack.length) return;
  stack.pop();
  const prev = stack[stack.length - 1];
  if (prev) OPENERS()[prev](false);
  else { page.classList.add('hidden'); page.innerHTML = ''; render(); keepAwake(S.keepOn); }
});
const bar = title => `<div class="bar"><button class="icon" data-back aria-label="رجوع">${ICON.back}</button><h1>${title}</h1></div>`;

/* الأذكار */
function openAdhkar(push = true) {
  const items = S.adhkar.map(d => {
    const sel = d.id === S.current, hv = VoiceStore.has(d.id);
    return `<div class="card ${sel ? 'sel' : ''}" data-id="${d.id}">
      ${sel ? `<span class="check">${ICON.check}</span>` : ''}
      <div class="txt"><div class="t">${esc(d.text)}</div>
      <div class="meta">الهدف: ${d.target > 0 ? ar(d.target) : 'بلا حد'} · العدد: ${ar(d.count)} · المجموع: ${ar(d.total)}</div></div>
      <button class="icon ${hv ? 'has' : ''}" data-voice="${d.id}" aria-label="${hv ? 'بصمة الصوت مسجّلة' : 'تسجيل بصمة الصوت'}">${hv ? ICON.mic : ICON.micNone}</button>
      <button class="icon" data-edit="${d.id}" aria-label="تعديل">${ICON.edit}</button></div>`;
  }).join('');
  showPage('adhkar', bar('الأذكار') + items + `<div style="height:90px"></div><button class="fab" id="addD">${ICON.add} إضافة ذكر</button>`, () => {
    page.querySelectorAll('.card').forEach(c => {
      let last = 0, t = null, lt = null, long = false;
      const d = () => S.adhkar.find(x => x.id === +c.dataset.id);
      c.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        long = false; lt = setTimeout(() => { long = true; vib(30); dhikrDialog(d()); }, 550);
      });
      c.addEventListener('pointermove', () => {});
      c.addEventListener('pointerleave', () => clearTimeout(lt));
      c.addEventListener('pointercancel', () => clearTimeout(lt));
      c.addEventListener('contextmenu', e => e.preventDefault());
      c.addEventListener('pointerup', e => {
        clearTimeout(lt);
        if (e.target.closest('button') || long) return;
        const now = Date.now();
        if (now - last < 320) { clearTimeout(t); last = 0; fadlDialog(d()); return; }
        last = now;
        t = setTimeout(() => { S.current = +c.dataset.id; save(); closeAllPages(); }, 330);
      });
    });
    page.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => dhikrDialog(S.adhkar.find(d => d.id === +b.dataset.edit)));
    page.querySelectorAll('[data-voice]').forEach(b => b.onclick = () => openEnroll(S.adhkar.find(d => d.id === +b.dataset.voice), () => refreshAdhkar()));
    $('#addD').onclick = () => dhikrDialog(null);
  }, push);
}
const refreshAdhkar = () => { if (stack[stack.length - 1] === 'adhkar') openAdhkar(false); };

const PRESETS = [33, 100, 300, 500, 1000, 0];
const chips = (target, attr) => `<div class="chips">${PRESETS.map(n => `<button class="chip ${target === n ? 'on' : ''}" ${attr}="${n}">${n ? ar(n) : 'بلا حد'}</button>`).join('')}</div>`;

function dhikrDialog(d) {
  let target = d ? d.target : 100;
  openDialog(`<h2>${d ? 'تعديل الذكر' : 'ذكر جديد'}</h2>
    <textarea class="field" id="dt" placeholder="نص الذكر">${d ? esc(d.text) : ''}</textarea>
    <div style="color:var(--gold);margin:12px 0 4px">فضل هذا الذكر (اختياري)</div>
    <textarea class="field" id="df" style="min-height:110px" placeholder="مثل: حديث في فضله مع تخريجه">${d ? esc(d.fadl || '') : ''}</textarea>
    <div style="color:var(--gold);margin:12px 0 0">عدد المرات (الخطة)</div>
    <div id="dch" style="margin:0 -20px">${chips(target, 'data-n')}</div>
    <input class="field" id="dn" inputmode="numeric" placeholder="عدد مخصص (فارغ = بلا حد)" value="${target > 0 ? target : ''}">
    ${d ? `<div class="row" style="padding:10px 0 0">
      <button class="icon" id="mUp" aria-label="تقديم">${ICON.up}</button><button class="icon" id="mDn" aria-label="تأخير">${ICON.down}</button>
      <span style="flex:1"></span><button class="textbtn" id="clrT">تصفير المجموع</button></div>
      ${S.adhkar.length > 1 ? '<button class="textbtn danger" id="del">حذف هذا الذكر</button>' : ''}` : ''}
    <div class="actions"><button class="textbtn" id="ok">حفظ</button><button class="textbtn" data-close>إلغاء</button></div>`);
  const dn = $('#dn');
  const setChips = () => $('#dch').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', +c.dataset.n === target));
  $('#dch').querySelectorAll('.chip').forEach(c => c.onclick = () => { target = +c.dataset.n; dn.value = target || ''; setChips(); });
  dn.oninput = () => { target = +en(dn.value) || 0; setChips(); };
  $('#ok').onclick = () => {
    const text = $('#dt').value.trim(); if (!text) return;
    const fadl = $('#df').value.trim();
    if (d) { d.text = text; d.target = target; d.fadl = fadl; }
    else S.adhkar.push({ id: Math.max(...S.adhkar.map(x => x.id)) + 1, text, target, count: 0, total: 0, bead: cur().bead, today: 0, day: 0, fadl: fadl || fadlOf(text) });
    save(); closeDialog(); refreshAdhkar(); if (!pageOpen()) render();
  };
  if (d) {
    const mv = k => { const i = S.adhkar.indexOf(d), j = i + k; if (j < 0 || j >= S.adhkar.length) return; S.adhkar.splice(i, 1); S.adhkar.splice(j, 0, d); save(); refreshAdhkar(); };
    $('#mUp').onclick = () => mv(-1); $('#mDn').onclick = () => mv(1);
    $('#clrT').onclick = () => { d.total = 0; save(); refreshAdhkar(); };
    const del = $('#del');
    if (del) del.onclick = () => {
      if (!confirm('حذف الذكر؟\n' + d.text)) return;
      S.adhkar.splice(S.adhkar.indexOf(d), 1); VoiceStore.remove(d.id);
      if (S.current === d.id) S.current = S.adhkar[0].id;
      save(); closeDialog(); refreshAdhkar();
    };
  }
}

/* فضل الذكر */
function fadlDialog(d) {
  const has = (d.fadl || '').trim();
  openDialog(`<h2 style="color:var(--gold);font-weight:700">فضل الذكر</h2>
    <div style="text-align:center;font-size:26px;line-height:1.5;margin-bottom:10px">${esc(d.text)}</div>
    <div style="border-top:1px solid rgba(217,185,91,.3);padding-top:12px;font-size:21px;line-height:1.75;white-space:pre-line;${has ? '' : 'color:rgba(247,239,218,.7)'}">${has ? esc(d.fadl) : 'لم يُكتب فضلٌ لهذا الذكر بعد. يمكنك إضافته من «تعديل».'}</div>
    <div class="actions"><button class="textbtn" data-close>حسنًا</button><button class="textbtn" id="fEdit">${has ? 'تعديل' : 'إضافة فضل'}</button></div>`);
  $('#fEdit').onclick = () => { closeDialog(); setTimeout(() => dhikrDialog(d), 50); };
}

/* شكل الخرز */
function openBeads(push = true) {
  const d = cur();
  const items = BEAD_STYLES.map(st => `<div class="strandItem ${st.id === d.bead ? 'sel' : ''}" data-s="${st.id}">
    <canvas></canvas><div class="nm" style="${st.id === d.bead ? `color:${st.accent}` : ''}">${st.name}</div>
    <div class="bar2" style="background:${st.id === d.bead ? st.accent : 'transparent'}"></div></div>`).join('');
  showPage('beads', bar('شكل الخرز') +
    `<div style="text-align:center;padding:4px 20px;color:rgba(247,239,218,.75);font-size:21px">${esc(d.text)}</div>
     <div class="gallery">${items}</div>
     <div style="text-align:center"><button class="textbtn" id="allB">استعمال هذا الخرز لكل الأذكار</button></div>`, () => {
    const bg = S.bg === 'green' ? '#062B1C' : '#040404';
    page.querySelectorAll('.strandItem').forEach(el => {
      BeadArt.load(el.dataset.s).then(art => drawPreview(el.querySelector('canvas'), art, bg));
      el.onclick = () => {
        d.bead = el.dataset.s; save();
        page.querySelectorAll('.strandItem').forEach(x => {
          const st = beadStyle(x.dataset.s), on = x.dataset.s === d.bead;
          x.classList.toggle('sel', on);
          x.querySelector('.nm').style.color = on ? st.accent : '';
          x.querySelector('.bar2').style.background = on ? st.accent : 'transparent';
        });
      };
    });
    $('#allB').onclick = () => { S.adhkar.forEach(x => x.bead = d.bead); save(); snack('صار هذا الخرز لكل الأذكار'); };
  }, push);
}

/* الإعدادات */
function openSettings(push = true) {
  const d = cur(), hv = VoiceStore.has(d.id);
  const sw = (key, t, s) => `<div class="row"><div class="txt"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div>
    <label class="switch"><input type="checkbox" data-k="${key}" ${S[key] ? 'checked' : ''}><span></span></label></div>`;
  const sl = (key, t, lo, hi) => `<div style="padding:8px 20px 0;font-size:19px">${t}</div><div class="slider">${lo}<input type="range" min="0" max="1" step="0.01" data-r="${key}" value="${S[key]}">${hi}</div>`;
  showPage('settings', bar('الإعدادات') + `
    <div class="section">التنبيه</div>
    ${sw('sound', 'صوت فرقعة الخرز')}
    ${sw('vibrate', 'الاهتزاز مع كل خرزة', 'واهتزاز أطول عند إتمام العدد (لا تدعمه متصفحات آيفون)')}
    ${sw('keepOn', 'إبقاء الشاشة مضاءة', 'أثناء التسبيح في الشاشة الرئيسية')}
    ${sw('sway', 'تأرجح الخيط مع ميل الجوال', 'يتدلى الخيط ويتأرجح كالمسبحة الحقيقية')}

    <div class="section">العدّ بالصوت (بصمة صوتك)</div>
    <div class="para">سجّل كل ذكر بصوتك ثلاث مرات (زر الميكروفون في قائمة الأذكار)، ثم اضغط زر الميكروفون في الشاشة الرئيسية وقل الذكر: تسقط خرزة كلما طابق نطقُك البصمة، ولا يستجيب لغيره. وكلما سجّلتَ أذكارًا أكثر زاد التمييز بينها. يعمل داخل المتصفح دون إرسال شيء، ولا يحفظ تسجيلاتك الصوتية بل بصمتها فقط.</div>
    <div class="row" style="padding-top:0"><button class="textbtn" id="enr">${hv ? 'إعادة تسجيل' : 'تسجيل'} بصمة «${esc(d.text.slice(0, 24))}»</button>
      ${hv ? '<button class="textbtn danger" id="delV">حذف</button>' : ''}</div>
    ${sl('voiceSens', 'حساسية الميكروفون', 'منخفضة', 'عالية')}
    <div class="note">ارفعها إن كان صوتك خافتًا أو الجوال بعيدًا، واخفضها في المكان المزعج.</div>
    ${sl('matchStrict', 'دقة التمييز', 'متساهل', 'صارم')}
    <div class="note">إن رفض نطقك الصحيح أحيانًا فاجعله أكثر تساهلًا، وإن استجاب لكلام آخر فاجعله أشد صرامة.</div>

    <div class="section">الخطة</div>
    <div class="row" style="padding-bottom:0"><div class="txt"><div class="t">الذكر الحالي: ${esc(d.text)}</div>
      <div class="s" id="planTxt">أريد أن أذكره: ${d.target > 0 ? ar(d.target) + ' مرة' : 'بلا حد'}</div></div></div>
    ${chips(d.target, 'data-plan')}
    <div class="row"><input class="field" id="custom" inputmode="numeric" placeholder="عدد مخصص" style="flex:1"><button class="textbtn" id="setC">تعيين</button></div>
    ${sw('autoNext', 'الانتقال تلقائيًا إلى الذكر التالي عند الإتمام', 'لورد متتابع، كأذكار ما بعد الصلاة: التسبيح ثم التحميد ثم التكبير، بترتيب قائمة الأذكار')}

    <div class="section">المظهر والأذكار</div>
    <div class="row" id="goBeads" style="cursor:pointer"><div class="txt"><div class="t">شكل الخرز للذكر الحالي</div><div class="s">${beadStyle(d.bead).name}</div></div>${ICON.chev}</div>
    <div style="padding:8px 20px 0;font-size:19px">الخلفية</div>
    <div class="chips"><button class="chip ${S.bg !== 'green' ? 'on' : ''}" data-bg="black">سوداء</button><button class="chip ${S.bg === 'green' ? 'on' : ''}" data-bg="green">خضراء ملكية</button></div>
    <div class="row" id="goAdhkar" style="cursor:pointer"><div class="txt"><div class="t">الأذكار</div><div class="s">${ar(S.adhkar.length)} أذكار — إضافة وتعديل وترتيب</div></div>${ICON.chev}</div>

    <div class="section">التلميحات</div>
    <div class="row"><button class="textbtn" id="replay">عرض التلميحات من جديد</button></div>
    <div class="section">التثبيت</div>
    <div class="para">لتجعله كالتطبيق على شاشتك الرئيسية: في آيفون اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وفي أندرويد افتح قائمة المتصفح ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». ويعمل بعدها دون إنترنت.</div>
    <div class="footer">سُبحة · نسخة المتصفح</div>`, () => {
    page.querySelectorAll('[data-k]').forEach(i => i.onchange = () => {
      S[i.dataset.k] = i.checked; save();
      if (i.dataset.k === 'sway') { strand.swayOn = S.sway; Tilt.setOn(S.sway); if (S.sway) Tilt.ask(); }
    });
    page.querySelectorAll('[data-r]').forEach(i => i.oninput = () => { S[i.dataset.r] = +i.value; save(); syncVoiceModel(); });
    page.querySelectorAll('[data-plan]').forEach(c => c.onclick = () => {
      d.target = +c.dataset.plan; save();
      page.querySelectorAll('[data-plan]').forEach(x => x.classList.toggle('on', +x.dataset.plan === d.target));
      $('#planTxt').textContent = `أريد أن أذكره: ${d.target > 0 ? ar(d.target) + ' مرة' : 'بلا حد'}`;
    });
    $('#setC').onclick = () => { const n = +en($('#custom').value); if (n) { d.target = n; save(); openSettings(false); } };
    page.querySelectorAll('[data-bg]').forEach(c => c.onclick = () => {
      S.bg = c.dataset.bg; save(); render();
      page.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('on', x.dataset.bg === S.bg));
    });
    $('#goBeads').onclick = () => openBeads();
    $('#goAdhkar').onclick = () => openAdhkar();
    $('#enr').onclick = () => openEnroll(d, () => openSettings(false));
    const dv = $('#delV'); if (dv) dv.onclick = () => { VoiceStore.remove(d.id); openSettings(false); };
    $('#replay').onclick = () => { S.tipsOff = false; save(); closeAllPages(); setTimeout(showTips, 400); };
  }, push);
}

/* ───────────── الحوار ───────────── */
let dialogClose = null;
function openDialog(html, onClose) {
  const dl = $('#dialog');
  dl.innerHTML = `<div class="box">${html}</div>`;
  dl.classList.remove('hidden');
  history.pushState({ d: 1 }, '');
  dl.onclick = e => { if (e.target === dl) closeDialog(); };
  dl.querySelectorAll('[data-close]').forEach(b => b.onclick = closeDialog);
  dialogClose = onClose || null;
}
function closeDialog(fromPop) {
  const dl = $('#dialog');
  if (dl.classList.contains('hidden')) return;
  dl.classList.add('hidden'); dl.innerHTML = '';
  if (fromPop !== true) { ignorePop++; history.back(); }
  const f = dialogClose; dialogClose = null; f && f();
}

/* تسجيل البصمة */
function openEnroll(d, onDone) {
  const wasRunning = voice.running; if (wasRunning) stopVoice();
  let takes = [], saved = false;
  const rec = new VoiceCounter({ onUtterance() {}, onLevel: lv => { const l = $('#enLvl'); if (l) { l.style.opacity = 0.18 + 0.6 * lv; l.style.transform = `scale(${0.6 + 0.4 * lv})`; } } });
  rec.sensitivity = S.voiceSens;
  rec.enrollSink = seg => { if (takes.length < 3) { takes.push(seg); paint(); if (takes.length === 3) finish(); } };
  openDialog(`<h2>بصمة صوتك</h2>
    <div id="enTop" style="text-align:center;font-size:20px">قل الذكر بصوتك المعتاد، ثم اسكت لحظة، ثلاث مرات:</div>
    <div style="text-align:center;color:var(--gold);font-size:28px;line-height:1.45;margin:8px 0;font-weight:500">${esc(d.text)}</div>
    <div class="micBig" id="enMic"><span class="lvl" id="enLvl"></span><span class="rim"></span>${ICON.mic}</div>
    <div class="dots" id="enDots"><i></i><i></i><i></i></div>
    <div id="enMsg" style="text-align:center;font-size:18px;min-height:24px"></div>
    <div class="actions"><button class="textbtn" id="enOk">إلغاء</button><button class="textbtn hidden" id="enRe">إعادة</button></div>`,
    () => { rec.stop(); onDone && onDone(saved); });
  const msg = (t, good) => { const m = $('#enMsg'); if (m) { m.textContent = t; m.style.color = good ? 'var(--gold)' : '#ffb4ab'; } };
  function paint() {
    document.querySelectorAll('#enDots i').forEach((el, k) => el.classList.toggle('on', k < takes.length || saved));
    $('#enRe').classList.toggle('hidden', saved || !takes.length);
    $('#enOk').textContent = saved ? 'تمّ' : 'إلغاء';
  }
  function finish() {
    rec.stop();
    const durs = takes.map(s => s.length / 16);
    const feats = takes.map(s => Mfcc.features(s));
    const consistent = Math.max(...durs) / Math.min(...durs) < 1.9 && feats.every(f => f.length >= 8);
    if (consistent) {
      VoiceStore.save(d.id, feats, durs.reduce((a, b) => a + b, 0) / durs.length);
      saved = true; $('#enMic').classList.add('hidden');
      $('#enTop').textContent = 'صار التطبيق يميّز نطقك لـ';
      msg('تمّ حفظ بصمة صوتك لهذا الذكر', true);
      $('#enRe').textContent = 'تسجيل من جديد'; $('#enRe').classList.remove('hidden');
    } else {
      msg('اختلفت المرات كثيرًا، فأعد التسجيل بنطق متقارب');
      takes = []; rec.start();
    }
    paint(); if (saved) $('#enRe').classList.remove('hidden');
  }
  $('#enOk').onclick = closeDialog;
  $('#enRe').onclick = () => {
    takes = []; saved = false; msg('');
    $('#enMic').classList.remove('hidden'); $('#enTop').textContent = 'قل الذكر بصوتك المعتاد، ثم اسكت لحظة، ثلاث مرات:';
    paint(); rec.start();
  };
  rec.start().then(ok => { if (!ok) msg('يلزم إذن الميكروفون لتسجيل البصمة'); });
}

/* ───────────── التلميحات ───────────── */
const TIPS = [
  ['strand', 'اسحب الخرزة', 'اسحب الخرزة السفلى من المجموعة العليا إلى الأسفل بإصبعك، فتسقط وتُحسب. كل سحبة تُسقط خرزة واحدة فقط، منعًا للخطأ في العدّ.'],
  ['strand', 'شكل الخرز', 'اضغط على الخرز ضغطة خفيفة دون سحب لتختار نوعه: زيتون، كهرمان، فيروز، يُسر وغيرها. ولكل ذكر خرزه الخاص.'],
  ['dhikr', 'الأذكار وفضلها', 'اضغط على الذكر مطولًا لفتح قائمة الأذكار: تختار منها، وتضيف وتعدّل، وتحدد عدد كل ذكر.\nوانقر عليه نقرتين لترى فضله من السنة.\nواسحب عليه يمينًا أو يسارًا للتنقل بين الأذكار.'],
  ['count', 'العدد', 'هنا عدد ما سبّحت، وتحته العدد المطلوب. والمعيّنات الثلاث تمتلئ كلما أتممت ثلثه، وعند الإتمام ينتقل التطبيق إلى الذكر التالي.'],
  ['tap', 'زر النقر', 'اضغط هذا الزر لتُسقط خرزة إن لم ترد السحب.\nواضغط عليه مطولًا لتصفير العداد.'],
  ['mic', 'العدّ بالصوت', 'سجّل بصمة الذكر بصوتك ثلاث مرات، ثم اضغط هنا وقل الذكر: تسقط خرزة مع كل مرة يطابق فيها نطقك بصمتك، ولا يستجيب لغيره.'],
  ['volume', 'مستوى الصوت', 'اسحب هذا الشريط لتخفض صوت فرقعة الخرز أو ترفعه.'],
  ['reset', 'إعادة', 'يعيد العدّ إلى الصفر، ويظهر بعده زر «تراجع» إن ضغطته خطأً.'],
  ['settings', 'الإعدادات', 'الصوت والاهتزاز، والخطة وعدد المرات، والعدّ بالصوت، والخلفية، وتأرجح الخيط مع ميل الجوال، وإعادة عرض هذه التلميحات.'],
];
function showTips() {
  const box = $('#tips'); let step = 0;
  box.classList.remove('hidden');
  const close = never => { box.classList.add('hidden'); box.innerHTML = ''; if (never) { S.tipsOff = true; save(); } };
  function draw() {
    const [target, title, body] = TIPS[step];
    const r = document.querySelector(`[data-tip="${target}"]`).getBoundingClientRect();
    const W = innerWidth, H = innerHeight, pad = 8;
    const R = { l: r.left - pad, t: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    const tall = r.height > H * 0.5;
    const rad = tall ? 28 : Math.min(R.w, R.h) / 2;
    box.innerHTML = `<canvas></canvas>
      <div class="tipcard"><div class="hd"><div class="tt">${title}</div><div class="st">${ar(step + 1)} / ${ar(TIPS.length)}</div></div>
      <div class="bd">${body}</div>
      <div class="ac"><button class="textbtn" style="color:rgba(247,239,218,.6)" data-a="skip">تخطَّ</button><span style="flex:1"></span>
      ${step > 0 ? '<button class="textbtn" style="color:var(--gold-pale)" data-a="prev">السابق</button>' : ''}
      <button class="textbtn" style="font-weight:700" data-a="next">${step === TIPS.length - 1 ? 'تمّ' : 'التالي'}</button></div></div>
      <button class="never">لا تُظهر التلميحات مرة أخرى</button>`;
    const cv = box.querySelector('canvas'), dpr = devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    c.fillStyle = 'rgba(0,0,0,.74)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.roundRect(R.l, R.t, R.w, R.h, rad); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = '#D9B95B'; c.lineWidth = 2; c.beginPath(); c.roundRect(R.l, R.t, R.w, R.h, rad); c.stroke();
    const card = box.querySelector('.tipcard'), never = box.querySelector('.never');
    if (tall) { card.style.right = (W - R.l + 8) + 'px'; card.style.left = '14px'; card.style.top = (H * 0.24) + 'px'; }
    else if (r.top + r.height / 2 < H * 0.45) card.style.top = Math.min(R.t + R.h + 16, H * 0.6) + 'px';
    else card.style.bottom = (H - R.t + 16) + 'px';
    if (!tall && r.bottom > H * 0.85) never.style.top = 'calc(var(--safe-top) + 12px)';
    else never.style.bottom = 'calc(var(--safe-bottom) + 12px)';
    card.onclick = e => {
      e.stopPropagation();
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'next') next(); else if (a === 'prev') { step--; draw(); } else if (a === 'skip') close(false);
    };
    never.onclick = e => { e.stopPropagation(); close(true); };
  }
  function next() { if (step < TIPS.length - 1) { step++; draw(); } else close(false); }
  box.onclick = () => next();
  draw();
}

/* ───────────── البدء ───────────── */
render().then(() => {
  keepAwake(S.keepOn);
  if (!S.tipsOff) setTimeout(showTips, 700);
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
