// -----------------------------
// Cipher Nexus — Nightfall Edition
// -----------------------------

// Globals
const levels = [
  { type: 'Caesar', text: 'KHOOR ZRUOG', key: 3 },
  { type: 'Atbash', text: 'ZGYV RH Z HVXIVG', key: null },
  { type: 'Vigenere', text: 'RIJVS UYVJN', key: 'KEY' },
  { type: 'Morse', text: '.... . .-.. .-.. ---', key: null },
  { type: 'Transposition', text: 'HLEOL OLWRD', key: '2,4,1,3,5' }
];

let state = {
  currentLevel: 0,
  attempts: 0,
  hintsUsed: 0,
  revealedIndices: [],
  audio: false
};

// DOM Elements
const cipherTextEl = document.getElementById('cipherText');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const feedbackEl = document.getElementById('feedback');
const hintBtn = document.getElementById('hintBtn');
const revealBtn = document.getElementById('revealBtn');
const skipBtn = document.getElementById('skipBtn');
const levelIndicator = document.getElementById('levelIndicator');
const levelTitle = document.getElementById('levelTitle');
const progressTrack = document.getElementById('progressTrack');
const progressDots = document.getElementById('progressDots');
const audioToggle = document.getElementById('audioToggle');
const helpModal = document.getElementById('helpModal');
const helpBtn = document.getElementById('helpBtn');
const helpClose = document.getElementById('helpClose');
const winModal = document.getElementById('winModal');
const winClose = document.getElementById('winClose');
const replayBtn = document.getElementById('replayBtn');

// -----------------------------
// Utility Functions
// -----------------------------
function caesarDecode(str, shift) {
  return str.replace(/[A-Z]/gi, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base - shift + 26) % 26 + base);
  });
}

function atbashDecode(str) {
  return str.replace(/[A-Z]/gi, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(25 - (c.charCodeAt(0) - base) + base);
  });
}

function vigenereDecode(str, key) {
  let decoded = '';
  let j = 0;
  key = key.toUpperCase();
  str = str.toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c >= 'A' && c <= 'Z') {
      const shift = key[j % key.length].charCodeAt(0) - 65;
      decoded += String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
      j++;
    } else decoded += c;
  }
  return decoded;
}

const morseMap = {
  '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I',
  '.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R',
  '...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','/':' '
};
function morseDecode(str) {
  return str.split(' ').map(s => morseMap[s] || '').join('');
}

function transpositionDecode(str, key) {
  const order = key.split(',').map(Number);
  const n = order.length;
  const rows = Math.ceil(str.length / n);
  let cols = Array.from({length:n},()=>[]);
  let k=0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<n;c++){
      cols[c][r] = str[k++]||'';
    }
  }
  let decoded='';
  for(let r=0;r<rows;r++){
    for(let i=0;i<n;i++){
      decoded += cols[order[i]-1][r]||'';
    }
  }
  return decoded;
}

function decodeLevel(level) {
  switch(level.type){
    case 'Caesar': return caesarDecode(level.text, level.key);
    case 'Atbash': return atbashDecode(level.text);
    case 'Vigenere': return vigenereDecode(level.text, level.key);
    case 'Morse': return morseDecode(level.text);
    case 'Transposition': return transpositionDecode(level.text, level.key);
  }
}

// -----------------------------
// Display Functions
// -----------------------------
function renderCipher() {
  cipherTextEl.textContent = levels[state.currentLevel].text;
  cipherTextEl.classList.remove('reveal');
  levelTitle.textContent = `Level ${state.currentLevel+1} — ${levels[state.currentLevel].type}`;
  levelIndicator.textContent = `${state.currentLevel+1} / ${levels.length}`;
  answerInput.value='';
  feedbackEl.textContent='';
  state.revealedIndices=[];
  updateProgress();
}

function updateProgress() {
  const pct = (state.currentLevel)/levels.length;
  progressTrack.style.setProperty('--pct', pct);
  progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot = document.createElement('span');
    dot.className='dot'+(i<state.currentLevel?' done': i===state.currentLevel?' active':'');
    progressDots.appendChild(dot);
  }
}

// -----------------------------
// Feedback
// -----------------------------
function showFeedback(msg,type='ok'){
  feedbackEl.textContent=msg;
  feedbackEl.className='feedback '+type;
}

// -----------------------------
// Hint & Reveal
// -----------------------------
function hint(){
  state.hintsUsed++;
  showFeedback('Hint: Think about the type of cipher.', 'hint');
  if(state.audio) whisperAudio();
}

