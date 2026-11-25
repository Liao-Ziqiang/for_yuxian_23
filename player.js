(() => {
  const birthdayPage = document.querySelector('#birthday-page');
  const artwork = document.querySelector('.artwork');
  const audio = document.querySelector('#birthday-audio');
  const playButton = document.querySelector('#play-toggle');
  const loopButton = document.querySelector('#loop-toggle');
  const muteButton = document.querySelector('#mute-toggle');
  const seek = document.querySelector('#seek');
  const volume = document.querySelector('#volume');
  const currentTime = document.querySelector('#current-time');
  const duration = document.querySelector('#duration');
  const status = document.querySelector('#player-status');
  const seekStep = 5;
  const editableFields = 'input:not([type="range"]), select, textarea, [contenteditable]:not([contenteditable="false"])';

  let playing = false;
  let soughtToTrackEnd = false;
  let lastAudibleVolume = Number(volume.value) / 100;

  function formatTime(seconds) {
    const wholeSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    const minutes = Math.floor(wholeSeconds / 60);
    return `${minutes}:${String(wholeSeconds % 60).padStart(2, '0')}`;
  }

  function fillRange(range) {
    const percent = Number(range.value) / Number(range.max) * 100;
    range.style.setProperty('--fill', `${percent}%`);
  }

  function syncPosition() {
    const hasDuration = Number.isFinite(audio.duration) && audio.duration > 0;
    seek.disabled = !hasDuration;
    seek.value = hasDuration ? audio.currentTime / audio.duration * Number(seek.max) : 0;
    currentTime.textContent = formatTime(audio.currentTime);
    duration.textContent = hasDuration ? formatTime(audio.duration) : '0:00';
    seek.setAttribute('aria-valuetext', `${currentTime.textContent} / ${duration.textContent}`);
    fillRange(seek);
  }

  function seekTo(seconds) {
    if (seek.disabled) return;
    const position = Math.max(0, Math.min(seconds, audio.duration));
    soughtToTrackEnd = position === audio.duration;
    artwork.classList.remove('is-track-ended');
    audio.currentTime = position;
    syncPosition();
  }

  function syncPlayback() {
    const isPlaying = !audio.paused && !audio.ended;
    const label = isPlaying ? '暂停' : '播放';
    playButton.classList.toggle('is-playing', isPlaying);
    playButton.setAttribute('aria-label', label);
    playButton.title = `${label}（空格）`;

    if (isPlaying !== playing) {
      playing = isPlaying;
      document.dispatchEvent(new CustomEvent('music:state', { detail: { playing } }));
    }
  }

  function syncVolume() {
    const silent = audio.muted || audio.volume === 0;
    muteButton.classList.toggle('is-muted', silent);
    muteButton.setAttribute('aria-pressed', String(silent));
    muteButton.title = silent ? '恢复声音' : '静音';

    if (audio.volume > 0) lastAudibleVolume = audio.volume;
    volume.value = Math.round(audio.volume * 100);
    volume.setAttribute('aria-valuetext', `${volume.value}%`);
    fillRange(volume);
  }

  function syncLoop() {
    loopButton.setAttribute('aria-pressed', String(audio.loop));
    loopButton.title = audio.loop ? '关闭单曲循环（L）' : '开启单曲循环（L）';
  }

  function setStatus(message) {
    status.hidden = !message;
    status.textContent = message;
  }

  playButton.addEventListener('click', async () => {
    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    setStatus('');
    if (audio.ended) audio.currentTime = 0;

    try {
      await audio.play();
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('音乐暂时无法播放，点播放再试一次。');
    }
  });

  loopButton.addEventListener('click', () => {
    audio.loop = !audio.loop;
    syncLoop();
  });

  seek.addEventListener('input', () => {
    seekTo(Number(seek.value) / Number(seek.max) * audio.duration);
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    audio.muted = false;
    syncVolume();
  });

  muteButton.addEventListener('click', () => {
    if (audio.volume === 0) {
      audio.volume = lastAudibleVolume;
      audio.muted = false;
    } else {
      audio.muted = !audio.muted;
    }
    syncVolume();
  });

  document.addEventListener('keydown', (event) => {
    if (birthdayPage.hidden || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest(editableFields)) return;

    const key = event.key.toLowerCase();
    switch (key) {
      case ' ':
      case 'l': {
        event.preventDefault();
        const button = key === ' ' ? playButton : loopButton;
        if (!event.repeat) button.click();
        break;
      }
      case 'arrowleft':
      case 'arrowright':
        event.preventDefault();
        seekTo(audio.currentTime + (key === 'arrowleft' ? -seekStep : seekStep));
        break;
    }
  });

  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'emptied']) {
    audio.addEventListener(event, syncPosition);
  }
  for (const event of ['play', 'pause', 'ended']) {
    audio.addEventListener(event, syncPlayback);
  }
  audio.addEventListener('play', () => {
    if (audio.currentTime < audio.duration) {
      soughtToTrackEnd = false;
      artwork.classList.remove('is-track-ended');
    }
  });
  audio.addEventListener('ended', () => {
    if (audio.ended && !audio.loop && !soughtToTrackEnd) {
      artwork.classList.add('is-track-ended');
    }
  });
  audio.addEventListener('volumechange', syncVolume);
  audio.addEventListener('error', () => {
    syncPlayback();
    setStatus('音乐加载失败，请刷新页面再试。');
  });

  audio.loop = false;
  audio.volume = lastAudibleVolume;

  if (Math.abs(audio.volume - lastAudibleVolume) > 0.001) {
    volume.disabled = true;
    volume.title = '请用设备按键调节音量';
    volume.setAttribute('aria-label', volume.title);
  }

  syncPosition();
  syncPlayback();
  syncLoop();
  syncVolume();
})();
