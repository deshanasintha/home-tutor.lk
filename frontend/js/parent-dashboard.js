/* ===== Parent dashboard logic =====
   The page ships empty. Replace loadDashboardData() with your
   Firebase / backend calls; everything else renders from the returned object.

   Expected shape:
   {
     parent:     { name, location, memberSince },
     pending:    [{ tutorName, subject, grade, requestedOn, rate }],
     accepted:   [{ tutorName, subject, grade, schedule, rate, status }],  // status: 'accepted' | 'completed'
     rejected:   [{ tutorName, subject, grade, reason, rate }],
     sessions:   [{ day, month, tutorName, subject, time, venue }],
     favourites: [{ id, name, subject, rating }],
     reviews:    [{ tutorName, rating, comment, postedOn }]
   }
*/

const $ = (id) => document.getElementById(id);

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '--';

const money = (n) => `Rs. ${Number(n).toLocaleString('en-LK')}/hr`;
const dot = ' · ';
const join = (...parts) => parts.filter(Boolean).join(dot);

function emptyRow() { return ''; }

/* ---------- Data source (replace this) ---------- */
async function loadDashboardData() {
  // TODO: fetch from your backend / Firebase, e.g.
  // const res = await fetch('/api/parent/dashboard', { credentials: 'include' });
  // return res.json();
  return {
    parent: {}, pending: [], accepted: [], rejected: [],
    sessions: [], favourites: [], reviews: []
  };
}

/* ---------- Renderers ---------- */
function renderProfile(p = {}) {
  if (!p.name) return;
  const last = p.name.replace(/^(mr|mrs|ms)\.?\s+/i, '').split(' ').pop();
  $('welcomeTitle').textContent = `Welcome back, ${p.title || 'Mrs.'} ${last}`;
  $('profileInitials').textContent = initials(p.name);
  $('profileName').textContent = p.name;
  $('profileMeta').textContent = join(
    'Parent account', p.location, p.memberSince && `Member since ${p.memberSince}`);
}

function requestRow(r, status) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const detail = status === 'pending'
    ? join(r.subject, r.grade, r.requestedOn && `Requested ${r.requestedOn}`)
    : status === 'rejected'
      ? join(r.subject, r.grade, r.reason)
      : join(r.subject, r.grade, r.schedule || (status === 'completed' ? 'Sessions completed' : ''));
  return `
    <div class="pd-row">
      <div class="pd-avatar pd-avatar--sm">${esc(initials(r.tutorName))}</div>
      <div class="pd-row__info"><strong>${esc(r.tutorName)}</strong><span>${esc(detail)}</span></div>
      <div class="pd-price">${money(r.rate)}</div>
      <span class="pd-badge pd-badge--${status}">${label}</span>
    </div>`;
}

function renderList(el, items, rowFn, emptyMsg) {
  el.innerHTML = items.length ? items.map(rowFn).join('') : emptyRow(emptyMsg);
}

function renderSessions(list) {
  renderList($('sessionList'), list, (s) => `
    <div class="pd-row">
      <div class="pd-date"><b>${esc(s.day)}</b><small>${esc(s.month)}</small></div>
      <div class="pd-row__info">
        <strong>${esc(s.tutorName)} — ${esc(s.subject)}</strong>
        <span>${esc(join(s.time, s.venue))}</span>
      </div>
      <span class="pd-badge pd-badge--confirmed">Confirmed</span>
    </div>`);
}

function renderFavourites(list) {
  const grid = $('favouriteGrid');
  grid.innerHTML = list.length ? list.map((t) => `
    <div class="pd-card pd-fav">
      <div class="pd-avatar">${esc(initials(t.name))}</div>
      <strong>${esc(t.name)}</strong>
      <span>${esc(t.subject)}${t.rating ? ` · ★ ${esc(t.rating)}` : ''}</span>
      <a class="pd-btn" href="tutor-results.html?id=${encodeURIComponent(t.id ?? '')}">View Profile</a>
    </div>`).join('') : '';
}

function stars(n) {
  const full = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function renderReviews(list) {
  renderList($('reviewList'), list, (r) => `
    <div class="pd-review">
      <div class="pd-review__top">
        <strong>${esc(r.tutorName)}</strong>
        <span class="pd-stars" aria-label="${esc(r.rating)} out of 5">${stars(r.rating)}</span>
      </div>
      <p>${esc(r.comment)}</p>
      <small>Posted ${esc(r.postedOn)}</small>
    </div>`);
}

function render(d) {
  renderProfile(d.parent);
  renderList($('pendingList'), d.pending, (r) => requestRow(r, 'pending'));
  renderList($('acceptedList'), d.accepted,
    (r) => requestRow(r, r.status === 'completed' ? 'completed' : 'accepted'));
  renderList($('rejectedList'), d.rejected, (r) => requestRow(r, 'rejected'));
  renderSessions(d.sessions);
  renderFavourites(d.favourites);
  renderReviews(d.reviews);

  const any = d.pending.length + d.accepted.length + d.sessions.length + d.favourites.length;
  if (any) {
    $('statPending').textContent = d.pending.length;
    $('statAccepted').textContent = d.accepted.filter((r) => r.status !== 'completed').length;
    $('statSessions').textContent = d.sessions.length;
    $('statFavourites').textContent = d.favourites.length;
  }
}

/* ---------- Logout ---------- */
document.querySelectorAll('[data-logout]').forEach((btn) =>
  btn.addEventListener('click', () => {
    if (typeof window.logout === 'function') return window.logout();   // from your auth.js, if it exposes one
    window.location.href = 'login.html';
  }));

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    render(await loadDashboardData());
  } catch (err) {
    console.error('Dashboard load failed:', err);
    render({ parent: {}, pending: [], accepted: [], rejected: [], sessions: [], favourites: [], reviews: [] });
  }
});
