import { useState, useEffect, useRef } from 'react';
import {
  getLeadCountries, claimAndVerify, pollLeadJob,
  leadExportUrl, getLeadHistory, resumeLeadJob
} from '../api';
import ScoutMode from './ScoutMode';

const CATEGORIES = [
  { key: 'delivers', label: '✅ Delivers',    color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', filter: r => r.category === 'delivers' },
  { key: 'unknown',  label: '⚠️ Unconfirmed', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)', filter: r => r.category === 'unknown'  },
  { key: 'bounce',   label: '❌ Bounce',       color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)',   filter: r => r.category === 'bounce'   },
  { key: 'all',      label: 'All',            color: 'var(--text)',  bg: 'var(--bg3)',      border: 'var(--border-mid)',   filter: () => true },
];
const AMOUNTS = [100, 250, 500, 1000, 2000];
const JOB_KEY = 'mc_lead_job';

// ── Results panel ─────────────────────────────────────────────────────────────
function ResultsPanel({ results, jobId, country, onReset, onScout }) {
  const [activeTab, setActiveTab] = useState('delivers');
  const cat       = CATEGORIES.find(c => c.key === activeTab);
  const filtered  = results.filter(cat.filter);
  const preview   = filtered.slice(0, 25);
  const remaining = filtered.length - preview.length;
  const counts    = {};
  CATEGORIES.forEach(c => { counts[c.key] = results.filter(c.filter).length; });
  const deliverEmails = results.filter(r => r.category === 'delivers').map(r => r.email);

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 3 }}>
            {country} leads verified
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {results.length.toLocaleString()} emails processed ·
            {' '}<span style={{ color: 'var(--green)' }}>{counts.delivers} deliver</span> ·
            {' '}<span style={{ color: 'var(--amber)' }}>{counts.unknown} unconfirmed</span> ·
            {' '}<span style={{ color: 'var(--red)' }}>{counts.bounce} bounce</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {deliverEmails.length > 0 && (
            <button onClick={() => onScout(deliverEmails)}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
              📨 Scout {deliverEmails.length.toLocaleString()} delivers →
            </button>
          )}
          <button onClick={onReset} className="btn-ghost" style={{ padding: '10px 16px', fontSize: 13 }}>
            ← New batch
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
        {CATEGORIES.filter(c => c.key !== 'all').map(c => (
          <div key={c.key} onClick={() => setActiveTab(c.key)}
            style={{ background: activeTab === c.key ? c.bg : 'var(--bg2)', border: `1px solid ${activeTab === c.key ? c.border : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700, color: activeTab === c.key ? c.color : 'var(--text)', letterSpacing: '-0.02em' }}>{counts[c.key].toLocaleString()}</div>
            <div style={{ fontSize: 12, color: activeTab === c.key ? c.color : 'var(--text-muted)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', padding: 3, marginBottom: 14, overflowX: 'auto' }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActiveTab(c.key)}
            style={{ flex: 1, background: activeTab === c.key ? 'var(--bg2)' : 'transparent', color: activeTab === c.key ? c.color : 'var(--text-muted)', border: activeTab === c.key ? `1px solid ${c.border}` : '1px solid transparent', padding: '7px 8px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {c.key === 'all' ? `All (${counts.all})` : `${c.label} (${counts[c.key]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)', fontSize: 13, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          No emails in this category
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border-mid)' }}>
                  {['Email', 'SMTP', 'Status', 'Flags'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => {
                  const catInfo = CATEGORIES.find(c => c.key === r.category) || CATEGORIES[3];
                  return (
                    <tr key={i} style={{ borderBottom: i < preview.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'DM Mono', fontSize: 12 }}>{r.email}</td>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${r.smtp_valid === true ? 'badge-valid' : r.smtp_valid === false ? 'badge-invalid' : 'badge-null'}`}>
                          {r.smtp_valid === true ? '250 OK' : r.smtp_valid === false ? 'Rejected' : 'Timeout'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ background: catInfo.bg, color: catInfo.color, border: `1px solid ${catInfo.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'DM Mono' }}>{r.category}</span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {r.catch_all  && <span style={{ fontSize: 10, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: 5, padding: '2px 7px', fontFamily: 'DM Mono' }}>catch-all</span>}
                          {r.disposable && <span style={{ fontSize: 10, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 5, padding: '2px 7px', fontFamily: 'DM Mono' }}>disposable</span>}
                          {!r.catch_all && !r.disposable && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {remaining > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
                Showing 25 of {filtered.length.toLocaleString()} · {remaining.toLocaleString()} more
              </span>
              <a href={leadExportUrl(jobId, activeTab)} download style={{ textDecoration: 'none' }}>
                <button className="btn-export">↓ Download all {filtered.length.toLocaleString()}</button>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Download section */}
      <div style={{ marginTop: 16, padding: '16px 18px', background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Download clean email lists</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <a key={c.key} href={leadExportUrl(jobId, c.key)} download style={{ textDecoration: 'none' }}>
              <button className="btn-export">↓ {c.key === 'all' ? 'All' : c.label} ({counts[c.key] || 0})</button>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({ job, onResume }) {
  const date = job.created_at ? new Date(job.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const pct  = job.total > 0 ? Math.round((job.progress / job.total) * 100) : 0;
  const STATUS_COLOR = { done: 'var(--green)', processing: 'var(--amber)', expired: 'var(--text-dim)', failed: 'var(--red)' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', align: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          🎯
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
            {job.country} · {job.total?.toLocaleString()} emails
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
            {date} ·{' '}
            <span style={{ color: STATUS_COLOR[job.status] || 'var(--text-dim)' }}>{job.status}</span>
            {job.status === 'processing' && ` · ${pct}%`}
          </div>
        </div>
      </div>
      {(job.status === 'done' || job.status === 'processing') && (
        <button onClick={() => onResume(job.id, job.status)}
          style={{ background: job.status === 'done' ? 'var(--green-bg)' : 'var(--amber-bg)', color: job.status === 'done' ? 'var(--green)' : 'var(--amber)', border: `1px solid ${job.status === 'done' ? 'var(--green-border)' : 'var(--amber-border)'}`, padding: '7px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {job.status === 'done' ? 'View results' : 'Resume →'}
        </button>
      )}
    </div>
  );
}

// ── Main LeadsPage ────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [tab, setTab]                   = useState('new'); // new | history
  const [countries, setCountries]       = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [selected, setSelected]         = useState(null);
  const [amount, setAmount]             = useState(1000);
  const [starting, setStarting]         = useState(false);
  const [job, setJob]                   = useState(null);
  const [error, setError]               = useState('');
  const [scoutEmails, setScoutEmails]   = useState(null);
  const [history, setHistory]           = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [resuming, setResuming]         = useState(false);
  const pollRef = useRef(null);

  // Load countries
  useEffect(() => {
    getLeadCountries()
      .then(setCountries)
      .catch(e => setError(e.message))
      .finally(() => setLoadingCountries(false));

    // Resume any in-progress job from localStorage
    const savedJob = localStorage.getItem(JOB_KEY);
    if (savedJob) {
      try {
        const parsed = JSON.parse(savedJob);
        if (parsed.job_id && parsed.status !== 'done') {
          setJob({ id: parsed.job_id, status: parsed.status || 'processing', progress: 0, total: parsed.total || 0, percent: 0, results: [], country: parsed.country || '' });
        }
      } catch {}
    }
  }, []);

  // Poll active job
  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'expired' || job.status === 'failed') {
      if (pollRef.current) clearInterval(pollRef.current);
      if (job?.status === 'done') localStorage.removeItem(JOB_KEY);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollLeadJob(job.id);
        setJob(prev => ({ ...prev, ...data }));
        if (data.status === 'done') {
          clearInterval(pollRef.current);
          localStorage.removeItem(JOB_KEY);
          getLeadCountries().then(setCountries).catch(() => {});
        }
      } catch {}
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [job?.id, job?.status]);

  // Load history when tab switches
  useEffect(() => {
    if (tab === 'history') {
      setLoadingHistory(true);
      getLeadHistory()
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [tab]);

  const handleStart = async () => {
    if (!selected) return;
    setStarting(true); setError('');
    try {
      const data = await claimAndVerify(selected.country, amount);
      const newJob = {
        id: data.job_id,
        status: 'processing',
        progress: 0,
        total: data.claimed,
        percent: 0,
        results: [],
        country: selected.name,
      };
      setJob(newJob);
      // Save to localStorage for resume on reload
      localStorage.setItem(JOB_KEY, JSON.stringify({
        job_id: data.job_id,
        status: 'processing',
        total: data.claimed,
        country: selected.name,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  const handleResume = async (jobId, status) => {
    setResuming(true); setError('');
    try {
      if (status === 'done') {
        const data = await resumeLeadJob(jobId);
        setJob({ id: jobId, status: 'done', progress: data.total, total: data.total, percent: 100, results: data.results, country: data.country });
        setTab('new');
      } else {
        setJob({ id: jobId, status: 'processing', progress: 0, total: 0, percent: 0, results: [], country: '' });
        localStorage.setItem(JOB_KEY, JSON.stringify({ job_id: jobId, status: 'processing' }));
        setTab('new');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setResuming(false);
    }
  };

  const reset = () => {
    setJob(null); setSelected(null); setError(''); setScoutEmails(null);
    localStorage.removeItem(JOB_KEY);
    getLeadCountries().then(setCountries).catch(() => {});
  };

  const pct = job ? Math.min(Math.round((job.progress / (job.total || 1)) * 100), 100) : 0;

  // Scout mode
  if (scoutEmails) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 80px' }}>
        <ScoutMode emails={scoutEmails} onBack={() => setScoutEmails(null)} />
      </div>
    );
  }

  // Show results
  if (job?.status === 'done' && job.results?.length > 0) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 80px' }}>
        <ResultsPanel results={job.results} jobId={job.id} country={job.country} onReset={reset} onScout={emails => setScoutEmails(emails)} />
      </div>
    );
  }

  // Show progress
  if (job && job.status !== 'done') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 80px' }}>
        <div className="animate-in">
          <h2 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>
            Verifying {job.country} leads...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            {job.progress?.toLocaleString() || 0} of {job.total?.toLocaleString() || '?'} checked · Page can be safely closed and reopened
          </p>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', boxShadow: 'var(--shadow-sm)', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text-muted)' }}>
                <span className="pulse">Verifying...</span>
              </div>
              <div style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em' }}>{pct}%</div>
            </div>
            <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--green)', lineHeight: 1.6 }}>
            ✓ Safe to close or refresh — your job is saved. Come back anytime and it will continue from where it left off.
          </div>
        </div>
      </div>
    );
  }

  // Main page - country picker + history
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Scout available leads</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Pick a country, choose how many to verify, then scout directly. Claimed emails are permanently removed from the pool.
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--red)', fontSize: 13, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 24 }}>
        {[{ id: 'new', label: '🎯 New batch' }, { id: 'history', label: '📋 My history' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? 'var(--bg2)' : 'transparent', color: tab === t.id ? 'var(--text)' : 'var(--text-muted)', border: tab === t.id ? '1px solid var(--border-mid)' : '1px solid transparent', padding: '8px 18px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* New batch tab */}
      {tab === 'new' && (
        <div className="animate-in">
          {loadingCountries ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ fontSize: 20 }}>↻</span>
            </div>
          ) : countries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              No leads available right now. Ask an admin to upload more.
            </div>
          ) : (
            <>
              {/* Country grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                {countries.map(c => (
                  <div key={c.country} onClick={() => setSelected(c)}
                    style={{ background: selected?.country === c.country ? 'var(--accent)' : 'var(--bg2)', border: `1.5px solid ${selected?.country === c.country ? 'var(--accent)' : 'var(--border-mid)'}`, borderRadius: 'var(--radius-lg)', padding: '20px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected?.country === c.country ? 'var(--shadow-md)' : 'var(--shadow-sm)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: selected?.country === c.country ? '#fff' : 'var(--text)', marginBottom: 6 }}>{c.country}</div>
                    <div style={{ fontSize: 13, color: selected?.country === c.country ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', marginBottom: 12 }}>{c.name || c.country}</div>
                    <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700, color: selected?.country === c.country ? 'rgba(255,255,255,0.95)' : 'var(--green)', marginBottom: 2 }}>
                      {c.available.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: selected?.country === c.country ? 'rgba(255,255,255,0.5)' : 'var(--text-dim)', fontFamily: 'DM Mono' }}>available</div>
                  </div>
                ))}
              </div>

              {/* Amount picker */}
              {selected && (
                <div className="animate-in" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {selected.flag} {selected.name} selected
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                    {selected.available.toLocaleString()} available · Daily limit: 3,000 per user
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 10 }}>How many to verify?</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {AMOUNTS.filter(a => a <= selected.available).map(a => (
                        <button key={a} onClick={() => setAmount(a)}
                          style={{ background: amount === a ? 'var(--accent)' : 'var(--bg3)', color: amount === a ? '#fff' : 'var(--text-muted)', border: `1px solid ${amount === a ? 'var(--accent)' : 'var(--border)'}`, padding: '8px 18px', borderRadius: 9, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                          {a.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Custom:</span>
                      <input type="number" min={100} max={Math.min(2000, selected.available)} value={amount}
                        onChange={e => setAmount(Math.min(2000, Math.max(100, Number(e.target.value))))}
                        style={{ width: 100, padding: '8px 12px', fontSize: 13 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>100–2000</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--amber)', lineHeight: 1.6 }}>
                    ⚠ <strong>{amount.toLocaleString()} {selected.name} leads</strong> will be permanently claimed. The page is safe to close — your job continues on the server.
                  </div>

                  <button className="btn-primary" onClick={handleStart} disabled={starting || amount < 100}
                    style={{ padding: '13px 28px', fontSize: 14 }}>
                    {starting ? <><span className="spinner" style={{ marginRight: 8 }}>↻</span>Starting...</> : `Verify ${amount.toLocaleString()} ${selected.name} leads →`}
                  </button>
                </div>
              )}

              {!selected && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: 13 }}>
                  Select a country above to continue
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="animate-in">
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ fontSize: 20 }}>↻</span>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              No lead jobs yet. Start a new batch to see your history here.
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '4px 20px', boxShadow: 'var(--shadow-sm)' }}>
              {resuming && (
                <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner">↻</span> Loading results...
                </div>
              )}
              {history.map((job, i) => (
                <HistoryRow key={job.id || i} job={job} onResume={handleResume} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
