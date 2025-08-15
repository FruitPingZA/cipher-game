// ===== Elements =====
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
  hintBtn: document.getElementById('hintBtn'),
  revealBtn: document.getElementById('revealBtn'),
  skipBtn: document.getElementById('skipBtn'),
  prevBtn: document.getElementById('prevBtn'),
  giveUpBtn: document.getElementById('giveUpBtn'),
  progressTrack: document.getElementById('progressTrack'),
  progressDots: document.getElementById('progressDots'),
  cipherTag: document.getElementById('cipherTag'),
  feedback: document.getElementById('feedback')
};

// ===== Audio =====
let audioOn = false;
const whisper = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_21cfc88df3.mp3');
whisper.volume = 0.55;
const windLoop = new Audio('https://cdn.pixabay.com/audio/2021/08/08/audio_0a50c9f3d2.mp3');
windLoop.loop = true; windLoop.volume = 0.18;

// ===== Random word list for generation =====
const wordPool = [
  "HELLO","WORLD","CIPHER","NIGHT","DAWN","CODE","SECRET","SHADOW","ENIGMA",
  "PUZZLE","MYSTIC","HORIZON","TWILIGHT","LANTERN","WHISPER","ECLIPSE"
];

// ===== Cipher generators =====
function randomWord() {
  return wordPool[Math.floor(Math.random()*wordPool.length)];
}

// Caesar shift
function generateCaesar() {
  const word = randomWord();
  const shift = Math.floor(Math.random()*25)+1;
  const text = word.split('').map(c=>{
    const code = c.charCodeAt(0)-65;
    return String.fromCharCode((code+shift)%26 + 65);
  }).join('');
  return {cipher:'Caesar', type:'Shift cipher', explanation:`Each letter is shifted by ${shift} down the alphabet.`, text, answer:word};
}

// Atbash
function generateAtbash() {
  const word = randomWord();
  const text = word.split('').map(c=>{
    const code = c.charCodeAt(0)-65;
    return String.fromCharCode(25-code+65);
  }).join('');
  return {cipher:'Atbash', type:'Letter substitution', explanation:`Each letter is replaced by its reverse in the alphabet.`, text, answer:word};
}

// Vigenère
function generateVigenere() {
  const word = randomWord();
  const key = randomWord().slice(0, Math.min(4, word.length));
  const text = word.split('').map((c,i)=>{
    const shift = key.charCodeAt(i % key.length)-65;
    const code = c.charCodeAt(0)-65;
    return String.fromCharCode((code+shift)%26 +65);
  }).join('');
  return {cipher:'Vigenère', type:'Keyword cipher', explanation:`Uses keyword "${key}" to shift letters differently.`, text, answer:word};
}

// Morse
const morseMap = {A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."};
function generateMorse() {
  const word = randomWord();
  const text = word.split('').map(c=>morseMap[c]||'').join(' ');
  return {cipher:'Morse', type:'Dots and dashes', explanation:`Represents letters with dots (.) and dashes (-).`, text, answer:word};
}

// Transposition
function generateTransposition() {
  const word = randomWord();
  const arr = word.split('');
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]]=[arr[j], arr[i]];
  }
  const text = arr.join('');
  return {cipher:'Transposition', type:'Scramble letters', explanation:`Letters are rearranged in a random order.`, text, answer:word};
}

// ===== Generate levels dynamically =====
function generateLevels(n=5){
  const gens = [generateCaesar, generateAtbash, generateVigenere, generateMorse, generateTransposition];
  let result = [];
  for(let i=0;i<n;i++){
    const gen = gens[Math.floor(Math.random()*gens.length)];
    result.push(gen());
  }
  return result;
}

let levels = generateLevels();

// ===== Shuffle helper =====
function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i], array[j]]=[array[j], array[i]];
  }
  return array;
}
levels = shuffleArray(levels);

// ===== State =====
let state = { index:0, attempts:0, hints:0, revealed:false, usedIndexes: new Set() };

// ===== Typewriter effect =====
function typeWriter(text, callback){
  els.cipherText.textContent='';
  let i=0;
  function step(){
    if(i<text.length){
      els.cipherText.textContent+=text[i];
      i++;
      setTimeout(step, 70);
    } else callback && callback();
  }
  step();
}

