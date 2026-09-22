(() => {
  const root = document.documentElement;
  const storageKey = 'tutorlink-theme';
  const storedTheme = localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  root.dataset.theme = initialTheme;

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

  const toggle = document.querySelector('.theme-toggle') || document.createElement('button');
  const hasExistingToggle = toggle.parentElement !== null;
  toggle.className = 'theme-toggle';
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

  document.querySelectorAll('.site-header, .navbar, .admin-topbar').forEach((header) => {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  });

  const revealTargets = document.querySelectorAll('main > section, .card, .concept-card, .tutor-card, .benefit, .step, .stat-card, .list-row, .verify-card');
  revealTargets.forEach((element, index) => {
    element.dataset.reveal = '';
    element.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 45}ms`);
    if (element.matches('.card, .stat-card, .list-row, .verify-card, .concept-card, .tutor-card')) element.dataset.skeleton = '';
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

  document.querySelectorAll('[data-skeleton]').forEach((element) => {
    window.setTimeout(() => element.removeAttribute('data-skeleton'), 650);
  });

  document.querySelectorAll('form').forEach((form) => form.addEventListener('submit', () => {
    if (form.checkValidity()) showToast('Your request is being processed...');
  }));

  document.querySelectorAll('a[href="#"]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('This section is coming soon.');
  }));

  const filterForm = document.querySelector('[data-results-filters]');
  const resultCards = [...document.querySelectorAll('[data-tutor-card]')];
  const resultCount = document.querySelector('[data-results-count]');
  const feeRange = filterForm?.querySelector('[data-filter="price"]');
  const feeOutput = document.querySelector('[data-fee-output]');

  const updateResults = () => {
    if (!filterForm || !resultCards.length) return;
    const selectedSubject = filterForm.querySelector('[data-filter="subject"]')?.value || '';
    const selectedGrade = filterForm.querySelector('[data-filter="grade"]')?.value || '';
    const selectedDistrict = filterForm.querySelector('[data-filter="district"]')?.value || '';
    const selectedAvailability = [...filterForm.querySelectorAll('[data-filter="availability"]:checked')].map((input) => input.value);
    const minimumRating = Number(filterForm.querySelector('[data-filter="rating"]:checked')?.value || 0);
    const maximumPrice = Number(feeRange?.value || Infinity);

    const visibleCards = resultCards.filter((card) => {
      const subjects = card.dataset.subject.split(' ');
      const grades = card.dataset.grade.split(' ');
      return subjects.includes(selectedSubject)
        && grades.includes(selectedGrade)
        && card.dataset.district === selectedDistrict
        && selectedAvailability.every((slot) => card.dataset.availability.split(' ').includes(slot))
        && Number(card.dataset.rating) >= minimumRating
        && Number(card.dataset.price) <= maximumPrice;
    });

    resultCards.forEach((card) => { card.hidden = !visibleCards.includes(card); });
    if (resultCount) resultCount.textContent = visibleCards.length;
    if (feeOutput && feeRange) feeOutput.textContent = `Rs. ${Number(feeRange.value).toLocaleString()}`;
  };

  filterForm?.addEventListener('input', updateResults);
  filterForm?.addEventListener('change', updateResults);
  filterForm?.addEventListener('reset', () => window.setTimeout(updateResults));
  document.querySelector('[data-filter="sort"]')?.addEventListener('change', (event) => {
    const sortDirection = event.target.value === 'Lowest fee' ? 1 : -1;
    resultCards.sort((first, second) => {
      const firstValue = event.target.value === 'Highest rated' ? Number(first.dataset.rating) : Number(first.dataset.price);
      const secondValue = event.target.value === 'Highest rated' ? Number(second.dataset.rating) : Number(second.dataset.price);
      return (firstValue - secondValue) * sortDirection;
    }).forEach((card) => card.parentElement.append(card));
  });
  updateResults();
})();
