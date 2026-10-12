import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, doc, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const byId = (id) => document.getElementById(id);
const statusElement = byId('dashboardStatus');
let stopProfileListener;
let stopBookingsListener;

const setStatus = (message, isError = false) => {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.setAttribute('role', isError ? 'alert' : 'status');
};

const setText = (id, value) => {
  const element = byId(id);
  if (element) element.textContent = value;
};

const statusOf = (booking) => typeof booking.status === 'string' ? booking.status.toLowerCase() : '';

const listBooking = (booking) => {
  const card = document.createElement('article');
  card.className = 'booking-entry';

  const title = document.createElement('h3');
  title.textContent = booking.subject || 'Subject not specified';
  card.appendChild(title);

  const details = [
    booking.parentName ? `Parent: ${booking.parentName}` : '',
    booking.grade ? `Grade: ${booking.grade}` : '',
    booking.preferredDate ? `Date: ${booking.preferredDate}` : '',
    booking.preferredTime ? `Time: ${booking.preferredTime}` : '',
    booking.status ? `Status: ${booking.status}` : 'Status: Not specified'
  ].filter(Boolean);

  const description = document.createElement('p');
  description.textContent = details.join(' · ');
  card.appendChild(description);
  return card;
};

const renderList = (listId, emptyId, bookings, emptyMessage) => {
  const list = byId(listId);
  const empty = byId(emptyId);
  if (!list || !empty) return;

  list.replaceChildren();
  if (bookings.length === 0) {
    empty.hidden = false;
    empty.textContent = emptyMessage;
    return;
  }

  empty.hidden = true;
  bookings.forEach((booking) => list.appendChild(listBooking(booking)));
};

const isUpcoming = ({ preferredDate, preferredTime }) => {
  if (!preferredDate) return false;
  const date = new Date(`${preferredDate}T${preferredTime || '00:00'}`);
  return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
};

const renderBookings = (bookings) => {
  const pending = bookings.filter((booking) => statusOf(booking) === 'pending');
  const accepted = bookings.filter((booking) => ['accepted', 'confirmed'].includes(statusOf(booking)));
  const rejected = bookings.filter((booking) => ['rejected', 'declined'].includes(statusOf(booking)));
  const upcoming = accepted.filter(isUpcoming);
  const activeStudents = new Set(
    accepted.map(({ parentId }) => parentId).filter(Boolean)
  ).size;

  setText('newRequestsCount', String(bookings.length));
  setText('pendingRequestsCount', String(pending.length));
  setText('activeStudentsCount', String(activeStudents));
  setText('earningsActiveStudents', String(activeStudents));

  renderList('newRequestsList', 'newRequestsEmpty', bookings, 'No booking requests yet.');
  renderList('pendingRequestsList', 'pendingRequestsEmpty', pending, 'No pending requests.');
  renderList('acceptedRequestsList', 'acceptedRequestsEmpty', accepted, 'No accepted requests.');
  renderList('rejectedRequestsList', 'rejectedRequestsEmpty', rejected, 'No rejected requests.');
  renderList('upcomingSessionsList', 'upcomingSessionsEmpty', upcoming, 'No upcoming sessions.');

  const recognizedIds = new Set([...pending, ...accepted, ...rejected].map(({ id }) => id));
  const unknownStatuses = bookings.length - recognizedIds.size;
  setStatus(unknownStatuses
    ? `${bookings.length} booking requests loaded. ${unknownStatuses} have a status this dashboard does not recognize.`
    : `${bookings.length} booking request${bookings.length === 1 ? '' : 's'} loaded.`);
};

const renderProfile = (profile) => {
  const name = typeof profile.name === 'string' ? profile.name : '';
  const subjects = typeof profile.subjects === 'string' ? profile.subjects : '';
  const district = typeof profile.district === 'string' ? profile.district : '';
  const qualification = typeof profile.qualification === 'string' ? profile.qualification : '';
  const days = Array.isArray(profile.days) ? profile.days.filter((day) => typeof day === 'string') : [];
  const availableTime = typeof profile.availableTime === 'string' ? profile.availableTime : '';
  const hourlyRate = Number(profile.hourlyRate);

  setText('welcomeMessage', `Welcome back${name ? `, ${name}` : ''}`);
  setText('tutorName', name || 'Tutor profile');
  setText('profileAvatar', name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '--');
  setText('tutorSummary', [qualification, subjects, district].filter(Boolean).join(' · ') || 'Profile details have not been added yet.');
  setText('hourlyFee', Number.isFinite(hourlyRate) && hourlyRate > 0 ? `Rs. ${hourlyRate.toLocaleString()}` : 'Not set');
  setText('earningsHourlyFee', Number.isFinite(hourlyRate) && hourlyRate > 0 ? `Rs. ${hourlyRate.toLocaleString()}` : 'Not set');
  setText('availabilityEmpty', days.length || availableTime ? '' : 'No availability information.');

  const availabilityList = byId('availabilityList');
  if (availabilityList) {
    availabilityList.replaceChildren();
    if (!days.length && !availableTime) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No availability information.';
      availabilityList.appendChild(empty);
    } else {
      const availability = document.createElement('p');
      availability.textContent = [days.join(', '), availableTime].filter(Boolean).join(' · ');
      availabilityList.appendChild(availability);
    }
  }

  const profileFields = ['name', 'phone', 'district', 'city', 'qualification', 'subjects', 'bio', 'availableTime'];
  const completion = Math.round(profileFields.filter((field) => {
    const value = profile[field];
    return (typeof value === 'string' && value.trim().length > 0)
      || (Array.isArray(value) && value.length > 0);
  }).length / profileFields.length * 100);
  setText('profileCompletion', `${completion}%`);
  const progress = byId('profileProgress');
  if (progress) progress.style.width = `${completion}%`;
};

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  stopProfileListener = onSnapshot(doc(db, 'users', user.uid), (profileSnapshot) => {
    if (!profileSnapshot.exists()) {
      setStatus('Your tutor profile could not be found.', true);
      stopBookingsListener?.();
      return;
    }

    const profile = profileSnapshot.data();
    if (profile.role !== 'tutor') {
      setStatus('This dashboard is only available to tutor accounts.', true);
      stopBookingsListener?.();
      return;
    }

    renderProfile(profile);
    if (stopBookingsListener) return;

    const bookingsQuery = query(collection(db, 'bookings'), where('tutorId', '==', user.uid));
    stopBookingsListener = onSnapshot(bookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map((booking) => ({ id: booking.id, ...booking.data() }));
      renderBookings(bookings);
    }, (error) => {
      console.error('Error loading tutor bookings:', error);
      setStatus('Unable to load your booking requests. Please try again later.', true);
      ['newRequestsList', 'pendingRequestsList', 'acceptedRequestsList', 'rejectedRequestsList', 'upcomingSessionsList']
        .forEach((id) => {
          const list = byId(id);
          if (list) list.textContent = 'Unable to load booking data.';
        });
    });
  }, (error) => {
    console.error('Error loading tutor profile:', error);
    setStatus('Unable to load your profile. Please try again later.', true);
  });

  window.addEventListener('pagehide', () => {
    stopProfileListener?.();
    stopBookingsListener?.();
  }, { once: true });
});

byId('dashboardLogoutBtn')?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error signing out:', error);
    setStatus('Unable to log out. Please try again.', true);
  }
});
