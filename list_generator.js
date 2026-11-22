/*
  Paired-associate study-list generator, v1.2.
  Plain JavaScript: use in a browser before building a jsPsych timeline.
  Usage:
    const plan = PairedMemoryGenerator.generate({
      stimuli: window.PAIRED_MEMORY_STIMULI,
      seed: 'pilot-001', testType: 'cued', attention: 'divided',
      counterbalanceVersion: 0
    });
    const report = PairedMemoryGenerator.validate(plan);
  This code prepares lists and test specifications. It DOES NOT play tones,
  present jsPsych trials, save data to a server, or allocate paid participants.
*/
(function (root) {
  'use strict';

  const CONFIG = Object.freeze({
    studyTestCycles: 4,
    miniBlocksPerCycle: 4,
    pairsPerMiniBlock: 4,
    relatedPerMiniBlock: 2,
    primacyBuffers: 2,
    recencyBuffers: 2,
    wordDurationMs: 3000,
    isiMs: 0,
    toneOnsetMs: 200,
    toneIntervalMs: 1500,
    tonesPerP2: 2,
    toneDurationMs: 450,
    toneFrequenciesHz: Object.freeze({ low: 400, medium: 650, high: 1000 }),
    toneKeys: Object.freeze({ low: '1', medium: '2', high: '3' })
  });

  function assert(ok, message) { if (!ok) throw new Error(message); }
  function hash32(value) {
    let h = 2166136261 >>> 0;
    for (const char of String(value)) {
      h ^= char.codePointAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function seededRandom(seed) {
    let a = hash32(seed);
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, random) {
    const array = items.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  function distinctWordsCheck(stimuli) {
    assert(stimuli && Array.isArray(stimuli.master) && stimuli.master.length === 64,
      'Exactly 64 master triplets are required.');
    assert(Array.isArray(stimuli.unrelated) && stimuli.unrelated.length === 32,
      'Exactly 32 unrelated P2 words are required.');
    assert(Array.isArray(stimuli.buffers) && stimuli.buffers.length === 16,
      'Exactly 16 buffer words are required.');
    const pool = [];
    for (const p of stimuli.master) {
      assert(p.id && p.p1 && p.p2_related && p.extra_list_cue,
        'Master triplet is missing a required entry.');
      pool.push(p.p1, p.p2_related, p.extra_list_cue);
    }
    for (const x of stimuli.unrelated) { assert(x.word, 'Unrelated word missing'); pool.push(x.word); }
    for (const x of stimuli.buffers) { assert(x.word, 'Buffer word missing'); pool.push(x.word); }
    const upper = pool.map(s => String(s).trim().toUpperCase());
    assert(new Set(upper).size === upper.length, 'Duplicate word found across stimulus pools.');
    assert(new Set(stimuli.master.map(p => p.id)).size === 64, 'Repeated master pair ID.');
  }

  function generate(options) {
    assert(options && options.stimuli, 'Pass { stimuli: PAIRED_MEMORY_STIMULI, ... }.');
    const stimuli = options.stimuli;
    distinctWordsCheck(stimuli);
    const seed = String(options.seed ?? 'pilot-001');
    const testType = options.testType ?? 'cued';
    const attention = options.attention ?? 'divided';
    const cb = Number(options.counterbalanceVersion ?? 0);
    assert(testType === 'cued' || testType === 'free', 'testType must be free or cued.');
    assert(attention === 'full' || attention === 'divided', 'attention must be full or divided.');
    assert(cb === 0 || cb === 1, 'counterbalanceVersion must be 0 or 1.');

    // Separate RNG streams: complementing relatedness never changes item order.
    const master = shuffle(stimuli.master, seededRandom(seed + '|targets'));
    const unrelated = shuffle(stimuli.unrelated, seededRandom(seed + '|unrelated'));
    const buffers = shuffle(stimuli.buffers, seededRandom(seed + '|buffers'));
    const relatednessRandom = seededRandom(seed + '|relatedness-positions');
    const testRandom = seededRandom(seed + '|cued-test-order');
    let unrelatedIndex = 0;
    const lists = [];

    for (let li = 0; li < CONFIG.studyTestCycles; li++) {
      const listIndex = li + 1;
      const trials = [];
      const pairs = [];
      // Two independent 450-ms identification tones per P2 word, spaced 1500 ms.
      // Across 16 P2 words, create 32 nearly balanced low/medium/high tones.
      const pitchNames = ['low', 'medium', 'high'];
      const toneLabels = Array.from({ length: 32 }, (_, i) => pitchNames[(i + li) % 3]);
      const tones = shuffle(toneLabels, seededRandom(seed + '|tones|' + li));
      let toneIndex = 0;

      function addTrial({ word, role, bufferId = '', pair = null, miniBlock = null,
        positionInMiniBlock = null, tonePitches = [] }) {
        const position = trials.length + 1;
        const toneEnabled = (role === 'P2' && attention === 'divided');
        const toneEvents = toneEnabled ? tonePitches.map((pitch, i) => {
          const onsetMs = CONFIG.toneOnsetMs + i * CONFIG.toneIntervalMs;
          const nextOnsetMs = CONFIG.toneOnsetMs + (i + 1) * CONFIG.toneIntervalMs;
          return {
            tone_number: i + 1,
            pitch,
            key: CONFIG.toneKeys[pitch],
            frequency_hz: CONFIG.toneFrequenciesHz[pitch],
            onset_ms: onsetMs,
            offset_ms: onsetMs + CONFIG.toneDurationMs,
            response_deadline_ms: i < tonePitches.length - 1 ? nextOnsetMs : CONFIG.wordDurationMs
          };
        }) : [];
        const t1 = toneEvents[0] || {};
        const t2 = toneEvents[1] || {};
        const trial = {
          list: listIndex,
          position,
          word,
          role,
          buffer_id: bufferId,
          pair_id: pair ? pair.id : '',
          p1: pair ? pair.p1 : '',
          p2: pair ? pair.p2 : '',
          extra_list_cue: pair ? pair.extra_list_cue : '',
          relatedness: pair ? pair.relatedness : '',
          mini_block: miniBlock,
          position_in_mini_block: positionInMiniBlock,
          tone_enabled: toneEnabled,
          tone_count: toneEvents.length,
          tone_events: toneEvents,
          // Individual columns make exported study-trial CSVs easy to inspect.
          tone_1_pitch: t1.pitch || '',
          tone_1_key: t1.key || '',
          tone_1_frequency_hz: t1.frequency_hz || '',
          tone_1_onset_ms: t1.onset_ms ?? '',
          tone_1_response_deadline_ms: t1.response_deadline_ms ?? '',
          tone_2_pitch: t2.pitch || '',
          tone_2_key: t2.key || '',
          tone_2_frequency_hz: t2.frequency_hz || '',
          tone_2_onset_ms: t2.onset_ms ?? '',
          tone_2_response_deadline_ms: t2.response_deadline_ms ?? '',
          word_duration_ms: CONFIG.wordDurationMs,
          isi_ms: CONFIG.isiMs,
          tone_duration_ms: toneEnabled ? CONFIG.toneDurationMs : '',
          linked_position: null
        };
        trials.push(trial);
        return trial;
      }

      for (const entry of buffers.slice(li * 4, li * 4 + 2)) {
        addTrial({ word: entry.word, role: 'primacy_buffer', bufferId: entry.id });
      }
      for (let bi = 0; bi < CONFIG.miniBlocksPerCycle; bi++) {
        const miniBlock = bi + 1;
        const masterStart = li * 16 + bi * 4;
        const thisBlock = master.slice(masterStart, masterStart + 4);
        // This set is shared by versions 0 and 1, where all four conditions flip.
        const baseRelated = new Set(shuffle([0, 1, 2, 3], relatednessRandom).slice(0, 2));
        const blockPairs = thisBlock.map((entry, idx) => {
          const related = (baseRelated.has(idx) !== (cb === 1));
          const p2Entry = related ? null : unrelated[unrelatedIndex++];
          const pair = {
            id: entry.id,
            p1: entry.p1,
            p2: related ? entry.p2_related : p2Entry.word,
            p2_related_master: entry.p2_related,
            p2_unrelated_pool_id: related ? '' : p2Entry.id,
            extra_list_cue: entry.extra_list_cue,
            relatedness: related ? 'related' : 'unrelated',
            list: listIndex,
            mini_block: miniBlock,
            position_in_mini_block: idx + 1,
            p1_position: null,
            p2_position: null
          };
          pairs.push(pair);
          return pair;
        });
        // Each P1 has three intervening words before its corresponding P2.
        for (const pair of blockPairs) {
          const trial = addTrial({ word: pair.p1, role: 'P1', pair,
            miniBlock, positionInMiniBlock: pair.position_in_mini_block });
          pair.p1_position = trial.position;
        }
        for (const pair of blockPairs) {
          const tonePitches = tones.slice(toneIndex, toneIndex + CONFIG.tonesPerP2);
          toneIndex += CONFIG.tonesPerP2;
          const trial = addTrial({ word: pair.p2, role: 'P2', pair,
            miniBlock, positionInMiniBlock: pair.position_in_mini_block,
            tonePitches });
          pair.p2_position = trial.position;
          trials[pair.p1_position - 1].linked_position = trial.position;
          trial.linked_position = pair.p1_position;
        }
      }
      for (const entry of buffers.slice(li * 4 + 2, li * 4 + 4)) {
        addTrial({ word: entry.word, role: 'recency_buffer', bufferId: entry.id });
      }
      const cuedTrials = shuffle(pairs.map(pair => ({
        list: listIndex,
        pair_id: pair.id,
        extra_list_cue: pair.extra_list_cue,
        first_letter: pair.p1[0],
        target_p1: pair.p1,
        relatedness: pair.relatedness,
        p1_position: pair.p1_position,
        p2_position: pair.p2_position
      })), testRandom).map((t, i) => ({ ...t, test_position: i + 1 }));
      lists.push({
        list: listIndex,
        trials,
        pairs,
        memory_test: testType === 'cued'
          ? { type: 'cued', instructions: 'Recall the studied word matching the cue and first letter.', trials: cuedTrials }
          : { type: 'free', instructions: 'Recall as many words from the list as you can.', target_p1: pairs.map(p => p.p1) }
      });
    }
    const plan = {
      generator_version: '1.2',
      source: stimuli.source || 'researcher-approved stimulus workbook',
      assignment: { seed, test_type: testType, attention, counterbalance_version: cb },
      timing: { ...CONFIG, toneFrequenciesHz: { ...CONFIG.toneFrequenciesHz }, toneKeys: { ...CONFIG.toneKeys } },
      lists
    };
    const report = validate(plan);
    assert(report.ok, 'Generator failed validation: ' + report.errors.join('; '));
    return plan;
  }

  function validate(plan) {
    const errors = [];
    function check(ok, message) { if (!ok) errors.push(message); }
    const lists = plan?.lists || [];
    const allTrials = lists.flatMap(l => l.trials || []);
    const allPairs = lists.flatMap(l => l.pairs || []);
    check(lists.length === 4, 'Expected 4 lists.');
    check(allTrials.length === 144, 'Expected 144 study trials.');
    check(allPairs.length === 64, 'Expected 64 pairs.');
    const studiedWords = allTrials.map(t => String(t.word).toUpperCase());
    check(new Set(studiedWords).size === 144, 'Studied words repeat across lists.');
    check(new Set(allPairs.map(p => p.id)).size === 64, 'Pair IDs repeat.');
    check(allPairs.filter(p => p.relatedness === 'related').length === 32, 'Not 32 related pairs.');
    check(allPairs.filter(p => p.relatedness === 'unrelated').length === 32, 'Not 32 unrelated pairs.');
    check(allTrials.filter(t => t.role === 'P1').length === 64, 'Not 64 P1 trials.');
    check(allTrials.filter(t => t.role === 'P2').length === 64, 'Not 64 P2 trials.');
    check(allTrials.filter(t => t.role.endsWith('_buffer')).length === 16, 'Not 16 buffers.');
    const cues = new Set(allPairs.map(p => p.extra_list_cue.toUpperCase()));
    check(cues.size === 64, 'Duplicate extra-list cues.');
    check(!studiedWords.some(w => cues.has(w)), 'Extra-list cue appears as a studied word.');

    for (const list of lists) {
      const s = list.trials;
      check(s.length === 36, `List ${list.list}: expected 36 words.`);
      check(list.pairs.length === 16, `List ${list.list}: expected 16 pairs.`);
      check(list.pairs.filter(p => p.relatedness === 'related').length === 8,
        `List ${list.list}: expected 8 related.`);
      check(list.pairs.filter(p => p.relatedness === 'unrelated').length === 8,
        `List ${list.list}: expected 8 unrelated.`);
      check(s.slice(0, 2).every(t => t.role === 'primacy_buffer'),
        `List ${list.list}: expected 2 leading buffers.`);
      check(s.slice(-2).every(t => t.role === 'recency_buffer'),
        `List ${list.list}: expected 2 trailing buffers.`);
      for (let b = 0; b < 4; b++) {
        const block = s.slice(2 + b * 8, 2 + (b + 1) * 8);
        check(block.slice(0, 4).every(t => t.role === 'P1'),
          `List ${list.list}, block ${b + 1}: first half must be P1.`);
        check(block.slice(4).every(t => t.role === 'P2'),
          `List ${list.list}, block ${b + 1}: second half must be P2.`);
        check(block.filter(t => t.role === 'P1' && t.relatedness === 'related').length === 2,
          `List ${list.list}, block ${b + 1}: expected 2 related.`);
        for (let j = 0; j < 4; j++) {
          const a = block[j], z = block[j + 4];
          check(a.pair_id === z.pair_id && a.word === z.p1,
            `List ${list.list}, block ${b + 1}, item ${j + 1}: pair order mismatch.`);
          check(z.position - a.position === 4 && a.linked_position === z.position && z.linked_position === a.position,
            `List ${list.list}, block ${b + 1}, item ${j + 1}: lag not 4.`);
        }
      }
      for (const p of list.pairs) {
        check(p.p2_position - p.p1_position === 4, `Pair ${p.id}: wrong lag.`);
      }
      const toneWordCount = s.filter(t => t.tone_enabled).length;
      const toneEventCount = s.reduce((n, t) => n + t.tone_events.length, 0);
      const divided = plan.assignment.attention === 'divided';
      check(toneWordCount === (divided ? 16 : 0),
        `List ${list.list}: wrong number of tone-enabled P2 words.`);
      check(toneEventCount === (divided ? 32 : 0),
        `List ${list.list}: wrong number of individual tone events.`);
      check(!s.some(t => t.tone_enabled && t.role !== 'P2'),
        `List ${list.list}: tone on non-P2 item.`);
      for (const t of s) {
        check(t.tone_events.length === (t.tone_enabled ? 2 : 0),
          `List ${list.list}, word ${t.position}: expected exactly two tones for DA P2 and zero otherwise.`);
        for (let i = 0; i < t.tone_events.length; i++) {
          const e = t.tone_events[i];
          const expectedOnset = 200 + i * 1500;
          check(e.onset_ms === expectedOnset && e.offset_ms === expectedOnset + 450,
            `List ${list.list}, word ${t.position}: unexpected tone onset or duration.`);
          check(e.response_deadline_ms === (i === 0 ? 1700 : 3000),
            `List ${list.list}, word ${t.position}: wrong response deadline.`);
          check(e.offset_ms <= e.response_deadline_ms && e.response_deadline_ms <= 3000,
            `List ${list.list}, word ${t.position}: tone exceeds response window.`);
          check(e.key === CONFIG.toneKeys[e.pitch] &&
                e.frequency_hz === CONFIG.toneFrequenciesHz[e.pitch],
            `List ${list.list}, word ${t.position}: invalid tone mapping.`);
        }
      }
      if (list.memory_test.type === 'cued') {
        check(list.memory_test.trials.length === 16, `List ${list.list}: expected 16 cued trials.`);
        check(list.memory_test.trials.every(t => t.first_letter === t.target_p1[0]),
          `List ${list.list}: wrong first-letter cue.`);
      }
    }
    return { ok: errors.length === 0, errors,
      totals: { lists: lists.length, words: allTrials.length,
        pairs: allPairs.length, relatedPairs: allPairs.filter(p => p.relatedness === 'related').length,
        unrelatedPairs: allPairs.filter(p => p.relatedness === 'unrelated').length,
        toneTrials: allTrials.filter(t => t.tone_enabled).length,
        toneEvents: allTrials.reduce((n, t) => n + t.tone_events.length, 0) } };
  }

  const CSV_COLUMNS = [ 'list','position','word','role','buffer_id','pair_id','p1','p2',
    'extra_list_cue','relatedness','mini_block','position_in_mini_block',
    'linked_position','tone_enabled','tone_count',
    'tone_1_pitch','tone_1_key','tone_1_frequency_hz','tone_1_onset_ms','tone_1_response_deadline_ms',
    'tone_2_pitch','tone_2_key','tone_2_frequency_hz','tone_2_onset_ms','tone_2_response_deadline_ms',
    'word_duration_ms','isi_ms','tone_duration_ms' ];
  function csvCell(value) {
    const v = value == null ? '' : String(value);
    return /[\r\n,\"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function rowsToCsv(rows, columns) {
    return [columns.join(','), ...rows.map(row => columns.map(key => csvCell(row[key])).join(','))].join('\r\n') + '\r\n';
  }
  function studyCsv(plan) { return rowsToCsv(plan.lists.flatMap(l => l.trials), CSV_COLUMNS); }
  function pairCsv(plan) {
    return rowsToCsv(plan.lists.flatMap(l => l.pairs),
      ['list','mini_block','position_in_mini_block','id','p1','p2',
       'p2_related_master','p2_unrelated_pool_id','extra_list_cue','relatedness',
       'p1_position','p2_position']);
  }
  function cuedCsv(plan) {
    return rowsToCsv(plan.lists.flatMap(l => l.memory_test.type === 'cued' ? l.memory_test.trials : []),
      ['list','test_position','pair_id','extra_list_cue','first_letter','target_p1',
       'relatedness','p1_position','p2_position']);
  }

  root.PairedMemoryGenerator = Object.freeze({
    CONFIG, generate, validate, studyCsv, pairCsv, cuedCsv
  });
})(typeof window !== 'undefined' ? window : globalThis);
