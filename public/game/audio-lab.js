(() => {
  const audio = window.JFT_AUDIO;
  const catalog = window.JFT_AUDIO_CATALOG;
  const labMusic = document.getElementById('labMusic');
  const enableAudio = document.getElementById('enableAudio');
  const audioStatus = document.getElementById('audioStatus');
  const musicTrack = document.getElementById('musicTrack');
  const playMusic = document.getElementById('playMusic');
  const pauseMusic = document.getElementById('pauseMusic');
  const toggleMute = document.getElementById('toggleMute');
  const musicVolume = document.getElementById('musicVolume');
  const musicVolumeValue = document.getElementById('musicVolumeValue');
  const effectsVolume = document.getElementById('effectsVolume');
  const effectsVolumeValue = document.getElementById('effectsVolumeValue');
  const effectButtons = document.getElementById('effectButtons');
  const enemyType = document.getElementById('enemyType');
  const combo = document.getElementById('combo');
  const sequenceStatus = document.getElementById('sequenceStatus');
  const telemetry = document.getElementById('telemetry');
  const ambienceToggle = document.getElementById('ambienceToggle');
  const normalEnemySplat = document.getElementById('normalEnemySplat');
  const perfectEnemyStomp = document.getElementById('perfectEnemyStomp');
  let muted = false;
  let ambienceHandle = null;
  let musicSegment = { start: 0, end: 0 };

  function savedSettings() {
    try {
      return JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}').settings || {};
    } catch {
      return {};
    }
  }

  const settings = savedSettings();
  musicVolume.value = String(Math.round(Number(settings.musicVolume ?? 0.7) * 100));
  effectsVolume.value = String(Math.round(Number(settings.effectsVolume ?? 0.8) * 100));
  muted = Boolean(settings.muted);

  function syncMixControls() {
    musicVolumeValue.textContent = `${musicVolume.value}%`;
    effectsVolumeValue.textContent = `${effectsVolume.value}%`;
    toggleMute.textContent = muted ? 'Unmute' : 'Mute';
    toggleMute.setAttribute('aria-pressed', String(muted));
    audio.setMusicVolume(Number(musicVolume.value) / 100);
    audio.setEffectsVolume(Number(effectsVolume.value) / 100);
    audio.setMuted(muted);
  }

  async function unlock() {
    await audio.init({
      musicVolume: Number(musicVolume.value) / 100,
      effectsVolume: Number(effectsVolume.value) / 100,
      muted,
    });
    const state = audio.getTelemetry().audioContextState;
    audioStatus.textContent = `AudioContext: ${state}.`;
    enableAudio.textContent = state === 'running' ? 'Audio Enabled' : 'Retry Audio Unlock';
    return state === 'running';
  }

  function selectedMusicSegment() {
    const option = musicTrack.selectedOptions[0];
    return {
      src: option.value,
      start: Number(option.dataset.start || 0),
      end: Number(option.dataset.end || 0),
    };
  }

  function loadSelectedMusic() {
    const selection = selectedMusicSegment();
    musicSegment = { start: selection.start, end: selection.end };
    if (!labMusic.src.endsWith(selection.src)) {
      labMusic.pause();
      labMusic.src = selection.src;
      labMusic.load();
    }
  }

  async function startSelectedMusic() {
    await unlock();
    loadSelectedMusic();
    const seekAndPlay = () => {
      if (musicSegment.start > 0) labMusic.currentTime = musicSegment.start;
      labMusic.play().catch((error) => {
        audioStatus.textContent = `Music could not start: ${error.message}`;
      });
    };
    if (labMusic.readyState >= 1) seekAndPlay();
    else labMusic.addEventListener('loadedmetadata', seekAndPlay, { once: true });
  }

  function eventOptions(eventId) {
    const selectedCombo = Math.max(1, Math.min(12, Number(combo.value) || 1));
    const options = { combo: selectedCombo, streak: selectedCombo };
    if (eventId.startsWith('combat.')) options.enemyType = enemyType.value;
    return options;
  }

  function playEvent(eventId, options = {}) {
    unlock();
    audio.play(eventId, { ...eventOptions(eventId), ...options });
    sequenceStatus.textContent = `Played ${eventId}`;
  }

  function scheduleSequence(label, events) {
    unlock();
    sequenceStatus.textContent = `${label} running...`;
    events.forEach(({ at, eventId, options = {} }) => {
      window.setTimeout(() => audio.play(eventId, options), at);
    });
    const duration = Math.max(...events.map((event) => event.at), 0) + 650;
    window.setTimeout(() => {
      sequenceStatus.textContent = `${label} complete.`;
    }, duration);
  }

  const contactComparisonEvents = new Set(['combat.enemySplat', 'combat.enemyStomp']);
  catalog.requiredPhase1Events.filter((eventId) => !contactComparisonEvents.has(eventId)).forEach((eventId) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = eventId;
    button.addEventListener('click', () => playEvent(eventId));
    effectButtons.appendChild(button);
  });

  normalEnemySplat.addEventListener('click', () => playEvent('combat.enemySplat'));
  perfectEnemyStomp.addEventListener('click', () => playEvent('combat.enemyStomp'));

  document.getElementById('tacoStreak').addEventListener('click', () => {
    scheduleSequence('Taco streak', Array.from({ length: 16 }, (_, index) => ({
      at: index * 105,
      eventId: 'collect.taco',
      options: { streak: index + 1, position: (index % 5 - 2) / 2 },
    })));
  });

  document.getElementById('magnetStress').addEventListener('click', () => {
    const events = [{ at: 0, eventId: 'ability.magnetStart' }];
    for (let index = 0; index < 48; index += 1) {
      events.push({
        at: 220 + index * 18,
        eventId: 'collect.taco',
        options: { streak: index + 1, position: Math.sin(index * 0.7) },
      });
    }
    scheduleSequence('Magnet cascade', events);
  });

  document.getElementById('splatStress').addEventListener('click', () => {
    const types = ['tomato', 'onion', 'chili', 'jalapeno'];
    scheduleSequence('Normal splat variants', Array.from({ length: 10 }, (_, index) => ({
      at: index * 105,
      eventId: 'combat.enemySplat',
      options: { enemyType: types[index % types.length], position: (index % 5 - 2) / 2 },
    })));
  });

  document.getElementById('stompStress').addEventListener('click', () => {
    const types = ['tomato', 'onion', 'chili', 'jalapeno'];
    const events = [];
    for (let index = 0; index < 10; index += 1) {
      events.push({
        at: index * 85,
        eventId: 'combat.enemyStomp',
        options: { enemyType: types[index % types.length], combo: index + 1, position: (index % 5 - 2) / 2 },
      });
      if ([2, 4, 7].includes(index)) {
        events.push({ at: index * 85 + 36, eventId: 'combat.comboMilestone', options: { combo: index + 1 } });
      }
    }
    scheduleSequence('Perfect stomp stress', events);
  });

  document.getElementById('coreDemo').addEventListener('click', () => {
    scheduleSequence('Core Gameplay Demo', [
      { at: 0, eventId: 'ui.start' },
      { at: 380, eventId: 'hero.jump' },
      { at: 720, eventId: 'collect.taco', options: { streak: 1, position: -0.25 } },
      { at: 860, eventId: 'collect.taco', options: { streak: 2, position: 0 } },
      { at: 1_000, eventId: 'collect.taco', options: { streak: 3, position: 0.25 } },
      { at: 1_280, eventId: 'hero.landSoft' },
      { at: 1_720, eventId: 'combat.enemySplat', options: { enemyType: enemyType.value } },
      { at: 2_180, eventId: 'combat.enemyStomp', options: { enemyType: enemyType.value, combo: 1 } },
      { at: 2_640, eventId: 'combat.enemyStomp', options: { enemyType: 'onion', combo: 2 } },
      { at: 3_100, eventId: 'combat.enemyStomp', options: { enemyType: 'chili', combo: 3 } },
      { at: 3_180, eventId: 'combat.comboMilestone', options: { combo: 3 } },
      { at: 3_300, eventId: 'collect.goldenTaco' },
      { at: 4_000, eventId: 'checkpoint.activate' },
      { at: 4_850, eventId: 'hero.hurt' },
      { at: 5_550, eventId: 'hero.respawnBeam' },
      { at: 6_250, eventId: 'hero.respawnLand' },
      { at: 6_900, eventId: 'goal.enter' },
      { at: 7_900, eventId: 'level.complete' },
    ]);
  });

  ambienceToggle.addEventListener('click', async () => {
    await unlock();
    if (ambienceHandle) {
      audio.stopLoop(ambienceHandle);
      ambienceHandle = null;
      ambienceToggle.textContent = 'Start desert ambience loop';
      ambienceToggle.setAttribute('aria-pressed', 'false');
    } else {
      ambienceHandle = audio.startLoop('ambience.desertBreeze', { gain: 0.55 });
      ambienceToggle.textContent = 'Stop desert ambience loop';
      ambienceToggle.setAttribute('aria-pressed', 'true');
    }
  });

  enableAudio.addEventListener('click', () => unlock().then(() => audio.play('ui.confirm')));
  playMusic.addEventListener('click', startSelectedMusic);
  pauseMusic.addEventListener('click', () => labMusic.pause());
  musicTrack.addEventListener('change', loadSelectedMusic);
  toggleMute.addEventListener('click', () => {
    muted = !muted;
    syncMixControls();
  });
  musicVolume.addEventListener('input', syncMixControls);
  effectsVolume.addEventListener('input', syncMixControls);
  labMusic.addEventListener('timeupdate', () => {
    if (musicSegment.end > musicSegment.start && labMusic.currentTime >= musicSegment.end) {
      labMusic.currentTime = musicSegment.start;
    }
  });

  audio.registerMusicTracks({ audioLabPreview: labMusic });
  syncMixControls();
  loadSelectedMusic();
  audio.preload().then(() => {
    const data = audio.getTelemetry();
    audioStatus.textContent = `${data.loadedAssets.length} SFX assets ready; audio unlock still requires interaction.`;
  });

  window.setInterval(() => {
    telemetry.textContent = JSON.stringify(audio.getTelemetry(), null, 2);
  }, 250);
})();
