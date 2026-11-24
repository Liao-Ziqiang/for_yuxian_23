(() => {
  const button = document.querySelector('#wish-button');
  const toast = document.querySelector('#wish-toast');
  const wishText = document.querySelector('#wish-text');
  const announcement = document.querySelector('#wish-announce');
  const sparkleLayer = document.querySelector('#sparkle-layer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interactive = 'button, input, select, textarea, label, a, summary, audio, [role="button"], [contenteditable]:not([contenteditable="false"])';
  const colors = ['#b49bd6', '#d56e9b', '#9bab65', '#d3a456'];
  let wishes = [
    'Yuxian，23岁生日快乐！',
    '愿你天天开心，想笑的时候就大声笑。',
    '愿你许的愿望，有些悄悄实现，有些超出想象。',
    '愿这首歌陪你，也愿我陪你。',
  ];
  let remaining = [];
  let previous;
  let hideTimer;
  let announcementTimer;

  if (location.protocol !== 'file:') {
    fetch('./wishes.txt')
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => {
        const lines = [...new Set(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
        if (lines.length) {
          wishes = lines;
          remaining = [];
        }
      })
      .catch(() => {});
  }

  function nextWish() {
    if (!remaining.length) {
      remaining = wishes.slice();
    }
    let index = Math.floor(Math.random() * remaining.length);
    if (remaining.length > 1 && remaining[index] === previous) {
      index = (index + 1) % remaining.length;
    }
    [previous] = remaining.splice(index, 1);
    return previous;
  }

  function placeToast(x, y) {
    const gutter = 24;
    const spacing = 16;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const halfWidth = toast.offsetWidth / 2;
    const height = toast.offsetHeight;
    const left = Math.max(gutter + halfWidth, Math.min(x, viewportWidth - gutter - halfWidth));
    const above = y - spacing - height;
    const top = above >= gutter ? above : Math.max(gutter, Math.min(y + spacing, viewportHeight - gutter - height));
    toast.style.setProperty('--wish-x', `${left}px`);
    toast.style.setProperty('--wish-y', `${top}px`);
  }

  function releaseSparkles(x, y) {
    if (reducedMotion.matches) return;

    const count = 8;
    const limit = 40;
    while (sparkleLayer.childElementCount > limit - count) {
      sparkleLayer.firstElementChild.remove();
    }
    const burst = Array.from({ length: count }, (_, index) => {
      const particle = document.createElement('span');
      const heart = index === 2 || index === 6;
      const angle = (index + Math.random() * 0.7) * Math.PI * 2 / count;
      const distance = 25 + Math.random() * 45;
      particle.className = heart ? 'sparkle sparkle--heart' : 'sparkle';
      particle.style.setProperty('--x', `${x}px`);
      particle.style.setProperty('--y', `${y}px`);
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 15}px`);
      particle.style.setProperty('--size', `${(heart ? 9 : 4) + Math.random() * 4}px`);
      particle.style.setProperty('--spin', `${Math.random() * 140 - 70}deg`);
      particle.style.setProperty('--life', `${650 + Math.random() * 270}ms`);
      particle.style.setProperty('--color', colors[index % colors.length]);
      return particle;
    });
    sparkleLayer.append(...burst);
    setTimeout(() => burst.forEach((particle) => particle.remove()), 950);
  }

  function showWish(x, y, announce) {
    const text = nextWish();
    wishText.textContent = text;
    toast.classList.add('is-visible');
    placeToast(x, y);
    releaseSparkles(x, y);

    if (announce) {
      announcement.textContent = '';
      clearTimeout(announcementTimer);
      announcementTimer = setTimeout(() => { announcement.textContent = text; }, 35);
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 3400);
  }

  button.addEventListener('click', (event) => {
    const bounds = button.getBoundingClientRect();
    const x = event.detail ? event.clientX : bounds.left + bounds.width / 2;
    const y = event.detail ? event.clientY : bounds.top + bounds.height / 2;
    showWish(x, y, true);
  });

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || !event.detail || event.target.closest(interactive)) return;
    showWish(event.clientX, event.clientY, false);
  });

  window.addEventListener('resize', () => toast.classList.remove('is-visible'));
})();
