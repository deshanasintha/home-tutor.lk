import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ Firebase Config details:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "home-tutor-8924e.firebaseapp.com",
  projectId: "home-tutor-8924e",
  storageBucket: "home-tutor-8924e.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  const filterForm = document.querySelector('[data-results-filters]');
  const tutorsContainer = document.getElementById('tutors-container') || document.querySelector('.tutor-grid');
  const resultCount = document.querySelector('[data-results-count]');
  const feeRange = filterForm?.querySelector('[data-filter="price"]');
  const feeOutput = document.querySelector('[data-fee-output]');

  // Firestore එකෙන් Data Load කරන Function එක
  const loadFirebaseTutors = async () => {
    if (!tutorsContainer) return;

    try {
      const querySnapshot = await getDocs(collection(db, "tutors"));
      
      if (querySnapshot.empty) {
        tutorsContainer.innerHTML = `<p class="no-tutors">තවම Tutors ලා ලියාපදිංචි වී නොමැත.</p>`;
        if (resultCount) resultCount.textContent = '0';
        return;
      }

      tutorsContainer.innerHTML = '';
      let totalTutors = 0;
      const districtsSet = new Set();
      const subjectsSet = new Set();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        totalTutors++;

        if (data.district) districtsSet.add(data.district);
        if (data.subject) subjectsSet.add(data.subject);

        const card = document.createElement('article');
        card.className = 'tutor-card';
        card.setAttribute('data-tutor-card', '');
        card.setAttribute('data-subject', data.subject || '');
        card.setAttribute('data-grade', data.grade || '');
        card.setAttribute('data-district', data.district || '');
        card.setAttribute('data-price', data.hourlyRate || 0);
        card.setAttribute('data-rating', data.rating || 0);
        card.setAttribute('data-availability', data.availability || '');

        const initials = data.name ? data.name.split(' ').map(n => n[0]).join('') : 'T';
        const imageHTML = data.photoURL 
          ? `<img src="${data.photoURL}" alt="${data.name}" class="tutor-avatar-img">`
          : `<div class="tutor-avatar">${initials}</div>`;

        card.innerHTML = `
          <div class="tutor-card-top tab-blue">
            ${imageHTML}
            <span class="rating">★ ${data.rating || 'New'}</span>
          </div>
          <h3>${data.name || 'Anonymous Tutor'}</h3>
          <p class="tutor-subject">${data.subject || 'Not specified'}</p>
          <div class="tutor-meta">
            <span>📍 ${data.district || 'Islandwide'}</span>
            <span>🎓 ${data.grade || 'All Grades'}</span>
          </div>
          <div class="tutor-footer">
            <strong class="price">LKR ${Number(data.hourlyRate || 0).toLocaleString()}<span>/hr</span></strong>
          </div>
        `;

        tutorsContainer.appendChild(card);
      });

      const statTutors = document.getElementById('stat-tutors');
      const statDistricts = document.getElementById('stat-districts');
      const statSubjects = document.getElementById('stat-subjects');

      if (statTutors) statTutors.textContent = totalTutors;
      if (statDistricts) statDistricts.textContent = districtsSet.size;
      if (statSubjects) statSubjects.textContent = subjectsSet.size;

      applyAnimations();
      updateFilterResults();

    } catch (error) {
      console.error("Error fetching tutors from Firestore:", error);
      showToast('Error loading tutor profiles.');
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