// ===== Tooltip update =====
function updateCipherTooltip() {
  const level = levels[state.index];
  els.cipherTag.title = `${level.cipher} — ${level.type}: ${level.explanation}`;
  els.levelTitle.title = `${level.cipher} — ${level.type}: ${level.explanation}`;
}

// ===== Render level =====
function renderLevel(){
  const level = levels[state.index];
  els.levelIndicator.textContent = `${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent = `Level ${state.index+1} — ${level.cipher}`;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;
  els.answerInput.disabled = state.revealed;
  updateProgress();
  typeWriter(level.text);
  updateCipherTooltip();
}

// ===== Progress =====
function updateProgress(){
  const pct = (state.index+1)/levels.length;
  els.progressTrack.style.setProperty('--pct', pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot = document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(i<state.index) dot.classList.add('done');
    els.progressDots.appendChild(dot);
  }
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  if(state.revealed){
    els.feedback.textContent='Cannot submit after giving up!'; 
    els.feedback.className='feedback err';
    return;
  }
  const answer = els.answerInput.value.trim().toUpperCase();
  const correct = levels[state.index].answer.toUpperCase();
  state.attempts++;
  els.attempts.textContent = state.attempts;
  if(answer===correct){
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
    setTimeout(nextLevel,700);
  } else {
    els.feedback.textContent='Wrong!'; els.feedback.className='feedback err';
  }
});

function nextLevel(){
  if(state.index<levels.length-1){
    state.index++;
    state.revealed = false;
    renderLevel(); 
    els.answerInput.value=''; 
    els.feedback.textContent='';
  } else els.winModal.showModal();
}

function prevLevel(){
  if(state.index>0){ 
    state.index--; 
    state.revealed = false;
    renderLevel(); 
    els.answerInput.value=''; 
    els.feedback.textContent=''; 
  }
}

function hint(){
  state.hints++; els.hintsUsed.textContent=state.hints;
  const ans=levels[state.index].answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  const ans=levels[state.index].answer;
  const current=els.answerInput.value.toUpperCase();
  // reveal only one unrevealed letter
  let revealedIndex=-1;
  for(let i=0;i<ans.length;i++){
    if(ans[i]!==current[i]){
      revealedIndex=i;
      break;
    }
  }
  if(revealedIndex>=0){
    const newVal=current.split('');
    newVal[revealedIndex]=ans[revealedIndex];
    els.answerInput.value=newVal.join('');
    els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
    state.revealed=false; // still allow submitting
  }
}

function giveUp(){
  els.answerInput.value = levels[state.index].answer;
  els.feedback.textContent='Answer revealed'; els.feedback.className='feedback hint';
  state.revealed=true;
  els.answerInput.disabled = true;
}

// ===== Event Listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  state.index=0; state.attempts=0; state.hints=0; state.revealed=false; state.usedIndexes.clear();
  levels = generateLevels();
  levels = shuffleArray(levels);
  renderLevel(); els.answerInput.value=''; els.feedback.textContent='';
});
els.audioToggle.addEventListener('click',()=>{
  audioOn=!audioOn;
  els.audioToggle.textContent=audioOn?'🔊 Audio On':'🔇 Audio Off';
  els.audioToggle.setAttribute('aria-pressed',audioOn);
  if(audioOn) windLoop.play(); else windLoop.pause();
});
els.helpBtn.addEventListener('click',()=>els.helpModal.showModal());
els.helpClose.addEventListener('click',()=>els.helpModal.close());
els.helpOk.addEventListener('click',()=>els.helpModal.close());
els.winClose.addEventListener('click',()=>els.winModal.close());
els.replayBtn.addEventListener('click',()=>{
  state.index=0; state.attempts=0; state.hints=0; state.revealed=false; state.usedIndexes.clear();
  levels = generateLevels();
  levels = shuffleArray(levels);
  renderLevel(); els.winModal.close(); els.answerInput.value=''; els.feedback.textContent='';
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

els.cipherTag.addEventListener('mouseenter', updateCipherTooltip);
els.levelTitle.addEventListener('mouseenter', updateCipherTooltip);

// ===== Init =====
state.usedIndexes.add(state.index);
renderLevel();

// ===== Fog animation =====
const fogEl = document.getElementById('fog');
let fogOffset=0;
function animateFog(){
  fogOffset+=0.05;
  fogEl.style.backgroundPosition=`${fogOffset}px ${fogOffset/2}px`;
  requestAnimationFrame(animateFog);
}
animateFog();
