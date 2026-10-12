import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const byId = (id) => document.getElementById(id);
const statusElement = byId('dashboardStatus');
let users = [];
let bookings = [];
let usersLoaded = false;
let bookingsLoaded = false;
let stopped = [];
let recordsStarted = false;
const loadErrors = new Set();

const setStatus = (message, isError = false) => {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.setAttribute('role', isError ? 'alert' : 'status');
};

const setText = (id, value) => {
  const element = byId(id);
  if (element) element.textContent = value;
};

const statusOf = (record) => typeof record.status === 'string' ? record.status.toLowerCase() : '';

const cell = (row, value) => {
  const element = document.createElement('td');
  element.textContent = value || 'Not set';
  row.appendChild(element);
};

const setTableMessage = (tbody, colspan, message) => {
  tbody.replaceChildren();
  const row = document.createElement('tr');
  const messageCell = document.createElement('td');
  messageCell.colSpan = colspan;
  messageCell.textContent = message;
  row.appendChild(messageCell);
  tbody.appendChild(row);
};

const safeCertificateUrl = (value) => {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

const matchesFilter = (record, query, status) => {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedStatus = status.trim().toLowerCase();
  const values = Object.values(record).filter((value) => typeof value === 'string');
  const matchesQuery = !normalizedQuery || values.some((value) => value.toLowerCase().includes(normalizedQuery));
  const recordStatus = statusOf(record);
  const matchesStatus = !normalizedStatus || recordStatus === normalizedStatus
    || (normalizedStatus === 'verified' && recordStatus === 'approved')
    || (normalizedStatus === 'confirmed' && recordStatus === 'accepted')
    || (normalizedStatus === 'declined' && recordStatus === 'rejected');
  return matchesQuery && matchesStatus;
};

const renderParents = () => {
  if (!usersLoaded) return;
  const tbody = byId('parentsTableBody');
  const search = byId('parentSearch').value;
  const status = byId('parentStatusFilter').value;
  const filtered = users.filter((user) => user.role === 'parent'
    && matchesFilter(user, search, status));
  tbody.replaceChildren();

  if (!filtered.length) {
    setTableMessage(tbody, 5, users.some((user) => user.role === 'parent')
      ? 'No parent accounts match these filters.'
      : 'No parent accounts found.');
    return;
  }

  filtered.forEach((user) => {
    const row = document.createElement('tr');
    cell(row, user.name);
    cell(row, user.email);
    cell(row, user.district);
    cell(row, user.status);
    cell(row, '—');
    tbody.appendChild(row);
  });
};

const renderTutors = () => {
  if (!usersLoaded) return;
  const tbody = byId('tutorsTableBody');
  const search = byId('tutorSearch').value;
  const status = byId('tutorStatusFilter').value;
  const filtered = users.filter((user) => user.role === 'tutor'
    && matchesFilter(user, search, status));
  tbody.replaceChildren();

  if (!filtered.length) {
    setTableMessage(tbody, 6, users.some((user) => user.role === 'tutor')
      ? 'No tutor accounts match these filters.'
      : 'No tutor accounts found.');
    return;
  }

  filtered.forEach((user) => {
    const row = document.createElement('tr');
    cell(row, user.name);
    cell(row, user.subjects);
    cell(row, user.district);
    cell(row, user.qualification);
    cell(row, user.status);

    const actionCell = document.createElement('td');
    const certificate = safeCertificateUrl(user.certificateURL);
    if (certificate) {
      const link = document.createElement('a');
      link.href = certificate;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'View certificate';
      actionCell.appendChild(link);
    } else {
      actionCell.textContent = '—';
    }
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
};

const renderVerification = () => {
  const container = byId('verificationList');
  const pending = users.filter((user) => user.role === 'tutor' && statusOf(user) === 'pending');
  container.replaceChildren();

  if (!pending.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No pending tutor applications.';
    container.appendChild(empty);
    return;
  }

  pending.forEach((tutor) => {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = tutor.name || 'Tutor name not provided';
    card.appendChild(title);

    const details = document.createElement('p');
    details.textContent = [
      tutor.email,
      tutor.qualification,
      tutor.institution,
      tutor.subjects,
      tutor.district
    ].filter((value) => typeof value === 'string' && value.trim()).join(' · ');
    card.appendChild(details);

    const certificate = safeCertificateUrl(tutor.certificateURL);
    if (certificate) {
      const link = document.createElement('a');
      link.href = certificate;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'View submitted certificate';
      card.appendChild(link);
    }
    container.appendChild(card);
  });
};

const renderBookings = () => {
  if (!bookingsLoaded) return;
  const tbody = byId('bookingsTableBody');
  const search = byId('bookingSearch').value;
  const status = byId('bookingStatusFilter').value;
  const filtered = bookings.filter((booking) => matchesFilter(booking, search, status));
  tbody.replaceChildren();

  if (!filtered.length) {
    setTableMessage(tbody, 6, bookings.length
      ? 'No booking requests match these filters.'
      : 'No booking requests found.');
    return;
  }

  filtered.forEach((booking) => {
    const row = document.createElement('tr');
    cell(row, booking.id);
    cell(row, booking.parentName || booking.parentEmail);
    cell(row, booking.tutorName);
    cell(row, booking.subject);
    cell(row, booking.preferredDate);
    cell(row, booking.status);
    tbody.appendChild(row);
  });
};

const renderStatistics = () => {
  const parents = users.filter((user) => user.role === 'parent');
  const tutors = users.filter((user) => user.role === 'tutor');
  const students = users.filter((user) => user.role === 'student'
    || (user.role === 'parent' && typeof user.grade === 'string' && user.grade.trim()));
  const verifiedTutors = tutors.filter((user) => ['approved', 'verified'].includes(
    typeof user.status === 'string' ? user.status.toLowerCase() : ''
  ));
  const pendingTutors = tutors.filter((user) => statusOf(user) === 'pending');
  const confirmedBookings = bookings.filter((booking) => ['accepted', 'confirmed'].includes(
    typeof booking.status === 'string' ? booking.status.toLowerCase() : ''
  ));
  const resolvedBookings = bookings.filter((booking) => ['accepted', 'confirmed', 'rejected', 'declined'].includes(
    typeof booking.status === 'string' ? booking.status.toLowerCase() : ''
  ));
  const districts = new Set(tutors
    .map((user) => typeof user.district === 'string' ? user.district.trim().toLowerCase() : '')
    .filter(Boolean));

  setText('totalParents', String(parents.length));
  setText('totalTutors', String(tutors.length));
  setText('verifiedTutors', String(verifiedTutors.length));
  setText('pendingTutors', String(pendingTutors.length));
  setText('totalBookings', String(bookings.length));
  setText('totalStudents', String(students.length));
  setText('confirmationRate', bookings.length
    ? `${Math.round(confirmedBookings.length / bookings.length * 100)}%`
    : '—');
  setText('resolvedBookings', String(resolvedBookings.length));
  setText('districtsCovered', String(districts.size));
};

const renderAll = () => {
  if (usersLoaded) {
    renderParents();
    renderTutors();
    renderVerification();
  }
  if (bookingsLoaded) renderBookings();
  if (usersLoaded && bookingsLoaded) renderStatistics();

  if (loadErrors.size) {
    setStatus(`Unable to load ${Array.from(loadErrors).join(' and ')}. Check Firestore access and try again.`, true);
  } else if (usersLoaded && bookingsLoaded) {
    setStatus(`${users.length} user profiles and ${bookings.length} booking requests loaded.`);
  } else {
    setStatus('Loading dashboard data...');
  }
};

const setAdminProfile = (profile, user) => {
  const name = typeof profile.name === 'string' && profile.name.trim() ? profile.name : user.email || 'Administrator';
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  setText('adminName', name);
  setText('adminEmail', user.email || '');
  setText('adminAvatar', initials || '--');
  setText('settingsAdminName', name);
  setText('settingsAdminEmail', user.email || '');
  setText('settingsAdminRole', profile.role);
};

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  stopped.push(onSnapshot(doc(db, 'users', user.uid), (profileSnapshot) => {
    if (!profileSnapshot.exists()) {
      setStatus('Your administrator profile could not be found.', true);
      stopped.slice(1).forEach((unsubscribe) => unsubscribe());
      stopped = stopped.slice(0, 1);
      recordsStarted = false;
      return;
    }

    const profile = profileSnapshot.data();
    if (profile.role !== 'admin') {
      setStatus('This dashboard is only available to administrator accounts.', true);
      stopped.slice(1).forEach((unsubscribe) => unsubscribe());
      stopped = stopped.slice(0, 1);
      recordsStarted = false;
      return;
    }

    setAdminProfile(profile, user);
    if (recordsStarted) return;
    recordsStarted = true;

    stopped.push(onSnapshot(collection(db, 'users'), (snapshot) => {
      users = snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }));
      loadErrors.delete('user records');
      usersLoaded = true;
      renderAll();
    }, (error) => {
      console.error('Error loading admin user records:', error);
      loadErrors.add('user records');
      usersLoaded = false;
      renderAll();
      ['totalParents', 'totalTutors', 'verifiedTutors', 'pendingTutors', 'totalStudents', 'districtsCovered']
        .forEach((id) => setText(id, '—'));
      setTableMessage(byId('parentsTableBody'), 5, 'Unable to load parent accounts.');
      setTableMessage(byId('tutorsTableBody'), 6, 'Unable to load tutor accounts.');
      byId('verificationList').textContent = 'Unable to load tutor applications.';
    }));

    stopped.push(onSnapshot(collection(db, 'bookings'), (snapshot) => {
      bookings = snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() }));
      loadErrors.delete('booking records');
      bookingsLoaded = true;
      renderAll();
    }, (error) => {
      console.error('Error loading admin bookings:', error);
      loadErrors.add('booking records');
      bookingsLoaded = false;
      renderAll();
      ['totalBookings', 'confirmationRate', 'resolvedBookings'].forEach((id) => setText(id, '—'));
      setTableMessage(byId('bookingsTableBody'), 6, 'Unable to load booking requests.');
    }));
  }, (error) => {
    console.error('Error loading administrator profile:', error);
    setStatus('Unable to load your administrator profile. Please try again later.', true);
  }));

  window.addEventListener('pagehide', () => stopped.forEach((unsubscribe) => unsubscribe()), { once: true });
});

byId('parentSearch').addEventListener('input', renderParents);
byId('parentStatusFilter').addEventListener('change', renderParents);
byId('tutorSearch').addEventListener('input', renderTutors);
byId('tutorStatusFilter').addEventListener('change', renderTutors);
byId('bookingSearch').addEventListener('input', renderBookings);
byId('bookingStatusFilter').addEventListener('change', renderBookings);

byId('adminLogout')?.addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error signing out:', error);
    setStatus('Unable to log out. Please try again.', true);
  }
});
