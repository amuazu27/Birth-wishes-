/* ══════════════════════════════════════════════════════════════
   LITTLE PRINCESS — main script
   ──────────────────────────────────────────────────────────────
   ★ PERSONALIZATION — edit everything in CONFIG below.
   All messages, dates and captions live there or in index.html
   next to the matching data-editable attribute.
   ══════════════════════════════════════════════════════════════ */
'use strict';

const CONFIG = {
  /* Birthday — used for any date logic. Times are local to the viewer. */
  birthday: { year: 2026, month: 10, day: 13 }, // October 13, 2026

  /* Scene 2 — the love letter (typewriter). Use \n for new lines. */
  letter:
`Happy birthday, my love.

Every year on this day, the world quietly became a better place — because you arrived in it. I may not say it often enough, but loving you is the easiest thing I have ever done.

You have this rare way of making ordinary days feel like small celebrations. With you, even silence is comfortable and even Mondays feel lighter.

Today I just want you to feel a fraction of the happiness you give me every single day. Blow out the candles, close your eyes, and know that whatever you wish for, I am already wishing it for you too.

Yours, entirely.`,

  /* Scene 4 · Chapter 3 — replace with a real memory only you two share.
     Keep it honest: no invented dates or events. */
  memory:
`[Personalize me in js/script.js → CONFIG.memory]\n\nWrite here about one real moment — the first time something made you laugh until you cried, a quiet evening, a message you still reread. A single true moment means more than a hundred invented ones.`,

  /* Scene 5 — candles on the cake */
  candleCount: 5,

  /* Scene 5 — the wish message shown after "Make a Wish" */
  wish:
`May every wish you whisper tonight find its way back to you this year. Your wish is safe with the stars now — and with me, always.`,

  /* Audio (relative paths — files may be absent; site works silently) */
  audio: {
    romantic: './assets/audio/romantic.mp3',
    birthday: './assets/audio/birthday.mp3',
    volume: 0.7
  },

  typewriterSpeed: 34, // ms per character (set 0 for instant)
};

