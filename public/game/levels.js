(() => {
  const coreAbilities = Object.freeze([
    'Taco Meter',
    'Taco Frenzy',
    'Taco Magnet',
  ]);
  // One movement contract for every Taco Hero level. New level runtimes load
  // this catalog first, so they inherit the same jump, stomp, bounce and
  // respawn feel instead of inventing slightly different physics.
  const heroPhysics = Object.freeze({
    gravity: 1800,
    jumpVelocity: 680,
    maxFallVelocity: 900,
    coyoteTime: 0.14,
    jumpBufferTime: 0.14,
    enemyBounceVelocity: 720,
    // Sprite-sheet animation has its own visual clock. Each idle pose is held
    // for roughly 0.56 seconds, giving the four-pose walk cycle a calm
    // approximately 2.2-second loop. Keep it separate from behaviorClock so
    // movement tuning cannot make the artwork look like it is running fast.
    enemyVisualAnimationRate: 1.8,
    stompMinVelocity: -90,
    stompTopTolerance: 42,
    stompCrossingAllowance: 28,
    stompMovingTargetAllowance: 10,
    stompHorizontalInset: 5,
    stompComboWindow: 2.6,
    normalJumpRise: Math.round((680 * 680) / (2 * 1800)),
    enemyBounceRise: Math.round((720 * 720) / (2 * 1800)),
  });
  // Ordinary enemies share one deliberately generous top-contact contract.
  // Values scale with each collider so small enemies are not harder to land on,
  // while the caps keep side/body contact from becoming an automatic stomp.
  const ordinaryStompStandard = Object.freeze({
    version: 'ordinary-stomp-v1',
    topInsetRatio: 0.12,
    topInsetMin: 4,
    topInsetMax: 6,
    topRegionRatio: 0.6,
    topRegionMin: 22,
    topRegionMax: 34,
    routeTopRegionRatio: 0.86,
    routeTopRegionMax: 54,
    horizontalGraceRatio: 0.2,
    horizontalGraceMin: 8,
    horizontalGraceMax: 12,
    playerFootInsetRatio: 0.1,
    minimumOverlapRatio: 0.18,
    minimumOverlapMin: 6,
    minimumOverlapMax: 10,
    surfaceGrace: 8,
    minimumVelocity: 0,
  });
  const splatCaptions = Object.freeze(['SPLAT!', 'GUAC’D!', 'EXTRA SAUCED!', 'NO CRUMBS!', 'TACO’D!']);
  const splatColors = Object.freeze(['#ffd166', '#65d8ff', '#ff67ad', '#fff1a6', '#63d878']);
  const enemyPlacementRoles = Object.freeze({
    'ground-patrol': Object.freeze({
      id: 'ground-patrol',
      label: 'Ground Patrol',
      purpose: 'Keep the safe lower route active without blocking it.',
      ability: 'readable-pattern',
      traits: Object.freeze(['route-pressure']),
      telegraph: Object.freeze({ label: 'WATCH', color: '#ffd65a', accent: '#ff9f5a' }),
      reward: Object.freeze({ score: 180, tacoCount: 1, meter: 14, power: null, bonusItem: 'taco', tier: 'standard', message: 'TACO BURST' }),
    }),
    'platform-sentry': Object.freeze({
      id: 'platform-sentry',
      label: 'Platform Sentry',
      purpose: 'Make an elevated route worth the extra timing and landing risk.',
      ability: 'high-route-guard',
      traits: Object.freeze(['upper-route', 'platform-bound']),
      telegraph: Object.freeze({ label: 'SENTRY', color: '#65d8ff', accent: '#c69cff' }),
      reward: Object.freeze({ score: 320, tacoCount: 2, meter: 18, power: 'magnet-pulse', bonusItem: 'magnet', tier: 'elevated', message: 'TACO PAYDAY' }),
    }),
    'route-helper': Object.freeze({
      id: 'route-helper',
      label: 'Bounce Helper',
      purpose: 'Teach a safe enemy-bounce route to a visible reward or platform.',
      ability: 'safe-bounce-route',
      traits: Object.freeze(['bounce-route', 'forgiving-stomp']),
      telegraph: Object.freeze({ label: 'BOUNCE', color: '#9bef70', accent: '#65d8ff' }),
      reward: Object.freeze({ score: 420, tacoCount: 3, meter: 22, power: 'bounce-boost', bonusItem: 'pepper', tier: 'route', message: 'BOUNCE ROUTE UNLOCKED' }),
    }),
    'moving-guard': Object.freeze({
      id: 'moving-guard',
      label: 'Moving Guard',
      purpose: 'Turn platform timing into a readable, optional challenge.',
      ability: 'platform-drift',
      traits: Object.freeze(['moving-platform', 'timing-test']),
      telegraph: Object.freeze({ label: 'TIMING', color: '#ffcf5a', accent: '#ff68b4' }),
      reward: Object.freeze({ score: 560, tacoCount: 4, meter: 26, power: 'shield-spark', bonusItem: 'golden', tier: 'moving', message: 'MOVING-ROUTE PAYDAY' }),
    }),
    champion: Object.freeze({
      id: 'champion',
      label: 'Champion',
      purpose: 'Create a deliberate set-piece encounter with a premium payoff.',
      ability: 'champion-pattern',
      traits: Object.freeze(['set-piece', 'premium-reward']),
      telegraph: Object.freeze({ label: 'CHAMPION', color: '#ff67ad', accent: '#ffd65a' }),
      reward: Object.freeze({ score: 900, tacoCount: 6, meter: 36, power: 'rainbow-burst', bonusItem: 'rainbow', tier: 'premium', message: 'CHAMPION TACO JACKPOT' }),
    }),
  });
  const enemyTraitProfiles = Object.freeze({
    'route-pressure': Object.freeze({ id: 'route-pressure', label: 'Route Pressure', purpose: 'Keeps the lower route active.' }),
    'upper-route': Object.freeze({ id: 'upper-route', label: 'Upper Route', purpose: 'Guards a higher-risk reward lane.' }),
    'platform-bound': Object.freeze({ id: 'platform-bound', label: 'Platform Bound', purpose: 'Moves with its support platform.' }),
    'bounce-route': Object.freeze({ id: 'bounce-route', label: 'Bounce Route', purpose: 'Can be used as a controlled launch.' }),
    'forgiving-stomp': Object.freeze({ id: 'forgiving-stomp', label: 'Forgiving Stomp', purpose: 'Uses a generous stomp window.' }),
    'moving-platform': Object.freeze({ id: 'moving-platform', label: 'Moving Platform', purpose: 'Inherits platform drift.' }),
    'timing-test': Object.freeze({ id: 'timing-test', label: 'Timing Test', purpose: 'Rewards waiting for a clean opening.' }),
    'set-piece': Object.freeze({ id: 'set-piece', label: 'Set Piece', purpose: 'Belongs to a deliberate encounter.' }),
    'premium-reward': Object.freeze({ id: 'premium-reward', label: 'Premium Reward', purpose: 'Pays out a high-value taco reward.' }),
    charge: Object.freeze({ id: 'charge', label: 'Charge', purpose: 'Builds speed after a readable wind-up.' }),
    roll: Object.freeze({ id: 'roll', label: 'Roll', purpose: 'Crosses the lane as a low moving hazard.' }),
    hop: Object.freeze({ id: 'hop', label: 'Hop', purpose: 'Creates a short vertical timing test.' }),
    leap: Object.freeze({ id: 'leap', label: 'Leap', purpose: 'Threatens a larger vertical space.' }),
    'tear-zone': Object.freeze({ id: 'tear-zone', label: 'Tear Zone', purpose: 'Adds a light projectile-style pressure cue.' }),
    'edge-safe': Object.freeze({ id: 'edge-safe', label: 'Edge Safe', purpose: 'Keeps its patrol inside a usable landing area.' }),
  });
  const enemyTypeProfiles = Object.freeze({
    chili: Object.freeze({
      id: 'chili', label: 'Chili Bandit', behaviorType: 'chili',
      traits: Object.freeze(['charge', 'edge-safe']),
      telegraph: Object.freeze({ kind: 'charge', label: 'CHARGE!', color: '#ff5f91', accent: '#ff4b45' }),
      reward: Object.freeze({ flavor: 'Hot Stomp' }),
    }),
    tomato: Object.freeze({
      id: 'tomato', label: 'Tomato Trouble', behaviorType: 'tomato',
      traits: Object.freeze(['roll', 'edge-safe']),
      telegraph: Object.freeze({ kind: 'roll', label: 'ROLL!', color: '#65d8ff', accent: '#ff5f91' }),
      reward: Object.freeze({ flavor: 'Rolling Crunch' }),
    }),
    onion: Object.freeze({
      id: 'onion', label: 'Onion Drama', behaviorType: 'onion',
      traits: Object.freeze(['hop', 'tear-zone']),
      telegraph: Object.freeze({ kind: 'hop', label: 'HOP!', color: '#fff1a6', accent: '#65d8ff' }),
      reward: Object.freeze({ flavor: 'Tearful Payday' }),
    }),
    jalapeno: Object.freeze({
      id: 'jalapeno', label: 'Jalapeño Popper', behaviorType: 'jalapeno',
      traits: Object.freeze(['leap', 'edge-safe']),
      telegraph: Object.freeze({ kind: 'leap', label: 'LEAP!', color: '#9bef70', accent: '#ff67ad' }),
      reward: Object.freeze({ flavor: 'Spicy Launch' }),
    }),
    lime: Object.freeze({ aliasOf: 'tomato', id: 'lime', label: 'Lime Flyer', traits: Object.freeze(['lime-skin']) }),
    queso: Object.freeze({ aliasOf: 'onion', id: 'queso', label: 'Queso Drip', traits: Object.freeze(['queso-skin']) }),
    slime: Object.freeze({ aliasOf: 'onion', id: 'slime', label: 'Salsa Slime', traits: Object.freeze(['slime-skin']) }),
    knight: Object.freeze({ aliasOf: 'chili', id: 'knight', label: 'Salsa Knight', traits: Object.freeze(['armored-skin']) }),
    guac: Object.freeze({ aliasOf: 'tomato', id: 'guac', label: 'Guac Roller', traits: Object.freeze(['boss-adjacent']) }),
    churro: Object.freeze({ aliasOf: 'onion', id: 'churro', label: 'Churro Spring', traits: Object.freeze(['spring-skin']) }),
    mole: Object.freeze({ aliasOf: 'onion', id: 'mole', label: 'Mole Hopper', traits: Object.freeze(['burrow-skin']) }),
    crab: Object.freeze({ aliasOf: 'chili', id: 'crab', label: 'Crab Snapper', traits: Object.freeze(['shoreline-skin']) }),
    seagull: Object.freeze({ aliasOf: 'onion', id: 'seagull', label: 'Seagull Swoop', traits: Object.freeze(['airborne-skin']) }),
    puffer: Object.freeze({ aliasOf: 'jalapeno', id: 'puffer', label: 'Puffer Pop', traits: Object.freeze(['water-skin']) }),
    coconut: Object.freeze({ aliasOf: 'tomato', id: 'coconut', label: 'Coconut Roll', traits: Object.freeze(['island-skin']) }),
    tiki: Object.freeze({ aliasOf: 'jalapeno', id: 'tiki', label: 'Tiki Hop', traits: Object.freeze(['island-skin']) }),
    marshmallow: Object.freeze({ aliasOf: 'onion', id: 'marshmallow', label: 'Marshmallow Puff', traits: Object.freeze(['soft-skin']) }),
    pepper: Object.freeze({ aliasOf: 'jalapeno', id: 'pepper', label: 'Pepper Burst', traits: Object.freeze(['caldera-skin']) }),
    nacho: Object.freeze({ aliasOf: 'tomato', id: 'nacho', label: 'Nacho Slide', traits: Object.freeze(['caldera-skin']) }),
    berry: Object.freeze({ aliasOf: 'tomato', id: 'berry', label: 'Berry Bouncer', traits: Object.freeze(['carnival-skin']) }),
    mango: Object.freeze({ aliasOf: 'jalapeno', id: 'mango', label: 'Mango Jumper', traits: Object.freeze(['carnival-skin']) }),
    spaghetti: Object.freeze({ aliasOf: 'onion', id: 'spaghetti', label: 'Spaghetti Swing', traits: Object.freeze(['carnival-skin']) }),
    pineapple: Object.freeze({ aliasOf: 'chili', id: 'pineapple', label: 'Pineapple Charge', traits: Object.freeze(['caldera-skin', 'carnival-skin']) }),
    popcorn: Object.freeze({ aliasOf: 'tomato', id: 'popcorn', label: 'Popcorn Roller', traits: Object.freeze(['carnival-skin']) }),
    cotton: Object.freeze({ aliasOf: 'onion', id: 'cotton', label: 'Cotton Candy Hop', traits: Object.freeze(['carnival-skin']) }),
    pretzel: Object.freeze({ aliasOf: 'chili', id: 'pretzel', label: 'Pretzel Charger', traits: Object.freeze(['carnival-skin']) }),
    lemon: Object.freeze({ aliasOf: 'jalapeno', id: 'lemon', label: 'Lemon Leaper', traits: Object.freeze(['carnival-skin']) }),
    bumper: Object.freeze({ aliasOf: 'tomato', id: 'bumper', label: 'Bumper Roller', traits: Object.freeze(['carnival-skin']) }),
    corndog: Object.freeze({ aliasOf: 'chili', id: 'corndog', label: 'Corn Dog Charger', traits: Object.freeze(['carnival-skin']) }),
  });
  const coreHeroSystems = Object.freeze([
    'Shared Taco Hero jump physics',
    'Shared enemy stomp and bounce timing',
    'Shared telegraphed enemy behavior archetypes',
    'Shared splat callout vocabulary',
    'Shared double-splat and five-splat celebrations',
    'Shared golden-beam respawn animation',
    'Shared platform-anchored enemy movement and patrol bounds',
    'Shared enemy roles, traits, telegraph profiles, and taco rewards',
  ]);
  const coreLevelSystems = Object.freeze([
    'Shared touch-ready themed start screen',
    'Shared controller support',
    'Shared abilities and hero movement',
    'Shared enemy behavior and combo reward language',
    'Shared platform-enemy attachment and motion sync',
    'Shared enemy metadata preparation for every level runtime',
  ]);

  const stompComboTiers = Object.freeze([
    Object.freeze({ threshold: 1, label: 'PERFECT!', shortLabel: 'PERFECT', tier: 'stomp' }),
    Object.freeze({ threshold: 2, label: 'DOUBLE SPLAT!', shortLabel: 'DOUBLE SPLAT', tier: 'double' }),
    Object.freeze({ threshold: 3, label: 'TRIPLE SPLAT!', shortLabel: 'TRIPLE SPLAT', tier: 'triple' }),
    Object.freeze({ threshold: 5, label: 'RAINBOW RAMPAGE!', shortLabel: 'RAINBOW RAMPAGE', tier: 'rainbow' }),
    Object.freeze({ threshold: 8, label: 'SALSA SUPREMACY!', shortLabel: 'SALSA SUPREMACY', tier: 'supremacy' }),
  ]);

  function getStompComboTier(combo = 1) {
    const safeCombo = Math.max(1, Math.floor(combo || 1));
    return stompComboTiers
      .filter((tier) => safeCombo >= tier.threshold)
      .at(-1) || stompComboTiers[0];
  }

  function stompComboReward(combo = 1) {
    const tier = getStompComboTier(combo);
    const safeCombo = Math.max(1, Math.floor(combo || 1));
    const exactThreshold = safeCombo === tier.threshold;
    return Object.freeze({
      ...tier,
      combo: safeCombo,
      exactThreshold,
      bonus: tier.tier === 'supremacy'
        ? 'taco-frenzy'
        : tier.tier === 'rainbow'
          ? 'rainbow'
          : tier.tier === 'triple'
            ? 'golden'
            : null,
      message: tier.tier === 'supremacy'
        ? 'SALSA SUPREMACY! TACO FRENZY!'
        : tier.tier === 'rainbow'
          ? 'RAINBOW RAMPAGE! TACO MAGNET!'
          : tier.tier === 'triple'
            ? 'TRIPLE SPLAT! BONUS GOLDEN TACO!'
            : tier.label,
    });
  }

  function splatFeedback(combo = 1, stomped = true) {
    const safeCombo = Math.max(1, Math.floor(combo || 1));
    const index = (safeCombo - 1) % splatCaptions.length;
    const comboTier = stomped ? stompComboReward(safeCombo) : null;
    const caption = comboTier?.label || splatCaptions[index];
    return Object.freeze({
      caption,
      text: stomped && safeCombo > 1 ? `${caption} ×${safeCombo}` : caption,
      color: stomped ? (splatColors[(safeCombo - 1) % splatColors.length]) : splatColors[index],
      size: stomped && comboTier?.tier === 'supremacy'
        ? 44
        : stomped && comboTier?.tier === 'rainbow'
          ? 40
          : 27 + Math.min(12, safeCombo * 2),
    });
  }

  const enemyBehaviorProfiles = Object.freeze({
    chili: Object.freeze({ cycle: 3.25, windup: 0.42, actionEnd: 1.18, action: 'charge', speed: 2.35, telegraph: 'charge' }),
    tomato: Object.freeze({ cycle: 2.75, windup: 0.28, actionEnd: 1.08, action: 'roll', speed: 1.85, telegraph: 'roll' }),
    onion: Object.freeze({ cycle: 2.25, windup: 0.25, actionEnd: 1.2, action: 'hop', jump: 42, telegraph: 'hop' }),
    jalapeno: Object.freeze({ cycle: 2.45, windup: 0.34, actionEnd: 1.34, action: 'jump', jump: 82, speed: 1.2, telegraph: 'leap' }),
  });

  function inferEnemyPlacementRole(enemy, platform = enemy?.platform) {
    if (enemy?.role && enemy.roleExplicit !== false && enemyPlacementRoles[enemy.role]) return enemy.role;
    if (enemy?.champion || enemy?.boss) return 'champion';
    if (enemy?.bounceHelper || enemy?.comboHelper || enemy?.routeHelper) return 'route-helper';
    if (platform?.moving) return 'moving-guard';
    if (platform && !platform.ground) return 'platform-sentry';
    return 'ground-patrol';
  }

  function getEnemyPlacementRole(enemy) {
    return inferEnemyPlacementRole(enemy, enemy?.platform);
  }

  function uniqueStrings(values) {
    return [...new Set((values || []).filter((value) => typeof value === 'string' && value.length > 0))];
  }

  function getEnemyTypeProfile(enemy) {
    const typeKey = enemy?.type || enemy?.behaviorType || 'tomato';
    const direct = enemyTypeProfiles[typeKey] || enemyTypeProfiles[enemy?.behaviorType] || enemyTypeProfiles.tomato;
    if (!direct.aliasOf) return direct;
    const base = enemyTypeProfiles[direct.aliasOf] || enemyTypeProfiles.tomato;
    return Object.freeze({
      ...base,
      ...direct,
      behaviorType: direct.behaviorType || base.behaviorType,
      traits: Object.freeze(uniqueStrings([...(base.traits || []), ...(direct.traits || [])])),
      telegraph: Object.freeze({ ...(base.telegraph || {}), ...(direct.telegraph || {}) }),
      reward: Object.freeze({ ...(base.reward || {}), ...(direct.reward || {}) }),
    });
  }

  function getEnemyProfile(enemy) {
    const role = getEnemyPlacementRole(enemy);
    const roleDefinition = enemyPlacementRoles[role] || enemyPlacementRoles['ground-patrol'];
    const typeDefinition = getEnemyTypeProfile(enemy);
    const behaviorType = enemy?.behaviorType || typeDefinition.behaviorType || 'tomato';
    const behaviorDefinition = enemyBehaviorProfiles[behaviorType] || enemyBehaviorProfiles.tomato;
    const customTraits = enemy?.customTraits || enemy?.traits || [];
    const traits = uniqueStrings([
      ...(roleDefinition.traits || []),
      ...(typeDefinition.traits || []),
      ...(enemy?.platform ? ['platform-bound'] : []),
      ...(enemy?.platform?.moving ? ['moving-platform'] : []),
      ...customTraits,
    ]);
    const typeTelegraph = typeDefinition.telegraph || {};
    const roleTelegraph = roleDefinition.telegraph || {};
    const telegraph = Object.freeze({
      kind: typeTelegraph.kind || behaviorDefinition.telegraph || 'pattern',
      label: typeTelegraph.label || roleTelegraph.label || 'WATCH',
      color: typeTelegraph.color || roleTelegraph.color || '#ffd65a',
      accent: typeTelegraph.accent || roleTelegraph.accent || '#ff9f5a',
      roleLabel: roleTelegraph.label || roleDefinition.label,
      roleColor: roleTelegraph.color || roleDefinition.telegraph?.color || '#ffd65a',
      lead: Number.isFinite(enemy?.telegraphLead) ? enemy.telegraphLead : behaviorDefinition.windup,
    });
    const reward = Object.freeze({
      ...roleDefinition.reward,
      ...(typeDefinition.reward || {}),
      role,
      enemyType: typeDefinition.id,
    });
    return Object.freeze({
      type: typeDefinition.id,
      name: typeDefinition.label,
      behaviorType,
      role,
      roleLabel: roleDefinition.label,
      purpose: roleDefinition.purpose,
      ability: roleDefinition.ability,
      traits: Object.freeze(traits),
      telegraph,
      reward,
      ...reward,
    });
  }

  function getEnemyRewardProfile(enemy) {
    const profile = getEnemyProfile(enemy);
    return Object.freeze({
      ...profile.reward,
      role: profile.role,
      label: profile.roleLabel,
      ability: profile.ability,
      enemyType: profile.type,
      traits: profile.traits,
      telegraph: profile.telegraph,
    });
  }

  // Author enemies as formations rather than as a long string of unrelated
  // singletons. Same-type groups make each behavior readable at a glance and
  // give Taco Hero a deliberate target sequence for stomp chains.
  function createEnemyFormation(definition = {}) {
    const count = Math.max(1, Math.floor(Number(definition.count) || 1));
    const width = Number(definition.w) || 36;
    const height = Number(definition.h) || 38;
    const startX = Number(definition.startX ?? definition.x) || 0;
    const startY = Number(definition.y) || 0;
    const spacing = Math.max(width + 4, Number(definition.spacing) || width + 14);
    const patrolPadding = Math.max(0, Number(definition.patrolPadding ?? 18));
    const minimumGap = Math.max(4, Number(definition.minimumGap ?? 8));
    const maximumDrift = Math.max(0, (spacing - width - minimumGap) * 0.5);
    const formationDrift = Math.min(
      maximumDrift,
      Math.max(0, Number(definition.formationDrift ?? patrolPadding)),
    );
    const groupId = definition.groupId || definition.id || `${definition.type || 'enemy'}-formation`;
    const base = { ...definition };
    delete base.count;
    delete base.startX;
    delete base.x;
    delete base.y;
    delete base.w;
    delete base.h;
    delete base.spacing;
    delete base.patrolPadding;
    delete base.minimumGap;
    delete base.formationDrift;
    delete base.groupId;
    delete base.id;

    return Array.from({ length: count }, (_, index) => ({
      ...base,
      id: base.id || `${groupId}-${index + 1}`,
      x: startX + index * spacing,
      y: startY,
      w: width,
      h: height,
      // Give each member its own lane. A shared patrol rectangle lets a
      // formation collapse into a pile after a few behavior cycles, even when
      // the authored starting positions were cleanly separated.
      minX: Number.isFinite(definition.minX)
        ? definition.minX + index * spacing
        : startX + index * spacing - formationDrift,
      maxX: Number.isFinite(definition.maxX)
        ? definition.maxX + index * spacing
        : startX + index * spacing + formationDrift,
      alive: definition.alive !== false,
      anim: Number(definition.anim) || 0,
      groupId,
      groupIndex: index,
      groupSize: count,
      formationType: definition.formationType || 'same-type-pack',
      formationPurpose: definition.formationPurpose || 'Create a readable same-type stomp sequence.',
      formationSpacing: spacing,
    }));
  }

  // Give authored formations a visible patrol lane after their support
  // platforms are known. The original formation math limited each member to
  // the unused gap between neighboring hitboxes, which left common 52-pixel
  // packs with only about four pixels of travel. That made the sprite walk
  // cycle look active while the enemy appeared stuck at its spawn point.
  // Members still receive separate lanes, but the lanes are sized from the
  // platform so they can roam without ever overlapping.
  function retuneEnemyFormationPatrols(enemies, options = {}) {
    const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));
    const desiredDrift = Math.max(0, Number(options.desiredDrift ?? 18));
    const fullPlatformCoverage = options.fullPlatformCoverage !== false;
    const minimumGap = Math.max(2, Number(options.minimumGap ?? 8));
    const edgePadding = Math.max(0, Number(options.edgePadding ?? 12));
    const grouped = new Map();
    const sourceEnemies = Array.isArray(enemies) ? enemies : [];

    sourceEnemies.forEach((enemy) => {
      if (!enemy || enemy.boss) return;
      const groupId = enemy.groupId || enemy.id;
      if (!groupId) return;
      if (!grouped.has(groupId)) grouped.set(groupId, []);
      grouped.get(groupId).push(enemy);
    });

    const stats = {
      formations: 0,
      enemies: 0,
      expanded: 0,
      constrained: 0,
      minSpan: Infinity,
      maxSpan: 0,
      totalSpan: 0,
    };

    for (const members of grouped.values()) {
      const ordered = [...members].sort((a, b) => (
        (Number(a.groupIndex) || 0) - (Number(b.groupIndex) || 0)
        || (Number(a.x) || 0) - (Number(b.x) || 0)
      ));
      const anchor = ordered[0];
      const platform = ordered.find((enemy) => enemy.platform)?.platform || null;
      const count = ordered.length;
      const enemyWidth = Math.max(...ordered.map((enemy) => Number(enemy.w) || 36));
      const baseSpacing = Math.max(
        enemyWidth + minimumGap,
        Number(anchor.formationSpacing) || 0,
      );
      const requestedSpacing = Math.max(
        baseSpacing,
        enemyWidth + minimumGap + desiredDrift * 2,
      );
      let spacing = requestedSpacing;
      let platformLeft = null;
      let platformRight = null;
      let groupDrift = desiredDrift;
      let platformLaneSpan = null;

      if (platform && Number.isFinite(platform.x) && Number.isFinite(platform.w)) {
        platformRight = platform.x + platform.w - enemyWidth - edgePadding;
        const platformEdgeLeft = platform.x + edgePadding;
        const requestedStartOffset = Number(anchor.patrolStartOffset);
        const patrolStartOffset = Number.isFinite(requestedStartOffset)
          ? Math.max(edgePadding, requestedStartOffset)
          : edgePadding;
        platformLeft = clampValue(
          platform.x + patrolStartOffset,
          platformEdgeLeft,
          platformRight,
        );
        const availableStartSpan = Math.max(0, platformRight - platformLeft);
        const minimumSpacing = enemyWidth + minimumGap;
        if (fullPlatformCoverage) {
          // A single guard owns the whole usable surface. A pack gets a
          // contiguous lane apiece, with the required gap between hitboxes;
          // together those lanes cover the platform without ever overlapping.
          platformLaneSpan = count === 1
            ? availableStartSpan
            : Math.max(0, (availableStartSpan - (count - 1) * minimumSpacing) / count);
          spacing = count === 1
            ? baseSpacing
            : minimumSpacing + platformLaneSpan;
          groupDrift = platformLaneSpan;
        } else if (count > 1) {
          const maximumDrift = Math.max(
            0,
            (availableStartSpan - (count - 1) * minimumSpacing) / (2 * count),
          );
          groupDrift = Math.min(desiredDrift, maximumDrift);
          const spacingFloor = minimumSpacing + groupDrift * 2;
          const maximumSpacing = Math.max(
            minimumSpacing,
            (availableStartSpan - groupDrift * 2) / (count - 1),
          );
          spacing = Math.min(Math.max(baseSpacing, spacingFloor), maximumSpacing);
          groupDrift = Math.min(groupDrift, Math.max(0, (spacing - minimumSpacing) * 0.5));
        }
      }

      const usableSpacing = Math.max(enemyWidth + minimumGap, spacing);
      if (count === 1 && platformLeft != null) {
        groupDrift = Math.min(desiredDrift, Math.max(0, (platformRight - platformLeft) * 0.5));
      } else if (count > 1 && platformLeft == null) {
        groupDrift = Math.min(desiredDrift, Math.max(0, (usableSpacing - enemyWidth - minimumGap) * 0.5));
      }
      const originalStartX = Number(anchor.x) || 0;
      const groupStartX = platformLeft == null
        ? originalStartX
        : clampValue(
          originalStartX,
          platformLeft + groupDrift,
          Math.max(
            platformLeft + groupDrift,
            platformRight - (count - 1) * usableSpacing - groupDrift,
          ),
        );

      if (count > 1) stats.formations += 1;
      if (groupDrift > 0) stats.expanded += 1;
      if (platform && count > 1 && usableSpacing < requestedSpacing) stats.constrained += 1;

      ordered.forEach((enemy, index) => {
        let spawnX = groupStartX + index * usableSpacing;
        let minX = spawnX - groupDrift;
        let maxX = spawnX + groupDrift;
        if (platformLeft != null) {
          if (fullPlatformCoverage && platformLaneSpan != null) {
            const laneStart = platformLeft + index * (platformLaneSpan + enemyWidth + minimumGap);
            const laneEnd = Math.min(platformRight, laneStart + platformLaneSpan);
            const authoredX = Number(enemy.x);
            minX = laneStart;
            maxX = laneEnd;
            spawnX = clampValue(Number.isFinite(authoredX) ? authoredX : laneStart, minX, maxX);
          } else {
            minX = clampValue(minX, platformLeft, platformRight);
            maxX = clampValue(maxX, platformLeft, platformRight);
          }
        }
        enemy.x = spawnX;
        enemy.minX = Math.min(minX, maxX);
        enemy.maxX = Math.max(minX, maxX);
        enemy.formationSpacing = usableSpacing;
        enemy.formationDrift = groupDrift;
        enemy.formationPatrolMode = count > 1 ? 'separate-lanes' : 'single-lane';
        enemy.patrolSpan = enemy.maxX - enemy.minX;
        enemy.patrolCoverage = fullPlatformCoverage && platformLeft != null ? 'full-platform' : 'local-lane';
        enemy.patrolSurfaceStart = platformLeft;
        enemy.patrolSurfaceEnd = platformRight;
        stats.enemies += 1;
        stats.minSpan = Math.min(stats.minSpan, enemy.patrolSpan);
        stats.maxSpan = Math.max(stats.maxSpan, enemy.patrolSpan);
        stats.totalSpan += enemy.patrolSpan;
      });
    }

    return Object.freeze({
      formations: stats.formations,
      enemies: stats.enemies,
      expanded: stats.expanded,
      constrained: stats.constrained,
      minSpan: stats.enemies ? Number(stats.minSpan.toFixed(2)) : 0,
      maxSpan: stats.maxSpan,
      averageSpan: stats.enemies ? Number((stats.totalSpan / stats.enemies).toFixed(2)) : 0,
      desiredDrift,
      minimumGap,
    });
  }

  // Checkpoints are authored as immutable seeds and materialized into a fresh
  // runtime list for each build. Level expansion may clone platforms,
  // collectibles, or enemies, but it must never clone an already-materialized
  // checkpoint. Stable ids and positional duplicate protection make that rule
  // enforceable when a future expansion passes a mixed seed list by mistake.
  function createCheckpointSet(definitions, options = {}) {
    const defaults = options.defaults && typeof options.defaults === 'object'
      ? options.defaults
      : {};
    const resolve = typeof options.resolve === 'function' ? options.resolve : null;
    const duplicateTolerance = Number.isFinite(options.duplicateTolerance)
      ? Math.max(0, options.duplicateTolerance)
      : 8;
    const seenIds = new Set();
    const seenPositions = [];
    const sourceDefinitions = Array.isArray(definitions) ? definitions : [];

    return sourceDefinitions
      .map((definition, index) => {
        const seed = { ...(definition || {}) };
        const resolved = resolve ? (resolve({ ...seed }, index) || seed) : seed;
        const id = resolved.id || seed.id || `checkpoint-${index + 1}`;
        const x = Number(resolved.x);
        if (!Number.isFinite(x)) return null;
        return {
          ...defaults,
          ...resolved,
          id,
          sourceIndex: index,
          x,
          activated: false,
        };
      })
      .filter(Boolean)
      .filter((checkpoint) => {
        if (seenIds.has(checkpoint.id)) return false;
        if (seenPositions.some((position) => Math.abs(position - checkpoint.x) <= duplicateTolerance)) return false;
        seenIds.add(checkpoint.id);
        seenPositions.push(checkpoint.x);
        return true;
      })
      .sort((a, b) => a.x - b.x)
      .map((checkpoint, index) => ({ ...checkpoint, order: index + 1 }));
  }

  function applyEnemyMetadata(enemy) {
    if (!enemy) return enemy;
    const profile = getEnemyProfile(enemy);
    enemy.enemyProfile = profile;
    enemy.role = profile.role;
    enemy.roleLabel = profile.roleLabel;
    enemy.traits = [...profile.traits];
    enemy.telegraphProfile = profile.telegraph;
    enemy.rewardProfile = profile.reward;
    enemy.rewardTier = profile.reward.tier;
    return enemy;
  }

  function bindEnemyToPlatform(enemy, platform, options = {}) {
    if (!enemy || !platform || !Number.isFinite(platform.x) || !Number.isFinite(platform.y)) return enemy;
    if (enemy.roleExplicit == null) enemy.roleExplicit = Boolean(enemy.role);
    if (options.role) enemy.roleExplicit = true;
    const platformChanged = enemy.platform !== platform;
    const firstBinding = !enemy.platformAnchored || platformChanged;
    const enemyHeight = Number(enemy.h) || 40;
    const surfaceOffset = Number.isFinite(enemy.platformOffsetY)
      ? enemy.platformOffsetY
      : (Number(enemy.y) || 0) - (platform.y - enemyHeight);
    const horizontalOffset = Number.isFinite(enemy.platformOffsetX)
      ? enemy.platformOffsetX
      : (Number(enemy.x) || 0) - platform.x;

    enemy.platform = platform;
    enemy.platformAnchored = true;
    enemy.platformOffsetX = horizontalOffset;
    enemy.platformOffsetY = surfaceOffset;
    if (firstBinding) {
      enemy.platformLastX = platform.x;
      enemy.platformLastY = platform.y;
    }
    enemy.groundY = platform.y;
    enemy.baseY = platform.y - enemyHeight + surfaceOffset;
    const roleSeed = enemy.roleExplicit ? enemy : { ...enemy, role: null };
    enemy.role = options.role || inferEnemyPlacementRole(roleSeed, platform);
    enemy.platformRole = enemy.role;
    applyEnemyMetadata(enemy);

    if (firstBinding || options.refreshBounds) {
      const edgePadding = options.edgePadding ?? Math.max(16, Math.round(enemy.w * 0.45));
      const requestedMin = Number.isFinite(enemy.minX) ? enemy.minX : enemy.x - 120;
      const requestedMax = Number.isFinite(enemy.maxX) ? enemy.maxX : enemy.x + 120;
      const platformMin = platform.x + edgePadding;
      const platformMax = platform.x + platform.w - enemy.w - edgePadding;
      if (platformMax >= platformMin) {
        enemy.minX = Math.max(platformMin, requestedMin);
        enemy.maxX = Math.min(platformMax, requestedMax);
        if (enemy.maxX < enemy.minX) {
          const midpoint = Math.min(platformMax, Math.max(platformMin, platform.x + horizontalOffset));
          enemy.minX = midpoint;
          enemy.maxX = midpoint;
        }
      } else {
        const midpoint = platform.x + Math.max(0, (platform.w - enemy.w) / 2);
        enemy.minX = midpoint;
        enemy.maxX = midpoint;
      }
    }
    return enemy;
  }

  function syncEnemyPlatform(enemy) {
    const platform = enemy?.platform;
    if (!platform || !enemy.platformAnchored) return { dx: 0, dy: 0, platform: null };
    const nextX = Number(platform.x) || 0;
    const nextY = Number(platform.y) || 0;
    const previousX = Number.isFinite(enemy.platformLastX) ? enemy.platformLastX : nextX;
    const previousY = Number.isFinite(enemy.platformLastY) ? enemy.platformLastY : nextY;
    const dx = nextX - previousX;
    const dy = nextY - previousY;
    if (dx) {
      enemy.x += dx;
      if (Number.isFinite(enemy.minX)) enemy.minX += dx;
      if (Number.isFinite(enemy.maxX)) enemy.maxX += dx;
    }
    if (dy) enemy.y += dy;
    enemy.platformLastX = nextX;
    enemy.platformLastY = nextY;
    enemy.groundY = nextY;
    enemy.baseY = nextY - (Number(enemy.h) || 40) + (enemy.platformOffsetY || 0);
    return { dx, dy, platform };
  }

  function findEnemySupportPlatform(enemy, platforms, options = {}) {
    if (!enemy || !Array.isArray(platforms)) return null;
    if (enemy.platform) return enemy.platform;
    const requestedPlatformId = enemy.supportPlatformId || enemy.platformId;
    if (requestedPlatformId) {
      const explicitlyRequested = platforms.find((platform) => platform?.id === requestedPlatformId);
      if (explicitlyRequested) return explicitlyRequested;
      // Expansion can create a copy with the same authored id plus an
      // "-encore" suffix. Prefer the copy whose surface is closest to the
      // authored enemy when the original platform is not present.
      const expandedMatches = platforms
        .filter((platform) => platform?.id === `${requestedPlatformId}-encore`)
        .map((platform) => ({ platform, distance: Math.abs((enemy.y + (enemy.h || 0)) - platform.y) }))
        .sort((a, b) => a.distance - b.distance);
      if (expandedMatches[0] && expandedMatches[0].distance <= (options.surfaceTolerance ?? 28) + 12) {
        return expandedMatches[0].platform;
      }
    }
    const centerX = enemy.x + (enemy.w || 0) * 0.5;
    const bottom = enemy.y + (enemy.h || 0);
    const tolerance = options.surfaceTolerance ?? 28;
    const edgePadding = options.edgePadding ?? Math.max(8, (enemy.w || 0) * 0.25);
    return platforms
      .filter((platform) => platform && platform.enemySupport !== false)
      .filter((platform) => centerX > platform.x + edgePadding && centerX < platform.x + platform.w - edgePadding)
      .map((platform) => ({ platform, distance: Math.abs(bottom - platform.y) }))
      .filter(({ distance }) => distance <= tolerance)
      .sort((a, b) => a.distance - b.distance)[0]?.platform || null;
  }

  function findCheckpointSupport(checkpoint, platforms, options = {}) {
    if (!checkpoint || !Array.isArray(platforms)) return null;
    const left = Number.isFinite(options.left) ? options.left : checkpoint.x;
    const right = Number.isFinite(options.right) ? options.right : checkpoint.x + (checkpoint.w || 0);
    const surfaceY = Number.isFinite(options.surfaceY) ? options.surfaceY : null;
    const yTolerance = Number.isFinite(options.yTolerance) ? options.yTolerance : 3;

    return platforms
      .filter((platform) => platform && !platform.moving && platform.checkpointSupport !== false)
      .filter((platform) => (Number(platform.h) || 0) > 30)
      .filter((platform) => surfaceY == null || Math.abs(platform.y - surfaceY) <= yTolerance)
      .filter((platform) => platform.x <= left && platform.x + platform.w >= right)
      .sort((a, b) => (a.w || 0) - (b.w || 0))[0] || null;
  }

  function attachEnemiesToPlatforms(enemies, platforms, options = {}) {
    const stats = {
      total: Array.isArray(enemies) ? enemies.length : 0,
      attached: 0,
      elevated: 0,
      moving: 0,
      unbound: 0,
      roles: {},
    };
    if (!Array.isArray(enemies) || !Array.isArray(platforms)) return Object.freeze(stats);
    enemies.forEach((enemy) => {
      if (!enemy || enemy.boss || enemy.ignorePlatform) return;
      const platform = findEnemySupportPlatform(enemy, platforms, options);
      if (!platform) {
        applyEnemyMetadata(enemy);
        stats.unbound += 1;
        return;
      }
      bindEnemyToPlatform(enemy, platform, options);
      stats.attached += 1;
      if (!platform.ground) stats.elevated += 1;
      if (platform.moving) stats.moving += 1;
      stats.roles[enemy.role] = (stats.roles[enemy.role] || 0) + 1;
    });
    return Object.freeze({ ...stats, roles: Object.freeze({ ...stats.roles }) });
  }

  function prepareEnemyBehavior(enemy, index = 0, fallback = 'tomato') {
    enemy.roleExplicit ??= Boolean(enemy.role);
    const archetype = enemy.behaviorType || (enemyBehaviorProfiles[enemy.type] ? enemy.type : fallback);
    enemy.behaviorType = enemyBehaviorProfiles[archetype] ? archetype : fallback;
    enemy.baseY ??= enemy.y;
    enemy.baseSpeed ??= Math.max(1, Math.abs(enemy.speed ?? enemy.vx ?? 42));
    enemy.behaviorClock ??= Number(enemy.clock || index * 0.57) % 3.2;
    enemy.tearTimer ??= 0.15 + (index % 4) * 0.12;
    enemy.rollAngle ??= 0;
    if (enemy.platform) bindEnemyToPlatform(enemy, enemy.platform);
    enemy.role = enemy.role || inferEnemyPlacementRole(enemy, enemy.platform);
    applyEnemyMetadata(enemy);
    enemy.telegraph = false;
    enemy.telegraphKind = enemy.telegraphProfile.kind;
    enemy.telegraphLabel = enemy.telegraphProfile.label;
    enemy.telegraphProgress = 0;
    enemy.charging = false;
    enemy.rolling = false;
    return enemy;
  }

  function updateEnemyBehavior(enemy, dt, options = {}) {
    prepareEnemyBehavior(enemy, options.index || 0, options.fallback || 'tomato');
    const profile = enemyBehaviorProfiles[enemy.behaviorType];
    const jumpScale = options.jumpScale ?? 1;
    syncEnemyPlatform(enemy);
    enemy.behaviorClock += dt;
    enemy.telegraph = false;
    enemy.telegraphKind = profile.telegraph || enemy.telegraphProfile.kind;
    enemy.telegraphLabel = enemy.telegraphProfile.label;
    enemy.telegraphProgress = 0;
    enemy.charging = false;
    enemy.rolling = false;
    enemy.y = enemy.baseY;
    let speedScale = 1;
    const phase = enemy.behaviorClock % profile.cycle;
    const telegraphLead = Math.min(profile.cycle - 0.05, Math.max(0.08, enemy.telegraphProfile.lead || profile.windup));

    if (phase < telegraphLead) {
      enemy.telegraph = true;
      enemy.telegraphProgress = phase / telegraphLead;
      speedScale = profile.action === 'charge' ? 0.12 : profile.action === 'roll' ? 0.2 : 0.25;
    } else if (phase < profile.actionEnd) {
      const actionProgress = (phase - profile.windup) / (profile.actionEnd - profile.windup);
      if (profile.action === 'charge') {
        enemy.charging = true;
        speedScale = profile.speed;
      } else if (profile.action === 'roll') {
        enemy.rolling = true;
        speedScale = profile.speed;
        enemy.rollAngle += (enemy.dir || 1) * dt * 8.5;
      } else {
        enemy.y = enemy.baseY - Math.sin(actionProgress * Math.PI) * profile.jump * jumpScale;
        speedScale = profile.speed || 1;
      }
    }

    if (enemy.behaviorType === 'onion') {
      enemy.tearTimer -= dt;
      if (enemy.tearTimer <= 0) {
        enemy.tearTimer = 0.34 + Math.random() * 0.25;
        options.onTear?.(enemy);
      }
    }
    return speedScale;
  }

  function drawEnemyBehaviorSignals(ctx, enemy, screenX, options = {}) {
    const enemyProfile = enemy.enemyProfile || getEnemyProfile(enemy);
    const airborne = enemy.y < enemy.baseY - 2;
    if (!enemy.telegraph && !enemy.charging && !enemy.rolling && !airborne) return;
    const centerX = screenX + enemy.w / 2;
    const groundY = (enemy.platform?.y ?? (enemy.baseY + enemy.h)) + (options.groundOffset || 2);
    ctx.save();
    if (enemy.telegraph) {
      const pulse = 1 + Math.sin((enemy.behaviorClock || 0) * 18) * 0.12;
      const warningColor = enemy.telegraphProfile?.color || options.warningColor || '#ffd65a';
      const roleColor = enemy.telegraphProfile?.roleColor || warningColor;
      ctx.strokeStyle = warningColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY, 23 * pulse, 7 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (enemyProfile.role !== 'ground-patrol') {
        ctx.strokeStyle = roleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(centerX, groundY, 29 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = options.warningTextColor || '#fff5c8';
      ctx.font = '900 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.telegraphLabel || enemyProfile.telegraph.label || '!', centerX, enemy.y - 9);
    }
    if (enemy.charging || enemy.rolling) {
      ctx.strokeStyle = enemy.telegraphProfile?.accent
        || (enemy.charging ? (options.chargeColor || '#ff5f91') : (options.rollColor || '#65d8ff'));
      ctx.lineWidth = 3;
      const dir = enemy.dir || 1;
      const behind = dir > 0 ? screenX - 8 : screenX + enemy.w + 8;
      for (let index = 0; index < 3; index += 1) {
        ctx.beginPath();
        ctx.moveTo(behind - dir * (index * 7), groundY - 12 - index * 6);
        ctx.lineTo(behind - dir * (18 + index * 8), groundY - 12 - index * 6);
        ctx.stroke();
      }
    }
    if (airborne && !enemy.charging && !enemy.rolling) {
      ctx.strokeStyle = enemy.telegraphProfile?.accent || options.warningColor || '#9bef70';
      ctx.lineWidth = 2;
      for (let index = 0; index < 2; index += 1) {
        const arrowY = enemy.y + enemy.h + 8 + index * 8;
        ctx.beginPath();
        ctx.moveTo(centerX - 10, arrowY);
        ctx.lineTo(centerX, arrowY - 6);
        ctx.lineTo(centerX + 10, arrowY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function celebrateSplatCombo(combo = 1, options = {}) {
    const safeCombo = Math.max(1, Math.floor(combo || 1));
    const comboReward = stompComboReward(safeCombo);
    if (!comboReward.exactThreshold || safeCombo === 1) return null;
    const mega = comboReward.tier === 'supremacy';
    const reward = Object.freeze({
      tier: comboReward.tier,
      combo: safeCombo,
      label: comboReward.label,
      message: comboReward.message,
      duration: mega ? 2.7 : comboReward.tier === 'rainbow' ? 2.2 : 1.35,
      confetti: options.reduced
        ? (mega ? 88 : comboReward.tier === 'rainbow' ? 60 : 28)
        : (mega ? 190 : comboReward.tier === 'rainbow' ? 125 : 52),
      burstColors: mega || comboReward.tier === 'rainbow'
        ? ['#ffd65a', '#ff6fae', '#65d8ff', '#9bef70', '#b78cff']
        : comboReward.tier === 'triple'
          ? ['#ffd65a', '#ff9f5a', '#fff1a6']
          : ['#ffd65a', '#65d8ff'],
      shake: options.reduced
        ? (mega ? 10 : comboReward.tier === 'rainbow' ? 7 : 4)
        : (mega ? 20 : comboReward.tier === 'rainbow' ? 14 : 8),
      hitStop: mega ? 0.14 : comboReward.tier === 'rainbow' ? 0.1 : 0.055,
    });
    options.onCelebrate?.(reward);
    return reward;
  }

  function isStomp(player, target, options = {}) {
    const top = target.y + (options.topInset || 0);
    const tolerance = options.topTolerance ?? heroPhysics.stompTopTolerance;
    const minimumVelocity = options.minVelocity ?? heroPhysics.stompMinVelocity;
    const crossingAllowance = options.crossingAllowance ?? heroPhysics.stompCrossingAllowance;
    const horizontalInset = options.horizontalInset ?? heroPhysics.stompHorizontalInset;
    const horizontalGrace = Math.max(0, Number(options.horizontalGrace) || 0);
    const playerFootInset = Math.max(0, Number(options.playerFootInset) || 0);
    const minimumHorizontalOverlap = Math.max(0, Number(options.minimumHorizontalOverlap) || 0);
    const surfaceGrace = Math.max(0, Number(options.surfaceGrace ?? 10) || 0);
    const playerBottom = player.y + player.h;
    const previousBottom = Number.isFinite(options.previousBottom)
      ? options.previousBottom
      : Number.isFinite(player.previousBottom)
        ? player.previousBottom
        : Number.isFinite(player.previousY)
          ? player.previousY + player.h
          : playerBottom;
    const previousTop = Number.isFinite(options.previousTargetTop)
      ? options.previousTargetTop + (options.topInset || 0)
      : top;
    const playerLeft = player.x + playerFootInset;
    const playerRight = player.x + player.w - playerFootInset;
    const targetLeft = target.x + horizontalInset - horizontalGrace;
    const targetRight = target.x + target.w - horizontalInset + horizontalGrace;
    const horizontalOverlap = Math.min(playerRight, targetRight) - Math.max(playerLeft, targetLeft);
    // Use the target's swept top rather than only its current top. Hop-type
    // enemies can move upward between frames, and the old min() check rejected
    // a legitimate downward landing when the garlic rose into Taco Hero.
    const sweptTop = Math.min(previousTop, top);
    const enteredFromAbove = previousBottom <= previousTop + crossingAllowance;
    const crossedTop = enteredFromAbove && playerBottom >= sweptTop - surfaceGrace;
    const nearTop = enteredFromAbove
      && playerBottom >= sweptTop - surfaceGrace
      && playerBottom - sweptTop <= tolerance + (top < previousTop ? heroPhysics.stompMovingTargetAllowance : 0);
    const descending = player.vy >= minimumVelocity || playerBottom > previousBottom + 0.5;
    return horizontalOverlap >= minimumHorizontalOverlap && descending && (crossedTop || nearTop);
  }

  function classifyEnemyContact(player, target, options = {}) {
    if (!player || !target || !(player.w > 0) || !(player.h > 0) || !(target.w > 0) || !(target.h > 0)) return null;
    const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));
    const routeHelper = Boolean(options.routeHelper);
    const topInset = options.topInset ?? clampValue(
      target.h * ordinaryStompStandard.topInsetRatio,
      ordinaryStompStandard.topInsetMin,
      ordinaryStompStandard.topInsetMax,
    );
    const topRegionDepth = options.topRegionDepth ?? clampValue(
      target.h * (routeHelper ? ordinaryStompStandard.routeTopRegionRatio : ordinaryStompStandard.topRegionRatio),
      ordinaryStompStandard.topRegionMin,
      routeHelper ? ordinaryStompStandard.routeTopRegionMax : ordinaryStompStandard.topRegionMax,
    );
    const horizontalGrace = options.horizontalGrace ?? clampValue(
      target.w * ordinaryStompStandard.horizontalGraceRatio,
      ordinaryStompStandard.horizontalGraceMin,
      ordinaryStompStandard.horizontalGraceMax,
    );
    const playerFootInset = options.playerFootInset ?? player.w * ordinaryStompStandard.playerFootInsetRatio;
    const usableFootWidth = Math.max(1, player.w - playerFootInset * 2);
    const minimumHorizontalOverlap = options.minimumHorizontalOverlap ?? clampValue(
      Math.min(usableFootWidth, target.w) * ordinaryStompStandard.minimumOverlapRatio,
      ordinaryStompStandard.minimumOverlapMin,
      ordinaryStompStandard.minimumOverlapMax,
    );
    const stomp = isStomp(player, target, {
      ...options,
      topInset,
      topTolerance: options.topTolerance ?? topRegionDepth,
      crossingAllowance: options.crossingAllowance ?? topRegionDepth,
      horizontalInset: options.horizontalInset ?? 0,
      horizontalGrace,
      playerFootInset,
      minimumHorizontalOverlap,
      surfaceGrace: options.surfaceGrace ?? ordinaryStompStandard.surfaceGrace,
      minVelocity: options.minVelocity ?? ordinaryStompStandard.minimumVelocity,
    });
    if (stomp) return 'stomp';

    const bodyContact = player.x + player.w > target.x
      && player.x < target.x + target.w
      && player.y + player.h > target.y
      && player.y < target.y + target.h;
    return bodyContact ? 'body' : null;
  }

  function createRespawnState() {
    return {
      active: false,
      timer: 0,
      fullHeal: false,
      spawnPlaced: false,
      fromX: 0,
      fromY: 0,
      targetX: 0,
      targetY: 0,
      airY: 0,
      sparkTimer: 0,
    };
  }

  function beginRespawn(respawn, options = {}) {
    Object.assign(respawn, createRespawnState(), {
      active: true,
      fullHeal: Boolean(options.fullHeal),
      fromX: options.fromX || 0,
      fromY: options.fromY || 0,
      targetX: options.targetX || 0,
      targetY: options.targetY || 0,
      airY: options.airY ?? Math.max(24, (options.targetY || 300) - 250),
    });
    return respawn;
  }

  function advanceRespawn(respawn, player, dt) {
    if (!respawn.active) return { phase: 'inactive', shouldPlace: false };
    respawn.timer += dt;
    respawn.sparkTimer += dt;
    if (respawn.timer < 0.38) {
      const progress = respawn.timer / 0.38;
      player.x = respawn.fromX;
      player.y = respawn.fromY - Math.sin(progress * Math.PI) * 18;
      player.rotation = progress * 0.6;
      player.scale = 1 - progress * 0.35;
      return { phase: 'vanish', shouldPlace: false };
    }
    player.rotation = 0;
    player.scale = 1;
    if (!respawn.spawnPlaced && respawn.timer >= 0.58) return { phase: 'beam', shouldPlace: true };
    return { phase: respawn.spawnPlaced ? 'drop' : 'beam', shouldPlace: false };
  }

  function placeRespawn(respawn, player) {
    respawn.spawnPlaced = true;
    player.x = respawn.targetX;
    player.y = respawn.airY;
    player.vx = 0;
    player.vy = 90;
    player.grounded = false;
    player.platform = null;
    player.rotation = 0;
    player.scale = 1;
  }

  function finishRespawn(respawn, player, invulnerability = 1.4) {
    respawn.active = false;
    player.rotation = 0;
    player.scale = 1;
    player.invulnerable = Math.max(player.invulnerable || 0, invulnerability);
  }

  function hidePlayerDuringRespawn(respawn) {
    return Boolean(respawn.active && respawn.timer >= 0.38 && !respawn.spawnPlaced);
  }

  function drawRespawnFX(ctx, respawn, player, cameraX, time, palette = {}) {
    if (!respawn.active) return;
    if (respawn.timer < 0.38) {
      const x = player.x - cameraX + player.w * 0.5;
      const y = player.y + player.h * 0.5;
      const pulse = 18 + Math.sin(time * 0.03) * 4 + respawn.timer * 30;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = palette.vanish || '#ff8c5a';
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = palette.vanishRing || '#ffd27a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, pulse * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const beamX = respawn.targetX - cameraX + player.w * 0.5;
    const beamTop = Math.max(0, respawn.airY - 140);
    const beamHeight = ctx.canvas.height - beamTop - 24;
    const gradient = ctx.createLinearGradient(beamX, beamTop, beamX, beamTop + beamHeight);
    gradient.addColorStop(0, palette.beamTop || 'rgba(255, 240, 160, 0)');
    gradient.addColorStop(0.2, palette.beamOuter || 'rgba(255, 208, 98, 0.30)');
    gradient.addColorStop(0.5, palette.beamCore || 'rgba(255, 247, 196, 0.66)');
    gradient.addColorStop(1, palette.beamBottom || 'rgba(255, 112, 84, 0.06)');
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(beamX - 28, beamTop, 56, beamHeight);
    ctx.strokeStyle = palette.beamEdge || 'rgba(255, 251, 222, 0.38)';
    ctx.strokeRect(beamX - 20, beamTop + 12, 40, beamHeight - 24);
    const ringY = respawn.spawnPlaced ? player.y + player.h * 0.8 : respawn.targetY + player.h * 0.8;
    const ringRadius = 12 + Math.sin(time * 0.025) * 3 + (respawn.spawnPlaced ? 8 : 0);
    ctx.strokeStyle = palette.landingRing || 'rgba(255, 213, 106, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(beamX, ringY, ringRadius * 1.5, ringRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const heroCore = Object.freeze({
    physics: heroPhysics,
    enemyPlacementRoles,
    enemyTraitProfiles,
    enemyTypeProfiles,
    stompComboTiers,
    splatFeedback,
    getStompComboTier,
    stompComboReward,
    enemyBehaviorProfiles,
    inferEnemyPlacementRole,
    getEnemyPlacementRole,
    getEnemyTypeProfile,
    getEnemyProfile,
    getEnemyRewardProfile,
    createEnemyFormation,
    retuneEnemyFormationPatrols,
    applyEnemyMetadata,
    createCheckpointSet,
    bindEnemyToPlatform,
    syncEnemyPlatform,
    findEnemySupportPlatform,
    findCheckpointSupport,
    attachEnemiesToPlatforms,
    prepareEnemyBehavior,
    updateEnemyBehavior,
    drawEnemyBehaviorSignals,
    celebrateSplatCombo,
    ordinaryStompStandard,
    isStomp,
    classifyEnemyContact,
    createRespawnState,
    beginRespawn,
    advanceRespawn,
    placeRespawn,
    finishRespawn,
    hidePlayerDuringRespawn,
    drawRespawnFX,
  });

  function prepareLevelStart(options = {}) {
    const overlay = document.getElementById(options.overlayId || 'startOverlay');
    if (!overlay) return { overlay: null, card: null, button: null };
    overlay.classList.add('level-start-overlay');
    const card = overlay.querySelector('.card');
    if (card) card.classList.add('level-start-card');
    let button = document.getElementById(options.buttonId || 'startBtn');
    if (!button && card) {
      button = document.createElement('button');
      button.id = options.buttonId || 'startBtn';
      button.type = 'button';
      button.className = 'primary-btn';
      button.textContent = options.label || 'Start the Adventure';
      card.appendChild(button);
    }
    if (button) {
      button.classList.add('level-start-btn');
      button.type = 'button';
      if (options.label) button.textContent = options.label;
      if (!button.textContent.trim()) button.textContent = 'Start the Adventure';
      if (options.ariaLabel) button.setAttribute('aria-label', options.ariaLabel);
      else if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.textContent.trim());
    }
    return { overlay, card, button };
  }

  function bindLevelStart(handler, options = {}) {
    const startControl = prepareLevelStart(options);
    if (!startControl.button || typeof handler !== 'function') return startControl;
    if (startControl.button.dataset.jftStartBound !== 'true') {
      startControl.button.addEventListener('click', (event) => {
        if (startControl.button.disabled) return;
        handler(event);
      });
      startControl.button.dataset.jftStartBound = 'true';
    }
    return startControl;
  }

  const levelStart = Object.freeze({
    prepare: prepareLevelStart,
    bind: bindLevelStart,
  });
  const levels = [
    {
      id: 'world-1-level-1',
      number: 1,
      world: 1,
      stage: 1,
      displayNumber: '1-1',
      slug: 'sunset-salsa-run',
      name: 'Sunset Salsa Run',
      status: 'playable',
      theme: 'desert-fiesta',
      worldWidth: 33080,
      route: '/game/index.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'desert-dash', name: 'Desert Dash', start: 0, end: 8960 },
        { id: 'taco-drop', name: 'Olivia’s Taco Drop', start: 8960, end: 17480 },
        { id: 'salsa-showdown', name: 'Salsa Showdown', start: 17480, end: 23920 },
        { id: 'turbo-chase', name: 'Turbo Taco Chase', start: 23920, end: 31280 },
        { id: 'fiesta-finish', name: 'Fiesta Finish', start: 31280, end: 33080 },
      ],
    },
    {
      id: 'world-1-level-2',
      number: 1.2,
      world: 1,
      stage: 2,
      displayNumber: '1-2',
      slug: 'sky-high-salsa-rescue',
      name: 'Sky-High Salsa Rescue',
      status: 'playable',
      theme: 'desert-aviation-adventure',
      worldWidth: 33600,
      route: '/game/level1-2.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'airfield', name: 'Olivia’s Questionable Airfield', start: 0, end: 4600 },
        { id: 'desert-cruise', name: 'Easy-Peasy Desert Cruise', start: 4600, end: 10400 },
        { id: 'banner-flyby', name: 'The Banner Flyby', start: 10400, end: 16400 },
        { id: 'high-desert', name: 'High Desert Taco Trail', start: 16400, end: 22400 },
        { id: 'guac-ambush', name: 'Flying Guacamole Ambush', start: 22400, end: 27000 },
        { id: 'turbo-rescue', name: 'Turbo Rescue Run', start: 27000, end: 32200 },
        { id: 'crash-fiesta', name: 'Emergency Landing Fiesta', start: 32200, end: 33600 },
      ],
      signatureSystems: [
        'Olivia’s taco-loaded boarding, full runway taxi, and propeller-plane takeoff',
        'Three comedy banner flybys, including an inverted air-show pass',
        'Three-stomp taco piñata jackpot',
        'Forgiving jump-and-bounce platform routes',
        'Sky Streak taco-chain scoring',
        'Five optional Air Mail deliveries',
        'El Guacodillo GUAC-KRAK ambush',
        'Three-phase enemy-free turbo rescue chase',
        'Special-delivery emergency landing fiesta',
      ],
    },
    {
      id: 'world-1-level-3',
      number: 1.3,
      world: 1,
      stage: 3,
      displayNumber: '1-3',
      slug: 'sunset-salsa-showdown',
      name: 'Sunset Salsa Showdown',
      status: 'playable',
      theme: 'desert-fiesta-night',
      worldWidth: 35800,
      route: '/game/level1-3.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'golden-hour-gauntlet', name: 'Golden Hour Gauntlet', start: 0, end: 5600 },
        { id: 'salsa-canyon-stampede', name: 'Salsa Canyon Stampede', start: 5600, end: 11200 },
        { id: 'mercado-rooftops', name: 'Mercado Rooftops', start: 11200, end: 17400 },
        { id: 'parade-float-panic', name: 'Parade Float Panic', start: 17400, end: 23000 },
        { id: 'midnight-salsa-showdown', name: 'Midnight Salsa Showdown', start: 23000, end: 28800 },
        { id: 'hero-victory-dash', name: 'Hero’s Victory Dash', start: 28800, end: 33800 },
        { id: 'victory-fiesta', name: 'Victory Fiesta', start: 33800, end: 35800 },
      ],
      signatureSystems: [
        'Splat Chain traversal',
        'Salsa Canyon stampede',
        'Moving parade floats',
        'El Guacodillo three-stomp showdown',
        'Enemy-free village victory dash',
      ],
    },
    {
      id: 'world-2-level-1',
      number: 2,
      world: 2,
      stage: 1,
      displayNumber: '2-1',
      slug: 'coconut-crunch-cove',
      name: 'Coconut Crunch Cove',
      status: 'playable',
      theme: 'tropical-island',
      worldWidth: 36000,
      route: '/game/level2.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      palette: {
        ocean: '#20c8d8',
        lagoon: '#55e6c1',
        sand: '#ffd67a',
        palm: '#1f9d62',
        sunset: '#ff718f',
        moonlight: '#273b87',
      },
      sections: [
        { id: 'shimmering-shores', name: 'Shimmering Shores', start: 0, end: 7000, focus: 'Beach launch and surfboard platforms' },
        { id: 'palm-canopy', name: 'Palm Canopy', start: 7000, end: 14500, focus: 'Vine swings and treetop routes' },
        { id: 'tidal-temple', name: 'Tidal Temple', start: 14500, end: 24500, focus: 'Timed tide lifts, raft platforms, and Olivia’s taco catamaran' },
        { id: 'moonlit-surf-rescue', name: 'Moonlit Surf Rescue', start: 24500, end: 34200, focus: 'Olivia surf-by, playable surfboard chase, five obstacle jumps, and a beach landing' },
        { id: 'moonlit-island-fiesta', name: 'Moonlit Island Fiesta', start: 34200, end: 36000, focus: 'Premium illustrated taco-truck beach party' },
      ],
      music: {
        suite: 'Coconut Crunch Cove Adaptive Island Suite',
        leitmotif: 'A shared D-major island-adventure melody that evolves with each region',
        crossfadeSeconds: 2.4,
        transitionMode: 'equal-power',
        preventOverlap: true,
        arrangements: [
          {
            id: 'shore',
            name: 'Shoreline Sunrise',
            start: 0,
            end: 7000,
            bpm: 104,
            asset: 'assets/level2_music/music_island_shore.ogg',
            palette: ['ukulele', 'steel pan', 'congas', 'ocean texture'],
          },
          {
            id: 'canopy',
            name: 'Canopy Bounce',
            start: 7000,
            end: 14500,
            bpm: 110,
            asset: 'assets/level2_music/music_island_canopy.ogg',
            palette: ['marimba', 'kalimba', 'wood flute', 'shakers'],
          },
          {
            id: 'tides',
            name: 'Tidal Temple Drift',
            start: 14500,
            end: 24500,
            bpm: 92,
            asset: 'assets/level2_music/music_island_tides.ogg',
            palette: ['glass pad', 'kalimba', 'soft steel pan', 'water pulse'],
          },
          {
            id: 'surge',
            name: 'Moonlit Surf Rescue',
            start: 24500,
            end: 34200,
            bpm: 132,
            asset: 'assets/level2_music/music_island_surge.ogg',
            palette: ['fast ukulele', 'racing marimba', 'surf drums', 'heroic brass stabs'],
          },
          {
            id: 'fiesta',
            name: 'Moonlit Island Fiesta',
            start: 34200,
            end: 36000,
            bpm: 122,
            asset: 'assets/level2_music/music_island_fiesta.ogg',
            palette: ['steel pan', 'ukulele', 'flute', 'full island percussion'],
          },
        ],
      },
      plannedSystems: {
        movingPlatforms: ['surfboards over open water', 'tide rafts', 'swaying palms'],
        collectibles: ['island tacos', 'golden coconuts', 'rainbow shells'],
        setPieces: ['premium Olivia taco-catamaran drop', 'Olivia surf-by', 'playable big-wave surf escape', 'beach-launch wave crash', 'premium taco-truck shoreline fiesta'],
        reservedForWorld2Level2: ['Lava Luau', 'volcano taco-eruption finale'],
      },
      olivia: {
        vehicle: 'taco-catamaran',
        dropEvent: {
          name: 'Tidal Taco Boat Drop',
          section: 'tidal-temple',
          start: 16850,
          end: 21550,
          surface: 'animated-water',
          playerPlatforms: ['surfboards', 'tide-rafts', 'floating-dock'],
          deliveryStyle: 'Olivia drives alongside and arcs tacos from the catamaran',
        },
        checkpoints: [
          { x: 6100, name: 'Shell Station', look: 'striped surf shack with a tiny taco skiff' },
          { x: 13200, name: 'Canopy Dock', look: 'bamboo riverboat under hanging palms' },
          { x: 23600, name: 'Lighthouse Landing', look: 'glowing lighthouse raft warning of the final wave' },
          { x: 34650, name: 'Moonlight Mooring', look: 'premium tropical taco truck ready for the finale' },
        ],
      },
      assetSlots: [
        'olivia_taco_catamaran',
        'island_catamaran_sheet_v1',
        'island_surf_sheet_v1',
        'checkpoint_shell_station',
        'checkpoint_canopy_dock',
        'checkpoint_lighthouse_landing',
        'checkpoint_moonlight_mooring',
        'island_fiesta_stage',
        'island_fiesta_taco_truck',
        'island_fiesta_olivia',
        'music_island_shore',
        'music_island_canopy',
        'music_island_tides',
        'music_island_surge',
        'music_island_fiesta',
      ],
    },
    {
      id: 'world-2-level-2',
      number: 2.2,
      world: 2,
      stage: 2,
      displayNumber: '2-2',
      slug: 'campfire-caldera-caper',
      name: 'Campfire Caldera Caper',
      status: 'playable',
      theme: 'tropical-volcano-camping',
      worldWidth: 35000,
      route: '/game/level2-2.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'coconut-campgrounds', name: 'Coconut Campgrounds', start: 0, end: 6500, focus: 'Easy camp paths, Taco Trekker introduction, and warm-up bounce chains' },
        { id: 'geyser-gardens', name: 'Geyser Gardens', start: 6500, end: 12500, focus: 'Telegraphed geyser launches and Olivia’s driving taco drop' },
        { id: 'lava-tube-laughs', name: 'Lava Tube Laughs', start: 12500, end: 19000, focus: 'Glowing caves, lantern routes, and the suspicious taco reheat' },
        { id: 'caldera-kaboom', name: 'Caldera KABOOM', start: 19000, end: 27000, focus: 'Rainbow eruption jackpot and Taco Trekker Lava Safari chase' },
        { id: 'rainbow-lava-luau', name: 'Rainbow Lava Luau', start: 27000, end: 35000, focus: 'Rainbow platforms, a 2,000-unit enemy-free victory dash, and campsite fiesta' },
      ],
      signatureSystems: [
        'Volcano visible and evolving throughout the entire level',
        'Premium Olivia with short brown hair and pink-and-blue bangs',
        'Two Taco Trekker passes: geyser taco drop and Lava Safari chase',
        'Four telegraphed geyser bounce launchers',
        'Six animated camping-and-ingredient enemy families',
        'Twenty-four-item rainbow volcano KABOOM jackpot',
        'Five grounded premium checkpoint landmarks with Olivia Radio warnings',
        'Enemy-free final 2,000-unit campsite victory dash',
      ],
      music: {
        suite: 'Campfire Caldera Adaptive Island Suite',
        crossfadeSeconds: 3.2,
        transitionMode: 'equal-power',
        preventOverlap: true,
        arrangements: [
          { id: 'camp', name: 'Taco Trek Trail', start: 0, end: 6500, bpm: 102, asset: 'assets/level2_2_music/music_caldera_camp.ogg' },
          { id: 'geyser', name: 'Steam-Powered Picnic', start: 6500, end: 12500, bpm: 114, asset: 'assets/level2_2_music/music_caldera_geyser.ogg' },
          { id: 'caves', name: 'Lanterns Under Lava', start: 12500, end: 19000, bpm: 92, asset: 'assets/level2_2_music/music_caldera_caves.ogg' },
          { id: 'eruption', name: 'Caldera KABOOM Run', start: 19000, end: 27000, bpm: 134, asset: 'assets/level2_2_music/music_caldera_eruption.ogg' },
          { id: 'luau', name: 'Rainbow Lava Luau', start: 27000, end: 35000, bpm: 124, asset: 'assets/level2_2_music/music_caldera_luau.ogg' },
        ],
      },
      olivia: {
        appearance: 'short brown hair with vivid pink-and-blue bangs',
        vehicle: 'Taco Trekker camping 4×4',
        checkpoints: [
          { x: 5400, name: 'Taco Tent Basecamp' },
          { x: 11600, name: 'Geyser Picnic Stop' },
          { x: 18100, name: 'Lava-Tube Lantern Camp' },
          { x: 25900, name: 'Ashfall Ranger Station' },
          { x: 33050, name: 'Caldera Camper Fiesta' },
        ],
      },
    },
    {
      id: 'world-2-level-3',
      number: 2.3,
      world: 2,
      stage: 3,
      displayNumber: '2-3',
      slug: 'neon-neckties-turn-the-sunset-up',
      name: 'Neon Neckties: Turn the Sunset Up',
      status: 'playable',
      theme: 'tropical-sunset-concert',
      worldWidth: 35000,
      route: '/game/level2-3.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'soundcheck', name: 'Sunrise Soundcheck', start: 0, end: 5500, focus: 'Olivia’s grounded roadster, missing backstage passes, and welcoming taco routes' },
        { id: 'backstage-beach', name: 'Backstage Pass Beach', start: 5500, end: 11000, focus: 'Surf platforms, speaker cases, and original Neon Neckties cameos' },
        { id: 'roadie-rooftops', name: 'Roadie Rooftops', start: 11000, end: 17000, focus: 'Naturally scrolling island architecture and beat platforms' },
        { id: 'speaker-stampede', name: 'Speaker Stack Stampede', start: 17000, end: 22500, focus: 'Running food enemies, speaker carts, and splat chains' },
        { id: 'neon-lagoon', name: 'Neon Lagoon Rehearsal', start: 22500, end: 28000, focus: 'Olivia’s taco catamaran drop and musical water routes' },
        { id: 'stage-power', name: 'Power Up the Stage', start: 28000, end: 33000, focus: 'Three neon generators and the maximum-dopamine piñata jackpot' },
        { id: 'victory-dash', name: 'Golden Ticket Victory Dash', start: 33000, end: 35000, focus: 'Enemy-free fan celebration leading directly into the concert' },
      ],
      signatureSystems: [
        'Concert Energy rewards taco collection, bounce chains, checkpoints, generators, and backstage passes',
        'Five entirely original Neon Neckties members with distinct colored ties and performance roles',
        'Premium Olivia with short brown hair and vivid pink-and-blue bangs',
        'Grounded island roadster and Taco Catamaran taco-drop sequences',
        'Five animated concert-food enemy families using shared telegraphed behavior',
        'Three stage-power generators and three-stomp Neon Piñata KABOOM',
        'Enemy-free 2,000-unit fan victory dash with unique Neon Neckties signs',
        'Uninterrupted 3:07 playable concert before results',
      ],
      music: {
        suite: 'Neon Neckties Island Concert Journey',
        crossfadeSeconds: 2.8,
        concertCrossfadeSeconds: 3.8,
        transitionMode: 'equal-power',
        preventOverlap: true,
        finaleMaster: 'assets/neon_neckties/jump_for_tacos_final_concert_master.mp3',
        arrangements: [
          { id: 'soundcheck', name: 'Soundcheck Stroll', start: 0, end: 11000, asset: 'assets/level2_music/music_island_shore.ogg' },
          { id: 'rooftops', name: 'Roadie Rooftops', start: 11000, end: 17000, asset: 'assets/neon_neckties/turn_the_sunset_up_power_trio_v1.ogg' },
          { id: 'stampede', name: 'Speaker Stampede', start: 17000, end: 22500, asset: 'assets/level2_music/music_island_surge.ogg' },
          { id: 'lagoon', name: 'Neon Lagoon', start: 22500, end: 28000, asset: 'assets/level2_music/music_island_tides.ogg' },
          { id: 'powerup', name: 'Stage Power-Up', start: 28000, end: 35000, asset: 'assets/neon_neckties/turn_the_sunset_up_instrumental_v1.ogg' },
          { id: 'concert', name: 'Jump for Tacos', start: 35000, end: 35000, durationSeconds: 186.72, asset: 'assets/neon_neckties/jump_for_tacos_final_concert_master.mp3' },
        ],
      },
      olivia: {
        appearance: 'short layered brown hair with vivid pink-and-blue bangs',
        vehicles: ['grounded tropical concert roadster', 'Neon Lagoon taco catamaran'],
        concertRole: 'one out-and-back crowd surf supported by animated audience hands, followed by a taco-tambourine dance',
      },
    },
    {
      id: 'world-3-level-1',
      number: 3.1,
      world: 3,
      stage: 1,
      displayNumber: '3-1',
      slug: 'cloudtop-carnival-kickoff',
      name: 'Cloudtop Carnival Kickoff',
      status: 'playable',
      theme: 'starlight-cloud-carnival',
      worldWidth: 35000,
      route: '/game/level3.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'cloud-gates', name: 'Cloud Gate Welcome', start: 0, end: 7600 },
        { id: 'balloon-drop', name: 'Olivia’s Balloon Taco Drop', start: 7600, end: 15400 },
        { id: 'sky-midway', name: 'Sky-Ride Midway', start: 15400, end: 27000 },
        { id: 'cloud-parade', name: 'Cloudtop Taco Parade', start: 27000, end: 35000 },
      ],
      signatureSystems: [
        'Premium three-layer grounded cloud-carnival parallax',
        'Olivia’s animated taco-balloon delivery',
        'Taco Nova 25/50/75/100 reward ladder',
        'Three-stomp maximum-dopamine cloud piñata',
        'Eight optional Golden Taco Tickets',
      ],
      music: {
        suite: 'Cloudtop Carnival Adaptive Suite',
        crossfadeSeconds: 2.8,
        transitionMode: 'equal-power',
        preventOverlap: true,
        arrangements: ['Cloudtop Kickoff', 'Balloon Taco Drop', 'Sky-Ride Midway', 'Cloudtop Parade'],
      },
    },
    {
      id: 'world-3-level-2',
      number: 3.2,
      world: 3,
      stage: 2,
      displayNumber: '3-2',
      slug: 'midnight-midway-mayhem',
      name: 'Midnight Midway Mayhem',
      status: 'playable',
      theme: 'neon-midnight-carnival',
      worldWidth: 35000,
      route: '/game/level3-2.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'neon-midway', name: 'Neon Midway Arrival', start: 0, end: 7600 },
        { id: 'coaster-courier', name: 'Olivia’s Coaster Courier', start: 7600, end: 15500 },
        { id: 'funhouse-run', name: 'Funhouse Ride Riot', start: 15500, end: 27800 },
        { id: 'cornelius-pop', name: 'Sir Cornelius Pop Showdown', start: 27800, end: 31800 },
        { id: 'midnight-victory', name: 'Midnight Victory Midway', start: 31800, end: 35000 },
      ],
      signatureSystems: [
        'Premium neon midway art and animated rides',
        'Olivia’s animated maintenance-coaster taco delivery',
        'Six premium carnival-food enemy families',
        'Three-hit Sir Cornelius Pop arena with a locked victory gate',
        'Enemy-free midnight victory route',
      ],
      music: {
        suite: 'Midnight Midway Adaptive Suite',
        crossfadeSeconds: 2.8,
        transitionMode: 'equal-power',
        preventOverlap: true,
        arrangements: ['Neon Midway', 'Coaster Courier', 'Cornelius Showdown', 'Midnight Victory'],
      },
    },
    {
      id: 'world-3-level-3',
      number: 3.3,
      world: 3,
      stage: 3,
      displayNumber: '3-3',
      slug: 'taco-nova-firework-finale',
      name: 'Taco Nova Firework Finale',
      status: 'playable',
      theme: 'cosmic-firework-carnival',
      worldWidth: 35000,
      route: '/game/level3-3.html',
      inheritedAbilities: coreAbilities,
      inheritedHeroSystems: coreHeroSystems,
      inheritedLevelSystems: coreLevelSystems,
      sections: [
        { id: 'starlight-launch', name: 'Starlight Carnival Launch', start: 0, end: 8000 },
        { id: 'cosmic-rings', name: 'Cosmic Taco Rings', start: 8000, end: 19000 },
        { id: 'zeppelin-parade', name: 'Olivia’s Zeppelin Parade', start: 19000, end: 27600 },
        { id: 'ringmaster-radish', name: 'Ringmaster Radish’s Last Act', start: 27600, end: 31500 },
        { id: 'nova-victory', name: 'Enemy-Free Taco Nova Victory', start: 31500, end: 35000 },
      ],
      signatureSystems: [
        'Premium cosmic carnival and firework parallax',
        'Olivia’s animated taco-zeppelin parade',
        'Three-hit Ringmaster Radish blimp showdown',
        'Enemy-free Golden Taco Star victory route',
        'World 3 maximum-dopamine Taco Nova fiesta',
      ],
      music: {
        suite: 'Taco Nova Firework Adaptive Suite',
        crossfadeSeconds: 2.8,
        transitionMode: 'equal-power',
        preventOverlap: true,
        arrangements: ['Starlight Launch', 'Cosmic Taco Rings', 'Ringmaster Radish', 'Taco Nova Fiesta'],
      },
    },
  ];

  window.JUMPIN_FOR_TACOS_LEVELS = Object.freeze(levels);
  window.JUMPIN_FOR_TACOS_CORE_ABILITIES = coreAbilities;
  window.JUMPIN_FOR_TACOS_CORE_HERO_SYSTEMS = coreHeroSystems;
  window.JUMPIN_FOR_TACOS_CORE_LEVEL_SYSTEMS = coreLevelSystems;
  window.JFT_HERO_CORE = heroCore;
  window.JFT_LEVEL_START = levelStart;

  // Apply the shared layout before the individual level runtime binds its
  // handler. Future levels only need #startOverlay, a .card, and #startBtn.
  prepareLevelStart();

  // Every level loads this catalog, so controller support automatically carries
  // into future worlds without duplicating input code in each level runtime.
  if (!window.JFT_CONTROLLER && !document.querySelector('script[data-jft-controller]')) {
    const controllerScript = document.createElement('script');
    const catalogUrl = document.currentScript?.src || window.location.href;
    controllerScript.src = new URL('controller.js?v=8', catalogUrl).href;
    controllerScript.async = true;
    controllerScript.dataset.jftController = 'true';
    document.head.appendChild(controllerScript);
  }
})();
