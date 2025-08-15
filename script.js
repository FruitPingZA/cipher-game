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
  levelIndicator: document.getElementById('levelIndicator'),
  attempts: document.getElementById('attempts'),
  hintsUsed: document.getElementById('hintsUsed'),
  score: document.getElementById('score'),
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

// ===== Random helpers =====
function randomWord(length){
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let word=''; for(let i=0;i<length;i++) word+=letters[Math.floor(Math.random()*letters.length)];
  return word;
}
function caesarCipher(word,shift){ const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return word.split('').map(c=>{const idx=letters.indexOf(c.toUpperCase()); return idx===-1?c:letters[(idx+shift)%26];}).join('');}
function atbashCipher(word){ const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return word.split('').map(c=>{const idx=letters.indexOf(c.toUpperCase()); return idx===-1?c:letters[25-idx];}).join('');}
function transpositionCipher(word){return word.split('').sort(()=>Math.random()-0.5).join('');}
function vigenereCipher(word,key){ const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return word.split('').map((c,i)=>{ const idx=letters.indexOf(c.toUpperCase()); if(idx===-1) return c; const k=letters.indexOf(key[i%key.length].toUpperCase()); return letters[(idx+k)%26];}).join('');}
const morseTable={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..'};
function morseCipher(word){return word.split('').map(c=>morseTable[c.toUpperCase()]||c).join(' ');}
function generateRandomLevels(count=5){
  const types=['Caesar','Atbash','Vigenere','Morse','Transposition'];
  const levels=[];
  for(let i=0;i<count;i++){
    const word=randomWord(3+Math.floor(Math.random()*5));
    const type=types[Math.floor(Math.random()*types.length)];
    let text,explanation,answer=word;
    switch(type){
      case 'Caesar': const shift=1+Math.floor(Math.random()*25); text=caesarCipher(word,shift); explanation=`Each letter is shifted by ${shift} down the alphabet.`; break;
      case 'Atbash': text=atbashCipher(word); explanation='Each letter is replaced by its reverse in the alphabet (A→Z, B→Y).'; break;
      case 'Vigenere': const key=randomWord(3+Math.floor(Math.random()*3)); text=vigenereCipher(word,key); explanation=`Each letter is shifted by a keyword (${key}).`; break;
      case 'Morse': text=morseCipher(word); explanation='Letters represented using dots (.) and dashes (-).'; break;
      case 'Transposition': text=transpositionCipher(word); explanation='Letters are rearranged according to a random pattern.'; break;
    }
    levels.push({cipher:type,type:type,explanation,text,answer,locked:false,failed:false});
  }
  return levels;
}

// ===== State =====
let levels=generateRandomLevels(5);
let state={index:0,attempts:0,hints:0,correct:0,failed:0};

// ===== Typewriter effect =====
function typeWriter(text,callback){
  els.cipherText.textContent=''; let i=0;
  function step(){ if(i<text.length){ els.cipherText.textContent+=text[i]; i++; setTimeout(step,70);} else callback&&callback();}
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
  els.score.textContent=`${state.correct} / ${state.failed}`;
  updateProgress();
  typeWriter(lvl.text);
  els.answerInput.value='';
  els.answerInput.disabled=lvl.locked;
  els.submitBtn.disabled=lvl.locked;
}

// ===== Update progress =====
function updateProgress(){
  const pct=(state.index+1)/levels.length;
  els.progressTrack.style.setProperty('--pct',pct);
  els.progressDots.innerHTML='';
  for(let i=0;i<levels.length;i++){
    const dot=document.createElement('div'); dot.classList.add('dot');
    if(i===state.index) dot.classList.add('active');
    if(levels[i].failed) dot.classList.add('failed');
    els.progressDots.appendChild(dot);
  }
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
  if(state.index<levels.length-1){ state.index++; renderLevel(); els.feedback.textContent=''; } 
  else els.winModal.showModal();
}

function prevLevel(){
  if(state.index>0){ state.index--; renderLevel(); els.feedback.textContent=''; }
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
  state={index:0,attempts:0,hints:0,correct:0,failed:0};
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
  levels=generateRandomLevels(5);
  state={index:0,attempts:0,hints:0,correct:0,failed:0};
  renderLevel();
  els.winModal.close();
});

// Hover shows explanation instantly
els.cipherTag.addEventListener('mouseenter',()=>{els.cipherTag.title=levels[state.index].type + ': ' + levels[state.index].explanation;});

// ===== Init =====
renderLevel();

// ===== Fog animation =====
const fogEl=document.getElementById('fog'); let fogOffset=0;
function animateFog(){ fogOffset+=0.05; fogEl.style.backgroundPosition=`${fogOffset}px ${fogOffset/2}px`; requestAnimationFrame(animateFog);}
animateFog();
