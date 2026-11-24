(() => {
  const birthdayPage = document.querySelector('#birthday-page');
  const artwork = document.querySelector('.artwork');
  const effectsLayer = document.querySelector('#effects-layer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const interactive = 'button, input, select, textarea, label, a, summary, audio, [role="button"], [contenteditable]:not([contenteditable="false"])';
  const sealColors = ['#be93db', '#e59abb', '#d2b269'];

  function releaseSealSparkles(x, y) {
    const count = 7;
    const limit = 28;
    while (effectsLayer.childElementCount + count > limit) {
      effectsLayer.firstElementChild.remove();
    }

    const particles = Array.from({ length: count }, (_, index) => {
      const heart = index === 2;
      const particle = document.createElement('span');
      particle.className = heart ? 'sparkle sparkle--heart' : 'sparkle';
      particle.style.setProperty('--x', `${x}px`);
      particle.style.setProperty('--y', `${y}px`);
      const angle = (index + Math.random() * 0.65) * Math.PI * 2 / count;
      const distance = 17 + Math.random() * 35;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 12}px`);
      particle.style.setProperty('--size', `${(heart ? 8 : 4) + Math.random() * 5}px`);
      particle.style.setProperty('--spin', `${Math.random() * 140 - 70}deg`);
      particle.style.setProperty('--life', `${450 + Math.random() * 210}ms`);
      particle.style.setProperty('--color', sealColors[index % sealColors.length]);
      return particle;
    });
    effectsLayer.append(...particles);
    setTimeout(() => particles.forEach((particle) => particle.remove()), 690);
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
      if (birthdayPage.hidden || reducedMotion.matches) return;

      if (fromSeal) {
        const bounds = button.getBoundingClientRect();
        const x = event.detail ? event.clientX : bounds.left + bounds.width / 2;
        const y = event.detail ? event.clientY : bounds.top + bounds.height / 2;
        releaseSealSparkles(x, y);
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
  reducedMotion.addEventListener('change', () => {
    resetCoverTilt();
    effectsLayer.replaceChildren();
  });

  document.addEventListener('click', (event) => {
    if (birthdayPage.hidden || reducedMotion.matches || event.defaultPrevented || !event.detail) return;

    const target = event.target;
    const isPageBackground = target === document.body || target === document.documentElement;
    if (!isPageBackground && !birthdayPage.contains(target)) return;
    if (target.closest(interactive)) return;

    document.dispatchEvent(new CustomEvent('birthday:tap', {
      detail: { x: event.clientX, y: event.clientY },
    }));
  });
})();
