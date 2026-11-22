/* Paired-associate memory experiment: three-tone training module.
   Uses Web Audio synthesis; no third-party audio files. 2026-11 prototype.
   Developer note: This records locally (and in jsPsych trial data if integrated).
   It does NOT transmit, persist to a server, or create Prolific completions.
*/
(function(root){
'use strict';
const VERSION='tone-training-2.0.0';
const CONFIG=Object.freeze({
  frequencies:Object.freeze({1:400,2:650,3:1000}),
  toneDurationMs:450,
  trialDurationMs:3000,
  toneOnsetsMs:Object.freeze([200,1700]),
  tonesPerAssessment:12,
  criterionCorrect:9, // 75% of 12 tones
  guidedTrials:6,
  criterionTrials:6,
  soundGain:0.095
});
const CSS=`
.pmt-host,.pmt-host *{box-sizing:border-box}
.pmt-host{min-height:100vh;background:#f2f5fa;color:#19324b;font:15px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif;padding:28px 12px}
.pmt-card{max-width:630px;margin:0 auto;background:white;border:1px solid #d9e3ef;border-radius:14px;padding:36px 40px;box-shadow:0 10px 30px #18324a0e}
.pmt-card h1{font-size:26px;line-height:1.22;margin:0 0 20px}
.pmt-card h2{font-size:20px;margin:0 0 10px}
.pmt-eyebrow{color:#527090;font-size:12px;letter-spacing:.04em;text-transform:uppercase;font-weight:750}
.pmt-muted{color:#5c6e81}.pmt-note{font-size:13px;color:#52667b}
.pmt-map{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:22px 0}
.pmt-map > div{border:1px solid #c9d9eb;border-radius:10px;padding:15px;text-align:center;background:#f8fbff}.pmt-map > div.pmt-active{border:2px solid #206ea9;background:#f0f8ff}.pmt-map > div.pmt-completed{background:#f1f9f4;border-color:#a2cdb6}.pmt-step{font-size:12px;color:#506a82;margin-top:8px;min-height:20px}
.pmt-key{font-size:32px;color:#176bb2;font-weight:800;line-height:1.3}
.pmt-btn{cursor:pointer;border:1px solid #b8cadc;background:white;color:#173d61;border-radius:8px;padding:11px 16px;font-size:14px;font-weight:680}
.pmt-btn:disabled{opacity:.45;cursor:not-allowed}.pmt-btn.primary{background:#206ea9;border-color:#206ea9;color:white}
.pmt-btn.danger{color:#7c2e37;border-color:#e6bec5;background:#fffafa}
.pmt-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:28px}
.pmt-trial{margin:16px auto;padding:45px 12px 34px;max-width:550px;text-align:center;background:#f3f7fc;border:1px solid #d5e1f0;border-radius:12px}
.pmt-trial-minimal{background:#fff;border:0;padding:58px 12px 38px;margin:12px auto 0}.pmt-keys-large{font-size:16px;font-weight:600;margin:12px auto 32px}.pmt-minimal-actions{display:flex;justify-content:center;margin-top:38px}.pmt-fix{font-size:56px;font-weight:450;line-height:1.3}.pmt-response{min-height:34px;text-align:center;font-weight:650}
.pmt-progress{height:8px;background:#e5ebf4;border-radius:15px;overflow:hidden;margin:14px 0}
.pmt-progress>div{height:100%;background:#4385ba}
.pmt-pass{padding:12px;background:#f4f9f4;border-left:4px solid #20836a;margin:15px 0}
.pmt-warn{padding:12px;background:#fff7ed;border-left:4px solid #e8a23b;margin:15px 0}
.pmt-keys{font-size:13px;color:#47607a;text-align:center}
.pmt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}
.pmt-stat{border:1px solid #e2eaf1;border-radius:9px;padding:13px}.pmt-stat strong{display:block;font-size:24px}
.pmt-keyline{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:24px 0 20px}
.pmt-keyline span{border:1px solid #d6e2ee;border-radius:9px;padding:12px 8px;text-align:center;color:#1d4364}
.pmt-keyline b{display:block;font-size:20px;color:#153c60}
.pmt-demo-key{font-size:35px;font-weight:750;color:#176bb2;line-height:1.3;margin:10px 0 16px}
.pmt-demo-key small{display:block;font-size:15px;font-weight:500;color:#50677d}
.pmt-details{margin-top:25px;padding-top:12px;border-top:1px solid #e0e7ef;color:#5c6e81;font-size:13px}
.pmt-details summary{cursor:pointer}
.pmt-details .pmt-actions{margin-top:12px}
.pmt-message{min-height:22px;color:#445f76}
@media(max-width:560px){.pmt-card{padding:24px 18px}.pmt-keyline{gap:6px}.pmt-keyline span{padding:10px 4px}}
@media(max-width:560px){.pmt-card{padding:20px 14px}.pmt-map{grid-template-columns:1fr}.pmt-grid{grid-template-columns:1fr}}
`;
function ensureStyles(){if(!document.getElementById('pmt-styles')){const s=document.createElement('style');s.id='pmt-styles';s.textContent=CSS;document.head.appendChild(s)}}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function balancedSequence(){return shuffle([1,1,1,1,2,2,2,2,3,3,3,3]);}
function csvEscape(v){let s=v===null||v===undefined?'':String(v);return '"'+s.replaceAll('"','""')+'"';}
function downloadFile(name,content,mime){const b=new Blob([content],{type:mime});const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
class TrainingSession{
 constructor(element,opts={}){
  this.element=element;this.opts=opts;this.phase='familiarization';this.audio=null;
  this.played=new Set();this.events=[];this.attempts=[];this.extraKeys=[];
  this.familiarizationEvents=[];this.familiarizationRound=0;this.familiarizationAwaitingKey=null;this.familiarizationToneStartPerf=null;
  this.currentMode=null;this.currentTrial=-1;this.currentSlots=[];this.sequence=[];this.trialStart=0;
  this.timers=[];this.live=false;this.passed=false;this.withdrawn=false;this.startedAt=new Date().toISOString();
  this.instructionsShownAt=null;this.instructionsConfirmedAt=null;
  this.keyHandler=e=>this.handleKey(e);this.focusHandler=()=>this.visibility();
  document.addEventListener('keydown',this.keyHandler);
  document.addEventListener('visibilitychange',this.focusHandler);
  this.drawInstructions();
 }
 async enableAudio(){
  const AC=root.AudioContext||root.webkitAudioContext;
  if(!AC){this.warn('This browser cannot play Web Audio. Please use a recent desktop browser.');return false;}
  try{if(!this.audio)this.audio=new AC();if(this.audio.state!=='running')await this.audio.resume();return this.audio.state==='running';}
  catch(e){this.warn('Audio could not start. Check your browser audio permissions and try again.');return false;}
 }
 playHz(hz,startAt,durationMs=CONFIG.toneDurationMs){
  if(!this.audio)return;
  const ac=this.audio,osc=ac.createOscillator(),gain=ac.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(hz,startAt);
  gain.gain.setValueAtTime(0.00001,startAt);
  gain.gain.linearRampToValueAtTime(CONFIG.soundGain,startAt+0.012);
  gain.gain.setValueAtTime(CONFIG.soundGain,Math.max(startAt+0.014,startAt+durationMs/1000-0.018));
  gain.gain.linearRampToValueAtTime(0.00001,startAt+durationMs/1000);
  osc.connect(gain);gain.connect(ac.destination);osc.start(startAt);osc.stop(startAt+durationMs/1000+0.01);
 }
 shell(title,inner,subtitle=''){ensureStyles();this.element.innerHTML=`<div class="pmt-host"><div class="pmt-card"><h1>${title}</h1>${subtitle?`<p class="pmt-muted">${subtitle}</p>`:''}${inner}</div></div>`;}
 warn(s){let el=this.element.querySelector('.pmt-message');if(el)el.textContent=s;}
 drawInstructions(){
  this.phase='instructions';this.instructionsShownAt=new Date().toISOString();
  this.shell('Identify the tones',`
   <p>Listen to each sound and press the matching key.</p>
   <div class="pmt-keyline"><span><b>1</b>Low</span><span><b>2</b>Medium</span><span><b>3</b>High</span></div>
   <p class="pmt-note">First you'll practice. Then you'll identify 12 tones. Get at least 9 correct to continue.</p>
   <div class="pmt-actions"><button class="pmt-btn primary" id="pmt-start-familiarization" type="button">Continue</button></div>
  `);
  this.element.querySelector('#pmt-start-familiarization').addEventListener('click',()=>{
   if(this.phase!=='instructions')return;
   this.instructionsConfirmedAt=new Date().toISOString();
   this.drawIntro();
  });
 }
 drawIntro(reset=true){
  this.phase='familiarization';
  if(reset){this.played.clear();this.familiarizationRound+=1;}
  this.familiarizationAwaitingKey=null;
  this.familiarizationToneStartPerf=null;
  const tones=[[1,'LOW'],[2,'MEDIUM'],[3,'HIGH']];
  const current=tones.find(([k])=>!this.played.has(k));
  const allDone=!current;
  this.shell('Match the sound', allDone?`
   <p>All three sounds matched.</p>
   <div class="pmt-actions"><button class="pmt-btn primary" type="button" id="pmt-begin">Begin practice</button></div>
  `:`
   <p>Listen to the <strong>${current[1].toLowerCase()}</strong> tone, then press:</p>
   <div class="pmt-demo-key">${current[0]}<small>${current[1].toLowerCase()} tone</small></div>
   <div class="pmt-actions"><button class="pmt-btn primary" id="pmt-play-current" type="button">Play tone</button></div>
   <p class="pmt-message" id="pmt-familiar-prompt" role="status"></p>
  `);
  const playBtn=this.element.querySelector('#pmt-play-current');
  if(playBtn)playBtn.addEventListener('click',async()=>{
   if(this.phase!=='familiarization'||!await this.enableAudio())return;
   this.playHz(CONFIG.frequencies[current[0]],this.audio.currentTime+0.04);
   this.familiarizationAwaitingKey=current[0];
   this.familiarizationToneStartPerf=performance.now()+40;
   playBtn.textContent='Replay tone';
   this.warn(`Press ${current[0]}.`);
  });
  const beginBtn=this.element.querySelector('#pmt-begin');
  if(beginBtn)beginBtn.addEventListener('click',()=>{
   if(this.played.size===3)this.startBlock('guided');
  });
 }
 handleFamiliarizationKey(e){
  if(this.familiarizationAwaitingKey===null||this.phase!=='familiarization')return;
  const now=performance.now();
  if(now<this.familiarizationToneStartPerf)return;
  const correctKey=this.familiarizationAwaitingKey;
  const correct=e.key===String(correctKey);
  this.familiarizationEvents.push({phase:'familiarization',round:this.familiarizationRound,step:this.played.size+1,
   frequency_hz:CONFIG.frequencies[correctKey],pitch_name:{1:'low',2:'medium',3:'high'}[correctKey],
   correct_key:String(correctKey),response_key:e.key,correct,
   rt_ms:Math.round(now-this.familiarizationToneStartPerf),
   participant_id:this.opts.participantId||null,timestamp:new Date().toISOString()});
  this.familiarizationAwaitingKey=null;
  this.familiarizationToneStartPerf=null;
  if(correct){
   this.played.add(correctKey);
   // Progress to the next sound only after a correct physical keypress.
   this.drawIntro(false);
  }else{
   this.warn(`Incorrect. Replay the tone and press ${correctKey}.`);
  }
 }
 async startBlock(mode){
  if(this.live)return;if(!await this.enableAudio())return;
  this.phase=mode;this.currentMode=mode;this.sequence=balancedSequence();this.currentTrial=-1;this.currentSlots=[];
  this.currentAttemptNo=mode==='criterion'?1+this.attempts.filter(x=>x.mode==='criterion').length:1+this.attempts.filter(x=>x.mode==='guided').length;
  this.blockStartAt=new Date().toISOString();this.blockEvents=[];this.live=true;
  // Keep the timed presentation intentionally minimal: no trial counter, progress
  // bar or running scores. Both practice and assessment display brief feedback.
  this.shell(mode==='guided'?'Tone practice':'Tone identification',`
   <div class="pmt-trial pmt-trial-minimal"><div class="pmt-fix">+</div></div>
   <p class="pmt-keys pmt-keys-large">1 = Low &nbsp;&nbsp; 2 = Medium &nbsp;&nbsp; 3 = High</p>
   <div class="pmt-response" id="pmt-feedback" role="status" aria-live="polite"></div>`);
  this.queue(()=>this.startTrial(0),150);
 }
 queue(fn,ms){const id=setTimeout(fn,ms);this.timers.push(id);return id;}
 cancelTimers(){this.timers.forEach(clearTimeout);this.timers=[];}
 startTrial(i){
  if(!this.live)return;
  if(i>=6){this.finishBlock();return;}
  this.currentTrial=i; // Trial/tone indices still recorded internally.
  const feedback=this.element.querySelector('#pmt-feedback');if(feedback)feedback.textContent='';
  const plannedStartAudio=this.audio.currentTime+0.035;
  // Approximate common audio/performance clock origin (performance.now is for RTs).
  const plannedStartPerf=performance.now()+35;
  this.trialStart=plannedStartPerf;
  const slots=[];
  for(let j=0;j<2;j++){
   const idx=i*2+j,pitch=this.sequence[idx],offset=CONFIG.toneOnsetsMs[j];
   const s={phase:this.currentMode,assessment_attempt:this.currentMode==='criterion'?this.currentAttemptNo:null,
    guided_attempt:this.currentMode==='guided'?this.currentAttemptNo:null,trial_in_block:i+1,tone_in_trial:j+1,
    tone_in_block:idx+1,frequency_hz:CONFIG.frequencies[pitch],pitch_name:{1:'low',2:'medium',3:'high'}[pitch],
    correct_key:String(pitch),response_key:null,correct:false,rt_ms:null,omission:true,
    planned_tone_onset_ms:offset,tone_duration_ms:CONFIG.toneDurationMs,
    participant_id:this.opts.participantId||null,block_started_at:this.blockStartAt,
    response_status:'no_response'};
   slots.push({data:s,onsetPerf:plannedStartPerf+offset});
   this.playHz(CONFIG.frequencies[pitch],plannedStartAudio+offset/1000);
  }
  this.currentSlots=slots;
  // Clear the feedback when the second tone begins; the next trial clears it again.
  this.queue(()=>{
   const feedback=this.element.querySelector('#pmt-feedback');
   if(feedback)feedback.textContent='';
  }, CONFIG.toneOnsetsMs[1]+35);
  this.queue(()=>{
   if(!this.live)return;
   slots.forEach(x=>{this.events.push({...x.data});this.blockEvents.push({...x.data})});
   this.startTrial(i+1);
  },CONFIG.trialDurationMs+35);
 }
 handleKey(e){
  if(e.repeat||!['1','2','3'].includes(e.key))return;
  if(this.phase==='familiarization'){
   if(this.familiarizationAwaitingKey!==null){e.preventDefault();this.handleFamiliarizationKey(e);}
   return;
  }
  if(!this.live)return;
  e.preventDefault();const now=performance.now();
  // Identify the most recent tone whose onset has occurred; late answers to a
  // previous tone cannot be attributed to the next tone.
  const k=this.currentSlots.findIndex((slot,j)=>now>=slot.onsetPerf && (j===this.currentSlots.length-1||now<this.currentSlots[j+1].onsetPerf));
  if(k<0){this.extraKeys.push({phase:this.currentMode,reason:'before_tone',key:e.key,trial_in_block:this.currentTrial+1});return;}
  const slot=this.currentSlots[k],d=slot.data;
  if(d.response_key!==null){this.extraKeys.push({phase:this.currentMode,reason:'duplicate_key',key:e.key,trial_in_block:this.currentTrial+1,tone_in_trial:k+1});return;}
  d.response_key=e.key;d.correct=e.key===d.correct_key;d.omission=false;d.response_status='responded';d.rt_ms=Math.round(now-slot.onsetPerf);
  // Feedback remains visually simple: no score, trial count, or progress indicator.
  // The guided phase can additionally remind learners which key was correct.
  const f=this.element.querySelector('#pmt-feedback');
  if(f)f.textContent=d.correct?'Correct':(this.currentMode==='guided'?'Incorrect — '+d.pitch_name.toUpperCase()+' = '+d.correct_key:'Incorrect');
 }
 finishBlock(){
  this.cancelTimers();this.live=false;this.currentSlots=[];
  const correct=this.blockEvents.filter(x=>x.correct).length,total=this.blockEvents.length;
  const attempt={mode:this.currentMode,attempt_number:this.currentAttemptNo,start_time:this.blockStartAt,end_time:new Date().toISOString(),correct,total,accuracy:total?correct/total:0,passed:this.currentMode==='criterion'&&correct>=CONFIG.criterionCorrect,interrupted:false};
  this.attempts.push(attempt);
  if(this.currentMode==='guided')this.drawGuidedResult(attempt);
  else if(attempt.passed){this.passed=true;this.drawPass(attempt);}else this.drawRetry(attempt);
 }
 drawGuidedResult(a){this.phase='guided-result';this.shell('Practice complete',`
  <p>Now identify 12 tones. Get 9 correct to continue.</p>
  <div class="pmt-actions"><button class="pmt-btn primary" id="pmt-assess">Begin test</button><button class="pmt-btn" id="pmt-repeat">Practice again</button></div>`);
  this.element.querySelector('#pmt-assess').onclick=()=>this.startBlock('criterion');
  this.element.querySelector('#pmt-repeat').onclick=()=>this.startBlock('guided');
 }
 drawRetry(a){this.phase='retry';this.shell('Try again',`
  <p>You'll need at least 9 correct out of 12 to continue.</p>
  <div class="pmt-actions"><button class="pmt-btn primary" id="pmt-again">Retry test</button><button class="pmt-btn" id="pmt-study">Review tones</button></div>`);
  this.element.querySelector('#pmt-again').onclick=()=>this.startBlock('criterion');
  this.element.querySelector('#pmt-study').onclick=()=>this.drawIntro();
 }
 drawPass(a){this.phase='passed';this.shell('Training complete',`
  <p>You can continue to the memory task.</p>
  ${typeof this.opts.onComplete==='function'?'<div class="pmt-actions"><button class="pmt-btn primary" id="pmt-next">Continue</button></div>':''}
  <details class="pmt-details"><summary>Download training data (prototype)</summary>
   <div class="pmt-actions"><button class="pmt-btn" id="pmt-csv">Response CSV</button><button class="pmt-btn" id="pmt-familiar-csv">Initial keypress CSV</button><button class="pmt-btn" id="pmt-json">Complete JSON</button></div>
  </details>`);
  this.element.querySelector('#pmt-csv').onclick=()=>this.downloadCsv();
  this.element.querySelector('#pmt-familiar-csv').onclick=()=>this.downloadFamiliarizationCsv();
  this.element.querySelector('#pmt-json').onclick=()=>this.downloadJson();
  if(this.element.querySelector('#pmt-next'))this.element.querySelector('#pmt-next').onclick=()=>this.opts.onComplete(this.getData());
 }
 visibility(){if(document.hidden&&this.live){
  this.cancelTimers();this.live=false;this.currentSlots=[];
  this.attempts.push({mode:this.currentMode,attempt_number:this.currentAttemptNo,start_time:this.blockStartAt,end_time:new Date().toISOString(),correct:null,total:null,accuracy:null,passed:false,interrupted:true});
  this.phase='interrupted';
  this.shell('Block interrupted',`<p>Please keep this tab visible during the tone test.</p><div class="pmt-actions"><button class="pmt-btn primary" id="pmt-retry">Restart block</button></div>`);
  this.element.querySelector('#pmt-retry').onclick=()=>this.startBlock(this.currentMode);
 }}
 withdraw(){this.cancelTimers();this.live=false;this.currentSlots=[];this.withdrawn=true;this.phase='withdrawn';
  this.shell('Participation ended',`<p>No further tasks will be shown. You may close this page.</p>`);
  if(typeof this.opts.onStop==='function')this.opts.onStop(this.getData());
 }
 getData(){return {phase:'tone_training',training_version:VERSION,criterion_passed:this.passed,withdrawn:this.withdrawn,
  started_at:this.startedAt,instructions_shown_at:this.instructionsShownAt,instructions_confirmed_at:this.instructionsConfirmedAt,finished_at:this.passed||this.withdrawn?new Date().toISOString():null,
  participant_id:this.opts.participantId||null,frequencies_hz:CONFIG.frequencies,
  word_duration_ms:CONFIG.trialDurationMs,tone_onsets_ms:CONFIG.toneOnsetsMs,tone_duration_ms:CONFIG.toneDurationMs,
  criterion_correct:CONFIG.criterionCorrect,criterion_total:CONFIG.tonesPerAssessment,
  assessment_attempts:this.attempts.filter(a=>a.mode==='criterion').length,
  final_assessment:this.attempts.filter(a=>a.mode==='criterion'&&!a.interrupted).at(-1)||null,
  familiarization_rounds:this.familiarizationRound,
  familiarization_keypresses:this.familiarizationEvents.slice(),
  all_attempts:this.attempts.slice(),tone_training_events:this.events.slice(),extra_keypresses:this.extraKeys.slice()};}
 downloadCsv(){const d=this.getData();const heads=['participant_id','phase','assessment_attempt','guided_attempt','trial_in_block','tone_in_trial','tone_in_block','frequency_hz','pitch_name','correct_key','response_key','correct','rt_ms','omission','response_status','planned_tone_onset_ms','tone_duration_ms','block_started_at'];
  downloadFile('tone_training_events.csv',heads.join(',')+'\n'+d.tone_training_events.map(x=>heads.map(k=>csvEscape(x[k])).join(',')).join('\n'),'text/csv;charset=utf-8');}
 downloadFamiliarizationCsv(){const heads=['participant_id','phase','round','step','frequency_hz','pitch_name','correct_key','response_key','correct','rt_ms','timestamp'];
  downloadFile('tone_familiarization_keypresses.csv',heads.join(',')+'\n'+this.familiarizationEvents.map(x=>heads.map(k=>csvEscape(x[k])).join(',')).join('\n'),'text/csv;charset=utf-8');}
 downloadJson(){downloadFile('tone_training_complete.json',JSON.stringify(this.getData(),null,2),'application/json');}
 destroy(){this.cancelTimers();this.live=false;document.removeEventListener('keydown',this.keyHandler);document.removeEventListener('visibilitychange',this.focusHandler);if(this.audio)this.audio.close().catch(()=>{});}
}
function mount(element,opts){return new TrainingSession(element,opts);}
// jsPsych 8 custom plugin. Saves all tone rows as a nested trial-level array,
// along with each attempt and summary. Production storage must save this object.
class ToneTrainingPlugin{
 static info={name:'paired-tone-training',version:VERSION,parameters:{}};
 constructor(jsPsych){this.jsPsych=jsPsych;this.controller=null;}
 trial(display_element,trial){
  const pid=root.PairedMemoryConsent?.state?.prolificPid||null;
  this.controller=mount(display_element,{
   participantId:pid,
   onComplete:(data)=>{this.controller.destroy();this.jsPsych.finishTrial(data);},
   onStop:(data)=>{this.controller.destroy();this.jsPsych.finishTrial(data);}
  });
 }
}
root.PairedMemoryToneTraining={VERSION,CONFIG,mount,balancedSequence,ToneTrainingPlugin};
})(window);
