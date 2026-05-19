import { useState } from 'react';
import { login, signup } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode]       = useState('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const { loginUser }         = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (mode === 'signup' && !name) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      if (mode === 'login') {
        const data = await login(email, password);
        loginUser(data.token, data.user);
      } else {
        await signup(name, email, password);
        setSuccess('Account created! Waiting for admin approval before you can log in.');
        setMode('login');
        setName(''); setEmail(''); setPassword('');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>✉</div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>MailClean</span>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg2)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-xl)', padding: '36px 40px', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
          {mode === 'login' ? 'Sign in to access your dashboard' : 'Request access to MailClean'}
        </p>

        {success && (
          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--green)', fontSize: 13, marginBottom: 20 }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--red)', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: 'Syne' }}>Full name</label>
              <input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: 'Syne' }}>Email address</label>
            <input type="email" placeholder="john@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: 'Syne' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !email || !password || (mode === 'signup' && !name)}
          style={{ width: '100%', marginTop: 24, padding: '14px', fontSize: 14 }}>
          {loading ? <><span className="spinner" style={{ marginRight: 8 }}>↻</span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</> : mode === 'login' ? 'Sign in →' : 'Request access →'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Syne', textDecoration: 'underline', padding: 0 }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>
        Brainbox Ecom Lab · Internal tool
      </p>
    </div>
  );
}
