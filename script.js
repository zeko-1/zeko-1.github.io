const dialog = document.querySelector('#project-dialog');
const dialogContent = dialog.querySelector('.dialog-content');
const orbit = document.querySelector('.orbit-controls');
const cards = [...document.querySelectorAll('.project-card')];
const symbols = ['⌘', '◇', '◈', '◎', '✳'];
const projects = cards.map((card, index) => {
  const title = card.querySelector('h3').textContent;
  const detail = document.createElement('button');
  detail.type = 'button';
  detail.className = 'detail-button';
  detail.textContent = 'Project details ↗';
  detail.setAttribute('aria-label', 'View details for ' + title);
  detail.addEventListener('click', () => openItem(index, detail));
  card.querySelector('.project-body').append(detail);
  card.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; });

  return {
    title,
    symbol: symbols[index % symbols.length],
    content: () => {
      const body = card.querySelector('.project-body').cloneNode(true);
      body.className = '';
      body.querySelector('.detail-button').remove();
      const heading = document.createElement('h2');
      heading.textContent = title;
      body.querySelector('h3').replaceWith(heading);
      const gallery = card.querySelector('.project-visual').cloneNode(true);
      gallery.className = 'detail-gallery';
      gallery.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      body.append(gallery);
      return body;
    }
  };
});

const items = [...projects, {
  title: 'Dean’s List',
  symbol: '☆',
  content: () => {
    const block = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = 'Dean’s List';
    const description = document.createElement('p');
    const count = document.querySelector('.stat-grid > div:nth-child(2) strong').textContent;
    description.textContent = count + ' Dean’s List recognition as a Computer Science student at City University Cyberjaya.';
    block.append(heading, description);
    return block;
  }
}];

let activeIndex = 0;
let trigger;
function renderItem(index) {
  activeIndex = (index + items.length) % items.length;
  const content = items[activeIndex].content();
  content.querySelector('h2').id = 'dialog-title';
  dialogContent.replaceChildren(content);
  dialog.scrollTop = 0;
}

function openItem(index, source) {
  trigger = source;
  renderItem(index);
  dialog.showModal();
  dialog.querySelector('.dialog-close').focus();
}

items.forEach((item, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'orbit-button';
  button.setAttribute('aria-label', item.title);
  const tile = document.createElement('span');
  tile.className = 'orbit-tile';
  tile.setAttribute('aria-hidden', 'true');
  tile.textContent = item.symbol;
  const name = document.createElement('span');
  name.className = 'orbit-name';
  name.setAttribute('aria-hidden', 'true');
  name.textContent = item.title;
  button.append(tile, name);
  button.addEventListener('click', () => openItem(index, button));
  orbit.append(button);
});

dialog.querySelectorAll('[data-step]').forEach(button => {
  button.addEventListener('click', () => renderItem(activeIndex + Number(button.dataset.step)));
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom;
  if (event.target === dialog && outside) dialog.close();
});

const navLinks = [...document.querySelectorAll('.nav a')];
const navTargets = navLinks.map(link => document.querySelector(link.hash));
const updateNavigation = () => {
  const index = navTargets.findLastIndex(target => target.getBoundingClientRect().top <= 145);
  navLinks.forEach((link, i) => {
    if (i === Math.max(index, 0)) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};
addEventListener('scroll', updateNavigation, { passive: true });
updateNavigation();
