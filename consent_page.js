/* University of Arizona consent-first prototype for the paired-associate experiment.
   Contains text supplied by the researcher. Confirm IRB approval before deployment.
   This file intentionally does not save/transmit identifiers to a server.
*/
(function(root) {
  'use strict';
  const VERSION = 'ua-remindings-consent-revised-2026-11-21-prototype-v1.4';
  const CSS = "\n/* Consent component (can be reused in the live jsPsych experiment). */\n.pmc-consent-host { position:fixed; inset:0; z-index:10; width:100vw; height:100vh; overflow-y:auto; box-sizing:border-box; font-family:system-ui,-apple-system,'Segoe UI',sans-serif; color:#1c3047; font-size:15px; line-height:1.56; background:#f1f5fa; padding:20px; min-height:100vh; }\n.pmc-consent-card { max-width:860px; margin:0 auto; background:white; border:1px solid #d9e1e9; border-radius:14px; padding:28px 34px; box-shadow:0 4px 28px #10243913; }\n.pmc-topline { display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; align-items:center; border-bottom:3px solid #264d70; padding-bottom:12px; }\n.pmc-campus {font-size:17px; font-weight:750; color:#153555;} .pmc-status {font-size:12px; color:#5b6a7e;}\n.pmc-consent-card h1 {font-size:25px; line-height:1.2; margin:20px 0 16px; letter-spacing:-.4px;}\n.pmc-consent-card h2 {font-size:18px; margin:12px 0;}\n.pmc-consent-card h3 {font-size:15px; font-weight:740; margin:22px 0 5px; color:#203d5b;}\n.pmc-consent-card p {margin:8px 0 12px;} .pmc-meta {background:#f5f8fc; padding:12px 16px; border-radius:8px; margin:14px 0 22px;}\n.pmc-meta p {margin:2px 0;}\n.pmc-pid {margin-bottom:20px; padding:18px; background:#f4f8fe; border:1px solid #cddded; border-radius:10px;}\n.pmc-pid label {font-weight:700;display:block;margin-bottom:6px;}\n#pmc-prolific-id {display:block;width:100%;max-width:460px;padding:12px;font-size:15px;border:1px solid #92a9c0;border-radius:7px;color:#102a44;}\n.pmc-small {font-size:12px;color:#586779;}\n.pmc-document {margin:0 0 20px; padding:20px 18px; border:1px solid #d9e1e9; border-radius:9px; }\n.pmc-document h2 {margin-top:0;} .pmc-document a {overflow-wrap:anywhere;}\n.pmc-paper-fields {margin-top:19px; padding:8px 12px; border-top:1px solid #d9e1e9; color:#41566e;font-size:13px;}\n.pmc-paper-fields p {margin:10px 0;}\n.pmc-agreement {border-top:2px solid #264d70; padding:20px 0 0;}\n.pmc-check {font-weight:600;display:flex;gap:12px;align-items:flex-start;cursor:pointer;}\n.pmc-check input {width:20px;height:20px;flex-shrink:0;margin-top:3px;accent-color:#176ba9;}\n.pmc-actions {display:flex;gap:11px;flex-wrap:wrap;justify-content:flex-end;}\n.pmc-actions button {padding:12px 16px;border-radius:7px;font-size:14px;font-weight:680;cursor:pointer;}\n.pmc-primary {border:1px solid #1767a2;background:#1767a2;color:white;}\n.pmc-light {border:1px solid #b0c2d3;background:white;color:#183d5d;}\n.pmc-declined {max-width:680px;margin:50px auto;padding:28px;background:white;border:1px solid #d9e1e9;border-radius:10px;}\n@media(max-width:640px) { .pmc-consent-card {padding:18px 16px;} .pmc-consent-host {padding:9px;} .pmc-document {padding:13px;} .pmc-actions {justify-content:stretch;}.pmc-actions button {flex:1 1 160px;} }\n@media print { body {background:white!important;} .pmc-consent-host {position:static; width:auto; height:auto; overflow:visible; padding:0;min-height:0;} .pmc-consent-card {box-shadow:none;border:0;max-width:none;padding:0;} .pmc-pid,.pmc-agreement,.pmc-status {display:none!important;} .pmc-document {border:0;padding:0;} .pmc-document p,.pmc-document h3 {break-inside:avoid;} }\n";
  const CONTENT = "<div class=\"pmc-consent-card\" id=\"pmc-consent-card\">\n<div class=\"pmc-topline\"><div class=\"pmc-campus\">University of Arizona</div><div class=\"pmc-status\">Participant information and consent</div></div>\n<h1>Consent to Participate in Research</h1>\n<div class=\"pmc-meta\">\n<p><strong>Study Title:</strong> That reminds me: The causes and consequences of remindings</p>\n<p><strong>Principal Investigator:</strong> Dr. Jonathan Tullis</p>\n<p><strong>Sponsor:</strong> National Science Foundation</p>\n</div>\n<form id=\"pmc-consent-form\" autocomplete=\"off\">\n<section class=\"pmc-pid\" id=\"pmc-prolific-id-section\">\n<h2>1. Prolific participant ID</h2>\n<label for=\"pmc-prolific-id\">Please enter or confirm your Prolific ID <span aria-hidden=\"true\">*</span></label>\n<input id=\"pmc-prolific-id\" name=\"prolific_id\" type=\"text\" inputmode=\"text\" pattern=\"[A-Za-z0-9_-]{6,128}\" maxlength=\"128\" minlength=\"6\" spellcheck=\"false\" autocapitalize=\"off\" autocomplete=\"off\" required aria-describedby=\"pmc-pid-help\" />\n<p id=\"pmc-pid-help\" class=\"pmc-small\">If you came from Prolific, this may be filled in automatically. Please confirm that it matches the ID shown in your Prolific account.</p>\n</section>\n<div class=\"pmc-document\" id=\"pmc-document\" role=\"region\" aria-label=\"Full consent form\">\n<h2>2. Research consent form</h2>\n<h3>Summary of the research</h3>\n<p><strong>This is a consent form for participation in a research project.</strong> Your participation in this research study is voluntary. It contains important information about this study and what to expect if you decide to participate. Please consider the information carefully. Feel free to ask questions before making your decision whether or not to participate.</p>\n<p>You are being asked to participate in an experiment about how studying related information affects memory. Each session lasts up to about 30 minutes. You will study stimuli (e.g., words or sentences) and take a memory test on the computer. There is no risks or direct benefit to you.</p>\n<h3>Why is this study being done?</h3>\n<p>When we encounter new problems or information, we often rely upon our prior knowledge to help us solve the new problem or understand the new information. New information may prompt us to bring to mind prior specific episodes. Prior research shows that studying new, related information improves memory for related information that we already know. In this project, we will examine why those memory benefits happen, what factors impact whether remindings happen, and whether remindings help us to create more generalized knowledge.</p>\n<h3>What will happen if I take part in this study?</h3>\n<p>If you agree to participate in this research, you will be seated in front of a computer. You will be presented with several straightforward tasks to complete. These tasks may include reading text (like words, sentences, or paragraphs), viewing pictures, studying worked examples of problems, learning trivial facts, and entering your responses. Tests may include memory, classification, or problem-solving tasks. You may also be asked to make judgments about how well you have learned and will remember the material.</p>\n<h3>How long will I be in the study?</h3>\n<p>Your experimental session will last up to 30 minutes.</p>\n<h3>How many people will take part in this study?</h3>\n<p>Up to 1000 people will participate in this study.</p>\n<h3>Can I stop being in the study?</h3>\n<p>You do not need to participate in this study. If you decide to take part in the study, you may leave the study at any time. No matter what decision you make, there will be no penalty to you and you will not lose any of your usual benefits. Your decision will not affect your future relationship with The University of Arizona. If you are a student or employee at the University of Arizona, your decision will not affect your grades or employment status. If you wish to stop at any time, let the experimenter know.</p>\n<h3>What risks or benefits can I expect from being in the study?</h3>\n<p>There are no anticipated risks from being in the study. You may learn more about how educational psychology research is conducted and the types of questions that are of interest to cognitive scientists.</p>\n<h3>Will I be paid for participating in the study or experience any costs?</h3>\n<p>You will earn $6 for the experimental session. There are no expected costs to your participation, except for the time you devote to participating.</p>\n<h3>Will my study-related information be kept confidential?</h3>\n<p>Your name will not be connected to your data. The information that you provide in the study will be handled confidentially. However, there may be circumstances where this information must be released or shared as required by law. The University of Arizona Institutional Review Board; other federal, state, or international regulatory agencies; or the sponsor of the study, if any, may review the research records for monitoring purposes.</p>\n<h3>Will my study-related information be used for future research?</h3>\n<p>Anonymized data that you contribute may be used for future research or shared with other researchers for future analyses without additional consent. Anonymized data will be uploaded to an online database that other researchers may access to verify the results of this study.</p>\n<h3>Who can answer my questions about the study?</h3>\n<p>For questions, concerns, or complaints about the study you may contact Dr. Tullis (<a href=\"mailto:tullis@arizona.edu\">tullis@arizona.edu</a>).</p>\n<p>For questions about your rights as a participant in this study, or to discuss other study-related concerns or complaints with someone who is not part of the research team, you may contact the Human Subjects Protection Program Director at 520-626-8630 or online at <a href=\"https://research.arizona.edu/compliance/human-subjects-protection-program\" target=\"_blank\" rel=\"noopener noreferrer\">https://research.arizona.edu/compliance/human-subjects-protection-program</a>.</p>\n<h3>Signing the consent form</h3>\n<p>I have read (or someone has read to me) this form, and I am aware that I am being asked to participate in a research study. I have had the opportunity to ask questions and have had them answered to my satisfaction. I voluntarily agree to participate in this study.</p>\n<p>I am not giving up any legal rights by signing this form. I will be given a copy of this form.</p>\n</div>\n<section class=\"pmc-agreement\">\n<label class=\"pmc-check\" for=\"pmc-agree\"><input type=\"checkbox\" id=\"pmc-agree\" name=\"consent_agreed\" value=\"yes\" required /> <span>I have read the consent information above, understand that participation is voluntary, and agree to participate in this research study.</span></label>\n<p class=\"pmc-small\">You can print or save a copy of the consent information before deciding.</p>\n<div class=\"pmc-actions\"><button type=\"button\" id=\"pmc-print\" class=\"pmc-light\">Print / save consent</button><button type=\"button\" id=\"pmc-decline\" class=\"pmc-light\">I do not agree</button><button type=\"submit\" id=\"pmc-accept\" class=\"pmc-primary\">I agree \u2014 continue</button></div>\n</section>\n</form>\n</div>";
  const state = {consented: false, prolificPid: null, consentAt: null, studyId: null, sessionId: null};
  const stylesId = 'pmc-consent-styles';
  function ensureStyles() {
    if (!document.getElementById(stylesId)) {
      const el = document.createElement('style');
      el.id = stylesId; el.textContent = CSS;
      document.head.appendChild(el);
    }
  }
  function readParams() {
    const params = new URLSearchParams(window.location.search);
    return {prolificPid: params.get('PROLIFIC_PID') || '', studyId: params.get('STUDY_ID') || '', sessionId: params.get('SESSION_ID') || ''};
  }
  function markup() { return '<div class="pmc-consent-host">' + CONTENT + '</div>'; }
  function mount(options={}) {
    ensureStyles();
    const form = document.getElementById('pmc-consent-form');
    if (!form) throw new Error('Consent form missing from page');
    const pid = document.getElementById('pmc-prolific-id');
    const params = readParams();
    if (params.prolificPid) pid.value=params.prolificPid;
    if (options.demoId && !pid.value) pid.value=options.demoId;
    const print=document.getElementById('pmc-print');
    const decline=document.getElementById('pmc-decline');
    if (print) print.addEventListener('click',()=>window.print());
    if (decline) decline.addEventListener('click', () => {
      state.consented = false; state.prolificPid = null; state.consentAt = null;
      if (typeof options.onDecline==='function') options.onDecline();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!form.reportValidity()) return;
      const clean = pid.value.trim();
      // Browser validity only confirms formatting; it does not verify the ID with Prolific.
      if(!/^[A-Za-z0-9_-]{6,128}$/.test(clean)) { pid.setCustomValidity('Enter your Prolific ID using letters and numbers.'); pid.reportValidity(); return; }
      pid.setCustomValidity('');
      if(!document.getElementById('pmc-agree').checked) { document.getElementById('pmc-agree').reportValidity(); return; }
      state.consented=true;state.prolificPid=clean;state.consentAt=new Date().toISOString();
      state.studyId=params.studyId;state.sessionId=params.sessionId;
      // Request fullscreen only after affirmative consent, during the participant's click.
      // Browsers may deny the request or let participants exit with Escape.
      if(document.documentElement.requestFullscreen && !document.fullscreenElement){
        try {const request=document.documentElement.requestFullscreen({navigationUI:'hide'});
          if(request && typeof request.catch==='function')request.catch(()=>{});
        } catch(err) { /* Fullscreen is best-effort, not a consent condition. */ }
      }
      if(typeof options.onConsent==='function') options.onConsent({
        consent:true,prolific_pid:clean,consent_version:VERSION,consent_timestamp:state.consentAt,
        prolific_study_id:params.studyId || null,prolific_session_id:params.sessionId || null,
        prolific_pid_source:params.prolificPid && params.prolificPid===clean ? 'url_prefill':'manual_or_edited'
      });
    });
    pid.addEventListener('input',()=>pid.setCustomValidity(''));
    return {state};
  }
  // Build this as the very first trial in the eventual jsPsych v8 timeline.
  // Requires jsPsychHtmlKeyboardResponse and an initialized jsPsych instance.
  function makeJsPsychTrial(jsPsych) {
    return {
      type: root.jsPsychHtmlKeyboardResponse,
      stimulus: markup,
      choices: 'NO_KEYS',
      data: {phase:'consent',consent_version:VERSION},
      on_load: () => mount({
        onConsent: record => jsPsych.finishTrial(record),
        onDecline: () => jsPsych.finishTrial({consent:false, consent_version:VERSION, phase:'consent'})
      })
    };
  }
  function declineMarkup() {
    return '<div class="pmc-consent-host"><div class="pmc-declined"><h2>You have chosen not to participate.</h2><p>No study tasks will be shown. You may close this page and return to Prolific to follow its instructions for withdrawing or returning the study.</p></div></div>';
  }
  root.PairedMemoryConsent = {VERSION,CSS,CONTENT,state,readParams,ensureStyles,markup,mount,makeJsPsychTrial,declineMarkup};
})(window);