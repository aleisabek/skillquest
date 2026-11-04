/* ===================== RECORD & REPLAY INTERVIEW ANSWERS =====================
   Records your spoken answer with the microphone and plays it back so you can hear yourself.
   Audio never leaves this computer: it is stored in the browser's IndexedDB (not in backups),
   and only the last 5 attempts per question are kept. */
const REC_KEEP = 5, REC_TARGET = [45, 95];   /* a good spoken answer is roughly 45-95 seconds */
let REC = null;   /* the recording in progress: {mr, stream, chunks, start, tick, qid} */
let REC_ASK = null;   /* a microphone request still waiting for permission; leaving the page cancels it */
/* the recorder box, but only while it still belongs to this question (you may have moved on while something loaded) */
const recBox = qid=>{ const b = $('#rec'); return b && b.dataset.qid === qid ? b : null; };

function audioDB(){
  return new Promise((ok, no)=>{
    try{
      const r = indexedDB.open('skillquest-audio', 1);
      r.onupgradeneeded = ()=>{ const s = r.result.createObjectStore('clips', {keyPath:'id'}); s.createIndex('q', 'q'); };
      r.onsuccess = ()=>ok(r.result); r.onerror = ()=>no(r.error);
    }catch(e){ no(e); }
  });
}
async function clipsFor(qid){
  const db = await audioDB();
  return new Promise(ok=>{ const r = db.transaction('clips').objectStore('clips').index('q').getAll(qid); r.onsuccess = ()=>ok(r.result.sort((a,b)=>b.t-a.t)); r.onerror = ()=>ok([]); });
}
/* writes fail loudly (storage full, transaction aborted) instead of waiting forever */
async function clipWrite(f){ const db = await audioDB(); return new Promise((ok, no)=>{ const tx = db.transaction('clips','readwrite'); f(tx.objectStore('clips')); tx.oncomplete = ok; tx.onerror = tx.onabort = ()=>no(tx.error || new Error('not saved')); }); }
const putClip = c=>clipWrite(s=>s.put(c));
const deleteClip = id=>clipWrite(s=>s.delete(id));

function stopRecording(discard){
  REC_ASK = null;   /* a permission answer that arrives after this is ignored */
  if(!REC) return;
  clearInterval(REC.tick);
  REC.discard = !!discard;
  try{ if(REC.mr.state !== 'inactive') REC.mr.stop(); }catch(e){}
  REC.stream.getTracks().forEach(t=>t.stop());
}
const fmtSecs = s=>Math.floor(s/60)+':'+String(Math.round(s)%60).padStart(2,'0');

