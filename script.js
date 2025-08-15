/* ==========================================================
   Cipher Nexus — Nightfall Edition
   ========================================================== */

const els = {
  audioToggle: document.getElementById('audioToggle'),
  helpBtn: document.getElementById('helpBtn'),
  resetBtn: document.getElementById('resetBtn'),
  helpModal: document.getElementById('helpModal'),
  helpClose: document.getElementById('helpClose'),
  helpOk: document.getElementById('helpOk'),
  winModal: document.getElementById('winModal'),
  winClose: document.getElementById('winClose'),
  replayBtn: document.getElementById('replayBtn'),
  shareBtn: document.getElementById('shareBtn'),

  levelIndicator: document.getElementById('levelIndicator'),
  attempts: document.getElementById('attempts'),
  hintsUsed: document.getElementById('hintsUsed'),
  levelTitle: document.getElementById('levelTitle'),
  cipherText: document.getElementById('cipherText'),
  copyBtn: document.getElementById('copyBtn'),
  answerInput: document.getElementById('answerInput'),
  submitBtn: document.getElementById('submitBtn'),
  feedback: document.getElementById('feedback'),
  hintBtn: document.getElementById('hintBtn'),
  revealBtn: document.getElementById('revealBtn'),
  skipBtn: document.getElementById('skipBtn'),
  progressTrack: document.getElementById('progressTrack'),
  progressDots: document.getElementById('progressDots'),
  fog: document.getElementById('fog')
};

// ======= Atmosphere audio (OFF by default) =======
const whisper = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_21cfc88df3.mp3'); // whisper hint
whisper.volume = 0.55;

const windLoop = new Audio('https://cdn.pixabay.com/audio/2021/08/08/audio_0a50c9f3d2.mp3'); // low wind ambience
windLoop.loop = true;
windLoop.volume = 0.18;

let audioOn = false;

// ======= Levels =======
const LEVELS = [
  {
    title: 'Level 1 — Caesar Shift',
    type: 'caesar',
    meta: { shift: 3 },
    cipherText: 'Khoor Zruog!',
    solution: 'hello world',
    hint: 'Julius used this. Try shifting letters back by 3.'
  },
  {
    title: 'Level 2 — Atbash Mirror',
    type: 'atbash',
    cipherText: 'Zgyzhs rh uli gsv zoo.',
    solution: 'attack is our new',
    hint: 'Mirror the alphabet: A↔Z, B↔Y, C↔X…'
  },
  {
    title: 'Level 3 — Vigenère',
    type: 'vigenere',
    meta: { key: 'raven' },
    cipherText: 'Dlc ayg fwj vq bkcq!',
    solution: 'the key is raven',
    hint: 'A repeating keyword shifts each letter. The bird is the word.'
  },
  {
    title: 'Level 4 — Morse',
    type: 'morse',
    cipherText: '.... . .-.. .-.. ---   .- --. . -. -',
    solution: 'hello agent',
    hint: 'Dots and dashes with spaces between letters and words.'
  },
  {
    title: 'Level 5 — Transposition',
    type: 'transpose',
    meta: { columns: 4 },
    cipherText: 'T_nhii sgs esatep!',
    solution: 'this is a steganep',
    hint: 'Write rows, read columns — a simple columnar shuffle.'
  }
];

// ======= State =======
const STATE_KEY = 'cipher-nexus-nightfall-v1';
let state = {
  levelIndex: 0,
  attempts: 0,
  hintsUsed: 0,
  revealed: [],
  skipped: new Set()
};

function saveState(){
  try {
    const clone = {...state, skipped: Array.from(state.skipped)};
    localStorage.setItem(STATE_KEY, JSON.stringify(clone));
  } catch {}
}
function loadState(){
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    state = { ...state, ...obj, skipped: new Set(obj.skipped || []) };
  } catch {}
}

