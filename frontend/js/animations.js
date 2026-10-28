const targets = document.querySelectorAll(
    '.section-intro, .period-board, .steps-grid, .featured-header, .cta-grid'
  );
  
  targets.forEach(el => el.classList.add('reveal'));
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  
  targets.forEach(el => observer.observe(el));