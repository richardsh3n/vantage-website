const reader = document.querySelector('.book-reader');
const desk = reader.querySelector('.book-desk');
const display = reader.querySelector('.book-pages');
const counter = reader.querySelector('.book-counter');
const archive = document.querySelector('.book-archive');
const spreads = Array.from(archive.querySelectorAll('.book-spread'));
const controls = Array.from(reader.querySelectorAll('[data-book-step]'));
const singlePage = matchMedia('(max-width: 640px)');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const leaves = spreads.flatMap(figure => {
  const image = figure.querySelector('img');
  const source = { url: image.getAttribute('src'), label: image.alt };
  if (figure.classList.contains('book-sheet')) {
    return figure.firstElementChild.matches('.book-blank') ? [null, source] : [source, null];
  }
  return [{ ...source, side: 'left' }, { ...source, side: 'right' }];
});
let position = -1;
const firstInside = 2;
let activeTurn;
let pointer;

function pageCount() {
  return singlePage.matches ? 1 : 2;
}

function leaf(index, decorative = false) {
  const sheet = document.createElement('div');
  sheet.className = 'book-leaf';
  const data = leaves[index];
  if (data) {
    const image = document.createElement('img');
    image.src = data.url;
    image.alt = decorative ? '' : data.label + (data.side ? (data.side === 'left' ? '，左页' : '，右页') : '');
    if (data.side) sheet.classList.add('book-leaf-' + data.side);
    sheet.append(image);
  } else if (!decorative) {
    sheet.setAttribute('role', 'img');
    sheet.setAttribute('aria-label', '留白页');
  }
  return sheet;
}

function render() {
  const count = pageCount();
  display.classList.toggle('book-closed', position < 0);
  if (position < 0) {
    const cover = document.createElement('button');
    cover.type = 'button';
    cover.className = 'book-cover-button';
    cover.setAttribute('aria-label', '打开《Dawning Visions》封面');
    cover.append(leaf(1));
    cover.addEventListener('click', () => turn(1));
    display.replaceChildren(cover);
    counter.textContent = '封面';
    controls[0].setAttribute('aria-disabled', 'true');
    controls[1].setAttribute('aria-disabled', 'false');
    controls[1].querySelector('span').textContent = '打开';
    return;
  }
  controls[1].querySelector('span').textContent = '下一页';
  display.replaceChildren(...Array.from({ length: count }, (_, offset) => leaf(position + offset)));
  counter.textContent = count === 1
    ? `第 ${position + 1} / ${leaves.length} 页`
    : `第 ${position / 2 + 1} / ${spreads.length} 跨页`;
  for (const button of controls) {
    const next = position + Number(button.dataset.bookStep) * count;
    button.setAttribute('aria-disabled', String(next >= leaves.length));
  }
}

