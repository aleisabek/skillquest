/* ===================== PERMISSIONS PILOT =====================
   One pilot exercise, judged by independent and delayed evidence, not by completion (handoff §5).
     1 worked example (in the app, with prediction pauses)  2 guided lab (hints)  3 unfamiliar lab (no hints)
     4a delayed check (a fresh instance, at least PILOT.delay days after an independent pass)  4b transfer: deferred
   The labs run in WSL (labs/sq-lab) and print a report line, "SQR2 {json}" (evidence schema 2). It reaches the app
   only by pasting it in: an "imported checker report". Validation shows it is well formed, not that the checks ran.

   Nothing on import is irreversible. The evidence panel, the journal reminders and "unresolved" are all worked out
   from S.evidence when shown, so the same reports give the same picture whatever order they were imported or merged.
   Pilot results don't change practice scores (those measure practice; this measures the pilot).
   Two different finished records with one attempt id: both are kept, the attempt is unresolved and counts for
   nothing until you pick one (the other is marked superseded, with your note). That is not the progress-merge rule
   (newer wins), which is for practice records from two devices. */
const PILOT = {
  delay: 3, family: 'perm-read-own-file', skill: 'quiz:linux:Permissions',
  labs: [
    {id:'perm-guided', step:2, fault:'file-r', title:'Config won\'t open (guided)', what:'The same problem as the worked example, with new names. Up to three hints, each recorded. This is practice: a new dataset of a problem you have already seen.'},
    {id:'perm-diagnose', step:3, fault:'dir-x', title:'Still can\'t read it', what:'Same symptom, a cause you haven\'t met in steps 1 and 2. No hints. A pass needs three things: a fix that passes the checks, the right cause, and one other likely cause you checked and ruled out. Your first finished attempt is the independent evidence; later attempts are practice.'},
    {id:'perm-recheck', step:4, fault:'dir-x', title:'A few days later', what:'A fresh copy of the step 3 fault, at least 3 days after you pass step 3 on your own. No hints. It checks whether the diagnosis stuck.'}],
  faults: {'file-r':'the file\'s own r', 'dir-x':'a folder\'s x on the path'},
  /* keep these in the same order as Q1 and Q2 in labs/sq-evidence.py (a test compares them) */
  q1: ['file-r', 'dir-x', 'dir-r', 'owner-group', 'other', 'unsure'],
  q2: ['file-r', 'dir-x', 'owner-group', 'none', 'unsure'],
  ruledOut: {'file-r':['dir-x', 'owner-group'], 'dir-x':['file-r', 'owner-group']}
};
const PILOT_SCHEMA = 2;
const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const OUTCOMES = ['independent-pass', 'hinted-pass', 'fail', 'abandoned'];
const EV_FIELDS = ['schema_version', 'attempt_id', 'content_id', 'content_version', 'attempt_date', 'finished_at', 'scenario_family',
  'scenario_instance_id', 'fault_type', 'previous_exposure', 'assistance_viewed', 'help_used', 'evidence', 'checker_results',
  'outcome', 'reasoning', 'reflection', 'checker'];

/* A short fixed-length fingerprint of a record (two FNV-1a passes), used to name the version you keep in a conflict */
function evHash(rec){
  const s = stableStr(rec); let a = 0x811c9dc5, b = 0x01000193 ^ s.length;
  for(let i=0; i<s.length; i++){ const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x01000193 + 2) >>> 0; }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}
/* A report is untrusted text. Every field is allowlisted with a type and a size limit, unknown fields are refused,
   and the claims that can be re-derived (did the named cause match, does the outcome fit the checks) are re-derived.
   Returns {rec} (a fresh copy) or {why} (a plain reason; nothing is stored). */
