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
  const themeBtn = document.getElementById('theme-toggle');
  let replaying = false;
  
  if (themeBtn && document.startViewTransition) {
    themeBtn.addEventListener('click', (e) => {
      // me click eka apima aye daddi, normal widihata yanna denna
      if (replaying) return;
  
      // mulin original click eka nawathanawa
      e.stopImmediatePropagation();
      e.preventDefault();
  
      // button eke madhyama thaana
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
  
      // page eka puraama ahuwenna one radius eka
      const radius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      );
  
      // theme eka wenas karanawa (original click eka aye karala)
      const transition = document.startViewTransition(() => {
        replaying = true;
        themeBtn.click();
        replaying = false;
      });
  
      // button eken wattakara wihidenna
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 700,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    }, true);
  }