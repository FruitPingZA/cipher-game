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
  {cipher:'Caesar', type:'Shift cipher', description:'Each letter is shifted a fixed number of places. Solve by trying shifts or using frequency analysis.', text:'KHOOR', answer:'HELLO'},
  {cipher:'Atbash', type:'Letter substitution', description:'Each letter is replaced with its opposite in the alphabet. Solve by reversing letters.', text:'ZOO', answer:'ALL'},
  {cipher:'Vigenere', type:'Keyword cipher', description:'Uses a keyword to shift letters differently for each position. Solve by finding the keyword or using frequency patterns.', text:'RIJVS', answer:'HELLO'},
  {cipher:'Morse', type:'Dots and dashes', description:'Dots and dashes represent letters. Solve by translating each symbol.', text:'.... . .-.. .-.. ---', answer:'HELLO'},
  {cipher:'Transposition', type:'Scramble letters', description:'Letters are rearranged. Solve by reordering them logically or by pattern.', text:'OLEHL', answer:'HELLO'}
];

let state = { index:0, attempts:0, hints:0 };

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
  els.cipherTag.textContent = level.cipher;
  els.attempts.textContent = state.attempts;
  els.hintsUsed.textContent = state.hints;
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
    state.index++; renderLevel(); els.answerInput.value=''; els.feedback.textContent='';
  } else els.winModal.showModal();
}
function prevLevel(){
  if(state.index>0){ state.index--; renderLevel(); els.answerInput.value=''; els.feedback.textContent=''; }
}
function hint(){
  state.hints++; els.hintsUsed.textContent=state.hints;
  const ans=levels[state.index].answer;
  const hintChar=ans[Math.floor(Math.random()*ans.length)];
  els.feedback.textContent=`Hint: contains "${hintChar}"`; els.feedback.className='feedback hint';
  if(audioOn) whisper.play();
}
function reveal(){
  els.answerInput.value=levels[state.index].answer;
  els.feedback.textContent='Partial reveal'; els.feedback.className='feedback hint';
}
function giveUp(){
  els.answerInput.value=levels[state.index].answer;
  els.feedback.textContent='Answer revealed'; els.feedback.className='feedback hint';
}

// ===== Event Listeners =====
els.prevBtn.addEventListener('click',prevLevel);
els.hintBtn.addEventListener('click',hint);
els.revealBtn.addEventListener('click',reveal);
els.giveUpBtn.addEventListener('click',giveUp);
els.skipBtn.addEventListener('click',nextLevel);
els.copyBtn.addEventListener('click',()=>navigator.clipboard.writeText(els.cipherText.textContent));
els.resetBtn.addEventListener('click',()=>{
  state.index=0; state.attempts=0; state.hints=0; renderLevel(); els.answerInput.value=''; els.feedback.textContent='';
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
  state.index=0; state.attempts=0; state.hints=0; renderLevel(); els.winModal.close(); els.answerInput.value=''; els.feedback.textContent='';
});
els.shareBtn.addEventListener('click',()=>navigator.clipboard.writeText(window.location.href));

// ===== Custom Cipher Tooltip =====
const tooltip = document.createElement('div');
tooltip.classList.add('cipher-tooltip');
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(10,14,22,0.9)';
tooltip.style.color = '#e7ecff';
tooltip.style.padding = '10px 14px';
tooltip.style.borderRadius = '12px';
tooltip.style.border = '1px solid #1a2230';
tooltip.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';
tooltip.style.pointerEvents = 'none';
tooltip.style.opacity = 0;
tooltip.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
tooltip.style.whiteSpace = 'pre-wrap';
tooltip.style.zIndex = 9999;
document.body.appendChild(tooltip);

els.cipherTag.addEventListener('mouseenter', (e) => {
  const level = levels[state.index];
  tooltip.textContent = `${level.cipher} — ${level.type}\nTip: ${level.description}`;
  const rect = els.cipherTag.getBoundingClientRect();
  tooltip.style.left = `${rect.right + 12}px`;
  tooltip.style.top = `${rect.top}px`;
  tooltip.style.opacity = 1;
  tooltip.style.transform = 'translateY(0)';
});

els.cipherTag.addEventListener('mousemove', (e) => {
  tooltip.style.left = `${e.clientX + 12}px`;
  tooltip.style.top = `${e.clientY + 12}px`;
});

els.cipherTag.addEventListener('mouseleave', () => {
  tooltip.style.opacity = 0;
  tooltip.style.transform = 'translateY(-10px)';
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
