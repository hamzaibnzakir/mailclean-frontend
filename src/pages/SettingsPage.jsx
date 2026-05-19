import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SETTINGS = {
  tracking_enabled: false,
  default_batch_size: 45,
  default_template: 0,
  email_client: 'gmail',
  compact_results: false,
  show_role_based: true,
  auto_scout: false,
};

function loadSettings() {
  try {
    const s = localStorage.getItem('mc_settings');
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(patch) {
  const current = loadSettings();
  const updated = { ...current, ...patch };
  localStorage.setItem('mc_settings', JSON.stringify(updated));
  return updated;
}

export function getSetting(key) {
  return loadSettings()[key];
}

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 99,
        background: value ? 'var(--accent)' : 'var(--bg4)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--border-mid)'}`,
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────
function SettingRow({ label, desc, children, warning }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
          {warning && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--amber)', fontFamily: 'DM Mono', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
              {warning}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, desc }) {
  return (
    <div style={{ marginTop: 28, marginBottom: 4 }}>
      <div style={{ fontFamily: 'Syne', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{desc}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved]       = useState(false);

  const update = (key, value) => {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 3 }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Manage your preferences and account</p>
        </div>
        {saved && (
          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono' }}>
            ✓ Saved
          </div>
        )}
      </div>

      {/* Account section */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        <SectionHeader title="Account" />
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{user?.email}</div>
            </div>
            <span style={{
              background: user?.role === 'main_admin' ? 'var(--amber-bg)' : user?.role === 'admin' ? 'var(--blue-bg)' : 'var(--bg3)',
              color: user?.role === 'main_admin' ? 'var(--amber)' : user?.role === 'admin' ? 'var(--blue)' : 'var(--text-muted)',
              border: `1px solid ${user?.role === 'main_admin' ? 'var(--amber-border)' : user?.role === 'admin' ? 'var(--blue-border)' : 'var(--border)'}`,
              borderRadius: 20, padding: '3px 12px', fontSize: 11, fontFamily: 'DM Mono',
            }}>{user?.role}</span>
          </div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <button onClick={logout} style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', padding: '9px 18px', borderRadius: 9, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Scout settings */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        <SectionHeader title="Scout mode" desc="Controls how your team sends and tracks emails" />

        <SettingRow label="Default batch size" desc="How many emails per batch when scouting. You can always change this per session.">
          <select value={settings.default_batch_size} onChange={e => update('default_batch_size', Number(e.target.value))}
            style={{ width: 90, padding: '7px 10px', fontSize: 13, borderRadius: 8 }}>
            {[25, 45, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </SettingRow>

        <SettingRow label="Email client" desc="Which email app your team uses to send scout emails.">
          <select value={settings.email_client} onChange={e => update('email_client', e.target.value)}
            style={{ width: 130, padding: '7px 10px', fontSize: 13, borderRadius: 8 }}>
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook</option>
            <option value="other">Other</option>
          </select>
        </SettingRow>

        <SettingRow label="Auto-proceed to scout" desc="After bulk verify completes, automatically open Scout mode without clicking the button.">
          <Toggle value={settings.auto_scout} onChange={v => update('auto_scout', v)} />
        </SettingRow>
      </div>

      {/* Open tracking */}
      <div style={{ background: 'var(--bg2)', border: `1px solid ${settings.tracking_enabled ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.2s' }}>
        <SectionHeader title="Open tracking" />

        <SettingRow
          label="Enable email open tracking"
          desc="Track how many recipients open your scouted emails. Requires an extra step when sending."
          warning={settings.tracking_enabled ? '⚠ Requires using the HTML email file method — see instructions below' : null}
        >
          <Toggle value={settings.tracking_enabled} onChange={v => update('tracking_enabled', v)} />
        </SettingRow>

        {/* Tracking explanation — only shown when enabled */}
        {settings.tracking_enabled && (
          <div className="animate-in" style={{ marginTop: 16, background: 'var(--bg3)', border: '1px solid var(--border-mid)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>How open tracking works</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { n: '1', title: 'Invisible pixel', desc: 'A 1×1 transparent image is embedded at the bottom of your email body. It\'s invisible to the recipient.' },
                { n: '2', title: 'Open recorded', desc: 'When someone opens your email, their email client loads the image. Our server records the open with a timestamp.' },
                { n: '3', title: 'Gmail plain text problem', desc: 'Gmail compose treats pasted content as plain text — it shows the image tag as visible text instead of rendering it as an image. This breaks tracking and looks spammy.' },
                { n: '4', title: 'The workaround', desc: 'We generate a small HTML file for each batch. You open it in your browser, click "Copy Email", then paste into Gmail. Gmail preserves HTML when you paste from a webpage — so the pixel stays invisible.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Syne', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--green)', lineHeight: 1.5 }}>
              <strong>In Scout mode:</strong> When tracking is on, each batch shows a "Download email file" button. Open the file in Chrome or Safari, click Copy, paste into Gmail. Your open stats appear in the Dashboard.
            </div>
          </div>
        )}
      </div>

      {/* Results display */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        <SectionHeader title="Results display" desc="Control what shows up in your verification results" />

        <SettingRow label="Show role-based flag" desc="Flag emails like info@, sales@, admin@ as role-based in results. These are still sendable for store owner outreach.">
          <Toggle value={settings.show_role_based} onChange={v => update('show_role_based', v)} />
        </SettingRow>

        <SettingRow label="Compact results table" desc="Show more rows at once in bulk verify results by reducing row padding.">
          <Toggle value={settings.compact_results} onChange={v => update('compact_results', v)} />
        </SettingRow>
      </div>

      {/* App info */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
        <SectionHeader title="About" />
        <div style={{ padding: '16px 0 0' }}>
          {[
            { label: 'Version', value: 'MailClean v2.0' },
            { label: 'API', value: 'api.brainboxecomlab.com' },
            { label: 'Verification', value: 'SMTP + MX + Catch-all' },
            { label: 'Max batch', value: '50,000 emails' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'var(--text)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
