(() => {
  const audio = window.JFT_AUDIO;
  const byId = (id) => document.getElementById(id);
  const labMusic = byId('labMusic');
  const musicTrack = byId('musicTrack');
  const musicVolume = byId('musicVolume');
  const effectsVolume = byId('effectsVolume');
  const sceneDuck = byId('sceneDuck');
  const enemyType = byId('enemyType');
  const combo = byId('combo');
  const vehicleType = byId('vehicleType');
  const bossType = byId('bossType');
  const sequenceStatus = byId('sequenceStatus');
  let muted = false;
  let ambienceHandle = null;
  const reviewLoopHandles = new Set();
  let musicSegment = { start: 0, end: 0 };
  const sequenceTimers = new Set();

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
    byId('musicVolumeValue').textContent = `${musicVolume.value}%`;
    byId('effectsVolumeValue').textContent = `${effectsVolume.value}%`;
    byId('sceneDuckValue').textContent = `${sceneDuck.value}%`;
    byId('toggleMute').textContent = muted ? 'Unmute' : 'Mute';
    byId('toggleMute').setAttribute('aria-pressed', String(muted));
    audio.setMusicVolume(Number(musicVolume.value) / 100);
    audio.setEffectsVolume(Number(effectsVolume.value) / 100);
    audio.setMusicDuck(Number(sceneDuck.value) / 100);
    audio.setMuted(muted);
  }

  async function unlock() {
    await audio.init({
      musicVolume: Number(musicVolume.value) / 100,
      effectsVolume: Number(effectsVolume.value) / 100,
      muted,
    });
    const state = audio.getTelemetry().audioContextState;
    byId('audioStatus').textContent = `AudioContext: ${state}.`;
    byId('enableAudio').textContent = state === 'running' ? 'Audio Enabled' : 'Retry Audio Unlock';
    return state === 'running';
  }

  function selectedMusicSegment() {
    const option = musicTrack.selectedOptions[0];
    return { src: option.value, start: Number(option.dataset.start || 0), end: Number(option.dataset.end || 0) };
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
      labMusic.play().catch((error) => { byId('audioStatus').textContent = `Music could not start: ${error.message}`; });
    };
    if (labMusic.readyState >= 1) seekAndPlay();
    else labMusic.addEventListener('loadedmetadata', seekAndPlay, { once: true });
  }

  function eventOptions(eventId) {
    const selectedCombo = Math.max(1, Math.min(12, Number(combo.value) || 1));
    const options = {
      combo: selectedCombo,
      streak: selectedCombo,
      enemyType: enemyType.value,
      vehicleType: vehicleType.value,
      bossType: bossType.value,
    };
    if (eventId.startsWith('boss.elGuacodillo')) options.bossType = 'elGuacodillo';
    return options;
  }

  async function playEvent(eventId, options = {}) {
    await unlock();
    audio.play(eventId, { ...eventOptions(eventId), ...options });
    sequenceStatus.textContent = `Played ${eventId}`;
  }

  function queueSequenceCallback(callback, delay) {
    const timer = window.setTimeout(() => {
      sequenceTimers.delete(timer);
      callback();
    }, delay);
    sequenceTimers.add(timer);
  }

  function clearSequenceCallbacks() {
    sequenceTimers.forEach((timer) => window.clearTimeout(timer));
    sequenceTimers.clear();
  }

  function trackReviewLoop(handle) {
    if (handle) reviewLoopHandles.add(handle);
    return handle;
  }

  function stopReviewLoop(handle) {
    if (!handle) return;
    audio.stopLoop(handle);
    reviewLoopHandles.delete(handle);
  }

  function stopReviewLoops() {
    [...reviewLoopHandles].forEach(stopReviewLoop);
  }

  function beginReviewSequence() {
    clearSequenceCallbacks();
    stopReviewLoops();
  }

  async function playTimedReviewLoop(eventId, label) {
    await unlock();
    beginReviewSequence();
    const handle = trackReviewLoop(audio.startLoop(eventId, { gain: 0.82, position: 0, pitchCents: 0 }));
    sequenceStatus.textContent = `${label} playing for 3.2 seconds...`;
    queueSequenceCallback(() => {
      if (!reviewLoopHandles.has(handle)) return;
      stopReviewLoop(handle);
      sequenceStatus.textContent = `${label} complete.`;
    }, 3_200);
  }

  async function runAircraftFlybyDemo() {
    await unlock();
    beginReviewSequence();
    sequenceStatus.textContent = 'Aircraft approach / closest pass / departure running...';
    audio.play('vehicle.aircraftApproach', { position: -1 });
    const handle = trackReviewLoop(audio.startLoop('vehicle.aircraftPropellerIdle', { gain: 0.12, position: -1, pitchCents: 115 }));
    const duration = 6_400;
    for (let step = 0; step <= 64; step += 1) {
      const progress = step / 64;
      const position = -1 + progress * 2;
      const proximity = 1 - Math.abs(position);
      const closeness = proximity * proximity * (3 - 2 * proximity);
      queueSequenceCallback(() => {
        if (!reviewLoopHandles.has(handle)) return;
        audio.updateLoop(handle, {
          gain: 0.12 + closeness * 1.02,
          position,
          pitchCents: 115 - progress * 250,
          smoothingSeconds: 0.065,
        });
      }, progress * duration);
    }
    [2_850, 3_080, 3_310].forEach((at, index) => queueSequenceCallback(() => {
      audio.play('vehicle.drop', { position: -0.12 + index * 0.12, combo: index + 1 });
    }, at));
    queueSequenceCallback(() => audio.play('vehicle.aircraftDepart', { position: 1 }), 5_150);
    queueSequenceCallback(() => {
      if (!reviewLoopHandles.has(handle)) return;
      stopReviewLoop(handle);
      sequenceStatus.textContent = 'Aircraft approach / closest pass / departure complete.';
    }, duration + 150);
  }

  async function runAircraftGuacHitDemo() {
    await unlock();
    beginReviewSequence();
    sequenceStatus.textContent = 'Guacamole-hit flyby: distant approach / close pass / impact / damaged departure...';
    audio.play('vehicle.aircraftApproach', { position: -1, variant: 'guac-ambush' });
    const handle = trackReviewLoop(audio.startLoop('vehicle.aircraftPropellerIdle', { gain: 0.12, position: -1, pitchCents: 110 }));
    const duration = 6_600;
    const impactProgress = 0.56;
    for (let step = 0; step <= 66; step += 1) {
      const progress = step / 66;
      const rawPosition = -1.08 + progress * 2.16;
      const damaged = progress >= impactProgress;
      const damagedProgress = Math.max(0, (progress - impactProgress) / (1 - impactProgress));
      const proximity = Math.max(0, 1 - Math.abs(rawPosition));
      const closeness = proximity * proximity * (3 - 2 * proximity);
      const pitchInstability = damaged ? Math.sin(step * 1.93) * 32 + Math.sin(step * 0.71) * 17 : 0;
      const stereoWobble = damaged ? Math.sin(step * 0.52) * 0.035 : 0;
      queueSequenceCallback(() => {
        if (!reviewLoopHandles.has(handle)) return;
        audio.updateLoop(handle, {
          gain: Math.min(damaged ? 1.02 : 1.08, 0.12 + closeness * (damaged ? 0.86 : 0.96)),
          position: Math.max(-1, Math.min(1, rawPosition + stereoWobble)),
          pitchCents: damaged ? -45 - damagedProgress * 95 + pitchInstability : 110 - progress * 135,
          smoothingSeconds: 0.06,
        });
      }, progress * duration);
    }
    queueSequenceCallback(() => {
      audio.play('impact.guacKrak', { position: 0.05 });
      sequenceStatus.textContent = 'Guacamole impact — approved propeller identity continues in distress.';
    }, impactProgress * duration);
    queueSequenceCallback(() => audio.play('vehicle.aircraftDepart', { position: 1 }), 5_450);
    queueSequenceCallback(() => {
      if (!reviewLoopHandles.has(handle)) return;
      stopReviewLoop(handle);
      sequenceStatus.textContent = 'Guacamole-hit flyby complete; propeller loop stopped.';
    }, duration + 150);
  }

  async function runAircraftDamagedDemo() {
    await unlock();
    beginReviewSequence();
    sequenceStatus.textContent = 'Damaged chase: approved propeller plus restrained strain / sputter / wobble...';
    audio.play('vehicle.aircraftRescueStart', { position: 0.55 });
    const propellerHandle = trackReviewLoop(audio.startLoop('vehicle.aircraftPropellerIdle', { gain: 0.42, position: 0.78, pitchCents: -40 }));
    const strainHandle = trackReviewLoop(audio.startLoop('vehicle.aircraftDamagedLoop', { gain: 0.16, position: 0.78, pitchCents: -20 }));
    const duration = 6_800;
    for (let step = 0; step <= 68; step += 1) {
      const progress = step / 68;
      const phase = progress >= 0.68 ? 2 : progress >= 0.34 ? 1 : 0;
      const strain = 0.45 + progress * 0.55 + phase * 0.08;
      const pitchInstability = Math.sin(step * 1.93) * (11 + strain * 25) + Math.sin(step * 0.64) * (6 + strain * 13);
      const sputterPulse = Math.pow(Math.max(0, Math.sin(step * (1.24 + phase * 0.26) + progress * 4)), 8);
      const stereoWobble = Math.sin(step * 0.46) * (0.012 + progress * 0.042);
      const position = Math.max(-1, Math.min(1, 0.76 - progress * 0.28 + stereoWobble));
      queueSequenceCallback(() => {
        if (reviewLoopHandles.has(propellerHandle)) {
          audio.updateLoop(propellerHandle, {
            gain: Math.max(0.18, (0.58 + progress * 0.22) * (1 - sputterPulse * (0.04 + progress * 0.15))),
            position,
            pitchCents: -40 - progress * 112 + pitchInstability,
            smoothingSeconds: 0.045,
          });
        }
        if (reviewLoopHandles.has(strainHandle)) {
          audio.updateLoop(strainHandle, {
            gain: Math.min(0.38, 0.14 + progress * 0.17 + phase * 0.035),
            position,
            pitchCents: pitchInstability * 0.32 - progress * 28,
            smoothingSeconds: 0.08,
          });
        }
      }, progress * duration);
    }
    queueSequenceCallback(() => audio.play('sequence.rescuePhase', { combo: 2, position: 0.48 }), 2_450);
    queueSequenceCallback(() => audio.play('sequence.rescuePhase', { combo: 3, position: 0.4 }), 4_700);
    queueSequenceCallback(() => {
      stopReviewLoop(propellerHandle);
      stopReviewLoop(strainHandle);
      audio.play('vehicle.aircraftCrash', { position: 0.75 });
      sequenceStatus.textContent = 'Damaged chase complete; both aircraft loops stopped before the crash impact.';
    }, duration);
  }

  async function scheduleSequence(label, scheduledEvents) {
    await unlock();
    beginReviewSequence();
    sequenceStatus.textContent = `${label} running...`;
    scheduledEvents.forEach(({ at, eventId, options = {} }) => {
      queueSequenceCallback(() => audio.play(eventId, { ...eventOptions(eventId), ...options }), at);
    });
    const duration = Math.max(...scheduledEvents.map((entry) => entry.at), 0) + 700;
    queueSequenceCallback(() => { sequenceStatus.textContent = `${label} complete.`; }, duration);
  }

  const categoryRules = [
    ['Review Candidates', /^review\./],
    ['Hero', /^(hero\.(hurt|fall|respawn)|checkpoint\.)/],
    ['Movement', /^(hero\.(jump|land)|movement\.|ride\.)/],
    ['Ordinary Taco', /^collect\.(taco|tacoCluster)$/],
    ['Premium Tacos', /^collect\.(?!powerup$)/],
    ['Power-Ups', /^(ability\.|collect\.powerup$)/],
    ['Non-Perfect Enemy Squishes', /^combat\.enemySplat$/],
    ['Perfect Enemy Bounces', /^(combat\.enemyStomp|combat\.comboMilestone)$/],
    ['Olivia Vehicles', /^(vehicle\.|surf\.oliviaPass$)/],
    ['Bosses', /^boss\./],
    ['Hazards', /^(hazard\.|impact\.|volcano\.)/],
    ['Piñatas', /^pinata\./],
    ['Celebrations', /^(level\.celebrationPulse$|concert\.(crowdCheer|chorusCannon|tambourineAccent)$)/],
    ['Finale', /^(goal\.|level\.(complete|victoryDashStart)$|cosmic\.finale$|concert\.(finaleLift|bow)$)/],
    ['World 1', /^(world1\.|sequence\.)/],
    ['World 2', /^(surf\.|stage\.|concert\.)/],
    ['World 3', /^(cosmic\.|carnival\.)/],
    ['UI', /^ui\./],
    ['Ambience', /^ambience\./],
    ['Other', /.*/],
  ];

  const categorized = new Map(categoryRules.map(([name]) => [name, []]));
  const seen = new Set();
  audio.listEvents().forEach((eventId) => {
    const match = categoryRules.find(([, pattern]) => pattern.test(eventId) && !seen.has(eventId));
    const category = match?.[0] || 'Other';
    categorized.get(category).push(eventId);
    seen.add(eventId);
  });

  const catalogSections = byId('catalogSections');
  categorized.forEach((eventIds, category) => {
    if (!eventIds.length) return;
    const details = document.createElement('details');
    details.className = 'catalog-category';
    if (['Review Candidates', 'Hero', 'Movement', 'Power-Ups', 'Non-Perfect Enemy Squishes', 'Perfect Enemy Bounces'].includes(category)) details.open = true;
    const summary = document.createElement('summary');
    summary.textContent = `${category} (${eventIds.length})`;
    const grid = document.createElement('div');
    grid.className = 'effect-grid';
    eventIds.forEach((eventId) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = eventId;
      button.dataset.eventId = eventId;
      button.addEventListener('click', () => playEvent(eventId));
      grid.appendChild(button);
    });
    details.append(summary, grid);
    catalogSections.appendChild(details);
  });

  byId('priorEnemySquish').addEventListener('click', () => playEvent('review.enemySquishProcedural'));
  byId('normalEnemySplat').addEventListener('click', () => playEvent('combat.enemySplat'));
  byId('perfectEnemyStomp').addEventListener('click', () => playEvent('combat.enemyStomp'));
  byId('enemyContactAB').addEventListener('click', () => scheduleSequence('Squish Candidate/Final A/B', [
    { at: 0, eventId: 'review.enemySquishProcedural' },
    { at: 800, eventId: 'combat.enemySplat' },
    { at: 1_600, eventId: 'combat.enemyStomp', options: { combo: 1 } },
    { at: 2_500, eventId: 'review.enemySquishProcedural' },
    { at: 3_300, eventId: 'combat.enemySplat' },
    { at: 4_100, eventId: 'combat.enemyStomp', options: { combo: 2 } },
  ]));
  byId('priorPropeller').addEventListener('click', () => playTimedReviewLoop('review.aircraftPropellerProcedural', 'Prior procedural propeller'));
  byId('finalPropeller').addEventListener('click', () => playTimedReviewLoop('vehicle.aircraftPropellerIdle', 'Final recorded propeller'));
  byId('aircraftFlybyDemo').addEventListener('click', runAircraftFlybyDemo);
  byId('aircraftGuacHitDemo').addEventListener('click', runAircraftGuacHitDemo);
  byId('aircraftDamagedDemo').addEventListener('click', runAircraftDamagedDemo);

  byId('powerDemo').addEventListener('click', () => scheduleSequence('Power-Up Demo', [
    { at: 0, eventId: 'ability.limeStart' }, { at: 650, eventId: 'ability.limeBreak' },
    { at: 1_250, eventId: 'ability.pepperStart' }, { at: 2_000, eventId: 'ability.pepperEnd' },
    { at: 2_500, eventId: 'ability.coconutStart' }, { at: 3_050, eventId: 'ability.coconutBounce' },
    { at: 3_700, eventId: 'ability.magnetStart' }, { at: 4_450, eventId: 'ability.frenzyStart' },
    { at: 5_300, eventId: 'ability.tacoNovaStart' },
  ]));

  byId('enemyComboDemo').addEventListener('click', () => scheduleSequence('Enemy Stomp Combo Demo',
    Array.from({ length: 8 }, (_, index) => ({
      at: index * 230,
      eventId: index === 0 ? 'combat.enemySplat' : 'combat.enemyStomp',
      options: { combo: index + 1, enemyType: enemyType.value },
    })).concat([{ at: 1_720, eventId: 'combat.comboMilestone', options: { combo: 8 } }])));

  byId('oliviaDemo').addEventListener('click', () => {
    const cosmic = ['balloon', 'coaster', 'zeppelin'].includes(vehicleType.value);
    const prefix = cosmic ? 'vehicle.cosmic' : 'vehicle.';
    const id = (phase) => cosmic ? `${prefix}${phase[0].toUpperCase()}${phase.slice(1)}` : `${prefix}${phase}`;
    const events = [{ at: 0, eventId: id('approach') }, { at: 600, eventId: id('accelerate') }];
    for (let index = 0; index < 8; index += 1) events.push({ at: 1_000 + index * 115, eventId: id('tacoDrop') });
    events.push({ at: 2_150, eventId: id('depart') });
    scheduleSequence('Olivia Vehicle Taco Drop Demo', events);
  });

  byId('bossDemo').addEventListener('click', () => {
    if (bossType.value === 'elGuacodillo') {
      scheduleSequence('El Guacodillo Combat Demo', [
        { at: 0, eventId: 'boss.elGuacodillo.enter' }, { at: 700, eventId: 'boss.elGuacodillo.chargeWindup' },
        { at: 1_250, eventId: 'boss.elGuacodillo.charge' }, { at: 1_850, eventId: 'boss.elGuacodillo.crashStun' },
        { at: 2_550, eventId: 'boss.elGuacodillo.damage' }, { at: 3_350, eventId: 'boss.elGuacodillo.phaseTransition' },
        { at: 4_200, eventId: 'boss.elGuacodillo.defeat' },
      ]);
      return;
    }
    scheduleSequence('World 3 Boss Combat Demo', [
      { at: 0, eventId: 'boss.enter' }, { at: 700, eventId: 'boss.windup' },
      { at: 1_250, eventId: 'boss.attack' }, { at: 1_950, eventId: 'boss.vulnerable' },
      { at: 2_550, eventId: 'boss.damage' }, { at: 3_300, eventId: 'boss.phase' },
      { at: 4_000, eventId: 'boss.special' }, { at: 4_850, eventId: 'boss.defeat' },
    ]);
  });

  byId('pinataDemo').addEventListener('click', () => scheduleSequence('Piñata Celebration Demo', [
    { at: 0, eventId: 'pinata.hit', options: { combo: 1 } },
    { at: 420, eventId: 'pinata.hit', options: { combo: 2 } },
    { at: 860, eventId: 'pinata.break' }, { at: 1_300, eventId: 'pinata.aftershock' },
    { at: 1_680, eventId: 'pinata.jackpotSparkle' },
  ]));

  byId('cosmicDemo').addEventListener('click', () => scheduleSequence('World 3 Cosmic Finale Demo', [
    { at: 0, eventId: 'vehicle.cosmicApproach', options: { vehicleType: 'zeppelin' } },
    { at: 700, eventId: 'collect.goldenTaco' }, { at: 1_350, eventId: 'cosmic.starRelight' },
    { at: 1_700, eventId: 'cosmic.starRelight', options: { pitchCents: 100 } },
    { at: 2_050, eventId: 'cosmic.starRelight', options: { pitchCents: 200 } },
    { at: 2_500, eventId: 'ability.tacoNovaStart' }, { at: 3_300, eventId: 'ability.lowGravityStart' },
    { at: 4_000, eventId: 'cosmic.finale' }, { at: 5_000, eventId: 'cosmic.landing' },
    { at: 5_700, eventId: 'level.complete' },
  ]));

  byId('jumpStress').addEventListener('click', () => scheduleSequence('Jump repetition test', Array.from({ length: 12 }, (_, index) => ({
    at: index * 140, eventId: 'hero.jump', options: { position: Math.sin(index * 0.8) * 0.25 },
  }))));

  byId('tacoStreak').addEventListener('click', () => scheduleSequence('Taco streak', Array.from({ length: 16 }, (_, index) => ({
    at: index * 105, eventId: 'collect.taco', options: { streak: index + 1, position: (index % 5 - 2) / 2 },
  }))));

  byId('magnetStress').addEventListener('click', () => {
    const events = [{ at: 0, eventId: 'ability.magnetStart' }];
    for (let index = 0; index < 48; index += 1) events.push({
      at: 220 + index * 18, eventId: 'collect.taco', options: { streak: index + 1, position: Math.sin(index * 0.7) },
    });
    scheduleSequence('Magnet cascade', events);
  });

  const stressEnemyTypes = ['tomato', 'lime', 'slime', 'crab', 'coconut', 'spaghetti', 'popcorn', 'cotton', 'bumper', 'corndog'];
  byId('splatStress').addEventListener('click', () => scheduleSequence('Non-perfect squish variants', Array.from({ length: 10 }, (_, index) => ({
    at: index * 105, eventId: 'combat.enemySplat', options: { enemyType: stressEnemyTypes[index], position: (index % 5 - 2) / 2 },
  }))));
  byId('stompStress').addEventListener('click', () => scheduleSequence('Perfect bounce stress', Array.from({ length: 10 }, (_, index) => ({
    at: index * 85, eventId: 'combat.enemyStomp', options: { enemyType: stressEnemyTypes[index], combo: index + 1, position: (index % 5 - 2) / 2 },
  }))));

  byId('coreDemo').addEventListener('click', () => scheduleSequence('Core Gameplay Demo', [
    { at: 0, eventId: 'ui.start' }, { at: 380, eventId: 'hero.jump' },
    { at: 720, eventId: 'collect.taco', options: { streak: 1 } }, { at: 860, eventId: 'collect.taco', options: { streak: 2 } },
    { at: 1_000, eventId: 'collect.taco', options: { streak: 3 } }, { at: 1_280, eventId: 'hero.landSoft' },
    { at: 1_720, eventId: 'combat.enemySplat' }, { at: 2_180, eventId: 'combat.enemyStomp', options: { combo: 1 } },
    { at: 2_640, eventId: 'combat.enemyStomp', options: { combo: 2 } }, { at: 3_100, eventId: 'combat.comboMilestone', options: { combo: 3 } },
    { at: 3_500, eventId: 'collect.goldenTaco' }, { at: 4_100, eventId: 'checkpoint.activate' },
    { at: 4_850, eventId: 'hero.hurt' }, { at: 5_550, eventId: 'hero.respawnBeam' },
    { at: 6_250, eventId: 'hero.respawnLand' }, { at: 6_900, eventId: 'goal.enter' }, { at: 7_900, eventId: 'level.complete' },
  ]));

  byId('ambienceToggle').addEventListener('click', async () => {
    await unlock();
    if (ambienceHandle) {
      audio.stopLoop(ambienceHandle);
      ambienceHandle = null;
      byId('ambienceToggle').textContent = 'Start selected ambience';
      byId('ambienceToggle').setAttribute('aria-pressed', 'false');
    } else {
      const eventId = ['balloon', 'coaster', 'zeppelin'].includes(vehicleType.value)
        ? 'ambience.cosmicCarnival'
        : 'ambience.desertBreeze';
      ambienceHandle = audio.startLoop(eventId, { gain: 0.55 });
      byId('ambienceToggle').textContent = `Stop ${eventId}`;
      byId('ambienceToggle').setAttribute('aria-pressed', 'true');
    }
  });

  byId('enableAudio').addEventListener('click', () => unlock().then(() => audio.play('ui.confirm')));
  byId('playMusic').addEventListener('click', startSelectedMusic);
  byId('pauseMusic').addEventListener('click', () => labMusic.pause());
  musicTrack.addEventListener('change', loadSelectedMusic);
  byId('toggleMute').addEventListener('click', () => { muted = !muted; syncMixControls(); });
  musicVolume.addEventListener('input', syncMixControls);
  effectsVolume.addEventListener('input', syncMixControls);
  sceneDuck.addEventListener('input', syncMixControls);
  labMusic.addEventListener('timeupdate', () => {
    if (musicSegment.end > musicSegment.start && labMusic.currentTime >= musicSegment.end) labMusic.currentTime = musicSegment.start;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearSequenceCallbacks();
      if (ambienceHandle) audio.stopLoop(ambienceHandle);
      ambienceHandle = null;
      stopReviewLoops();
      labMusic.pause();
      sequenceStatus.textContent = 'Sequence stopped while the page was hidden.';
      byId('ambienceToggle').textContent = 'Start selected ambience';
      byId('ambienceToggle').setAttribute('aria-pressed', 'false');
    } else {
      audio.init().catch(() => {});
    }
  });

  audio.registerMusicTracks({ audioLabPreview: labMusic });
  syncMixControls();
  loadSelectedMusic();
  audio.preload().then(() => {
    const data = audio.getTelemetry();
    byId('audioStatus').textContent = `${data.loadedAssets.length} SFX assets ready; audio unlock still requires interaction.`;
  });
  window.setInterval(() => { byId('telemetry').textContent = JSON.stringify(audio.getTelemetry(), null, 2); }, 250);
})();
