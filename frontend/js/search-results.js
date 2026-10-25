import { auth, db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const container = document.getElementById('tutor-cards-container');
const resultsCount = document.getElementById('resultsCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const subjectFilter = document.getElementById('subjectFilter');
const gradeFilter = document.getElementById('gradeFilter');
const districtFilter = document.getElementById('districtFilter');
const rateFilter = document.getElementById('rateFilter');
const sortSelect = document.getElementById('sortSelect');
const filterForm = document.getElementById('filterForm');
const applyBtn = document.getElementById('applyFiltersBtn');

// Pagination eka fake nisa hide karanawa
document.getElementById('paginationContainer')?.remove();

let tutors = [];

// Text eka safe karanna (kisiwek HTML eka damma nam page eka bindinne nae)
const safe = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// subjects array ekak hari, "Maths, Science" wage text ekak hari ekama widiyata ganna
const toText = (value) => (Array.isArray(value) ? value.join(', ') : (typeof value === 'string' ? value : ''));

function buildCard(t) {
  const card = document.createElement('article');
  card.className = 'tutor-card card';

  const initials = t.name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'T';
  const avatar = t.photoURL
    ? `<img src="${safe(t.photoURL)}" alt="${safe(t.name)}" class="tutor-avatar-img">`
    : `<div class="tutor-avatar">${safe(initials)}</div>`;
  const ratingText = t.reviewCount > 0 && t.rating > 0 ? `★ ${t.rating}` : 'New';
  const priceText = t.rate > 0 ? `LKR ${t.rate.toLocaleString()}` : 'Rate not specified';

  card.innerHTML = `
    <div class="tutor-card-top">
      ${avatar}
      <span class="rating">${safe(ratingText)}</span>
    </div>
    <h3>${safe(t.name)}</h3>
    <p class="tutor-subject">${safe(t.subjects || 'Subjects not specified')}</p>
    <div class="tutor-meta">
      <span>📍 ${safe(t.district || 'Islandwide')}</span>
      <span>🎓 ${safe(t.grade || 'All Grades')}</span>
    </div>
    <div class="tutor-footer">
      <strong class="price">${safe(priceText)}<span>${t.rate > 0 ? '/hr' : ''}</span></strong>
      <div class="tutor-actions">
        <button type="button" class="btn btn-primary book-tutor-btn">Book Now</button>
        <button type="button" class="btn btn-outline chat-tutor-btn">Chat with Tutor</button>
      </div>
    </div>
  `;

  card.querySelector('.book-tutor-btn').addEventListener('click', () => {
    window.handleBookTutor(t.id, t.name, t.subjects, t.rate);
  });
  card.querySelector('.chat-tutor-btn').addEventListener('click', () => {
    window.handleChatTutor(t.id);
  });

  return card;
}

function matchesRate(rate, selected) {
  if (!selected) return true;
  if (selected === '1000') return rate < 1000;
  if (selected === '1500') return rate >= 1000 && rate <= 1500;
  if (selected === '2000') return rate > 1500 && rate <= 2000;
  if (selected === 'above_2000') return rate > 2000;
  return true;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const subject = subjectFilter.value.toLowerCase();
  const grade = gradeFilter.value.toLowerCase();
  const district = districtFilter.value.toLowerCase();
  const rate = rateFilter.value;
  const availability = [...filterForm.querySelectorAll('input[name="availability"]:checked')].map((box) => box.value);

  const list = tutors.filter((t) => {
    const okQuery = !query || `${t.name} ${t.subjects}`.toLowerCase().includes(query);
    const okSubject = !subject || t.subjects.toLowerCase().includes(subject);
    const okGrade = !grade || t.grade.toLowerCase().includes(grade);
    const okDistrict = !district || t.district.toLowerCase() === district;
    const okRate = matchesRate(t.rate, rate);
    const okAvailability = availability.length === 0 || availability.some((a) => t.days.includes(a));
    return okQuery && okSubject && okGrade && okDistrict && okRate && okAvailability;
  });

  if (sortSelect.value === 'lowest') list.sort((a, b) => a.rate - b.rate);
  if (sortSelect.value === 'highest') list.sort((a, b) => b.rate - a.rate);
  if (sortSelect.value === 'experience') list.sort((a, b) => b.experience - a.experience);

  container.replaceChildren();
  if (list.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No tutors found.';
    container.appendChild(empty);
  } else {
    list.forEach((t) => container.appendChild(t.card));
  }
  resultsCount.textContent = `${list.length} tutor${list.length === 1 ? '' : 's'} found`;
}

async function loadTutors() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));

    tutors = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.role === 'tutor')
      .map((u) => {
        const tutor = {
          id: u.id,
          name: u.name || u.fullName || 'Tutor name not provided',
          photoURL: u.photoURL || '',
          subjects: toText(u.subjectsArray || u.subjects),
          district: typeof u.district === 'string' ? u.district : '',
          grade: toText(u.gradeLevels),
          rate: Number(u.hourlyRate) || 0,
          rating: Number(u.rating) || 0,
          reviewCount: Number(u.reviewCount) || 0,
          experience: Number(u.experience) || 0,
          days: toText(u.days).toLowerCase()
        };
        tutor.card = buildCard(tutor);
        return tutor;
      });

    render();
  } catch (error) {
    console.error('Firestore Error:', error);
    container.innerHTML = '<p>Unable to load tutors. Please try again later.</p>';
    resultsCount.textContent = '';
  }
}

// Buttons / filters
searchBtn.addEventListener('click', render);
searchInput.addEventListener('input', render);
applyBtn.addEventListener('click', render);
sortSelect.addEventListener('change', render);
filterForm.addEventListener('change', render);

// Book Now
window.handleBookTutor = (tutorId, tutorName, subject) => {
  if (!auth.currentUser) {
    alert('Booking ekak danna kalin karunakara Login wenna.');
    window.location.href = 'login.html';
    return;
  }
  const details = new URLSearchParams({ tutorId, tutorName, subject });
  window.location.href = `booking.html?${details.toString()}`;
};

// Chat with Tutor
window.handleChatTutor = (tutorId) => {
  if (!auth.currentUser) {
    alert('Chat karanna kalin karunakara Login wenna.');
    window.location.href = 'login.html';
    return;
  }
  window.location.href = `chat.html?tutorId=${encodeURIComponent(tutorId)}`;
};

loadTutors();