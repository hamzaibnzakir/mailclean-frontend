import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_RESULTS = [
  { email: 'contact@shopify.com',    category: 'delivers', smtp_valid: true,  risk: 'LOW',    catch_all: false, disposable: false, message: 'Mailbox confirmed' },
  { email: 'hello@dryseason.com.au', category: 'delivers', smtp_valid: null,  risk: 'LOW',    catch_all: false, disposable: false, message: 'Server timed out' },
  { email: 'info@mailinator.com',    category: 'bounce',   smtp_valid: false, risk: 'HIGH',   catch_all: false, disposable: true,  message: 'Disposable domain' },
  { email: 'sales@amazon.com',       category: 'unknown',  smtp_valid: true,  risk: 'MEDIUM', catch_all: true,  disposable: false, message: 'Catch-all domain' },
  { email: 'notreal@fakeco.xyz',     category: 'bounce',   smtp_valid: false, risk: 'HIGH',   catch_all: false, disposable: false, message: 'No MX records' },
  { email: 'founder@luma.com',       category: 'delivers', smtp_valid: true,  risk: 'LOW',    catch_all: false, disposable: false, message: 'Mailbox confirmed' },
];

const CAT = {
  delivers: { label: '✅ Delivers',    color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
  unknown:  { label: '⚠️ Unconfirmed', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  bounce:   { label: '❌ Bounce',       color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)'   },
};

const FEATURES = [
  { icon: '🔍', title: 'SMTP verification',       desc: 'Real handshake with destination mail servers to confirm mailbox exists' },
  { icon: '📡', title: 'MX record lookup',         desc: 'Checks if the domain actually has mail servers configured' },
  { icon: '🎯', title: 'Catch-all detection',      desc: 'Identifies domains that accept all emails regardless of mailbox' },
  { icon: '🚫', title: 'Disposable email filter',  desc: 'Detects throwaway email services like Mailinator, TempMail' },
  { icon: '📊', title: 'Deliverability score',     desc: 'Scores each email 0–100 based on all verification signals' },
  { icon: '📨', title: 'Scout mode',               desc: 'Group verified emails into batches of 45 and track email opens' },
];

export default function DemoPage({ onRequestAccess }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('delivers');
  const counts = {
    delivers: DEMO_RESULTS.filter(r => r.category === 'delivers').length,
    unknown:  DEMO_RESULTS.filter(r => r.category === 'unknown').length,
    bounce:   DEMO_RESULTS.filter(r => r.category === 'bounce').length,
    all:      DEMO_RESULTS.length,
  };
  const filtered = activeTab === 'all' ? DEMO_RESULTS : DEMO_RESULTS.filter(r => r.category === activeTab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>✉</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>MailClean</span>
            <span style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: 5, padding: '1px 8px', fontSize: 10, fontFamily: 'DM Mono' }}>DEMO</span>
          </div>
          <button className="btn-ghost" onClick={logout} style={{ padding: '6px 14px', fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* Approval banner */}
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⏳</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, color: 'var(--amber)', marginBottom: 2 }}>Your account is pending approval</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>An admin will review your request shortly. Explore the demo below while you wait.</div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12 }}>
            Know if your email lands<br />
            <span style={{ color: 'var(--text-dim)' }}>before you hit send.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 420, margin: '0 auto 28px' }}>
            MailClean verifies every email before you scout — so your team only reaches real inboxes.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 20, padding: '6px 16px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
            SMTP · MX · CATCH-ALL · DISPOSABLE · RISK SCORING · OPEN TRACKING
          </div>
        </div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 36 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Demo results */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: 32 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Demo — bulk verify results</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This is what your team sees after verifying a list</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'delivers', label: `✅ ${counts.delivers}` },
                { key: 'unknown',  label: `⚠️ ${counts.unknown}` },
                { key: 'bounce',   label: `❌ ${counts.bounce}` },
                { key: 'all',      label: `All ${counts.all}` },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ background: activeTab === t.key ? 'var(--accent)' : 'var(--bg3)', color: activeTab === t.key ? '#fff' : 'var(--text-muted)', border: `1px solid ${activeTab === t.key ? 'var(--accent)' : 'var(--border)'}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border-mid)' }}>
                {['Email', 'SMTP', 'Status', 'Flags'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const c = CAT[r.category];
                return (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontFamily: 'DM Mono', fontSize: 12 }}>{r.email}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span className={`badge ${r.smtp_valid === true ? 'badge-valid' : r.smtp_valid === false ? 'badge-invalid' : 'badge-null'}`}>
                        {r.smtp_valid === true ? '250 OK' : r.smtp_valid === false ? 'Rejected' : 'Timeout'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'DM Mono' }}>{r.category}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {r.disposable && <span style={{ fontSize: 10, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 5, padding: '2px 7px', fontFamily: 'DM Mono' }}>disposable</span>}
                      {r.catch_all  && <span style={{ fontSize: 10, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: 5, padding: '2px 7px', fontFamily: 'DM Mono' }}>catch-all</span>}
                      {!r.disposable && !r.catch_all && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '14px 20px', background: 'var(--bg3)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🔒 Download buttons unlock once your account is approved</span>
            <div style={{ display: 'flex', gap: 6, opacity: 0.4, pointerEvents: 'none' }}>
              {['✅ Delivers', '⚠️ Unconfirmed', '❌ Bounce', 'All'].map(l => (
                <button key={l} className="btn-export" style={{ fontSize: 11 }}>↓ {l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Scout mode preview */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>📨 Scout mode preview</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>After verifying, your team can scout verified emails in batches with progress tracking</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { label: 'Batch size', value: '45 emails', sub: 'customisable' },
              { label: 'Progress tracking', value: '3/8 sent', sub: 'per session' },
              { label: 'Open tracking', value: '34% opens', sub: 'per batch' },
              { label: 'Templates', value: '3 built-in', sub: 'or write your own' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>Your account is in review. You'll get an email once approved.</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>Reach out to an admin on your team if you need faster access.</div>
        </div>
      </div>
    </div>
  );
}
