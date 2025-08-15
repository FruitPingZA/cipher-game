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
let levels = [
  {cipher:'Caesar', type:'Shift cipher', explanation:'Each letter is shifted by a fixed number down the alphabet.', text:'KHOOR', answer:'HELLO'},
  {cipher:'Atbash', type:'Letter substitution', explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).', text:'ZOO', answer:'ALL'},
  {cipher:'Vigenere', type:'Keyword cipher', explanation:'Uses a keyword to shift letters differently across the message.', text:'RIJVS', answer:'HELLO'},
  {cipher:'Morse', type:'Dots and dashes', explanation:'Represents letters using dots (.) and dashes (-).', text:'.... . .-.. .-.. ---', answer:'HELLO'},
  {cipher:'Transposition', type:'Scramble letters', explanation:'Letters are rearranged according to a fixed pattern.', text:'OLEHL', answer:'HELLO'}
];

// ===== Shuffle levels =====
function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i], array[j]]=[array[j], array[i]];
  }
  return array;
}
levels = shuffleArray(levels);

// ===== State =====
let state = { index:0, attempts:0, hints:0, usedIndexes: new Set(), revealed:false };

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

// ===== Init =====
function renderLevel(){
  const level = levels[state.index];
  els.levelIndicator.textContent = `${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent = `Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.title = `${level.type}: ${level.explanation}`;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;
  state.revealed = false;
  els.answerInput.disabled = false;
  els.feedback.textContent = '';
  updateProgress();
  typeWriter(level.text);
}

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
    els.feedback.textContent = 'Answer already revealed. Use Next/Previous.';
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
    while(state.usedIndexes.has(state.index) && state.index<levels.length-1) state.index++;
    state.usedIndexes.add(state.index);
    renderLevel(); 
    els.answerInput.value=''; 
    els.feedback.textContent='';
  } else els.winModal.showModal();
}

function prevLevel(){
  if(state.index>0){ 
    state.index--; 
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
  const ans = levels[state.index].answer.toUpperCase();
  let inputVal = els.answerInput.value.toUpperCase().padEnd(ans.length, '_');
  
  // find unrevealed indices
  let unrevealed = [];
  for(let i=0;i<ans.length;i++){
    if(inputVal[i] === '_') unrevealed.push(i);
  }
  if(unrevealed.length === 0) return; // all letters already revealed

  const randomIndex = unrevealed[Math.floor(Math.random()*unrevealed.length)];
  inputVal = inputVal.split('');
  inputVal[randomIndex] = ans[randomIndex];
  els.answerInput.value = inputVal.join('');
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  const ans = levels[state.index].answer.toUpperCase();
  els.answerInput.value = ans;
  els.feedback.textContent='Answer revealed'; els.feedback.className='feedback hint';
  state.revealed = true;
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
  state.index=0; state.attempts=0; state.hints=0; state.usedIndexes.clear(); state.revealed=false;
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
  state.index=0; state.attempts=0; state.hints=0; state.usedIndexes.clear(); state.revealed=false;
  renderLevel(); els.winModal.close(); els.answerInput.value=''; els.feedback.textContent='';
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip updates dynamically
els.cipherTag.addEventListener('mouseenter',()=>els.cipherTag.title=levels[state.index].type + ': ' + levels[state.index].explanation);

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
