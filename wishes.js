(() => {
  const birthdayPage = document.querySelector('#birthday-page');
  const artwork = document.querySelector('.artwork');
  const toast = document.querySelector('#wish-toast');
  const wishText = document.querySelector('#wish-text');
  const sparkleLayer = document.querySelector('#sparkle-layer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const interactive = 'button, input, select, textarea, label, a, summary, audio, [role="button"], [contenteditable]:not([contenteditable="false"])';
  const colors = ['#9d77a8a8', '#bf7b9ca8', '#a28ab5a8'];
  let wishes = [
    'Yuxian，23岁生日快乐！',
    '愿你天天开心，想笑的时候就大声笑。',
    '愿你许的愿望，有些悄悄实现，有些超出想象。',
    '愿这首歌陪你，也愿我陪你。',
  ];
  let remaining = [];
  let previous;
  let hideTimer;

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
    toast.style.setProperty('--wish-entry-y', above >= gutter ? '7px' : '-7px');
  }

  function releaseSparkles(x, y, fromSeal = false) {
    if (reducedMotion.matches) return;

    const count = fromSeal ? 7 : 4;
    const limit = 28;
    while (sparkleLayer.childElementCount > limit - count) {
      sparkleLayer.firstElementChild.remove();
    }
    const burst = Array.from({ length: count }, (_, index) => {
      const particle = document.createElement('span');
      const heart = fromSeal && index === 2;
      const angle = (index + Math.random() * 0.7) * Math.PI * 2 / count;
      const distance = 14 + Math.random() * (fromSeal ? 35 : 17);
      particle.className = heart ? 'sparkle sparkle--heart' : 'sparkle';
      particle.style.setProperty('--x', `${x}px`);
      particle.style.setProperty('--y', `${y}px`);
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 9}px`);
      particle.style.setProperty('--size', `${(heart ? 7 : 3) + Math.random() * 2}px`);
      particle.style.setProperty('--spin', `${Math.random() * 140 - 70}deg`);
      particle.style.setProperty('--life', `${420 + Math.random() * 210}ms`);
      particle.style.setProperty('--color', colors[index % colors.length]);
      return particle;
    });
    sparkleLayer.append(...burst);
    setTimeout(() => burst.forEach((particle) => particle.remove()), 660);
  }

  function hideWish() {
    clearTimeout(hideTimer);
    toast.classList.remove('is-visible');
  }

  function showWish(x, y) {
    hideWish();
    wishText.textContent = nextWish();
    // Measuring the hidden text also resets its entrance animation before a new click.
    placeToast(x, y);
    toast.classList.add('is-visible');
    releaseSparkles(x, y);
    hideTimer = setTimeout(hideWish, 1300);
  }

  function resetCoverTilt() {
    artwork.style.removeProperty('--cover-rx');
    artwork.style.removeProperty('--cover-ry');
  }

  function bindArtworkEffect(selector, animationClass, duration, { fromSeal = false } = {}) {
    const button = document.querySelector(selector);
    if (!button) return;

    let animationTimer;
    const resetAnimation = () => {
      clearTimeout(animationTimer);
      artwork.classList.remove(animationClass);
    };

    button.addEventListener('click', (event) => {
      if (birthdayPage.hidden) return;

      hideWish();
      if (reducedMotion.matches) return;

      if (fromSeal) {
        const bounds = button.getBoundingClientRect();
        const x = event.detail ? event.clientX : bounds.left + bounds.width / 2;
        const y = event.detail ? event.clientY : bounds.top + bounds.height / 2;
        releaseSparkles(x, y, true);
      }

      resetAnimation();
      // Flush the removed class so successive clicks restart the CSS animation.
      void artwork.offsetWidth;
      artwork.classList.add(animationClass);
      animationTimer = setTimeout(resetAnimation, duration);
    });

    reducedMotion.addEventListener('change', resetAnimation);
  }

  bindArtworkEffect('#cover-trigger', 'is-cover-touched', 1180);
  bindArtworkEffect('#birthday-seal', 'is-celebrating', 1650, { fromSeal: true });

  artwork.addEventListener('pointermove', (event) => {
    if (birthdayPage.hidden || event.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return;

    const { left, top, width, height } = artwork.getBoundingClientRect();
    const horizontal = (event.clientX - left) / width * 2 - 1;
    const vertical = (event.clientY - top) / height * 2 - 1;
    artwork.style.setProperty('--cover-rx', `${Math.max(-4, Math.min(4, -vertical * 4))}deg`);
    artwork.style.setProperty('--cover-ry', `${Math.max(-4, Math.min(4, horizontal * 4))}deg`);
  });
  artwork.addEventListener('pointerleave', resetCoverTilt);
  finePointer.addEventListener('change', resetCoverTilt);
  reducedMotion.addEventListener('change', resetCoverTilt);

  document.addEventListener('click', (event) => {
    if (birthdayPage.hidden || event.defaultPrevented || !event.detail) return;

    const target = event.target;
    const isPageBackground = target === document.body || target === document.documentElement;
    if (!isPageBackground && !birthdayPage.contains(target)) return;
    if (target.closest(interactive)) return;

    showWish(event.clientX, event.clientY);
  });

  window.addEventListener('resize', hideWish);
})();
