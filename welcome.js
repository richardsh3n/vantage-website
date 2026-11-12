const welcome = document.querySelector('.welcome');
const stage = welcome.querySelector('.welcome-stage');
const doors = welcome.querySelector('.brand-doors');
const lockup = welcome.querySelector('.welcome-lockup');
const motion = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 490px)');
let frame;
let start = 0;
let travel = 0;

function update() {
  frame = null;
  const progress = travel > 0
    ? Math.min(1, Math.max(0, (window.scrollY - start) / travel))
    : 1;
  const reveal = Math.max(0, Math.min(1, (progress - .28) / .66));
  const split = reveal * reveal * (3 - 2 * reveal);
  welcome.style.setProperty('--door-split', split);
  welcome.style.setProperty('--welcome-progress', progress);
  welcome.style.setProperty('--welcome-reveal', reveal);
  doors.inert = motion.matches && reveal < .88;
  lockup.inert = motion.matches && reveal >= .62;
  welcome.querySelector('.welcome-enter').inert = motion.matches && reveal >= .88;
}

function schedule() {
  if (frame == null) frame = requestAnimationFrame(update);
}

function measure() {
  welcome.classList.toggle('welcome-connected', motion.matches);
  const scrollInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  start = welcome.getBoundingClientRect().top + window.scrollY;
  const height = stage.offsetHeight;
  travel = motion.matches ? welcome.offsetHeight - height - scrollInset : 0;
  welcome.style.setProperty('--stage-height', height + 'px');
  schedule();
}

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', measure);
motion.addEventListener('change', measure);
measure();
if ('ResizeObserver' in window) {
  const header = document.querySelector('.mast');
  new ResizeObserver(measure).observe(header);
}
if (location.hash === '#branches' && motion.matches) {
  requestAnimationFrame(() => document.querySelector('#branches').scrollIntoView({ behavior: 'instant' }));
}
