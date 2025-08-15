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
  feedback: document.getElementById('feedback'),
  score: document.createElement('div')
};

// ===== Audio =====
let audioOn = false;
const whisper = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_21cfc88df3.mp3');
whisper.volume = 0.55;
const windLoop = new Audio('https://cdn.pixabay.com/audio/2021/08/08/audio_0a50c9f3d2.mp3');
windLoop.loop = true; windLoop.volume = 0.18;

// ===== Word list (real words/phrases) =====
const WORDS = [
  "HELLO","WORLD","NIGHT","DAWN","CODE","PUZZLE","MYSTERY","SECRET",
  "ENIGMA","TRUTH","SHADOW","LIGHT","FIRE","WATER","EARTH","AIR",
  "CIPHER","KEYWORD","SILENCE","WHISPER","DREAM","VISION","SECRET CODE",
  "MIDNIGHT","RIDDLE","ANSWER","QUESTION","MAGIC","ALPHA","OMEGA","PHOENIX",
  "DRAGON","TREASURE","ADVENTURE","KNIGHT","CASTLE","SWORD","SHIELD",
  "QUEST","JOURNEY","LEGEND","MYTH","FABLE","HORIZON","STARRY NIGHT","MOONLIGHT",
  // ... add hundreds more for variety
];

// ===== Cipher Functions =====
function caesarEncrypt(str, shift=3){
  return str.toUpperCase().replace(/[A-Z]/g, c=>{
    return String.fromCharCode((c.charCodeAt(0)-65+shift)%26 + 65);
  });
}

function atbashEncrypt(str){
  return str.toUpperCase().replace(/[A-Z]/g, c=>{
    return String.fromCharCode(90 - (c.charCodeAt(0)-65));
  });
}

function vigenereEncrypt(str, key="KEY"){
  str=str.toUpperCase(); key=key.toUpperCase();
  let res=""; let ki=0;
  for(let c of str){
    if(c>='A' && c<='Z'){
      let shift = key[ki%key.length].charCodeAt(0)-65;
      res += String.fromCharCode((c.charCodeAt(0)-65+shift)%26+65);
      ki++;
    } else res+=c;
  }
  return res;
}

function morseEncrypt(str){
  const MORSE = {
    'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.',
    'H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.',
    'O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-',
    'V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',' ':'/'
  };
  return str.toUpperCase().split('').map(c=>MORSE[c]||c).join(' ');
}

function transpositionEncrypt(str){
  let arr = str.split('');
  for(let i=0;i<arr.length-1;i+=2){
    [arr[i],arr[i+1]]=[arr[i+1],arr[i]];
  }
  return arr.join('');
}

// ===== Generate random levels =====
function generateRandomLevels(count=5){
  const ciphers = [
    {cipher:'Caesar', type:'Shift cipher', fn:caesarEncrypt, opts:{shift:3}, explanation:'Each letter is shifted by a fixed number down the alphabet.'},
    {cipher:'Atbash', type:'Letter substitution', fn:atbashEncrypt, opts:{}, explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).'},
    {cipher:'Vigenère', type:'Keyword cipher', fn:vigenereEncrypt, opts:{key:'KEY'}, explanation:'Uses a keyword to shift letters differently across the message.'},
    {cipher:'Morse', type:'Dots and dashes', fn:morseEncrypt, opts:{}, explanation:'Represents letters using dots (.) and dashes (-).'},
    {cipher:'Transposition', type:'Scramble letters', fn:transpositionEncrypt, opts:{}, explanation:'Letters are rearranged according to a fixed pattern.'}
  ];
  
  let selectedWords = [];
  while(selectedWords.length<count){
    const w = WORDS[Math.floor(Math.random()*WORDS.length)];
    if(!selectedWords.includes(w)) selectedWords.push(w);
  }
  
  return selectedWords.map(w=>{
    const c = ciphers[Math.floor(Math.random()*ciphers.length)];
    return {
      cipher: c.cipher,
      type: c.type,
      explanation: c.explanation,
      text: c.fn(w, ...(c.opts.key? [c.opts.key] : [])),
      answer: w,
      locked:false,
      failed:false
    };
  });
}

