import { useState, useEffect } from 'react';
import { getMyDashboard, getAdminDashboard, getAdminUserDetail, updateUserStatus, getMyTracks, getAdminTracks } from '../api';
import { useAuth } from '../context/AuthContext';

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color, height = 56 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.date}: ${d.value.toLocaleString()}`}
          style={{ flex: 1, background: d.value > 0 ? color : 'var(--bg4)', borderRadius: '3px 3px 0 0', height: `${Math.max((d.value / max) * 100, d.value > 0 ? 8 : 3)}%`, opacity: 0.8, transition: 'height 0.4s ease', cursor: 'default' }} />
      ))}
    </div>
  );
}

// ── Period toggle ──────────────────────────────────────────────────────────────
function PeriodToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
      {['today', 'week', 'month'].map(p => (
        <button key={p} onClick={() => onChange(p)}
          style={{ background: value === p ? 'var(--bg2)' : 'transparent', color: value === p ? 'var(--text)' : 'var(--text-dim)', border: value === p ? '1px solid var(--border-mid)' : '1px solid transparent', padding: '4px 9px', borderRadius: 6, fontSize: 10, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
          {p}
        </button>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, data, color, chart, sub }) {
  const [period, setPeriod] = useState('today');
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: color || 'var(--text)', lineHeight: 1, marginBottom: 4 }}>
        {(data?.[period] || 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginBottom: chart ? 14 : 0 }}>
        All time: {(data?.total || 0).toLocaleString()} {sub ? `· ${sub}` : ''}
      </div>
      {chart && <BarChart data={chart} color={color || 'var(--accent)'} />}
    </div>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────────────
function MiniStat({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700, color: color || 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ item, showUser }) {
  const time = item.sent_at ? new Date(item.sent_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>📨</div>
        <div style={{ minWidth: 0 }}>
          {showUser && <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.user_name || item.user_email}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>Batch {item.batch_number}/{item.total_batches} · {item.email_count} emails</div>
          {item.subject && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{item.subject}"</div>}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', flexShrink: 0, marginLeft: 8 }}>{time}</div>
    </div>
  );
}

// ── User detail modal ─────────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    getAdminUserDetail(userId).then(setData).catch(e => setMsg(e.message)).finally(() => setLoading(false));
  }, [userId]);

  const handleStatus = async (status) => {
    try {
      await updateUserStatus(userId, status);
      const updated = await getAdminUserDetail(userId);
      setData(updated);
      setMsg(`User ${status} successfully`);
    } catch (e) { setMsg(e.message); }
  };

  const STATUS_COLORS = { approved: 'var(--green)', pending: 'var(--amber)', suspended: '#7c3aed', banned: 'var(--red)' };
  const STATUS_BG     = { approved: 'var(--green-bg)', pending: 'var(--amber-bg)', suspended: '#f5f3ff', banned: 'var(--red-bg)' };
  const STATUS_BORDER = { approved: 'var(--green-border)', pending: 'var(--amber-border)', suspended: '#ddd6fe', banned: 'var(--red-border)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg)', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>

        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border-mid)', borderRadius: 99, margin: '0 auto 20px' }} />

        {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}><span className="spinner">↻</span></div>}

        {msg && <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--green)', fontSize: 12, marginBottom: 16 }}>{msg}</div>}

        {data && !loading && (
          <>
            {/* User header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{data.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{data.user.email}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  Joined {data.user.created_at ? new Date(data.user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  {data.user.last_active && ` · Last active ${new Date(data.user.last_active).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}
                </div>
              </div>
              <span style={{ background: STATUS_BG[data.user.status], color: STATUS_COLORS[data.user.status], border: `1px solid ${STATUS_BORDER[data.user.status]}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontFamily: 'DM Mono' }}>
                {data.user.status}
              </span>
            </div>

            {/* Scout rate highlight */}
            <div style={{ background: data.scout_rate >= 50 ? 'var(--green-bg)' : 'var(--amber-bg)', border: `1px solid ${data.scout_rate >= 50 ? 'var(--green-border)' : 'var(--amber-border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scout rate</div>
                <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 700, color: data.scout_rate >= 50 ? 'var(--green)' : 'var(--amber)' }}>{data.scout_rate}%</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                <div>{(data.scouted?.total || 0).toLocaleString()} scouted</div>
                <div>of {(data.verified?.total || 0).toLocaleString()} verified</div>
              </div>
            </div>

            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Verified this month</div>
                <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: '#6366f1' }}>{(data.verified?.month || 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginTop: 3 }}>Today: {data.verified?.today || 0} · Week: {data.verified?.week || 0}</div>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Scouted this month</div>
                <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{(data.scouted?.month || 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginTop: 3 }}>Today: {data.scouted?.today || 0} · Week: {data.scouted?.week || 0}</div>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Batches sent total</div>
                <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>{data.scouted?.batches_total || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginTop: 3 }}>This month: {data.scouted?.batches_month || 0}</div>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>All time verified</div>
                <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>{(data.verified?.total || 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginTop: 3 }}>All time scouted: {(data.scouted?.total || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* 30-day chart */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>30-day scout activity</div>
              <BarChart data={data.scout_series} color="var(--green)" height={48} />
            </div>

            {/* Recent scouts */}
            {data.recent_scouts?.length > 0 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent scout batches</div>
                {data.recent_scouts.map((item, i) => <ActivityRow key={i} item={item} showUser={false} />)}
              </div>
            )}

            {/* Actions */}
            {data.user.role !== 'main_admin' && (
              <div>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.user.status !== 'approved'  && <button onClick={() => handleStatus('approved')}  style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer' }}>Approve</button>}
                  {data.user.status !== 'suspended' && <button onClick={() => handleStatus('suspended')} style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer' }}>Suspend</button>}
                  {data.user.status !== 'banned'    && <button onClick={() => handleStatus('banned')}    style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer' }}>Ban</button>}
                  {data.user.status !== 'pending'   && <button onClick={() => handleStatus('pending')}   style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'Syne', fontWeight: 600, cursor: 'pointer' }}>Revoke access</button>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Top users list ─────────────────────────────────────────────────────────────
function TopUsers({ users, onUserClick }) {
  if (!users?.length) return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No scout activity yet</div>;
  const max = users[0]?.total || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {users.map((u, i) => (
        <div key={u.user_id} onClick={() => onUserClick(u.user_id)}
          style={{ cursor: 'pointer', padding: '4px 0' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: i < 3 ? 'var(--amber)' : 'var(--text-dim)', textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.email}</span>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', flexShrink: 0 }}>{u.total.toLocaleString()} · {u.batches}b</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(u.total / max) * 100}%`, background: i === 0 ? 'var(--amber)' : 'var(--green)', borderRadius: 99 }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Track table ──────────────────────────────────────────────────────────────
function TrackTable({ tracks, loading, showUser }) {
  if (loading) return null;
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📬 Open tracker</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginBottom: 16 }}>
        Tracks how many people opened your scouted emails
      </div>
      {!tracks?.length ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-dim)', fontSize: 13 }}>
          No tracked batches yet — tracking pixels are generated when you mark a batch as sent in Scout mode
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border-mid)' }}>
                {showUser && <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User</th>}
                <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Batch</th>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</th>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sent</th>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Opens</th>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open rate</th>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last opened</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t, i) => {
                const openRate = t.email_count > 0 ? Math.round((t.open_count / t.email_count) * 100) : 0;
                const rateColor = openRate >= 30 ? 'var(--green)' : openRate >= 10 ? 'var(--amber)' : 'var(--red)';
                const sentAt = t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
                const lastOpened = t.last_opened ? new Date(t.last_opened).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
                return (
                  <tr key={i} style={{ borderBottom: i < tracks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {showUser && <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500 }}>{t.user_name || '—'}</td>}
                    <td style={{ padding: '10px 14px', fontFamily: 'DM Mono', fontSize: 11 }}>
                      {t.batch_number}/{t.total_batches}
                      <span style={{ marginLeft: 6, color: 'var(--text-dim)' }}>({t.email_count} emails)</span>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {t.subject || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-dim)' }}>{sentAt}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: t.open_count > 0 ? 'var(--green)' : 'var(--text-dim)' }}>
                        {t.open_count}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 5, width: 60, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(openRate, 100)}%`, background: rateColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: rateColor, fontWeight: 600 }}>{openRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-dim)' }}>{lastOpened}</td>
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

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }  = useAuth();
  const isAdmin   = ['admin', 'main_admin'].includes(user?.role);
  const [view, setView]         = useState(isAdmin ? 'admin' : 'me');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const d = view === 'admin' ? await getAdminDashboard() : await getMyDashboard();
      setData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [view]);

  useEffect(() => {
    setTracksLoading(true);
    const fn = view === 'admin' ? getAdminTracks : getMyTracks;
    fn().then(setTracks).catch(() => setTracks([])).finally(() => setTracksLoading(false));
  }, [view]);

  const scoutRate = data ? (
    data.verified?.total > 0 ? Math.round((data.scouted?.total / data.verified.total) * 100) : 0
  ) : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 3 }}>
            {view === 'admin' ? 'Platform overview' : `Hey ${user?.name?.split(' ')[0]} 👋`}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {view === 'admin' ? 'Monitor all users and platform activity' : 'Your verification and scout activity'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
              {['me', 'admin'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ background: view === v ? 'var(--bg2)' : 'transparent', color: view === v ? 'var(--text)' : 'var(--text-muted)', border: view === v ? '1px solid var(--border-mid)' : '1px solid transparent', padding: '6px 14px', borderRadius: 8, fontFamily: 'Syne', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  {v === 'me' ? 'My stats' : 'Platform'}
                </button>
              ))}
            </div>
          )}
          <button onClick={load} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>↻ Refresh</button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          <span className="spinner" style={{ fontSize: 18 }}>↻</span> Loading...
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* ── MY STATS ── */}
      {!loading && data && view === 'me' && (
        <div className="animate-in">
          {/* Main stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 14 }}>
            <StatCard label="Emails verified" data={data.verified} color="#6366f1" chart={data.verify_series} />
            <StatCard label="Emails scouted" data={data.scouted} color="var(--green)" chart={data.scout_series} />
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <MiniStat label="Scout rate" value={`${scoutRate}%`} sub="of verified emails scouted" color={scoutRate >= 50 ? 'var(--green)' : 'var(--amber)'} />
            <MiniStat label="Batches sent" value={(data.scouted?.batches_total || 0).toLocaleString()} sub={`${data.scouted?.batches_month || 0} this month`} color="var(--green)" />
            <MiniStat label="Verified today" value={(data.verified?.today || 0).toLocaleString()} sub="emails checked" />
            <MiniStat label="Scouted today" value={(data.scouted?.today || 0).toLocaleString()} sub="emails reached" color="var(--green)" />
          </div>

          {/* Recent activity */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Recent scout activity
              <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-dim)', fontWeight: 400 }}>Last 10 batches</span>
            </div>
            {data.recent_activity?.length ? (
              data.recent_activity.map((item, i) => <ActivityRow key={i} item={item} showUser={false} />)
            ) : (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-dim)', fontSize: 13 }}>No scout activity yet — verify some emails and start scouting!</div>
            )}
          </div>

          {/* Open tracker */}
          <TrackTable tracks={tracks} loading={tracksLoading} showUser={false} />
        </div>
      )}

      {/* ── ADMIN VIEW ── */}
      {!loading && data && view === 'admin' && (
        <div className="animate-in">
          {/* User counts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Total users',  value: data.users?.total || 0,     color: 'var(--text)' },
              { label: 'Approved',     value: data.users?.approved || 0,  color: 'var(--green)' },
              { label: 'Pending',      value: data.users?.pending || 0,   color: 'var(--amber)' },
              { label: 'Suspended',    value: data.users?.suspended || 0, color: '#7c3aed' },
              { label: 'Banned',       value: data.users?.banned || 0,    color: 'var(--red)' },
            ].map(s => (
              <MiniStat key={s.label} label={s.label} value={s.value} color={s.color} />
            ))}
          </div>

          {/* Platform stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 14 }}>
            <StatCard label="Platform verifications" data={data.verified} color="#6366f1" chart={data.verify_series} />
            <StatCard label="Platform emails scouted" data={data.scouted} color="var(--green)" chart={data.scout_series} />
          </div>

          {/* Bottom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Top scouts this month</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginBottom: 14 }}>Click any user to see full details</div>
              <TopUsers users={data.top_users} onUserClick={setSelectedUser} />
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)', maxHeight: 420, overflowY: 'auto' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Live activity feed</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono', marginBottom: 14 }}>Last 20 scout actions</div>
              {data.recent_activity?.length ? (
                data.recent_activity.map((item, i) => <ActivityRow key={i} item={item} showUser={true} />)
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-dim)', fontSize: 13 }}>No activity yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