function validateReport(o){
  const no = why=>({why});
  if(!isObj(o)) return no('not a report');
  if(o.schema_version !== PILOT_SCHEMA) return no(Number.isInteger(o.schema_version) && o.schema_version > PILOT_SCHEMA
    ? 'made by a newer sq-lab (schema '+o.schema_version+'); update SkillQuest first' : 'unknown schema version');
  const extra = Object.keys(o).filter(k=>!EV_FIELDS.includes(k)); if(extra.length) return no('unknown field: '+extra[0].slice(0, 40));
  const str = (v, n, re)=>typeof v === 'string' && v.length <= n && (!re || re.test(v));
  if(!str(o.attempt_id, 36, UUID_RE)) return no('bad attempt id');
  if(!PILOT.labs.some(l=>l.id === o.content_id)) return no('not a pilot lab');
  if(!Number.isInteger(o.content_version) || o.content_version < 1 || o.content_version > 1000) return no('bad content version');
  if(!str(o.attempt_date, 20, ISO_Z) || !str(o.finished_at, 20, ISO_Z) || o.finished_at < o.attempt_date) return no('bad dates');
  if(o.scenario_family !== PILOT.family) return no('unknown scenario family');
  if(!str(o.scenario_instance_id, 12, /^[0-9a-f]{12}$/)) return no('bad instance id');
  if(!(o.fault_type in PILOT.faults)) return no('unknown fault type');
  if(PILOT.labs.find(l=>l.id === o.content_id).fault !== o.fault_type) return no('fault type does not match the lab');
  const slug = /^[a-z0-9-]{1,40}$/;
  if(!Array.isArray(o.previous_exposure) || o.previous_exposure.length > 50 || !o.previous_exposure.every(x=>isObj(x) && Object.keys(x).length === 2 && str(x.content_id, 40, slug) && str(x.fault_type, 40, slug))) return no('bad previous exposure');
  const hints = ['hint-1', 'hint-2', 'hint-3'];
  if(!Array.isArray(o.assistance_viewed) || o.assistance_viewed.length > 3 || !o.assistance_viewed.every(h=>hints.includes(h)) || new Set(o.assistance_viewed).size !== o.assistance_viewed.length) return no('bad hint record');
  const top = o.assistance_viewed.length ? o.assistance_viewed.slice().sort().pop() : 'none';
  if(o.help_used !== top) return no('help used does not match the hints viewed');
  if(!str(o.evidence, 500)) return no('bad evidence note');
  if(!Array.isArray(o.checker_results) || o.checker_results.length > 20 || !o.checker_results.every(c=>isObj(c) && Object.keys(c).length === 4 &&
     str(c.check, 80) && str(c.expected, 200) && str(c.observed, 200) && typeof c.pass === 'boolean')) return no('bad checker results');
  if(!OUTCOMES.includes(o.outcome)) return no('unknown outcome');
  if(!isObj(o.checker) || o.checker.name !== 'sq-lab' || !str(o.checker.version, 20, /^[\w.-]+$/) || Object.keys(o.checker).length !== 2) return no('unknown checker');
  if('reflection' in o && !str(o.reflection, 500)) return no('reflection too long');
  let reasoning;
  if(o.outcome !== 'abandoned'){
    const r = o.reasoning;
    if(!isObj(r) || !PILOT.q1.includes(r.fault_named) || !PILOT.q2.includes(r.ruled_out) || !str(r.provenance, 80)) return no('bad reasoning');
    const named = r.fault_named === o.fault_type, ruled = PILOT.ruledOut[o.fault_type].includes(r.ruled_out);
    if(r.fault_named_right !== named || r.ruled_out_valid !== ruled) return no('reasoning grade does not match the answers');
    const fixed = o.checker_results.length > 0 && o.checker_results.every(c=>c.pass), pass = fixed && named && ruled;
    const want = !pass ? 'fail' : o.assistance_viewed.length ? 'hinted-pass' : 'independent-pass';
    if(o.outcome !== want) return no('outcome does not match the checks and reasoning');
    reasoning = {fault_named:r.fault_named, ruled_out:r.ruled_out, fault_named_right:named, ruled_out_valid:ruled, provenance:r.provenance};
  } else if('reasoning' in o) return no('an abandoned attempt has no reasoning');
  const rec = {};
  for(const k of EV_FIELDS) if(k in o) rec[k] = structuredClone(o[k]);
  if(reasoning) rec.reasoning = reasoning;
  return {rec};
}
/* the stored form: the report itself, plus when it was first imported here (app-side, never compared) */
function cleanEvidence(list){
  const out = [], bad = [];
  for(const e of Array.isArray(list) ? list : []){
    const v = isObj(e) ? validateReport(e.p) : {why:'not a report'};
    if(v.rec) out.push({p:v.rec, at:typeof e.at === 'string' && ISO_Z.test(e.at) ? e.at : null}); else bad.push(v.why);
  }
  return {list:dedupeEvidence(out).slice(0, 500), bad};
}
/* one entry per distinct report; the earliest import time is kept, so it doesn't depend on order */
function dedupeEvidence(list){
  const m = new Map();
  for(const e of list){ const k = stableStr(e.p), o = m.get(k);
    m.set(k, !o ? e : {p:o.p, at:[o.at, e.at].filter(Boolean).sort()[0] || null}); }
  return [...m.values()].sort((x, y)=>x.p.attempt_date.localeCompare(y.p.attempt_date) || stableStr(x.p).localeCompare(stableStr(y.p)));
}
function cleanResolutions(v){
  return cleanMap(v, (r, id)=>UUID_RE.test(id) && isObj(r) && /^[0-9a-f]{16}$/.test(r.keep) && typeof r.at === 'string' && ISO_Z.test(r.at)
    ? {keep:r.keep, at:r.at, note:typeof r.note === 'string' ? r.note.slice(0, 300) : ''} : undefined);
}
/* merging two devices: union of reports, the later resolution of a conflict (a fixed tie-break), the first day the
   worked example was viewed */
