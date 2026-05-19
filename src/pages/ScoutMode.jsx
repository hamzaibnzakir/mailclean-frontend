import { useState } from 'react';
import { logScout, createTrack } from '../api';
import { getSetting } from './SettingsPage';

const DEFAULT_BATCH_SIZE = 45;

// Generates a local HTML file the user opens in browser
// Copy-pasting from the browser preserves HTML — pixel stays invisible
function generateEmailHTML(bodyText, pixelUrl) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; max-width: 600px; padding: 20px; }
  .instructions { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #856404; }
  .email-body { border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #fff; }
  .copy-btn { background: #000; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; margin-bottom: 16px; }
  .copy-btn:hover { background: #333; }
</style>
</head>
<body>
<div class="instructions">
  <strong>How to use:</strong> Click "Select & Copy Email" below → Open Gmail compose → Paste into body (Ctrl+V or Cmd+V). The tracking pixel is invisible and will be preserved.
</div>
<button class="copy-btn" onclick="copyEmail()">📋 Select & Copy Email Body</button>
<div class="email-body" id="email-content">
${bodyText.split('\n').map(line => line.trim() === '' ? '<br>' : `<p style="margin:0 0 8px 0">${line}</p>`).join('\n')}
<img src="${pixelUrl}" width="1" height="1" style="opacity:0;position:absolute;border:0;outline:0;" alt="">
</div>
<script>
function copyEmail() {
  const el = document.getElementById('email-content');
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('copy');
  sel.removeAllRanges();
  document.querySelector('.copy-btn').textContent = '✓ Copied! Now paste into Gmail';
}
</script>
</body>
</html>`;
}

function downloadEmailHTML(body, pixelUrl, batchNum) {
  const html = generateEmailHTML(body, pixelUrl);
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `batch-${batchNum}-email.html`;
  a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATES = [
  {
    name: 'Delivery question',
    subject: 'Curious about your delivery setup!',
    body: `Hey,

Came across your store while checking out products in the niche.

Wanted to ask — do you guys offer cash on delivery or only prepaid checkout right now?

Also curious how long your average delivery time is these days.

Your product page actually looks really clean btw.`,
  },
  {
    name: 'Collab interest',
    subject: 'Quick question about your store',
    body: `Hey,

Found your store recently and really liked what you're building.

We work with a few brands in this space and I think there could be a solid fit here.

Would you be open to a quick conversation this week? Won't take long.`,
  },
  {
    name: 'Product feedback',
    subject: 'Genuine question from a potential customer',
    body: `Hi there,

I came across your store and had a quick question before I order.

Do you ship internationally, and what does your return process look like if something doesn't fit?

Your branding is really well done by the way — it stands out.`,
  },
  {
    name: 'Custom',
    subject: '',
    body: '',
  },
];

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? 'var(--green-bg)' : 'var(--bg2)',
      color: copied ? 'var(--green)' : 'var(--text-muted)',
      border: `1px solid ${copied ? 'var(--green-border)' : 'var(--border-mid)'}`,
      padding: '7px 14px', borderRadius: 8, fontSize: 12,
      fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    }}>
      {copied ? '✓ Copied' : `Copy ${label}`}
    </button>
  );
}

