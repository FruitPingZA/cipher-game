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

// ===== Word Bank =====
const WORDS = [
  "UNICORN FARTS","BANANA PHONE","PIZZA CAT","SPAGHETTI MONSTER","ZOMBIE NINJA",
  "LASER PENGUIN","TOILET PAPER KING","SLEEPY DRAGON","CUPCAKE WARRIOR","BUBBLE WRAP",
  "DANCING LLAMA","FARTING CLOWN","GIGGLING TURTLE","HICCUPING VAMPIRE","MOON WALKER"
];

// ===== Cipher functions =====
function caesarEncrypt(str, shift=3){
  return str.toUpperCase().replace(/[A-Z]/g, c=>String.fromCharCode((c.charCodeAt(0)-65+shift)%26+65));
}
function atbashEncrypt(str){
  return str.toUpperCase().replace(/[A-Z]/g, c=>String.fromCharCode(90-(c.charCodeAt(0)-65)));
}
function vigenereEncrypt(str,key="KEY"){
  str=str.toUpperCase(); key=key.toUpperCase();
  let res=""; let ki=0;
  for(let c of str){
    if(c>='A' && c<='Z'){
      let shift=key[ki%key.length].charCodeAt(0)-65;
      res+=String.fromCharCode((c.charCodeAt(0)-65+shift)%26+65);
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
  let arr=str.split('');
  for(let i=0;i<arr.length-1;i+=2){
    if(arr[i]!==' ' && arr[i+1]!==' ') [arr[i],arr[i+1]]=[arr[i+1],arr[i]];
  }
  return arr.join('');
}

// ===== Level generator =====
function generateRandomLevels(count=5){
  const levels=[];
  const ciphers=[
    {name:'Caesar',func:caesarEncrypt,type:'Shift cipher',explanation:'Each letter is shifted by a fixed number down the alphabet.'},
    {name:'Atbash',func:atbashEncrypt,type:'Letter substitution',explanation:'Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).'},
    {name:'Vigenere',func:(txt)=>vigenereEncrypt(txt,'FUN'),type:'Keyword cipher',explanation:'Uses a keyword to shift letters differently across the message.'},
    {name:'Morse',func:morseEncrypt,type:'Dots and dashes',explanation:'Represents letters using dots (.) and dashes (-).'},
    {name:'Transposition',func:transpositionEncrypt,type:'Scramble letters',explanation:'Letters are rearranged according to a fixed pattern.'}
  ];
  const usedWords = new Set();
  while(levels.length<count){
    let word=WORDS[Math.floor(Math.random()*WORDS.length)];
    if(usedWords.has(word)) continue;
    usedWords.add(word);
    const cipher=ciphers[Math.floor(Math.random()*ciphers.length)];
    levels.push({
      cipher:cipher.name,
      type:cipher.type,
      explanation:cipher.explanation,
      text:cipher.func(word),
      answer:word.toUpperCase()
    });
  }
  return levels;
}

let levels = generateRandomLevels(5);

// ===== State =====
let state = { index:0, attempts:0, hints:0, givenUp:false, correct:0, failed:0 };

// ===== Typewriter effect =====
function typeWriter(text,callback){
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
  const level=levels[state.index];
  els.levelIndicator.textContent=`${state.index+1} / ${levels.length}`;
  els.levelTitle.textContent=`Level ${state.index+1} — ${level.cipher}`;
  els.cipherTag.title=`${level.type}: ${level.explanation}`;
  els.attempts.textContent=state.attempts;
  els.hintsUsed.textContent=state.hints;
  els.answerInput.disabled=state.givenUp;
  els.feedback.textContent='';
  typeWriter(level.text);
  updateProgress();
}

function updateProgress(){
  const pct=(state.correct+state.failed)/levels.length;
  els.progressTrack.style.setProperty('--pct',pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot=document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(i<state.index){
      if(levels[i].locked) dot.classList.add('done');
    }
    els.progressDots.appendChild(dot);
  }
}

// ===== Actions =====
els.submitBtn.addEventListener('click',()=>{
  if(state.givenUp) return;
  const answer=els.answerInput.value.trim().toUpperCase();
  const correct=levels[state.index].answer;
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
    state.givenUp=false;
    renderLevel();
    els.answerInput.value='';
  } else endGame();
}

function prevLevel(){
  if(state.index>0){
    state.index--;
    state.givenUp=levels[state.index].locked||false;
    renderLevel();
    els.answerInput.value='';
  }
}

function hint(){
  state.hints++;
  els.hintsUsed.textContent=state.hints;
  const ans=levels[state.index].answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}

function reveal(){
  const ans=levels[state.index].answer;
  let current=els.answerInput.value.toUpperCase();
  for(let i=0;i<ans.length;i++){
    if(!current[i] || current[i]!==(ans[i])){
      els.answerInput.value=current.substring(0,i)+ans[i]+current.substring(i+1);
      break;
    }
  }
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}

function giveUp(){
  state.givenUp=true;
  levels[state.index].locked=true;
  els.answerInput.value=levels[state.index].answer;
  els.answerInput.disabled=true;
  state.failed++;
  els.feedback.textContent='Answer revealed — Locked'; els.feedback.className='feedback hint';
}

function endGame(){
  els.winModal.showModal();
}

// ===== Event listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>location.reload());
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
els.replayBtn.addEventListener('click',()=>location.reload());
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// Hover tooltip instantly shows
els.cipherTag.addEventListener('mouseenter',()=>els.cipherTag.title=levels[state.index].type + ': ' + levels[state.index].explanation);

// ===== Init =====
renderLevel();
