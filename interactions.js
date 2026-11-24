(() => {
  const birthdayPage = document.querySelector('#birthday-page');
  const artwork = document.querySelector('.artwork');
  const effectsLayer = document.querySelector('#effects-layer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const interactive = 'button, input, select, textarea, label, a, summary, audio, [role="button"], [contenteditable]:not([contenteditable="false"])';
  const starColors = ['#be93db', '#e59abb', '#d2b269'];
  const bubbleColors = ['#cbb4e7', '#efb3ca', '#b8d3c7'];
  const effectLimit = 48;
  const effectLifetime = 950;

  function atPoint(className, x, y) {
    const effect = document.createElement('span');
    effect.className = className;
    effect.style.setProperty('--x', `${x}px`);
    effect.style.setProperty('--y', `${y}px`);
    return effect;
  }

  function addEffects(effects) {
    while (effectsLayer.childElementCount + effects.length > effectLimit) {
      effectsLayer.firstElementChild.remove();
    }
    effectsLayer.append(...effects);
    setTimeout(() => effects.forEach((effect) => effect.remove()), effectLifetime);
  }

  function makeParticles(x, y, kind) {
    const isBubble = kind === 'bubbles';
    const fromSeal = kind === 'seal';
    const colors = isBubble ? bubbleColors : starColors;
    const count = fromSeal ? 7 : 6;
    const scatter = isBubble ? 23 : 35;
    const rise = isBubble ? 38 : 12;
    const lifetime = isBubble ? 620 : 450;
    return Array.from({ length: count }, (_, index) => {
      const heart = fromSeal && index === 2;
      const className = isBubble ? 'tap-bubble' : heart ? 'sparkle sparkle--heart' : 'sparkle';
      const particle = atPoint(className, x, y);
      const angle = (index + Math.random() * 0.65) * Math.PI * 2 / count;
      const distance = 17 + Math.random() * scatter;
      const minSize = isBubble ? 6 : heart ? 8 : 4;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance - rise}px`);
      particle.style.setProperty('--size', `${minSize + Math.random() * 5}px`);
      particle.style.setProperty('--spin', `${Math.random() * 140 - 70}deg`);
      particle.style.setProperty('--life', `${lifetime + Math.random() * 210}ms`);
      particle.style.setProperty('--color', colors[index % colors.length]);
      return particle;
    });
  }

  function rippleAt(x, y) {
    const ring = atPoint('tap-ripple', x, y);
    const echo = atPoint('tap-ripple tap-ripple--echo', x, y);
    ring.style.setProperty('--diameter', '132px');
    echo.style.setProperty('--diameter', '103px');
    const kind = Math.random() < 0.5 ? 'sparkles' : 'bubbles';
    addEffects([ring, echo, ...makeParticles(x, y, kind)]);
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
        addEffects(makeParticles(x, y, 'seal'));
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

    rippleAt(event.clientX, event.clientY);
  });
})();
