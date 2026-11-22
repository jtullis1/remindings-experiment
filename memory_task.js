/* Memory task: explicit phase transitions, browser fullscreen requests, four timed study lists,
   single-word free recall or extra-list cued recall, and post-study questions.
   Browser-first prototype; never uploads data. 2026-11. */
(function(root){
'use strict';
const VERSION='memory-task-v2.9';
const CSS=`
.pmm-root,.pmm-root *{box-sizing:border-box}
.pmm-root{position:fixed;inset:0;z-index:10;width:100vw;height:100vh;min-height:100vh;overflow-y:auto;background:#f2f5fa;color:#1b324b;font:16px/1.55 system-ui,-apple-system,Segoe UI,Arial,sans-serif;padding:28px 12px}
.pmm-card{width:min(100%,690px);background:transparent;border:0;border-radius:0;padding:38px 42px;margin:20px auto;box-shadow:none}
.pmm-card h1{font-size:26px;line-height:1.2;margin:0 0 18px}.pmm-card p{margin:12px 0}.pmm-hint{font-size:14px;color:#586d82}
.pmm-btn{font:inherit;font-weight:650;color:#fff;background:#216ea7;border:0;border-radius:8px;padding:12px 22px;cursor:pointer;min-width:115px}
.pmm-btn:hover{background:#175784}.pmm-btn:disabled{opacity:.5;cursor:not-allowed}.pmm-btn-secondary{color:#284967;background:white;border:1px solid #b7cbdf}
.pmm-actions{display:flex;align-items:center;gap:12px;justify-content:flex-end;margin-top:28px;flex-wrap:wrap}
.pmm-keymap{display:flex;gap:9px;flex-wrap:wrap;margin:20px 0}
.pmm-keymap span{border:1px solid #d5e1ed;border-radius:8px;padding:10px 15px;font-weight:550}
.pmm-study{position:fixed;inset:0;width:100vw;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
.pmm-word{font:600 clamp(48px,7.5vw,86px)/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.025em;color:#fff;text-align:center}
.pmm-input,.pmm-textarea{width:100%;border:1px solid #aebfd1;border-radius:9px;font:18px system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#14283d;padding:12px 14px}
.pmm-textarea{font-size:16px;line-height:1.55;min-height:245px;resize:vertical}
.pmm-form label{display:block;margin-bottom:8px;font-weight:650}.pmm-cue{font-size:32px;font-weight:650;letter-spacing:.025em;text-align:center;margin:16px 0 12px}
.pmm-letter{font-size:25px;color:#52697d;text-align:center;margin-bottom:28px}
.pmm-form input:focus,.pmm-form textarea:focus{outline:2px solid #226da5;outline-offset:2px}

/* Minimal, self-paced cued recall display. */
.pmm-cued-root{display:flex;align-items:center;justify-content:center}
.pmm-cued-panel{width:min(100%,780px);margin:auto;padding:36px 18px;text-align:center}
.pmm-cued-prompt{font:600 clamp(30px,5vw,52px)/1.4 system-ui,-apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.018em;margin:0 0 32px;overflow-wrap:anywhere}
.pmm-cued-input{display:block;width:min(100%,460px);margin:0 auto;border:1px solid #9dabb9;border-radius:7px;padding:13px 16px;font:24px system-ui,-apple-system,Segoe UI,Arial,sans-serif;text-align:center;color:#17283d;background:#fff}
.pmm-cued-input:focus{outline:2px solid #216ea7;outline-offset:2px}
.pmm-cued-actions{display:flex;justify-content:center;margin:20px auto 0}
.pmm-cued-error{min-height:25px;margin:12px auto 0;color:#a02930;font-size:15px;font-weight:600}

/* Single-word free recall. Submitted words disappear rather than accumulating on screen. */
.pmm-free-panel{max-width:580px;margin:auto;padding:10px 0 14px;text-align:center}
.pmm-free-panel label{font-size:18px;margin-bottom:16px}
.pmm-free-input{display:block;width:min(100%,440px);margin:0 auto 18px;border:1px solid #93aac0;border-radius:8px;padding:14px 18px;font:26px system-ui,-apple-system,Segoe UI,Arial,sans-serif;text-align:center;background:white;color:#132a43}
.pmm-free-input:focus{outline:2px solid #216ea7;outline-offset:2px}
.pmm-free-actions{display:flex;flex-direction:column;gap:13px;align-items:center;margin:16px auto 0}
.pmm-free-status{min-height:22px;color:#537085;font-size:14px;margin:9px 0}.pmm-free-status:empty{display:none}
.pmm-free-error{color:#a02930}
.pmm-q-label{font-size:15px;font-weight:650;display:block;margin:23px 0 8px}
.pmm-select{font:inherit;width:100%;border:1px solid #aabed0;border-radius:8px;padding:10px;background:white}
@media(max-width:580px){.pmm-card{padding:26px 20px;margin:4px auto}.pmm-root{padding:10px 8px}}
`;
function ensureStyles(){if(!document.getElementById('pmm-style')){const s=document.createElement('style');s.id='pmm-style';s.textContent=CSS;document.head.appendChild(s)}}
function safe(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function normalized(s){return String(s??'').trim().toUpperCase().replace(/^[^A-Z]+|[^A-Z]+$/g,'').replace(/\s+/g,' ');}
function parseFree(s){return [...new Set(String(s??'').split(/[\n,;]+/).map(normalized).filter(Boolean))];}
function csv(v){return '"'+String(v===undefined||v===null?'':v).replaceAll('"','""')+'"';}
function download(name,data,mime){const blob=new Blob([data],{type:mime});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);}
function seedHash(input){let x=2166136261>>>0;for(const ch of String(input)){x^=ch.charCodeAt(0);x=Math.imul(x,16777619)>>>0;}return x>>>0;}
function assignmentForId(pid,params){
 const seed=params.get('seed')||'subject-'+pid;
 // Online participants receive a balanced condition number from DataPipe after consenting.
 // Local/offline previews retain deterministic assignment and optional overrides for testing.
 const onlineAssignment=root.PairedMemoryAssignment;
 const isLive=root.location.protocol==='https:'&&!['localhost','127.0.0.1'].includes(root.location.hostname);
 if(isLive && (!onlineAssignment || !Number.isInteger(onlineAssignment.conditionNumber) ||
                onlineAssignment.conditionNumber<0 || onlineAssignment.conditionNumber>3)){
  throw new Error('Missing DataPipe condition assignment; do not start the memory task.');
 }
 const idx=isLive?onlineAssignment.conditionNumber:(seedHash(pid+'|between-participants')%4);
 const test=params.get('test'),attention=params.get('attention');
 // Test overrides are available in offline previews only, never in a live Prolific session.
 const testType=(!isLive&&['free','cued'].includes(test))?test:(idx%2?'cued':'free');
 const att=(!isLive&&['full','divided'].includes(attention))?attention:(Math.floor(idx/2)?'divided':'full');
 const cb=params.get('cb');
 const counterbalanceVersion=(!isLive&&(cb==='0'||cb==='1'))?Number(cb):(seedHash(pid+'|counterbalance')%2);
 return {seed,testType,attention:att,counterbalanceVersion,
  conditionNumber:isLive?idx:null,assignmentSource:isLive?'datapipe_sequence':'offline_test_hash'};
}
class MemorySession{
 constructor(element,opts={}){
  this.element=element;this.opts=opts;this.plan=opts.plan;
  if(!this.plan||!root.PairedMemoryGenerator.validate(this.plan).ok)throw new Error('A validated study plan is required.');
  this.audio=null;this.step=0;this.listIndex=0;this.studyIndex=0;this.cuedIndex=0;this.current=null;
  this.currentSlots=[];this.timer=null;this.ended=false;this.phase='instructions';
  this.studyTrialRows=[];this.toneRows=[];this.memoryRows=[];this.freeTargetRows=[];this.freeWordRows=[];this.listSummaries=[];
  this.instructionEvents=[];this.visibilityEvents=[];this.fullscreenEvents=[];this.extraToneKeys=[];this.checkpointErrors=[];this.postQuestions=null;
  this.startedAt=new Date().toISOString();this.studySessionStart=null;
  this.studyKey=e=>this.handleStudyKey(e);this.visibilityHandler=()=>{
   if(document.hidden&&this.phase==='study')this.visibilityEvents.push({phase:'study',list:this.listIndex+1,position:this.studyIndex+1,timestamp:new Date().toISOString()});
  };
  document.addEventListener('keydown',this.studyKey);document.addEventListener('visibilitychange',this.visibilityHandler);
  this.showInstruction();
 }
 checkpoint(eventType,payload){
  // Checkpoints are best-effort: a streaming exception must NEVER block a
  // participant's recall response, the next word, or the final questionnaire.
  // The complete nested task data is still handed to jsPsych at completion.
  if(typeof this.opts.onProgress!=='function')return;
  try{
   this.opts.onProgress({phase:'memory_checkpoint',event_type:eventType,
     participant_id:this.opts.participantId||null,
     assignment:this.plan.assignment,recorded_at:new Date().toISOString(),...payload});
  }catch(error){
   this.checkpointErrors.push({event_type:eventType,recorded_at:new Date().toISOString(),error:String(error)});
   console.error('Nonfatal memory checkpoint error:',eventType,error);
  }
 }
 render(title,html){ensureStyles();this.element.innerHTML=`<div class="pmm-root"><main class="pmm-card"><h1>${title}</h1>${html}</main></div>`;}
 showInstruction(){
  this.phase='instructions';const pages=[
   {title:'Next: Study the words',content:'<p>You have finished tone training.</p><p>Next, you will see a list of words, one at a time. <strong>Try to remember the words</strong> for an upcoming memory test.</p>'},
   {title:'Remember the tones',content:'<p>During some words, you may also hear tones. Identify each sound while continuing to study the word.</p><div class="pmm-keymap"><span>1 = Low</span><span>2 = Medium</span><span>3 = High</span></div>'},
   {title:'Get ready to study',content:'<p><strong>Both tasks are equally important:</strong> remember the words and identify the tones accurately whenever they occur.</p><p>After this word list, you will take a memory test. The words will appear automatically.</p>'}
  ];const page=pages[this.step];
  this.instructionEvents.push({screen:this.step+1,shown_at:new Date().toISOString()});
  this.render(page.title,page.content+`<div class="pmm-actions"><button class="pmm-btn" id="pmm-continue">${this.step===2?'Begin word list':'Continue'}</button></div>`);
  this.element.querySelector('#pmm-continue').onclick=()=>{
   this.instructionEvents.at(-1).continued_at=new Date().toISOString();
   this.step++;if(this.step<3)this.showInstruction();else this.startList();
  };
 }
 /** Fullscreen browsers require a participant gesture; request on each Begin word list click.
  * A denied request cannot legally be forced, so the task continues and the event is logged. */
 tryFullscreen(){
  const entry={list:this.listIndex+1,time:new Date().toISOString(),result:'not_supported'};
  this.fullscreenEvents.push(entry);
  if(document.fullscreenElement){entry.result='already_fullscreen';return Promise.resolve(true);}
  if(typeof document.documentElement.requestFullscreen!=='function')return Promise.resolve(false);
  try{
   entry.result='requested';
   return Promise.resolve(document.documentElement.requestFullscreen({navigationUI:'hide'})).then(()=>{
    entry.result='entered';return true;
   }).catch(err=>{entry.result='denied';entry.reason=String(err?.name||err);return false;});
  }catch(err){entry.result='denied';entry.reason=String(err?.name||err);return Promise.resolve(false);}
 }
 async prepareAudio(){
  if(this.plan.assignment.attention!=='divided')return true;
  const AC=root.AudioContext||root.webkitAudioContext;
  if(!AC){this.render('Audio unavailable','<p>This browser does not support the required sounds. Please use a desktop browser.</p>');return false;}
  if(!this.audio)this.audio=new AC();
  try{if(this.audio.state!=='running')await this.audio.resume();return this.audio.state==='running';}
  catch(e){this.render('Audio unavailable','<p>Unable to play the tones. Please check your audio and reload the page.</p>');return false;}
 }
 async startList(){
  if(this.ended)return;
  // Both requests are initiated while the Begin word list click still carries user activation.
  const fullscreenRequest=this.tryFullscreen();
  const audioRequest=this.prepareAudio();
  const [fullscreenEntered,audioReady]=await Promise.all([fullscreenRequest,audioRequest]);
  if(!audioReady)return;
  this.phase='study';this.studyIndex=0;this.studySessionStart=performance.now();
  this.showStudyTrial();
 }
 showStudyTrial(){
  const list=this.plan.lists[this.listIndex],t=list.trials[this.studyIndex];
  if(!t){this.finishStudy();return;}
  this.phase='study';this.current=t;
  this.element.innerHTML=`<div class="pmm-study"><div class="pmm-word">${safe(t.word)}</div></div>`;
  const startedPerf=performance.now();
  const toneSlots=t.tone_events.map(ev=>({
   meta:ev,onset:startedPerf+ev.onset_ms, response_key:null,rt_ms:null,correct:false,omission:true,
   actual_onset_from_word_ms:ev.onset_ms
  }));
  this.currentSlots=toneSlots;this.currentStart=startedPerf;
  if(t.tone_enabled && this.audio){
   const ctx=this.audio;
   for(const slot of toneSlots){
    const ev=slot.meta,when=ctx.currentTime+ev.onset_ms/1000;
    const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=ev.frequency_hz;
    gain.gain.setValueAtTime(0.00001,when);
    gain.gain.linearRampToValueAtTime(0.095,when+.012);
    gain.gain.setValueAtTime(0.095,when+(ev.offset_ms-ev.onset_ms)/1000-.018);
    gain.gain.linearRampToValueAtTime(.00001,when+(ev.offset_ms-ev.onset_ms)/1000);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(when);osc.stop(when+(ev.offset_ms-ev.onset_ms)/1000+.01);
   }
  }
  const wordDuration=this.opts.testWordDurationMs??t.word_duration_ms;
  this.timer=setTimeout(()=>this.finishStudyTrial(),wordDuration);
 }
 handleStudyKey(e){
  if(this.phase!=='study'||e.repeat||!['1','2','3'].includes(e.key))return;
  e.preventDefault();const now=performance.now();
  const slots=this.currentSlots;
  const ix=slots.findIndex((s,i)=>now>=s.onset && (i===slots.length-1||now<slots[i+1].onset));
  if(ix<0){this.extraToneKeys.push({list:this.listIndex+1,study_position:this.studyIndex+1,key:e.key,reason:'no_tone_window',rt_from_word_ms:Math.round(now-this.currentStart)});return;}
  const slot=slots[ix];
  if(slot.response_key!==null){this.extraToneKeys.push({list:this.listIndex+1,study_position:this.studyIndex+1,key:e.key,reason:'duplicate_response',tone_number:ix+1});return;}
  slot.response_key=e.key;slot.correct=e.key===String(slot.meta.key);slot.omission=false;slot.rt_ms=Math.round(now-slot.onset);
 }
 finishStudyTrial(){
  if(this.phase!=='study')return;
  const t=this.current;
  const elapsedMs=performance.now()-this.currentStart;
  const wordDuration=this.opts.testWordDurationMs??t.word_duration_ms;
  const flattened=this.currentSlots.map(s=>({
   list:t.list,study_position:t.position,pair_id:t.pair_id,p1:t.p1,p2:t.p2,relatedness:t.relatedness,
   tone_number:s.meta.tone_number,pitch:s.meta.pitch,frequency_hz:s.meta.frequency_hz,
   correct_key:s.meta.key,response_key:s.response_key,correct:s.correct,omission:s.omission,
   rt_ms:s.rt_ms,scheduled_onset_ms:s.meta.onset_ms,deadline_ms:s.meta.response_deadline_ms
  }));
  this.toneRows.push(...flattened);
  this.studyTrialRows.push({list:t.list,study_position:t.position,word:t.word,role:t.role,relatedness:t.relatedness,
   pair_id:t.pair_id,mini_block:t.mini_block,position_in_mini_block:t.position_in_mini_block,
   linked_position:t.linked_position,tone_enabled:t.tone_enabled,
   target_duration_ms:wordDuration,observed_duration_ms:Math.round(elapsedMs),
   timing_deviation_ms:Math.round(elapsedMs-wordDuration),
   observed_hidden_during_list:this.visibilityEvents.some(v=>v.list===t.list),
   tone_1_correct:flattened[0]?.correct??null,tone_2_correct:flattened[1]?.correct??null});
  const finishedWord=this.studyTrialRows.at(-1);
  this.studyIndex++;
  // Immediately replace the previous word before checkpoint overhead: zero intended ISI.
  if(this.studyIndex<this.plan.lists[this.listIndex].trials.length)this.showStudyTrial();
  else this.finishStudy();
  this.checkpoint('study_word',{list:t.list,study_position:t.position,study_trial:finishedWord,tone_responses:flattened});
 }
 finishStudy(){this.phase='test-instructions';this.current=null;
  const cued=this.plan.assignment.test_type==='cued';
  this.render('You finished studying this list',cued?
   `<p>Next, you will take a memory test.</p><p>You will see a <strong>cue word</strong> related to one specific word you studied, along with the <strong>first letter</strong> of that studied word.</p><p>Type the <strong>full studied word</strong>. Enter at least <strong>3 letters</strong> before continuing to the next cue.</p><p class="pmm-hint">Take as much time as you need.</p><div class="pmm-actions"><button class="pmm-btn" id="pmm-test-start">Begin memory test</button></div>`:
   `<p>Next, you will take a memory test.</p><p>Recall <strong>all the words you can remember</strong> from the list. Type <strong>one word at a time</strong> and press Enter to record it.</p><p>Each word will disappear after you submit it. Keep going until you cannot remember any more, then select <strong>Finish recall</strong>.</p><p class="pmm-hint">There is no time limit.</p><div class="pmm-actions"><button class="pmm-btn" id="pmm-test-start">Begin memory test</button></div>`);
  this.element.querySelector('#pmm-test-start').onclick=()=>{
   this.cuedIndex=0;
   if(cued)this.showCued();else this.showFree();
  };
 }
 showCued(){
  const list=this.plan.lists[this.listIndex];
  if(this.cuedIndex>=list.memory_test.trials.length){this.completeTest();return;}
  this.phase='cued-test';
  const cue=list.memory_test.trials[this.cuedIndex];
  ensureStyles();
  this.element.innerHTML=`<div class="pmm-root pmm-cued-root"><main class="pmm-cued-panel">
    <div class="pmm-cued-prompt">${safe(cue.extra_list_cue)} &ndash; ${safe(cue.first_letter)}___</div>
    <form id="pmm-cued-form" class="pmm-form">
      <input id="pmm-answer" class="pmm-cued-input" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Type the full studied word" aria-describedby="pmm-cued-error" />
      <div class="pmm-cued-actions"><button class="pmm-btn" type="submit">${this.cuedIndex===15?'Finish this test':'Next'}</button></div>
      <p id="pmm-cued-error" class="pmm-cued-error" role="alert" aria-live="polite"></p>
    </form></main></div>`;
  this.testStart=performance.now();
  const form=this.element.querySelector('#pmm-cued-form'),input=this.element.querySelector('#pmm-answer');input.focus();
  form.onsubmit=e=>{e.preventDefault();const raw=input.value.trim();const normal=normalized(raw);
   const typedLetters=(raw.match(/[A-Za-z]/g)||[]).length;
   if(typedLetters<3){
     this.element.querySelector('#pmm-cued-error').textContent='Please type at least 3 letters before continuing.';
     input.focus();return;
   }
   this.memoryRows.push({test_type:'cued',list:list.list,pair_id:cue.pair_id,relatedness:cue.relatedness,
    extra_list_cue:cue.extra_list_cue,first_letter:cue.first_letter,target_p1:cue.target_p1,
    response:raw,normalized_response:normal,typed_letter_count:typedLetters,correct:normal===normalized(cue.target_p1),
    omission:normal==='',response_time_ms:Math.round(performance.now()-this.testStart),
    test_position:cue.test_position,p1_position:cue.p1_position});
   this.checkpoint('cued_recall',{list:list.list,response:this.memoryRows.at(-1)});
   this.cuedIndex++;this.showCued();
  };
 }
 showFree(){
  const list=this.plan.lists[this.listIndex];this.phase='free-test';
  this.freeCurrentEntries=[];
  this.testStart=performance.now();this.lastFreeSubmissionAt=this.testStart;
  this.render('Recall the words',`<div class="pmm-free-panel">
    <p>Type one studied word at a time. Press <strong>Enter</strong> to record each word.</p>
    <form id="pmm-free-form" class="pmm-form">
      <label for="pmm-free-answer">Word you remember</label>
      <input id="pmm-free-answer" class="pmm-free-input" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" aria-describedby="pmm-free-status" />
      <div class="pmm-free-actions"><button type="submit" class="pmm-btn">Enter word</button></div>
      <p id="pmm-free-status" class="pmm-free-status" role="status" aria-live="polite"></p>
    </form>
    <button id="pmm-free-finish" class="pmm-btn pmm-btn-secondary" type="button">Finish recall</button>
   </div>`);
  const form=this.element.querySelector('#pmm-free-form');
  const input=this.element.querySelector('#pmm-free-answer');
  const status=this.element.querySelector('#pmm-free-status');
  input.focus();
  form.onsubmit=e=>{
   e.preventDefault();
   const raw=input.value.trim();
   if(!/^[A-Za-z]+$/.test(raw)){
    status.textContent='Please enter one word using letters only.';
    status.classList.add('pmm-free-error');input.focus();return;
   }
   const now=performance.now();const normalizedWord=normalized(raw);
   const wasRepeat=this.freeCurrentEntries.some(r=>r.normalized_response===normalizedWord);
   const studiedTrial=list.trials.find(t=>normalized(t.word)===normalizedWord);
   const row={test_type:'free_word',list:list.list,recall_position:this.freeCurrentEntries.length+1,
    raw_response:raw,normalized_response:normalizedWord,was_repeat:wasRepeat,
    is_studied_word:!!studiedTrial,study_role:studiedTrial?.role||null,
    rt_from_recall_start_ms:Math.round(now-this.testStart),
    rt_since_previous_submission_ms:Math.round(now-this.lastFreeSubmissionAt)};
   this.freeCurrentEntries.push(row);this.freeWordRows.push(row);
   this.lastFreeSubmissionAt=now;
   // Finish participant-facing submission first. A network/save issue must not
   // keep a word in the textbox or prevent additional free-recall responses.
   input.value=''; // Do not show submitted words or a cumulative recall list.
   status.classList.remove('pmm-free-error');status.textContent='';
   input.focus();
   this.checkpoint('free_recall_word',{list:list.list,response:row});
  };
  this.element.querySelector('#pmm-free-finish').onclick=()=>{
   if(input.value.trim()){
    status.textContent='Press Enter to record your current word, or erase it before finishing.';
    status.classList.add('pmm-free-error');input.focus();return;
   }
   const words=[...new Set(this.freeCurrentEntries.map(x=>x.normalized_response))];
   const wordset=new Set(words);const p1s=list.pairs.map(p=>normalized(p.p1));
   for(const p of list.pairs)this.freeTargetRows.push({list:list.list,pair_id:p.id,relatedness:p.relatedness,
    target_p1:p.p1,p1_position:p.p1_position,recalled:wordset.has(normalized(p.p1))});
   this.memoryRows.push({test_type:'free',list:list.list,raw_response:this.freeCurrentEntries.map(x=>x.raw_response).join('\n'),
    recalled_words:words,recalled_count:words.length,total_submissions:this.freeCurrentEntries.length,
    p1_recalled:p1s.filter(w=>wordset.has(w)).length,p1_total:16,
    response_time_ms:Math.round(performance.now()-this.testStart)});
   this.checkpoint('free_recall_summary',{list:list.list,summary:this.memoryRows.at(-1),
     p1_scoring:this.freeTargetRows.filter(x=>x.list===list.list)});
   this.completeTest();
  };
 }
 completeTest(){
  const list=this.plan.lists[this.listIndex];
  const rows=this.plan.assignment.test_type==='cued'?this.memoryRows.filter(x=>x.list===list.list):this.freeTargetRows.filter(x=>x.list===list.list);
  this.listSummaries.push({list:list.list,test_type:this.plan.assignment.test_type,p1_correct_or_recalled:rows.filter(x=>x.correct===true||x.recalled===true).length,p1_total:16,
   ended_at:new Date().toISOString()});
  this.checkpoint('list_complete',{list:list.list,summary:this.listSummaries.at(-1)});
  this.listIndex++;
  if(this.listIndex>=this.plan.lists.length){this.showPostTransition();return;}
  this.phase='between-lists';
  this.render('You finished this memory test',`<p>Next, you will study <strong>another list of words</strong>, followed by another memory test.</p>
   <p>Remember: try to learn the words. If you hear tones, continue identifying them using <strong>1 = Low, 2 = Medium, 3 = High</strong>. Both tasks are equally important.</p>
   <p>The words will appear one at a time. When you are ready, begin the next list.</p>
   <div class="pmm-actions"><button id="pmm-next-list" class="pmm-btn">Begin next word list</button></div>`);
  this.element.querySelector('#pmm-next-list').onclick=()=>this.startList();
 }
 showPostTransition(){this.phase='final-transition';
  this.render('All memory tests complete',`<p>You have finished studying the word lists and taking the memory tests.</p>
   <p>Next, we have a few short questions about what you noticed and how you remembered the words.</p>
   <div class="pmm-actions"><button id="pmm-final-continue" class="pmm-btn">Continue to questions</button></div>`);
  this.element.querySelector('#pmm-final-continue').onclick=()=>this.showPostQuestions();
 }
 showPostQuestions(){
  // Exactly one final question per screen; retain the original four data fields.
  this.phase='questionnaire';this.postQuestionIndex=0;
  this.postQuestions={noticed_pattern:'',reminding_frequency:'',reminding_intentionality:'',strategies:''};
  this.showPostQuestionPage();
 }
 showPostQuestionPage(){
  const questions=[
   {field:'noticed_pattern',id:'pmm-pattern',prompt:'Did you notice a pattern in how the words were presented?',kind:'text',placeholder:'What did you notice, if anything?'},
   {field:'reminding_frequency',id:'pmm-remind',prompt:'How often did a word remind you of an earlier word?',kind:'select',options:['Never','Rarely','Sometimes','Often','Very often']},
   {field:'reminding_intentionality',id:'pmm-intention',prompt:'When earlier words came to mind, was this spontaneous or deliberate?',kind:'select',options:['Earlier words did not come to mind','Mostly spontaneous','Both spontaneous and deliberate','Mostly deliberate']},
   {field:'strategies',id:'pmm-strategies',prompt:'Did you use any strategies to remember the words?',kind:'text'}
  ];
  const index=this.postQuestionIndex,question=questions[index];
  if(!question){this.finish();return;}
  const value=this.postQuestions[question.field]||'';
  const control=question.kind==='text'
   ? `<textarea class="pmm-textarea pmm-post-textarea" id="${question.id}" ${question.placeholder?`placeholder="${safe(question.placeholder)}"`:''}>${safe(value)}</textarea>`
   : `<select class="pmm-select" id="${question.id}" required><option value="">Choose one</option>${question.options.map(option=>`<option value="${safe(option)}"${option===value?' selected':''}>${safe(option)}</option>`).join('')}</select>`;
  this.render('A few final questions',`<form id="pmm-post">
   <p class="pmm-hint">Question ${index+1} of ${questions.length}</p>
   <label class="pmm-q-label" for="${question.id}">${safe(question.prompt)}</label>
   ${control}
   <div class="pmm-actions"><button type="submit" class="pmm-btn">${index===questions.length-1?'Finish experiment':'Next'}</button></div>
   </form>`);
  this.element.querySelector('#pmm-post').onsubmit=e=>{
   e.preventDefault();
   const input=this.element.querySelector('#'+question.id);
   if(!input.reportValidity())return;
   this.postQuestions[question.field]=input.value;
   this.checkpoint('post_question',{question_index:index+1,field:question.field,response:input.value});
   this.postQuestionIndex++;
   this.showPostQuestionPage();
  };
 }
 finish(){this.ended=true;this.phase='completed';this.finishedAt=new Date().toISOString();
  const data=this.getData();this.destroy();
  this.render('Experiment complete',`<p>Thank you for taking part.</p>
   ${typeof this.opts.onComplete==='function'?'':`<p class="pmm-hint">This is a local prototype. Download your data before closing this window.</p>
    <div class="pmm-actions"><button class="pmm-btn" id="pmm-data-download">Download experiment data</button></div>`}`);
  if(typeof this.opts.onComplete==='function')this.opts.onComplete(data);
  else this.element.querySelector('#pmm-data-download').onclick=()=>download('memory_experiment_data.json',JSON.stringify(data,null,2),'application/json');
 }
 getData(){return {phase:'word_study_and_recall',task_version:VERSION,participant_id:this.opts.participantId||null,
  assignment:this.plan.assignment,study_timing:this.plan.timing,
  pair_assignments:this.plan.lists.flatMap(list=>list.pairs),started_at:this.startedAt,ended_at:this.finishedAt||null,
  instructions:this.instructionEvents,study_trials:this.studyTrialRows,tone_responses:this.toneRows,
  memory_responses:this.memoryRows,free_recall_word_responses:this.freeWordRows,free_recall_p1_scoring:this.freeTargetRows,list_summaries:this.listSummaries,
  visibility_events:this.visibilityEvents,fullscreen_events:this.fullscreenEvents,extra_keypresses:this.extraToneKeys,checkpoint_errors:this.checkpointErrors,post_questions:this.postQuestions};}
 destroy(){clearTimeout(this.timer);document.removeEventListener('keydown',this.studyKey);document.removeEventListener('visibilitychange',this.visibilityHandler);
  if(this.audio&&this.audio.state!=='closed')this.audio.close().catch(()=>{});}
}
function mount(el,opts){return new MemorySession(el,opts);}
class MemoryTaskPlugin{
 static info={name:'paired-memory-task',version:VERSION,parameters:{}};
 constructor(jsPsych){this.jsPsych=jsPsych;this.controller=null;}
 trial(display_element,trial){
  const pid=root.PairedMemoryConsent.state.prolificPid;
  const params=new URLSearchParams(root.location.search);
  const spec=assignmentForId(pid,params);
  const plan=root.PairedMemoryGenerator.generate({stimuli:root.PAIRED_MEMORY_STIMULI,...spec});
  this.controller=mount(display_element,{plan,participantId:pid,
   // These event checkpoints cause @jspsych/extension-pipe to stage the data as the
   // long-running custom trial progresses, not just after all four lists finish.
   onProgress:record=>this.jsPsych.data.write(record),
   onComplete:data=>this.jsPsych.finishTrial(data)});
 }
}
root.PairedMemoryTask={VERSION,MemorySession,mount,assignmentForId,parseFree,normalized,MemoryTaskPlugin};
})(window);
