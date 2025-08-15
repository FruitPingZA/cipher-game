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

// ===== Cipher templates =====
const cipherTemplates = [
  {cipher:'Caesar', type:'Shift cipher', explanation:'Each letter is shifted by a fixed number down the alphabet.', func:caesarEncode},
  {cipher:'Atbash', type:'Letter substitution', explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).', func:atbashEncode},
  {cipher:'Vigenere', type:'Keyword cipher', explanation:'Uses a keyword to shift letters differently across the message.', func:vigenereEncode},
  {cipher:'Morse', type:'Dots and dashes', explanation:'Represents letters using dots (.) and dashes (-).', func:morseEncode},
  {cipher:'Transposition', type:'Scramble letters', explanation:'Letters are rearranged according to a fixed pattern.', func:transposeEncode}
];

// ===== Word list =====
const funnyWords = [
  'BANANA','UNICORN','PENGUIN','SPAGHETTI','COFFEE','MEOW','CHOCOLATE',
  'BUBBLEGUM','WAFFLE','TACO','FART','PIZZA','HIPPOPOTAMUS','BROCCOLI','NINJA'
];

// ===== Helpers =====
function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}

// ===== Generate levels =====
function generateLevels(count=5){
  const levels = [];
  for(let i=0;i<count;i++){
    const word = funnyWords[Math.floor(Math.random()*funnyWords.length)];
    const cipher = cipherTemplates[Math.floor(Math.random()*cipherTemplates.length)];
    levels.push({
      cipher:cipher.cipher,
      type:cipher.type,
      explanation:cipher.explanation,
      text:cipher.func(word),
      answer:word
    });
  }
  return levels;
}

// ===== Cipher functions =====
function caesarEncode(word){ // simple +3 shift
  return word.split('').map(c=>{
    if(c.match(/[A-Z]/)) return String.fromCharCode((c.charCodeAt(0)-65+3)%26+65);
    return c;
  }).join('');
}

function atbashEncode(word){
  return word.split('').map(c=>{
    if(c.match(/[A-Z]/)) return String.fromCharCode(90-(c.charCodeAt(0)-65));
    return c;
  }).join('');
}

function vigenereEncode(word){
  const key='KEY';
  let j=0;
  return word.split('').map(c=>{
    if(c.match(/[A-Z]/)){
      const code = (c.charCodeAt(0)-65 + key.charCodeAt(j%key.length)-65)%26 + 65;
      j++; return String.fromCharCode(code);
    }
    return c;
  }).join('');
}

function morseEncode(word){
  const morseMap = {
    A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',
    J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',
    S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..'
  };
  return word.split('').map(c=>morseMap[c]||c).join(' ');
}

function transposeEncode(word){
  return word.split('').sort(()=>Math.random()-0.5).join('');
}

// ===== State =====
let levels = generateLevels(5);
levels = shuffleArray(levels);
let state = {index:0, attempts:0, hints:0, correct:0, failed:0, locked: new Set()};

// ===== Typewriter =====
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

// ===== Render level =====
function renderLevel(){
  const level = levels[state.index];
  els.levelIndicator.textContent=`${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent=`Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.title=`${level.type}: ${level.explanation}`;
  els.attempts.textContent=state.attempts;
  els.hintsUsed.textContent=state.hints;
  els.feedback.textContent='';
  els.answerInput.value='';
  els.answerInput.disabled=state.locked.has(state.index);
  els.submitBtn.disabled=state.locked.has(state.index);
  typeWriter(level.text);
  updateProgress();
}

function updateProgress(){
  const pct=(state.index+1)/levels.length;
  els.progressTrack.style.setProperty('--pct',pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot=document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(i<state.index){
      if(state.locked.has(i)) dot.classList.add('done');
      else dot.classList.add('done');
    }
    els.progressDots.appendChild(dot);
  }
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  if(state.locked.has(state.index)) return;
  const answer=els.answerInput.value.trim().toUpperCase();
  const correct=levels[state.index].answer.toUpperCase();
  state.attempts++;
  els.attempts.textContent=state.attempts;
  if(answer===correct){
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
    state.correct++;
    setTimeout(nextLevel,700);
  } else {
    els.feedback.textContent='Wrong!'; els.feedback.className='feedback err';
  }
});

function nextLevel(){
  if(state.index<levels.length-1){
    state.index++;
    renderLevel();
  } else showWin();
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
  const ans=levels[state.index].answer;
  const input=els.answerInput;
  let current=input.value.toUpperCase();
  for(let i=0;i<ans.length;i++){
    if(current[i]!==ans[i]){
      current=current.substring(0,i)+ans[i]+current.substring(i+1);
      break;
    }
  }
  input.value=current;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  const ans=levels[state.index].answer;
  els.answerInput.value=ans;
  els.feedback.textContent='Answer revealed'; els.feedback.className='feedback hint';
  state.failed++;
  state.locked.add(state.index);
  els.answerInput.disabled=true;
  els.submitBtn.disabled=true;
}

// ===== Event Listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  levels=shuffleArray(generateLevels(5));
  state={index:0, attempts:0, hints:0, correct:0, failed:0, locked:new Set()};
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
els.winClose.addEventListener('click',()=>els.winModal.close());
els.replayBtn.addEventListener('click',()=>{
  levels=shuffleArray(generateLevels(5));
  state={index:0, attempts:0, hints:0, correct:0, failed:0, locked:new Set()};
  renderLevel(); els.winModal.close();
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip shows instantly
els.cipherTag.addEventListener('mouseenter',()=>els.cipherTag.title=levels[state.index].type + ': ' + levels[state.index].explanation);

// ===== Win =====
function showWin(){
  els.winModal.innerHTML=`<div class="modal-card">
    <header class="modal-header">
      <h3>Game Complete!</h3>
      <button class="btn ghost close" id="winClose" aria-label="Close">✕</button>
    </header>
    <div class="modal-body">
      <p>Correct: ${state.correct} / ${levels.length}</p>
      <p>Failed: ${state.failed} / ${levels.length}</p>
    </div>
    <footer class="modal-footer">
      <button class="btn primary" id="replayBtn">Restart</button>
    </footer>
  </div>`;
  els.winModal.showModal();
  document.getElementById('replayBtn').addEventListener('click',()=>{
    levels=shuffleArray(generateLevels(5));
    state={index:0, attempts:0, hints:0, correct:0, failed:0, locked:new Set()};
    renderLevel(); els.winModal.close();
  });
  document.getElementById('winClose').addEventListener('click',()=>els.winModal.close());
}

// ===== Fog animation =====
const fogEl=document.getElementById('fog');
let fogOffset=0;
function animateFog(){
  fogOffset+=0.05;
  fogEl.style.backgroundPosition=`${fogOffset}px ${fogOffset/2}px`;
  requestAnimationFrame(animateFog);
}
animateFog();

// ===== Initial render =====
renderLevel();
