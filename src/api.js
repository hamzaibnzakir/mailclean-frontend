const BASE_URL = 'https://api.brainboxecomlab.com';

const getToken = () => localStorage.getItem('mc_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function signup(name, email, password) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Signup failed');
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  return data;
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getUsers() {
  const res = await fetch(`${BASE_URL}/admin/users`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch users');
  return data;
}

export async function updateUserStatus(userId, status) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update status');
  return data;
}

export async function updateUserRole(userId, role) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update role');
  return data;
}

// ─── Verify ──────────────────────────────────────────────────────────────────

export async function verifySingle(email) {
  const res = await fetch(`${BASE_URL}/verify/single`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Verification failed');
  }
  return res.json();
}

export async function verifyBulk(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/verify/bulk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function pollJob(jobId) {
  const res = await fetch(`${BASE_URL}/results/${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

export async function getMyDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}

export async function getLeadCountries() {
  const res = await fetch(`${BASE_URL}/leads/countries`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load countries');
  return res.json();
}

export async function claimAndVerify(country, amount) {
  const res = await fetch(`${BASE_URL}/leads/claim-and-verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ country, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to claim leads');
  return data;
}

export async function pollLeadJob(jobId) {
  const res = await fetch(`${BASE_URL}/leads/status/${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

export function leadExportUrl(jobId, category = 'all') {
  return `${BASE_URL}/leads/export/${jobId}?category=${category}`;
}

export async function deleteCountryLeads(country, availableOnly = false) {
  const path = availableOnly ? `/admin/leads/delete-available/${country}` : `/admin/leads/delete/${country}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: authHeaders() });
  return res.json();
}

export async function getSampleLeads(country) {
  const res = await fetch(`${BASE_URL}/admin/leads/sample/${country}`, { headers: authHeaders() });
  return res.json();
}

export async function getLeadHistory() {
  const res = await fetch(`${BASE_URL}/leads/history`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function resumeLeadJob(jobId) {
  const res = await fetch(`${BASE_URL}/leads/results/${jobId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

export async function getAdminLeadStats() {
  const res = await fetch(`${BASE_URL}/admin/leads/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load lead stats');
  return res.json();
}

export async function uploadLeadsCSV(country, file, countryName = '') {
  const formData = new FormData();
  formData.append('file', file);
  const params = countryName ? `?name=${encodeURIComponent(countryName)}` : '';
  const res = await fetch(`${BASE_URL}/admin/leads/upload/${country}${params}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('mc_token')}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Upload failed');
  return data;
}

export async function getAdminUserDetail(userId) {
  const res = await fetch(`${BASE_URL}/dashboard/admin/user/${userId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load user detail');
  return res.json();
}

export async function getAdminDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard/admin`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load admin dashboard');
  return res.json();
}

export async function createTrack(batchNumber, totalBatches, subject, emailCount) {
  try {
    const res = await fetch(`${BASE_URL}/scout/create-track`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ batch_number: batchNumber, total_batches: totalBatches, subject, email_count: emailCount }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getMyTracks() {
  const res = await fetch(`${BASE_URL}/scout/tracks`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function getAdminTracks() {
  const res = await fetch(`${BASE_URL}/admin/tracks`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function logScout(batchNumber, emailCount, subject, totalBatches) {
  try {
    await fetch(`${BASE_URL}/scout/log`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ batch_number: batchNumber, email_count: emailCount, subject, total_batches: totalBatches }),
    });
  } catch {}
}

export function exportUrl(jobId, category = 'all') {
  return `${BASE_URL}/results/${jobId}/export?category=${category}`;
}
