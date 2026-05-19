import { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DemoPage from './pages/DemoPage';
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import LeadsPage from './pages/LeadsPage';
import SingleCheck from './components/SingleCheck';
import BulkVerify from './components/BulkVerify';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',    icon: '📊' },
  { id: 'single',    label: 'Single check',  icon: '✉' },
  { id: 'bulk',      label: 'Bulk verify',   icon: '📋' },
  { id: 'leads',     label: 'Scout leads',   icon: '🎯' },
  { id: 'settings',  label: 'Settings',      icon: '⚙' },
];

function Sidebar({ tab, setTab, user, onAdmin, onLogout }) {
  const isAdmin = ['admin', 'main_admin'].includes(user?.role);
  return (
    <div style={{
      width: 220, flexShrink: 0, background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15 }}>✉</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>MailClean</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>v2.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Menu</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: tab === item.id ? 'var(--bg3)' : 'transparent',
              color: tab === item.id ? 'var(--text)' : 'var(--text-muted)',
              border: tab === item.id ? '1px solid var(--border-mid)' : '1px solid transparent',
              borderRadius: 10, padding: '10px 12px', marginBottom: 4,
              fontFamily: 'Syne', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {isAdmin && (
          <>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', padding: '14px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</div>
            <button onClick={onAdmin}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--amber-bg)', color: 'var(--amber)',
                border: '1px solid var(--amber-border)',
                borderRadius: 10, padding: '10px 12px',
                fontFamily: 'Syne', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', textAlign: 'left',
              }}>
              <span style={{ fontSize: 16 }}>⚙</span>
              User management
            </button>
          </>
        )}
      </div>

      {/* User + status */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>API live</span>
        </div>
        <button onClick={onLogout} className="btn-ghost"
          style={{ width: '100%', padding: '8px', fontSize: 12, textAlign: 'center' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function MobileNav({ tab, setTab, user, onAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const isAdmin = ['admin', 'main_admin'].includes(user?.role);
  return (
    <>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>✉</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>MailClean</span>
          </div>
          <button onClick={() => setOpen(o => !o)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'Syne', fontWeight: 600, color: 'var(--text)' }}>
            {open ? '✕' : '☰'}
          </button>
        </div>
        {/* Mobile tab bar */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setOpen(false); }}
              style={{
                flex: 1, padding: '10px 4px', background: 'transparent',
                color: tab === item.id ? 'var(--text)' : 'var(--text-dim)',
                border: 'none', borderBottom: `2px solid ${tab === item.id ? 'var(--accent)' : 'transparent'}`,
                fontFamily: 'Syne', fontWeight: 600, fontSize: 11, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)}>
          <div style={{ position: 'absolute', top: 52, right: 0, left: 0, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 16px', boxShadow: 'var(--shadow-md)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--bg3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>{user?.email}</div>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => { onAdmin(); setOpen(false); }}
                style={{ width: '100%', background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: 9, padding: '10px 14px', fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚙ User management
              </button>
            )}
            <button onClick={onLogout} className="btn-ghost" style={{ width: '100%', padding: '10px', fontSize: 13 }}>Sign out</button>
          </div>
        </div>
      )}
    </>
  );
}

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab]         = useState('dashboard');
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <span className="spinner" style={{ fontSize: 24, color: 'var(--text-dim)' }}>↻</span>
    </div>
  );

  if (!user) return <LoginPage />;
  if (user.status === 'pending')   return <DemoPage />;
  if (user.status === 'suspended') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 40 }}>⛔</div>
      <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>Account suspended</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>Contact an admin to restore access.</div>
      <button className="btn-ghost" onClick={logout}>Sign out</button>
    </div>
  );
  if (user.status === 'banned') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 40 }}>🚫</div>
      <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>Account banned</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>This account has been permanently banned.</div>
      <button className="btn-ghost" onClick={logout}>Sign out</button>
    </div>
  );

  if (showAdmin) return <AdminPage onBack={() => setShowAdmin(false)} />;

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Sidebar — desktop only */}
      {!isMobile && (
        <Sidebar
          tab={tab} setTab={setTab} user={user}
          onAdmin={() => setShowAdmin(true)} onLogout={logout}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Mobile nav */}
        {isMobile && (
          <MobileNav
            tab={tab} setTab={setTab} user={user}
            onAdmin={() => setShowAdmin(true)} onLogout={logout}
          />
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'settings'  && <SettingsPage />}
          {tab === 'leads'     && <LeadsPage />}
          {tab !== 'dashboard' && tab !== 'settings' && tab !== 'leads' && (
            <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '20px 16px 60px' : '32px 32px 80px' }}>

              {/* Page header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: 'Syne', fontSize: isMobile ? 20 : 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
                  {tab === 'single' ? 'Single email check' : 'Bulk verify'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {tab === 'single'
                    ? 'Full SMTP handshake + MX lookup + deliverability score per email'
                    : 'Upload a CSV or paste emails — verified and grouped into delivers, unconfirmed, and bounce'}
                </p>
              </div>

              {/* Stats strip */}
              {tab === 'single' && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'SMTP verified', value: '250 OK or Timeout' },
                    { label: 'MX lookup', value: 'Real-time DNS' },
                    { label: 'Score', value: '0–100 per email' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'bulk' && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Speed', value: '2k–8k/hr' },
                    { label: 'Max batch', value: '50,000 emails' },
                    { label: 'Threads', value: '30 parallel' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tool card */}
              <div className="card animate-in" key={tab} style={{ padding: isMobile ? '20px 18px' : '32px 36px' }}>
                {tab === 'single'   && <SingleCheck />}
                {tab === 'bulk'   && <BulkVerify />}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>
                <span>api.brainboxecomlab.com</span>
                <span>MailClean © {new Date().getFullYear()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
