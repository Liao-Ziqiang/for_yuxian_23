(() => {
  const canvas = document.querySelector('#tap-effects');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const jewelColors = ['161, 91, 190', '208, 102, 155', '186, 129, 46', '83, 152, 153'];
  const soapColors = ['148, 119, 190', '194, 116, 157', '94, 160, 153'];
  const bursts = [];
  const turn = Math.PI * 2;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rgba = (color, opacity) => `rgba(${color}, ${opacity})`;
  const easeOut = (progress) => 1 - (1 - progress) ** 1.6;
  const displayRatio = () => Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4_000_000 / (width * height || 1)));

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    bursts.length = 0;
    context.clearRect(0, 0, width, height);
  }

  function resize() {
    clear();
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    pixelRatio = displayRatio();
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function traceFront(radius, phase, wobble, start = 0, end = turn) {
    const steps = Math.ceil((end - start) * 8);
    for (let index = 0; index <= steps; index += 1) {
      const angle = start + (end - start) * index / steps;
      const shape = 0.58 * Math.sin(angle * 3 + phase)
        + 0.30 * Math.sin(angle * 5 - phase * 0.6)
        + 0.12 * Math.sin(angle * 9 + phase * 1.4);
      const edge = radius + shape * wobble;
      const x = Math.cos(angle) * edge;
      const y = Math.sin(angle) * edge;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    if (end - start === turn) context.closePath();
  }

  function wave(age, phase, reach, strength) {
    const progress = age / 1020;
    if (progress <= 0 || progress >= 1) return;

    const radius = 5 + reach * easeOut(progress);
    const wakeWidth = 2.6 + 6.2 * progress;
    const opacity = Math.min(progress * 15, 1) * (1 - progress) ** 1.2 * strength;
    const drift = phase + progress * 1.7;
    const wobble = Math.min(radius * 0.14, 1.8 + radius * 0.035) * (1 - progress * 0.30);

    const sheen = context.createLinearGradient(-radius * 0.68, -radius * 0.73, radius * 0.75, radius * 0.68);
    sheen.addColorStop(0, rgba('255, 255, 255', 0.87 * opacity));
    sheen.addColorStop(0.37, rgba('208, 202, 244', 0.42 * opacity));
    sheen.addColorStop(0.68, rgba('148, 192, 193', 0.16 * opacity));
    sheen.addColorStop(1, rgba('134, 108, 161', 0.30 * opacity));
    context.fillStyle = sheen;
    context.beginPath();
    traceFront(radius + wakeWidth * 0.35, drift, wobble);
    traceFront(radius - wakeWidth * 0.65, drift, wobble);
    context.fill('evenodd');

    const shadow = context.createLinearGradient(-radius * 0.6, -radius * 0.65, radius * 0.6, radius * 0.65);
    shadow.addColorStop(0, rgba('132, 94, 164', 0.32 * opacity));
    shadow.addColorStop(0.46, rgba('116, 105, 155', 0.12 * opacity));
    shadow.addColorStop(1, rgba('99, 137, 156', 0.28 * opacity));
    context.strokeStyle = shadow;
    context.lineWidth = 1.7;
    context.beginPath();
    traceFront(radius - wakeWidth * 0.70, drift, wobble);
    context.stroke();

    context.strokeStyle = rgba('255, 255, 255', 0.96 * opacity);
    context.lineWidth = 1.55 - progress * 0.65;
    context.lineCap = 'round';
    context.beginPath();
    traceFront(radius + wakeWidth * 0.22, drift, wobble, 3.38, 5.30);
    traceFront(radius + wakeWidth * 0.22, drift, wobble, 0.04, 0.68);
    context.stroke();
  }

  function drawWater(burst, age) {
    context.save();
    context.translate(burst.x, burst.y);
    context.scale(1, burst.flattening);

    const impact = clamp(age / 530, 0, 1);
    if (impact < 1) {
      const radius = 9 + 33 * easeOut(impact);
      const amplitude = Math.min(age / 32, 1) * (1 - impact) ** 1.35;
      const surface = context.createRadialGradient(-radius * 0.24, -radius * 0.2, 0, 0, 0, radius);
      surface.addColorStop(0, rgba('255, 255, 255', 0.82 * amplitude));
      surface.addColorStop(0.3, rgba('228, 220, 250', 0.44 * amplitude));
      surface.addColorStop(0.58, rgba('148, 141, 195', 0.20 * amplitude));
      surface.addColorStop(0.79, rgba('181, 213, 210', 0.16 * amplitude));
      surface.addColorStop(1, 'rgba(181, 213, 210, 0)');
      context.fillStyle = surface;
      context.fillRect(-radius, -radius, radius * 2, radius * 2);
    }

    wave(age, burst.phase, burst.reach, 1);
    wave(age - 125, burst.phase + 1.3, burst.reach * 0.74, 0.58);
    wave(age - 260, burst.phase + 2.4, burst.reach * 0.47, 0.30);
    context.restore();
  }

  function drawBubble(burst, particle, progress) {
    const travel = progress * (1.2 - 0.2 * progress);
    const sway = Math.sin(progress * turn * 1.05 + particle.phase) - Math.sin(particle.phase);
    const radius = particle.size * (0.72 + 0.41 * easeOut(Math.min(progress * 1.13, 1)));
    const rise = Math.min(particle.rise, Math.max(22, burst.y - 10));
    const x = clamp(burst.x + particle.dx * travel + sway * particle.sway, radius + 1, width - radius - 1);
    const y = burst.y + particle.dy * (1 - travel) - rise * travel;
    const opacity = Math.min(progress * 10, 1) * Math.min((1 - progress) * 6, 1)
      * clamp((y + radius) / (radius * 1.5), 0, 1);

    context.globalAlpha = opacity;
    const color = particle.color;
    if (progress > 0.89) {
      context.strokeStyle = rgba(color, 0.64);
      context.lineWidth = 1;
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = particle.phase + turn * arc / 3;
        context.beginPath();
        context.arc(x, y, radius * (1 + (progress - 0.89) * 4), angle, angle + 0.48);
        context.stroke();
      }
      return;
    }

    const film = context.createRadialGradient(x - radius * 0.31, y - radius * 0.37, 0, x, y, radius);
    film.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
    film.addColorStop(0.31, 'rgba(255, 255, 255, 0.16)');
    film.addColorStop(0.64, rgba(color, 0.08));
    film.addColorStop(0.88, rgba(color, 0.31));
    film.addColorStop(1, 'rgba(186, 218, 209, 0.42)');
    context.fillStyle = film;
    const rim = context.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    rim.addColorStop(0, rgba(color, 0.80));
    rim.addColorStop(0.33, 'rgba(255, 255, 255, 0.91)');
    rim.addColorStop(0.66, 'rgba(102, 170, 165, 0.58)');
    rim.addColorStop(1, rgba(color, 0.73));
    context.strokeStyle = rim;
    context.lineWidth = 1.05;
    context.beginPath();
    context.arc(x, y, radius, 0, turn);
    context.fill();
    context.stroke();

    context.strokeStyle = 'rgba(255, 255, 255, 0.96)';
    context.lineWidth = 1.3;
    context.lineCap = 'round';
    context.beginPath();
    context.arc(x, y, radius * 0.72, 3.55, 4.56);
    context.stroke();
  }

  function drawJewel(burst, particle, progress) {
    const travel = easeOut(progress);
    const x = clamp(burst.x + particle.dx * travel, 4, width - 4);
    const y = clamp(burst.y + particle.dy * travel - 20 * Math.sin(progress * Math.PI), 4, height - 4);
    const twinkle = 0.73 + 0.27 * Math.sin(progress * 16 + particle.phase) ** 2;
    const size = particle.size * (0.53 + 0.47 * Math.sin(Math.PI * progress));
    const opacity = Math.min(progress * 13, 1) * (1 - progress) ** 0.72;
    const color = particle.color;

    context.globalAlpha = opacity;
    const glow = context.createRadialGradient(x, y, size * 0.15, x, y, size * 2.3);
    glow.addColorStop(0, rgba(color, 0.75));
    glow.addColorStop(0.44, rgba(color, 0.30));
    glow.addColorStop(1, rgba(color, 0));
    context.fillStyle = glow;
    context.fillRect(x - size * 2.3, y - size * 2.3, size * 4.6, size * 4.6);

    const length = size * twinkle;
    const waist = length * 0.20;
    context.translate(x, y);
    context.rotate(particle.phase * 0.17 + progress * 0.38);
    context.fillStyle = '#fffefb';
    context.strokeStyle = rgba(color, 0.90);
    context.lineJoin = 'round';
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(0, -length);
    context.quadraticCurveTo(waist * 0.22, -waist, length * 0.80, 0);
    context.quadraticCurveTo(waist, waist * 0.15, 0, length);
    context.quadraticCurveTo(-waist * 0.19, waist, -length * 0.80, 0);
    context.quadraticCurveTo(-waist, -waist * 0.18, 0, -length);
    context.closePath();
    context.stroke();
    context.fill();
  }

  function render(now) {
    frame = 0;
    context.clearRect(0, 0, width, height);

    for (const burst of bursts) drawWater(burst, Math.max(0, now - burst.start));
    for (let index = bursts.length - 1; index >= 0; index -= 1) {
      const burst = bursts[index];
      const age = now - burst.start;
      if (age >= burst.duration) {
        bursts.splice(index, 1);
        continue;
      }
      for (const particle of burst.particles) {
        const progress = (age - particle.delay) / particle.duration;
        if (progress <= 0 || progress >= 1) continue;
        context.save();
        if (burst.bubbles) drawBubble(burst, particle, progress);
        else drawJewel(burst, particle, progress);
        context.restore();
      }
    }

    if (bursts.length) frame = requestAnimationFrame(render);
  }

  function makeBurst(x, y) {
    const bubbles = Math.random() < 0.5;
    const colors = bubbles ? soapColors : jewelColors;
    const particleCount = 5 + Math.floor(Math.random() * 3);
    const heading = random(0, turn);
    const particles = Array.from({ length: particleCount }, (_, index) => {
      const angle = turn * index / particleCount + heading + random(-0.31, 0.31);
      const distance = bubbles ? random(12, 52) : random(26, 87);
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * (bubbles ? 8 : distance * 0.74),
        rise: random(72, 124),
        sway: random(5, 14),
        size: bubbles ? random(3.8, 8.9) : random(3.2, 7.2),
        delay: random(18, 132),
        duration: bubbles ? random(1040, 1410) : random(650, 1050),
        phase: random(0, turn),
        color: colors[index % colors.length],
      };
    });
    return {
      x, y, bubbles, particles,
      start: performance.now(),
      duration: Math.max(1280, ...particles.map((particle) => particle.delay + particle.duration)),
      reach: random(84, 111),
      flattening: random(0.69, 0.74),
      phase: random(0, turn),
    };
  }

  resize();
  window.addEventListener('resize', resize);
  reducedMotion.addEventListener('change', resize);

  document.addEventListener('birthday:tap', (event) => {
    if (reducedMotion.matches) return;

    const { x, y } = event.detail ?? {};
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width !== width || bounds.height !== height || pixelRatio !== displayRatio()) resize();
    if (!width || !height) return;

    if (bursts.length === 5) bursts.shift();
    bursts.push(makeBurst(x - bounds.left, y - bounds.top));
    if (!frame) frame = requestAnimationFrame(render);
  });
})();
