import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, doc, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const statusElement = document.getElementById('dashboardStatus');
const nameElement = document.getElementById('welcomeMessage');
let stopBookingsListener;
const groups = {
  pending: {
    count: document.getElementById('pendingCount'),
    list: document.getElementById('pendingRequestsList'),
    empty: 'No pending requests.'
  },
  accepted: {
    count: document.getElementById('acceptedCount'),
    list: document.getElementById('acceptedRequestsList'),
    empty: 'No accepted requests.'
  },
  rejected: {
    count: document.getElementById('rejectedCount'),
    list: document.getElementById('rejectedRequestsList'),
    empty: 'No rejected requests.'
  },
  upcoming: {
    count: document.getElementById('upcomingCount'),
    list: document.getElementById('upcomingSessionsList'),
    empty: 'No upcoming sessions.'
  }
};

const setStatus = (message, isError = false) => {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.setAttribute('role', isError ? 'alert' : 'status');
};

const statusOf = (booking) => typeof booking.status === 'string' ? booking.status.toLowerCase() : '';

const bookingCard = (booking) => {
  const card = document.createElement('article');
  card.className = 'booking-entry';

  const title = document.createElement('h3');
  title.textContent = booking.subject || 'Subject not specified';
  card.appendChild(title);

  const details = [
    booking.tutorName ? `Tutor: ${booking.tutorName}` : '',
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

const renderGroup = (group, bookings) => {
  group.count.textContent = String(bookings.length);
  group.list.replaceChildren();

  if (bookings.length === 0) {
    group.list.className = 'empty-state';
    group.list.textContent = group.empty;
    return;
  }

  group.list.className = 'booking-list';
  bookings.forEach((booking) => group.list.appendChild(bookingCard(booking)));
};

const classifyBookings = (bookings) => {
  const pending = bookings.filter((booking) => statusOf(booking) === 'pending');
  const accepted = bookings.filter((booking) => ['accepted', 'confirmed'].includes(statusOf(booking)));
  const rejected = bookings.filter((booking) => ['rejected', 'declined'].includes(statusOf(booking)));
  const now = Date.now();
  const upcoming = accepted.filter(({ preferredDate, preferredTime }) => {
    if (!preferredDate) return false;
    const date = new Date(`${preferredDate}T${preferredTime || '00:00'}`);
    return !Number.isNaN(date.getTime()) && date.getTime() >= now;
  });
  const recognized = new Set([...pending, ...accepted, ...rejected].map(({ id }) => id));
  const unrecognizedCount = bookings.filter(({ id }) => !recognized.has(id)).length;

  renderGroup(groups.pending, pending);
  renderGroup(groups.accepted, accepted);
  renderGroup(groups.rejected, rejected);
  renderGroup(groups.upcoming, upcoming);

  setStatus(unrecognizedCount
    ? `${bookings.length} booking requests loaded. ${unrecognizedCount} have a status this dashboard does not recognize.`
    : `${bookings.length} booking request${bookings.length === 1 ? '' : 's'} loaded.`);
};

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (profileSnapshot) => {
    if (!profileSnapshot.exists()) {
      setStatus('Your user profile could not be found.', true);
      stopBookingsListener?.();
      return;
    }

    const profile = profileSnapshot.data();
    if (!['parent', 'student'].includes(profile.role)) {
      setStatus('This dashboard is only available to parent and student accounts.', true);
      stopBookingsListener?.();
      return;
    }

    if (nameElement) nameElement.textContent = `Welcome back${profile.name ? `, ${profile.name}` : ''}`;
    if (stopBookingsListener) return;

    const bookingsQuery = query(collection(db, 'bookings'), where('parentId', '==', user.uid));
    stopBookingsListener = onSnapshot(bookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map((booking) => ({ id: booking.id, ...booking.data() }));
      classifyBookings(bookings);
    }, (error) => {
      console.error('Error loading parent bookings:', error);
      Object.values(groups).forEach((group) => {
        group.count.textContent = '—';
        group.list.className = 'empty-state';
        group.list.textContent = 'Unable to load booking data.';
      });
      setStatus('Unable to load your booking requests. Please try again later.', true);
    });

    window.addEventListener('pagehide', stopBookingsListener, { once: true });
  }, (error) => {
    console.error('Error loading parent profile:', error);
    setStatus('Unable to load your profile. Please try again later.', true);
  });

  window.addEventListener('pagehide', () => {
    profileUnsubscribe();
    stopBookingsListener?.();
  }, { once: true });
});

document.getElementById('parentLogoutBtn')?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error signing out:', error);
    setStatus('Unable to log out. Please try again.', true);
  }
});
