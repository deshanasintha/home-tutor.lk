import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(() => {
  const root = document.documentElement;
  const storageKey = 'tutorlink-theme';
  const storedTheme = localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  root.dataset.theme = initialTheme;

  // Toast Notification System
  const showToast = (message, duration = 3200) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.append(toast);
    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  };

  window.tutorLinkToast = showToast;

  // Theme Toggle Mechanism
  const toggle = document.querySelector('.theme-toggle') || document.createElement('button');
  const hasExistingToggle = toggle.parentElement !== null;
  toggle.className = 'theme-toggle';
  toggle.id = 'theme-toggle';
  toggle.type = 'button';
  toggle.title = 'Toggle theme';
  toggle.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;
    localStorage.setItem(storageKey, nextTheme);
    updateToggle();
    showToast(`${nextTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
  });

  const updateToggle = () => {
    const dark = root.dataset.theme === 'dark';
    toggle.textContent = dark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  updateToggle();

  const actions = document.querySelector('.nav-actions, .header-actions, .nav-cta, .admin-topbar');
  if (!hasExistingToggle && actions) actions.prepend(toggle);

  // Scroll Header Effect
  document.querySelectorAll('.site-header, .navbar, .admin-topbar').forEach((header) => {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  });

  // UI Reveal & Skeleton Animations
  const applyAnimations = () => {
    const revealTargets = document.querySelectorAll('main > section, .card, .concept-card, .tutor-card, .benefit, .step, .stat-card, .list-row, .verify-card');
    revealTargets.forEach((element, index) => {
      element.dataset.reveal = '';
      element.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 45}ms`);
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      }), { threshold: 0.08 });
      revealTargets.forEach((element) => observer.observe(element));
    } else {
      revealTargets.forEach((element) => element.classList.add('is-revealed'));
    }
  };

  // Generic UI Listeners
  document.querySelectorAll('form:not([data-results-filters])').forEach((form) => form.addEventListener('submit', () => {
    if (form.checkValidity()) showToast('Your request is being processed...');
  }));

  document.querySelectorAll('a[href="#"]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('This section is coming soon.');
  }));

  // =========================================================
  // FIREBASE FIRESTORE DATA FETCHING & FILTERING LOGIC
  // =========================================================
  const hasDedicatedResultsScript = Boolean(document.querySelector('script[src$="search-results.js"]'));
  const filterForm = hasDedicatedResultsScript ? null : document.querySelector('[data-results-filters]');
  const tutorsContainer = document.querySelector('.featured-tutors .tutor-grid');
  const resultCount = document.querySelector('[data-results-count]');
  const feeRange = filterForm?.querySelector('[data-filter="price"]');
  const feeOutput = document.querySelector('[data-fee-output]');

  // Firestore එකෙන් Data Load කරන Function එක
  const loadFirebaseTutors = async () => {
    if (!tutorsContainer) return;

    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const tutors = querySnapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((tutor) => tutor.role === 'tutor'
          && ['approved', 'verified'].includes(
            typeof tutor.status === 'string' ? tutor.status.toLowerCase() : ''
          ));

      tutorsContainer.replaceChildren();
      const districtsSet = new Set();
      const subjectsSet = new Set();

      tutors.forEach((data) => {
        if (typeof data.district === 'string' && data.district.trim()) {
          districtsSet.add(data.district.trim().toLowerCase());
        }
        const subjects = Array.isArray(data.subjectsArray)
          ? data.subjectsArray
          : typeof data.subjects === 'string' ? data.subjects.split(',') : [];
        subjects.forEach((subject) => {
          if (typeof subject === 'string' && subject.trim()) subjectsSet.add(subject.trim().toLowerCase());
        });

        const card = document.createElement('article');
        card.className = 'tutor-card';
        const top = document.createElement('div');
        top.className = 'tutor-card-top tab-blue';
        if (typeof data.photoURL === 'string' && data.photoURL) {
          const image = document.createElement('img');
          image.src = data.photoURL;
          image.alt = typeof data.name === 'string' ? data.name : 'Tutor profile';
          image.className = 'tutor-avatar-img';
          top.appendChild(image);
        } else {
          const avatar = document.createElement('div');
          avatar.className = 'tutor-avatar';
          avatar.textContent = typeof data.name === 'string'
            ? data.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
            : 'T';
          top.appendChild(avatar);
        }

        const reviewCount = Number(data.reviewCount);
        const rating = Number(data.rating);
        const ratingElement = document.createElement('span');
        ratingElement.className = 'rating';
        ratingElement.textContent = reviewCount > 0 && Number.isFinite(rating) ? `★ ${rating}` : 'New';
        top.appendChild(ratingElement);
        card.appendChild(top);

        const name = document.createElement('h3');
        name.textContent = typeof data.name === 'string' ? data.name : 'Tutor name not provided';
        card.appendChild(name);

        const subject = document.createElement('p');
        subject.className = 'tutor-subject';
        subject.textContent = typeof data.subjects === 'string' && data.subjects.trim()
          ? data.subjects
          : 'Subjects not specified';
        card.appendChild(subject);

        const meta = document.createElement('div');
        meta.className = 'tutor-meta';
        const district = document.createElement('span');
        district.textContent = typeof data.district === 'string' && data.district ? data.district : 'District not specified';
        const grade = document.createElement('span');
        grade.textContent = typeof data.gradeLevels === 'string' && data.gradeLevels ? data.gradeLevels : 'Grades not specified';
        meta.append(district, grade);
        card.appendChild(meta);

        const footer = document.createElement('div');
        footer.className = 'tutor-footer';
        const price = document.createElement('strong');
        price.className = 'price';
        const hourlyRate = Number(data.hourlyRate);
        price.textContent = Number.isFinite(hourlyRate) && hourlyRate > 0
          ? `LKR ${hourlyRate.toLocaleString()}/hr`
          : 'Rate not specified';
        footer.appendChild(price);
        card.appendChild(footer);
        tutorsContainer.appendChild(card);
      });

      if (!tutors.length) {
        const emptyState = document.createElement('p');
        emptyState.className = 'no-tutors';
        emptyState.textContent = 'No verified tutor profiles are available yet.';
        tutorsContainer.appendChild(emptyState);
      }

      const statTutors = document.getElementById('stat-tutors');
      const statDistricts = document.getElementById('stat-districts');
      const statSubjects = document.getElementById('stat-subjects');

      if (statTutors) statTutors.textContent = String(tutors.length);
      if (statDistricts) statDistricts.textContent = districtsSet.size;
      if (statSubjects) statSubjects.textContent = subjectsSet.size;

      applyAnimations();
      updateFilterResults();

    } catch (error) {
      console.error("Error fetching tutors from Firestore:", error);
      tutorsContainer.replaceChildren();
      const errorMessage = document.createElement('p');
      errorMessage.className = 'no-tutors';
      errorMessage.textContent = 'Unable to load tutor profiles. Please try again later.';
      tutorsContainer.appendChild(errorMessage);
      ['stat-tutors', 'stat-districts', 'stat-subjects'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.textContent = '—';
      });
    }
  };

  // Filter Update Logic
  const updateFilterResults = () => {
    const resultCards = [...document.querySelectorAll('[data-tutor-card]')];
    if (!filterForm || !resultCards.length) return;

    const selectedSubject = filterForm.querySelector('[data-filter="subject"]')?.value || '';
    const selectedGrade = filterForm.querySelector('[data-filter="grade"]')?.value || '';
    const selectedDistrict = filterForm.querySelector('[data-filter="district"]')?.value || '';
    const selectedAvailability = [...filterForm.querySelectorAll('[data-filter="availability"]:checked')].map((input) => input.value);
    const minimumRating = Number(filterForm.querySelector('[data-filter="rating"]:checked')?.value || 0);
    const maximumPrice = Number(feeRange?.value || Infinity);

    const visibleCards = resultCards.filter((card) => {
      const cardSubject = card.dataset.subject;
      const cardGrade = card.dataset.grade;
      const cardDistrict = card.dataset.district;
      const cardAvailability = card.dataset.availability.split(' ');

      const matchSubject = !selectedSubject || cardSubject.includes(selectedSubject);
      const matchGrade = !selectedGrade || cardGrade.includes(selectedGrade);
      const matchDistrict = !selectedDistrict || cardDistrict === selectedDistrict;
      const matchAvailability = selectedAvailability.length === 0 || selectedAvailability.every((slot) => cardAvailability.includes(slot));
      const matchRating = Number(card.dataset.rating) >= minimumRating;
      const matchPrice = Number(card.dataset.price) <= maximumPrice;

      return matchSubject && matchGrade && matchDistrict && matchAvailability && matchRating && matchPrice;
    });

    resultCards.forEach((card) => { card.hidden = !visibleCards.includes(card); });
    if (resultCount) resultCount.textContent = visibleCards.length;
    if (feeOutput && feeRange) feeOutput.textContent = `Rs. ${Number(feeRange.value).toLocaleString()}`;
  };

  filterForm?.addEventListener('input', updateFilterResults);
  filterForm?.addEventListener('change', updateFilterResults);
  filterForm?.addEventListener('reset', () => window.setTimeout(updateFilterResults));

  document.querySelector('[data-filter="sort"]')?.addEventListener('change', (event) => {
    const resultCards = [...document.querySelectorAll('[data-tutor-card]')];
    const sortDirection = event.target.value === 'Lowest fee' ? 1 : -1;
    resultCards.sort((first, second) => {
      const firstValue = event.target.value === 'Highest rated' ? Number(first.dataset.rating) : Number(first.dataset.price);
      const secondValue = event.target.value === 'Highest rated' ? Number(second.dataset.rating) : Number(second.dataset.price);
      return (firstValue - secondValue) * sortDirection;
    }).forEach((card) => card.parentElement.append(card));
  });

  loadFirebaseTutors();
})();