function mergePilot(m, a, b){
  m.evidence = dedupeEvidence([...(a.evidence||[]), ...(b.evidence||[])]);
  m.evres = Object.assign({}, a.evres||{});
  for(const [id, r] of Object.entries(b.evres||{})){ const o = m.evres[id]; m.evres[id] = !o ? r : r.at !== o.at ? (r.at > o.at ? r : o) : tieLow(o, r); }
  const w = [(a.pilot||{}).worked, (b.pilot||{}).worked].filter(Boolean).sort()[0];
  m.pilot = w ? {worked:w} : {};
}

/* attempts, grouped by id: the record that counts, or unresolved */
function pilotAttempts(){
  const by = new Map();
  for(const e of S.evidence||[]){ const id = e.p.attempt_id; (by.get(id) || by.set(id, []).get(id)).push(e); }
  return [...by.entries()].map(([id, list])=>{
    const res = (S.evres||{})[id];
    if(list.length === 1) return {id, list, rec:list[0].p, unresolved:false};
    const kept = res && list.find(e=>evHash(e.p) === res.keep);
    return {id, list, rec:kept ? kept.p : null, unresolved:!kept, res:kept ? res : null};
  }).sort((x, y)=>(x.list[0].p.attempt_date).localeCompare(y.list[0].p.attempt_date) || x.id.localeCompare(y.id));
}
const evDay = iso=>dayStr(new Date(iso));   /* reports are UTC; days are counted on this device's calendar */
const dayGap = (a, b)=>Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00')) / 86400000);
/* The evidence, per row, from the counted records only (unresolved and abandoned attempts count for nothing) */
function pilotEvidence(){
  const att = pilotAttempts(), done = att.filter(a=>a.rec && a.rec.outcome !== 'abandoned').map(a=>a.rec);
  const of = id=>done.filter(r=>r.content_id === id);
  const diag = of('perm-diagnose');
  /* unfamiliar = the first finished step 3 attempt, and only if no earlier report shows this fault type */
  const first = diag[0] && !diag[0].previous_exposure.some(x=>x.fault_type === diag[0].fault_type) ? diag[0] : null;
  const indep = first && first.outcome === 'independent-pass' ? first : null;
  const rech = of('perm-recheck').map(r=>({r, gap:indep ? dayGap(evDay(indep.finished_at), evDay(r.attempt_date)) : null}));
  const delayed = rech.find(x=>x.gap !== null && x.gap >= PILOT.delay) || null;
  return {att, unresolved:att.filter(a=>a.unresolved), guided:of('perm-guided'), first, indep, retries:diag.slice(first ? 1 : 0), rech, delayed,
    worked:(S.pilot||{}).worked || null, legacy:(S.labs||{}).permissions || null};
}

