import { useState, useRef, useEffect } from 'react';
import ScoutMode from '../pages/ScoutMode';
import { verifyBulk, pollJob, exportUrl } from '../api';

const PREVIEW_LIMIT = 20;

const CATEGORIES = [
  { key: 'delivers', label: '✅ Delivers',    desc: 'Safe to send',        color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', filter: r => r.category === 'delivers' },
  { key: 'unknown',  label: '⚠️ Unconfirmed', desc: 'Send with caution',   color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)', filter: r => r.category === 'unknown'  },
  { key: 'bounce',   label: '❌ Bounce',       desc: 'Do not send',         color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)',   filter: r => r.category === 'bounce'   },
  { key: 'all',      label: 'All',            desc: 'Every email',         color: 'var(--text)',  bg: 'var(--bg3)',      border: 'var(--border-mid)',   filter: () => true },
];

function SmtpBadge({ val }) {
  if (val === true)  return <span className="badge badge-valid">250 OK</span>;
  if (val === false) return <span className="badge badge-invalid">Rejected</span>;
  return <span className="badge badge-null">Timeout</span>;
}

function ResultsPanel({ results, jobId, onReset }) {
  const [activeTab, setActiveTab] = useState('delivers');
  const [scouting, setScouting] = useState(false);
  if (scouting) {
    const deliverEmails = results.filter(r => r.category === 'delivers').map(r => r.email);
    return <ScoutMode emails={deliverEmails} onBack={() => setScouting(false)} />;
  }

  const cat = CATEGORIES.find(c => c.key === activeTab);
  const filtered = results.filter(cat.filter);
  const preview = filtered.slice(0, PREVIEW_LIMIT);
  const remaining = filtered.length - preview.length;
  const counts = {};
  CATEGORIES.forEach(c => { counts[c.key] = results.filter(c.filter).length; });

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Verification complete</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{results.length.toLocaleString()} emails processed</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {CATEGORIES.filter(c => c.key !== 'all').map(c => (
          <div key={c.key} onClick={() => setActiveTab(c.key)}
            style={{
              background: activeTab === c.key ? c.bg : 'var(--bg2)',
              border: `1px solid ${activeTab === c.key ? c.border : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)', padding: '16px 18px', cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: activeTab === c.key ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            }}>
            <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 700, color: activeTab === c.key ? c.color : 'var(--text)', letterSpacing: '-0.02em' }}>
              {counts[c.key].toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: activeTab === c.key ? c.color : 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginTop: 1 }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', padding: 3, marginBottom: 14, overflowX: 'auto' }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActiveTab(c.key)}
            style={{
              flex: 1, background: activeTab === c.key ? 'var(--bg2)' : 'transparent',
              color: activeTab === c.key ? c.color : 'var(--text-muted)',
              border: activeTab === c.key ? `1px solid ${c.border}` : '1px solid transparent',
              padding: '8px 10px', borderRadius: 9,
              fontFamily: 'Syne', fontWeight: 600, fontSize: 12,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              boxShadow: activeTab === c.key ? 'var(--shadow-sm)' : 'none',
            }}>
            {c.key === 'all' ? `All (${counts[c.key].toLocaleString()})` : `${c.label} (${counts[c.key].toLocaleString()})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 13 }}>No emails in this category</div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border-mid)' }}>
                <th style={{ padding: '10px 18px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</th>
                <th style={{ padding: '10px 18px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SMTP</th>
                <th style={{ padding: '10px 18px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '10px 18px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => {
                const catInfo = CATEGORIES.find(c => c.key === r.category) || CATEGORIES[3];
                return (
                  <tr key={i} style={{ borderBottom: i < preview.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 18px', fontFamily: 'DM Mono', fontSize: 12 }}>{r.email}</td>
                    <td style={{ padding: '12px 18px' }}><SmtpBadge val={r.smtp_valid} /></td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ background: catInfo.bg, color: catInfo.color, border: `1px solid ${catInfo.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'DM Mono' }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
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

          {remaining > 0 && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
                Showing {PREVIEW_LIMIT} of {filtered.length.toLocaleString()} — {remaining.toLocaleString()} more below
              </span>
              <a href={exportUrl(jobId, activeTab)} download style={{ textDecoration: 'none' }}>
                <button className="btn-export">↓ Download all {filtered.length.toLocaleString()} emails</button>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Download section */}
      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Download clean email lists (emails only, no extra columns)
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <a key={c.key} href={exportUrl(jobId, c.key)} download style={{ textDecoration: 'none' }}>
              <button className="btn-export">
                ↓ {c.key === 'all' ? 'All' : c.label} ({counts[c.key].toLocaleString()})
              </button>
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button
          onClick={() => setScouting(true)}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius)', fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
          📨 Scout delivers ({results.filter(r => r.category === 'delivers').length.toLocaleString()} emails) →
        </button>
        <button className="btn-ghost" onClick={onReset}>← Verify another list</button>
      </div>
    </div>
  );
}

export default function BulkVerify() {
  const [mode, setMode]         = useState('upload');
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [job, setJob]           = useState(null);
  const [error, setError]       = useState('');
  const fileRef  = useRef();
  const pollRef  = useRef();

  const handleFile = f => {
    if (!f || !f.name.endsWith('.csv')) { setError('Only .csv files accepted'); return; }
    setFile(f); setError('');
  };

  const pasteToFile = () => {
    const lines = pasteText.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'));
    if (!lines.length) { setError('No valid emails found'); return null; }
    return new File(['email\n' + lines.join('\n')], 'pasted_emails.csv', { type: 'text/csv' });
  };

  const handleStart = async () => {
    setUploading(true); setError(''); setJob(null);
    try {
      const uploadFile = mode === 'paste' ? pasteToFile() : file;
      if (!uploadFile) { setUploading(false); return; }
      const data = await verifyBulk(uploadFile);
      setJob({ id: data.job_id, total: data.total, progress: 0, status: 'processing', results: [] });
    } catch (e) {
      setError(e.message || 'Upload failed. Make sure the backend is running.');
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!job || job.status === 'done') { setUploading(false); return; }
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollJob(job.id);
        setJob(prev => ({ ...prev, ...data }));
        if (data.status === 'done') { clearInterval(pollRef.current); setUploading(false); }
      } catch {}
    }, 1500);
    return () => clearInterval(pollRef.current);
  }, [job?.id, job?.status]);

  const reset = () => { setFile(null); setJob(null); setError(''); setUploading(false); setPasteText(''); };

  const emailCount = mode === 'paste' ? pasteText.split(/[\n,;]+/).filter(e => e.trim().includes('@')).length : null;
  const pct = job ? Math.min(Math.round((job.progress / (job.total || 1)) * 100), 100) : 0;
  const canStart = mode === 'upload' ? !!file : pasteText.trim().length > 0;

  if (job?.status === 'done' && job.results?.length > 0) {
    return <ResultsPanel results={job.results} jobId={job.id} onReset={reset} />;
  }

  if (job) {
    return (
      <div className="animate-in">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 5, letterSpacing: '-0.02em' }}>Verifying your list...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{job.progress?.toLocaleString() || 0} of {job.total?.toLocaleString()} emails checked</p>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', padding: '28px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text-muted)' }} className="pulse">Processing...</div>
            <div style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{pct}%</div>
          </div>
          <div style={{ height: 8, background: 'var(--bg4)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>
            <span>30 threads running</span><span>·</span><span>~2k–8k emails/hr</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 5, letterSpacing: '-0.02em' }}>Bulk verify</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Upload a CSV or paste emails. Downloads are clean email lists — no extra columns.</p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', padding: 3, width: 'fit-content', marginBottom: 22 }}>
        {[{ id: 'upload', label: '⬆ Upload CSV' }, { id: 'paste', label: '📋 Paste emails' }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setError(''); }}
            style={{
              background: mode === m.id ? 'var(--bg2)' : 'transparent',
              color: mode === m.id ? 'var(--text)' : 'var(--text-muted)',
              border: mode === m.id ? '1px solid var(--border-mid)' : '1px solid transparent',
              padding: '8px 20px', borderRadius: 9,
              fontFamily: 'Syne', fontWeight: 600, fontSize: 12,
              boxShadow: mode === m.id ? 'var(--shadow-sm)' : 'none',
            }}>{m.label}</button>
        ))}
      </div>

      {mode === 'upload' && (
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current.click()}
          style={{ border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border-mid)'}`, borderRadius: 'var(--radius-lg)', padding: '44px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: dragging ? 'var(--bg3)' : file ? 'var(--green-bg)' : 'var(--bg3)', marginBottom: 16 }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ fontSize: 30, marginBottom: 10 }}>{file ? '📄' : '☁'}</div>
          {file ? (
            <>
              <div className="mono" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500, marginBottom: 3 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · click to change</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Drop your CSV here</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>or click to browse · one email per row · first column</div>
            </>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <div style={{ marginBottom: 16 }}>
          <textarea placeholder={`Paste emails — one per line or comma separated:\n\njohn@acme.com\nsales@company.com\ncontact@brand.io`} value={pasteText} onChange={e => setPasteText(e.target.value)} />
          {emailCount > 0 && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono' }}>✓ {emailCount.toLocaleString()} email{emailCount !== 1 ? 's' : ''} detected</div>}
        </div>
      )}

      {error && <div style={{ marginBottom: 14, background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', padding: '10px 16px', color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn-primary" onClick={handleStart} disabled={!canStart || uploading}>
          {uploading ? <><span className="spinner" style={{ marginRight: 6 }}>↻</span>Starting...</> : 'Start verification →'}
        </button>
        {(file || pasteText) && <button className="btn-ghost" onClick={reset}>Clear</button>}
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 18, fontSize: 12, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>
        <span>30 threads</span><span>·</span><span>~2k–8k/hr</span><span>·</span><span>SMTP + MX + catch-all</span>
      </div>
    </div>
  );
}