async function turn(direction) {
  const count = pageCount();
  if (activeTurn || (position < 0 && direction < 0)) return;
  const target = position < 0 ? firstInside : position + direction * count;
  if (target >= leaves.length) return;
  if (position < 0 || target < firstInside) {
    await moveCover(position < 0);
    return;
  }
  if (reduceMotion.matches) {
    position = target;
    render();
    return;
  }

  const forward = direction > 0;
  const sheet = document.createElement('div');
  sheet.className = 'book-turn ' + (forward ? 'turn-forward' : 'turn-backward');
  sheet.setAttribute('aria-hidden', 'true');

  const front = leaf(position + (count === 2 && forward ? 1 : 0), true);
  front.classList.add('turn-front');
  const back = leaf(target + (count === 2 && !forward ? 1 : 0), true);
  back.classList.add('turn-back');
  sheet.append(front, back);
  if (count === 2) {
    display.replaceChildren(leaf(forward ? position : target), leaf(forward ? target + 1 : position + 1), sheet);
  } else {
    display.replaceChildren(leaf(target), sheet);
  }

  const animation = sheet.animate(
    [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${direction * (count === 2 ? -180 : -100)}deg)` }],
    { duration: count === 2 ? 520 : 320, easing: 'cubic-bezier(.32,.03,.25,1)', fill: 'forwards' },
  );
  activeTurn = animation;
  try {
    await animation.finished;
    position = target;
  } catch {
    // A chapter jump or resize has already selected a stable page.
  } finally {
    if (activeTurn === animation) {
      activeTurn = null;
      render();
    }
  }
}

async function moveCover(opening) {
  const target = opening ? firstInside : -1;
  if (reduceMotion.matches) {
    jump(target);
    desk.focus({ preventScroll: true });
    return;
  }

  const wide = !singlePage.matches;
  const cover = document.createElement('div');
  cover.className = 'book-turn cover-turn';
  cover.setAttribute('aria-hidden', 'true');
  const front = leaf(1, true);
  const back = leaf(firstInside, true);
  front.classList.add('turn-front');
  back.classList.add('turn-back');
  cover.append(front, back);

  display.classList.remove('book-closed');
  display.classList.add('book-opening');
  const inside = [leaf(firstInside), ...(wide ? [leaf(firstInside + 1)] : [])];
  display.replaceChildren(...inside, cover);
  const duration = wide ? 690 : 410;
  const options = { duration, easing: 'cubic-bezier(.32,.03,.25,1)', fill: 'both', direction: opening ? 'normal' : 'reverse' };
  const angle = wide ? -180 : -96;
  const animation = cover.animate(
    wide
      ? [{ transform: 'translateX(-50%) rotateY(0deg)' }, { transform: 'translateX(0) rotateY(-180deg)' }]
      : [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${angle}deg)` }],
    options,
  );
  const interiorFades = inside.map(page => page.animate(
    [{ opacity: 0 }, { offset: .22, opacity: 0 }, { offset: .72, opacity: 1 }, { opacity: 1 }],
    options,
  ));
  activeTurn = animation;
  try {
    await animation.finished;
    position = target;
  } catch {
    // A chapter jump or resize has already selected a stable page.
  } finally {
    interiorFades.forEach(fade => fade.cancel());
    display.classList.remove('book-opening');
    if (activeTurn === animation) {
      activeTurn = null;
      render();
      desk.focus({ preventScroll: true });
    }
  }
}

function jump(index) {
  activeTurn?.cancel();
  activeTurn = null;
  position = index;
  render();
}

function readHash() {
  const id = location.hash.slice(1);
  const section = Array.from(archive.children).find(item => item.id === id);
  const figure = spreads.find(item => item.id === id) ?? section?.querySelector('.book-spread');
  if (!figure) return;
  const index = spreads.indexOf(figure) * 2;
  jump(index === 0 ? -1 : singlePage.matches && !leaves[index] ? index + 1 : index);
  reader.scrollIntoView({ block: 'start' });
}

for (const button of controls) {
  button.addEventListener('click', () => turn(Number(button.dataset.bookStep)));
}

desk.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  turn(event.key === 'ArrowRight' ? 1 : -1);
});

desk.addEventListener('pointerdown', event => {
  if (event.isPrimary && event.pointerType !== 'mouse') pointer = { x: event.clientX, y: event.clientY };
});
desk.addEventListener('pointerup', event => {
  if (!pointer) return;
  const x = event.clientX - pointer.x;
  const y = event.clientY - pointer.y;
  pointer = null;
  if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y)) turn(x < 0 ? 1 : -1);
});
desk.addEventListener('pointercancel', () => { pointer = null; });

singlePage.addEventListener('change', () => jump(
  position < 0 ? -1 : singlePage.matches ? position + (leaves[position] ? 0 : 1) : position - position % 2,
));
window.addEventListener('hashchange', readHash);
document.querySelector('.book-nav').addEventListener('click', event => {
  if (event.target.closest('a')?.hash === location.hash) readHash();
});
reader.hidden = false;
archive.hidden = true;
render();
readHash();