// ===== State =====
let levels = generateRandomLevels(5);
let state = {index:0, attempts:0, hints:0, correct:0, failed:0};

// ===== Typewriter effect =====
function typeWriter(text, callback){
  els.cipherText.textContent='';
  let i=0;
  function step(){
    if(i<text.length){
      els.cipherText.textContent+=text[i]; i++;
      setTimeout(step,70);
    } else callback && callback();
  }
  step();
}

// ===== Render level =====
function renderLevel(){
  const lvl=levels[state.index];
  els.levelIndicator.textContent=`${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent=`Level ${state.index+1} — ${lvl.cipher}`;
  els.cipherTag.title=`${lvl.type}: ${lvl.explanation}`;
  els.attempts.textContent=state.attempts;
  els.hintsUsed.textContent=state.hints;
  els.feedback.textContent='';
  typeWriter(lvl.text);
  els.answerInput.value='';
  els.answerInput.disabled=lvl.locked;
  els.submitBtn.disabled=lvl.locked;
  updateProgress();
}

// ===== Update progress =====
function updateProgress(){
  els.progressDots.innerHTML='';
  levels.forEach((lvl,i)=>{
    const dot=document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(lvl.failed) dot.classList.add('failed');
    els.progressDots.appendChild(dot);
  });
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  const lvl=levels[state.index];
  if(lvl.locked) return;
  const ans=els.answerInput.value.trim().toUpperCase();
  const correct=lvl.answer.toUpperCase();
  state.attempts++;
  els.attempts.textContent=state.attempts;
  if(ans===correct){
    state.correct++;
    els.feedback.textContent='Correct!'; els.feedback.className='feedback ok';
    setTimeout(nextLevel,700);
  } else {
    els.feedback.textContent='Wrong! Try again.'; els.feedback.className='feedback err';
  }
});

function nextLevel(){
  if(state.index<levels.length-1){ state.index++; renderLevel(); } 
  else els.winModal.showModal();
}

function prevLevel(){
  if(state.index>0){ state.index--; renderLevel(); }
}

function hint(){
  state.hints++; els.hintsUsed.textContent=state.hints;
  const ans=levels[state.index].answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  const lvl=levels[state.index];
  const ans=lvl.answer;
  let current=els.answerInput.value.toUpperCase();
  for(let i=0;i<ans.length;i++){
    if(!current[i]) { current=current.slice(0,i)+ans[i]+current.slice(i+1); break; }
  }
  els.answerInput.value=current;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  const lvl=levels[state.index];
  lvl.locked=true;
  lvl.failed=true;
  state.failed++;
  els.answerInput.value=lvl.answer;
  els.answerInput.disabled=true;
  els.submitBtn.disabled=true;
  els.feedback.textContent='You gave up!'; els.feedback.className='feedback hint';
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
  levels=generateRandomLevels(5);
  state={index:0, attempts:0, hints:0, correct:0, failed:0};
  renderLevel();
});
els.audioToggle.addEventListener('click',()=>{
  audioOn=!audioOn;
  els.audioToggle.textContent=audioOn?'🔊 Audio On':'🔇 Audio Off';
  if(audioOn) windLoop.play(); else windLoop.pause();
});
els.helpBtn.addEventListener('click',()=>els.helpModal.showModal());
els.helpClose.addEventListener('click',()=>els.helpModal.close());
els.helpOk.addEventListener('click',()=>els.helpModal.close());
els.winClose.addEventListener('click',()=>els.winModal.close());
els.replayBtn.addEventListener('click',()=>{
  levels=generateRandomLevels(5);
  state={index:0, attempts:0, hints:0, correct:0, failed:0};
  renderLevel(); els.winModal.close();
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip shows explanation instantly
els.cipherTag.addEventListener('mouseenter',()=>{els.cipherTag.title=levels[state.index].type+': '+levels[state.index].explanation;});

// ===== Init =====
renderLevel();

// ===== Fog animation =====
const fogEl=document.getElementById('fog'); let fogOffset=0;
function animateFog(){ fogOffset+=0.05; fogEl.style.backgroundPosition=`${fogOffset}px ${fogOffset/2}px`; requestAnimationFrame(animateFog);}
animateFog();
