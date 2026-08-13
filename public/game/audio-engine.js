(() => {
  if (window.JFT_AUDIO?.engineVersion) return;

  const ENGINE_VERSION = '2.1.0-phase3-final-polish';
  const catalog = window.JFT_AUDIO_CATALOG || { events: {}, mix: {} };
  const eventCatalog = catalog.events || {};
  const assetCacheVersion = catalog.assetCacheVersion || '';
  const mix = {
    musicCalibration: 0.75,
    gameplayCalibration: 0.95,
    uiCalibration: 0.82,
    ambienceCalibration: 0.42,
    masterCeiling: 10 ** (-1 / 20),
    maximumVoices: 18,
    ...(catalog.mix || {}),
  };

  let context = null;
  let nodes = null;
  let contextError = null;
  let musicVolume = 0.7;
  let effectsVolume = 0.8;
  let muted = false;
  let randomState = 0x4a465431;
  let nextVoiceId = 1;
  let nextLoopId = 1;
  let peakSimultaneousVoices = 0;
  let peakOutputSample = 0;
  let fallbackPlays = 0;
  let aggregatedSourceEvents = 0;
  let aggregateClusters = 0;
  let authoredMusicDuckGain = 1;

  const buffers = new Map();
  const loadPromises = new Map();
  const failedAssets = new Map();
  const voices = new Map();
  const loops = new Map();
  const lastPlayedAt = new Map();
  const variantCounters = new Map();
  const aggregates = new Map();
  const musicSources = new WeakMap();
  const registeredMusicTracks = new Map();
  const musicRoutingFailures = new Map();
  const unknownEvents = new Set();
  const droppedByPriority = { low: 0, routine: 0, important: 0, high: 0, critical: 0 };
  const droppedByReason = { cooldown: 0, eventPolyphony: 0, globalPolyphony: 0, unavailable: 0 };
  const droppedByEvent = {};
  let duckEnvelope = { db: 0, startedAt: 0, releaseAt: 0, endsAt: 0 };

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function dbToGain(db) {
    return 10 ** (db / 20);
  }

  function gainToDb(gain) {
    return 20 * Math.log10(Math.max(1e-6, gain));
  }

  function nextRandom() {
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    return randomState / 0x1_0000_0000;
  }

  function randomSigned() {
    return nextRandom() * 2 - 1;
  }

  function priorityName(priority) {
    if (priority >= 5) return 'critical';
    if (priority === 4) return 'high';
    if (priority === 3) return 'important';
    if (priority === 2) return 'routine';
    return 'low';
  }

  function recordDrop(eventId, priority, reason) {
    const name = priorityName(priority);
    droppedByPriority[name] += 1;
    droppedByReason[reason] = (droppedByReason[reason] || 0) + 1;
    droppedByEvent[eventId] = (droppedByEvent[eventId] || 0) + 1;
  }

  function nowMilliseconds() {
    return typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();
  }

  function ensureContext() {
    if (context || contextError) return context;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      contextError = 'Web Audio API unavailable';
      return null;
    }

    try {
      context = new AudioContextCtor({ latencyHint: 'interactive' });
      const music = context.createGain();
      const musicSceneDuck = context.createGain();
      const musicDuck = context.createGain();
      const gameplay = context.createGain();
      const ui = context.createGain();
      const ambience = context.createGain();
      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const ceiling = context.createGain();
      const analyser = context.createAnalyser();

      compressor.threshold.value = -8;
      compressor.knee.value = 5;
      compressor.ratio.value = 10;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      ceiling.gain.value = mix.masterCeiling;
      analyser.fftSize = 1_024;
      analyser.smoothingTimeConstant = 0.15;

      music.connect(musicSceneDuck).connect(musicDuck).connect(master);
      gameplay.connect(master);
      ui.connect(master);
      ambience.connect(master);
      master.connect(compressor).connect(ceiling).connect(analyser).connect(context.destination);

      nodes = {
        music,
        musicSceneDuck,
        musicDuck,
        gameplay,
        ui,
        ambience,
        master,
        compressor,
        ceiling,
        analyser,
      };
      musicSceneDuck.gain.value = authoredMusicDuckGain;
      applyBusLevels(true);
    } catch (error) {
      contextError = error instanceof Error ? error.message : String(error);
      context = null;
      nodes = null;
    }
    return context;
  }

  function setAudioParam(param, value, immediate = false) {
    if (!context || !param) return;
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    if (immediate) param.setValueAtTime(value, now);
    else param.setTargetAtTime(value, now, 0.018);
  }

  function applyBusLevels(immediate = false) {
    if (!nodes) return;
    setAudioParam(nodes.music.gain, musicVolume * mix.musicCalibration, immediate);
    setAudioParam(nodes.gameplay.gain, effectsVolume * mix.gameplayCalibration, immediate);
    setAudioParam(nodes.ui.gain, effectsVolume * mix.uiCalibration, immediate);
    setAudioParam(nodes.ambience.gain, effectsVolume * mix.ambienceCalibration, immediate);
    setAudioParam(nodes.master.gain, muted ? 0 : 1, immediate);
  }

  async function init(options = {}) {
    if (Number.isFinite(options.musicVolume)) musicVolume = clamp(options.musicVolume);
    if (Number.isFinite(options.effectsVolume)) effectsVolume = clamp(options.effectsVolume);
    if (typeof options.muted === 'boolean') muted = options.muted;
    const audioContext = ensureContext();
    applyBusLevels();
    if (audioContext?.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        contextError = error instanceof Error ? error.message : String(error);
      }
    }
    resumePendingLoops();
    return getTelemetry();
  }

  function variantsForDefinition(definition, options = {}) {
    if (definition.variantsByOption) {
      const selector = definition.variantsByOption;
      const requested = String(options[selector.option] || selector.defaultKey || 'default');
      return selector.variants[requested]
        || selector.variants[selector.defaultKey]
        || Object.values(selector.variants)[0]
        || [];
    }
    return definition.variants || [];
  }

  function allVariantPaths(definition) {
    if (definition.variantsByOption) {
      return Object.values(definition.variantsByOption.variants).flat();
    }
    return definition.variants || [];
  }

  async function decodeAudioData(arrayBuffer) {
    const audioContext = ensureContext();
    if (!audioContext) throw new Error(contextError || 'AudioContext unavailable');
    return audioContext.decodeAudioData(arrayBuffer.slice(0));
  }

  function assetRequestUrl(assetPath) {
    if (!assetCacheVersion) return assetPath;
    const separator = assetPath.includes('?') ? '&' : '?';
    return `${assetPath}${separator}v=${encodeURIComponent(assetCacheVersion)}`;
  }

  async function loadAsset(assetPath) {
    if (buffers.has(assetPath)) return buffers.get(assetPath);
    if (loadPromises.has(assetPath)) return loadPromises.get(assetPath);

    const promise = (async () => {
      try {
        const response = await fetch(assetRequestUrl(assetPath));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await decodeAudioData(await response.arrayBuffer());
        buffers.set(assetPath, buffer);
        failedAssets.delete(assetPath);
        return buffer;
      } catch (error) {
        failedAssets.set(assetPath, error instanceof Error ? error.message : String(error));
        throw error;
      } finally {
        loadPromises.delete(assetPath);
      }
    })();

    loadPromises.set(assetPath, promise);
    return promise;
  }

  async function preload(eventIds = Object.keys(eventCatalog)) {
    ensureContext();
    const ids = Array.isArray(eventIds) ? eventIds : [eventIds];
    const assets = new Set();
    ids.forEach((eventId) => {
      const definition = eventCatalog[eventId];
      if (!definition) return;
      allVariantPaths(definition).forEach((assetPath) => assets.add(assetPath));
    });
    await Promise.allSettled([...assets].map((assetPath) => loadAsset(assetPath)));
    return getTelemetry();
  }

  async function preloadGroups(groups = ['global']) {
    const requested = new Set(Array.isArray(groups) ? groups : [groups]);
    const ids = Object.keys(eventCatalog).filter((eventId) => {
      const definition = eventCatalog[eventId];
      const paths = allVariantPaths(definition);
      if (requested.has('global') && paths.some((path) => path.includes('/global/'))) return true;
      if (requested.has('world1') && paths.some((path) => path.includes('/world1/'))) return true;
      if (requested.has('world2') && paths.some((path) => path.includes('/world2/'))) return true;
      if (requested.has('world3') && paths.some((path) => path.includes('/world3/'))) return true;
      return false;
    });
    return preload(ids);
  }

  function chooseVariant(eventId, definition, options) {
    const variants = variantsForDefinition(definition, options);
    if (!variants.length) return null;
    const optionKey = definition.variantsByOption
      ? String(options[definition.variantsByOption.option] || definition.variantsByOption.defaultKey || 'default')
      : 'default';
    const counterKey = `${eventId}:${optionKey}`;
    const counter = variantCounters.get(counterKey) || 0;
    variantCounters.set(counterKey, counter + 1);
    return variants[counter % variants.length];
  }

  function activeEffectVoices() {
    return [...voices.values()].filter((voice) => !voice.loop);
  }

  function removeVoice(voiceId) {
    voices.delete(voiceId);
  }

  function stopVoice(voice) {
    if (!voice) return;
    removeVoice(voice.id);
    try {
      voice.source.stop();
    } catch {
      // A voice that already ended is already absent from the active set.
    }
  }

  function reserveVoice(eventId, definition) {
    const priority = clamp(definition.priority || 1, 1, 5);
    const active = activeEffectVoices();
    const sameEvent = active.filter((voice) => voice.eventId === eventId);
    const eventLimit = Math.max(1, definition.maxPolyphony || 2);
    if (sameEvent.length >= eventLimit) {
      if (priority >= 3) stopVoice(sameEvent.sort((a, b) => a.startedAt - b.startedAt)[0]);
      else {
        recordDrop(eventId, priority, 'eventPolyphony');
        return false;
      }
    }

    const refreshed = activeEffectVoices();
    if (refreshed.length >= mix.maximumVoices) {
      const stealable = refreshed
        .filter((voice) => voice.priority < priority || (priority >= 4 && voice.priority === priority))
        .sort((a, b) => (a.priority - b.priority) || (a.startedAt - b.startedAt));
      if (stealable.length) stopVoice(stealable[0]);
      else {
        recordDrop(eventId, priority, 'globalPolyphony');
        return false;
      }
    }
    return true;
  }

  function busFor(definition) {
    if (!nodes) return null;
    if (definition.bus === 'ui') return nodes.ui;
    if (definition.bus === 'ambience') return nodes.ambience;
    return nodes.gameplay;
  }

  function connectWithPan(source, gainNode, destination, definition, options) {
    source.connect(gainNode);
    if (!context?.createStereoPanner || !definition.panRange) {
      gainNode.connect(destination);
      return null;
    }
    const panner = context.createStereoPanner();
    const requestedPan = Number.isFinite(options.pan)
      ? options.pan
      : Number.isFinite(options.position) ? options.position : 0;
    panner.pan.value = clamp(
      requestedPan * definition.panRange + randomSigned() * 0.025,
      -Math.min(1, definition.panRange),
      Math.min(1, definition.panRange),
    );
    gainNode.connect(panner).connect(destination);
    return panner;
  }

  function computedPitchCents(definition, options) {
    let cents = Number(options.pitchCents) || 0;
    cents += randomSigned() * (definition.pitchVariationCents || 0);
    if (definition.streakPitchCents && Number.isFinite(options.streak)) {
      cents += Math.min(
        Math.max(0, options.streak - 1) * definition.streakPitchCents,
        definition.maxStreakPitchCents || 300,
      );
    }
    if (definition.comboPitchCents && Number.isFinite(options.combo)) {
      cents += Math.min(
        Math.max(0, options.combo - 1) * definition.comboPitchCents,
        definition.maxComboPitchCents || 300,
      );
    }
    if (Number.isFinite(options.aggregateCount)) {
      cents += Math.min(180, Math.max(0, options.aggregateCount - 2) * 24);
    }
    return cents;
  }

  function computedGain(definition, options) {
    const variationDb = randomSigned() * (definition.gainVariationDb || 0);
    const requestedGain = Number.isFinite(options.gain) ? Math.max(0, options.gain) : 1;
    return Math.max(0, (definition.gain ?? 1) * requestedGain * dbToGain(variationDb));
  }

  function holdAudioParam(param, now) {
    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(now);
      return;
    }
    const value = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(value, now);
  }

  function duckMusic(db, attackSeconds = 0.018, releaseSeconds = 0.45) {
    if (!context || !nodes || db <= 0) return;
    const now = context.currentTime;
    const requestedEndsAt = now + attackSeconds + 0.035 + releaseSeconds;
    if (duckEnvelope.endsAt > now && duckEnvelope.db > db && duckEnvelope.endsAt >= requestedEndsAt) return;
    const effectiveDb = duckEnvelope.endsAt > now ? Math.max(db, duckEnvelope.db) : db;
    const effectiveEndsAt = Math.max(requestedEndsAt, duckEnvelope.endsAt || 0);
    const effectiveReleaseSeconds = Math.max(releaseSeconds, effectiveEndsAt - now - attackSeconds - 0.035);
    const gain = nodes.musicDuck.gain;
    const target = dbToGain(-effectiveDb);
    holdAudioParam(gain, now);
    const current = Math.max(0.001, gain.value);
    gain.setValueAtTime(current, now);
    gain.linearRampToValueAtTime(Math.min(current, target), now + attackSeconds);
    const releaseAt = now + attackSeconds + 0.035;
    gain.setValueAtTime(Math.min(current, target), releaseAt);
    gain.exponentialRampToValueAtTime(1, releaseAt + effectiveReleaseSeconds);
    duckEnvelope = { db: effectiveDb, startedAt: now, releaseAt, endsAt: releaseAt + effectiveReleaseSeconds };
  }

  function applyEventDuck(definition, options) {
    const requested = Number.isFinite(options.duckDb) ? options.duckDb : definition.duckDb;
    if (!requested) return;
    const comboLift = definition.comboPitchCents && Number.isFinite(options.combo)
      ? Math.min(1, Math.max(0, options.combo - 1) * 0.12)
      : 0;
    const apply = () => duckMusic(
      Math.min(9, requested + comboLift),
      definition.duckAttackSeconds || 0.018,
      definition.duckReleaseSeconds || 0.45,
    );
    const delayMs = Math.max(0, Number(options.delay) || 0) * 1_000;
    if (delayMs > 0) window.setTimeout(apply, delayMs);
    else apply();
  }

  function trackVoice(eventId, definition, source, gainNode, panner, loop = false) {
    const voice = {
      id: nextVoiceId,
      eventId,
      priority: clamp(definition.priority || 1, 1, 5),
      source,
      gainNode,
      panner,
      loop,
      startedAt: context?.currentTime || 0,
    };
    nextVoiceId += 1;
    voices.set(voice.id, voice);
    peakSimultaneousVoices = Math.max(peakSimultaneousVoices, activeEffectVoices().length);
    source.onended = () => removeVoice(voice.id);
    return voice;
  }

  function playFallback(eventId, definition, options, pitchCents, outputGain) {
    if (!context || !nodes || !definition.fallback) {
      recordDrop(eventId, definition.priority || 1, 'unavailable');
      return null;
    }
    const fallback = definition.fallback;
    const source = context.createOscillator();
    const gainNode = context.createGain();
    const destination = busFor(definition);
    const start = context.currentTime + Math.max(0, Number(options.delay) || 0);
    const duration = Math.max(0.04, fallback.duration || 0.12);
    const pitchRatio = 2 ** (pitchCents / 1_200);
    const startFrequency = Math.max(40, (fallback.frequency || 440) * pitchRatio);
    const endFrequency = Math.max(40, (fallback.endFrequency || fallback.frequency || 440) * pitchRatio);

    source.type = fallback.wave || 'triangle';
    source.frequency.setValueAtTime(startFrequency, start);
    source.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.linearRampToValueAtTime(0.11 * outputGain, start + 0.006);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    const panner = connectWithPan(source, gainNode, destination, definition, options);
    const voice = trackVoice(eventId, definition, source, gainNode, panner);
    source.start(start);
    source.stop(start + duration + 0.01);
    fallbackPlays += 1;
    applyEventDuck(definition, options);
    return voice;
  }

  function playNow(eventId, options = {}) {
    const definition = eventCatalog[eventId];
    if (!definition) {
      if (!unknownEvents.has(eventId)) {
        unknownEvents.add(eventId);
        console.warn(`[JFT audio] Unknown event: ${eventId}`);
      }
      return null;
    }
    ensureContext();
    if (muted || effectsVolume <= 0 || !context || !nodes) return null;

    const currentTime = nowMilliseconds();
    const lastTime = lastPlayedAt.get(eventId) || -Infinity;
    if (!options.bypassCooldown && currentTime - lastTime < (definition.cooldownMs || 0)) {
      recordDrop(eventId, definition.priority || 1, 'cooldown');
      return null;
    }
    if (!reserveVoice(eventId, definition)) return null;
    lastPlayedAt.set(eventId, currentTime);

    const assetPath = chooseVariant(eventId, definition, options);
    const pitchCents = computedPitchCents(definition, options);
    const outputGain = computedGain(definition, options);
    const buffer = assetPath ? buffers.get(assetPath) : null;
    if (!buffer) {
      if (assetPath && !loadPromises.has(assetPath)) loadAsset(assetPath).catch(() => {});
      return playFallback(eventId, definition, options, pitchCents, outputGain);
    }

    const source = context.createBufferSource();
    const gainNode = context.createGain();
    const destination = busFor(definition);
    const start = context.currentTime + Math.max(0, Number(options.delay) || 0);
    source.buffer = buffer;
    source.playbackRate.value = 2 ** (pitchCents / 1_200);
    gainNode.gain.value = outputGain;
    const panner = connectWithPan(source, gainNode, destination, definition, options);
    const voice = trackVoice(eventId, definition, source, gainNode, panner);
    source.start(start);
    applyEventDuck(definition, options);
    return voice;
  }

  function flushAggregate(eventId) {
    const bucket = aggregates.get(eventId);
    if (!bucket) return;
    aggregates.delete(eventId);
    if (bucket.count <= 1) return;
    aggregatedSourceEvents += bucket.count - 1;
    aggregateClusters += 1;
    playNow(bucket.clusterEventId, {
      bypassAggregation: true,
      aggregateCount: bucket.count,
      streak: bucket.streak,
      position: bucket.positionTotal / bucket.count,
      gain: Math.min(1.08, 0.92 + Math.log2(bucket.count) * 0.04),
    });
  }

  function playAggregated(eventId, definition, options) {
    let bucket = aggregates.get(eventId);
    if (!bucket) {
      bucket = {
        count: 1,
        streak: Number(options.streak) || 1,
        positionTotal: Number(options.position) || 0,
        clusterEventId: definition.aggregate.clusterEventId,
        timer: window.setTimeout(() => flushAggregate(eventId), definition.aggregate.windowMs),
      };
      aggregates.set(eventId, bucket);
      return playNow(eventId, { ...options, bypassAggregation: true });
    }
    bucket.count += 1;
    bucket.streak = Math.max(bucket.streak, Number(options.streak) || bucket.streak);
    bucket.positionTotal += Number(options.position) || 0;
    return { aggregated: true, eventId, count: bucket.count };
  }

  function play(eventId, options = {}) {
    const definition = eventCatalog[eventId];
    if (!definition) return playNow(eventId, options);
    if (muted || effectsVolume <= 0) return null;
    if (definition.aggregate && !options.bypassAggregation) {
      return playAggregated(eventId, definition, options);
    }
    return playNow(eventId, options);
  }

  function beginLoop(handle, definition, options, assetPath) {
    if (handle.stopped || muted || effectsVolume <= 0 || !context || !nodes) return;
    const sameEventLoops = [...loops.values()].filter((loopHandle) => (
      loopHandle.id !== handle.id && !loopHandle.stopped && loopHandle.eventId === handle.eventId && loopHandle.voiceId
    ));
    const eventLimit = Math.max(1, definition.maxPolyphony || 1);
    if (sameEventLoops.length >= eventLimit) {
      recordDrop(handle.eventId, definition.priority || 1, 'eventPolyphony');
      handle.pending = false;
      handle.stopped = true;
      loops.delete(handle.id);
      return;
    }
    const activeLoopVoices = [...voices.values()].filter((voice) => voice.loop).length;
    if (activeEffectVoices().length + activeLoopVoices >= mix.maximumVoices) {
      recordDrop(handle.eventId, definition.priority || 1, 'globalPolyphony');
      handle.pending = false;
      handle.stopped = true;
      loops.delete(handle.id);
      return;
    }
    const buffer = buffers.get(assetPath);
    if (!buffer) return;
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = 2 ** (computedPitchCents(definition, options) / 1_200);
    gainNode.gain.value = computedGain(definition, options);
    const panner = connectWithPan(source, gainNode, busFor(definition), definition, options);
    const voice = trackVoice(handle.eventId, definition, source, gainNode, panner, true);
    handle.pending = false;
    handle.voiceId = voice.id;
    handle.source = source;
    handle.assetPath = assetPath;
    handle.definition = definition;
    handle.options = options;
    source.start(context.currentTime + Math.max(0, Number(options.delay) || 0));
  }

  function startLoop(eventId, options = {}) {
    const definition = eventCatalog[eventId];
    if (!definition) return null;
    ensureContext();
    const handle = {
      id: nextLoopId,
      eventId,
      pending: true,
      stopped: false,
      voiceId: null,
      source: null,
      assetPath: null,
      definition,
      options,
    };
    nextLoopId += 1;
    loops.set(handle.id, handle);
    const assetPath = chooseVariant(eventId, definition, options);
    if (!assetPath) return handle;
    handle.assetPath = assetPath;
    if (buffers.has(assetPath)) beginLoop(handle, definition, options, assetPath);
    else loadAsset(assetPath)
      .then(() => beginLoop(handle, definition, options, assetPath))
      .catch(() => {
        handle.pending = false;
      });
    return handle;
  }

  function stopLoop(handleOrId) {
    const id = typeof handleOrId === 'object' ? handleOrId?.id : handleOrId;
    const handle = loops.get(id);
    if (!handle) return false;
    handle.stopped = true;
    if (handle.voiceId) stopVoice(voices.get(handle.voiceId));
    loops.delete(id);
    return true;
  }

  function registerMusicTracks(trackMap = {}) {
    ensureContext();
    if (!context || !nodes) return 0;
    Object.entries(trackMap).forEach(([name, candidate]) => {
      const element = candidate?.element || candidate;
      if (!element || typeof element.play !== 'function' || typeof element.pause !== 'function') return;
      registeredMusicTracks.set(name, element);
      if (musicSources.has(element)) return;
      try {
        const source = context.createMediaElementSource(element);
        source.connect(nodes.music);
        musicSources.set(element, source);
        musicRoutingFailures.delete(name);
      } catch (error) {
        musicRoutingFailures.set(name, error instanceof Error ? error.message : String(error));
      }
    });
    return registeredMusicTracks.size;
  }

  function setMusicVolume(value) {
    musicVolume = clamp(value);
    applyBusLevels();
    return musicVolume;
  }

  function setMusicDuck(value, options = {}) {
    authoredMusicDuckGain = clamp(value);
    if (!context || !nodes?.musicSceneDuck) return authoredMusicDuckGain;
    const now = context.currentTime;
    const gain = nodes.musicSceneDuck.gain;
    const immediate = options.immediate === true;
    const timeConstant = Math.max(0.005, Number(options.timeConstant) || 0.08);
    gain.cancelScheduledValues(now);
    if (immediate) gain.setValueAtTime(authoredMusicDuckGain, now);
    else gain.setTargetAtTime(Math.max(0.0001, authoredMusicDuckGain), now, timeConstant);
    return authoredMusicDuckGain;
  }

  function clearMusicDuck(options = {}) {
    return setMusicDuck(1, options);
  }

  function setEffectsVolume(value) {
    const wasUnavailable = effectsVolume <= 0 || muted;
    effectsVolume = clamp(value);
    applyBusLevels();
    if (wasUnavailable && effectsVolume > 0 && !muted) resumePendingLoops();
    return effectsVolume;
  }

  function setMuted(value) {
    const wasMuted = muted;
    muted = Boolean(value);
    applyBusLevels();
    if (wasMuted && !muted && effectsVolume > 0) resumePendingLoops();
    return muted;
  }

  function resumePendingLoops() {
    if (!context || !nodes || muted || effectsVolume <= 0) return;
    loops.forEach((handle) => {
      if (handle.stopped || !handle.pending || handle.voiceId) return;
      if (handle.assetPath && buffers.has(handle.assetPath)) {
        beginLoop(handle, handle.definition, handle.options, handle.assetPath);
      }
    });
  }

  function sampleOutputPeak() {
    if (!nodes?.analyser) return null;
    const samples = new Float32Array(nodes.analyser.fftSize);
    if (typeof nodes.analyser.getFloatTimeDomainData === 'function') {
      nodes.analyser.getFloatTimeDomainData(samples);
      let peak = 0;
      for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
      peakOutputSample = Math.max(peakOutputSample, peak);
      return peak;
    }
    return null;
  }

  function busTelemetry(setting, calibration, liveGain) {
    const linear = setting * calibration;
    return {
      setting: Number(setting.toFixed(3)),
      calibration: Number(calibration.toFixed(3)),
      linear: Number(linear.toFixed(3)),
      db: Number(gainToDb(linear).toFixed(2)),
      liveGain: Number((liveGain ?? linear).toFixed(3)),
    };
  }

  function getTelemetry() {
    const outputPeak = sampleOutputPeak();
    const eventDuckGain = nodes?.musicDuck?.gain?.value ?? 1;
    const sceneDuckGain = nodes?.musicSceneDuck?.gain?.value ?? authoredMusicDuckGain;
    const duckGain = eventDuckGain * sceneDuckGain;
    const currentVoices = activeEffectVoices();
    return {
      engineVersion: ENGINE_VERSION,
      catalogVersion: catalog.version || 'unversioned',
      assetCacheVersion: assetCacheVersion || 'unversioned',
      audioContextState: context?.state || (contextError ? 'unavailable' : 'not-created'),
      audioContextSampleRate: context?.sampleRate || null,
      audioContextLatencySeconds: {
        base: Number.isFinite(context?.baseLatency) ? Number(context.baseLatency.toFixed(4)) : null,
        output: Number.isFinite(context?.outputLatency) ? Number(context.outputLatency.toFixed(4)) : null,
      },
      contextError,
      loadedAssets: [...buffers.keys()].sort(),
      failedAssets: [...failedAssets.entries()].sort(([a], [b]) => a.localeCompare(b))
        .map(([asset, error]) => ({ asset, error })),
      loadingAssets: [...loadPromises.keys()].sort(),
      currentEffectVoices: currentVoices.length,
      peakSimultaneousVoices,
      activeVoiceEvents: currentVoices.map((voice) => voice.eventId),
      activeLoops: [...loops.values()].map((loop) => ({ id: loop.id, eventId: loop.eventId, pending: loop.pending })),
      droppedEffectsByPriority: { ...droppedByPriority },
      droppedEffectsByReason: { ...droppedByReason },
      droppedEffectsByEvent: { ...droppedByEvent },
      fallbackPlays,
      aggregation: {
        suppressedSourceEvents: aggregatedSourceEvents,
        clusterVoices: aggregateClusters,
        pendingBuckets: aggregates.size,
      },
      currentMusicDuckAmountDb: Number(Math.max(0, -gainToDb(duckGain)).toFixed(2)),
      currentMusicDuckGain: Number(duckGain.toFixed(3)),
      currentEventMusicDuckAmountDb: Number(Math.max(0, -gainToDb(eventDuckGain)).toFixed(2)),
      currentAuthoredMusicDuckAmountDb: Number(Math.max(0, -gainToDb(sceneDuckGain)).toFixed(2)),
      currentAuthoredMusicDuckGain: Number(sceneDuckGain.toFixed(3)),
      duckEnvelope: { ...duckEnvelope },
      currentBusLevels: {
        music: busTelemetry(musicVolume, mix.musicCalibration, nodes?.music?.gain?.value),
        gameplaySfx: busTelemetry(effectsVolume, mix.gameplayCalibration, nodes?.gameplay?.gain?.value),
        ui: busTelemetry(effectsVolume, mix.uiCalibration, nodes?.ui?.gain?.value),
        ambience: busTelemetry(effectsVolume, mix.ambienceCalibration, nodes?.ambience?.gain?.value),
        master: {
          muted,
          linear: Number((nodes?.master?.gain?.value ?? (muted ? 0 : 1)).toFixed(3)),
          ceilingLinear: Number(mix.masterCeiling.toFixed(3)),
          ceilingDb: Number(gainToDb(mix.masterCeiling).toFixed(2)),
          compressorReductionDb: Number((nodes?.compressor?.reduction || 0).toFixed(2)),
        },
      },
      outputSamplePeakDbfs: outputPeak === null ? null : Number(gainToDb(outputPeak).toFixed(2)),
      peakObservedOutputSampleDbfs: peakOutputSample > 0 ? Number(gainToDb(peakOutputSample).toFixed(2)) : null,
      registeredMusicTracks: [...registeredMusicTracks.keys()].sort(),
      musicRoutingFailures: [...musicRoutingFailures.entries()].map(([track, error]) => ({ track, error })),
      knownEventCount: Object.keys(eventCatalog).length,
      unknownEvents: [...unknownEvents].sort(),
    };
  }

  function hasEvent(eventId) {
    return Boolean(eventCatalog[eventId]);
  }

  function listEvents() {
    return Object.keys(eventCatalog).sort();
  }

  window.JFT_AUDIO = Object.freeze({
    engineVersion: ENGINE_VERSION,
    init,
    preload,
    preloadGroups,
    registerMusicTracks,
    play,
    startLoop,
    stopLoop,
    setMusicVolume,
    setMusicDuck,
    clearMusicDuck,
    setEffectsVolume,
    setMuted,
    getTelemetry,
    hasEvent,
    listEvents,
  });
})();
