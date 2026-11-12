if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveal = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.replace('reveal-pending', 'reveal-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -32px' });

  for (const section of document.querySelectorAll('[data-reveal]')) {
    if (section.getBoundingClientRect().top < window.innerHeight) continue;
    section.classList.add('reveal-pending');
    reveal.observe(section);
    section.addEventListener('focusin', () => {
      section.classList.remove('reveal-pending');
      reveal.unobserve(section);
    }, { once: true });
  }
}

const opening = document.querySelector('.opening');
const movingOpening = matchMedia('(min-width:1000px) and (prefers-reduced-motion:no-preference)');
if (opening) {
  let queued = false;
  function positionPhotos() {
    queued = false;
    if (!movingOpening.matches) return;
    const progress = Math.max(0, Math.min(1, -opening.getBoundingClientRect().top / 155));
    opening.style.setProperty('--opening-progress', progress);
  }
  function schedulePosition() {
    if (queued || !movingOpening.matches) return;
    queued = true;
    requestAnimationFrame(positionPhotos);
  }
  function configureOpening() {
    opening.classList.toggle('has-motion', movingOpening.matches);
    schedulePosition();
  }
  movingOpening.addEventListener('change', configureOpening);
  window.addEventListener('scroll', schedulePosition, { passive: true });
  configureOpening();
}
