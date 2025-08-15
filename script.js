// ===== Elements =====
const els = {
  audioToggle: document.getElementById('audioToggle'),
  helpBtn: document.getElementById('helpBtn'),
  resetBtn: document.getElementById('resetBtn'),
  helpModal: document.getElementById('helpModal'),
  helpClose: document.getElementById('helpClose'),
  helpOk: document.getElementById('helpOk'),
  winModal: document.getElementById('winModal'),
  replayBtn: document.getElementById('replayBtn'),
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
  feedback: document.getElementById('feedback'),
  correctCount: document.getElementById('correctCount'),
  failedCount: document.getElementById('failedCount')
};

// ===== Audio =====
let audioOn = false;
const whisper = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_21cfc88df3.mp3');
whisper.volume = 0.55;
const windLoop = new Audio('https://cdn.pixabay.com/audio/2021/08/08/audio_0a50c9f3d2.mp3');
windLoop.loop = true; windLoop.volume = 0.18;

// ===== Generate funny word phrases =====
function generateFunnyWords(count){
  const words = ["BANANA", "SPOON", "CATNAP", "CHEESE", "FLOPPY DISK", "NINJA", "UNICORN", "COFFEE", "PIZZA SLICE","TACO","KANGAROO","MUSHROOM","PENGUIN","TOILET PAPER","BUBBLE GUM"];
  let levels=[];
  for(let i=0;i<count;i++){
    const word = words[Math.floor(Math.random()*words.length)];
    const ciphers = [
      {cipher:'Caesar', type:'Shift cipher', explanation:'Each letter is shifted by a fixed number down the alphabet.'},
      {cipher:'Atbash', type:'Letter substitution', explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).'},
      {cipher:'Vigenere', type:'Keyword cipher', explanation:'Uses a keyword to shift letters differently across the message.'},
      {cipher:'Morse', type:'Dots and dashes', explanation:'Represents letters using dots (.) and dashes (-).'},
      {cipher:'Transposition', type:'Scramble letters', explanation:'Letters are rearranged according to a fixed pattern.'}
    ];
    const c = ciphers[Math.floor(Math.random()*ciphers.length)];
    levels.push({...c, text:word, answer:word});
  }
  return levels;
}

// ===== State =====
let levels = generateFunnyWords(5);
let state = { index:0, attempts:0, hints:0 };

// ===== Typewriter effect =====
function typeWriter(text, callback){
  els.cipherText.textContent='';
  let i=0;
  function step(){
    if(i<text.length){
      els.cipherText.textContent+=text[i];
      i++;
      setTimeout(step, 50);
    } else callback && callback();
  }
  step();
}

// ===== Render Level =====
function renderLevel(){
  const level = levels[state.index];
  els.levelIndicator.textContent = `${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent = `Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.textContent = level.cipher;
  els.cipherTag.title = `${level.type}: ${level.explanation}`;
  els.answerInput.value='';
  els.answerInput.disabled = !!level.locked;
  els.feedback.textContent='';
  typeWriter(level.text);
  updateProgress();
  updateStats();
}

// ===== Progress =====
function updateProgress(){
  const pct = (state.index+1)/levels.length;
  els.progressTrack.style.setProperty('--pct', pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot = document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(levels[i].failed || levels[i].correct) dot.classList.add('done');
    els.progressDots.appendChild(dot);
  }
}

// ===== Stats =====
function updateStats(){
  const correct = levels.filter(l=>l.correct).length;
  const failed = levels.filter(l=>l.failed).length;
  els.correctCount.textContent = `Correct: ${correct}`;
  els.failedCount.textContent = `Failed: ${failed}`;
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  const level = levels[state.index];
  if(level.locked) return;
  const answer = els.answerInput.value.trim().toUpperCase();
  const correct = level.answer.toUpperCase();
  state.attempts++;
  els.attempts.textContent = state.attempts;
  if(answer===correct){
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
    level.correct = true;
    setTimeout(nextLevel,700);
  } else {
    els.feedback.textContent='Wrong!'; els.feedback.className='feedback err';
  }
});

function nextLevel(){
  if(state.index<levels.length-1){
    state.index++;
    renderLevel();
  } else {
    els.winModal.showModal();
  }
}

function prevLevel(){
  if(state.index>0){ 
    state.index--; 
    renderLevel(); 
  }
}

function hint(){
  const level = levels[state.index];
  if(level.locked) return;
  state.hints++; els.hintsUsed.textContent=state.hints;
  const ans=level.answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  const level = levels[state.index];
  if(level.locked) return;
  const ans = level.answer;
  let current = els.answerInput.value.toUpperCase();
  for(let i=0;i<ans.length;i++){
    if(!current[i]){
      current = current.substr(0,i) + ans[i] + current.substr(i+1);
      break;
    }
  }
  els.answerInput.value = current;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  const level = levels[state.index];
  level.locked = true;
  level.failed = true;
  els.answerInput.value = level.answer;
  els.answerInput.disabled = true;
  els.feedback.textContent='You gave up!'; els.feedback.className='feedback hint';
  updateStats();
}

// ===== Event Listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  levels = generateFunnyWords(5);
  state.index=0; state.attempts=0; state.hints=0;
  renderLevel();
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
els.replayBtn.addEventListener('click',()=>{
  levels = generateFunnyWords(5);
  state.index=0; state.attempts=0; state.hints=0;
  renderLevel();
  els.winModal.close();
});
els.cipherTag.addEventListener('mouseenter',()=>els.cipherTag.title=levels[state.index].type + ': ' + levels[state.index].explanation);

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
