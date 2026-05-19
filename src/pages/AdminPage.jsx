import { useState, useEffect, useRef } from 'react';
import { getUsers, updateUserStatus, updateUserRole, getAdminLeadStats, uploadLeadsCSV } from '../api';

const BASE_URL = 'https://api.brainboxecomlab.com';
const getToken = () => localStorage.getItem('mc_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

async function deleteCountryLeads(country, availableOnly = false) {
  const path = availableOnly ? `/admin/leads/delete-available/${country}` : `/admin/leads/delete/${country}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: authHeaders() });
  return res.json();
}

async function getSampleLeads(country) {
  const res = await fetch(`${BASE_URL}/admin/leads/sample/${country}`, { headers: authHeaders() });
  return res.json();
}

const STATUS_STYLE = {
  approved:  { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  pending:   { color: '#78350f', bg: '#fffbeb', border: '#fde68a' },
  suspended: { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  banned:    { color: '#991b1b', bg: '#fff5f5', border: '#fecaca' },
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'DM Mono', fontWeight: 500 }}>
      {status}
    </span>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab({ adminRole }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (userId, status) => {
    try {
      await updateUserStatus(userId, status);
      setMsg(`✓ User ${status}`);
      load();
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  const handleRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setMsg(`✓ Role updated to ${role}`);
      load();
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length,
  };

  const filtered = users.filter(u => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase()) && !u.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {msg && (
        <div style={{ background: msg.startsWith('Error') ? '#fff5f5' : '#f0fdf4', border: `1px solid ${msg.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: '10px 16px', color: msg.startsWith('Error') ? '#991b1b' : '#166534', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, marginBottom: 20 }}>
        {Object.entries(counts).map(([key, count]) => (
          <div key={key} onClick={() => setFilter(key)}
            style={{ background: filter === key ? '#1a1714' : '#fff', border: `1px solid ${filter === key ? '#1a1714' : 'rgba(0,0,0,0.08)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: filter === key ? '#fff' : '#1a1714' }}>{count}</div>
            <div style={{ fontSize: 11, color: filter === key ? 'rgba(255,255,255,0.65)' : '#6b6760', textTransform: 'capitalize', marginTop: 2 }}>{key}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b6760' }}>
          <span className="spinner" style={{ fontSize: 20, marginRight: 8 }}>↻</span> Loading users...
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#f3f0ea', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                {['User', 'Role', 'Status', 'Emails verified', 'Last active', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: '#6b6760', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#a09d97', fontSize: 13 }}>No users found</td></tr>
              ) : filtered.map((u, i) => {
                const isMainAdmin = u.role === 'main_admin';
                return (
                  <tr key={u.id || i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#6b6760', fontFamily: 'DM Mono', marginTop: 1 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: isMainAdmin ? '#fffbeb' : '#f3f0ea', color: isMainAdmin ? '#78350f' : '#6b6760', border: `1px solid ${isMainAdmin ? '#fde68a' : 'rgba(0,0,0,0.08)'}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'DM Mono' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge status={u.status} /></td>
                    <td style={{ padding: '12px 16px', fontFamily: 'DM Mono', fontSize: 12 }}>{(u.emails_verified || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#6b6760', fontFamily: 'DM Mono' }}>
                      {u.last_active ? new Date(u.last_active).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isMainAdmin ? (
                        <span style={{ fontSize: 11, color: '#a09d97' }}>Protected</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {u.status !== 'approved'  && <ActionBtn label="Approve"  color="#166534" bg="#f0fdf4" border="#bbf7d0" onClick={() => handleStatus(u.id, 'approved')} />}
                          {u.status !== 'suspended' && <ActionBtn label="Suspend"  color="#6d28d9" bg="#f5f3ff" border="#ddd6fe" onClick={() => handleStatus(u.id, 'suspended')} />}
                          {u.status !== 'banned'    && <ActionBtn label="Ban"      color="#991b1b" bg="#fff5f5" border="#fecaca" onClick={() => handleStatus(u.id, 'banned')} />}
                          {u.status !== 'pending'   && <ActionBtn label="Revoke"   color="#78350f" bg="#fffbeb" border="#fde68a" onClick={() => handleStatus(u.id, 'pending')} />}
                          {adminRole === 'main_admin' && u.role !== 'admin'  && <ActionBtn label="Make admin"    color="#78350f" bg="#fffbeb" border="#fde68a" onClick={() => handleRole(u.id, 'admin')} />}
                          {adminRole === 'main_admin' && u.role === 'admin'  && <ActionBtn label="Remove admin"  color="#6b6760" bg="#f3f0ea" border="rgba(0,0,0,0.1)" onClick={() => handleRole(u.id, 'user')} />}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, color, bg, border, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: bg, color, border: `1px solid ${border}`, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ── Lead pool tab ─────────────────────────────────────────────────────────────
function LeadPoolTab() {
  const [stats, setStats]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploadCountry, setUploadCountry] = useState('US');
  const [customCountry, setCustomCountry] = useState('');
  const [customName, setCustomName] = useState('');
  const [useCustom, setUseCustom]   = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [msg, setMsg]               = useState('');
  const [expanded, setExpanded]     = useState(null);
  const [sample, setSample]         = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminLeadStats();
      setStats(data);
    } catch (e) {
      setMsg('Error loading stats: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const country = useCustom ? customCountry.toUpperCase().trim() : uploadCountry;
    if (!country) { setMsg('Enter a country code first'); return; }
    setUploading(true);
    try {
      const result = await uploadLeadsCSV(country, file, useCustom ? customName : '');
      setMsg(`✓ ${result.inserted.toLocaleString()} new leads added for ${country} · ${result.skipped_duplicates} duplicates skipped`);
      load();
    } catch (err) {
      setMsg('Upload error: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (country, availableOnly) => {
    try {
      const result = await deleteCountryLeads(country, availableOnly);
      setMsg(`✓ Deleted ${result.deleted.toLocaleString()} ${availableOnly ? 'available' : 'total'} leads for ${country}`);
      setConfirmDelete(null);
      load();
    } catch (e) {
      setMsg('Delete error: ' + e.message);
    }
  };

  const loadSample = async (country) => {
    if (sample[country]) { setExpanded(expanded === country ? null : country); return; }
    try {
      const data = await getSampleLeads(country);
      setSample(prev => ({ ...prev, [country]: data }));
      setExpanded(country);
    } catch {}
  };

  const PRESETS = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
    { code: 'AU', name: 'Australia',      flag: '🇦🇺' },
  ];

  return (
    <div>
      {msg && (
        <div style={{ background: msg.startsWith('Error') || msg.startsWith('Upload error') || msg.startsWith('Delete error') ? '#fff5f5' : '#f0fdf4', border: `1px solid ${msg.startsWith('Error') || msg.includes('error') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: '10px 16px', color: msg.includes('error') || msg.startsWith('Error') ? '#991b1b' : '#166534', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Upload section */}
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '22px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Upload leads</div>
        <div style={{ fontSize: 13, color: '#6b6760', marginBottom: 20 }}>
          Upload any CSV — email column is auto-detected. Multiple emails per cell are split automatically. Duplicates are skipped.
        </div>

        {/* Country mode toggle */}
        <div style={{ display: 'flex', gap: 2, background: '#f3f0ea', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: 3, width: 'fit-content', marginBottom: 16 }}>
          {[{ id: false, label: 'Preset country' }, { id: true, label: 'Custom country' }].map(opt => (
            <button key={String(opt.id)} onClick={() => setUseCustom(opt.id)}
              style={{ background: useCustom === opt.id ? '#fff' : 'transparent', color: useCustom === opt.id ? '#1a1714' : '#6b6760', border: useCustom === opt.id ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent', padding: '7px 16px', borderRadius: 7, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {!useCustom ? (
            <div>
              <div style={{ fontSize: 12, color: '#6b6760', marginBottom: 6, fontFamily: 'Syne', fontWeight: 500 }}>Country</div>
              <select value={uploadCountry} onChange={e => setUploadCountry(e.target.value)}
                style={{ padding: '9px 14px', fontSize: 13, borderRadius: 9, minWidth: 180 }}>
                {PRESETS.map(p => <option key={p.code} value={p.code}>{p.flag} {p.name}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize: 12, color: '#6b6760', marginBottom: 6, fontFamily: 'Syne', fontWeight: 500 }}>Country code (e.g. NG, DE, FR)</div>
                <input value={customCountry} onChange={e => setCustomCountry(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="e.g. NG" style={{ width: 100 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b6760', marginBottom: 6, fontFamily: 'Syne', fontWeight: 500 }}>Display name (optional)</div>
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Nigeria" style={{ width: 160 }} />
              </div>
            </>
          )}

          <div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleUpload} />
            <button onClick={() => fileRef.current.click()} disabled={uploading || (useCustom && !customCountry)}
              className="btn-primary" style={{ padding: '10px 22px', fontSize: 13 }}>
              {uploading ? <><span className="spinner" style={{ marginRight: 8 }}>↻</span>Uploading...</> : '⬆ Upload CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Country stats */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b6760' }}>
          <span className="spinner" style={{ fontSize: 20 }}>↻</span>
        </div>
      ) : stats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a09d97', fontSize: 13 }}>
          No leads uploaded yet. Upload a CSV above to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stats.map(s => (
            <div key={s.country} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {/* Country header */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{s.flag}</span>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#6b6760' }}>{s.country}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
                    {[
                      { label: 'Total',     value: s.total,     color: '#1a1714' },
                      { label: 'Available', value: s.available, color: '#166534' },
                      { label: 'Claimed',   value: s.claimed,   color: '#78350f' },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: stat.color }}>{stat.value.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#a09d97', fontFamily: 'DM Mono' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => loadSample(s.country)}
                    style={{ background: '#f3f0ea', color: '#6b6760', border: '1px solid rgba(0,0,0,0.1)', padding: '7px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    {expanded === s.country ? 'Hide sample' : 'View sample'}
                  </button>
                  {s.available > 0 && (
                    <button onClick={() => setConfirmDelete({ country: s.country, availableOnly: true })}
                      style={{ background: '#fffbeb', color: '#78350f', border: '1px solid #fde68a', padding: '7px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Delete available ({s.available.toLocaleString()})
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete({ country: s.country, availableOnly: false })}
                    style={{ background: '#fff5f5', color: '#991b1b', border: '1px solid #fecaca', padding: '7px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Delete all
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, background: '#f3f0ea' }}>
                <div style={{ height: '100%', width: s.total > 0 ? `${Math.round((s.claimed / s.total) * 100)}%` : '0%', background: '#fbbf24', transition: 'width 0.4s' }} />
              </div>

              {/* Sample emails */}
              {expanded === s.country && sample[s.country] && (
                <div style={{ padding: '14px 20px', background: '#faf8f4', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: '#a09d97', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Sample emails (up to 10)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sample[s.country].map((doc, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
                        <span style={{ fontFamily: 'DM Mono', color: '#1a1714' }}>{doc.email}</span>
                        {doc.domain && <span style={{ color: '#a09d97', fontSize: 11 }}>{doc.domain}</span>}
                        <span style={{ background: doc.status === 'available' ? '#f0fdf4' : '#fffbeb', color: doc.status === 'available' ? '#166534' : '#78350f', border: `1px solid ${doc.status === 'available' ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '1px 7px', fontSize: 10, fontFamily: 'DM Mono' }}>{doc.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setConfirmDelete(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Confirm delete</div>
            <div style={{ fontSize: 13, color: '#6b6760', marginBottom: 20, lineHeight: 1.6 }}>
              Delete <strong>{confirmDelete.availableOnly ? 'available' : 'ALL'}</strong> leads for <strong>{confirmDelete.country}</strong>?
              {!confirmDelete.availableOnly && ' This includes claimed leads and cannot be undone.'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(confirmDelete.country, confirmDelete.availableOnly)}
                style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 9, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Yes, delete
              </button>
              <button onClick={() => setConfirmDelete(null)}
                style={{ background: '#f3f0ea', color: '#6b6760', border: '1px solid rgba(0,0,0,0.1)', padding: '10px 18px', borderRadius: 9, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────────
export default function AdminPage({ onBack }) {
  const [adminTab, setAdminTab] = useState('users');
  const [adminRole, setAdminRole] = useState('admin');

  useEffect(() => {
    // Get current user role from token
    const token = localStorage.getItem('mc_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAdminRole(payload.role || 'admin');
      } catch {}
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, background: '#1a1714', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>✉</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>MailClean</span>
            <span style={{ background: '#fff5f5', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 5, padding: '1px 8px', fontSize: 10, fontFamily: 'DM Mono' }}>ADMIN</span>
          </div>
          <button onClick={onBack}
            style={{ background: '#fff', color: '#6b6760', border: '1px solid rgba(0,0,0,0.1)', padding: '6px 16px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 3 }}>Admin dashboard</h1>
          <p style={{ color: '#6b6760', fontSize: 13 }}>Manage users and lead pool</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 2, background: '#f3f0ea', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 24 }}>
          {[{ id: 'users', label: '👥 Users' }, { id: 'leads', label: '🎯 Lead pool' }].map(t => (
            <button key={t.id} onClick={() => setAdminTab(t.id)}
              style={{ background: adminTab === t.id ? '#fff' : 'transparent', color: adminTab === t.id ? '#1a1714' : '#6b6760', border: adminTab === t.id ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent', padding: '8px 22px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {adminTab === 'users' && <UsersTab adminRole={adminRole} />}
        {adminTab === 'leads' && <LeadPoolTab />}
      </div>
    </div>
  );
}