// ======= Utils =======
const normalize = (s) => (s || '')
  .toLowerCase()
  .replace(/[_\-—–.,!?;:'"()[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function setFeedback(msg, cls=''){
  els.feedback.textContent = msg;
  els.feedback.className = `feedback ${cls}`;
}
function copy(text){
  navigator.clipboard?.writeText(text).then(()=> setFeedback('Copied to clipboard.', 'ok'))
  .catch(()=> setFeedback('Copy failed (permissions).', 'err'));
}
function clamp(min, val, max){ return Math.max(min, Math.min(max, val)); }

// ======= Ciphers =======
function caesarDecode(text, shift=3){
  return text.replace(/[a-z]/gi, ch=>{
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0)-base - shift + 26*10)%26)+base);
  });
}
function atbashDecode(text){
  return text.replace(/[a-z]/gi, ch=>{
    const isU = ch <= 'Z';
    const base = isU? 65:97;
    const offset = ch.charCodeAt(0)-base;
    return String.fromCharCode(base+(25-offset));
  });
}
function vigenereDecode(text, key='key'){
  key = key.toLowerCase().replace(/[^a-z]/g,'');
  if (!key) return text;
  let ki=0;
  return text.replace(/[a-z]/gi, ch=>{
    const isU = ch<= 'Z';
    const base = isU?65:97;
    const code = ch.charCodeAt(0);
    if ((code>=65 && code<=90) || (code>=97 && code<=122)) {
      const k = key.charCodeAt(ki%key.length)-97; ki++;
      return String.fromCharCode(((code-base - k + 26*10)%26)+base);
    }
    return ch;
  });
}
function morseDecode(morse){
  const map = {
    '.-':'a','-...':'b','-.-.':'c','-..':'d','.':'e','..-.':'f','--.':'g','....':'h','..':'i',
    '.---':'j','-.-':'k','.-..':'l','--':'m','-.':'n','---':'o','.--.':'p','--.-':'q','.-.':'r',
    '...':'s','-':'t','..-':'u','...-':'v','.--':'w','-..-':'x','-.--':'y','--..':'z',
    '.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9','-----':'0',
    '.-.-.-':'.','--..--':',','..--..':'?','-.-.--':'!','-....-':'-','-..-.':'/','-.--.':'(', '-.--.-':')','.-..-.':'"','---...':':','.-.-.':'+','-...-':'='
  };
  return morse.split('   ').map(word => word.split(' ').map(seq => map[seq] || '').join('')).join(' ');
}
function transposeDecode(text, columns=4){
  const clean = text.replace(/[^A-Za-z]/g,'');
  const rows = Math.ceil(clean.length / columns);
  const shortCols = columns*rows - clean.length;
  const cols = [];
  let idx = 0;
  for (let c=0; c<columns; c++){
    const len = rows - (c >= columns - shortCols ? 1 : 0);
    cols[c] = clean.slice(idx, idx+len).split('');
    idx += len;
  }
  let out = '';
  for (let r=0; r<rows; r++){
    for (let c=0; c<columns; c++){
      if (cols[c][r]) out += cols[c][r];
    }
  }
  return out.toLowerCase();
}
function decodeForLevel(level){
  const {type, meta = {}, cipherText} = level;
  switch(type){
    case 'caesar': return normalize(caesarDecode(cipherText, meta.shift ?? 3));
    case 'atbash': return normalize(atbashDecode(cipherText));
    case 'vigenere': return normalize(vigenereDecode(cipherText, meta.key || 'key'));
    case 'morse': return normalize(morseDecode(cipherText));
    case 'transpose': return normalize(transposeDecode(cipherText, meta.columns || 4));
    default: return normalize(cipherText);
  }
}

