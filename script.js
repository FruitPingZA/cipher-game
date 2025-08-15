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

// ===== Generate random funny phrases =====
const funnyPhrases = [
  "BANANA SPLIT", "PINEAPPLE PIZZA", "UNICORN TEARS", "SPOOKY CAT", "LEFTOVER PIZZA",
  "DANCE PARTY", "NAPPING KOALA", "JELLYFISH JAM", "TACO TUESDAY", "CHEESEBURGER",
  "RAINBOW LASER", "TOASTY MARSHMALLOW", "CUPCAKE WIZARD", "CRAZY CUCUMBER", "GINGER NINJA",
  "BUBBLE TROUBLE", "WOBBLY WOBBLES", "HAPPY PANDA", "CANDY RAIN", "SLEEPY TURTLE"
];

function getRandomPhrase() {
  return funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)];
}

// ===== Cipher data =====
let levels = [];
function generateLevels(count=5){
  const ciphers = [
    {cipher:'Caesar', type:'Shift cipher', explanation:'Each letter is shifted by a fixed number down the alphabet.'},
    {cipher:'Atbash', type:'Letter substitution', explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).'},
    {cipher:'Vigenere', type:'Keyword cipher', explanation:'Uses a keyword to shift letters differently across the message.'},
    {cipher:'Morse', type:'Dots and dashes', explanation:'Represents letters using dots (.) and dashes (-).'},
    {cipher:'Transposition', type:'Scramble letters', explanation:'Letters are rearranged according to a fixed pattern.'}
  ];

  const newLevels = [];
  for(let i=0;i<count;i++){
    const phrase = getRandomPhrase();
    const cipher = ciphers[Math.floor(Math.random()*ciphers.length)];
    newLevels.push({
      cipher: cipher.cipher,
      type: cipher.type,
      explanation: cipher.explanation,
      text: phrase,
      answer: phrase,
      givenUp: false,
      failed: false
    });
  }
  return newLevels;
}

// ===== Shuffle array =====
function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i], array[j]]=[array[j], array[i]];
  }
  return array;
}

// ===== State =====
let state = { index:0, attempts:0, hints:0, correct:0, failed:0 };

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

// ===== Render =====
function renderLevel(){
  const level = levels[state.index];
  els.levelIndicator.textContent = `${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent = `Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.title = `${level.type}: ${level.explanation}`;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;
  els.answerInput.value='';
  els.answerInput.disabled = level.givenUp;
  els.feedback.textContent='';
  typeWriter(level.text);
  updateProgress();
}

// ===== Update Progress =====
function updateProgress(){
  const pct = (state.correct + state.failed)/levels.length;
  els.progressTrack.style.setProperty('--pct', pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot = document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(levels[i].givenUp || levels[i].failed) dot.classList.add('done');
    els.progressDots.appendChild(dot);
  }
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  const level = levels[state.index];
  if(level.givenUp) return;
  const answer = els.answerInput.value.trim().toUpperCase();
  const correct = level.answer.toUpperCase();
  state.attempts++;
  els.attempts.textContent = state.attempts;
  if(answer === correct){
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
    state.correct++;
    setTimeout(nextLevel,700);
  } else {
    els.feedback.textContent='Wrong!'; els.feedback.className='feedback err';
  }
});

function nextLevel(){
  if(state.index < levels.length-1){
    state.index++;
    renderLevel();
  } else {
    showWinModal();
  }
}

function prevLevel(){
  if(state.index>0){
    state.index--;
    renderLevel();
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
  const level = levels[state.index];
  if(level.givenUp) return;
  const ans=level.answer;
  let current=els.answerInput.value.toUpperCase();
  for(let i=0;i<ans.length;i++){
    if(!current[i]) {
      current = current.slice(0,i) + ans[i] + current.slice(i+1);
      break;
    }
  }
  els.answerInput.value=current;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  const level = levels[state.index];
  level.givenUp = true;
  level.failed = true;
  state.failed++;
  els.answerInput.value = level.answer;
  els.answerInput.disabled = true;
  els.feedback.textContent='You gave up!'; els.feedback.className='feedback err';
  updateProgress();
}

function showWinModal(){
  els.winModal.innerHTML = `
  <div class="modal-card">
    <header class="modal-header">
      <h3>Game Over</h3>
    </header>
    <div class="modal-body">
      <p>Results: ${state.correct} / ${levels.length} correct, ${state.failed} failed.</p>
    </div>
    <footer class="modal-footer">
      <button class="btn primary" id="restartBtn">Restart</button>
    </footer>
  </div>
  `;
  els.winModal.showModal();
  document.getElementById('restartBtn').addEventListener('click',()=>location.reload());
}

// ===== Event Listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  location.reload();
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
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip instant
els.cipherTag.addEventListener('mouseenter',()=>els.cipherTag.title = levels[state.index].type + ': ' + levels[state.index].explanation);

// ===== Init =====
levels = shuffleArray(generateLevels(5));
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
