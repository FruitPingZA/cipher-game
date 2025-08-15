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

// ===== Funny phrases / word pool =====
const funnyPhrases = [
  "I love cheese", "Banana hammock", "Dancing penguin", "Flying spaghetti monster",
  "Taco Tuesday", "Invisible giraffe", "Unicorn farts", "Zombie apocalypse",
  "Waffle iron", "Toilet paper roll", "Duck face selfie", "Hairy spaghetti",
  "Cheeseburger planet", "Sneezing panda", "Potato festival", "Cactus hug",
  "Funky monkey", "Soggy socks", "Laughing llama", "Jellybean tornado",
  "Tiny dancing robots", "Pirate banana", "Penguin in pajamas", "Cosmic cupcake",
  "Chocolate volcano", "Rubber duck army", "Silly sock parade", "Marshmallow ninja",
  "Grumpy taco", "Kitten karate", "Llama llama duck", "Bacon confetti", "Space burrito"
  // ...add more to reach 100+ if desired
];

// ===== Cipher types =====
const cipherTypes = [
  {cipher:'Caesar', type:'Shift cipher', explanation:'Each letter is shifted by a fixed number down the alphabet.'},
  {cipher:'Atbash', type:'Letter substitution', explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).'},
  {cipher:'Vigenere', type:'Keyword cipher', explanation:'Uses a keyword to shift letters differently across the message.'},
  {cipher:'Morse', type:'Dots and dashes', explanation:'Represents letters using dots (.) and dashes (-).'},
  {cipher:'Transposition', type:'Scramble letters', explanation:'Letters are rearranged according to a fixed pattern.'}
];

// ===== Helper functions =====
function shuffleArray(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i], array[j]]=[array[j], array[i]];
  }
  return array;
}

// Pick 5 random phrases each session
function generateLevels(){
  const chosen = shuffleArray([...funnyPhrases]).slice(0,5);
  return chosen.map(text=>{
    const cipher = cipherTypes[Math.floor(Math.random()*cipherTypes.length)];
    let cipherText = text.toUpperCase();
    // For simplicity, Caesar shift 3 as example
    if(cipher.cipher==="Caesar"){
      cipherText = text.toUpperCase().split('').map(c=>{
        if(c>='A'&&c<='Z') return String.fromCharCode((c.charCodeAt(0)-65+3)%26+65);
        return c;
      }).join('');
    }
    if(cipher.cipher==="Atbash"){
      cipherText = text.toUpperCase().split('').map(c=>{
        if(c>='A'&&c<='Z') return String.fromCharCode(90-(c.charCodeAt(0)-65));
        return c;
      }).join('');
    }
    if(cipher.cipher==="Morse"){
      const morseMap = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',' ':'/'};
      cipherText = text.toUpperCase().split('').map(c=>morseMap[c]||c).join(' ');
    }
    if(cipher.cipher==="Transposition"){
      cipherText = text.toUpperCase().split('').sort(()=>Math.random()-0.5).join('');
    }
    return {cipher:cipher.cipher,type:cipher.type,explanation:cipher.explanation,text:cipherText,answer:text.toUpperCase(),locked:false,failed:false};
  });
}

// ===== State =====
let levels = generateLevels();
let state = { index:0, attempts:0, hints:0 };

// ===== Typewriter =====
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

// ===== Render Level =====
function renderLevel(){
  const level = levels[state.index];
  els.levelIndicator.textContent = `${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent = `Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.title = `${level.type}: ${level.explanation}`;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;

  els.answerInput.value='';
  els.answerInput.disabled = level.locked;

  els.feedback.textContent='';
  typeWriter(level.text);
  updateProgress();
}

function updateProgress(){
  const pct = (state.index+1)/levels.length;
  els.progressTrack.style.setProperty('--pct', pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot = document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(levels[i].failed) dot.classList.add('done');
    els.progressDots.appendChild(dot);
  }
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  const level = levels[state.index];
  if(level.locked) return;
  const answer = els.answerInput.value.trim().toUpperCase();
  state.attempts++;
  els.attempts.textContent = state.attempts;
  if(answer===level.answer){
    els.feedback.textContent='Correct!';
    els.feedback.className='feedback ok';
    nextLevel();
  } else {
    els.feedback.textContent='Wrong!';
    els.feedback.className='feedback err';
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
  els.feedback.textContent=`Hint: contains "${hintChar}"`;
  els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  const level = levels[state.index];
  if(level.locked) return;
  let current = els.answerInput.value.toUpperCase();
  const answer = level.answer;
  for(let i=0;i<answer.length;i++){
    if(!current.includes(answer[i])){
      els.answerInput.value += answer[i];
      break;
    }
  }
  els.feedback.textContent='Partial reveal';
  els.feedback.className='feedback hint';
}

function giveUp(){
  const level = levels[state.index];
  level.locked=true; level.failed=true;
  els.answerInput.value = level.answer;
  els.answerInput.disabled = true;
  els.feedback.textContent='Answer revealed — question locked';
  els.feedback.className='feedback hint';
  updateProgress();
}

// ===== Event Listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  levels = generateLevels();
  state={index:0,attempts:0,hints:0};
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
  levels = generateLevels();
  state={index:0,attempts:0,hints:0};
  renderLevel();
  els.winModal.close();
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));
els.cipherTag.addEventListener('mouseenter',()=>els.cipherTag.title=levels[state.index].type + ': ' + levels[state.index].explanation);

// ===== Fog animation =====
const fogEl = document.getElementById('fog');
let fogOffset=0;
function animateFog(){
  fogOffset+=0.05;
  fogEl.style.backgroundPosition=`${fogOffset}px ${fogOffset/2}px`;
  requestAnimationFrame(animateFog);
}
animateFog();

// ===== Init =====
renderLevel();