// ======= Rendering =======
function renderDots(){
  els.progressDots.innerHTML = '';
  LEVELS.forEach((_, i)=>{
    const d = document.createElement('button');
    d.className = 'dot' + (i === state.levelIndex ? ' active' : (i < state.levelIndex ? ' done' : ''));
    d.title = `Go to level ${i+1}`;
    d.addEventListener('click', ()=>goToLevel(i));
    els.progressDots.appendChild(d);
  });
}
function updateProgressTrack(){
  const pct = (state.levelIndex) / (LEVELS.length-1);
  els.progressTrack.style.setProperty('--pct', String(pct));
}
function updateHUD(){
  els.attempts.textContent = String(state.attempts);
  els.hintsUsed.textContent = String(state.hintsUsed);
}
function loadLevel(){
  const lvl = LEVELS[state.levelIndex];
  const sol = normalize(lvl.solution);
  state.revealed = Array.from(sol).map(ch => ch === ' ' ? true : false);

  els.levelTitle.textContent = lvl.title;
  els.levelIndicator.textContent = `${state.levelIndex+1} / ${LEVELS.length}`;
  els.cipherText.textContent = lvl.cipherText;
  els.cipherText.classList.remove('reveal');
  requestAnimationFrame(()=> els.cipherText.classList.add('reveal'));

  els.answerInput.value = '';
  setFeedback('');
  renderDots();
  updateProgressTrack();
  updateHUD();
  saveState();
}
function nextLevel(){
  if (state.levelIndex < LEVELS.length - 1){ state.levelIndex++; loadLevel(); }
  else { celebrate(); openWin(); }
}
function goToLevel(i){
  state.levelIndex = clamp(0, i, LEVELS.length-1);
  loadLevel();
}
function openHelp(){ els.helpModal.showModal(); }
function closeHelp(){ els.helpModal.close(); }
function openWin(){ document.getElementById('winModal').showModal(); }
function closeWin(){ document.getElementById('winModal').close(); }

// ======= Validation =======
function checkAnswer(){
  const lvl = LEVELS[state.levelIndex];
  const user = normalize(els.answerInput.value);
  const expected = normalize(lvl.solution);
  let ok = false;

  if (lvl.type === 'atbash'){
    ok = expected.length ? user.startsWith(expected) : user === expected;
  } else if (lvl.type === 'transpose'){
    ok = user.startsWith('this is a stegan');
  } else {
    ok = user === expected;
  }

  state.attempts++;
  if (ok){
    setFeedback('✅ Correct. The darkness recedes…', 'ok');
    updateHUD(); saveState();
    setTimeout(nextLevel, 750);
  } else {
    setFeedback('❌ Not yet. Listen to the wind or reveal a letter.', 'err');
    updateHUD(); saveState();
  }
}

// ======= Hints & Reveal =======
function playWhisper(){
  if (!audioOn) return;
  try {
    whisper.currentTime = 0;
    whisper.play().catch(()=>{});
  } catch {}
}
function ensureWind(on){
  if (on){
    try {
      if (windLoop.paused) windLoop.play().catch(()=>{});
    } catch {}
  } else {
    try { windLoop.pause(); } catch {}
  }
}
function giveHint(){
  const lvl = LEVELS[state.levelIndex];
  setFeedback(`💡 Hint: ${lvl.hint}`, 'hint');
  state.hintsUsed++; updateHUD(); saveState(); playWhisper();
}
function revealOne(){
  const lvl = LEVELS[state.levelIndex];
  const answerNorm = normalize(lvl.solution);
  for (let i=0;i<answerNorm.length;i++){
    if (!state.revealed[i] && answerNorm[i] !== ' '){
      state.revealed[i] = true;
      const cur = normalize(els.answerInput.value);
      let out = '';
      for (let j=0; j<answerNorm.length; j++){
        if (answerNorm[j] === ' ') out += ' ';
        else if (state.revealed[j]) out += answerNorm[j];
        else out += (cur[j] && cur[j] !== ' ' ? cur[j] : '_');
      }
      els.answerInput.value = out.replace(/_/g,'').trim();
      setFeedback('🔎 A letter emerges from the dark.', 'hint');
      state.hintsUsed++; updateHUD(); saveState();
      return;
    }
  }
  setFeedback('All letters are already revealed.', 'hint');
}
function skipLevel(){
  state.skipped.add(state.levelIndex); saveState(); nextLevel();
}

// ======= Flashlight Effect (pointer tracking) =======
(function flashlight(){
  const scope = document.querySelector('.flashlight-scope');
  const setPos = (x,y)=>{
    scope.style.setProperty('--x', `${x}px`);
    scope.style.setProperty('--y', `${y}px`);
  };
  const handle = (e)=>{
    const rect = scope.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    setPos(x,y);
  };
  scope.addEventListener('mousemove', handle);
  scope.addEventListener('touchmove', handle, {passive:true});
  // center on load
  setTimeout(()=>{
    const r = scope.getBoundingClientRect();
    setPos(r.width*0.5, r.height*0.4);
  }, 300);
})();

