const welcome = document.querySelector('.welcome');
const stage = welcome.querySelector('.welcome-stage');
const doors = welcome.querySelector('.brand-doors');
const motion = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 490px)');
let frame;

function update() {
  frame = null;
  welcome.classList.toggle('welcome-connected', motion.matches);
  const scrollInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const travel = welcome.offsetHeight - stage.offsetHeight - scrollInset;
  const progress = motion.matches && travel > 0
    ? Math.min(1, Math.max(0, -welcome.getBoundingClientRect().top / travel))
    : 1;
  const reveal = Math.max(0, Math.min(1, (progress - .28) / .66));
  const split = reveal * reveal * (3 - 2 * reveal);
  welcome.style.setProperty('--door-split', split);
  welcome.style.setProperty('--welcome-progress', progress);
  welcome.style.setProperty('--welcome-reveal', reveal);
  welcome.style.setProperty('--stage-height', stage.offsetHeight + 'px');
  doors.inert = motion.matches && reveal < .88;
  welcome.querySelector('.welcome-enter').inert = motion.matches && reveal >= .88;
}

function schedule() {
  if (frame == null) frame = requestAnimationFrame(update);
}

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
motion.addEventListener('change', schedule);
update();
if (location.hash === '#branches' && motion.matches) {
  requestAnimationFrame(() => document.querySelector('#branches').scrollIntoView({ behavior: 'instant' }));
}
