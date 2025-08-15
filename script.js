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

// ===== Word bank for funny phrases =====
const wordBank = [
  'HELLO WORLD', 'I LOVE COFFEE', 'BANANA SPLIT', 'CODE MONKEY', 'PIZZA PARTY',
  'SLEEPY CAT', 'FUNNY BUNNY', 'DANCE LIKE NOBODY', 'SPAGHETTI TACO', 'TOASTED CHEESE',
  'WONKY DONKEY', 'HAPPY FEET', 'JELLYFISH JAM', 'SNEEZING PANDA', 'LAUGHING HIPPO'
];

// ===== Cipher generators =====
function generateLevels() {
  const ciphers = [
    { cipher:'Caesar', type:'Shift cipher', explanation:'Each letter is shifted by a fixed number down the alphabet.', encode:caesarEncode },
    { cipher:'Atbash', type:'Letter substitution', explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).', encode:atbashEncode },
    { cipher:'Vigenere', type:'Keyword cipher', explanation:'Uses a keyword to shift letters differently across the message.', encode:vigenereEncode },
    { cipher:'Morse', type:'Dots and dashes', explanation:'Represents letters using dots (.) and dashes (-).', encode:morseEncode },
    { cipher:'Transposition', type:'Scramble letters', explanation:'Letters are rearranged according to a fixed pattern.', encode:transpositionEncode }
  ];

  let levels = [];
  const usedWords = new Set();
  
  while(levels.length < 5){
    const word = wordBank[Math.floor(Math.random()*wordBank.length)];
    if(usedWords.has(word)) continue;
    usedWords.add(word);

    const cipherObj = ciphers[Math.floor(Math.random()*ciphers.length)];
    levels.push({
      cipher: cipherObj.cipher,
      type: cipherObj.type,
      explanation: cipherObj.explanation,
      text: cipherObj.encode(word),
      answer: word,
      locked: false,
      failed: false
    });
  }
  return levels;
}

// ===== Cipher functions =====
function caesarEncode(str){ 
  return str.replace(/[A-Z]/gi, c => String.fromCharCode(((c.toUpperCase().charCodeAt(0)-65+3)%26)+65)); 
}
function atbashEncode(str){ 
  return str.replace(/[A-Z]/gi, c => String.fromCharCode(90-(c.toUpperCase().charCodeAt(0)-65))); 
}
function vigenereEncode(str){ 
  const key = 'FUN'; let res=''; let j=0;
  for(let i=0;i<str.length;i++){
    const c = str[i];
    if(c.match(/[A-Z ]/i)){
      if(c===' '){ res+=' '; continue; }
      const shift = key[j%key.length].toUpperCase().charCodeAt(0)-65;
      res+=String.fromCharCode((c.toUpperCase().charCodeAt(0)-65+shift)%26+65);
      j++;
    } else res+=c;
  }
  return res;
}
const morseMap = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',' ':'/'};
function morseEncode(str){ return str.toUpperCase().split('').map(c=>morseMap[c]||c).join(' '); }
function transpositionEncode(str){ return str.split('').sort(()=>Math.random()-0.5).join(''); }

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
  els.cipherTag.title = `${level.type}: ${level.explanation}`;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;

  els.answerInput.value='';
  els.answerInput.disabled = level.locked;

  els.feedback.textContent='';

  if(level.text && level.text.length>0){
    typeWriter(level.text);
  } else els.cipherText.textContent='...';

  updateProgress();
}

// ===== Progress =====
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

  if(answer === level.answer.toUpperCase()){
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
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
  state.hints++; els.hintsUsed.textContent = state.hints;
  const ans=level.answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  const level = levels[state.index];
  if(level.locked) return;
  const ans=level.answer;
  const unrevealed = ans.split('').map((c,i)=>i===0? c : '_').join('');
  els.answerInput.value = unrevealed;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  const level = levels[state.index];
  level.locked = true;
  level.failed = true;
  els.answerInput.value = level.answer;
  els.answerInput.disabled = true;
  els.feedback.textContent='You gave up!'; els.feedback.className='feedback err';
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
  state = { index:0, attempts:0, hints:0 };
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
  levels = generateLevels();
  state = { index:0, attempts:0, hints:0 };
  renderLevel(); els.winModal.close();
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip shows instantly
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