export default function ScoutMode({ emails, onBack }) {
  // Auto-restore to batches view if they had saved progress
  const hasSavedProgress = Object.keys(saved.sent).length > 0;
  const [step, setStep]             = useState(hasSavedProgress ? 'batches' : 'setup');
  const [batchSize, setBatchSize]   = useState(DEFAULT_BATCH_SIZE);
  const [templateIdx, setTemplateIdx] = useState(0);
  const savedSubject = (() => { try { const s = localStorage.getItem(SCOUT_KEY); return s ? JSON.parse(s).subject || TEMPLATES[0].subject : TEMPLATES[0].subject; } catch { return TEMPLATES[0].subject; } })();
  const [subject, setSubject]       = useState(savedSubject);
  const [body, setBody]             = useState(TEMPLATES[0].body);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [showAddCustom, setShowAddCustom]     = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSubject, setCustomSubject]     = useState('');
  const [customBody, setCustomBody] = useState('');
  // batches initialized above
  const [activeBatch, setActiveBatch] = useState(null);
  const SCOUT_KEY = 'mc_scout_progress';

  // Restore saved progress from localStorage
  const loadSaved = () => {
    try {
      const saved = localStorage.getItem(SCOUT_KEY);
      if (!saved) return { sent: {}, tracks: {} };
      const parsed = JSON.parse(saved);
      // Only restore if same email list (same length as a basic check)
      if (parsed.emailCount === emails.length) {
        return { sent: parsed.sent || {}, tracks: parsed.tracks || {} };
      }
    } catch {}
    return { sent: {}, tracks: {} };
  };

  const saved = loadSaved();
  const [sent, setSent]             = useState(saved.sent);
  const [tracks, setTracks]         = useState(saved.tracks);
  const trackingEnabled             = getSetting('tracking_enabled');

  // Save progress to localStorage whenever sent or tracks changes
  const saveProgress = (newSent, newTracks) => {
    try {
      localStorage.setItem(SCOUT_KEY, JSON.stringify({
        emailCount: emails.length,
        sent: newSent,
        tracks: newTracks,
        savedAt: Date.now(),
      }));
    } catch {}
  };

  const allTemplates = [...TEMPLATES.slice(0, 3), ...customTemplates, TEMPLATES[3]];

  // Auto-generate batches if restoring progress
  const [batches, setBatches] = useState(() => {
    if (!hasSavedProgress) return [];
    const savedBatch = (() => { try { const s = localStorage.getItem(SCOUT_KEY); return s ? JSON.parse(s).batchSize || DEFAULT_BATCH_SIZE : DEFAULT_BATCH_SIZE; } catch { return DEFAULT_BATCH_SIZE; } })();
    const chunks = [];
    for (let i = 0; i < emails.length; i += savedBatch) {
      chunks.push(emails.slice(i, i + savedBatch));
    }
    return chunks;
  });

  const handleTemplateSelect = (idx) => {
    setTemplateIdx(idx);
    const tpl = allTemplates[idx];
    if (tpl && tpl.name !== 'Custom') {
      setSubject(tpl.subject);
      setBody(tpl.body);
    }
  };

  const handleAddCustom = () => {
    if (!customName || !customSubject || !customBody) return;
    const newTpl = { name: customName, subject: customSubject, body: customBody };
    const newCustoms = [...customTemplates, newTpl];
    setCustomTemplates(newCustoms);
    setShowAddCustom(false);
    setCustomName(''); setCustomSubject(''); setCustomBody('');
    // Select the newly added template
    const newIdx = 3 + newCustoms.length - 1;
    setTemplateIdx(newIdx);
    setSubject(newTpl.subject);
    setBody(newTpl.body);
  };

  const handleReady = () => {
    if (!subject.trim() || !body.trim()) return;
    const chunks = [];
    for (let i = 0; i < emails.length; i += batchSize) {
      chunks.push(emails.slice(i, i + batchSize));
    }
    setBatches(chunks);
    // Save subject + batchSize for resume
    try {
      const existing = JSON.parse(localStorage.getItem(SCOUT_KEY) || '{}');
      localStorage.setItem(SCOUT_KEY, JSON.stringify({ ...existing, subject, batchSize, emailCount: emails.length }));
    } catch {}
    setStep('batches');
  };

  const openBatch = async (idx) => {
    setActiveBatch(idx);
    if (!tracks[idx]) {
      const track = await createTrack(idx + 1, batches.length, subject, batches[idx].length);
      if (track) setTracks(prev => ({ ...prev, [idx]: track }));
    }
  };

  const markSent = async (idx) => {
    const newSent = { ...sent, [idx]: new Date().toLocaleTimeString() };
    setSent(newSent);
    saveProgress(newSent, tracks);
    logScout(idx + 1, batches[idx].length, subject, batches.length);
    setActiveBatch(null);
  };

  // Build body with pixel appended
  const bodyWithPixel = (idx) => {
    const track = tracks[idx];
    if (!track) return body;
    const pixel = `<img src="${track.pixel_url}" width="1" height="1" style="opacity:0;position:absolute;" alt="">`;
    return body + '\n\n' + pixel;
  };

  const sentCount  = Object.keys(sent).length;
  const totalCount = batches.length;
  const pct        = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => { try { localStorage.removeItem('mc_scout_progress'); } catch {} onBack(); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>←</button>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Scout mode</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emails.length.toLocaleString()} delivers emails ready</p>
          </div>
        </div>

        {/* Batch size */}
        <div className="card" style={{ marginBottom: 14, padding: '18px 22px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Batch size</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[25, 45, 50, 100].map(n => (
              <button key={n} onClick={() => setBatchSize(n)}
                style={{ background: batchSize === n ? 'var(--accent)' : 'var(--bg3)', color: batchSize === n ? '#fff' : 'var(--text-muted)', border: `1px solid ${batchSize === n ? 'var(--accent)' : 'var(--border)'}`, padding: '8px 18px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
            <input type="number" min={1} max={500} value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}
              style={{ width: 80, padding: '8px 12px', fontSize: 13 }} placeholder="Custom" />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>
            → {Math.ceil(emails.length / batchSize)} batches · ~{batchSize} emails each
          </div>
        </div>

        {/* Templates */}
        <div className="card" style={{ marginBottom: 14, padding: '18px 22px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Email template</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {allTemplates.map((t, i) => (
              <button key={i} onClick={() => handleTemplateSelect(i)}
                style={{ background: templateIdx === i ? 'var(--accent)' : 'var(--bg3)', color: templateIdx === i ? '#fff' : 'var(--text-muted)', border: `1px solid ${templateIdx === i ? 'var(--accent)' : 'var(--border)'}`, padding: '7px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                {t.name}
              </button>
            ))}
            <button onClick={() => setShowAddCustom(s => !s)}
              style={{ background: showAddCustom ? 'var(--green-bg)' : 'var(--bg3)', color: showAddCustom ? 'var(--green)' : 'var(--text-muted)', border: `1px solid ${showAddCustom ? 'var(--green-border)' : 'var(--border)'}`, padding: '7px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              + Add custom
            </button>
          </div>

          {/* Add custom template form */}
          {showAddCustom && (
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>New template</div>
              <input placeholder="Template name" value={customName} onChange={e => setCustomName(e.target.value)} />
              <input placeholder="Subject line" value={customSubject} onChange={e => setCustomSubject(e.target.value)} />
              <textarea placeholder="Email body..." value={customBody} onChange={e => setCustomBody(e.target.value)} style={{ minHeight: 100 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddCustom} disabled={!customName || !customSubject || !customBody}
                  className="btn-primary" style={{ padding: '9px 18px', fontSize: 12 }}>Save template</button>
                <button onClick={() => setShowAddCustom(false)} className="btn-ghost" style={{ padding: '9px 14px', fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Subject + body */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: 'Syne' }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: 'Syne' }}>Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Email body..." style={{ minHeight: 180 }} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleReady} disabled={!subject.trim() || !body.trim()} style={{ padding: '13px 28px', fontSize: 14 }}>
          Generate batches →
        </button>
      </div>
    );
  }

  // ── Batch detail ──────────────────────────────────────────────────────────────
  if (activeBatch !== null) {
    const batch  = batches[activeBatch];
    const isSent = !!sent[activeBatch];
    const track  = tracks[activeBatch];
    const bccStr = batch.join(', ');
    const fullBody = bodyWithPixel(activeBatch);

    return (
      <div className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setActiveBatch(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22, padding: 0 }}>←</button>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>
              Batch {activeBatch + 1} / {totalCount}
              {isSent && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--green)', fontFamily: 'DM Mono' }}>✓ Sent {sent[activeBatch]}</span>}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{batch.length} emails · tracking {track ? 'ready ✓' : 'loading...'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>

          {/* Step 1 - BCC */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Step 1 — Copy BCC</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paste into BCC field in Gmail — not CC</div>
              </div>
              <CopyBtn text={bccStr} label="BCC" />
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px', maxHeight: 72, overflowY: 'auto', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7, wordBreak: 'break-all' }}>
              {bccStr}
            </div>
          </div>

          {/* Step 2 - Subject */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Step 2 — Copy subject</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{subject}</div>
            </div>
            <CopyBtn text={subject} label="subject" />
          </div>

          {/* Step 3 - Body */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Step 3 — Copy body</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {trackingEnabled ? (track ? '✓ Tracking pixel ready — use HTML file below' : '⏳ Preparing tracker...') : 'Paste this into Gmail body'}
                </div>
              </div>
              {!trackingEnabled && <CopyBtn text={body} label="body" />}
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px', maxHeight: 110, overflowY: 'auto', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {body}
            </div>
          </div>

          {/* Step 3b - HTML email file (only when tracking is on) */}
          {trackingEnabled && track && (
            <div className="card animate-in" style={{ padding: '16px 20px', border: '1px solid var(--green-border)', background: 'var(--green-bg)' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, color: 'var(--green)', marginBottom: 6 }}>Step 3b — Download & use HTML email file</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
                Because Gmail shows tracking code as plain text when you paste directly, we use a workaround:<br />
                <strong>Open the file in Chrome → Click "Select & Copy Email" → Paste into Gmail body.</strong><br />
                Gmail preserves HTML when you paste from a webpage — pixel stays invisible ✓
              </div>
              <button
                onClick={() => downloadEmailHTML(body, track.pixel_url, activeBatch + 1)}
                style={{ background: 'var(--green)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 9, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                ↓ Download email file (Batch {activeBatch + 1})
              </button>
            </div>
          )}

          {/* Step 4 - Open Gmail */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Step 4 — Open Gmail compose</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paste BCC → Subject → Body → Send</div>
            </div>
            <a href="https://mail.google.com/mail/?view=cm&fs=1" target="_blank" rel="noreferrer">
              <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer' }}>
                Open Gmail ↗
              </button>
            </a>
          </div>
        </div>

        {/* Mark sent */}
        {!isSent ? (
          <button className="btn-primary" onClick={() => markSent(activeBatch)}
            style={{ padding: '13px 28px', fontSize: 14, background: 'var(--green)' }}>
            ✓ Mark batch {activeBatch + 1} as sent
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--green)' }}>
              ✓ Batch {activeBatch + 1} marked as sent
              {trackingEnabled && track && ' · Open tracking active — check Dashboard for opens'}
              {!trackingEnabled && ' · Enable open tracking in Settings to monitor opens'}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {activeBatch < totalCount - 1 && (
                <button className="btn-primary" onClick={() => openBatch(activeBatch + 1)} style={{ padding: '13px 28px', fontSize: 14 }}>
                  Next batch →
                </button>
              )}
              <button className="btn-ghost" onClick={() => setActiveBatch(null)} style={{ padding: '13px 20px', fontSize: 14 }}>
                ← All batches
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Batches overview ──────────────────────────────────────────────────────────
  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setStep('setup')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22, padding: 0 }}>←</button>
        <div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Scout progress</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{sentCount}/{totalCount} batches sent · {emails.length.toLocaleString()} total emails</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text-muted)' }}>
            {sentCount === totalCount ? '✓ All batches sent!' : `${totalCount - sentCount} remaining`}
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: sentCount === totalCount ? 'var(--green)' : 'var(--text)' }}>{pct}%</div>
        </div>
        <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: sentCount === totalCount ? 'var(--green)' : 'var(--accent)', borderRadius: 99, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', flexWrap: 'wrap' }}>
          <span>✓ {sentCount} sent</span>
          <span>· {totalCount - sentCount} pending</span>
          <span>· ~{(sentCount * batchSize).toLocaleString()} emails reached</span>
        </div>
      </div>

      {/* Batch list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {batches.map((batch, i) => {
          const isSent = !!sent[i];
          const hasTrack = !!tracks[i];
          return (
            <div key={i} style={{ background: 'var(--bg2)', border: `1px solid ${isSent ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, background: isSent ? 'var(--green-bg)' : 'var(--bg3)', border: `1px solid ${isSent ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: isSent ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0 }}>
                  {isSent ? '✓' : i + 1}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13 }}>Batch {i + 1}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
                    {batch.length} emails
                    {isSent && <span style={{ color: 'var(--green)', marginLeft: 8 }}>· sent {sent[i]}</span>}
                    {isSent && hasTrack && <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>· tracking on</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => openBatch(i)}
                style={{ background: isSent ? 'var(--green-bg)' : 'var(--accent)', color: isSent ? 'var(--green)' : '#fff', border: `1px solid ${isSent ? 'var(--green-border)' : 'transparent'}`, padding: '8px 16px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                {isSent ? 'View' : 'Send →'}
              </button>
            </div>
          );
        })}
      </div>

      <button className="btn-ghost" onClick={onBack} style={{ marginTop: 16 }}>← Back to results</button>
    </div>
  );
}
