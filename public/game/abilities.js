(() => {
  const tacoPower = Object.freeze({
    id: 'taco-power',
    label: 'TACO POWER',
    threshold: 100,
    contributions: Object.freeze({ taco: 7, premiumTaco: 16, enemySplat: 14 }),
  });
  const superHero = Object.freeze({
    id: 'super-taco-hero',
    label: 'SUPER TACO HERO',
    visualScale: 1.12,
    superJumpVelocity: 650,
    transformationDuration: 0.78,
    powerDownDuration: 0.42,
    damageInvulnerabilityDuration: 1.3,
    superJumpFxDuration: 0.32,
    artworkSwapProgress: 0.54,
    powerDownArtworkSwapProgress: 0.58,
    spriteSheet: '/game/assets/taco_hero_super_sheet.png?v=1',
    frameCount: 8,
    runSpriteSheet: '/game/assets/taco_hero_super_run_sheet.png?v=1',
    runFrameCount: 4,
    runPhaseScale: 4 / 3,
  });
  const definitions = Object.freeze({
    tacoPower,
    // Compatibility alias while older telemetry migrates from the Taco Meter name.
    tacoMeter: tacoPower,
    superHero,
    tacoFrenzy: Object.freeze({ id: 'taco-frenzy', label: 'Taco Frenzy', duration: 8 }),
    tacoMagnet: Object.freeze({ id: 'taco-magnet', label: 'Taco Magnet', duration: 9, radius: 310 }),
  });

  function createState() {
    return {
      tacoMeter: 0,
      frenzyTimer: 0,
      magnetTimer: 0,
      frenzyCount: 0,
      superActive: false,
      superCount: 0,
      airJumpAvailable: false,
      transformTimer: 0,
      powerDownTimer: 0,
      superJumpFxTimer: 0,
      superSource: null,
      transformMotion: null,
      transformRestorePending: false,
      shoeActivationPending: false,
    };
  }

  function normalize(state) {
    const defaults = createState();
    Object.keys(defaults).forEach((key) => {
      if (state[key] === undefined) state[key] = defaults[key];
    });
    return state;
  }

  function reset(state) {
    Object.assign(state, createState());
    return state;
  }

  function update(state, dt) {
    normalize(state);
    const wasTransforming = state.transformTimer > 0;
    state.frenzyTimer = Math.max(0, state.frenzyTimer - dt);
    state.magnetTimer = Math.max(0, state.magnetTimer - dt);
    state.transformTimer = Math.max(0, state.transformTimer - dt);
    state.powerDownTimer = Math.max(0, state.powerDownTimer - dt);
    state.superJumpFxTimer = Math.max(0, state.superJumpFxTimer - dt);
    if (state.shoeActivationPending
      && state.transformTimer <= definitions.superHero.transformationDuration * 0.42) {
      state.shoeActivationPending = false;
      playSharedEvent('ability.superShoes');
    }
    if (wasTransforming && state.transformTimer <= 0 && state.transformMotion) {
      state.transformRestorePending = true;
    }
  }

  function playSharedEvent(eventId, options = {}) {
    if (options.silent) return;
    window.JFT_AUDIO?.playEvent?.(eventId, options);
  }

  function activateSuper(state, source = 'meter', options = {}) {
    normalize(state);
    if (state.superActive) return false;
    state.superActive = true;
    state.superCount += 1;
    state.superSource = source;
    state.tacoMeter = 0;
    state.airJumpAvailable = true;
    state.transformTimer = definitions.superHero.transformationDuration;
    state.powerDownTimer = 0;
    state.transformMotion = null;
    state.transformRestorePending = false;
    state.shoeActivationPending = !options.silent;
    playSharedEvent('ability.superTransform', options);
    return true;
  }

  function removeSuper(state, source = 'damage', options = {}) {
    normalize(state);
    if (!state.superActive) return false;
    state.superActive = false;
    state.superSource = source;
    state.airJumpAvailable = false;
    state.transformTimer = 0;
    state.superJumpFxTimer = 0;
    state.shoeActivationPending = false;
    state.transformRestorePending = Boolean(state.transformMotion);
    state.powerDownTimer = options.silent ? 0 : definitions.superHero.powerDownDuration;
    playSharedEvent('ability.superPowerDown', options);
    return true;
  }

  function clearForRespawn(state) {
    normalize(state);
    removeSuper(state, 'respawn', { silent: true });
    state.transformTimer = 0;
    state.powerDownTimer = 0;
    state.superJumpFxTimer = 0;
    state.airJumpAvailable = false;
    state.transformMotion = null;
    state.transformRestorePending = false;
    state.shoeActivationPending = false;
    return state;
  }

  function absorbDamage(state, options = {}) {
    return removeSuper(state, 'damage', options);
  }

  function addMeter(state, amount, source = 'taco', options = {}) {
    normalize(state);
    if (state.superActive) return false;
    state.tacoMeter = Math.min(definitions.tacoPower.threshold, state.tacoMeter + Math.max(0, amount));
    if (state.tacoMeter < definitions.tacoPower.threshold) return false;
    return activateSuper(state, source, options);
  }

  function resolveTacoType(tacoType) {
    if (typeof tacoType === 'string') return tacoType;
    return tacoType ? 'premium' : 'taco';
  }

  function collectTaco(state, tacoType = 'taco', options = {}) {
    const type = resolveTacoType(tacoType);
    if (type === 'golden') return activateSuper(state, 'golden-taco', options);
    const amount = type === 'taco' || type === 'normal'
      ? definitions.tacoPower.contributions.taco
      : definitions.tacoPower.contributions.premiumTaco;
    return addMeter(state, amount, `${type}-taco`, options);
  }

  function collectGoldenTaco(state, options = {}) {
    return activateSuper(state, 'golden-taco', options);
  }

  function splatEnemy(state, options = {}) {
    return addMeter(state, definitions.tacoPower.contributions.enemySplat, 'enemy-splat', options);
  }

  function activateFrenzy(state, duration = definitions.tacoFrenzy.duration) {
    normalize(state);
    state.frenzyTimer = Math.max(state.frenzyTimer, duration);
    state.frenzyCount += 1;
  }

  function activateMagnet(state, duration = definitions.tacoMagnet.duration) {
    normalize(state);
    state.magnetTimer = Math.max(state.magnetTimer, duration);
  }

  function removeMagnet(state) {
    normalize(state);
    state.magnetTimer = 0;
  }

  function land(state) {
    normalize(state);
    state.airJumpAvailable = state.superActive;
  }

  function trySuperJump(state, options = {}) {
    normalize(state);
    if (!state.superActive || !state.airJumpAvailable || options.suspended) return 0;
    state.airJumpAvailable = false;
    state.superJumpFxTimer = definitions.superHero.superJumpFxDuration;
    const configuredVelocity = window.JFT_HERO_CORE?.physics?.superJumpVelocity;
    playSharedEvent('hero.superJump', options);
    return Number.isFinite(configuredVelocity) ? configuredVelocity : definitions.superHero.superJumpVelocity;
  }

  function suspendForTransformation(state, player, options = {}) {
    normalize(state);
    if (options.disabled) {
      if (state.transformMotion) {
        player.vx = state.transformMotion.vx;
        player.vy = state.transformMotion.vy;
      }
      state.transformMotion = null;
      state.transformRestorePending = false;
      return false;
    }
    if (state.transformTimer <= 0) {
      if (state.transformRestorePending && state.transformMotion) {
        player.vx = state.transformMotion.vx;
        player.vy = state.transformMotion.vy;
      }
      state.transformMotion = null;
      state.transformRestorePending = false;
      return false;
    }
    if (!state.transformMotion) {
      state.transformMotion = {
        vx: Number.isFinite(player.vx) ? player.vx : 0,
        vy: Number.isFinite(player.vy) ? player.vy : 0,
        grounded: Boolean(player.grounded),
      };
    }
    if (state.transformMotion.grounded && player.grounded && player.platform && !options.platformAlreadyCarried) {
      player.x += player.platform.dx || 0;
      player.y += player.platform.dy || 0;
    }
    player.vx = 0;
    player.vy = 0;
    player.jumpBuffer = 0;
    return true;
  }

  function meterProgress(state) {
    normalize(state);
    return state.superActive ? 1 : Math.min(1, state.tacoMeter / definitions.tacoPower.threshold);
  }

  function heroVisualTransform(state, time = 0) {
    normalize(state);
    const config = definitions.superHero;
    let x = state.superActive ? config.visualScale : 1;
    let y = x;
    if (state.transformTimer > 0) {
      const progress = 1 - state.transformTimer / config.transformationDuration;
      const eased = 1 - ((1 - progress) ** 3);
      const anticipation = Math.max(0, 1 - progress / 0.24);
      const surge = Math.sin(Math.min(1, progress / 0.82) * Math.PI) * 0.06;
      x = 1 + (config.visualScale - 1) * eased + surge + anticipation * 0.09;
      y = 1 + (config.visualScale - 1) * eased + surge - anticipation * 0.12;
    } else if (state.powerDownTimer > 0) {
      const remaining = state.powerDownTimer / config.powerDownDuration;
      const jitter = Math.sin((1 - remaining) * Math.PI * 5) * 0.035 * remaining;
      x = 1 + (config.visualScale - 1) * remaining + jitter;
      y = 1 + (config.visualScale - 1) * remaining - jitter;
    } else if (state.superActive) {
      const pulse = Math.sin(time * 0.007) * 0.008;
      x += pulse;
      y -= pulse * 0.45;
    }
    return { x, y };
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function smoothstep(start, end, value) {
    const progress = clamp01((value - start) / Math.max(0.0001, end - start));
    return progress * progress * (3 - 2 * progress);
  }

  let superHeroSpriteSheet = null;
  let superHeroRunSpriteSheet = null;

  function getSuperHeroSpriteSheet() {
    if (!superHeroSpriteSheet && typeof Image !== 'undefined') {
      superHeroSpriteSheet = new Image();
      superHeroSpriteSheet.decoding = 'async';
      superHeroSpriteSheet.src = definitions.superHero.spriteSheet;
    }
    return superHeroSpriteSheet;
  }

  function getSuperHeroRunSpriteSheet() {
    if (!superHeroRunSpriteSheet && typeof Image !== 'undefined') {
      superHeroRunSpriteSheet = new Image();
      superHeroRunSpriteSheet.decoding = 'async';
      superHeroRunSpriteSheet.src = definitions.superHero.runSpriteSheet;
    }
    return superHeroRunSpriteSheet;
  }

  function superLocomotionFrame(animation = 0) {
    const config = definitions.superHero;
    const phase = Math.floor(Math.max(0, animation) * config.runPhaseScale);
    return phase % config.runFrameCount;
  }

  function heroArtworkVisualState(state) {
    normalize(state);
    const config = definitions.superHero;
    const transformProgress = state.transformTimer > 0
      ? clamp01(1 - state.transformTimer / config.transformationDuration)
      : 1;
    const powerDownProgress = state.powerDownTimer > 0
      ? clamp01(1 - state.powerDownTimer / config.powerDownDuration)
      : 0;
    const transforming = state.transformTimer > 0;
    const poweringDown = state.powerDownTimer > 0;
    let artwork = state.superActive ? 'super' : 'normal';
    let swapDistance = 1;
    if (transforming) {
      artwork = transformProgress >= config.artworkSwapProgress ? 'super' : 'normal';
      swapDistance = Math.abs(transformProgress - config.artworkSwapProgress);
    } else if (poweringDown) {
      artwork = powerDownProgress < config.powerDownArtworkSwapProgress ? 'super' : 'normal';
      swapDistance = Math.abs(powerDownProgress - config.powerDownArtworkSwapProgress);
    }
    const jumpFlare = state.superJumpFxTimer > 0
      ? clamp01(state.superJumpFxTimer / config.superJumpFxDuration)
      : 0;
    return {
      artwork,
      swapFlash: transforming || poweringDown ? clamp01(1 - swapDistance / 0.13) : 0,
      jumpFlare,
      powerDownFlash: poweringDown ? 1 - smoothstep(0, 0.38, powerDownProgress) : 0,
      transformProgress,
      powerDownProgress,
    };
  }

  function isDrawableSprite(sprite) {
    if (!sprite) return false;
    if (typeof sprite.complete === 'boolean' && !sprite.complete) return false;
    return (sprite.naturalWidth || sprite.width || 0) > 0 && (sprite.naturalHeight || sprite.height || 0) > 0;
  }

  function drawHeroSpriteFrame(ctx, state, normalSprite, frame, options = {}) {
    normalize(state);
    const visual = heroArtworkVisualState(state);
    const superSprite = options.superSprite || getSuperHeroSpriteSheet();
    const superRunSprite = options.superRunSprite || getSuperHeroRunSpriteSheet();
    const useSuperRun = visual.artwork === 'super' && options.running && isDrawableSprite(superRunSprite);
    const requestedSprite = useSuperRun
      ? superRunSprite
      : visual.artwork === 'super' ? superSprite : normalSprite;
    const sprite = isDrawableSprite(requestedSprite) ? requestedSprite : normalSprite;
    if (!isDrawableSprite(sprite)) return visual;
    const frameCount = useSuperRun
      ? definitions.superHero.runFrameCount
      : options.frameCount || definitions.superHero.frameCount;
    const requestedFrame = useSuperRun ? superLocomotionFrame(options.animation) : frame;
    const sourceWidth = (sprite.naturalWidth || sprite.width) / frameCount;
    const sourceHeight = sprite.naturalHeight || sprite.height;
    const width = options.width ?? 66;
    const height = options.height ?? width;
    const x = options.x ?? -width / 2;
    const y = options.y ?? -height / 2;
    ctx.save();
    if (visual.swapFlash > 0.01) {
      const inheritedFilter = ctx.filter && ctx.filter !== 'none' ? `${ctx.filter} ` : '';
      ctx.filter = `${inheritedFilter}brightness(${1 + visual.swapFlash * 1.7}) saturate(${1 + visual.swapFlash * 0.32})`;
      ctx.shadowColor = visual.artwork === 'super' ? '#65e7ff' : '#fff4ad';
      ctx.shadowBlur = 5 + visual.swapFlash * 11;
    }
    ctx.drawImage(sprite, requestedFrame * sourceWidth, 0, sourceWidth, sourceHeight, x, y, width, height);
    ctx.restore();
    return { ...visual, locomotionFrame: useSuperRun ? requestedFrame : null, runningArtwork: useSuperRun };
  }

  function applyHeroVisualTransform(ctx, state, options = {}) {
    const transform = heroVisualTransform(state, options.time || 0);
    const direction = options.direction ?? 1;
    const baseScale = options.baseScale ?? 1;
    const anchorY = options.anchorY ?? 33;
    ctx.translate(0, anchorY);
    ctx.scale(direction * baseScale * transform.x, baseScale * transform.y);
    ctx.translate(0, -anchorY);
  }

  function applyHeroStyle(ctx, state) {
    normalize(state);
    if (!state.superActive && state.transformTimer <= 0 && state.powerDownTimer <= 0) return;
    ctx.shadowColor = state.superActive ? '#fff09a' : '#ff68b4';
    ctx.shadowBlur = state.superActive ? 26 : 18;
    ctx.filter = state.superActive
      ? 'saturate(1.38) brightness(1.12) drop-shadow(0 0 3px #65e7ff)'
      : 'saturate(1.15) brightness(1.08)';
  }

  function drawOrbitTaco(ctx, x, y, rotation, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath();
    ctx.arc(0, 0, size, Math.PI, 0);
    ctx.lineTo(size, size * 0.35);
    ctx.quadraticCurveTo(0, size * 0.8, -size, size * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff4ad';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#65e77e';
    ctx.fillRect(-size * 0.65, size * 0.05, size * 1.3, Math.max(1.5, size * 0.18));
    ctx.fillStyle = '#ff68b4';
    ctx.fillRect(-size * 0.45, size * 0.28, size * 0.9, Math.max(1.2, size * 0.14));
    ctx.restore();
  }

  function drawHeroEffects(ctx, state, player, cameraX = 0, time = 0, options = {}) {
    normalize(state);
    const visible = state.superActive || state.transformTimer > 0 || state.powerDownTimer > 0 || state.superJumpFxTimer > 0;
    if (!visible) return;
    const reducedMotion = Boolean(options.reducedMotion);
    const artworkVisual = heroArtworkVisualState(state);
    const x = options.x ?? player.x - cameraX;
    const y = options.y ?? player.y;
    const w = options.w ?? player.w;
    const h = options.h ?? player.h;
    const centerX = x + w * 0.5;
    const centerY = y + h * 0.48;
    const footY = y + h + 8;
    ctx.save();
    if (state.superActive || state.transformTimer > 0) {
      const pulse = (Math.sin(time * 0.01) + 1) * 0.5;
      const radius = state.transformTimer > 0 ? 42 + pulse * 6 : 35 + pulse * 3;
      const glow = ctx.createRadialGradient(centerX, centerY, 6, centerX, centerY, radius);
      glow.addColorStop(0, state.transformTimer > 0 ? 'rgba(255,240,145,.28)' : 'rgba(255,240,145,.12)');
      glow.addColorStop(0.42, state.transformTimer > 0 ? 'rgba(101,231,255,.2)' : 'rgba(101,231,255,.08)');
      glow.addColorStop(0.72, state.transformTimer > 0 ? 'rgba(255,104,180,.13)' : 'rgba(255,104,180,.045)');
      glow.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pulse > 0.5 ? '#65e7ff' : '#ffd65a';
      ctx.globalAlpha = state.transformTimer > 0 ? 0.68 : 0.28;
      ctx.lineWidth = state.transformTimer > 0 ? 3 : 1.8;
      ctx.beginPath();
      ctx.ellipse(centerX, footY, 25 + pulse * 3, 5.5 + pulse * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (artworkVisual.artwork === 'super') {
        ctx.globalAlpha = state.transformTimer > 0 ? 0.58 : 0.2 + pulse * 0.09;
        ctx.fillStyle = pulse > 0.5 ? '#65e7ff' : '#ffd65a';
        ctx.shadowColor = '#65e7ff';
        ctx.shadowBlur = reducedMotion ? 3 : 5 + pulse * 2;
        ctx.beginPath();
        ctx.ellipse(centerX - 8.5, footY - 1.5, 8.8, 2.1, -0.04, 0, Math.PI * 2);
        ctx.ellipse(centerX + 8.5, footY - 1, 8.8, 2.1, 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      const orbitCount = state.transformTimer > 0 ? (reducedMotion ? 2 : 3) : 0;
      for (let index = 0; index < orbitCount; index += 1) {
        const angle = time * 0.002 + index * Math.PI * (2 / orbitCount);
        drawOrbitTaco(
          ctx,
          centerX + Math.cos(angle) * (29 + (index % 2) * 5),
          centerY + Math.sin(angle) * 21,
          angle + Math.PI * 0.5,
          3.8,
          0.58 + pulse * 0.18,
        );
      }
      if (state.superActive && state.transformTimer <= 0 && !reducedMotion && Math.sin(time * 0.0041) > 0.94) {
        ctx.globalAlpha = 0.62;
        ctx.fillStyle = '#fff4ad';
        ctx.beginPath();
        ctx.arc(centerX + Math.sin(time * 0.003) * 24, centerY - 15, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (state.transformTimer > 0) {
      const progress = artworkVisual.transformProgress;
      const ringAlpha = 1 - smoothstep(0.22, 1, progress);
      ctx.globalAlpha = ringAlpha * (reducedMotion ? 0.58 : 1);
      ctx.strokeStyle = progress < 0.5 ? '#fff4ad' : '#65e7ff';
      ctx.lineWidth = 5.5 - progress * 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18 + progress * (reducedMotion ? 48 : 70), 0, Math.PI * 2);
      ctx.stroke();
      const funnelAlpha = Math.sin(smoothstep(0.05, 0.78, progress) * Math.PI);
      if (funnelAlpha > 0.01) {
        const funnelCount = reducedMotion ? 3 : 6;
        ctx.globalAlpha = funnelAlpha * (reducedMotion ? 0.64 : 0.88);
        ctx.lineCap = 'round';
        for (let index = 0; index < funnelCount; index += 1) {
          const spread = (index - (funnelCount - 1) * 0.5) * (reducedMotion ? 11 : 9);
          const wave = Math.sin(time * 0.018 + index * 1.7) * 4;
          ctx.strokeStyle = index % 3 === 0 ? '#ffd65a' : index % 2 ? '#ff68b4' : '#65e7ff';
          ctx.lineWidth = index % 2 ? 2.4 : 3.2;
          ctx.beginPath();
          ctx.moveTo(centerX + spread, centerY - 24 + Math.abs(spread) * 0.22);
          ctx.quadraticCurveTo(centerX + spread * 0.38 + wave, centerY + 8, centerX + spread * 0.18, footY - 2);
          ctx.stroke();
        }
      }
      const shoeBurst = Math.sin(smoothstep(0.56, 0.96, progress) * Math.PI);
      if (shoeBurst > 0.01) {
        const burstCount = reducedMotion ? 4 : 8;
        ctx.globalAlpha = shoeBurst * (reducedMotion ? 0.6 : 0.92);
        for (let index = 0; index < burstCount; index += 1) {
          const angle = -Math.PI + index * (Math.PI * 2 / burstCount);
          const distance = 10 + shoeBurst * (10 + (index % 2) * 7);
          ctx.fillStyle = index % 3 === 0 ? '#fff4ad' : index % 2 ? '#ff68b4' : '#65e7ff';
          ctx.save();
          ctx.translate(centerX + Math.cos(angle) * distance, footY + Math.sin(angle) * distance * 0.42);
          ctx.rotate(angle);
          ctx.fillRect(-2.7, -1.5, 5.4, 3);
          ctx.restore();
        }
      }
    }
    if (state.powerDownTimer > 0) {
      const remaining = 1 - artworkVisual.powerDownProgress;
      ctx.globalAlpha = remaining;
      const fragmentCount = reducedMotion ? 5 : 9;
      for (let index = 0; index < fragmentCount; index += 1) {
        const angle = index * Math.PI * (2 / fragmentCount) + 0.17;
        const distance = (1 - remaining) * (reducedMotion ? 34 : 52);
        ctx.fillStyle = index % 2 ? '#65e7ff' : index % 3 ? '#ffd65a' : '#ff68b4';
        ctx.save();
        ctx.translate(centerX + Math.cos(angle) * distance, footY + Math.sin(angle) * distance * 0.58);
        ctx.rotate(angle + time * 0.01);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();
      }
      ctx.strokeStyle = '#fff4ad';
      ctx.lineWidth = 2 + remaining * 2;
      ctx.globalAlpha = artworkVisual.powerDownFlash * 0.9;
      ctx.beginPath();
      ctx.ellipse(centerX, footY, 19 + (1 - remaining) * 18, 5 + (1 - remaining) * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (state.superJumpFxTimer > 0) {
      const remaining = state.superJumpFxTimer / definitions.superHero.superJumpFxDuration;
      const progress = 1 - remaining;
      ctx.globalAlpha = remaining;
      ctx.strokeStyle = '#65e7ff';
      ctx.lineWidth = 4 * remaining + 1;
      ctx.beginPath();
      ctx.ellipse(centerX, footY + progress * 8, 12 + progress * 26, 3 + progress * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffd65a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(centerX, footY + 4, 8 + progress * 18, 2.2 + progress * 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (!reducedMotion) {
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(centerX + side * 10, footY - 8 - progress * 2);
          ctx.scale(side, 1);
          ctx.globalAlpha = remaining * 0.78;
          ctx.strokeStyle = '#fffdf0';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.quadraticCurveTo(8 + progress * 7, -6 - progress * 2, 15 + progress * 8, -3);
          ctx.quadraticCurveTo(10 + progress * 5, 1, 2, 4);
          ctx.stroke();
          ctx.strokeStyle = '#ff68b4';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(4, 2); ctx.quadraticCurveTo(10 + progress * 5, -1, 15 + progress * 7, -3);
          ctx.stroke();
          ctx.restore();
        }
      }
      const jumpParticleCount = reducedMotion ? 3 : 5;
      for (let index = 0; index < jumpParticleCount; index += 1) {
        const offset = (index - (jumpParticleCount - 1) * 0.5) * 8;
        ctx.fillStyle = index % 2 ? '#ff68b4' : '#fff4ad';
        ctx.beginPath();
        ctx.arc(centerX + offset, footY + progress * 14 + Math.abs(offset) * 0.06, 2.1 * remaining + 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawTacoPowerHUD(ctx, state, options = {}) {
    normalize(state);
    const x = options.x ?? 28;
    const y = options.y ?? 114;
    const width = options.width ?? 290;
    const height = options.height ?? 12;
    const progress = meterProgress(state);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.17)';
    ctx.fillRect(x, y, width, height);
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#ffd65a');
    gradient.addColorStop(0.52, '#ff68b4');
    gradient.addColorStop(1, '#65e7ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width * progress, height);
    if (state.superActive) {
      ctx.strokeStyle = '#fff4ad';
      ctx.shadowColor = '#65e7ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = state.superActive ? '#fff4ad' : (options.textColor || '#fff9ef');
    ctx.font = options.font || '900 10px Arial';
    ctx.textAlign = options.textAlign || 'left';
    ctx.fillText(
      state.superActive ? definitions.superHero.label : definitions.tacoPower.label,
      options.labelX ?? x,
      options.labelY ?? y - 4,
    );
    ctx.restore();
  }

  function snapshot(state) {
    normalize(state);
    const artwork = heroArtworkVisualState(state);
    return {
      active: state.superActive,
      tacoPower: state.tacoMeter,
      tacoPowerThreshold: definitions.tacoPower.threshold,
      airJumpAvailable: state.airJumpAvailable,
      transforming: state.transformTimer > 0,
      transformationProgress: state.transformTimer > 0
        ? 1 - state.transformTimer / definitions.superHero.transformationDuration
        : 1,
      transformationSuspended: Boolean(state.transformMotion),
      powerDown: state.powerDownTimer > 0,
      fiestaWingShoes: state.superActive || state.powerDownTimer > 0,
      heroArtwork: artwork.artwork,
      completeAlternateSprite: artwork.artwork === 'super',
      locomotionFrames: definitions.superHero.runFrameCount,
      alternatingLocomotion: true,
      visualScale: definitions.superHero.visualScale,
      superJumpVelocity: window.JFT_HERO_CORE?.physics?.superJumpVelocity || definitions.superHero.superJumpVelocity,
    };
  }

  getSuperHeroSpriteSheet();
  getSuperHeroRunSpriteSheet();

  window.JFT_SHARED_ABILITIES = Object.freeze({
    version: 'super-taco-hero-v4-alternating-run',
    definitions,
    createState,
    reset,
    update,
    collectTaco,
    collectGoldenTaco,
    splatEnemy,
    activateSuper,
    removeSuper,
    clearForRespawn,
    absorbDamage,
    activateFrenzy,
    activateMagnet,
    removeMagnet,
    land,
    trySuperJump,
    suspendForTransformation,
    meterProgress,
    heroVisualTransform,
    heroArtworkVisualState,
    getSuperHeroSpriteSheet,
    getSuperHeroRunSpriteSheet,
    superLocomotionFrame,
    applyHeroVisualTransform,
    applyHeroStyle,
    drawHeroEffects,
    drawHeroSpriteFrame,
    drawTacoPowerHUD,
    snapshot,
    isSuper: (state) => Boolean(normalize(state).superActive),
    isTransforming: (state) => normalize(state).transformTimer > 0,
    canSuperJump: (state) => Boolean(normalize(state).superActive && state.airJumpAvailable),
    isFrenzy: (state) => normalize(state).frenzyTimer > 0,
    hasMagnet: (state) => normalize(state).magnetTimer > 0,
  });
})();
