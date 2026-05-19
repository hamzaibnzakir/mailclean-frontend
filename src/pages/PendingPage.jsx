import { useAuth } from '../context/AuthContext';

export default function PendingPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>✉</div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>MailClean</span>
      </div>

      <div style={{ width: '100%', maxWidth: 480, background: 'var(--bg2)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-xl)', padding: '40px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>

        <div style={{ width: 60, height: 60, background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>⏳</div>

        <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>
          Awaiting approval
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Hey <strong>{user?.name}</strong>, your account is pending approval from an admin.<br />
          You'll get access once your account is verified.
        </p>

        {/* Demo preview */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 28, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview — what you'll get access to</div>
          {[
            { icon: '✉', text: 'Single email SMTP verification' },
            { icon: '📋', text: 'Bulk verify up to 50,000 emails' },
            { icon: '✅', text: 'Delivers / Unconfirmed / Bounce grouping' },
            { icon: '↓', text: 'Clean email list exports per category' },
            { icon: '📊', text: 'Deliverability score per email' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 15 }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        <button className="btn-ghost" onClick={logout} style={{ width: '100%' }}>Sign out</button>
      </div>
    </div>
  );
}
