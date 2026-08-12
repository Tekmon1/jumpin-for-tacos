(() => {
  'use strict';

  const TRANSITION_WIDTH = 1600;
  const PANORAMA_CROP = 0.9;
  const STAGES = Object.freeze({
    '1-1': Object.freeze([
      { id: 'golden-cactus-flats', name: 'Golden Cactus Flats', start: 0, end: 8960, src: 'assets/world1_1_env_golden_flats_v1.webp', dust: .3, clouds: .3, stars: 0, lights: .04, fiesta: 0 },
      { id: 'papel-picado-truckway', name: 'Papel Picado Truckway', start: 8960, end: 17480, src: 'assets/world1_1_env_truckway_v1.webp', dust: .18, clouds: .22, stars: .08, lights: .18, fiesta: .08 },
      { id: 'red-rock-salsa-bowl', name: 'Red Rock Salsa Bowl', start: 17480, end: 23920, src: 'assets/world1_1_env_salsa_bowl_v1.webp', dust: .36, clouds: .34, stars: .28, lights: .16, fiesta: .14 },
      { id: 'neon-desert-highway', name: 'Neon Desert Highway', start: 23920, end: 31280, src: 'assets/world1_1_env_neon_highway_v1.webp', dust: .08, clouds: .14, stars: .78, lights: 1, fiesta: .26 },
      { id: 'moonlit-pinata-plaza', name: 'Moonlit Piñata Plaza', start: 31280, end: 33080, src: 'assets/world1_1_env_pinata_plaza_v1.webp', dust: 0, clouds: .08, stars: 1, lights: 1, fiesta: 1 },
    ]),
    '1-2': Object.freeze([
      { id: 'sunrise-taco-airfield', name: 'Sunrise Taco Airfield', start: 0, end: 4600, src: 'assets/world1_2_env_airfield_v1.webp', clouds: .18, birds: .08, thermals: 0, storm: 0, beacons: .36, stars: 0, fiesta: 0 },
      { id: 'big-sky-desert-cruise', name: 'Big-Sky Desert Cruise', start: 4600, end: 10400, src: 'assets/world1_2_env_cruise_v1.webp', clouds: .48, birds: .7, thermals: .18, storm: 0, beacons: 0, stars: 0, fiesta: 0 },
      { id: 'banner-cloudway', name: 'Banner Cloudway', start: 10400, end: 16400, src: 'assets/world1_2_env_banner_v1.webp', clouds: .3, birds: .12, thermals: .12, storm: 0, beacons: 0, stars: 0, fiesta: 0 },
      { id: 'high-mesa-thermals', name: 'High Mesa Thermals', start: 16400, end: 22400, src: 'assets/world1_2_env_thermals_v1.webp', clouds: .42, birds: .42, thermals: 1, storm: .08, beacons: 0, stars: 0, fiesta: 0 },
      { id: 'guacamole-stormfront', name: 'Guacamole Stormfront', start: 22400, end: 27000, src: 'assets/world1_2_env_stormfront_v1.webp', clouds: .64, birds: 0, thermals: .18, storm: 1, beacons: .08, stars: .1, fiesta: 0 },
      { id: 'sunset-rescue-corridor', name: 'Sunset Rescue Corridor', start: 27000, end: 32200, src: 'assets/world1_2_env_rescue_v1.webp', clouds: .46, birds: .08, thermals: .34, storm: .22, beacons: 1, stars: .26, fiesta: .08 },
      { id: 'emergency-landing-fiesta', name: 'Emergency Landing Fiesta', start: 32200, end: 33600, src: 'assets/world1_2_env_landing_v1.webp', clouds: .12, birds: 0, thermals: 0, storm: 0, beacons: 1, stars: .72, fiesta: 1 },
    ]),
    '1-3': Object.freeze([
      { id: 'golden-hour-gauntlet', name: 'Golden Hour Gauntlet', start: 0, end: 5600, src: 'assets/world1_3_env_gauntlet_v1.webp', dust: .34, market: .08, parade: 0, storm: 0, victory: 0, stars: 0, lights: .05, fiesta: 0 },
      { id: 'salsa-canyon-stampede', name: 'Salsa Canyon Stampede', start: 5600, end: 11200, src: 'assets/world1_3_env_stampede_v1.webp', dust: 1, market: .06, parade: 0, storm: .08, victory: 0, stars: .04, lights: .06, fiesta: 0 },
      { id: 'mercado-rooftops', name: 'Mercado Rooftops', start: 11200, end: 17400, src: 'assets/world1_3_env_mercado_v1.webp', dust: .16, market: 1, parade: .12, storm: .12, victory: 0, stars: .16, lights: .34, fiesta: .12 },
      { id: 'twilight-parade-boulevard', name: 'Twilight Parade Boulevard', start: 17400, end: 23000, src: 'assets/world1_3_env_parade_v1.webp', dust: .08, market: .52, parade: 1, storm: .34, victory: 0, stars: .5, lights: .86, fiesta: .32 },
      { id: 'midnight-guac-arena', name: 'Midnight Guac Arena', start: 23000, end: 28800, src: 'assets/world1_3_env_guac_arena_v1.webp', dust: .04, market: .08, parade: .08, storm: 1, victory: 0, stars: 1, lights: .48, fiesta: 0 },
      { id: 'rainbow-victory-village', name: 'Rainbow Victory Village', start: 28800, end: 33800, src: 'assets/world1_3_env_victory_v1.webp', dust: .02, market: .42, parade: .36, storm: 0, victory: 1, stars: .82, lights: 1, fiesta: .72 },
      { id: 'world-one-fiesta-plaza', name: 'World 1 Fiesta Plaza', start: 33800, end: 35800, src: 'assets/world1_3_env_fiesta_v1.webp', dust: 0, market: .28, parade: .48, storm: 0, victory: 1, stars: 1, lights: 1, fiesta: 1 },
    ]),
  });

  const FALLBACKS = Object.freeze({
    '1-1': ['#ff876d', '#f8b261', '#8b4560'],
    '1-2': ['#6ccce5', '#ffd89a', '#a85d72'],
    '1-3': ['#f68a62', '#9c456f', '#251c4f'],
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (from, to, mix) => from + (to - from) * mix;
  const smoothstep = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const value = (blend, key) => lerp(blend.from[key] || 0, blend.to[key] || 0, blend.mix);

  function create({ levelId, canvas, ctx, worldWidth, groundY }) {
    const stages = STAGES[levelId];
    if (!stages || !canvas || !ctx) throw new Error(`Unsupported World 1 background configuration: ${levelId}`);

    const constrainedDevice = Number(navigator.deviceMemory || 8) <= 4
      || (navigator.maxTouchPoints > 0 && window.devicePixelRatio >= 2);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const images = new Map();
    const readiness = stages.map((stage) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load World 1 panorama: ${stage.src}`));
      image.src = stage.src;
      images.set(stage.id, image);
    }));
    const ready = Promise.all(readiness);
    let lastQa = {
      activeStage: stages[0].id,
      nextStage: stages[0].id,
      mix: 0,
      assetsReady: false,
    };

    function environmentBlend(worldX) {
      const halfTransition = TRANSITION_WIDTH * .5;
      for (let index = 1; index < stages.length; index += 1) {
        const boundary = stages[index].start;
        if (worldX < boundary - halfTransition || worldX > boundary + halfTransition) continue;
        return {
          from: stages[index - 1],
          to: stages[index],
          mix: smoothstep((worldX - boundary + halfTransition) / TRANSITION_WIDTH),
        };
      }
      const stage = [...stages].reverse().find((candidate) => worldX >= candidate.start) || stages[0];
      return { from: stage, to: stage, mix: 0 };
    }

    function drawFallback() {
      const colors = FALLBACKS[levelId];
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(.62, colors[1]);
      gradient.addColorStop(1, colors[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawPanorama(stage, worldCenter, alpha) {
      const image = images.get(stage.id);
      if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
      const stageProgress = clamp((worldCenter - stage.start) / Math.max(1, stage.end - stage.start), 0, 1);
      const sourceWidth = image.naturalWidth * PANORAMA_CROP;
      const sourceHeight = image.naturalHeight * PANORAMA_CROP;
      const sourceXRange = image.naturalWidth - sourceWidth;
      const sourceXProgress = clamp(.5 + (stageProgress - .5) * .78, 0, 1);
      const sourceX = sourceXRange * sourceXProgress;
      const sourceY = (image.naturalHeight - sourceHeight) * .5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      return true;
    }

    function drawStars(strength, cameraX, seconds, motionScale) {
      if (strength <= .02) return;
      const layers = constrainedDevice ? 2 : 3;
      ctx.save();
      for (let layer = 0; layer < layers; layer += 1) {
        const rate = [.024, .052, .086][layer];
        const spacing = [118, 92, 72][layer];
        const camera = cameraX * rate;
        const first = Math.floor(camera / spacing) - 2;
        const count = Math.ceil(canvas.width / spacing) + 5;
        for (let offset = 0; offset < count; offset += 1) {
          const index = first + offset;
          const x = index * spacing - camera + ((index * 37) % 31);
          const y = 22 + Math.abs((index * 83 + layer * 59) % 285);
          const twinkle = .68 + Math.sin(seconds * motionScale * (1 + layer * .34) + index * .71) * .28;
          ctx.globalAlpha = strength * twinkle * (.42 + layer * .16);
          ctx.fillStyle = index % 7 === 0 ? '#65d8ff' : index % 5 === 0 ? '#ff9fca' : '#fff4bc';
          ctx.beginPath();
          ctx.arc(x, y, 1 + layer * .42 + (Math.abs(index) % 9 === 0 ? .8 : 0), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawCloudWisps(strength, cameraX, seconds, motionScale) {
      if (strength <= .02) return;
      const count = constrainedDevice ? 4 : 7;
      ctx.save();
      for (let index = 0; index < count; index += 1) {
        const spacing = 360;
        const camera = cameraX * (.035 + index % 2 * .012);
        const drift = prefersReducedMotion ? 0 : seconds * motionScale * (2.6 + index % 3);
        const base = Math.floor((camera - drift) / spacing) - 1;
        const x = (base + index) * spacing - camera + drift + (index * 97) % 180;
        const y = 54 + (index * 71) % 176;
        ctx.globalAlpha = strength * (.035 + (index % 3) * .012);
        ctx.fillStyle = index % 2 ? '#fff2d4' : '#ffd3dd';
        ctx.beginPath();
        ctx.ellipse(x, y, 150 + index % 3 * 34, 24 + index % 2 * 9, -.04, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawDust(strength, cameraX, seconds, motionScale) {
      if (strength <= .02) return;
      const count = constrainedDevice ? 14 : 26;
      ctx.save();
      for (let index = 0; index < count; index += 1) {
        const spacing = 71;
        const camera = cameraX * (.28 + index % 3 * .055);
        const drift = prefersReducedMotion ? 0 : seconds * motionScale * (7 + index % 5);
        const first = Math.floor((camera - drift) / spacing) - 2;
        const x = (first + index) * spacing - camera + drift;
        const y = 330 + (index * 43) % 108 + Math.sin(seconds * motionScale + index) * 5;
        ctx.globalAlpha = strength * (.055 + (index % 4) * .012);
        ctx.fillStyle = index % 3 ? '#ffd38e' : '#ff9a7c';
        ctx.beginPath();
        ctx.arc(x, y, 1.6 + index % 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawHorizonLights(strength, cameraX, seconds, motionScale) {
      if (strength <= .02) return;
      ctx.save();
      const camera = cameraX * .33;
      const spacing = 118;
      const first = Math.floor(camera / spacing) - 2;
      const count = Math.ceil(canvas.width / spacing) + 5;
      for (let offset = 0; offset < count; offset += 1) {
        const index = first + offset;
        const x = index * spacing - camera + 38;
        const y = 354 + Math.abs(index * 31) % 70;
        const shimmer = .78 + Math.sin(seconds * motionScale * 1.8 + index) * .22;
        ctx.globalAlpha = strength * shimmer * .62;
        ctx.fillStyle = index % 3 === 0 ? '#65d8ff' : index % 3 === 1 ? '#ffd65a' : '#ff6fae';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 13;
        ctx.beginPath();
        ctx.arc(x, y, 2.1 + strength, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawFiestaSparkles(strength, cameraX, seconds, motionScale) {
      if (strength <= .03) return;
      const count = constrainedDevice ? 7 : 13;
      ctx.save();
      for (let index = 0; index < count; index += 1) {
        const x = ((index * 173 - cameraX * .07) % (canvas.width + 280) + canvas.width + 280) % (canvas.width + 280) - 140;
        const y = 74 + (index * 79) % 270;
        const pulse = .7 + Math.sin(seconds * motionScale * 2.2 + index * .9) * .3;
        ctx.globalAlpha = strength * pulse * .48;
        ctx.strokeStyle = ['#ffd65a', '#65d8ff', '#ff6fae', '#8dff9c'][index % 4];
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBirds(strength, cameraX, seconds, motionScale) {
      if (strength <= .03) return;
      const count = constrainedDevice ? 3 : 6;
      ctx.save();
      ctx.strokeStyle = '#573c50';
      ctx.lineWidth = 1.4;
      for (let index = 0; index < count; index += 1) {
        const drift = prefersReducedMotion ? 0 : seconds * motionScale * (4 + index);
        const x = ((index * 223 - cameraX * .09 + drift) % (canvas.width + 220) + canvas.width + 220) % (canvas.width + 220) - 110;
        const y = 82 + (index * 47) % 130;
        const flap = Math.sin(seconds * motionScale * 3 + index) * 3;
        ctx.globalAlpha = strength * .44;
        ctx.beginPath();
        ctx.moveTo(x - 9, y + flap); ctx.quadraticCurveTo(x - 4, y - 5, x, y);
        ctx.quadraticCurveTo(x + 4, y - 5, x + 9, y - flap);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawThermals(strength, cameraX, seconds, motionScale) {
      if (strength <= .03) return;
      const count = constrainedDevice ? 2 : 4;
      ctx.save();
      ctx.lineWidth = 1.5;
      for (let index = 0; index < count; index += 1) {
        const x = 130 + ((index * 271 - cameraX * .16) % (canvas.width + 260) + canvas.width + 260) % (canvas.width + 260) - 130;
        const rise = prefersReducedMotion ? 0 : (seconds * motionScale * (12 + index * 3)) % 90;
        ctx.globalAlpha = strength * .12;
        ctx.strokeStyle = index % 2 ? '#fff0bf' : '#ffb67b';
        ctx.beginPath();
        ctx.ellipse(x, 390 - rise, 42 + index * 8, 14 + index * 3, 0, 0, Math.PI * 1.7);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawLandingBeacons(strength, cameraX, seconds, motionScale) {
      if (strength <= .03) return;
      ctx.save();
      const camera = cameraX * .8;
      const spacing = 145;
      const first = Math.floor(camera / spacing) - 1;
      const count = Math.ceil(canvas.width / spacing) + 4;
      for (let offset = 0; offset < count; offset += 1) {
        const index = first + offset;
        const x = index * spacing - camera;
        const pulse = .7 + Math.sin(seconds * motionScale * 3.1 + index * .8) * .3;
        ctx.globalAlpha = strength * pulse * .62;
        ctx.fillStyle = index % 2 ? '#65d8ff' : '#ffd65a';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, groundY - 46, 4, 18);
        ctx.beginPath(); ctx.arc(x + 2, groundY - 50, 3.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function drawStorm(strength, bossHits, bossDefeated) {
      if (strength <= .02 || bossDefeated) return;
      const damage = clamp(bossHits / 3, 0, 1);
      const remaining = strength * (1 - damage * .66);
      const wash = ctx.createLinearGradient(0, 0, 0, groundY);
      wash.addColorStop(0, `rgba(46,27,78,${(remaining * .16).toFixed(3)})`);
      wash.addColorStop(.55, `rgba(75,112,64,${(remaining * .08).toFixed(3)})`);
      wash.addColorStop(1, 'rgba(25,18,48,0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, canvas.width, groundY);
    }

    function drawPapelFlags(strength, cameraX, seconds, motionScale) {
      if (strength <= .03) return;
      ctx.save();
      const y = 176;
      const sway = Math.sin(seconds * motionScale * 1.25) * 4;
      ctx.globalAlpha = strength * .46;
      ctx.strokeStyle = '#ffeaa4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 34) ctx.lineTo(x, y + Math.sin((x + cameraX * .1) * .018) * 12);
      ctx.stroke();
      for (let x = -20; x < canvas.width + 30; x += 52) {
        const index = Math.floor((x + cameraX * .1) / 52);
        const flagY = y + Math.sin((x + cameraX * .1) * .018) * 12;
        ctx.fillStyle = ['#ff6fae', '#65d8ff', '#ffd65a', '#8dff9c'][Math.abs(index) % 4];
        ctx.beginPath();
        ctx.moveTo(x, flagY); ctx.lineTo(x + 18, flagY + 7 + sway * .2); ctx.lineTo(x + 7, flagY + 25 + sway); ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawBossSpotlights(strength, bossHits, bossDefeated) {
      if (strength <= .04 || bossDefeated) return;
      const remaining = strength * (1 - clamp(bossHits / 3, 0, 1) * .34);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const beams = [
        [80, '#8dff9c', canvas.width * .42],
        [canvas.width - 80, '#b78cff', canvas.width * .58],
      ];
      for (const [baseX, color, topX] of beams) {
        const gradient = ctx.createLinearGradient(baseX, groundY, topX, 70);
        gradient.addColorStop(0, `${color}${Math.round(remaining * 55).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(baseX - 46, groundY); ctx.lineTo(topX - 10, 58); ctx.lineTo(topX + 10, 58); ctx.lineTo(baseX + 46, groundY); ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawVictoryWave(strength, seconds, motionScale) {
      if (strength <= .03) return;
      ctx.save();
      ctx.globalAlpha = strength * .25;
      ctx.strokeStyle = '#ffd65a';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#65d8ff';
      ctx.shadowBlur = 18;
      const phase = prefersReducedMotion ? 0 : seconds * motionScale * .18;
      for (let band = 0; band < 3; band += 1) {
        ctx.beginPath();
        ctx.arc(canvas.width * .5, groundY + 80, 270 + band * 62 + Math.sin(phase + band) * 8, Math.PI * 1.08, Math.PI * 1.92);
        ctx.strokeStyle = ['#ffd65a', '#65d8ff', '#ff6fae'][band];
        ctx.stroke();
      }
      ctx.restore();
    }

    function draw(options = {}) {
      const cameraX = Number(options.cameraX || 0);
      const playerX = Number(options.playerX ?? cameraX + canvas.width * .42);
      const seconds = Number(options.time || 0);
      const motionScale = constrainedDevice || prefersReducedMotion || options.reducedMotion ? .42 : 1;
      const worldCenter = clamp(cameraX + canvas.width * .5, 0, worldWidth);
      const blend = environmentBlend(worldCenter);
      const fromAlpha = blend.to === blend.from ? 1 : 1 - blend.mix;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      drawFallback();
      drawPanorama(blend.from, worldCenter, fromAlpha);
      if (blend.to !== blend.from && blend.mix > 0) drawPanorama(blend.to, worldCenter, blend.mix);

      drawCloudWisps(value(blend, 'clouds'), cameraX, seconds, motionScale);
      drawStars(value(blend, 'stars'), cameraX, seconds, motionScale);
      drawDust(value(blend, 'dust'), cameraX, seconds, motionScale);
      drawHorizonLights(value(blend, 'lights'), cameraX, seconds, motionScale);
      drawFiestaSparkles(value(blend, 'fiesta'), cameraX, seconds, motionScale);

      if (levelId === '1-2') {
        drawBirds(value(blend, 'birds'), cameraX, seconds, motionScale);
        drawThermals(value(blend, 'thermals'), cameraX, seconds, motionScale);
        drawStorm(value(blend, 'storm'), 0, Boolean(options.crashLanded));
        drawLandingBeacons(value(blend, 'beacons'), cameraX, seconds, motionScale);
      } else if (levelId === '1-3') {
        drawPapelFlags(Math.max(value(blend, 'market'), value(blend, 'parade')), cameraX, seconds, motionScale);
        const storm = value(blend, 'storm');
        drawStorm(storm, Number(options.bossHits || 0), Boolean(options.bossDefeated));
        drawBossSpotlights(storm, Number(options.bossHits || 0), Boolean(options.bossDefeated));
        drawVictoryWave(value(blend, 'victory'), seconds, motionScale);
      }
      ctx.restore();

      lastQa = {
        activeStage: blend.from.id,
        activeStageName: blend.from.name,
        nextStage: blend.to.id,
        nextStageName: blend.to.name,
        mix: Number(blend.mix.toFixed(3)),
        worldCenter: Math.round(worldCenter),
        playerX: Math.round(playerX),
        assetsReady: stages.every((stage) => images.get(stage.id)?.complete && images.get(stage.id)?.naturalWidth),
      };
    }

    function qaState() {
      return {
        ...lastQa,
        mode: 'world3-grade-preloaded-seamless-parallax',
        levelId,
        panoramaCount: stages.length,
        transitionWidth: TRANSITION_WIDTH,
        noTiling: true,
        subpixelMotion: true,
        constrainedEffects: constrainedDevice || prefersReducedMotion,
      };
    }

    return { ready, draw, qaState, stages };
  }

  window.JFT_WORLD1_BACKGROUNDS = Object.freeze({
    version: 1,
    transitionWidth: TRANSITION_WIDTH,
    stages: STAGES,
    create,
  });
})();