// ======= Fog (canvas: drifting translucent blobs) =======
(function fog(){
  const c = els.fog, ctx = c.getContext('2d');
  let w, h, dpr;
  let puffs = [];
  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = c.width = Math.floor(innerWidth * dpr);
    h = c.height = Math.floor(innerHeight * dpr);
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
  }
  function spawn(){
    const count = 18;
    puffs = Array.from({length: count}).map(()=>({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*180 + 220,
      vx: (Math.random()*.2 + .05) * (Math.random()<.5?-1:1),
      vy: (Math.random()*.08 + .02) * (Math.random()<.5?-1:1),
      a: Math.random()*0.06 + 0.04
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    for (const p of puffs){
      p.x += p.vx; p.y += p.vy;
      if (p.x < -p.r) p.x = w + p.r;
      if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r;
      if (p.y > h + p.r) p.y = -p.r;
      const g = ctx.createRadialGradient(p.x, p.y, p.r*0.1, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(180,200,220,${p.a})`);
      g.addColorStop(1, 'rgba(180,200,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', ()=>{ resize(); spawn(); });
  resize(); spawn(); tick();
})();

// ======= Share / Celebrate =======
function celebrate(){
  // subtle white flash + vignette pulse
  const flash = document.createElement('div');
  flash.style.position='fixed'; flash.style.inset='0'; flash.style.background='rgba(255,255,255,.07)';
  flash.style.pointerEvents='none'; flash.style.zIndex='10';
  document.body.appendChild(flash);
  setTimeout(()=> flash.remove(), 180);
}
async function share(){
  const url = location.href;
  const data = { title: 'Cipher Nexus — Nightfall', text: 'Beat the Nightfall ciphers if you can.', url };
  try{
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(url);
      setFeedback('Link copied — share it.', 'ok');
    }
  } catch {}
}

// ======= Wiring =======
function bindEvents(){
  els.copyBtn.addEventListener('click', ()=>copy(els.cipherText.textContent));
  els.submitBtn.addEventListener('click', checkAnswer);
  els.answerInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') checkAnswer(); });
  els.hintBtn.addEventListener('click', giveHint);
  els.revealBtn.addEventListener('click', revealOne);
  els.skipBtn.addEventListener('click', skipLevel);

  els.audioToggle.addEventListener('click', ()=>{
    audioOn = !audioOn;
    els.audioToggle.setAttribute('aria-pressed', String(audioOn));
    els.audioToggle.textContent = audioOn ? '🔊 Audio On' : '🔇 Audio Off';
    setFeedback(audioOn ? 'Audio enabled. The wind stirs…' : 'Audio disabled.', audioOn ? 'ok' : '');
    ensureWind(audioOn);
    if (audioOn){
      try { whisper.play().then(()=>whisper.pause()); } catch {}
    }
  });

  els.resetBtn.addEventListener('click', ()=>{
    if (confirm('Reset progress?')){
      localStorage.removeItem(STATE_KEY);
      state = { levelIndex:0, attempts:0, hintsUsed:0, revealed:[], skipped:new Set() };
      loadLevel();
      setFeedback('Progress reset.', 'hint');
    }
  });

  els.helpBtn.addEventListener('click', openHelp);
  els.helpClose.addEventListener('click', closeHelp);
  els.helpOk.addEventListener('click', closeHelp);

  document.getElementById('winClose').addEventListener('click', closeWin);
  document.getElementById('replayBtn').addEventListener('click', ()=>{
    closeWin();
    localStorage.removeItem(STATE_KEY);
    state = { levelIndex:0, attempts:0, hintsUsed:0, revealed:[], skipped:new Set() };
    loadLevel();
  });
  document.getElementById('shareBtn').addEventListener('click', share);
}

// ======= Boot =======
function loadStateAndLevel(){
  loadState(); renderDots(); loadLevel();
}
document.addEventListener('DOMContentLoaded', ()=>{
  bindEvents();
  loadStateAndLevel();
});