/* ── Utilities ─────────────────────────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ── Image fallback: elegant placeholder if a photo is missing ─ */
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#1B1015"/>
    <rect x="18" y="18" width="564" height="764" fill="none" stroke="#D6B46A" stroke-opacity=".4" stroke-width="2" stroke-dasharray="10 8"/>
    <path d="M262 430 l8 -70 38 52 30 -72 38 90 z" fill="none" stroke="#D6B46A" stroke-opacity=".65" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="270" cy="352" r="5" fill="#D6B46A" fill-opacity=".65"/>
    <circle cx="338" cy="330" r="5" fill="#D6B46A" fill-opacity=".65"/>
    <circle cx="376" cy="412" r="5" fill="#D6B46A" fill-opacity=".65"/>
    <text x="300" y="500" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="24" fill="#D6B46A" fill-opacity=".8">A photo of Mubaraka</text>
    <text x="300" y="536" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#F4E8D8" fill-opacity=".45">Replace me: assets/images/</text>
  </svg>`);

function guardImage(img){
  img.addEventListener('error', () => {
    if (img.src !== FALLBACK_IMG){ img.src = FALLBACK_IMG; img.classList.add('img-fallback'); }
  }, { once:false });
  if (img.complete && img.naturalWidth === 0 && img.src) img.src = FALLBACK_IMG;
}
$$('img').forEach(guardImage);

/* ══════════════════════════════════════════════════════════
   AUDIO — two tracks, user-gesture start, smooth crossfade,
   graceful silence if files are missing.
   ══════════════════════════════════════════════════════════ */
const AudioEngine = (() => {
  const tracks = {
    romantic: new Audio(CONFIG.audio.romantic),
    birthday: new Audio(CONFIG.audio.birthday)
  };
  Object.values(tracks).forEach(t => { t.loop = true; t.preload = 'auto'; });

  let current = 'romantic';
  let enabled = false;       // user wants music on
  let available = { romantic: true, birthday: true };
  let volume = CONFIG.audio.volume;

  const toggleBtn = $('#music-toggle');
  const volumeEl  = $('#music-volume');
  volumeEl.value = String(Math.round(volume * 100));

  function refreshBtn(){
    toggleBtn.setAttribute('aria-pressed', String(enabled));
    $('.music-label', toggleBtn).textContent = enabled ? 'On' : 'Music';
  }

  function fadeTo(track, target, dur = 1400){
    const el = tracks[track];
    if (!el || !available[track]) return;
    const from = el.volume, start = performance.now();
    cancelAnimationFrame(el._raf || 0);
    (function step(now){
      const p = clamp((now - start) / dur, 0, 1);
      el.volume = from + (target - from) * p;
      if (p < 1) el._raf = requestAnimationFrame(step);
    })(start);
  }

  function play(name){
    const el = tracks[name];
    if (!el || !available[name]) return;
    el.volume = 0;
    el.play().catch(() => { available[name] = false; });
    if (enabled) fadeTo(name, volume);
  }

  async function enable(){
    enabled = true; refreshBtn();
    // probe both files once
    for (const name of ['romantic','birthday']){
      try { await tracks[name].play(); tracks[name].pause(); tracks[name].currentTime = 0; }
      catch(e){ available[name] = false; }
    }
    play(current);
  }

  function disable(){
    enabled = false; refreshBtn();
    fadeTo(current, 0, 700);
    setTimeout(() => { try{ tracks[current].pause(); }catch(e){} }, 750);
  }

  function switchTrack(name){
    if (name === current) return;
    const old = current; current = name;
    fadeTo(old, 0, 1600);
    setTimeout(() => { try{ tracks[old].pause(); }catch(e){} }, 1700);
    play(name);
  }

  toggleBtn.addEventListener('click', () => enabled ? disable() : enable());
  volumeEl.addEventListener('input', () => {
    volume = volumeEl.value / 100;
    if (enabled) tracks[current].volume = volume;
  });
  document.addEventListener('visibilitychange', () => {
    if (!enabled) return;
    try { document.hidden ? tracks[current].pause() : tracks[current].play().catch(()=>{}); } catch(e){}
  });

  refreshBtn();
  return { enable, switchTrack,
    get current(){ return current; } };
})();

/* ══════════════════════════════════════════════════════════
   NAVIGATION — scene scroll + progress dots
   ══════════════════════════════════════════════════════════ */
const scenes = $$('.scene');
function goTo(name){
  const el = scenes.find(s => s.dataset.scene === name);
  if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}
$$('.scene-dots button').forEach(btn =>
  btn.addEventListener('click', () => goTo(btn.dataset.goto)));
$$('[data-goto]').forEach(btn => {
  if (btn.classList.contains('scene-dots')) return;
  btn.addEventListener('click', () => goTo(btn.dataset.goto));
});

/* Active-dot highlighting */
const dots = $$('.scene-dots button');
const sceneObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting){
      const name = en.target.dataset.scene;
      dots.forEach(d => d.classList.toggle('active', d.dataset.goto === name));
    }
  });
}, { threshold: 0.45 });
scenes.forEach(s => sceneObserver.observe(s));

/* ══════════════════════════════════════════════════════════
   SCENE 1 · Invitation
   ══════════════════════════════════════════════════════════ */
let entered = false;
function enterExperience(){
  if (entered) return;          // prevent double-trigger
  entered = true;
  $('#enter-btn').disabled = true;
  AudioEngine.enable();         // user gesture → allowed to play
  goTo('letter');
}
$('#enter-btn').addEventListener('click', enterExperience);
$('#skip-intro').addEventListener('click', () => { entered = true; AudioEngine.enable(); goTo('letter'); });

/* ══════════════════════════════════════════════════════════
   SCENE 2 · Envelope + typewriter letter
   ══════════════════════════════════════════════════════════ */
const envelope = $('#envelope');
const letterCard = $('#letter-card');
let letterOpened = false;

function openEnvelope(){
  if (letterOpened) return;
  letterOpened = true;
  envelope.classList.add('open');
  envelope.setAttribute('aria-expanded', 'true');
  setTimeout(() => {
    letterCard.hidden = false;
    startTypewriter();
    letterCard.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }, reduceMotion ? 100 : 1500);
}
envelope.addEventListener('click', openEnvelope);
envelope.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openEnvelope(); }
});

const twEl = $('#typewriter');
let typing = null, fullText = '';
function startTypewriter(){
  fullText = CONFIG.letter;
  if (reduceMotion || !CONFIG.typewriterSpeed){ twEl.textContent = fullText; $('#read-all-btn').hidden = true; return; }
  twEl.textContent = '';
  let i = 0;
  typing = setInterval(() => {
    twEl.textContent = fullText.slice(0, ++i);
    if (i >= fullText.length){ clearInterval(typing); typing = null; $('#read-all-btn').hidden = true; }
  }, CONFIG.typewriterSpeed);
}
$('#read-all-btn').addEventListener('click', () => {
  if (typing){ clearInterval(typing); typing = null; }
  twEl.textContent = fullText;
  $('#read-all-btn').hidden = true;
});
$('#letter-next').addEventListener('click', () => goTo('portraits'));

/* ══════════════════════════════════════════════════════════
   SCENE 3 · Portrait gallery + lightbox (swipe / keys / focus)
   ══════════════════════════════════════════════════════════ */
const cards = $$('.portrait-card');
const lightbox = $('#lightbox');
const lbImg = $('#lb-img'), lbCaption = $('#lb-caption');
let lbIndex = 0, lastFocus = null;

function showLb(i){
  lbIndex = (i + cards.length) % cards.length;
  const img = $('img', cards[lbIndex]);
  lbImg.src = img.src; lbImg.alt = img.alt;
  lbCaption.textContent = cards[lbIndex].dataset.caption || '';
}
function openLb(i){
  lastFocus = document.activeElement;
  showLb(i);
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#lb-close').focus();
}
function closeLb(){
  lightbox.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
guardImage(lbImg);

cards.forEach((c, i) => {
  c.setAttribute('tabindex', '0');
  c.setAttribute('role', 'button');
  c.setAttribute('aria-label', 'Open photo: ' + (c.dataset.caption || 'portrait'));
  c.addEventListener('click', () => openLb(i));
  c.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLb(i); }
  });
});
$('#lb-close').addEventListener('click', closeLb);
$('#lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
$('#lb-next').addEventListener('click', () => showLb(lbIndex + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });
document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
  if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  if (e.key === 'Tab'){ /* simple focus trap */
    const f = $$('button', lightbox);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
});
/* touch swipe */
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive:true });
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 48) showLb(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive:true });

/* ══════════════════════════════════════════════════════════
   SCENE 4 · Scroll reveals + gentle parallax
   ══════════════════════════════════════════════════════════ */
$$('.chapter').forEach(ch => {
  new IntersectionObserver((ens, obs) => {
    ens.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in-view'); obs.disconnect(); } });
  }, { threshold: 0.28 }).observe(ch);
});
/* inject editable memory text */
const memEl = $('[data-editable="memory"]');
if (memEl) memEl.textContent = CONFIG.memory;

let ticking = false;
window.addEventListener('scroll', () => {
  if (reduceMotion || ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    $$('.parallax img').forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5
      img.style.transform = `scale(1.12) translateY(${clamp(p * -22, -22, 22)}px)`;
    });
    ticking = false;
  });
}, { passive:true });

/* ══════════════════════════════════════════════════════════
   SCENE 5 · Birthday — candles, wish, confetti + fireworks
   ══════════════════════════════════════════════════════════ */
const candlesEl = $('#candles');
let candlesLit = false, wished = false;

function buildCandles(){
  candlesEl.innerHTML = '';
  for (let i = 0; i < CONFIG.candleCount; i++){
    const c = document.createElement('div');
    c.className = 'candle';
    c.innerHTML = '<span class="flame"></span><span class="smoke"></span>';
    candlesEl.appendChild(c);
  }
}
buildCandles();

/* light candles one by one when the cake scrolls into view */
new IntersectionObserver((ens, obs) => {
  ens.forEach(en => {
    if (!en.isIntersecting || candlesLit) return;
    candlesLit = true; obs.disconnect();
    $$('.candle').forEach((c, i) =>
      setTimeout(() => c.classList.add('lit'), reduceMotion ? 0 : 500 + i * 450));
  });
}, { threshold: 0.4 }).observe($('#cake'));

const fx = $('#fx-canvas'), fxCtx = fx.getContext('2d');
let particles = [], fxRunning = false;
function sizeFx(){
  const r = fx.parentElement.getBoundingClientRect();
  fx.width = r.width; fx.height = r.height;
}
window.addEventListener('resize', sizeFx);

const PALETTE = ['#D6B46A','#F4E8D8','#8F233B','#E8CD8E','#fff'];
function spawnConfetti(n){
  for (let i = 0; i < n; i++){
    particles.push({
      type:'confetti',
      x: fx.width/2 + (Math.random()-.5)*fx.width*.5,
      y: fx.height*.42,
      vx:(Math.random()-.5)*11, vy:-Math.random()*11-4,
      w:5+Math.random()*6, h:8+Math.random()*8,
      rot:Math.random()*Math.PI, vr:(Math.random()-.5)*.3,
      color:PALETTE[i%PALETTE.length], life:1
    });
  }
}
function spawnFirework(x, y){
  const color = PALETTE[Math.floor(Math.random()*PALETTE.length)];
  for (let i = 0; i < 42; i++){
    const a = (i/42)*Math.PI*2, sp = 2+Math.random()*3.4;
    particles.push({
      type:'spark', x, y,
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
      color, life:1, decay:.008+Math.random()*.012, r:1.4+Math.random()*1.6
    });
  }
}
function fxLoop(){
  fxCtx.clearRect(0,0,fx.width,fx.height);
  particles = particles.filter(p => p.life > 0);
  for (const p of particles){
    if (p.type === 'confetti'){
      p.vy += .16; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.life -= .004;
      fxCtx.save(); fxCtx.translate(p.x,p.y); fxCtx.rotate(p.rot);
      fxCtx.globalAlpha = clamp(p.life,0,1);
      fxCtx.fillStyle = p.color; fxCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      fxCtx.restore();
    } else {
      p.vx *= .965; p.vy = p.vy*.965 + .05;
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      fxCtx.globalAlpha = clamp(p.life,0,1);
      fxCtx.fillStyle = p.color;
      fxCtx.beginPath(); fxCtx.arc(p.x,p.y,p.r,0,Math.PI*2); fxCtx.fill();
      fxCtx.globalAlpha = 1;
    }
  }
  if (particles.length) fxRunning = true, requestAnimationFrame(fxLoop);
  else fxRunning = false;
}
function startFx(){
  sizeFx();
  if (reduceMotion){ return; } // CSS hides canvas under reduced motion
  if (!fxRunning) requestAnimationFrame(fxLoop);
}

$('#wish-btn').addEventListener('click', () => {
  if (wished) return;
  wished = true;
  /* 1 · extinguish candles */
  $$('.candle').forEach((c, i) => setTimeout(() => c.classList.add('out'), i*160));
  /* 2 · confetti + fireworks */
  spawnConfetti(150); startFx();
  let bursts = 0;
  const fw = setInterval(() => {
    spawnFirework(fx.width*(0.2+Math.random()*0.6), fx.height*(0.15+Math.random()*0.35));
    startFx();
    if (++bursts >= 6) clearInterval(fw);
  }, 420);
  /* 3 · switch music to the birthday track */
  AudioEngine.switchTrack('birthday');
  /* 4 · reveal the wish */
  $('.wish-text').textContent = CONFIG.wish;
  setTimeout(() => {
    $('#wish-reveal').hidden = false;
    $('#wish-reveal').scrollIntoView({ behavior: reduceMotion ? 'auto':'smooth', block:'center' });
  }, reduceMotion ? 200 : 1400);
});
$('#to-gift-btn').addEventListener('click', () => goTo('gift'));

/* ══════════════════════════════════════════════════════════
   SCENE 6 · Secret gift + replay
   ══════════════════════════════════════════════════════════ */
const gift = $('#gift');
let giftOpened = false;
function openGift(){
  if (giftOpened) return;
  giftOpened = true;
  gift.classList.add('open');
  gift.setAttribute('aria-expanded', 'true');
  /* golden particles burst */
  const g = $('#gift-fx'), gtx = g.getContext('2d');
  const r = g.parentElement.getBoundingClientRect();
  g.width = g.offsetWidth; g.height = g.offsetHeight;
  const ps = [];
  for (let i = 0; i < 46; i++){
    const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*4;
    ps.push({ x:g.width/2, y:g.height*.45, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-2,
      life:1, r:1+Math.random()*2.4, color: Math.random()<.7 ? '#D6B46A' : '#F4E8D8' });
  }
  if (!reduceMotion){
    (function loop(){
      gtx.clearRect(0,0,g.width,g.height);
      let alive = false;
      for (const p of ps){
        if (p.life <= 0) continue; alive = true;
        p.vy += .05; p.x += p.vx; p.y += p.vy; p.life -= .012;
        gtx.globalAlpha = clamp(p.life,0,1); gtx.fillStyle = p.color;
        gtx.beginPath(); gtx.arc(p.x,p.y,p.r,0,Math.PI*2); gtx.fill();
      }
      gtx.globalAlpha = 1;
      if (alive) requestAnimationFrame(loop);
      else gtx.clearRect(0,0,g.width,g.height);
    })();
  }
  setTimeout(() => {
    $('#gift-message').hidden = false;
    $('#gift-message').scrollIntoView({ behavior: reduceMotion ? 'auto':'smooth', block:'center' });
  }, reduceMotion ? 150 : 950);
}
gift.addEventListener('click', openGift);
gift.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openGift(); }
});

/* Replay — reset state without a page reload */
$('#replay-btn').addEventListener('click', () => {
  wished = false; giftOpened = false; candlesLit = false;
  $('#wish-reveal').hidden = true;
  $('#gift-message').hidden = true;
  gift.classList.remove('open'); gift.setAttribute('aria-expanded','false');
  particles = [];
  buildCandles();
  AudioEngine.switchTrack('romantic');
  entered = false;
  $('#enter-btn').disabled = false;
  goTo('intro');
});

/* ══════════════════════════════════════════════════════════
   AMBIENT GOLDEN DUST — lightweight particle canvas
   ══════════════════════════════════════════════════════════ */
(function dust(){
  if (reduceMotion) return;
  const cv = $('#dust-canvas'), ctx = cv.getContext('2d');
  let W, H, motes = [], running = true, raf;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function size(){
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  }
  size(); window.addEventListener('resize', size);

  const COUNT = Math.min(70, Math.round(innerWidth / 16));
  for (let i = 0; i < COUNT; i++){
    motes.push({
      x: Math.random()*W, y: Math.random()*H,
      r: (Math.random()*1.6 + .5) * DPR,
      vy: -(Math.random()*.18 + .05) * DPR,
      vx: (Math.random()-.5)*.12 * DPR,
      a: Math.random()*.5 + .1, tw: Math.random()*Math.PI*2
    });
  }
  function frame(){
    if (!running) return;
    ctx.clearRect(0,0,W,H);
    for (const m of motes){
      m.x += m.vx; m.y += m.vy; m.tw += .02;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random()*W; }
      if (m.x < -10) m.x = W + 10; if (m.x > W + 10) m.x = -10;
      const alpha = m.a * (0.6 + 0.4 * Math.sin(m.tw));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#D6B46A';
      ctx.shadowColor = 'rgba(214,180,106,.8)'; ctx.shadowBlur = 6 * DPR;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  frame();
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) frame(); else cancelAnimationFrame(raf);
  });
})();
