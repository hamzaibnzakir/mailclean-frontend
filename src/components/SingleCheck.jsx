import { useState, useEffect, useRef } from 'react';
import { verifySingle } from '../api';

const STEPS = [
  'Validating email format...',
  'Looking up MX records...',
  'Connecting to mail server...',
  'Validating recipient mailbox...',
  'Finalising result...',
];

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

function detectTypo(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  for (const d of COMMON_DOMAINS) {
    if (domain === d) return null;
    const similarity = [...d].filter((c, i) => domain[i] === c).length / d.length;
    if (similarity > 0.7 && domain !== d) {
      return `${parts[0]}@${d}`;
    }
  }
  return null;
}

function getSmtpMessage(val, message) {
  if (val === true) return 'Mailbox confirmed by destination server';
  if (val === false) {
    if (message?.includes('550')) return 'Mailbox rejected by destination server (550)';
    if (message?.includes('551')) return 'User not local — forwarding failed (551)';
    if (message?.includes('553')) return 'Mailbox name not allowed (553)';
    return 'Delivery likely to fail — ' + (message || 'server rejected');
  }
  return 'Server timed out — could not confirm or deny mailbox';
}

function getCategory(result) {
  const cat = result.category;
  if (cat === 'delivers') return { label: 'Safe to send', color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' };
  if (cat === 'unknown')  return { label: 'Unconfirmed', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' };
  return { label: 'Invalid mailbox', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' };
}

function getSendable(result) {
  const cat = result.category;
  if (cat === 'delivers') return { answer: 'YES', color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' };
  if (cat === 'unknown')  return { answer: 'MAYBE', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' };
  return { answer: 'NO', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)' };
}

function getScore(result) {
  let score = 0;
  if (result.format_valid) score += 20;
  if (result.mx_valid)     score += 25;
  if (result.smtp_valid === true)  score += 40;
  if (result.smtp_valid === null)  score += 20;
  if (!result.disposable)  score += 10;
  if (!result.catch_all)   score += 5;
  return Math.min(score, 100);
}

function scoreColor(s) {
  if (s >= 75) return 'var(--green)';
  if (s >= 45) return 'var(--amber)';
  return 'var(--red)';
}

function CheckRow({ ok, label, value, valueClass }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: ok === true ? 'var(--green)' : ok === false ? 'var(--red)' : 'var(--amber)', fontWeight: 600, minWidth: 14 }}>
          {ok === true ? '✓' : ok === false ? '✕' : '~'}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      </div>
      <span className={`badge ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function SingleCheck() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [step, setStep]       = useState(0);
  const [typo, setTypo]       = useState(null);
  const stepRef = useRef(null);

  useEffect(() => {
    if (loading) {
      setStep(0);
      let i = 0;
      stepRef.current = setInterval(() => {
        i++;
        if (i < STEPS.length - 1) setStep(i);
      }, 1400);
    } else {
      clearInterval(stepRef.current);
      setStep(STEPS.length - 1);
    }
    return () => clearInterval(stepRef.current);
  }, [loading]);

  const handleVerify = async (emailToVerify) => {
    const target = emailToVerify || email.trim();
    if (!target) return;
    setLoading(true); setError(''); setResult(null); setTypo(null);
    try {
      const data = await verifySingle(target);
      setResult(data);
    } catch {
      setError('Could not reach the API. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val) => {
    setEmail(val);
    setTypo(null);
    setResult(null);
  };

  const handleBlur = () => {
    if (email.includes('@')) {
      const suggestion = detectTypo(email);
      if (suggestion) setTypo(suggestion);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 5, letterSpacing: '-0.02em' }}>Single email check</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Full SMTP handshake + MX lookup + deliverability score. Takes 3–10 seconds.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: typo ? 10 : 20 }}>
        <input
          type="email"
          placeholder="john@company.com"
          value={email}
          onChange={e => handleInput(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
        />
        <button className="btn-primary" onClick={() => handleVerify()} disabled={loading || !email.trim()} style={{ whiteSpace: 'nowrap', minWidth: 120 }}>
          {loading ? <><span className="spinner" style={{ marginRight: 6 }}>↻</span>Checking</> : 'Verify →'}
        </button>
      </div>

      {/* Typo suggestion */}
      {typo && !loading && !result && (
        <div className="slide-in" style={{ marginBottom: 16, background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--amber)' }}>Did you mean <strong>{typo}</strong>?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEmail(typo); setTypo(null); }} style={{ background: 'var(--amber)', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontFamily: 'Syne', fontWeight: 600 }}>Use this</button>
            <button onClick={() => setTypo(null)} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--amber-border)', padding: '5px 10px', borderRadius: 7, fontSize: 12, fontFamily: 'Syne' }}>No</button>
          </div>
        </div>
      )}

      {/* Loading steps */}
      {loading && (
        <div style={{ marginBottom: 20, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', opacity: i > step ? 0.3 : 1, transition: 'opacity 0.3s' }}>
              <span style={{ fontSize: 12, color: i < step ? 'var(--green)' : i === step ? 'var(--accent)' : 'var(--text-dim)', fontWeight: 600 }}>
                {i < step ? '✓' : i === step ? <span className="spinner">↻</span> : '○'}
              </span>
              <span style={{ fontSize: 13, color: i === step ? 'var(--text)' : 'var(--text-muted)' }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--red)', fontSize: 13 }}>{error}</div>
      )}

      {result?.multiple && (
        <div className="animate-in">
          <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text-muted)", fontFamily: "DM Mono" }}>
            Found {result.results.length} emails — showing all results:
          </div>
          {result.results.map((r, i) => {
            const c = getCategory(r);
            const score = getScore(r);
            return (
              <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 10, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 13 }}>{r.email}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "DM Mono" }}>{score}/100</span>
                    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontFamily: "DM Mono" }}>{c.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{getSmtpMessage(r.smtp_valid, r.message)}</div>
              </div>
            );
          })}
        </div>
      )}

      {result && !result.multiple && (
        <div className="animate-in">
          {/* Header card */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{result.email}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getSmtpMessage(result.smtp_valid, result.message)}</div>
              </div>
              {(() => { const c = getCategory(result); return (
                <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontFamily: 'DM Mono', fontWeight: 500 }}>
                  {c.label}
                </span>
              ); })()}
            </div>

            {/* Safe to send + Score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Sendable */}
              {(() => { const s = getSendable(result); return (
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Safe to send marketing emails?</div>
                  <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: s.color }}>{s.answer}</div>
                </div>
              ); })()}

              {/* Score */}
              {(() => { const score = getScore(result); const col = scoreColor(score); return (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deliverability score</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: col }}>{score}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 3 }}>/100</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: col, borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ); })()}
            </div>
          </div>

          {/* Check rows */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '4px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <CheckRow ok={result.format_valid} label="Format" value={result.format_valid ? 'Valid' : 'Invalid'} valueClass={result.format_valid ? 'badge-valid' : 'badge-invalid'} />
            <CheckRow ok={result.mx_valid} label="MX records" value={result.mx_valid ? 'Found' : 'Not found'} valueClass={result.mx_valid ? 'badge-valid' : 'badge-invalid'} />
            <CheckRow
              ok={result.smtp_valid === true ? true : result.smtp_valid === false ? false : null}
              label="SMTP response"
              value={result.smtp_valid === true ? '250 OK' : result.smtp_valid === false ? 'Rejected' : 'Timeout'}
              valueClass={result.smtp_valid === true ? 'badge-valid' : result.smtp_valid === false ? 'badge-invalid' : 'badge-null'}
            />
            <CheckRow ok={!result.catch_all} label="Catch-all domain" value={result.catch_all ? 'Yes' : 'No'} valueClass={result.catch_all ? 'badge-null' : 'badge-valid'} />
            <CheckRow ok={!result.disposable} label="Disposable" value={result.disposable ? 'Yes' : 'No'} valueClass={result.disposable ? 'badge-invalid' : 'badge-valid'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 14 }}>—</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Role-based</span>
              </div>
              <span className={`badge ${result.role_based ? 'badge-null' : 'badge-valid'}`}>{result.role_based ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