function revealLetter(){
  const answer = decodeLevel(levels[state.currentLevel]).toUpperCase();
  let unrevealed = [];
  for(let i=0;i<answer.length;i++){
    if(!state.revealedIndices.includes(i) && answer[i]!==' '){
      unrevealed.push(i);
    }
  }
  if(unrevealed.length===0) return;
  const idx = unrevealed[Math.floor(Math.random()*unrevealed.length)];
  state.revealedIndices.push(idx);
  let current = answerInput.value.toUpperCase().split('');
  current[idx] = answer[idx];
  answerInput.value = current.join('');
  showFeedback('One letter revealed.', 'hint');
}

// -----------------------------
// Audio
// -----------------------------
function whisperAudio(){
  const audio = new Audio('https://actions.google.com/sounds/v1/ambiences/whisper.ogg');
  audio.volume=0.1;
  audio.play();
}

// -----------------------------
// Flashlight
// -----------------------------
document.addEventListener('mousemove', e=>{
  document.querySelector('.flashlight-scope').style.setProperty('--x', `${e.clientX}px`);
  document.querySelector('.flashlight-scope').style.setProperty('--y', `${e.clientY}px`);
});

// -----------------------------
// Submit & Progress
// -----------------------------
submitBtn.addEventListener('click',()=>{
  state.attempts++;
  const answer = decodeLevel(levels[state.currentLevel]).toUpperCase();
  const guess = answerInput.value.toUpperCase().trim();
  if(guess === answer){
    showFeedback('Correct!', 'ok');
    cipherTextEl.classList.add('reveal');
    state.currentLevel++;
    if(state.currentLevel>=levels.length){
      winModal.showModal();
    }else{
      setTimeout(renderCipher,800);
    }
  }else{
    showFeedback('Incorrect, try again.', 'err');
  }
  localStorage.setItem('cipherState', JSON.stringify(state));
  document.getElementById('attempts').textContent = state.attempts;
  document.getElementById('hintsUsed').textContent = state.hintsUsed;
});

// -----------------------------
// Skip Level
// -----------------------------
skipBtn.addEventListener('click',()=>{
  state.currentLevel++;
  if(state.currentLevel>=levels.length){
    winModal.showModal();
  }else{
    renderCipher();
  }
});

// -----------------------------
// Hints
// -----------------------------
hintBtn.addEventListener('click', hint);

// -----------------------------
// Audio Toggle
// -----------------------------
audioToggle.addEventListener('click',()=>{
  state.audio=!state.audio;
  audioToggle.textContent= state.audio ? '🔊 Audio On' : '🔇 Audio Off';
  audioToggle.setAttribute('aria-pressed', state.audio);
});

// -----------------------------
// Modal Controls
// -----------------------------
helpBtn.addEventListener('click',()=>helpModal.showModal());
helpClose.addEventListener('click',()=>helpModal.close());
document.getElementById('helpOk').addEventListener('click',()=>helpModal.close());

winClose.addEventListener('click',()=>winModal.close());
replayBtn.addEventListener('click',()=>{
  state.currentLevel=0;
  state.attempts=0;
  state.hintsUsed=0;
  renderCipher();
  winModal.close();
});

// -----------------------------
// Copy Cipher
// -----------------------------
document.getElementById('copyBtn').addEventListener('click',()=>{
  navigator.clipboard.writeText(cipherTextEl.textContent);
  showFeedback('Cipher copied to clipboard', 'ok');
});

// -----------------------------
// Fog Animation
// -----------------------------
const fogCanvas = document.getElementById('fog');
const ctx = fogCanvas.getContext('2d');
let fogParticles = [];
function resizeCanvas(){
  fogCanvas.width=window.innerWidth;
  fogCanvas.height=window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
for(let i=0;i<200;i++){
  fogParticles.push({
    x:Math.random()*fogCanvas.width,
    y:Math.random()*fogCanvas.height,
    r: Math.random()*3+1,
    dx: Math.random()*0.2-0.1,
    dy: Math.random()*0.1+0.05
  });
}
function animateFog(){
  ctx.clearRect(0,0,fogCanvas.width,fogCanvas.height);
  ctx.fillStyle='rgba(255,255,255,0.03)';
  fogParticles.forEach(p=>{
    p.x+=p.dx;
    p.y+=p.dy;
    if(p.x>fogCanvas.width)p.x=0;
    if(p.y>fogCanvas.height)p.y=0;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
  });
  requestAnimationFrame(animateFog);
}
animateFog();

// -----------------------------
// Initialization
// -----------------------------
function loadState(){
  const saved = localStorage.getItem('cipherState');
  if(saved){
    state = JSON.parse(saved);
  }
}
loadState();
renderCipher();
document.getElementById('attempts').textContent = state.attempts;
document.getElementById('hintsUsed').textContent = state.hintsUsed;