async function renderRecorder(qid){
  const first = $('#rec'); if(!first) return;
  first.dataset.qid = qid;
  const can = !PHONE && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  let clips = []; try{ clips = await clipsFor(qid); }catch(e){}
  const box = recBox(qid); if(!box) return;   /* you left the page, or moved to another question, while loading */
  const prev = clips[1], last = clips[0];
  const trend = last && prev ? '<p class="small">Last try: '+fmtSecs(last.secs)+', '+last.fillers+' filler words. Try before: '+fmtSecs(prev.secs)+', '+prev.fillers+' filler words. '+
    (last.fillers < prev.fillers ? '📈 Fewer fillers, nice.' : last.fillers > prev.fillers ? 'More fillers this time; slow down and pause instead of saying "um".' : '')+'</p>' : '';
  box.innerHTML = (can
      ? '<div class="row"><button class="primary" id="recBtn">🎙 Record my answer</button><span class="timer" id="recClock" style="font-size:1.4rem">0:00</span><span class="small">Aim for '+REC_TARGET[0]+'–'+REC_TARGET[1]+' seconds.</span></div>'
      : '<p class="small">Recording isn\'t available here. Use the desktop version on your PC (Chrome or Edge) to record and replay your answers. On the phone, say your answer out loud with the timer.</p>')+
    trend+
    (clips.length ? '<div style="margin-top:10px">'+clips.map((c,k)=>{
        const good = c.secs >= REC_TARGET[0] && c.secs <= REC_TARGET[1];
        return '<div class="ritem"><span>'+(k===0?'<b>Latest</b>':'Try '+(clips.length-k))+' · '+c.date+' · <span style="color:var('+(good?'--good':'--warn')+')">'+fmtSecs(c.secs)+'</span></span>'+
          '<audio controls preload="none" data-clip="'+c.id+'" style="height:32px;max-width:240px"></audio>'+
          '<span class="small">fillers</span><button data-fill="'+c.id+'" data-d="-1">−</button><b>'+c.fillers+'</b><button data-fill="'+c.id+'" data-d="1">+</button>'+
          '<button data-del="'+c.id+'" title="Delete this recording">🗑</button></div>'; }).join('')+
      '<p class="small">Listen back and tap + for every "um", "uh", "like" or "you know". Recordings stay on this computer only (not in backups); the last '+REC_KEEP+' tries are kept.</p></div>' : '');
  box.querySelectorAll('audio[data-clip]').forEach(a=>{ const c = clips.find(x=>x.id===a.dataset.clip); if(c && c.blob) a.src = URL.createObjectURL(c.blob); });
  const saved = f=>async()=>{ try{ await f(); }catch(e){ toast('Couldn\'t save that change: browser storage refused it.'); } if(recBox(qid)) renderRecorder(qid); };
  box.querySelectorAll('[data-fill]').forEach(b=>b.onclick=saved(()=>{ const c = clips.find(x=>x.id===b.dataset.fill); c.fillers = Math.max(0, c.fillers + +b.dataset.d); return putClip(c); }));
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=saved(()=>deleteClip(b.dataset.del)));
  const btn = $('#recBtn'); if(!btn) return;
  if(REC && REC.qid === qid){ btn.textContent = '■ Stop recording'; btn.onclick = ()=>stopRecording(); return; }
  btn.onclick = async ()=>{
    if(REC_ASK || REC) return;   /* already asking for the microphone, or already recording */
    const ask = REC_ASK = {qid};
    let stream;
    try{ stream = await navigator.mediaDevices.getUserMedia({audio:true}); }
    catch(e){ if(REC_ASK === ask){ REC_ASK = null; toast('Microphone blocked. Allow it in the browser\'s address bar, then try again.'); } return; }
    const release = ()=>stream.getTracks().forEach(t=>t.stop());
    /* the answer came after you left (or moved to another question): don't record, give the microphone back */
    if(REC_ASK !== ask || !recBox(qid)){ release(); return; }
    REC_ASK = null;
    let mr;
    try{ mr = new MediaRecorder(stream); mr.start(); }
    catch(e){ release(); toast('Recording couldn\'t start in this browser.'); return; }
    const chunks = [], rec = REC = {mr, stream, chunks, start:Date.now(), qid};
    mr.ondataavailable = e=>{ if(e.data.size) chunks.push(e.data); };
    mr.onstop = async ()=>{
      if(REC === rec) REC = null;
      if(rec.discard || !chunks.length) return;
      const secs = (Date.now()-rec.start)/1000;
      try{
        await putClip({id:'a'+Date.now().toString(36), q:qid, t:Date.now(), date:dayStr(), secs, fillers:0, blob:new Blob(chunks, {type:mr.mimeType||'audio/webm'})});
        const all = await clipsFor(qid); for(const old of all.slice(REC_KEEP)) await deleteClip(old.id);
      }catch(e){ toast('That recording couldn\'t be saved: browser storage refused it.'); if(recBox(qid)) renderRecorder(qid); return; }
      addXP(5, 'Spoke your answer out loud');
      if(recBox(qid)) renderRecorder(qid);
    };
    /* the box may have been redrawn while permission was pending, so label the button that is on screen now */
    const live = recBox(qid) && $('#recBtn');
    if(live){ live.textContent = '■ Stop recording'; live.onclick = ()=>stopRecording(); }
    rec.tick = setInterval(()=>{ const s = (Date.now()-rec.start)/1000, el = $('#recClock'); if(el){ el.textContent = fmtSecs(s); el.classList.toggle('low', s > REC_TARGET[1]); } if(s > 300) stopRecording(); }, 250);
  };
}
