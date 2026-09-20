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
})();
