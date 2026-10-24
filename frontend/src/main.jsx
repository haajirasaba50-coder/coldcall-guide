import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { stages, outcomes } from './data/stages';
import './style.css';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');
async function request(path, options={}) {
  const response = await fetch(`${API}${path}`, { headers:{'Content-Type':'application/json'}, ...options });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function timeLabel(value) {
  if (!value) return 'In progress';
  return new Date(value).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
}

function App() {
  const [page, setPage] = useState('history');
  const [call, setCall] = useState(null);
  const [stageNo, setStageNo] = useState(1);
  const [eventKey, setEventKey] = useState('');
  const [words, setWords] = useState('');
  const [prospect, setProspect] = useState('');
  const [company, setCompany] = useState('');
  const [outcome, setOutcome] = useState('Follow-up scheduled');
  const [nextStep, setNextStep] = useState('');
  const [nextWhen, setNextWhen] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [coach, setCoach] = useState('');
  const stage = stages[stageNo-1];

  async function loadHistory() {
    try { setHistory(await request('/api/calls')); }
    catch (e) { setNotice(`History unavailable: ${e.message}`); }
  }
  useEffect(()=>{ if(page==='history') loadHistory(); }, [page]);

  async function startCall(e) {
    e?.preventDefault();
    setLoading(true); setNotice('');
    try {
      const created = await request('/api/calls',{method:'POST',body:JSON.stringify({prospect_name:prospect || 'Unknown prospect',company_name:company})});
      setCall(created); setStageNo(1); setEventKey(''); setWords(''); setPage('call'); setNotice('Call started. Keep listening; use the screen as a guide.');
    } catch (err) { setNotice(err.message); }
    finally { setLoading(false); }
  }
  async function saveStage(number=stageNo) {
    if (!call) return;
    setLoading(true); setNotice('');
    try {
      await request(`/api/calls/${call.id}/stages/${number}`,{method:'PATCH',body:JSON.stringify({event_key:eventKey || 'not_recorded',prospect_words:words})});
      setNotice(`Stage ${number} saved.`);
    } catch(err) { setNotice(err.message); }
    finally { setLoading(false); }
  }
  async function moveTo(next) {
    if (!call) return;
    await saveStage(stageNo);
    if (next >= 1 && next <= 8) {
      setStageNo(next);
      const previous = call.call_stage_results?.find(x=>x.stage_number===next);
      setEventKey(previous?.event_key || ''); setWords(previous?.prospect_words || '');
      try { await request(`/api/calls/${call.id}/stages/${next}`,{method:'PATCH',body:JSON.stringify({event_key:previous?.event_key || 'not_recorded',prospect_words:previous?.prospect_words || ''})}); } catch {}
      setNotice(`Stage ${next}: ${stages[next-1].name}`);
    }
  }
  async function closeCall(e) {
    e?.preventDefault();
    if (!call) return;
    setLoading(true);
    try {
      await saveStage(stageNo);
      await request(`/api/calls/${call.id}/close`,{method:'POST',body:JSON.stringify({outcome,next_step:nextStep,next_step_at:nextWhen,current_stage:stageNo})});
      setNotice('Call saved to history.');
      setCall(null); setPage('history'); await loadHistory();
    } catch(err) { setNotice(err.message); }
    finally { setLoading(false); }
  }
  async function askCoach() {
    setCoach('Thinking…');
    try {
      const data = await request('/api/coach',{method:'POST',body:JSON.stringify({stage:stage.name,event:stage.events.find(x=>x.key===eventKey)?.label || 'Not selected',prospectWords:words})});
      console.log('Coach response:', data);
    setCoach(data.suggestion);
    } catch { setCoach('Acknowledge what they said and ask one clear follow-up.'); }
  }
  function openCall(item) {
    setCall(item); setStageNo(item.current_stage || 1);
    const current = item.call_stage_results?.find(x=>x.stage_number===(item.current_stage || 1));
    setEventKey(current?.event_key || ''); setWords(current?.prospect_words || '');
    setProspect(item.prospect_name || ''); setCompany(item.company_name || '');
    setOutcome(item.outcome || 'Follow-up scheduled'); setNextStep(item.next_step || ''); setNextWhen(item.next_step_at || '');
    setPage(item.call_ended_at ? 'detail' : 'call');
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={()=>setPage('call')}><span className="brand-mark">C</span><span>CallCompass<small>LIVE CALL GUIDE</small></span></button>
      <nav><button className={page==='call'?'active':''} onClick={()=>setPage('call')}>Call guide</button><button className={page==='history'?'active':''} onClick={()=>setPage('history')}>Past calls</button></nav>
      <span className="status"><i/> CALL DESK</span>
    </header>
    {notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    {page==='call' && !call && <main className="welcome">
      <div className="eyebrow">A CALM SCREEN FOR A LIVE CONVERSATION</div><h1>Stay with the<br/><em>conversation.</em></h1>
      <p className="welcome-copy">Eight stages. One clear next step. Keep your attention on the person, not on remembering what comes next.</p>
      <form className="start-card" onSubmit={startCall}>
        <h2>Start a call</h2><p>Optional details help you find this call later.</p>
        <label>Prospect name<input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="e.g. Anil Rao"/></label>
        <label>Company<input value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Rao Manufacturing"/></label>
        <button className="primary full" disabled={loading}>{loading?'Starting…':'Start call'} <span>→</span></button>
      </form>
      <div className="welcome-foot"><span>01 / 08</span><span>Listen first. Log only what matters.</span></div>
    </main>}
    {page==='call' && call && <main className="call-layout">
      <section className="call-heading">
        <div><div className="eyebrow"><span className="live-dot"/> CALL IN PROGRESS · {timeLabel(call.call_started_at)}</div><h1>{call.prospect_name || 'Unknown prospect'}</h1><p>{call.company_name || 'Company not added'} <span className="dot-sep">·</span> First conversation</p></div>
        <button className="quiet" onClick={()=>setPage('history')}>Past calls ↗</button>
      </section>
      <section className="stage-strip" aria-label="Call stages">{stages.map(s=><button key={s.number} title={s.name} className={`${s.number===stageNo?'current':''} ${s.number<stageNo?'done':''}`} onClick={()=>moveTo(s.number)}><span>{s.number<stageNo?'✓':String(s.number).padStart(2,'0')}</span><small>{s.name}</small></button>)}</section>
      <div className="call-grid">
        <section className="main-stage">
          <div className="stage-kicker">STAGE {String(stage.number).padStart(2,'0')} OF 08 <span>·</span> {Math.round(stageNo/8*100)}% THROUGH</div>
          <h2>{stage.name}</h2><p className="purpose">{stage.purpose}</p>
          <div className="likely-panel"><div className="section-title"><span className="spark">✳</span><div><h3>What they may say</h3><p>Be ready to listen for these patterns</p></div></div>
            {stage.likelySay.map((line,i)=><div className="quote-row" key={line}><span>“</span><p>{line.replace(/^“|”$/g,'')}</p></div>)}
          </div>
          <div className="step-actions"><button className="secondary" disabled={stageNo===1} onClick={()=>moveTo(stageNo-1)}>← Previous</button><button className="primary" onClick={()=>moveTo(Math.min(8,stageNo+1))} disabled={stageNo===8}>Next stage <span>→</span></button></div>
        </section>
        <aside className="capture-panel">
          <div className="capture-head"><span className="capture-icon">↳</span><div><h3>What happened?</h3><p>Tap the closest match</p></div></div>
          <div className="event-list">{stage.events.map(ev=><button key={ev.key} className={`event-option ${eventKey===ev.key?'selected':''}`} onClick={()=>setEventKey(ev.key)}><span className="radio">{eventKey===ev.key?'✓':''}</span>{ev.label}</button>)}</div>
          <label className="words-label">Their words <span>OPTIONAL EXCEPT STAGE 5</span><textarea value={words} onChange={e=>setWords(e.target.value)} placeholder={stageNo===5?'Write what they said, as closely as you can…':'A phrase worth remembering…'} rows={4}/></label>
          {stageNo===5 && <p className="field-hint">Use their wording, not your summary. This note helps the next conversation.</p>}
          <button className="text-button" onClick={askCoach}>✳ Get a one-line suggestion</button>
          {coach && <div className="coach-box"><b>Suggestion</b><p>{coach}</p><small>Use your judgment; this is only a prompt.</small></div>}
          <button className="secondary save-button" disabled={loading} onClick={()=>saveStage()}>{loading?'Saving…':'Save this stage'}</button>
          <button className="end-link" onClick={()=>setPage('close')}>End call now ↗</button>
        </aside>
      </div>
      <div className="bottom-note"><span>◉</span> Keep it conversational. The guide is a reminder, not a script.</div>
    </main>}
    {page==='close' && call && <main className="close-page">
      <button className="back-link" onClick={()=>setPage('call')}>← Back to call</button><div className="eyebrow">CALL WRAP-UP</div><h1>How did it <em>end?</em></h1><p className="welcome-copy">Record what actually happened, even if the call ended early or the answer was no.</p>
      <form className="start-card close-card" onSubmit={closeCall}>
        <label>Outcome<select value={outcome} onChange={e=>setOutcome(e.target.value)}>{outcomes.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Agreed next step<input value={nextStep} onChange={e=>setNextStep(e.target.value)} placeholder="e.g. Send one-page note on WhatsApp"/></label>
        <label>When / channel<input value={nextWhen} onChange={e=>setNextWhen(e.target.value)} placeholder="e.g. Tomorrow at 2 PM, phone call"/></label>
        <div className="wrap-note"><b>Last stage reached</b><span>{stageNo} / 8 · {stages[stageNo-1].name}</span></div>
        <button className="primary full" disabled={loading}>{loading?'Saving call…':'Save call to history'} <span>→</span></button>
      </form>
    </main>}
    {(page==='history' || page==='detail') && <main className="history-page">
      <div className="history-heading"><div><div className="eyebrow">YOUR CONVERSATION LOG</div><h1>{page==='detail'?'Call details':'Past calls'}</h1><p>Each record shows how far the conversation reached and what happened.</p></div>{page==='detail'?<button className="secondary" onClick={()=>setPage('history')}>← All calls</button>:<button className="primary" onClick={()=>{setCall(null);setPage('call')}}>＋ Start a call</button>}</div>
      {page==='detail' && call && <div className="detail-card"><h2>{call.prospect_name}</h2><p>{call.company_name} · {timeLabel(call.call_started_at)}</p><div className="detail-grid"><div><small>Outcome</small><b>{call.outcome || 'In progress'}</b></div><div><small>Stage reached</small><b>{call.current_stage}/8 · {stages[(call.current_stage||1)-1].name}</b></div><div><small>Next step</small><b>{call.next_step || 'Not recorded'}</b></div></div>{(call.call_stage_results||[]).sort((a,b)=>a.stage_number-b.stage_number).map(r=><div className="detail-stage" key={r.id}><b>{r.stage_number}. {stages[r.stage_number-1].name}</b><span>{stages[r.stage_number-1].events.find(e=>e.key===r.event_key)?.label || r.event_key}</span>{r.prospect_words && <p>“{r.prospect_words}”</p>}</div>)}</div>}
      {page==='history' && <>{history.length===0?<div className="empty-state"><div>↗</div><h2>No saved calls yet</h2><p>Start a call and close it to build your call history.</p><button className="primary" onClick={()=>setPage('call')}>Start your first call →</button></div>:<div className="history-list">{history.map(item=><button className="history-row" key={item.id} onClick={()=>openCall(item)}><div className="history-date">{new Date(item.call_started_at).toLocaleDateString([], {month:'short',day:'2-digit'})}<small>{new Date(item.call_started_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div><div className="history-person"><b>{item.prospect_name || 'Unknown prospect'}</b><span>{item.company_name || 'Company not added'}</span><small>{item.outcome || 'In progress'}</small></div><div className="history-stage"><span className="stage-pill">{String(item.current_stage).padStart(2,'0')} / 08</span><b>{stages[(item.current_stage||1)-1].name}</b><small>Stage reached</small></div><span className="row-arrow">↗</span></button>)}</div>}</>}
    </main>}
    <footer><span>CALLCOMPASS</span><span>Made for listening, not reading a script.</span><span>DEMO · V1.0</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