/* Journal links (the existing separate-day mechanism, extended): a step 3 or 4 fail becomes an open lab mistake
   with its retry command, and an independent pass schedules the delayed check. The lab entries are rebuilt from the
   evidence every time (dates included), so they can't drift from it or depend on the order reports arrived in. */
function syncPilotJournal(){
  const ev = pilotEvidence(), want = [], later = [...ev.retries, ...ev.rech.map(x=>x.r)];
  for(const r of [ev.first, ...later].filter(Boolean)) if(r.outcome === 'fail'){
    const fix = later.find(x=>x.fault_type === r.fault_type && x.outcome === 'independent-pass' && x.attempt_date > r.attempt_date);
    want.push({id:'lab-'+r.attempt_id, key:'lab|'+r.attempt_id, at:evDay(r.finished_at), wait:0, done:!!fix, doneAt:fix ? evDay(fix.finished_at) : null,
      task:'Permissions pilot: "'+(PILOT.labs.find(l=>l.id === r.content_id) || {}).title+'" not passed on '+evDay(r.finished_at),
      model:'Retry with a fresh copy: sq-lab start '+r.content_id+'. The explanation was printed when you finished; the worked example is in Labs.'});
  }
  if(ev.indep){ const d = ev.rech.find(x=>x.gap >= PILOT.delay);
    want.push({id:'lab-recheck', key:'lab|perm-recheck', at:evDay(ev.indep.finished_at), wait:PILOT.delay, done:!!d, doneAt:d ? evDay(d.r.finished_at) : null,
      task:'Permissions pilot: delayed check', model:'In Ubuntu: sq-lab start perm-recheck (a fresh copy of the step 3 fault, no hints).'}); }
  const made = want.sort((x, y)=>x.key.localeCompare(y.key)).map(w=>{ const e = Object.assign({kind:'lab', count:1, hits:[], why:null, your:'', sid:PILOT.skill}, w);
    if(!e.doneAt) delete e.doneAt; return e; });
  const J = journal(), old = J.filter(e=>e.kind === 'lab');
  if(stableStr(old) === stableStr(made)) return;
  S.journal = made.concat(J.filter(e=>e.kind !== 'lab'));
  save();
}
const labDue = e=>e.kind === 'lab' && !e.done && e.wait > 0 && addDays(e.at, e.wait) <= dayStr();

/* Paste one or more report lines. Each line is checked on its own; a bad line is refused with its reason. */
function importReports(text){
  const lines = String(text).split(/\r?\n/).map(l=>l.replace(/^\uFEFF/, '').trim()).filter(Boolean).slice(0, 50), res = [];
  S.evidence = S.evidence || [];
  for(const l of lines){
    if(!l.startsWith('SQR2 ')){ res.push({why:'not a report line (it should start with SQR2)'}); continue; }
    if(l.length > 20000){ res.push({why:'too long'}); continue; }
    let o; try{ o = JSON.parse(l.slice(5)); }catch(e){ res.push({why:'damaged: not valid JSON'}); continue; }
    const v = validateReport(o); if(!v.rec){ res.push({why:v.why}); continue; }
    const same = S.evidence.filter(e=>e.p.attempt_id === v.rec.attempt_id);
    if(same.some(e=>stableStr(e.p) === stableStr(v.rec))){ res.push({dup:true, rec:v.rec}); continue; }
    S.evidence.push({p:v.rec, at:new Date().toISOString().slice(0, 19)+'Z'});
    res.push({rec:v.rec, conflict:same.length > 0});
  }
  S.evidence = dedupeEvidence(S.evidence);
  syncPilotJournal(); save();
  return res;
}
function resolveAttempt(id, keep, note){
  S.evres = S.evres || {};
  S.evres[id] = {keep, note:String(note||'').slice(0, 300), at:new Date().toISOString().slice(0, 19)+'Z'};
  syncPilotJournal(); save();
}