// =========================================================
// TOP RECOMMENDED TUTORS (Firebase eken real data)
// =========================================================
async function loadTopTutors() {
  const container = document.getElementById('top-tutors-container');
  if (!container) return;

  container.innerHTML = '<p class="no-tutors">Loading top tutors...</p>';

  try {
    const snapshot = await getDocs(collection(db, 'users'));

    const tutors = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.role === 'tutor')
      .sort((a, b) =>
        (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
        (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0)
      )
      .slice(0, 3); // hondama 3 k pennanawa

    container.replaceChildren();

    if (!tutors.length) {
      container.innerHTML = '<p class="no-tutors">No recommended tutors yet.</p>';
      return;
    }

    tutors.forEach((t) => {
      const subjects = Array.isArray(t.subjectsArray)
        ? t.subjectsArray.join(', ')
        : (typeof t.subjects === 'string' ? t.subjects : '');
      const rating = Number(t.rating) || 0;
      const reviews = Number(t.reviewCount) || 0;

      const card = document.createElement('article');
      card.className = 'tutor-card top-tutor-card';

      const badge = document.createElement('span');
      badge.className = 'top-badge';
      badge.textContent = 'Top Recommended';

      const name = document.createElement('h3');
      name.textContent = t.name || t.fullName || 'Tutor';

      const subject = document.createElement('p');
      subject.className = 'top-subject';
      subject.textContent = subjects || 'Subjects not specified';

      const ratingRow = document.createElement('div');
      ratingRow.className = 'top-rating';
      ratingRow.textContent = reviews > 0
        ? `⭐ ${rating} (${reviews} reviews)`
        : '⭐ New tutor';

      const btn = document.createElement('a');
      btn.className = 'btn btn-primary view-profile-btn';
      btn.href = 'search-tutors.html';
      btn.textContent = 'View Profile';

      card.append(badge, name, subject, ratingRow, btn);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Top tutors error:', error);
    container.innerHTML = '<p class="no-tutors">Unable to load tutors. Please try again later.</p>';
  }
}

loadTopTutors();

// =========================================================
// RATING SUBMISSION SYSTEM (localStorage)
// =========================================================
function submitRating(tutorName, ratingValue) {
  // පරණ ඩේටා බ්‍රව්සර් එකෙන් ගන්නවා
  let ratingsList = JSON.parse(localStorage.getItem('tutorRatings')) || [];
  
  // අලුත් රේටින්ග් එක ඇඩ් කරනවා
  ratingsList.push({
    tutor: tutorName,
    rating: Number(ratingValue),
    date: new Date().toLocaleDateString()
  });

  // නැවත Browser එකේ localStorage එකට සේව් කරනවා
  localStorage.setItem('tutorRatings', JSON.stringify(ratingsList));
  
  alert("ස්තූතියි! ඔබේ රේටින්ග් එක සාර්ථකව ඇඩ් විය.");
}

// HTML ෆෝම් එකේ Submit බොත්තම එබුනම ක්‍රියාත්මක වන ෆන්ක්ෂන් එක
function handleRatingSubmit() {
  const tutorNameInput = document.getElementById('tutor-name-input');
  const ratingValueInput = document.getElementById('rating-value-input');
  
  if (!tutorNameInput || !ratingValueInput) return;

  const tutorName = tutorNameInput.value;
  const ratingValue = ratingValueInput.value;
  
  submitRating(tutorName, ratingValue);
}