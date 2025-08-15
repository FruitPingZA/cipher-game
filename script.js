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

// ===== Cipher data =====
const levels = [
  {cipher:'Caesar', type:'Shift cipher', text:'KHOOR', answer:'HELLO', info:'A Caesar cipher shifts each letter by a fixed number. Solve by shifting letters back by the key.'},
  {cipher:'Atbash', type:'Letter substitution', text:'ZOO', answer:'ALL', info:'Atbash substitutes each letter with its reverse (A↔Z, B↔Y). Decode by reversing substitution.'},
  {cipher:'Vigenere', type:'Keyword cipher', text:'RIJVS', answer:'HELLO', info:'Vigenère uses a keyword to shift letters. Solve by repeating the key and reversing shifts.'},
  {cipher:'Morse', type:'Dots and dashes', text:'.... . .-.. .-.. ---', answer:'HELLO', info:'Morse code uses dots and dashes for letters. Translate each Morse symbol to letters.'},
  {cipher:'Transposition', type:'Scramble letters', text:'OLEHL', answer:'HELLO', info:'Transposition ciphers scramble letters. Solve by rearranging letters to form words.'}
];

// ===== Shuffle levels =====
function shuffleArray(arr){
  const copy = [...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
let shuffledLevels = shuffleArray(levels);

// ===== State =====
let state = { index:0, attempts:0, hints:0 };

// ===== Typewriter effect =====
function typeWriter(text, callback){
  els.cipherText.textContent='';
  let i=0;
  function step(){
    if(i<text.length){
      els.cipherText.textContent+=text[i];
      i++;
      setTimeout(step,70);
    } else callback && callback();
  }
  step();
}

// ===== Render Level =====
function renderLevel(){
  const level = shuffledLevels[state.index];
  els.levelIndicator.textContent = `${state.index+1} / ${shuffledLevels.length}`;
  els.levelTitle.textContent = `Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.title = `${level.type}: ${level.info}`;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;
  updateProgress();
  typeWriter(level.text);
}

// ===== Progress =====
function updateProgress(){
  const pct = (state.index+1)/shuffledLevels.length;
  els.progressTrack.style.setProperty('--pct', pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<shuffledLevels.length;i++){
    const dot=document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(i<state.index) dot.classList.add('done');
    els.progressDots.appendChild(dot);
  }
}

// ===== Navigation =====
function nextLevel(){
  if(state.index<shuffledLevels.length-1){
    state.index++; renderLevel(); els.answerInput.value=''; els.feedback.textContent='';
  } else els.winModal.showModal();
}

function prevLevel(){
  if(state.index>0){ state.index--; renderLevel(); els.answerInput.value=''; els.feedback.textContent=''; }
}

// ===== Actions =====
function hint(){
  state.hints++; els.hintsUsed.textContent=state.hints;
  const ans=shuffledLevels[state.index].answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  els.answerInput.value=shuffledLevels[state.index].answer;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  els.answerInput.value=shuffledLevels[state.index].answer;
  els.feedback.textContent='Answer revealed'; els.feedback.className='feedback hint';
}

// ===== Event Listeners =====
els.submitBtn.addEventListener('click',()=>{
  const answer=els.answerInput.value.trim().toUpperCase();
  const correct=shuffledLevels[state.index].answer.toUpperCase();
  state.attempts++;
  els.attempts.textContent=state.attempts;
  if(answer===correct){
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
    setTimeout(nextLevel,700);
  } else {
    els.feedback.textContent='Wrong!'; els.feedback.className='feedback err';
  }
});

els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);

els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  shuffledLevels = shuffleArray(levels);
  state.index=0; state.attempts=0; state.hints=0;
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
  shuffledLevels = shuffleArray(levels);
  state.index=0; state.attempts=0; state.hints=0;
  renderLevel(); els.winModal.close(); els.answerInput.value=''; els.feedback.textContent='';
});

els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip for more info
els.cipherTag.addEventListener('mouseenter',()=>{
  els.cipherTag.title = `${shuffledLevels[state.index].type}: ${shuffledLevels[state.index].info}`;
});

// ===== Init =====
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
