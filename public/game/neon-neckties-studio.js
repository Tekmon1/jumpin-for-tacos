(() => {
  const concert = document.getElementById('concertTrack');
  const trio = document.getElementById('trioTrack');
  const instrumental = document.getElementById('instrumentalTrack');
  const guide = document.getElementById('guideTrack');
  const playButton = document.getElementById('playButton');
  const playIcon = playButton.querySelector('span');
  const playLabel = playButton.querySelector('strong');
  const seekBar = document.getElementById('seekBar');
  const volume = document.getElementById('volume');
  const currentTime = document.getElementById('currentTime');
  const duration = document.getElementById('duration');
  const playbackStatus = document.getElementById('playbackStatus');
  const playerTitle = document.getElementById('playerTitle');
  const canvas = document.getElementById('waveform');
  const ctx = canvas.getContext('2d');
  const mixButtons = [...document.querySelectorAll('.mix-button')];
  const sectionButtons = [...document.querySelectorAll('#sectionGrid button')];
  const tracksByMix = { concert, trio, instrumental, guide };

  const fallbackSections = [
    { id: 'concert-open', name: 'Stage Lights Rise', startSeconds: 0, endSeconds: 22 },
    { id: 'verse-one', name: 'First Verse', startSeconds: 22, endSeconds: 45 },
    { id: 'first-lift', name: 'First Lift', startSeconds: 45, endSeconds: 68 },
    { id: 'chorus-one', name: 'First Big Chorus', startSeconds: 68, endSeconds: 93 },
    { id: 'second-act', name: 'Second Act', startSeconds: 93, endSeconds: 117 },
    { id: 'crowd-break', name: 'Crowd Break', startSeconds: 117, endSeconds: 142 },
    { id: 'finale-lift', name: 'Finale Lift', startSeconds: 142, endSeconds: 168 },
    { id: 'encore', name: 'Neon Encore', startSeconds: 168, endSeconds: 186.72 },
  ];
  const colors = ['#4de7ff', '#ff4fa7', '#a8f45a', '#ffc34d', '#ab76ff'];
  const state = {
    activeMix: 'concert',
    activeTrack: concert,
    waveform: Array.from({ length: 192 }, (_, index) => 0.24 + Math.abs(Math.sin(index * 0.29)) * 0.58),
    sections: fallbackSections,
    duration: 186.72,
    seeking: false,
  };

  function formatTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  }

  function currentSection(time) {
    return state.sections.find((section) => time >= section.startSeconds && time < section.endSeconds)
      || state.sections[state.sections.length - 1];
  }

  function syncSection(time) {
    const section = currentSection(time);
    sectionButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.section === section?.id);
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    drawWaveform();
  }

  function drawWaveform() {
    const width = canvas.width;
    const height = canvas.height;
    const progress = Math.min(1, Math.max(0, (state.activeTrack.currentTime || 0) / state.duration));
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    state.sections.forEach((section, index) => {
      const start = section.startSeconds / state.duration;
      const end = section.endSeconds / state.duration;
      gradient.addColorStop(Math.min(1, start), colors[index % colors.length]);
      gradient.addColorStop(Math.min(1, end), colors[(index + 1) % colors.length]);
    });

    const gap = Math.max(2, width / state.waveform.length * 0.32);
    const barWidth = Math.max(1.5, width / state.waveform.length - gap);
    state.waveform.forEach((level, index) => {
      const x = index / state.waveform.length * width;
      const barHeight = Math.max(4, level * height * 0.7);
      const played = index / state.waveform.length <= progress;
      ctx.globalAlpha = played ? 1 : 0.27;
      ctx.fillStyle = played ? gradient : '#eee6ff';
      ctx.beginPath();
      ctx.roundRect(x, (height - barHeight) / 2, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const playhead = progress * width;
    ctx.fillStyle = '#fff7db';
    ctx.shadowColor = '#4de7ff';
    ctx.shadowBlur = Math.max(8, height * 0.06);
    ctx.fillRect(Math.max(0, playhead - 1), 0, Math.max(2, width * 0.0018), height);
    ctx.shadowBlur = 0;
  }

  function updateTransport() {
    const time = state.activeTrack.currentTime || 0;
    if (!state.seeking) seekBar.value = String(time);
    currentTime.textContent = formatTime(time);
    duration.textContent = formatTime(Math.round(state.duration));
    syncSection(time);
    if (!state.activeTrack.paused && state.activeMix === 'concert') {
      playbackStatus.textContent = `${currentSection(time)?.name || 'Concert'} is playing from the final vocal master.`;
    } else if (!state.activeTrack.paused && state.activeMix === 'trio') {
      playbackStatus.textContent = `${currentSection(time)?.name || 'Arrangement'} is playing with guitar, bass and drums only.`;
    } else if (!state.activeTrack.paused && state.activeMix === 'instrumental') {
      playbackStatus.textContent = `${currentSection(time)?.name || 'Arrangement'} is playing in the fuller band mix.`;
    }
    drawWaveform();
  }

  async function togglePlayback() {
    if (state.activeTrack.paused) {
      try {
        await state.activeTrack.play();
        playIcon.textContent = '❚❚';
        playLabel.textContent = 'Pause arrangement';
        playbackStatus.textContent = `${currentSection(state.activeTrack.currentTime)?.name || 'Arrangement'} is playing.`;
      } catch {
        playbackStatus.textContent = 'Tap Play once more to allow audio in this browser.';
      }
    } else {
      state.activeTrack.pause();
      playIcon.textContent = '▶';
      playLabel.textContent = 'Resume arrangement';
      playbackStatus.textContent = `Paused during ${currentSection(state.activeTrack.currentTime)?.name || 'the arrangement'}.`;
    }
  }

  async function selectMix(mix) {
    if (mix === state.activeMix) return;
    const wasPlaying = !state.activeTrack.paused;
    const previousTime = state.activeTrack.currentTime || 0;
    state.activeTrack.pause();
    state.activeMix = mix;
    state.activeTrack = tracksByMix[mix] || concert;
    state.activeTrack.currentTime = Math.min(previousTime, state.activeTrack.duration || state.duration);
    state.activeTrack.volume = Number(volume.value) / 100;

    mixButtons.forEach((button) => {
      const active = button.dataset.mix === mix;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (mix === 'concert') {
      playerTitle.textContent = 'Final concert master';
      playbackStatus.textContent = 'Final concert master selected. This full vocal song will carry the World 2-3 finale.';
    } else if (mix === 'guide') {
      playerTitle.textContent = 'Instrumental with vocal-melody guide';
      playbackStatus.textContent = 'The guide is an intentionally synthetic melody reference, not the final Neon Neckties vocalist.';
    } else if (mix === 'instrumental') {
      playerTitle.textContent = 'Guitar + bass full-band master';
      playbackStatus.textContent = 'Full-band mix selected. Electric bass and guitars lead, with keyboards and synths supporting them.';
    } else {
      playerTitle.textContent = 'Guitar, bass + drums master';
      playbackStatus.textContent = 'Power-trio cut selected. This mix contains only electric guitars, electric bass and drums.';
    }
    updateTransport();
    if (wasPlaying) {
      try {
        await state.activeTrack.play();
      } catch {
        playbackStatus.textContent = 'Press Play to continue with the selected mix.';
      }
    }
  }

  playButton.addEventListener('click', togglePlayback);
  mixButtons.forEach((button) => button.addEventListener('click', () => selectMix(button.dataset.mix)));

  sectionButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      state.activeTrack.currentTime = Number(button.dataset.start || 0);
      updateTransport();
      if (state.activeTrack.paused) {
        try {
          await state.activeTrack.play();
          playIcon.textContent = '❚❚';
          playLabel.textContent = 'Pause arrangement';
        } catch {
          playbackStatus.textContent = 'Press Play to hear this section.';
        }
      }
    });
  });

  seekBar.addEventListener('pointerdown', () => { state.seeking = true; });
  seekBar.addEventListener('input', () => {
    state.activeTrack.currentTime = Number(seekBar.value);
    currentTime.textContent = formatTime(seekBar.value);
    drawWaveform();
  });
  seekBar.addEventListener('change', () => {
    state.seeking = false;
    updateTransport();
  });

  volume.addEventListener('input', () => {
    const gain = Number(volume.value) / 100;
    concert.volume = gain;
    trio.volume = gain;
    instrumental.volume = gain;
    guide.volume = gain;
  });

  [concert, trio, instrumental, guide].forEach((track) => {
    track.volume = Number(volume.value) / 100;
    track.addEventListener('timeupdate', () => {
      if (track === state.activeTrack) updateTransport();
    });
    track.addEventListener('loadedmetadata', () => {
      if (track === concert && Number.isFinite(track.duration)) {
        state.duration = track.duration;
        seekBar.max = String(track.duration);
        duration.textContent = formatTime(Math.round(track.duration));
        drawWaveform();
      }
    });
    track.addEventListener('ended', () => {
      if (track !== state.activeTrack) return;
      playIcon.textContent = '▶';
      playLabel.textContent = 'Play arrangement again';
      playbackStatus.textContent = 'Arrangement complete. The final concert will continue into the band bow before showing results.';
    });
    track.addEventListener('error', () => {
      playbackStatus.textContent = 'This mix could not load. Try refreshing the page or selecting another mix.';
    });
  });

  window.addEventListener('resize', resizeCanvas);

  fetch('assets/neon_neckties/jump_for_tacos_final_concert_cues_v1.json?mix=4')
    .then((response) => {
      if (!response.ok) throw new Error('Cue data unavailable');
      return response.json();
    })
    .then((cues) => {
      if (Array.isArray(cues.waveform) && cues.waveform.length) state.waveform = cues.waveform;
      if (Array.isArray(cues.sections) && cues.sections.length) state.sections = cues.sections;
      if (Number.isFinite(cues.durationSeconds)) {
        state.duration = cues.durationSeconds;
        seekBar.max = String(cues.durationSeconds);
      }
      updateTransport();
    })
    .catch(() => {
      updateTransport();
    });

  resizeCanvas();
  updateTransport();
})();
