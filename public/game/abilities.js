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
    transformationDuration: 0.52,
    powerDownDuration: 0.36,
    damageInvulnerabilityDuration: 1.3,
    superJumpFxDuration: 0.3,
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
    state.frenzyTimer = Math.max(0, state.frenzyTimer - dt);
    state.magnetTimer = Math.max(0, state.magnetTimer - dt);
    state.transformTimer = Math.max(0, state.transformTimer - dt);
    state.powerDownTimer = Math.max(0, state.powerDownTimer - dt);
    state.superJumpFxTimer = Math.max(0, state.superJumpFxTimer - dt);
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

  function suspendForTransformation(state, player) {
    normalize(state);
    if (state.transformTimer <= 0) return false;
    player.vx *= 0.72;
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
      const radius = 45 + pulse * 8;
      const glow = ctx.createRadialGradient(centerX, centerY, 6, centerX, centerY, radius);
      glow.addColorStop(0, 'rgba(255,240,145,.27)');
      glow.addColorStop(0.42, 'rgba(101,231,255,.18)');
      glow.addColorStop(0.72, 'rgba(255,104,180,.12)');
      glow.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pulse > 0.5 ? '#65e7ff' : '#ffd65a';
      ctx.globalAlpha = 0.66;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX, footY, 30 + pulse * 4, 7 + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let index = 0; index < 5; index += 1) {
        const angle = time * 0.0022 + index * Math.PI * 0.4;
        drawOrbitTaco(
          ctx,
          centerX + Math.cos(angle) * (31 + (index % 2) * 6),
          centerY + Math.sin(angle) * 24,
          angle + Math.PI * 0.5,
          4.2,
          0.72 + pulse * 0.2,
        );
      }
    }
    if (state.transformTimer > 0) {
      const progress = 1 - state.transformTimer / definitions.superHero.transformationDuration;
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = progress < 0.5 ? '#fff4ad' : '#65e7ff';
      ctx.lineWidth = 7 - progress * 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18 + progress * 92, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (state.powerDownTimer > 0) {
      const remaining = state.powerDownTimer / definitions.superHero.powerDownDuration;
      ctx.globalAlpha = remaining;
      for (let index = 0; index < 10; index += 1) {
        const angle = index * Math.PI * 0.2 + 0.17;
        const distance = (1 - remaining) * 66;
        ctx.fillStyle = index % 2 ? '#65e7ff' : index % 3 ? '#ffd65a' : '#ff68b4';
        ctx.save();
        ctx.translate(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance);
        ctx.rotate(angle + time * 0.01);
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();
      }
    }
    if (state.superJumpFxTimer > 0) {
      const remaining = state.superJumpFxTimer / definitions.superHero.superJumpFxDuration;
      const progress = 1 - remaining;
      ctx.globalAlpha = remaining;
      ctx.strokeStyle = '#65e7ff';
      ctx.lineWidth = 5 * remaining + 1;
      ctx.beginPath();
      ctx.ellipse(centerX, footY + progress * 10, 13 + progress * 34, 4 + progress * 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffd65a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(centerX, footY + 5, 8 + progress * 22, 2.5 + progress * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < 6; index += 1) {
        const offset = (index - 2.5) * 9;
        ctx.fillStyle = index % 2 ? '#ff68b4' : '#fff4ad';
        ctx.beginPath();
        ctx.arc(centerX + offset, footY + progress * 18 + Math.abs(offset) * 0.08, 2.8 * remaining + 1, 0, Math.PI * 2);
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
    return {
      active: state.superActive,
      tacoPower: state.tacoMeter,
      tacoPowerThreshold: definitions.tacoPower.threshold,
      airJumpAvailable: state.airJumpAvailable,
      transforming: state.transformTimer > 0,
      powerDown: state.powerDownTimer > 0,
      visualScale: definitions.superHero.visualScale,
      superJumpVelocity: window.JFT_HERO_CORE?.physics?.superJumpVelocity || definitions.superHero.superJumpVelocity,
    };
  }

  window.JFT_SHARED_ABILITIES = Object.freeze({
    version: 'super-taco-hero-v1',
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
    applyHeroVisualTransform,
    applyHeroStyle,
    drawHeroEffects,
    drawTacoPowerHUD,
    snapshot,
    isSuper: (state) => Boolean(normalize(state).superActive),
    isTransforming: (state) => normalize(state).transformTimer > 0,
    canSuperJump: (state) => Boolean(normalize(state).superActive && state.airJumpAvailable),
    isFrenzy: (state) => normalize(state).frenzyTimer > 0,
    hasMagnet: (state) => normalize(state).magnetTimer > 0,
  });
})();