const OUT_LABEL = {'independent-pass':'passed, no hints', 'hinted-pass':'passed with hints', 'fail':'not passed', 'abandoned':'abandoned'};
function pilotHTML(){
  const ev = pilotEvidence(), lab = id=>PILOT.labs.find(l=>l.id === id);
  const when = r=>esc(evDay(r.finished_at));
  const row = (name, body, note)=>'<tr><th scope="row">'+name+'</th><td>'+body+(note ? '<div class="small">'+note+'</div>' : '')+'</td></tr>';
  const list = rs=>rs.length ? rs.map(r=>OUT_LABEL[r.outcome]+' ('+when(r)+')').join('; ') : 'not yet';
  const recheckDue = ev.indep ? addDays(evDay(ev.indep.finished_at), PILOT.delay) : null;
  const rows =
    row('1 · Worked example', ev.worked ? 'viewed '+esc(ev.worked) : 'not yet', 'Help, not evidence.')+
    row('2 · Guided', list(ev.guided), 'Practice: a new dataset of a problem you have seen. Never counted as independent.')+
    row('3 · Independent', ev.first ? OUT_LABEL[ev.first.outcome]+' ('+when(ev.first)+')' : 'not yet',
      (ev.indep ? 'Shows you can diagnose this one fault type ('+PILOT.faults[ev.indep.fault_type]+') on your own: not "permissions" in general. ' : '')+
      (ev.first && !ev.indep ? 'Only your first finished attempt counts as independent, so later attempts here are practice and can\'t open the delayed check. ' : '')+(ev.retries.length ? 'Later attempts (practice): '+list(ev.retries)+'.' : ''))+
    row('4a · Delayed', ev.delayed ? OUT_LABEL[ev.delayed.r.outcome]+' after '+ev.delayed.gap+' days ('+when(ev.delayed.r)+')' : ev.indep ? 'due from '+esc(recheckDue) : 'after an independent pass in step 3',
      ev.rech.filter(x=>x !== ev.delayed).map(x=>OUT_LABEL[x.r.outcome]+' ('+when(x.r)+')'+(x.gap === null ? ': not counted, no independent pass before it' : x.gap < 0 ? ': not counted, it was before your independent pass' : x.gap < PILOT.delay ? ': not counted, only '+x.gap+' day'+(x.gap === 1 ? '' : 's')+' later' : '')).join('; '))+
    row('4b · Transfer', 'deferred', 'No other topic has its prerequisites in place yet, so transfer isn\'t tested in this pilot.');
  const conflicts = ev.unresolved.map(a=>'<div class="card tip" style="border-color:var(--bad)"><b>Unresolved attempt '+esc(a.id.slice(0, 8))+'</b>: two different finished reports share this id, so it counts for nothing until you choose one. The other stays, marked superseded.'+
    a.list.map(e=>'<div class="row" style="margin-top:8px"><span>'+OUT_LABEL[e.p.outcome]+', finished '+esc(e.p.finished_at)+', '+e.p.checker_results.filter(c=>c.pass).length+' of '+e.p.checker_results.length+' checks</span>'+
      '<button data-keep="'+esc(evHash(e.p))+'" data-att="'+esc(a.id)+'">Keep this one</button></div>').join('')+
    '<label class="small" style="display:block;margin-top:8px">Why (saved with your choice) <input class="typed" data-note="'+esc(a.id)+'" maxlength="300" style="width:100%"></label></div>').join('');
  return '<div class="card" id="pilot"><h2 style="margin-top:0">🧭 Permissions pilot</h2>'+
    '<p>Can you diagnose a permissions fault you haven\'t seen before, on your own, and does it stick? Four steps, in order. Steps 2 to 4 run in WSL (PC only) and end with a report you paste here.</p>'+
    '<ol class="clean pilot-steps"><li><b>Worked example</b> (here): a config you own won\'t open. Predict, then see what each check shows and what it doesn\'t. <button id="pilotWorked">Open the worked example</button></li>'+
    PILOT.labs.map(l=>'<li><b>'+esc(l.title)+'</b>: '+esc(l.what)+'<div class="small">In Ubuntu: <code>sq-lab start '+l.id+'</code> · when done: <code>sq-lab finish '+l.id+'</code> · then <code>sq-lab report '+l.id+' | clip.exe</code></div></li>').join('')+
    '</ol><div id="pilotScene" tabindex="-1"></div>'+conflicts+
    '<h3>What the evidence shows</h3><table class="pilot-ev"><tbody>'+rows+'</tbody></table>'+
    (ev.legacy ? '<p class="small">Earlier "Permission denied" lab: passed '+esc(ev.legacy)+' by completion code (legacy: details unknown, not part of this pilot).</p>' : '')+
    '<p class="small">Lab results are <b>imported checker reports</b>: SkillQuest checks that each report is well formed and consistent, not that the checks really ran. Your reasoning answers are learner-reported, compared by sq-lab. Nothing here changes your practice scores.</p>'+
    '<h3>Import a report</h3><label for="pilotPaste" class="small">Paste the line from <code>sq-lab report NAME</code> (one or more lines starting with SQR2)</label>'+
    '<textarea id="pilotPaste" rows="3" spellcheck="false" autocomplete="off" style="width:100%"></textarea>'+
    '<div class="row"><button class="primary" id="pilotImport">Import</button></div><div id="pilotMsg" role="status" aria-live="polite" class="small"></div></div>';
}
function wirePilot(){
  const msg = $('#pilotMsg');
  $('#pilotImport').onclick = ()=>{
    const res = importReports($('#pilotPaste').value);
    if(!res.length){ msg.textContent = 'Nothing to import: paste the SQR2 line first.'; return; }
    const out = res.map(r=>r.why ? 'Refused, nothing stored: '+r.why+'.' : r.dup ? 'Already imported ('+r.rec.content_id+').' :
      'Imported '+r.rec.content_id+': '+OUT_LABEL[r.rec.outcome]+(r.conflict ? '. Another report with the same attempt id differs, so the attempt is now unresolved: choose one above.' : '.'));
    if(res.some(r=>r.rec && !r.dup && r.rec.outcome === 'fail' && r.rec.content_id !== 'perm-guided')) out.push('A step 3 or 4 attempt didn\'t pass: the explanation was printed in the terminal, and it\'s in your mistake journal with its retry command.');
    vLabs(); const m = $('#pilotMsg'); if(m) m.textContent = out.join(' ');
  };
  $('#pilotWorked').onclick = ()=>{
    S.pilot = S.pilot || {}; if(!S.pilot.worked){ S.pilot.worked = dayStr(); save(); }
    const host = $('#pilotScene'); mountScene(host, pilotScene()); $('#pilotWorked').remove(); host.focus();
  };
  view.querySelectorAll('[data-keep]').forEach(b=>b.onclick = ()=>{
    const id = b.dataset.att, note = (view.querySelector('[data-note="'+id+'"]') || {}).value || '';
    askConfirm('Keep this report for attempt '+id.slice(0, 8)+'? The other stays, marked superseded.', 'Keep it', ()=>{ resolveAttempt(id, b.dataset.keep, note); vLabs(); });
  });
}
