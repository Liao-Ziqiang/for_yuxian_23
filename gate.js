(() => {
  const entry = document.querySelector('#birthday-entry');
  const form = document.querySelector('#entry-form');
  const year = document.querySelector('#entry-year');
  const month = document.querySelector('#entry-month');
  const day = document.querySelector('#entry-day');
  const hour = document.querySelector('#entry-hour');
  const minute = document.querySelector('#entry-minute');
  const feedback = document.querySelector('#entry-feedback');
  const submit = document.querySelector('#entry-submit');
  const page = document.querySelector('#birthday-page');
  const title = document.querySelector('#track-title');
  const cover = document.querySelector('#birthday-cover');
  const audio = document.querySelector('#birthday-audio');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fields = [year, month, day, hour, minute];
  const answerHash = '7f8cb4536101d9b0cc8eb68be1f2478d780d6115d479f44d4b6f941f3c8d9ebf';

  function addOptions(select, first, last, unit, digits = 1) {
    for (let value = first; value <= last; value += 1) {
      const label = String(value).padStart(digits, '0');
      select.add(new Option(`${label} ${unit}`, String(value)));
    }
  }

  function syncDays() {
    const previousDay = day.value;
    day.options.length = 1;
    day.disabled = !year.value || !month.value;
    if (day.disabled) return;

    const daysInMonth = new Date(Number(year.value), Number(month.value), 0).getDate();
    addOptions(day, 1, daysInMonth, '日');
    day.value = Number(previousDay) <= daysInMonth ? previousDay : '';
  }

  function showFeedback(message) {
    feedback.hidden = !message;
    feedback.textContent = message;
  }

  function enterPlayer() {
    entry.inert = true;
    cover.src = cover.dataset.src;
    audio.src = audio.dataset.src;

    function reveal() {
      entry.hidden = true;
      page.classList.add('is-entering');
      page.hidden = false;
      window.scrollTo(0, 0);
      title.focus({ preventScroll: true });
    }

    if (reduceMotion.matches) {
      reveal();
      return;
    }

    entry.classList.add('is-leaving');
    window.setTimeout(reveal, 440);
  }

  addOptions(year, 2018, 2030, '年');
  addOptions(month, 1, 12, '月');
  addOptions(hour, 0, 23, '时', 2);
  addOptions(minute, 0, 59, '分', 2);
  syncDays();

  form.addEventListener('change', (event) => {
    if (event.target === year || event.target === month) syncDays();
    if (!feedback.hidden) showFeedback('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    const missing = fields.find((field) => !field.value);
    if (missing) {
      showFeedback('先选好完整的日期和时间。');
      missing.focus();
      return;
    }

    showFeedback('');
    submit.disabled = true;
    const [y, m, d, h, min] = fields.map((field) => field.value.padStart(2, '0'));

    try {
      const answer = new TextEncoder().encode(`${y}-${m}-${d}T${h}:${min}`);
      const digest = await window.crypto.subtle.digest('SHA-256', answer);
      const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
      if (hash === answerHash) {
        enterPlayer();
        return;
      }
      showFeedback('再想想，那一刻的日期和时间。');
    } catch {
      showFeedback('暂时无法核对答案，请用 HTTPS 打开后再试。');
    }
    submit.disabled = false;
  });
})();
