(() => {
  'use strict';

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const levelId = document.body.dataset.world3Level || '3-1';
  const WORLD_WIDTH = 35000;
  const GROUND_Y = 458;
  const FINALE_RESULTS_DELAY = 5.8;
  const CLOUDTOP_RESULTS_DELAY = 1.65;
  const MIDNIGHT_RESULTS_DELAY = 2.8;
  const COSMIC_FINALE_PHASE_DURATIONS = Object.freeze({
    'star-dormant': 3,
    'zeppelin-return': 3,
    'golden-taco': 2,
    'star-relight': 5,
    'taco-nova': 6,
    'low-gravity': 5,
    landing: 3,
  });
  const NINE_STAR_LEVELS = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3'];
  const NINE_STAR_OFFSETS = [
    [-550, -42], [-430, -42], [-310, -42], [-190, -42], [-70, -42],
    [-500, 45], [-370, 45], [-240, 45], [180, -42],
  ];
  const COSMIC_BONUS_TACOS = 27;
  const CLOUDTOP_TACO_RAIN_DURATION = 9.2;
  const MIDNIGHT_PAD_TACOS = 9;
  const MIDNIGHT_PAD_LABELS = ['COASTER', 'FERRIS WHEEL', 'FUNHOUSE'];
  const MIDNIGHT_PAD_MESSAGES = [
    ['COASTER POWERED!', 'The maintenance rails blaze back to life'],
    ['FERRIS WHEEL POWERED!', 'A second neon taco arc joins the encore'],
    ['FUNHOUSE POWERED!', 'Every midway attraction is ready to glow'],
  ];
  const cloudtopTacoRainTarget = () => (constrainedDevice ? 120 : 180);
  const CHECKPOINT_GROUNDING_PROFILES = Object.freeze({
    0: { width: 246, groundInset: 6 },
    1: { width: 236, groundInset: 6 },
    2: { width: 260, groundInset: 7 },
    3: { width: 246, groundInset: 7 },
    4: { width: 238, groundInset: 6 },
    5: { width: 242, groundInset: 6 },
  });
  const CLOUDTOP_VOICE_LINES = [
    'CATCH ’EM!',
    'MORE TACOS!',
    'BEST FIESTA EVER!',
    'THIS IS AWESOME!',
    'TACO SHOWER!',
    'KEEP JUMPING!',
  ];
  const heroCore = window.JFT_HERO_CORE;
  const heroPhysics = heroCore.physics;
  const visualScale = heroCore.visualScale;
  const sharedAbilities = window.JFT_SHARED_ABILITIES;
  const audio = window.JFT_AUDIO;
  const params = new URLSearchParams(location.search);
  const qaMode = ['terminal.local', '127.0.0.1', 'localhost'].includes(location.hostname);
  const previewStart = qaMode ? Number(params.get('startX') || 0) : 0;
  const previewAutoRun = qaMode && params.get('autoRun') === '1';
  const previewAutoJump = qaMode && params.get('autoJump') === '1';
  const previewBossHits = qaMode ? Number(params.get('bossHits') || 0) : 0;
  const previewPinataHits = qaMode ? Number(params.get('pinataHits') || 0) : 0;
  const previewPinataBreak = qaMode && params.get('pinataBreak') === '1';
  const previewFinaleHits = qaMode ? Number(params.get('finaleHits') || 0) : 0;
  const previewCelebration = qaMode ? Number(params.get('celebration') || 0) : 0;
  const previewFinalePhase = qaMode ? params.get('finalePhase') : null;
  const previewMidwayPads = qaMode ? Number(params.get('midwayPads') || 0) : 0;
  const previewCosmicStars = qaMode ? Number(params.get('cosmicStars') || 0) : 0;
  const previewHitStop = qaMode ? Number(params.get('hitStop') || 0) : 0;
  const previewSuper = qaMode && params.get('super') === '1';
  const previewRespawn = qaMode && params.get('respawn') === '1';
  const previewRespawnCheckpoint = qaMode ? Number(params.get('respawnCheckpoint') ?? -1) : -1;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const constrainedDevice = Number(navigator.deviceMemory || 8) <= 4
    || (navigator.maxTouchPoints > 0 && window.devicePixelRatio >= 2);

  const CONFIGS = {
    '3-1': {
      id: '3-1',
      title: 'Cloudtop Carnival Kickoff',
      band: 0,
      groundStyle: 0,
      sections: [
        { id: 'cloud-gates', name: 'Cloud Gate Welcome', start: 0, end: 7600, music: 'kickoff', accent: '#ffd65a' },
        { id: 'balloon-drop', name: 'Olivia’s Balloon Taco Drop', start: 7600, end: 15400, music: 'balloon', accent: '#65e7ff' },
        { id: 'sky-midway', name: 'Sky-Ride Midway', start: 15400, end: 27000, music: 'midway', accent: '#ff68b4' },
        { id: 'cloud-parade', name: 'Cloudtop Taco Parade', start: 27000, end: WORLD_WIDTH, music: 'parade', accent: '#b78cff' },
      ],
      checkpoints: [
        { x: 5100, name: 'Cloud Ticket Booth', look: 0, warning: 'OLIVIA RADIO: ALTITUDE—YES. BRAKES—PROBABLY.' },
        { x: 11200, name: 'Balloon Airship Dock', look: 1, warning: 'OLIVIA RADIO: TACOS MAY EXPERIENCE DELIGHTFUL TURBULENCE.' },
        { x: 17900, name: 'Cloud Carousel Stop', look: 0, warning: 'OLIVIA RADIO: PLEASE KEEP ALL CRUNCH INSIDE THE RIDE.' },
        { x: 24700, name: 'Sky-Ride Service Gate', look: 3, warning: 'OLIVIA RADIO: THE CLOUDS SIGNED A WAIVER.' },
        { x: 32000, name: 'Parade Launch Booth', look: 4, warning: 'OLIVIA RADIO: PIÑATA WEATHER IS APPROACHING FAST.' },
      ],
      vehicle: { kind: 'balloon', start: 8200, end: 14100, row: 1, cols: [0, 1] },
      pinataX: 28900,
      boss: null,
      finishText: 'THE SKY CARNIVAL HAS OFFICIALLY LEFT SENSIBLE AIRSPACE!',
      setPieceLabel: 'Rainbow piñata',
      medal: 'CLOUDTOP CRUNCH',
    },
    '3-2': {
      id: '3-2',
      title: 'Midnight Midway Mayhem',
      band: 1,
      groundStyle: 1,
      sections: [
        { id: 'neon-midway', name: 'Neon Midway Arrival', start: 0, end: 7600, music: 'neon', accent: '#65e7ff' },
        { id: 'coaster-courier', name: 'Olivia’s Coaster Courier', start: 7600, end: 15500, music: 'coaster', accent: '#ff68b4' },
        { id: 'funhouse-run', name: 'Funhouse Ride Riot', start: 15500, end: 27800, music: 'coaster', accent: '#a87bff' },
        { id: 'cornelius-pop', name: 'Sir Cornelius Pop Showdown', start: 27800, end: 31800, music: 'boss', accent: '#ffd65a' },
        { id: 'midnight-victory', name: 'Midnight Victory Midway', start: 31800, end: WORLD_WIDTH, music: 'victory', accent: '#7dffb2' },
      ],
      checkpoints: [
        { x: 5200, name: 'Neon Repair Booth', look: 2, warning: 'OLIVIA RADIO: IF IT SPARKLES, IT IS PROBABLY ON PURPOSE.' },
        { x: 11200, name: 'Coaster Courier Station', look: 3, warning: 'OLIVIA RADIO: HANDS UP. TACOS ALSO UP.' },
        { x: 17700, name: 'Bumper Taco Garage', look: 2, warning: 'OLIVIA RADIO: BUMP RESPONSIBLY. CRUNCH IRRESPONSIBLY.' },
        { x: 24400, name: 'Funhouse Exit-ish', look: 3, warning: 'OLIVIA RADIO: EVERY EXIT IS AN ENTRANCE WITH BETTER LIGHTING.' },
        { x: 31550, name: 'Cornelius Popcorn Line', look: 4, warning: 'OLIVIA RADIO: WARNING—SIR CORNELIUS IS EXTREMELY BUTTERED.' },
      ],
      vehicle: { kind: 'coaster', start: 8500, end: 14500, row: 1, cols: [2, 3] },
      pinataX: null,
      boss: { kind: 'cornelius', x: 29400, gateX: 31650 },
      finishText: 'SIR CORNELIUS HAS BEEN POPPED, SALTED, AND POLITELY SERVED!',
      setPieceLabel: 'Sir Cornelius Pop',
      medal: 'MIDNIGHT MAYHEM',
    },
    '3-3': {
      id: '3-3',
      title: 'Taco Nova Firework Finale',
      band: 2,
      groundStyle: 2,
      sections: [
        { id: 'golden-starlight-launch', name: 'Golden Starlight Launch', start: 0, end: 6500, music: 'starlight', accent: '#ffd65a' },
        { id: 'celestial-ringway', name: 'Celestial Ringway', start: 6500, end: 13500, music: 'rings', accent: '#65e7ff' },
        { id: 'nebula-carnival-gardens', name: 'Nebula Carnival Gardens', start: 13500, end: 19800, music: 'rings', accent: '#b78cff' },
        { id: 'zeppelin-star-parade', name: 'Olivia’s Zeppelin Star Parade', start: 19800, end: 27600, music: 'rings', accent: '#ff68b4' },
        { id: 'radish-eclipse-arena', name: 'Ringmaster Radish Eclipse Arena', start: 27600, end: 31500, music: 'ringmaster', accent: '#ff786a' },
        { id: 'taco-nova-ascension', name: 'Enemy-Free Taco Nova Ascension', start: 31500, end: WORLD_WIDTH, music: 'fiesta', accent: '#7dffb2' },
      ],
      checkpoints: [
        { x: 5100, name: 'Cosmic Star Dock', look: 4, warning: 'OLIVIA RADIO: SPACE IS JUST A CARNIVAL WITH WORSE PARKING.' },
        { x: 11100, name: 'Rocket-Ring Station', look: 4, warning: 'OLIVIA RADIO: AIM FOR THE STARS. THE TACOS ARE CLOSER.' },
        { x: 18100, name: 'Zeppelin Mooring', look: 5, warning: 'OLIVIA RADIO: THIS AIRSHIP RUNS ON TACOS AND CONFIDENCE.' },
        { x: 24900, name: 'Firework Service Star', look: 4, warning: 'OLIVIA RADIO: DO NOT TAUNT THE FIREWORKS. THEY REMEMBER.' },
        { x: 31550, name: 'Golden Taco Star Dock', look: 5, warning: 'OLIVIA RADIO: FINAL ACT—MAXIMUM CRUNCH, MINIMUM GRAVITY.' },
      ],
      vehicle: { kind: 'zeppelin', start: 19400, end: 26800, row: 2, cols: [0, 1, 2] },
      pinataX: null,
      boss: { kind: 'ringmaster', x: 29200, gateX: 31500 },
      finishText: 'THE GOLDEN TACO STAR IS LIT—WORLD 3 HAS GONE FULL NOVA!',
      setPieceLabel: 'Golden Taco Star',
      medal: 'TACO NOVA LEGEND',
    },
  };
  const config = CONFIGS[levelId];
  const SOURCE_VERSION = 37;
  const WORLD3_VEHICLE_VISUALS = Object.freeze({
    balloon: Object.freeze({ cell: 4, width: 188, height: 250, launcherX: 24, launcherY: 176 }),
    coaster: Object.freeze({ cell: 6, width: 310, height: 207, launcherX: 28, launcherY: 112 }),
    zeppelin: Object.freeze({ cell: 8, width: 330, height: 220, launcherX: 46, launcherY: 154 }),
  });
  const WORLD3_REMASTER_PLANS = Object.freeze({
    '3-1': Object.freeze({
      version: 'world3-1-combat-route-v2',
      combatWindows: Object.freeze([
        Object.freeze({ id: 'cloud-gates', start: 650, end: 7600 }),
        Object.freeze({ id: 'sky-midway', start: 15480, end: 28500 }),
      ]),
      ground: Object.freeze([
        { id: 'cloud-gates-popcorn-pack', anchorX: 980, type: 'popcorn', count: 2, section: 'cloud-gates', purpose: 'Open the sky carnival with a readable two-stomp rhythm.' },
        { id: 'cloud-gates-cotton-pack', anchorX: 1980, type: 'cotton', count: 2, section: 'cloud-gates', purpose: 'Let the cotton candy pack teach the first hop timing.' },
        { id: 'cloud-gates-pretzel-pack', anchorX: 3060, type: 'pretzel', count: 3, section: 'cloud-gates', purpose: 'Make the wide cloud runway pay off with a clean same-type chain.' },
        { id: 'cloud-gates-lemon-pack', anchorX: 4140, type: 'lemon', count: 2, section: 'cloud-gates', purpose: 'Raise the vertical rhythm before the Cloud Ticket Booth.' },
        { id: 'cloud-gates-popcorn-pack-two', anchorX: 6100, type: 'popcorn', count: 2, section: 'cloud-gates', purpose: 'Close the opening act with a generous lower-route patrol.' },
        { id: 'cloud-gates-pretzel-pack-two', anchorX: 7040, type: 'pretzel', count: 2, section: 'cloud-gates', purpose: 'Set up the balloon drop while keeping its runway readable.' },
        { id: 'sky-midway-cotton-pack', anchorX: 16050, type: 'cotton', count: 2, section: 'sky-midway', purpose: 'Reintroduce pressure after Olivia clears the balloon route.' },
        { id: 'sky-midway-lemon-pack', anchorX: 17100, type: 'lemon', count: 2, section: 'sky-midway', purpose: 'Create a bright leap beat beneath the cloud carousel.' },
        { id: 'sky-midway-popcorn-pack', anchorX: 19000, type: 'popcorn', count: 3, section: 'sky-midway', purpose: 'Give the long midway floor a satisfying three-stomp target line.' },
        { id: 'sky-midway-pretzel-pack', anchorX: 20800, type: 'pretzel', count: 2, section: 'sky-midway', purpose: 'Turn the ride service gate into a readable rolling challenge.' },
        { id: 'sky-midway-cotton-pack-two', anchorX: 22600, type: 'cotton', count: 2, section: 'sky-midway', purpose: 'Keep the carnival floor active without crowding the checkpoint.' },
        { id: 'sky-midway-lemon-pack-two', anchorX: 24400, type: 'lemon', count: 2, section: 'sky-midway', purpose: 'Build a clean bounce chain toward the parade act.' },
        { id: 'sky-midway-pretzel-pack-two', anchorX: 26200, type: 'pretzel', count: 3, section: 'sky-midway', purpose: 'Make the final broad platform a premium stomp runway.' },
        { id: 'cloud-parade-popcorn-pack', anchorX: 27400, type: 'popcorn', count: 2, section: 'cloud-parade', purpose: 'Offer one last ordinary formation before the piñata landmark.' },
      ]),
      upper: Object.freeze([
        { id: 'cloud-upper-popcorn-sentry', anchorX: 2200, type: 'popcorn', count: 2, role: 'platform-sentry', section: 'cloud-gates', purpose: 'Make the first high cloud ledge a visible risk-reward detour.' },
        { id: 'cloud-upper-cotton-helper', anchorX: 3500, type: 'cotton', count: 1, role: 'route-helper', section: 'cloud-gates', purpose: 'Provide a forgiving bounce route to the candy-colored ledge.' },
        { id: 'cloud-upper-pretzel-moving', anchorX: 5800, type: 'pretzel', count: 2, role: 'moving-guard', section: 'cloud-gates', purpose: 'Turn the first moving cloud platform into a patient timing test.' },
        { id: 'cloud-upper-lemon-champion', anchorX: 6800, type: 'lemon', count: 1, role: 'champion', section: 'cloud-gates', purpose: 'Reward a clean upper landing before the balloon spectacle.' },
        { id: 'midway-upper-cotton-sentry', anchorX: 16600, type: 'cotton', count: 2, role: 'platform-sentry', section: 'sky-midway', purpose: 'Make the post-drop upper route feel intentionally authored.' },
        { id: 'midway-upper-lemon-moving', anchorX: 18500, type: 'lemon', count: 1, role: 'moving-guard', section: 'sky-midway', purpose: 'Add a readable moving-ride guard above the carousel stop.' },
        { id: 'midway-upper-popcorn-champion', anchorX: 20500, type: 'popcorn', count: 1, role: 'champion', section: 'sky-midway', purpose: 'Place a premium stomp above the long carnival floor.' },
        { id: 'midway-upper-pretzel-sentry', anchorX: 22500, type: 'pretzel', count: 2, role: 'platform-sentry', section: 'sky-midway', purpose: 'Give the upper route a bold rolling landmark.' },
        { id: 'midway-upper-cotton-helper', anchorX: 24500, type: 'cotton', count: 1, role: 'route-helper', section: 'sky-midway', purpose: 'Offer a controlled bounce toward the service gate.' },
        { id: 'midway-upper-lemon-champion', anchorX: 26500, type: 'lemon', count: 1, role: 'champion', section: 'sky-midway', purpose: 'Cap the optional route before the parade and piñata.' },
      ]),
    }),
    '3-2': Object.freeze({
      version: 'world3-2-combat-route-v2',
      combatWindows: Object.freeze([
        Object.freeze({ id: 'blue-hour-arrival', start: 700, end: 8040 }),
        Object.freeze({ id: 'prism-blacklight-run', start: 14960, end: 28100 }),
      ]),
      ground: Object.freeze([
        { id: 'blue-hour-popcorn-welcome', anchorX: 980, type: 'popcorn', count: 2, section: 'blue-hour-midway-arrival', purpose: 'Open the midnight carnival with a readable two-stomp welcome.' },
        { id: 'blue-hour-cotton-ticket-line', anchorX: 1980, type: 'cotton', count: 2, section: 'blue-hour-midway-arrival', purpose: 'Turn the ticket lane into a forgiving same-type hop pattern.' },
        { id: 'blue-hour-pretzel-arches', anchorX: 3060, type: 'pretzel', count: 3, section: 'blue-hour-midway-arrival', purpose: 'Give the first broad midway deck a satisfying three-stomp chain.' },
        { id: 'blue-hour-lemon-repair-run', anchorX: 4140, type: 'lemon', count: 2, section: 'blue-hour-midway-arrival', purpose: 'Raise the timing challenge before the Neon Repair Booth.' },
        { id: 'blue-hour-bumper-lane', anchorX: 6100, type: 'bumper', count: 2, section: 'blue-hour-midway-arrival', purpose: 'Introduce bumper-car pressure with a clear lower bypass.' },
        { id: 'coaster-boarding-corndogs', anchorX: 7360, type: 'corndog', count: 2, section: 'neon-coaster-district', purpose: 'Close ordinary combat before Olivia takes over the coaster corridor.' },
        { id: 'prism-cotton-mirror-pack', anchorX: 15800, type: 'cotton', count: 2, section: 'prism-funhouse', purpose: 'Rebuild the enemy rhythm after the enemy-free coaster delivery.' },
        { id: 'prism-bumper-garage-pack', anchorX: 16900, type: 'bumper', count: 2, section: 'prism-funhouse', purpose: 'Make the Bumper Taco Garage a readable same-type challenge.' },
        { id: 'prism-pretzel-switchback', anchorX: 18100, type: 'pretzel', count: 3, section: 'prism-funhouse', purpose: 'Reward the funhouse switchback with a premium stomp chain.' },
        { id: 'prism-lemon-light-tunnel', anchorX: 19300, type: 'lemon', count: 2, section: 'prism-funhouse', purpose: 'Add a bright leap beat through the mirror-light tunnel.' },
        { id: 'prism-corndog-exit-pack', anchorX: 20500, type: 'corndog', count: 2, section: 'prism-funhouse', purpose: 'Keep the funhouse exit readable without leaving it empty.' },
        { id: 'prism-popcorn-curtain-call', anchorX: 21700, type: 'popcorn', count: 2, section: 'prism-funhouse', purpose: 'Carry a steady stomp rhythm into the blacklight handoff.' },
        { id: 'blacklight-bumper-rig', anchorX: 22400, type: 'bumper', count: 2, section: 'blacklight-backlot', purpose: 'Introduce the backlot with one deliberate bumper patrol.' },
        { id: 'blacklight-cotton-catwalk', anchorX: 23200, type: 'cotton', count: 2, section: 'blacklight-backlot', purpose: 'Create a soft bounce family beneath the first catwalk.' },
        { id: 'blacklight-pretzel-triple', anchorX: 24100, type: 'pretzel', count: 3, section: 'blacklight-backlot', purpose: 'Make the widest backlot floor pay off with a triple stomp.' },
        { id: 'blacklight-lemon-service-run', anchorX: 25100, type: 'lemon', count: 2, section: 'blacklight-backlot', purpose: 'Raise the late-level rhythm without crowding the checkpoint.' },
        { id: 'blacklight-corndog-rigging-pack', anchorX: 26100, type: 'corndog', count: 2, section: 'blacklight-backlot', purpose: 'Guard the rigging route with one bold silhouette family.' },
        { id: 'blacklight-popcorn-arena-queue', anchorX: 27100, type: 'popcorn', count: 2, section: 'blacklight-backlot', purpose: 'End ordinary combat cleanly before the Cornelius arena.' },
      ]),
      upper: Object.freeze([
        { id: 'blue-upper-popcorn-balcony', anchorX: 2200, type: 'popcorn', count: 2, role: 'platform-sentry', section: 'blue-hour-midway-arrival', purpose: 'Make the first neon prize balcony a visible risk-reward detour.' },
        { id: 'blue-upper-cotton-lantern-car', anchorX: 3500, type: 'cotton', count: 1, role: 'moving-guard', section: 'blue-hour-midway-arrival', purpose: 'Turn the moving lantern car into a patient wait-and-stomp beat.' },
        { id: 'blue-upper-pretzel-repair-catwalk', anchorX: 5700, type: 'pretzel', count: 2, role: 'platform-sentry', section: 'blue-hour-midway-arrival', purpose: 'Give the repair catwalk a bold elevated silhouette.' },
        { id: 'blue-upper-lemon-coaster-lookout', anchorX: 7100, type: 'lemon', count: 1, role: 'champion', section: 'neon-coaster-district', purpose: 'Cap the opening upper route before the delivery corridor.' },
        { id: 'prism-upper-cotton-mirror-deck', anchorX: 16000, type: 'cotton', count: 2, role: 'platform-sentry', section: 'prism-funhouse', purpose: 'Make the first mirror deck an obvious post-delivery climb.' },
        { id: 'prism-upper-bumper-spinner', anchorX: 17500, type: 'bumper', count: 1, role: 'moving-guard', section: 'prism-funhouse', purpose: 'Add one moving bumper guard above the garage.' },
        { id: 'prism-upper-pretzel-crown', anchorX: 19400, type: 'pretzel', count: 1, role: 'champion', section: 'prism-funhouse', purpose: 'Reward the player for climbing through the prism crown.' },
        { id: 'prism-upper-corndog-exit', anchorX: 21200, type: 'corndog', count: 2, role: 'platform-sentry', section: 'prism-funhouse', purpose: 'Give the funhouse exit bridge its own enemy silhouette.' },
        { id: 'blacklight-upper-popcorn-rail', anchorX: 22500, type: 'popcorn', count: 2, role: 'platform-sentry', section: 'blacklight-backlot', purpose: 'Start the optional blacklight route with a readable pair.' },
        { id: 'blacklight-upper-bumper-swing', anchorX: 24300, type: 'bumper', count: 1, role: 'moving-guard', section: 'blacklight-backlot', purpose: 'Turn the suspended bumper car into a calm timing challenge.' },
        { id: 'blacklight-upper-pretzel-prize-rig', anchorX: 26000, type: 'pretzel', count: 2, role: 'platform-sentry', section: 'blacklight-backlot', purpose: 'Make the prize rigging a rewarding two-stomp perch.' },
        { id: 'blacklight-upper-lemon-tempest-lookout', anchorX: 27200, type: 'lemon', count: 1, role: 'champion', section: 'blacklight-backlot', purpose: 'Cap the authored route before the popcorn tempest begins.' },
      ]),
    }),
    '3-3': Object.freeze({
      version: 'world3-3-combat-route-v2',
      combatWindows: Object.freeze([
        Object.freeze({ id: 'golden-starlight-launch', start: 650, end: 6500 }),
        Object.freeze({ id: 'celestial-ringway', start: 6500, end: 13500 }),
        Object.freeze({ id: 'nebula-carnival-gardens', start: 13500, end: 19000 }),
      ]),
      ground: Object.freeze([
        { id: 'launch-pretzel-pack', anchorX: 980, type: 'pretzel', count: 2, section: 'golden-starlight-launch', purpose: 'Open the finale with a generous two-stomp rocket-deck rhythm.' },
        { id: 'launch-lemon-pack', anchorX: 1900, type: 'lemon', count: 2, section: 'golden-starlight-launch', purpose: 'Teach the bright starway leap before the first dock.' },
        { id: 'launch-bumper-pack', anchorX: 3000, type: 'bumper', count: 3, section: 'golden-starlight-launch', purpose: 'Make the broad launch float pay off with a full stomp chain.' },
        { id: 'launch-corndog-pack', anchorX: 4200, type: 'corndog', count: 2, section: 'golden-starlight-launch', purpose: 'Raise pressure beneath the first rotating carnival ring.' },
        { id: 'launch-popcorn-pack', anchorX: 5500, type: 'popcorn', count: 2, section: 'golden-starlight-launch', purpose: 'Close the launch act cleanly before the ringway transition.' },
        { id: 'ringway-pretzel-pack', anchorX: 6800, type: 'pretzel', count: 2, section: 'celestial-ringway', purpose: 'Start the ringway with a readable rolling pair.' },
        { id: 'ringway-lemon-pack', anchorX: 7900, type: 'lemon', count: 3, section: 'celestial-ringway', purpose: 'Create a bright three-stomp sequence beneath the star hoops.' },
        { id: 'ringway-bumper-pack', anchorX: 9100, type: 'bumper', count: 2, section: 'celestial-ringway', purpose: 'Turn the rocket-ring station into a deliberate timing beat.' },
        { id: 'ringway-corndog-pack', anchorX: 10300, type: 'corndog', count: 2, section: 'celestial-ringway', purpose: 'Keep the lower ringway route active without crowding the upper climb.' },
        { id: 'ringway-popcorn-pack', anchorX: 11700, type: 'popcorn', count: 2, section: 'celestial-ringway', purpose: 'Finish the ringway with a calm landing into the nebula gardens.' },
        { id: 'nebula-pretzel-pack', anchorX: 13050, type: 'pretzel', count: 3, section: 'nebula-carnival-gardens', purpose: 'Make the first cosmic garden deck a premium stomp garden.' },
        { id: 'nebula-lemon-pack', anchorX: 14300, type: 'lemon', count: 2, section: 'nebula-carnival-gardens', purpose: 'Thread a controlled leap rhythm through the glowing blooms.' },
        { id: 'nebula-bumper-pack', anchorX: 15600, type: 'bumper', count: 2, section: 'nebula-carnival-gardens', purpose: 'Give the switchback floor a bright bumper-car pressure beat.' },
        { id: 'nebula-corndog-pack', anchorX: 17000, type: 'corndog', count: 2, section: 'nebula-carnival-gardens', purpose: 'Build the final ordinary route toward Olivia’s mooring.' },
        { id: 'nebula-popcorn-pack', anchorX: 18400, type: 'popcorn', count: 2, section: 'nebula-carnival-gardens', purpose: 'End combat with a clean final pair before the zeppelin parade.' },
      ]),
      upper: Object.freeze([
        { id: 'launch-upper-pretzel-sentry', anchorX: 1500, type: 'pretzel', count: 2, role: 'platform-sentry', section: 'golden-starlight-launch', purpose: 'Make the first rocket float an obvious high-route prize.' },
        { id: 'launch-upper-lemon-moving', anchorX: 2700, type: 'lemon', count: 1, role: 'moving-guard', section: 'golden-starlight-launch', purpose: 'Turn the drifting launch pad into a patient timing challenge.' },
        { id: 'launch-upper-bumper-helper', anchorX: 4050, type: 'bumper', count: 1, role: 'route-helper', section: 'golden-starlight-launch', purpose: 'Provide a forgiving bounce route onto the launch crown.' },
        { id: 'launch-upper-corndog-sentry', anchorX: 5350, type: 'corndog', count: 2, role: 'platform-sentry', section: 'golden-starlight-launch', purpose: 'Reward a clean climb before the first star-ring turn.' },
        { id: 'ringway-upper-popcorn-sentry', anchorX: 7000, type: 'popcorn', count: 2, role: 'platform-sentry', section: 'celestial-ringway', purpose: 'Give the ringway opening a visible upper silhouette.' },
        { id: 'ringway-upper-pretzel-moving', anchorX: 8500, type: 'pretzel', count: 1, role: 'moving-guard', section: 'celestial-ringway', purpose: 'Make the rotating ring platform a calm wait-and-stomp test.' },
        { id: 'ringway-upper-lemon-champion', anchorX: 10100, type: 'lemon', count: 1, role: 'champion', section: 'celestial-ringway', purpose: 'Place a premium stomp above the rocket-ring station.' },
        { id: 'ringway-upper-bumper-sentry', anchorX: 11900, type: 'bumper', count: 2, role: 'platform-sentry', section: 'celestial-ringway', purpose: 'Cap the optional ringway route with a bold bumper pair.' },
        { id: 'nebula-upper-corndog-sentry', anchorX: 13400, type: 'corndog', count: 2, role: 'platform-sentry', section: 'nebula-carnival-gardens', purpose: 'Make the first nebula bloom deck reward an intentional climb.' },
        { id: 'nebula-upper-pretzel-moving', anchorX: 14900, type: 'pretzel', count: 1, role: 'moving-guard', section: 'nebula-carnival-gardens', purpose: 'Add a moving guard to the garden switchback.' },
        { id: 'nebula-upper-lemon-champion', anchorX: 16600, type: 'lemon', count: 1, role: 'champion', section: 'nebula-carnival-gardens', purpose: 'Reward the highest garden landing before the mooring.' },
        { id: 'nebula-upper-popcorn-champion', anchorX: 18200, type: 'popcorn', count: 1, role: 'champion', section: 'nebula-carnival-gardens', purpose: 'Cap the final optional route before Olivia takes the lead.' },
      ]),
    }),
  });
  const world3RemasterPlan = WORLD3_REMASTER_PLANS[levelId];
  const CLOUDTOP_ROUTE_VERSION = 'cloudtop-five-act-route-v2';
  const CLOUDTOP_ROUTE_ACTS = Object.freeze([
    Object.freeze({
      id: 'carnival-sunrise-gates',
      start: 0,
      end: 6500,
      widths: Object.freeze([960, 740, 1100, 820]),
      gaps: Object.freeze([72, 96, 112, 80]),
      silhouette: 'welcoming-cloud-arches',
    }),
    Object.freeze({
      id: 'balloon-bazaar-runway',
      start: 6500,
      end: 15400,
      widths: Object.freeze([1200, 980, 1320]),
      gaps: Object.freeze([68, 84, 72]),
      silhouette: 'wide-clear-delivery-runway',
    }),
    Object.freeze({
      id: 'high-noon-skyway',
      start: 15400,
      end: 21500,
      widths: Object.freeze([780, 1040, 700, 1180]),
      gaps: Object.freeze([92, 124, 86, 112]),
      silhouette: 'alternating-sky-ride-ramps',
    }),
    Object.freeze({
      id: 'cotton-candy-sunset-rides',
      start: 21500,
      end: 28700,
      widths: Object.freeze([640, 880, 720, 1040]),
      gaps: Object.freeze([118, 88, 134, 104]),
      silhouette: 'suspended-sunset-ride-chain',
    }),
    Object.freeze({
      id: 'starlight-pinata-parade',
      start: 28700,
      end: WORLD_WIDTH,
      widths: Object.freeze([1280, 1180, 1440]),
      gaps: Object.freeze([62, 78, 58]),
      silhouette: 'broad-enemy-free-parade',
    }),
  ]);
  const CLOUDTOP_UPPER_ROUTE = Object.freeze([
    // Sunrise cloud gates: short arches introduce the optional upper route.
    Object.freeze({ id: 'sunrise-gate-step-a', x: 1180, y: 354, w: 176, act: 'carnival-sunrise-gates', role: 'gate-step', enemySupport: false }),
    Object.freeze({ id: 'sunrise-gate-sentry', x: 2070, y: 334, w: 260, act: 'carnival-sunrise-gates', role: 'gate-arch', golden: true }),
    Object.freeze({ id: 'sunrise-candy-lift', x: 3390, y: 330, w: 188, act: 'carnival-sunrise-gates', role: 'candy-lift', golden: true }),
    Object.freeze({ id: 'sunrise-moving-cloud', x: 5650, y: 344, w: 260, act: 'carnival-sunrise-gates', role: 'moving-cloud', moving: true, axis: 'y', range: 10, speed: 1.05, phase: 0.6 }),
    Object.freeze({ id: 'sunrise-balloon-lookout', x: 6660, y: 330, w: 190, act: 'balloon-bazaar-runway', role: 'balloon-lookout' }),

    // High-noon skyway: broad sentry decks alternate with moving ride cars.
    Object.freeze({ id: 'noon-carousel-deck', x: 16470, y: 334, w: 260, act: 'high-noon-skyway', role: 'carousel-deck', golden: true }),
    Object.freeze({ id: 'noon-moving-ride', x: 18390, y: 342, w: 190, act: 'high-noon-skyway', role: 'moving-ride', moving: true, axis: 'y', range: 8, speed: 1.12, phase: 1.4 }),
    Object.freeze({ id: 'noon-prize-balcony', x: 20390, y: 328, w: 190, act: 'high-noon-skyway', role: 'prize-balcony', golden: true }),
    Object.freeze({ id: 'sunset-suspension-deck', x: 22370, y: 336, w: 260, act: 'cotton-candy-sunset-rides', role: 'suspension-deck' }),
    Object.freeze({ id: 'sunset-cloud-swing', x: 24390, y: 326, w: 190, act: 'cotton-candy-sunset-rides', role: 'cloud-swing', moving: true, axis: 'x', range: 16, speed: 0.9, phase: 2.2, golden: true }),
    Object.freeze({ id: 'sunset-star-balcony', x: 26390, y: 328, w: 190, act: 'cotton-candy-sunset-rides', role: 'star-balcony', golden: true }),
    Object.freeze({ id: 'sunset-final-ride', x: 27530, y: 334, w: 240, act: 'cotton-candy-sunset-rides', role: 'final-ride', enemySupport: false }),

    // Starlight parade platforms are reward-only and keep the finale combat-free.
    Object.freeze({ id: 'parade-star-step', x: 30320, y: 346, w: 210, act: 'starlight-pinata-parade', role: 'parade-step', enemySupport: false }),
    Object.freeze({ id: 'parade-ticket-balcony', x: 31520, y: 330, w: 230, act: 'starlight-pinata-parade', role: 'parade-balcony', enemySupport: false, golden: true }),
  ]);
  const MIDNIGHT_ROUTE_VERSION = 'midnight-six-act-route-v2';
  const MIDNIGHT_ROUTE_ACTS = Object.freeze([
    Object.freeze({
      id: 'blue-hour-midway-arrival',
      start: 0,
      end: 6800,
      widths: Object.freeze([920, 720, 1080, 820]),
      gaps: Object.freeze([72, 96, 118, 84]),
      silhouette: 'ticket-arch-switchbacks',
    }),
    Object.freeze({
      id: 'neon-coaster-district',
      start: 6800,
      end: 14800,
      widths: Object.freeze([1200, 980, 1320]),
      gaps: Object.freeze([64, 78, 68]),
      silhouette: 'wide-clear-coaster-runway',
    }),
    Object.freeze({
      id: 'prism-funhouse',
      start: 14800,
      end: 22000,
      widths: Object.freeze([720, 1040, 680, 1160]),
      gaps: Object.freeze([112, 88, 136, 104]),
      silhouette: 'mirror-step-zigzag',
    }),
    Object.freeze({
      id: 'blacklight-backlot',
      start: 22000,
      end: 27800,
      widths: Object.freeze([640, 880, 760, 1040]),
      gaps: Object.freeze([124, 96, 138, 108]),
      silhouette: 'suspended-backlot-chain',
    }),
    Object.freeze({
      id: 'popcorn-tempest-arena',
      start: 27800,
      end: 31800,
      widths: Object.freeze([4000]),
      gaps: Object.freeze([0]),
      silhouette: 'continuous-three-hit-arena',
    }),
    Object.freeze({
      id: 'golden-midnight-victory',
      start: 31800,
      end: WORLD_WIDTH,
      widths: Object.freeze([3200]),
      gaps: Object.freeze([0]),
      silhouette: 'broad-enemy-free-encore',
    }),
  ]);
  const MIDNIGHT_UPPER_ROUTE = Object.freeze([
    // Blue-hour ticket arches establish a readable optional route.
    Object.freeze({ id: 'midnight-ticket-step', x: 1180, y: 354, w: 176, act: 'blue-hour-midway-arrival', role: 'ticket-step', enemySupport: false }),
    Object.freeze({ id: 'midnight-prize-balcony', x: 2070, y: 334, w: 260, act: 'blue-hour-midway-arrival', role: 'prize-balcony', golden: true }),
    Object.freeze({ id: 'midnight-lantern-car', x: 3390, y: 342, w: 190, act: 'blue-hour-midway-arrival', role: 'lantern-car', moving: true, axis: 'y', range: 8, speed: 1.04, phase: 0.7 }),
    Object.freeze({ id: 'midnight-repair-catwalk', x: 5490, y: 332, w: 260, act: 'blue-hour-midway-arrival', role: 'repair-catwalk', golden: true }),
    Object.freeze({ id: 'midnight-coaster-lookout', x: 7040, y: 338, w: 220, act: 'neon-coaster-district', role: 'coaster-lookout', golden: true }),

    // Prism Funhouse alternates broad sentry decks and moving ride cars.
    Object.freeze({ id: 'midnight-prism-mirror-deck', x: 15820, y: 334, w: 260, act: 'prism-funhouse', role: 'mirror-deck', golden: true }),
    Object.freeze({ id: 'midnight-prism-spinner', x: 17480, y: 340, w: 190, act: 'prism-funhouse', role: 'spinning-car', moving: true, axis: 'y', range: 8, speed: 1.13, phase: 1.5 }),
    Object.freeze({ id: 'midnight-prism-crown', x: 19340, y: 326, w: 260, act: 'prism-funhouse', role: 'prism-crown', golden: true }),
    Object.freeze({ id: 'midnight-prism-exit-bridge', x: 21060, y: 338, w: 230, act: 'prism-funhouse', role: 'funhouse-exit' }),

    // The Blacklight Backlot becomes the densest risk-reward route before the boss.
    Object.freeze({ id: 'midnight-blacklight-bumper-rail', x: 22360, y: 334, w: 260, act: 'blacklight-backlot', role: 'bumper-rail' }),
    Object.freeze({ id: 'midnight-blacklight-swing', x: 24180, y: 328, w: 190, act: 'blacklight-backlot', role: 'suspended-bumper', moving: true, axis: 'x', range: 16, speed: 0.92, phase: 2.3, golden: true }),
    Object.freeze({ id: 'midnight-blacklight-prize-rig', x: 25920, y: 326, w: 260, act: 'blacklight-backlot', role: 'prize-rig', golden: true }),
    Object.freeze({ id: 'midnight-tempest-lookout', x: 27080, y: 334, w: 230, act: 'blacklight-backlot', role: 'tempest-lookout', golden: true }),
    Object.freeze({ id: 'midnight-arena-queue-step', x: 27620, y: 350, w: 150, act: 'blacklight-backlot', role: 'arena-queue-step', enemySupport: false }),
  ]);
  const NOVA_ROUTE_VERSION = 'nova-six-act-route-v2';
  const NOVA_ROUTE_ACTS = Object.freeze([
    Object.freeze({
      id: 'golden-starlight-launch',
      start: 0,
      end: 6500,
      widths: Object.freeze([720, 860, 640, 980]),
      gaps: Object.freeze([68, 94, 82, 106]),
      silhouette: 'rocket-parade-floats',
    }),
    Object.freeze({
      id: 'celestial-ringway',
      start: 6500,
      end: 13500,
      widths: Object.freeze([620, 760, 560, 920]),
      gaps: Object.freeze([92, 118, 86, 112]),
      silhouette: 'rotating-carnival-ringway',
    }),
    Object.freeze({
      id: 'nebula-carnival-gardens',
      start: 13500,
      end: 19800,
      widths: Object.freeze([820, 620, 900, 660]),
      gaps: Object.freeze([82, 118, 96, 132]),
      silhouette: 'nebula-garden-switchbacks',
    }),
    Object.freeze({
      id: 'zeppelin-star-parade',
      start: 19800,
      end: 27600,
      widths: Object.freeze([1240, 1180, 1460]),
      gaps: Object.freeze([58, 72, 64]),
      silhouette: 'wide-clear-zeppelin-parade',
    }),
    Object.freeze({
      id: 'radish-eclipse-arena',
      start: 27600,
      end: 31500,
      widths: Object.freeze([3900]),
      gaps: Object.freeze([0]),
      silhouette: 'ringmaster-eclipse-arena',
    }),
    Object.freeze({
      id: 'taco-nova-ascension',
      start: 31500,
      end: WORLD_WIDTH,
      widths: Object.freeze([3500]),
      gaps: Object.freeze([0]),
      silhouette: 'enemy-free-taco-nova-ascension',
    }),
  ]);
  const NOVA_UPPER_ROUTE = Object.freeze([
    // Launch floats create the first optional climb, with one deliberate bounce helper.
    Object.freeze({ id: 'nova-launch-rocket-float', x: 1420, y: 348, w: 230, act: 'golden-starlight-launch', role: 'rocket-float', golden: true }),
    Object.freeze({ id: 'nova-launch-orbit-pad', x: 2660, y: 338, w: 190, act: 'golden-starlight-launch', role: 'orbit-pad', moving: true, axis: 'y', range: 10, speed: 1.06, phase: 0.7 }),
    Object.freeze({ id: 'nova-launch-comet-deck', x: 4010, y: 334, w: 260, act: 'golden-starlight-launch', role: 'comet-deck', golden: true }),
    Object.freeze({ id: 'nova-launch-star-dock', x: 5340, y: 334, w: 220, act: 'golden-starlight-launch', role: 'star-dock' }),

    // Ringway platforms alternate fixed hoop decks and gently drifting carnival cars.
    Object.freeze({ id: 'nova-ringway-hoop-deck', x: 6940, y: 344, w: 250, act: 'celestial-ringway', role: 'hoop-deck', golden: true }),
    Object.freeze({ id: 'nova-ringway-rocket-car', x: 8420, y: 312, w: 200, act: 'celestial-ringway', role: 'rocket-car', moving: true, axis: 'y', range: 9, speed: 1.12, phase: 1.3 }),
    Object.freeze({ id: 'nova-ringway-prize-arch', x: 10020, y: 332, w: 270, act: 'celestial-ringway', role: 'prize-arch', golden: true }),
    Object.freeze({ id: 'nova-ringway-comet-turn', x: 11840, y: 300, w: 230, act: 'celestial-ringway', role: 'comet-turn', moving: true, axis: 'x', range: 14, speed: 0.94, phase: 2.1 }),

    // The nebula garden is the highest-risk optional route before Olivia appears.
    Object.freeze({ id: 'nova-nebula-bloom-deck', x: 13320, y: 344, w: 270, act: 'nebula-carnival-gardens', role: 'bloom-deck' }),
    Object.freeze({ id: 'nova-nebula-switchback', x: 14860, y: 308, w: 210, act: 'nebula-carnival-gardens', role: 'switchback', moving: true, axis: 'y', range: 10, speed: 1.08, phase: 1.7, golden: true }),
    Object.freeze({ id: 'nova-nebula-comet-balcony', x: 16480, y: 334, w: 280, act: 'nebula-carnival-gardens', role: 'comet-balcony' }),
    Object.freeze({ id: 'nova-nebula-moon-garden', x: 18100, y: 334, w: 250, act: 'nebula-carnival-gardens', role: 'moon-garden', golden: true }),

    // The zeppelin parade uses its own moving delivery chain below.
    Object.freeze({ id: 'nova-ascension-star-step', x: 32300, y: 346, w: 220, act: 'taco-nova-ascension', role: 'ascension-step', enemySupport: false }),
    Object.freeze({ id: 'nova-ascension-taco-star', x: 33800, y: 344, w: 250, act: 'taco-nova-ascension', role: 'taco-star', enemySupport: false, golden: true }),
  ]);
  const KICKOFF_ENVIRONMENT_TRANSITION = 1600;
  const KICKOFF_ENVIRONMENT_STAGES = [
    {
      id: 'carnival-sunrise',
      name: 'Carnival Sunrise',
      start: 0,
      end: 6500,
      image: 'envSunrise',
      night: 0,
      warmth: 0.34,
    },
    {
      id: 'balloon-bazaar',
      name: 'Balloon Bazaar',
      start: 6500,
      end: 14200,
      image: 'envBalloon',
      night: 0,
      warmth: 0.08,
    },
    {
      id: 'high-noon-skyway',
      name: 'High-Noon Skyway',
      start: 14200,
      end: 21500,
      image: 'envNoon',
      night: 0,
      warmth: 0,
    },
    {
      id: 'cotton-candy-sunset',
      name: 'Cotton-Candy Sunset',
      start: 21500,
      end: 28700,
      image: 'envSunset',
      night: 0.28,
      warmth: 0.42,
    },
    {
      id: 'starlight-pinata-parade',
      name: 'Starlight Piñata Parade',
      start: 28700,
      end: WORLD_WIDTH,
      image: 'envStarlight',
      night: 1,
      warmth: 0.08,
    },
  ];
  const MIDNIGHT_ENVIRONMENT_TRANSITION = 1600;
  const MIDNIGHT_ENVIRONMENT_STAGES = [
    {
      id: 'blue-hour-midway-arrival',
      name: 'Blue-Hour Midway Arrival',
      start: 0,
      end: 6800,
      image: 'midnightBlueHour',
      glow: 0.22,
      coaster: 0,
      prism: 0,
      storm: 0,
      victory: 0,
    },
    {
      id: 'neon-coaster-district',
      name: 'Neon Coaster District',
      start: 6800,
      end: 14800,
      image: 'midnightCoaster',
      glow: 0.72,
      coaster: 1,
      prism: 0.08,
      storm: 0,
      victory: 0,
    },
    {
      id: 'prism-funhouse',
      name: 'Prism Funhouse',
      start: 14800,
      end: 22000,
      image: 'midnightFunhouse',
      glow: 0.82,
      coaster: 0.22,
      prism: 1,
      storm: 0,
      victory: 0,
    },
    {
      id: 'blacklight-backlot',
      name: 'Blacklight Backlot',
      start: 22000,
      end: 27800,
      image: 'midnightBlacklight',
      glow: 0.46,
      coaster: 0,
      prism: 0.28,
      storm: 0.18,
      victory: 0,
    },
    {
      id: 'popcorn-tempest-arena',
      name: 'Popcorn Tempest Arena',
      start: 27800,
      end: 31800,
      image: 'midnightTempest',
      glow: 0.58,
      coaster: 0,
      prism: 0,
      storm: 1,
      victory: 0,
    },
    {
      id: 'golden-midnight-victory',
      name: 'Golden Midnight Victory',
      start: 31800,
      end: WORLD_WIDTH,
      image: 'midnightVictory',
      glow: 1,
      coaster: 0,
      prism: 0.3,
      storm: 0,
      victory: 1,
    },
  ];
  const NOVA_ENVIRONMENT_TRANSITION = 1600;
  const NOVA_ENVIRONMENT_STAGES = [
    {
      id: 'golden-starlight-launch',
      name: 'Golden Starlight Launch',
      start: 0,
      end: 6500,
      image: 'novaLaunch',
      stars: 0.34,
      rings: 0.08,
      nebula: 0.08,
      comets: 0,
      eclipse: 0,
      victory: 0,
    },
    {
      id: 'celestial-ringway',
      name: 'Celestial Ringway',
      start: 6500,
      end: 13500,
      image: 'novaRingway',
      stars: 0.66,
      rings: 1,
      nebula: 0.14,
      comets: 0.12,
      eclipse: 0,
      victory: 0,
    },
    {
      id: 'nebula-carnival-gardens',
      name: 'Nebula Carnival Gardens',
      start: 13500,
      end: 19800,
      image: 'novaNebula',
      stars: 0.74,
      rings: 0.32,
      nebula: 1,
      comets: 0.16,
      eclipse: 0,
      victory: 0,
    },
    {
      id: 'zeppelin-star-parade',
      name: 'Zeppelin Star Parade',
      start: 19800,
      end: 27600,
      image: 'novaZeppelin',
      stars: 0.92,
      rings: 0.24,
      nebula: 0.48,
      comets: 1,
      eclipse: 0,
      victory: 0,
    },
    {
      id: 'radish-eclipse-arena',
      name: 'Radish Eclipse Arena',
      start: 27600,
      end: 31500,
      image: 'novaEclipse',
      stars: 0.42,
      rings: 0.4,
      nebula: 0.42,
      comets: 0.08,
      eclipse: 1,
      victory: 0,
    },
    {
      id: 'taco-nova-ascension',
      name: 'Taco Nova Ascension',
      start: 31500,
      end: WORLD_WIDTH,
      image: 'novaAscension',
      stars: 1,
      rings: 0.72,
      nebula: 0.74,
      comets: 0.28,
      eclipse: 0,
      victory: 1,
    },
  ];
  const FINALE_CONFIGS = {
    '3-1': {
      label: 'CLOUDTOP PIÑATA PARADE',
      activity: 'piñata-parade',
      announcement: 'CLOUDTOP PIÑATA PARADE!',
      subline: 'Rainbow tacos, balloon dancing, and one extremely defeated piñata',
    },
    '3-2': {
      label: 'MIDNIGHT MIDWAY ENCORE',
      activity: 'midnight-midway-encore',
      announcement: 'MIDNIGHT MIDWAY ENCORE!',
      subline: 'Three stomp pads relight every ride before the victory lap',
    },
    '3-3': {
      label: 'TACO NOVA STAR LAUNCH',
      activity: 'star-launch',
      announcement: 'TACO NOVA STAR LAUNCH!',
      subline: 'Olivia has parked the zeppelin approximately on purpose',
    },
  };
  const finaleConfig = FINALE_CONFIGS[levelId];

  const ui = {
    startOverlay: document.getElementById('startOverlay'),
    winOverlay: document.getElementById('winOverlay'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    muteBtn: document.getElementById('muteBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    musicVolume: document.getElementById('musicVolume'),
    musicVolumeValue: document.getElementById('musicVolumeValue'),
    effectsVolume: document.getElementById('effectsVolume'),
    effectsVolumeValue: document.getElementById('effectsVolumeValue'),
    reducedShake: document.getElementById('reducedShake'),
    personalBestText: document.getElementById('personalBestText'),
    medalBadge: document.getElementById('medalBadge'),
    resultScore: document.getElementById('resultScore'),
    resultTime: document.getElementById('resultTime'),
    resultTacos: document.getElementById('resultTacos'),
    resultGolden: document.getElementById('resultGolden'),
    resultNova: document.getElementById('resultNova'),
    resultSetPiece: document.getElementById('resultSetPiece'),
    winText: document.getElementById('winText'),
    newBestText: document.getElementById('newBestText'),
  };

  const imageSources = {
    hero: 'assets/taco_hero_sheet.png',
    items: 'assets/items_sheet.png',
    far: 'assets/world3_far_sky_v1.png',
    middle: 'assets/world3_midground_v1.png',
    near: 'assets/world3_near_scenery_v1.png',
    terrain: 'assets/world3_terrain_rides_v1.png',
    olivia: 'assets/world3_olivia_vehicles_v1.png',
    enemies: 'assets/world3_enemies_bosses_v1.png',
    finale: 'assets/world3_checkpoints_fiesta_v1.png',
    ...(levelId === '3-1' ? {
      middleKickoff: 'assets/world3_1_midground_hd_v2.png',
      nearKickoff: 'assets/world3_1_near_hd_v2.png',
      envSunrise: 'assets/world3_1_env_sunrise_v1.webp',
      envBalloon: 'assets/world3_1_env_balloon_v1.webp',
      envNoon: 'assets/world3_1_env_noon_v1.webp',
      envSunset: 'assets/world3_1_env_sunset_v1.webp',
      envStarlight: 'assets/world3_1_env_starlight_v1.webp',
    } : {}),
    ...(levelId === '3-2' ? {
      midnightBlueHour: 'assets/world3_2_env_blue_hour_v1.webp',
      midnightCoaster: 'assets/world3_2_env_coaster_v1.webp',
      midnightFunhouse: 'assets/world3_2_env_funhouse_v1.webp',
      midnightBlacklight: 'assets/world3_2_env_blacklight_v1.webp',
      midnightTempest: 'assets/world3_2_env_tempest_v1.webp',
      midnightVictory: 'assets/world3_2_env_victory_v1.webp',
    } : {}),
    ...(levelId === '3-3' ? {
      novaLaunch: 'assets/world3_3_env_launch_v1.webp',
      novaRingway: 'assets/world3_3_env_ringway_v1.webp',
      novaNebula: 'assets/world3_3_env_nebula_v1.webp',
      novaZeppelin: 'assets/world3_3_env_zeppelin_v1.webp',
      novaEclipse: 'assets/world3_3_env_eclipse_v1.webp',
      novaAscension: 'assets/world3_3_env_nova_v1.webp',
    } : {}),
  };
  const images = {};
  Object.entries(imageSources).forEach(([key, src]) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    images[key] = image;
  });

  const tracks = {};
  document.querySelectorAll('[data-world3-music]').forEach((audio) => {
    tracks[audio.dataset.world3Music] = audio;
    audio.volume = 0;
  });
  audio?.registerMusicTracks(tracks);
  const keys = { left: false, right: false, jump: false };
  const inputSources = {
    keyboard: { left: false, right: false, jump: false },
    touch: { left: false, right: false, jump: false },
    controller: { left: false, right: false, jump: false },
  };
  const touchPointers = {
    left: new Set(),
    right: new Set(),
    jump: new Set(),
  };
  const world = {
    platforms: [],
    collectibles: [],
    enemies: [],
    checkpoints: [],
    projectiles: [],
    goal: { x: 34670, y: 300, w: 130, h: 158 },
    pinata: null,
    finalePinata: null,
    boss: null,
  };
  const createCloudtopFinaleState = () => ({
    active: false,
    phase: 'waiting',
    timer: 0,
    heroStartX: 0,
    truckX: WORLD_WIDTH + 620,
    truckStopX: WORLD_WIDTH - 260,
    oliviaX: WORLD_WIDTH - 205,
    oliviaY: GROUND_Y - 118,
    oliviaVisible: false,
    brakeEffectPlayed: false,
    arrivalCheerPlayed: false,
    rainElapsed: 0,
    rainSpawnTimer: 0,
    rainRemaining: 0,
    rainSpawned: 0,
    voiceLineTimer: 0,
    voiceLineIndex: -1,
    catchPoseTimer: 0,
    catchCount: 0,
    fireworkBeat: -1,
    bannerReveal: 0,
    slowMotionTimer: 0,
  });
  const createMidnightFinaleState = () => ({
    active: false,
    phase: 'waiting',
    timer: 0,
    heroStartX: 0,
    coasterX: world.goal.x + 720,
    coasterY: GROUND_Y - 142,
    coasterStopX: world.goal.x + 42,
    oliviaX: world.goal.x + 90,
    oliviaY: GROUND_Y - 118,
    oliviaVisible: false,
    brakeEffectPlayed: false,
    arrivalCheerPlayed: false,
    padCount: 0,
    padAirborne: false,
    padCooldown: 0,
    relight: 0,
    relightAnnounced: false,
    fireworkBeat: -1,
    bannerReveal: 0,
    pads: [
      { x: world.goal.x - 570, label: MIDNIGHT_PAD_LABELS[0] },
      { x: world.goal.x - 345, label: MIDNIGHT_PAD_LABELS[1] },
      { x: world.goal.x - 120, label: MIDNIGHT_PAD_LABELS[2] },
    ],
  });
  const createCosmicFinaleState = () => ({
    active: false,
    phase: 'waiting',
    timer: 0,
    totalTime: 0,
    finishTime: 0,
    heartbeatBeat: -1,
    litStars: 0,
    relightWave: 0,
    lastRelitStar: -1,
    goldenTaco: {
      active: false,
      caught: false,
      magnetized: false,
      x: world.goal.x + 180,
      y: 220,
      w: 58,
      h: 44,
      vx: -205,
      vy: -125,
      rotation: -0.18,
    },
    bonusSpawned: false,
    bonusCollected: 0,
    novaBeat: -1,
    oliviaVisible: false,
    oliviaX: world.goal.x + 130,
    oliviaY: 118,
    fistBumpPlayed: false,
    maximumCrunchReveal: 0,
    allLevelsReveal: 0,
  });
  const player = {
    x: 140, y: 360, w: 42, h: 48, vx: 0, vy: 0, dir: 1,
    previousBottom: 408, grounded: false, platform: null, coyote: 0, jumpBuffer: 0,
    invulnerable: 0, anim: 0, rotation: 0, scale: 1,
  };
  const game = {
    state: 'title',
    score: 0,
    collected: 0,
    totalCollectibles: 0,
    goldenCollected: 0,
    totalGolden: 8,
    hearts: 3,
    cameraX: 0,
    levelTime: 0,
    finishTime: 0,
    sectionIndex: 0,
    announcedSections: new Set(),
    latestCheckpoint: null,
    message: '',
    messageTimer: 0,
    subMessage: '',
    subMessageTimer: 0,
    abilities: sharedAbilities.createState(),
    novaCharge: 0,
    novaBestCharge: 0,
    novaTimer: 0,
    novaCount: 0,
    novaFlash: 0,
    finalTacosCollected: 0,
    eclipseBreakTimer: 0,
    eclipseBreakDuration: 3.2,
    spawnedBonusTacos: 0,
    splatCombo: 0,
    splatTimer: 0,
    bestSplat: 0,
    vehicle: {
      state: 'waiting',
      x: 0,
      y: 250,
      baseY: 250,
      timer: 0,
      dropTimer: 0,
      clackBeat: -1,
      launcherPulse: 0,
      throwCount: 0,
      catches: 0,
    },
    particles: [],
    impactTexts: [],
    fireworks: [],
    cameraShake: 0,
    hitStop: 0,
    hitStopEvents: 0,
    hitStopRecoveries: 0,
    maxHitStop: 0,
    lastHitStopSource: 'none',
    celebrationTime: 0,
    celebrationBeat: -1,
    resultsShown: false,
    sceneryBlend: 0,
    muted: false,
    musicVolume: 0.7,
    musicDuck: 1,
    effectsVolume: 0.82,
    reducedShake: false,
    settingsOpen: false,
    activeMusic: null,
    musicTransition: null,
    musicToken: 0,
    respawn: heroCore.createRespawnState(),
    setPieceComplete: false,
    lastInput: 'none',
    visibilityPaused: false,
    victoryDashAnnounced: false,
    finalePrompted: false,
    cloudtopFinale: createCloudtopFinaleState(),
    midnightFinale: createMidnightFinaleState(),
    cosmicFinale: createCosmicFinaleState(),
    respawnCount: 0,
    respawnFallbacks: 0,
    lastRespawnLanding: 'none',
    controllerStateSequence: 0,
    controllerStateSyncs: 0,
    personalBest: { score: 0, time: 0, runs: 0 },
    audioAbilityState: { magnet: false, frenzy: false },
  };

  let ambienceLoop = null;
  let vehicleIdleLoop = null;
  let lastFrame = 0;
  let randomSeed = 0x57A21A;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const seeded = () => {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };

  function syncInputs() {
    ['left', 'right', 'jump'].forEach((input) => {
      keys[input] = Object.values(inputSources).some((source) => source[input]);
    });
  }

  function setDigitalInput(source, input, pressed) {
    if (!inputSources[source] || !(input in keys)) return;
    const wasPressed = inputSources[source][input];
    inputSources[source][input] = Boolean(pressed);
    syncInputs();
    if (pressed) game.lastInput = source;
    if (input === 'jump' && pressed && !wasPressed) player.jumpBuffer = heroPhysics.jumpBufferTime;
  }

  function clearInputSource(source) {
    if (!inputSources[source]) return;
    if (source === 'touch') Object.values(touchPointers).forEach((pointers) => pointers.clear());
    Object.assign(inputSources[source], { left: false, right: false, jump: false });
    syncInputs();
  }

  function clearAllInputs() {
    Object.values(touchPointers).forEach((pointers) => pointers.clear());
    Object.keys(inputSources).forEach((source) => {
      Object.assign(inputSources[source], { left: false, right: false, jump: false });
    });
    syncInputs();
  }

  function setTouchInput(input, pressed, pointerId) {
    const pointers = touchPointers[input];
    if (!pointers) return;
    if (pressed) pointers.add(pointerId);
    else pointers.delete(pointerId);
    setDigitalInput('touch', input, pointers.size > 0);
  }

  function releaseTouchPointer(pointerId) {
    Object.entries(touchPointers).forEach(([input, pointers]) => {
      if (!pointers.delete(pointerId)) return;
      setDigitalInput('touch', input, pointers.size > 0);
    });
  }
  const currentSection = (x = player.x) => config.sections.find((section) => x >= section.start && x < section.end) || config.sections.at(-1);
  const formatTime = (seconds) => {
    const whole = Math.max(0, Math.round(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };

  function addPlatform(data) {
    const platform = {
      dx: 0,
      dy: 0,
      moving: false,
      ...data,
      id: data.id || `world3-platform-${world.platforms.length + 1}`,
    };
    platform.baseX = platform.x;
    platform.baseY = platform.y;
    world.platforms.push(platform);
    return platform;
  }

  function addItem(x, y, type = 'taco', extra = {}) {
    const size = type === 'golden' ? 30 : 24;
    const item = { x, y, w: size, h: size, type, bob: seeded() * Math.PI * 2, collected: false, vx: 0, vy: 0, dynamic: false, ...extra };
    world.collectibles.push(item);
    return item;
  }

  function addLine(x, y, count, gap = 52, type = 'taco') {
    for (let index = 0; index < count; index += 1) addItem(x + index * gap, y, type, { bob: index * 0.32 });
  }

  function addArc(x, y, count, gap = 52, height = 86, type = 'taco') {
    for (let index = 0; index < count; index += 1) {
      const t = count === 1 ? 0 : index / (count - 1);
      addItem(x + index * gap, y - Math.sin(t * Math.PI) * height, type, { bob: t * Math.PI });
    }
  }

  function registerBonusTacos(count) {
    game.spawnedBonusTacos += count;
    game.totalCollectibles += count;
  }

  function groundAt(x) {
    return world.platforms.find((platform) => platform.ground && x >= platform.x + 30 && x <= platform.x + platform.w - 30);
  }

  function placeFootprintOnGround(desiredLeft, width, edgeInset = 18) {
    const candidates = world.platforms
      .filter((platform) => platform.ground && platform.w >= width + edgeInset * 2)
      .map((platform) => {
        const minX = platform.x + edgeInset;
        const maxX = platform.x + platform.w - width - edgeInset;
        const x = clamp(desiredLeft, minX, maxX);
        return { platform, x, distance: Math.abs(x - desiredLeft) };
      })
      .sort((left, right) => left.distance - right.distance || left.x - right.x);
    return candidates[0] || null;
  }

  function footprintIsGrounded(left, width, groundY, edgeInset = 0) {
    return world.platforms.some((platform) => (
      platform.ground
      && left >= platform.x + edgeInset - 0.01
      && left + width <= platform.x + platform.w - edgeInset + 0.01
      && Math.abs(platform.y - groundY) < 0.01
    ));
  }

  function victoryRouteStart() {
    if (config.boss) return config.boss.gateX;
    if (config.pinataX) return config.pinataX + 420;
    return 32600;
  }

  function world3CombatWindowAt(x) {
    return Boolean(world3RemasterPlan?.combatWindows.some((window) => x >= window.start && x < window.end));
  }

  function world3ForbiddenRanges() {
    const ranges = [];
    if (config.vehicle) {
      ranges.push({ id: 'olivia-vehicle', start: config.vehicle.start - 460, end: config.vehicle.end + 460 });
    }
    if (config.pinataX) {
      ranges.push({ id: 'rainbow-pinata', start: config.pinataX - 520, end: config.pinataX + 520 });
    }
    if (config.boss) {
      ranges.push({ id: 'boss-approach', start: config.boss.x - 1300, end: config.boss.gateX + 300 });
    }
    ranges.push({ id: 'victory-route', start: victoryRouteStart() - 90, end: WORLD_WIDTH + 1 });
    return ranges;
  }

  function world3PlatformOverlapsForbidden(platform, edgePadding = 0) {
    if (!platform) return true;
    return world3ForbiddenRanges().some((range) => (
      platform.x < range.end + edgePadding
      && platform.x + platform.w > range.start - edgePadding
    ));
  }

  function world3GroundSupport(anchorX, usedIds = new Set()) {
    const candidates = world.platforms
      .filter((platform) => platform.ground && platform.mainRoute !== false && !platform.checkpointPad)
      .filter((platform) => !world3PlatformOverlapsForbidden(platform, 16))
      .filter((platform) => world3CombatWindowAt(platform.x + platform.w / 2))
      .filter((platform) => !usedIds.has(platform.id));
    const containing = candidates.find((platform) => (
      anchorX >= platform.x + 72 && anchorX <= platform.x + platform.w - 72
    ));
    return containing || candidates
      .slice()
      .sort((left, right) => Math.abs(left.x + left.w / 2 - anchorX) - Math.abs(right.x + right.w / 2 - anchorX))[0] || null;
  }

  function world3UpperSupport(anchorX, usedIds = new Set()) {
    return world.platforms
      .filter((platform) => !platform.ground && !platform.checkpointPad && !platform.bossRoute)
      .filter((platform) => platform.enemySupport !== false && !platform.deliveryRoute)
      .filter((platform) => !world3PlatformOverlapsForbidden(platform, 12))
      .filter((platform) => world3CombatWindowAt(platform.x + platform.w / 2))
      .filter((platform) => !usedIds.has(platform.id))
      .sort((left, right) => Math.abs(left.x + left.w / 2 - anchorX) - Math.abs(right.x + right.w / 2 - anchorX))[0] || null;
  }

  function shiftWorld3PlatformToY(platform, reachableY) {
    if (!platform || platform.ground || !Number.isFinite(reachableY) || reachableY <= platform.y) return false;
    const oldY = platform.y;
    platform.y = reachableY;
    if (platform.moving) platform.baseY = reachableY;
    const deltaY = reachableY - oldY;
    world.collectibles.forEach((item) => {
      if (item.ridePlatform === platform) {
        item.y = platform.y + (item.rideOffsetY ?? -38);
        return;
      }
      if (item.x + item.w < platform.x || item.x > platform.x + platform.w) return;
      if (item.y >= oldY - 125 && item.y <= oldY + 24) item.y += deltaY;
    });
    return true;
  }

  function lowerWorld3PlatformToNormalJump(platform) {
    if (!platform || platform.ground) return false;
    const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
    const requiredRise = GROUND_Y - (platform.y - verticalRange);
    if (requiredRise <= heroPhysics.normalJumpRise + 1) return false;
    const reachableY = GROUND_Y - heroPhysics.normalJumpRise + verticalRange + 1;
    const shifted = shiftWorld3PlatformToY(platform, reachableY);
    if (shifted) platform.normalJumpAccessible = true;
    return shifted;
  }

  function lowerWorld3PlatformToEnemyBounce(platform, support) {
    if (!platform || !support || platform.ground) return false;
    const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
    const requiredRise = support.y - (platform.y - verticalRange);
    if (requiredRise <= heroPhysics.enemyBounceRise + 1) return false;
    const reachableY = support.y - heroPhysics.enemyBounceRise + verticalRange + 1;
    const shifted = shiftWorld3PlatformToY(platform, reachableY);
    if (shifted) platform.enemyBounceAccessible = true;
    return shifted;
  }

  function addWorld3Formation(definition, platform) {
    if (!platform) return [];
    const enemyWidth = 46;
    const enemyHeight = 46;
    const requestedCount = Math.max(1, Math.floor(Number(definition.count) || 1));
    // World 3 follows the readable formation contract: packs belong on the
    // ground or on genuinely broad platforms. Narrow upper ledges get one
    // enemy so the landing remains visible and never becomes a pile-up.
    const groupingAllowed = Boolean(platform.ground) || platform.w >= 220;
    const count = groupingAllowed ? requestedCount : 1;
    const spacing = count > 1
      ? Math.max(enemyWidth + 12, Number(definition.spacing) || enemyWidth + 18)
      : enemyWidth + 14;
    const formationWidth = enemyWidth + (count - 1) * spacing;
    const leftEdge = platform.x + 22;
    const rightEdge = platform.x + platform.w - formationWidth - 22;
    const requestedOffset = Number.isFinite(definition.offset)
      ? definition.offset
      : Math.max(0, (platform.w - formationWidth) / 2);
    const startX = clamp(platform.x + requestedOffset, leftEdge, Math.max(leftEdge, rightEdge));
    const role = definition.role || (platform.ground ? 'ground-patrol' : 'platform-sentry');
    const behaviorType = ({
      popcorn: 'tomato',
      cotton: 'onion',
      pretzel: 'chili',
      lemon: 'jalapeno',
      bumper: 'tomato',
      corndog: 'chili',
    })[definition.type] || definition.type;
    const speed = Number(definition.speed ?? (
      role === 'moving-guard' ? 48 : role === 'champion' ? 42 : role === 'route-helper' ? 34 : 40
    ));
    const enemies = heroCore.createEnemyFormation({
      id: definition.id,
      type: definition.type,
      startX,
      y: platform.y - enemyHeight,
      w: enemyWidth,
      h: enemyHeight,
      count,
      spacing,
      vx: speed,
      speed,
      patrolPadding: definition.localPatrol ? 0 : 18,
      patrolStartOffset: definition.localPatrol ? 22 : undefined,
      role,
      roleExplicit: true,
      platform,
      platformId: platform.id,
      supportPlatformId: platform.id,
      world3Encounter: definition.id,
      world3Section: definition.section,
      world3Purpose: definition.purpose,
      bounceHelper: role === 'route-helper',
      routeHelper: role === 'route-helper',
      champion: role === 'champion',
      localPatrol: Boolean(definition.localPatrol),
      targetPlatform: definition.targetPlatform || null,
      targetPlatformId: definition.targetPlatform?.id || null,
      formationRule: groupingAllowed ? 'ground-or-large-platform' : 'single-narrow-platform',
      formationPurpose: definition.purpose,
      ...(Number.isFinite(definition.minX) ? { minX: definition.minX } : {}),
      ...(Number.isFinite(definition.maxX) ? { maxX: definition.maxX } : {}),
    });
    enemies.forEach((enemy, index) => {
      enemy.behaviorType = behaviorType;
      enemy.speed = speed;
      enemy.animationPhase = ((world.enemies.length + index) * 0.37) % 2.4;
      enemy.animationRate = 1;
      enemy.anim = (index * 0.22) % 1;
      enemy.frame = 0;
      enemy.dir = definition.direction || (index % 2 === 0 ? 1 : -1);
      enemy.previousY = enemy.y;
      enemy.previousTop = enemy.y;
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length + index, behaviorType);
      world.enemies.push(enemy);
    });
    return enemies;
  }

  function addWorld3RouteHelper(platform, index, usedGroundIds) {
    if (!platform || world3PlatformOverlapsForbidden(platform, 16)) return null;
    const verticalRange = platform.moving && platform.axis === 'y' ? platform.range : 0;
    const requiredRise = GROUND_Y - (platform.y - verticalRange);
    if (requiredRise <= heroPhysics.normalJumpRise + 1) return null;
    const support = world3GroundSupport(platform.x + platform.w / 2, usedGroundIds);
    if (!support) {
      lowerWorld3PlatformToNormalJump(platform);
      return null;
    }
    lowerWorld3PlatformToEnemyBounce(platform, support);
    usedGroundIds.add(support.id);
    const helperX = clamp(
      platform.x + platform.w / 2,
      support.x + 58,
      support.x + support.w - 104,
    );
    return addWorld3Formation({
      id: `world3-route-helper-${index}`,
      type: index % 2 ? 'cotton' : 'pretzel',
      count: 1,
      offset: helperX - support.x,
      role: 'route-helper',
      section: 'bounce-route',
      purpose: 'Provide a forgiving launch under the elevated carnival route.',
      localPatrol: true,
      minX: helperX - 64,
      maxX: helperX + 64,
      targetPlatform: platform,
    }, support)[0] || null;
  }

  function auditWorld3Remaster() {
    const grouped = new Map();
    world.enemies.forEach((enemy) => {
      if (!enemy.groupId || enemy.groupSize <= 1) return;
      if (!grouped.has(enemy.groupId)) grouped.set(enemy.groupId, []);
      grouped.get(enemy.groupId).push(enemy);
    });
    const overlapPairs = [];
    const mixedTypeGroups = [];
    const narrowPlatformGroups = [];
    grouped.forEach((members, groupId) => {
      const ordered = [...members].sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0) || a.x - b.x);
      const support = ordered[0]?.platform;
      if (support && !support.ground && support.w < 220) narrowPlatformGroups.push(groupId);
      if (new Set(ordered.map((enemy) => enemy.type)).size > 1) mixedTypeGroups.push(groupId);
      for (let index = 0; index < ordered.length - 1; index += 1) {
        const left = ordered[index];
        const right = ordered[index + 1];
        if (left.x + left.w > right.x + 0.5 || left.maxX + left.w > right.minX + 0.5) {
          overlapPairs.push(`${groupId}:${left.groupIndex}-${right.groupIndex}`);
        }
      }
    });
    const forbiddenCounts = Object.fromEntries(world3ForbiddenRanges().map((range) => [
      range.id,
      world.enemies.filter((enemy) => (
        (enemy.minX ?? enemy.x) < range.end && (enemy.maxX ?? enemy.x) + enemy.w > range.start
      )).length,
    ]));
    const combatOutliers = world.enemies.filter((enemy) => !world3CombatWindowAt(enemy.x + enemy.w / 2)).length;
    game.world3FormationOverlapCount = overlapPairs.length;
    game.world3FormationOverlapPairs = overlapPairs;
    game.world3MixedTypeGroups = mixedTypeGroups;
    game.world3NarrowPlatformGroups = narrowPlatformGroups;
    game.world3ForbiddenEnemyCounts = forbiddenCounts;
    game.world3CombatOutliers = combatOutliers;
    game.world3FormationRules = {
      groupedGroundOrLargeOnly: narrowPlatformGroups.length === 0,
      sameTypeGroups: mixedTypeGroups.length === 0,
      minimumGap: 12,
      noOverlap: overlapPairs.length === 0,
      fullPlatformCoverage: world.enemies.filter((enemy) => !enemy.localPatrol).every((enemy) => enemy.patrolCoverage === 'full-platform'),
      cinematicCorridorsClear: Object.values(forbiddenCounts).every((count) => count === 0),
    };
  }

  function cloudtopRouteActAt(x) {
    return CLOUDTOP_ROUTE_ACTS.find((act) => x >= act.start && x < act.end)
      || CLOUDTOP_ROUTE_ACTS.at(-1);
  }

  function addCloudtopRouteTacos(platform, count = 3, golden = false) {
    const gap = count > 1 ? Math.min(52, Math.max(40, (platform.w - 44) / (count - 1))) : 0;
    const startX = platform.x + Math.max(18, (platform.w - (count - 1) * gap - 24) / 2);
    for (let index = 0; index < count; index += 1) {
      addItem(startX + index * gap, platform.y - 38, 'taco', {
        bob: index * 0.34,
        cloudtopRoute: true,
        routePlatformId: platform.id,
      });
    }
    if (golden) {
      addItem(platform.x + platform.w / 2 - 15, platform.y - 78, 'golden', {
        ticket: true,
        cloudtopRoute: true,
        routePlatformId: platform.id,
      });
    }
  }

  function buildCloudtopGroundRoute() {
    const localIndices = new Map();
    let x = 0;
    let routeIndex = 0;
    while (x < WORLD_WIDTH) {
      const act = cloudtopRouteActAt(x);
      const localIndex = localIndices.get(act.id) || 0;
      const remaining = act.end - x;
      const patternedWidth = act.widths[localIndex % act.widths.length];
      let width = Math.min(patternedWidth, remaining);
      let gap = 0;
      if (remaining > width + 360) {
        gap = Math.min(act.gaps[localIndex % act.gaps.length], remaining - width - 360);
      } else {
        width = remaining;
      }
      const platform = addPlatform({
        id: `cloudtop-${act.id}-ground-${localIndex + 1}`,
        x,
        y: GROUND_Y,
        w: width,
        h: 110,
        ground: true,
        style: config.groundStyle,
        mainRoute: true,
        cloudtopRoute: true,
        world3Act: act.id,
        routeSilhouette: act.silhouette,
      });
      addLine(
        platform.x + 80,
        GROUND_Y - 52,
        Math.max(5, Math.floor((platform.w - 120) / 58)),
        58,
      );
      if (gap > 0) {
        const gapCenter = x + width + gap / 2;
        addArc(x + width - 20, GROUND_Y - 78, 4, Math.max(38, gap / 3), 46);
        if (gap >= 104 && !['balloon-bazaar-runway', 'starlight-pinata-parade'].includes(act.id)) {
          const bridge = addPlatform({
            id: `cloudtop-${act.id}-gap-bridge-${localIndex + 1}`,
            x: gapCenter - 58,
            y: GROUND_Y - 70 - (routeIndex % 2) * 10,
            w: 116,
            h: 20,
            style: config.groundStyle,
            mainRoute: true,
            enemySupport: false,
            routeBridge: true,
            cloudtopRoute: true,
            world3Act: act.id,
            routeSilhouette: act.silhouette,
          });
          addCloudtopRouteTacos(bridge, 2);
        }
      }
      x += width + gap;
      routeIndex += 1;
      localIndices.set(act.id, localIndex + 1);
    }
  }

  function buildCloudtopPlatformRoutes() {
    CLOUDTOP_UPPER_ROUTE.forEach((definition, index) => {
      const platform = addPlatform({
        ...definition,
        style: config.groundStyle,
        h: 22,
        phase: definition.phase ?? index * 0.63,
        speed: definition.speed ?? 1,
        range: definition.range ?? 0,
        moving: Boolean(definition.moving),
        axis: definition.axis || 'y',
        rewardRoute: true,
        cloudtopRoute: true,
        world3Act: definition.act,
        routeSilhouette: definition.role,
      });
      addCloudtopRouteTacos(platform, platform.w >= 230 ? 4 : 3, Boolean(definition.golden));
    });
  }

  function buildCloudtopBalloonCorridor() {
    const gondolas = [
      { x: 8380, y: 350, w: 194 },
      { x: 9160, y: 342, w: 210, moving: true, range: 7 },
      { x: 9940, y: 334, w: 228 },
      { x: 10720, y: 342, w: 210, moving: true, range: 7, golden: true },
      { x: 11500, y: 350, w: 194 },
      { x: 12280, y: 340, w: 218, moving: true, range: 8 },
      { x: 13060, y: 334, w: 228 },
      { x: 13840, y: 346, w: 194 },
    ];
    gondolas.forEach((definition, index) => {
      const platform = addPlatform({
        id: `cloudtop-balloon-gondola-${index + 1}`,
        ...definition,
        h: 22,
        style: config.groundStyle,
        moving: Boolean(definition.moving),
        axis: 'y',
        range: definition.range || 0,
        speed: 0.84 + (index % 3) * 0.08,
        phase: index * 0.72,
        deliveryRoute: true,
        enemySupport: false,
        cloudtopRoute: true,
        world3Act: 'balloon-bazaar-runway',
        routeSilhouette: 'balloon-gondola-chain',
      });
      addCloudtopRouteTacos(platform, 4, Boolean(definition.golden));
    });
  }

  function addMidnightRouteTacos(platform, count = 3, golden = false) {
    const gap = count > 1 ? Math.min(52, Math.max(40, (platform.w - 44) / (count - 1))) : 0;
    const startX = platform.x + Math.max(18, (platform.w - (count - 1) * gap - 24) / 2);
    for (let index = 0; index < count; index += 1) {
      addItem(startX + index * gap, platform.y - 38, 'taco', {
        bob: index * 0.34,
        midnightRoute: true,
        routePlatformId: platform.id,
      });
    }
    if (golden) {
      addItem(platform.x + platform.w / 2 - 15, platform.y - 78, 'golden', {
        ticket: true,
        midnightRoute: true,
        routePlatformId: platform.id,
      });
    }
  }

  function buildMidnightGroundRoute() {
    MIDNIGHT_ROUTE_ACTS.forEach((act) => {
      let x = act.start;
      let localIndex = 0;
      while (x < act.end) {
        const remaining = act.end - x;
        const patternedWidth = act.widths[localIndex % act.widths.length];
        let width = Math.min(patternedWidth, remaining);
        let gap = 0;
        if (remaining > width + 360) {
          gap = Math.min(act.gaps[localIndex % act.gaps.length], remaining - width - 360);
        } else {
          width = remaining;
        }
        const platform = addPlatform({
          id: `midnight-${act.id}-ground-${localIndex + 1}`,
          x,
          y: GROUND_Y,
          w: width,
          h: 110,
          ground: true,
          style: config.groundStyle,
          mainRoute: true,
          midnightRoute: true,
          world3Act: act.id,
          routeSilhouette: act.silhouette,
        });
        const baseCount = ['popcorn-tempest-arena', 'golden-midnight-victory'].includes(act.id)
          ? Math.max(10, Math.floor((platform.w - 140) / 68))
          : Math.max(5, Math.floor((platform.w - 120) / 58));
        addLine(platform.x + 80, GROUND_Y - 52, baseCount, act.id === 'popcorn-tempest-arena' ? 68 : 58);
        if (gap > 0) {
          addArc(
            platform.x + platform.w - 20,
            GROUND_Y - 78,
            4,
            Math.max(38, gap / 3),
            46 + (localIndex % 2) * 8,
          );
        }
        x += width + gap;
        localIndex += 1;
      }
    });
  }

  function buildMidnightPlatformRoutes() {
    MIDNIGHT_UPPER_ROUTE.forEach((definition, index) => {
      const platform = addPlatform({
        ...definition,
        style: config.groundStyle,
        h: 22,
        phase: definition.phase ?? index * 0.63,
        speed: definition.speed ?? 1,
        range: definition.range ?? 0,
        moving: Boolean(definition.moving),
        axis: definition.axis || 'y',
        rewardRoute: true,
        midnightRoute: true,
        world3Act: definition.act,
        routeSilhouette: definition.role,
      });
      addMidnightRouteTacos(platform, platform.w >= 230 ? 4 : 3, Boolean(definition.golden));
    });
  }

  function buildMidnightCoasterCorridor() {
    const rideCars = [
      { x: 8240, y: 350, w: 190 },
      { x: 8910, y: 342, w: 210, moving: true, range: 7 },
      { x: 9580, y: 334, w: 228 },
      { x: 10250, y: 342, w: 210, moving: true, range: 8 },
      { x: 10920, y: 350, w: 194 },
      { x: 11590, y: 340, w: 218, moving: true, range: 7 },
      { x: 12260, y: 334, w: 228 },
      { x: 12930, y: 342, w: 210, moving: true, range: 8 },
      { x: 13600, y: 334, w: 228 },
      { x: 14270, y: 348, w: 194 },
    ];
    rideCars.forEach((definition, index) => {
      const platform = addPlatform({
        id: `midnight-coaster-car-${index + 1}`,
        ...definition,
        h: 22,
        style: config.groundStyle,
        moving: Boolean(definition.moving),
        axis: 'y',
        range: definition.range || 0,
        speed: 0.86 + (index % 3) * 0.08,
        phase: index * 0.72,
        deliveryRoute: true,
        enemySupport: false,
        midnightRoute: true,
        world3Act: 'neon-coaster-district',
        routeSilhouette: 'enemy-free-coaster-car-chain',
      });
      addMidnightRouteTacos(platform, platform.w >= 210 ? 4 : 3);
    });
  }

  function addNovaRouteTacos(platform, count = 3, golden = false) {
    const gap = count > 1 ? Math.min(52, Math.max(40, (platform.w - 44) / (count - 1))) : 0;
    const startX = platform.x + Math.max(18, (platform.w - (count - 1) * gap - 24) / 2);
    for (let index = 0; index < count; index += 1) {
      addItem(startX + index * gap, platform.y - 38, 'taco', {
        bob: index * 0.34,
        novaRoute: true,
        routePlatformId: platform.id,
      });
    }
    if (golden) {
      addItem(platform.x + platform.w / 2 - 15, platform.y - 78, 'golden', {
        ticket: true,
        novaRoute: true,
        routePlatformId: platform.id,
      });
    }
  }

  function buildNovaGroundRoute() {
    NOVA_ROUTE_ACTS.forEach((act) => {
      let x = act.start;
      let localIndex = 0;
      while (x < act.end) {
        const remaining = act.end - x;
        const patternedWidth = act.widths[localIndex % act.widths.length];
        let width = Math.min(patternedWidth, remaining);
        let gap = 0;
        if (remaining > width + 360) {
          gap = Math.min(act.gaps[localIndex % act.gaps.length], remaining - width - 360);
        } else {
          width = remaining;
        }
        const platform = addPlatform({
          id: `nova-${act.id}-ground-${localIndex + 1}`,
          x,
          y: GROUND_Y,
          w: width,
          h: 110,
          ground: true,
          style: config.groundStyle,
          mainRoute: true,
          novaRoute: true,
          world3Act: act.id,
          routeSilhouette: act.silhouette,
        });
        const baseCount = ['radish-eclipse-arena', 'taco-nova-ascension'].includes(act.id)
          ? Math.max(10, Math.floor((platform.w - 140) / 68))
          : Math.max(5, Math.floor((platform.w - 120) / 58));
        addNovaRouteTacos(platform, baseCount);
        if (gap > 0) {
          addArc(
            platform.x + platform.w - 20,
            GROUND_Y - 78,
            4,
            Math.max(38, gap / 3),
            46 + (localIndex % 2) * 8,
          );
        }
        x += width + gap;
        localIndex += 1;
      }
    });
  }

  function buildNovaPlatformRoutes() {
    NOVA_UPPER_ROUTE.forEach((definition, index) => {
      const platform = addPlatform({
        ...definition,
        style: config.groundStyle,
        h: 22,
        phase: definition.phase ?? index * 0.63,
        speed: definition.speed ?? 1,
        range: definition.range ?? 0,
        moving: Boolean(definition.moving),
        axis: definition.axis || 'y',
        rewardRoute: true,
        novaRoute: true,
        world3Act: definition.act,
        routeSilhouette: definition.role,
      });
      addNovaRouteTacos(platform, platform.w >= 230 ? 4 : 3, Boolean(definition.golden));
    });
  }

  function buildNovaZeppelinCorridor() {
    const ridePlatforms = [
      { x: 20220, y: 350, w: 194 },
      { x: 21220, y: 338, w: 220, moving: true, range: 8 },
      { x: 22320, y: 348, w: 240 },
      { x: 23480, y: 344, w: 214, moving: true, range: 10 },
      { x: 24580, y: 344, w: 244 },
      { x: 25760, y: 334, w: 224, moving: true, range: 9 },
      { x: 26820, y: 348, w: 196 },
    ];
    ridePlatforms.forEach((definition, index) => {
      const platform = addPlatform({
        id: `nova-zeppelin-delivery-${index + 1}`,
        ...definition,
        h: 22,
        style: config.groundStyle,
        moving: Boolean(definition.moving),
        axis: 'y',
        range: definition.range || 0,
        speed: 0.84 + (index % 3) * 0.08,
        phase: index * 0.72,
        deliveryRoute: true,
        enemySupport: false,
        novaRoute: true,
        world3Act: 'zeppelin-star-parade',
        routeSilhouette: 'wide-clear-zeppelin-parade',
      });
      addNovaRouteTacos(platform, platform.w >= 220 ? 4 : 3, index === 4);
    });
  }

  function buildGroundRoute() {
    const gaps = [64, 86, 104, 72, 92, 58];
    let x = 0;
    let index = 0;
    while (x < WORLD_WIDTH) {
      const width = Math.min(820 + (index % 3) * 90, WORLD_WIDTH - x);
      addPlatform({ x, y: GROUND_Y, w: width, h: 110, ground: true, style: config.groundStyle });
      addLine(x + 80, GROUND_Y - 52, Math.max(6, Math.floor((width - 120) / 54)), 54);
      const gap = gaps[index % gaps.length];
      if (x + width + gap < WORLD_WIDTH) {
        const gapCenter = x + width + gap * 0.5;
        const insideDelivery = gapCenter > config.vehicle.start - 220 && gapCenter < config.vehicle.end + 220;
        if (!insideDelivery) {
          addPlatform({
            x: gapCenter - 70,
            y: GROUND_Y - 72 - (index % 2) * 18,
            w: 140,
            h: 20,
            style: config.groundStyle,
            moving: false,
            axis: 'y',
            range: 20 + (index % 3) * 8,
            speed: 1 + (index % 4) * 0.13,
            phase: index * 0.71,
            mainRoute: true,
          });
        }
        addArc(x + width - 24, GROUND_Y - 76, 4, Math.max(38, gap / 3), 42);
      }
      x += width + gap;
      index += 1;
    }
  }

  function buildPlatformClusters() {
    const heights = [356, 302, 246, 304];
    let group = 0;
    for (let base = 620; base < WORLD_WIDTH - 900; base += 1800) {
      if (config.boss && base > config.boss.x - 900 && base < config.boss.gateX + 300) continue;
      if (base > config.vehicle.start - 500 && base < config.vehicle.end + 500) continue;
      if (levelId === '3-3' && base > 31400) continue;
      heights.forEach((y, index) => {
        const platform = addPlatform({
          x: base + index * 170,
          y,
          w: 146,
          h: 22,
          style: config.groundStyle,
          moving: false,
          axis: 'y',
          range: 0,
          speed: 1.05,
          phase: group * 0.8,
          rewardRoute: true,
        });
        addLine(platform.x + 18, platform.y - 36, 3, 43);
      });
      if (group % 3 === 0) {
        addItem(base + 2 * 170 + 57, 205, 'golden', { ticket: true });
      }
      group += 1;
    }
  }

  function buildVehicleCorridor() {
    let index = 0;
    for (let x = config.vehicle.start + 620; x < config.vehicle.end - 420; x += 590) {
      const platform = addPlatform({
        x,
        y: 340 + (index % 2) * 8,
        w: 174,
        h: 22,
        style: config.groundStyle,
        moving: index % 3 === 1,
        axis: 'y',
        range: index % 3 === 1 ? 14 : 0,
        speed: 0.95,
        phase: index * 0.8,
        deliveryRoute: true,
      });
      addLine(platform.x + 22, platform.y - 38, 3, 51);
      index += 1;
    }
  }

  function buildSectionRewardBeats() {
    config.sections.forEach((section, sectionIndex) => {
      [0.23, 0.62].forEach((progress, beatIndex) => {
        const x = section.start + (section.end - section.start) * progress;
        if (x > WORLD_WIDTH - 700) return;
        if (config.boss && x > config.boss.x - 900 && x < config.boss.gateX + 260) return;
        if (levelId === '3-3' && x >= 31500) return;
        const count = 8;
        const gap = 48;
        addArc(
          x - ((count - 1) * gap) / 2,
          GROUND_Y - 68 - ((sectionIndex + beatIndex) % 2) * 10,
          count,
          gap,
          52 + beatIndex * 12,
        );
      });
    });
  }

  function buildTacoNovaVictoryRun() {
    if (levelId !== '3-3') return;
    world.collectibles = world.collectibles.filter((item) => (
      item.type !== 'taco' || item.x < victoryRouteStart()
    ));
    const trails = [31660, 32440, 33220, 34000];
    trails.forEach((startX, trailIndex) => {
      const count = 11;
      const gap = 46;
      for (let index = 0; index < count; index += 1) {
        const progress = index / (count - 1);
        addItem(
          startX + index * gap,
          GROUND_Y - 68 - Math.sin(progress * Math.PI) * (56 + trailIndex * 5),
          'taco',
          {
            bob: progress * Math.PI + trailIndex * 0.4,
            novaTrail: true,
            novaTrailIndex: trailIndex,
          },
        );
      }
    });
  }

  function buildEnemies() {
    const plan = world3RemasterPlan;
    if (!plan) return;
    world.enemies = [];
    const usedGroundIds = new Set();
    const usedUpperIds = new Set();
    const authored = { ground: [], upper: [], routeHelpers: [], skipped: [] };

    plan.ground.forEach((encounter) => {
      const platform = world3GroundSupport(encounter.anchorX, usedGroundIds);
      if (!platform) {
        authored.skipped.push(encounter.id);
        return;
      }
      usedGroundIds.add(platform.id);
      const offset = clamp(
        encounter.anchorX - platform.x - 80,
        24,
        Math.max(24, platform.w - 210),
      );
      const enemies = addWorld3Formation({ ...encounter, offset, role: 'ground-patrol' }, platform);
      if (enemies.length) authored.ground.push(encounter.id);
    });

    plan.upper.forEach((encounter) => {
      const platform = world3UpperSupport(encounter.anchorX, usedUpperIds);
      if (!platform) {
        authored.skipped.push(encounter.id);
        return;
      }
      usedUpperIds.add(platform.id);
      const enemies = addWorld3Formation(encounter, platform);
      if (enemies.length) authored.upper.push(encounter.id);
      const helper = addWorld3RouteHelper(platform, authored.routeHelpers.length + 1, usedGroundIds);
      if (helper) authored.routeHelpers.push(helper.world3Encounter);
    });

    // Any selected route platform that cannot be reached by a normal jump or
    // a deliberate bounce helper is lowered into the shared jump envelope.
    // This keeps the upper route optional without creating a dead-end.
    world.platforms
      .filter((platform) => !platform.ground && !platform.bossRoute && !platform.deliveryRoute)
      .filter((platform) => world3CombatWindowAt(platform.x + platform.w / 2))
      .forEach((platform) => {
        const hasHelper = world.enemies.some((enemy) => enemy.targetPlatform === platform);
        if (!hasHelper && !world.enemies.some((enemy) => enemy.platform === platform)) lowerWorld3PlatformToNormalJump(platform);
      });

    world.enemies = world.enemies.filter((enemy) => (
      enemy.x < victoryRouteStart()
      && world3CombatWindowAt(enemy.x + enemy.w / 2)
      && !world3PlatformOverlapsForbidden(enemy.platform, 0)
    ));

    game.platformEnemyStats = heroCore.attachEnemiesToPlatforms(world.enemies, world.platforms, {
      surfaceTolerance: 34,
      edgePadding: 14,
    });
    const patrolTargets = world.enemies.filter((enemy) => !enemy.localPatrol && enemy.platform);
    game.enemyPatrolAudit = heroCore.retuneEnemyFormationPatrols(patrolTargets, {
      fullPlatformCoverage: true,
      minimumGap: 12,
      edgePadding: 16,
    });
    world.enemies.filter((enemy) => enemy.localPatrol && enemy.platform).forEach((enemy) => {
      const platform = enemy.platform;
      const platformMin = platform.x + 16;
      const platformMax = platform.x + platform.w - enemy.w - 16;
      enemy.minX = clamp(enemy.minX, platformMin, Math.max(platformMin, platformMax));
      enemy.maxX = clamp(enemy.maxX, enemy.minX, Math.max(enemy.minX, platformMax));
      enemy.patrolCoverage ||= 'local-route-helper';
      enemy.patrolSpan = enemy.maxX - enemy.minX;
    });
    world.enemies.forEach((enemy) => {
      enemy.roamLeft = enemy.minX ?? enemy.x;
      enemy.roamRight = enemy.maxX ?? enemy.x;
    });
    auditWorld3Remaster();
    game.world3Remaster = {
      version: plan.version,
      combatWindows: plan.combatWindows,
      authoredGroundEncounters: authored.ground.length,
      authoredUpperEncounters: authored.upper.length,
      authoredRouteHelpers: authored.routeHelpers.length,
      skippedEncounterIds: authored.skipped,
      groupedEnemies: world.enemies.filter((enemy) => enemy.groupSize > 1).length,
      enemyGroups: [...new Set(world.enemies.filter((enemy) => enemy.groupSize > 1).map((enemy) => enemy.groupId))],
      patrolCoverage: 'full-usable-platform-with-separated-pack-lanes',
      groupingRule: 'ground-or-large-platform',
      routeDiscoveryOnly: false,
      authoredRouteVersion: levelId === '3-1'
        ? CLOUDTOP_ROUTE_VERSION
        : levelId === '3-2'
          ? MIDNIGHT_ROUTE_VERSION
          : NOVA_ROUTE_VERSION,
    };
  }

  function buildSpecials() {
    world.checkpoints = heroCore.createCheckpointSet(config.checkpoints, {
      duplicateTolerance: 18,
      resolve: (checkpoint) => {
        const spriteWidth = CHECKPOINT_GROUNDING_PROFILES[checkpoint.look]?.width || 246;
        const desiredSpriteLeft = checkpoint.x + 95 - spriteWidth / 2;
      const placement = placeFootprintOnGround(desiredSpriteLeft, spriteWidth, 20);
      const groundY = placement?.platform.y ?? GROUND_Y;
      const groundedX = placement ? placement.x + spriteWidth / 2 - 95 : checkpoint.x;
        return {
          ...checkpoint,
          x: groundedX,
          y: groundY - 140,
          groundY,
          spriteLeft: groundedX + 95 - spriteWidth / 2,
          spriteWidth,
          w: 190,
          h: 140,
        };
      },
    });
    if (config.pinataX) {
      world.pinata = { x: config.pinataX, y: GROUND_Y - 116, w: 116, h: 116, hits: 0, broken: false, bounceLock: 0 };
    }
    if (levelId === '3-1') {
      world.finalePinata = {
        x: world.goal.x + 4,
        y: GROUND_Y - 150,
        w: 122,
        h: 150,
        hits: 0,
        broken: false,
        bounceLock: 0,
        explosionTimer: 0,
      };
    }
    if (config.boss) {
      const bossWidth = config.boss.kind === 'ringmaster' ? 144 : 112;
      const bossHeight = config.boss.kind === 'ringmaster' ? 105 : 104;
      const bossPlacement = placeFootprintOnGround(config.boss.x, bossWidth, 24);
      const bossGroundY = bossPlacement?.platform.y ?? GROUND_Y;
      world.boss = {
        ...config.boss,
        x: bossPlacement?.x ?? config.boss.x,
        y: config.boss.kind === 'ringmaster' ? 254 : bossGroundY - bossHeight,
        baseY: config.boss.kind === 'ringmaster' ? 254 : bossGroundY - bossHeight,
        groundY: bossGroundY,
        w: bossWidth,
        h: bossHeight,
        roamLeft: config.boss.kind === 'ringmaster'
          ? config.boss.x - 440
          : (bossPlacement?.platform.x ?? 0) + 24,
        roamRight: config.boss.kind === 'ringmaster'
          ? config.boss.x + 430
          : (bossPlacement?.platform.x ?? 0) + (bossPlacement?.platform.w ?? WORLD_WIDTH) - bossWidth - 24,
        hits: 0,
        state: 'intro',
        timer: 0,
        vulnerable: false,
        invulnerable: 0,
        announced: false,
        dir: -1,
        defeated: false,
        audioState: 'intro',
      };
      addPlatform({ x: world.boss.x - 360, y: 350, w: 190, h: 22, style: config.groundStyle, bossRoute: true });
      addPlatform({ x: world.boss.x - 100, y: 292, w: 190, h: 22, style: config.groundStyle, bossRoute: true });
      addPlatform({ x: world.boss.x + 170, y: 350, w: 190, h: 22, style: config.groundStyle, bossRoute: true });
      addArc(world.boss.x - 330, 320, 12, 62, 100);
    }
    const existingGolden = world.collectibles.filter((item) => item.type === 'golden');
    existingGolden.slice(8).forEach((item) => { item.type = 'taco'; item.ticket = false; });
    while (world.collectibles.filter((item) => item.type === 'golden').length < 8) {
      const index = world.collectibles.filter((item) => item.type === 'golden').length;
      addItem(2400 + index * 4000, 250, 'golden', { ticket: true });
    }
  }

  function world3ReachablePlatformIds() {
    const reachable = new Set(world.platforms.filter((platform) => platform.ground).map((platform) => platform.id));
    const elevated = world.platforms.filter((platform) => !platform.ground);
    const horizontalGap = (from, to) => {
      const toRange = to.moving && to.axis === 'x' ? to.range : 0;
      const toLeft = to.x - toRange;
      const toRight = to.x + to.w + toRange;
      if (from.x + from.w < toLeft) return toLeft - (from.x + from.w);
      if (toRight < from.x) return from.x - toRight;
      return 0;
    };
    let changed = true;
    let passes = 0;
    while (changed && passes < world.platforms.length) {
      changed = false;
      passes += 1;
      elevated.forEach((platform) => {
        if (reachable.has(platform.id)) return;
        const targetRiseY = platform.y - (platform.moving && platform.axis === 'y' ? platform.range : 0);
        const normalSupport = world.platforms.find((support) => (
          reachable.has(support.id)
          && support !== platform
          && support.y - targetRiseY <= heroPhysics.normalJumpRise + 6
          && horizontalGap(support, platform) <= 164
        ));
        if (normalSupport) {
          reachable.add(platform.id);
          changed = true;
          return;
        }
        const bounceHelper = world.enemies.find((enemy) => (
          enemy.routeHelper
          && enemy.targetPlatform === platform
          && enemy.platform
          && reachable.has(enemy.platform.id)
          && enemy.platform.y - targetRiseY <= heroPhysics.enemyBounceRise + 6
          && horizontalGap(enemy.platform, platform) <= 164
        ));
        if (bounceHelper) {
          reachable.add(platform.id);
          changed = true;
        }
      });
    }
    return reachable;
  }

  function auditCloudtopRoute() {
    if (levelId !== '3-1') {
      game.cloudtopRouteAudit = null;
      return;
    }
    const grounds = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    const gaps = grounds.slice(1).map((platform, index) => platform.x - (grounds[index].x + grounds[index].w));
    const routePlatforms = world.platforms.filter((platform) => platform.cloudtopRoute);
    const reachable = world3ReachablePlatformIds();
    const unreachable = routePlatforms
      .filter((platform) => !platform.ground && !reachable.has(platform.id))
      .map((platform) => platform.id);
    const patrolIntersects = (enemy, start, end) => (
      (enemy.minX ?? enemy.x) < end
      && (enemy.maxX ?? enemy.x) + enemy.w > start
    );
    const actPlatformCounts = Object.fromEntries(CLOUDTOP_ROUTE_ACTS.map((act) => [
      act.id,
      routePlatforms.filter((platform) => platform.world3Act === act.id).length,
    ]));
    game.cloudtopRouteAudit = {
      version: CLOUDTOP_ROUTE_VERSION,
      acts: CLOUDTOP_ROUTE_ACTS.map((act) => ({ id: act.id, silhouette: act.silhouette })),
      actPlatformCounts,
      routePlatforms: routePlatforms.length,
      movingRoutePlatforms: routePlatforms.filter((platform) => platform.moving).length,
      maxGroundGap: gaps.length ? Math.max(...gaps) : 0,
      jumpSafeLowerRoute: gaps.every((gap) => gap >= 0 && gap <= 164),
      unreachableRoutePlatformIds: unreachable,
      reachableRoutePlatforms: routePlatforms.filter((platform) => reachable.has(platform.id)).length,
      goldenTickets: world.collectibles.filter((item) => item.type === 'golden').length,
      vehicleCorridorEnemies: world.enemies.filter((enemy) => patrolIntersects(
        enemy,
        config.vehicle.start - 460,
        config.vehicle.end + 460,
      )).length,
      finaleRouteEnemies: world.enemies.filter((enemy) => patrolIntersects(
        enemy,
        config.pinataX - 520,
        WORLD_WIDTH + 1,
      )).length,
      platformOverlaps: platformOverlapCount(),
    };
  }

  function auditMidnightRoute() {
    if (levelId !== '3-2') {
      game.midnightRouteAudit = null;
      return;
    }
    const grounds = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    const gaps = grounds.slice(1).map((platform, index) => platform.x - (grounds[index].x + grounds[index].w));
    const routePlatforms = world.platforms.filter((platform) => platform.midnightRoute);
    const reachable = world3ReachablePlatformIds();
    const unreachable = routePlatforms
      .filter((platform) => !platform.ground && !reachable.has(platform.id))
      .map((platform) => platform.id);
    const patrolIntersects = (enemy, start, end) => (
      (enemy.minX ?? enemy.x) < end
      && (enemy.maxX ?? enemy.x) + enemy.w > start
    );
    const vehicleStart = config.vehicle.start - 460;
    const vehicleEnd = config.vehicle.end + 460;
    const bossStart = config.boss.x - 1300;
    const bossEnd = config.boss.gateX + 300;
    const actPlatformCounts = Object.fromEntries(MIDNIGHT_ROUTE_ACTS.map((act) => [
      act.id,
      routePlatforms.filter((platform) => platform.world3Act === act.id).length,
    ]));
    game.midnightRouteAudit = {
      version: MIDNIGHT_ROUTE_VERSION,
      acts: MIDNIGHT_ROUTE_ACTS.map((act) => ({ id: act.id, silhouette: act.silhouette })),
      actPlatformCounts,
      routePlatforms: routePlatforms.length,
      movingRoutePlatforms: routePlatforms.filter((platform) => platform.moving).length,
      coasterCorridorPlatforms: routePlatforms.filter((platform) => platform.deliveryRoute).length,
      maxGroundGap: gaps.length ? Math.max(...gaps) : 0,
      jumpSafeLowerRoute: gaps.every((gap) => gap >= 0 && gap <= 164),
      unreachableRoutePlatformIds: unreachable,
      reachableRoutePlatforms: routePlatforms.filter((platform) => reachable.has(platform.id)).length,
      goldenTickets: world.collectibles.filter((item) => item.type === 'golden').length,
      vehicleCorridorEnemies: world.enemies.filter((enemy) => patrolIntersects(enemy, vehicleStart, vehicleEnd)).length,
      bossApproachEnemies: world.enemies.filter((enemy) => patrolIntersects(enemy, bossStart, bossEnd)).length,
      victoryRouteEnemies: world.enemies.filter((enemy) => patrolIntersects(
        enemy,
        victoryRouteStart() - 90,
        WORLD_WIDTH + 1,
      )).length,
      arenaGroundCoverage: grounds.some((platform) => (
        platform.x <= config.boss.x - 900
        && platform.x + platform.w >= config.boss.gateX
      )),
      encoreGroundCoverage: grounds.some((platform) => (
        platform.x <= world.goal.x - 665
        && platform.x + platform.w >= WORLD_WIDTH - 1
      )),
      platformOverlaps: platformOverlapCount(),
    };
  }

  function auditNovaRoute() {
    if (levelId !== '3-3') {
      game.novaRouteAudit = null;
      return;
    }
    const grounds = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    const gaps = grounds.slice(1).map((platform, index) => platform.x - (grounds[index].x + grounds[index].w));
    const routePlatforms = world.platforms.filter((platform) => platform.novaRoute);
    const reachable = world3ReachablePlatformIds();
    const unreachable = routePlatforms
      .filter((platform) => !platform.ground && !reachable.has(platform.id))
      .map((platform) => platform.id);
    const patrolIntersects = (enemy, start, end) => (
      (enemy.minX ?? enemy.x) < end
      && (enemy.maxX ?? enemy.x) + enemy.w > start
    );
    const actPlatformCounts = Object.fromEntries(NOVA_ROUTE_ACTS.map((act) => [
      act.id,
      routePlatforms.filter((platform) => platform.world3Act === act.id).length,
    ]));
    const vehicleStart = config.vehicle.start - 460;
    const vehicleEnd = config.vehicle.end + 460;
    const bossStart = config.boss.x - 1300;
    const bossEnd = config.boss.gateX + 300;
    game.novaRouteAudit = {
      version: NOVA_ROUTE_VERSION,
      acts: NOVA_ROUTE_ACTS.map((act) => ({ id: act.id, silhouette: act.silhouette })),
      actPlatformCounts,
      routePlatforms: routePlatforms.length,
      movingRoutePlatforms: routePlatforms.filter((platform) => platform.moving).length,
      zeppelinCorridorPlatforms: routePlatforms.filter((platform) => platform.deliveryRoute).length,
      maxGroundGap: gaps.length ? Math.max(...gaps) : 0,
      jumpSafeLowerRoute: gaps.every((gap) => gap >= 0 && gap <= 164),
      unreachableRoutePlatformIds: unreachable,
      reachableRoutePlatforms: routePlatforms.filter((platform) => reachable.has(platform.id)).length,
      goldenTickets: world.collectibles.filter((item) => item.type === 'golden').length,
      zeppelinCorridorEnemies: world.enemies.filter((enemy) => patrolIntersects(enemy, vehicleStart, vehicleEnd)).length,
      bossApproachEnemies: world.enemies.filter((enemy) => patrolIntersects(enemy, bossStart, bossEnd)).length,
      victoryRouteEnemies: world.enemies.filter((enemy) => patrolIntersects(
        enemy,
        victoryRouteStart() - 90,
        WORLD_WIDTH + 1,
      )).length,
      arenaGroundCoverage: grounds.some((platform) => (
        platform.x <= config.boss.x - 900
        && platform.x + platform.w >= config.boss.gateX
      )),
      ascensionGroundCoverage: grounds.some((platform) => (
        platform.x <= world.goal.x - 665
        && platform.x + platform.w >= WORLD_WIDTH - 1
      )),
      platformOverlaps: platformOverlapCount(),
    };
  }

  function buildWorld() {
    randomSeed = 0x57A21A + config.band * 881;
    world.platforms = [];
    world.collectibles = [];
    world.enemies = [];
    world.projectiles = [];
    world.pinata = null;
    world.finalePinata = null;
    world.boss = null;
    if (levelId === '3-1') {
      buildCloudtopGroundRoute();
      buildCloudtopPlatformRoutes();
      buildCloudtopBalloonCorridor();
    } else if (levelId === '3-2') {
      buildMidnightGroundRoute();
      buildMidnightPlatformRoutes();
      buildMidnightCoasterCorridor();
    } else if (levelId === '3-3') {
      buildNovaGroundRoute();
      buildNovaPlatformRoutes();
      buildNovaZeppelinCorridor();
    } else {
      buildGroundRoute();
      buildPlatformClusters();
      buildVehicleCorridor();
    }
    buildSectionRewardBeats();
    buildTacoNovaVictoryRun();
    buildSpecials();
    resolvePlatformSpacing();
    buildEnemies();
    world.platforms.sort((a, b) => a.x - b.x || a.y - b.y);
    game.totalCollectibles = world.collectibles.filter((item) => item.type === 'taco').length;
    auditCloudtopRoute();
    auditMidnightRoute();
    auditNovaRoute();
  }

  function resolvePlatformSpacing() {
    const elevated = world.platforms.filter((platform) => !platform.ground).sort((a, b) => a.x - b.x || a.y - b.y);
    for (let index = 0; index < elevated.length; index += 1) {
      const platform = elevated[index];
      let attempts = 0;
      let conflict = true;
      while (conflict && attempts < 8) {
        conflict = elevated.slice(0, index).some((other) => {
          const horizontal = platform.x < other.x + other.w + 8 && platform.x + platform.w + 8 > other.x;
          const vertical = platform.y < other.y + other.h + 14 && platform.y + platform.h + 14 > other.y;
          return horizontal && vertical;
        });
        if (!conflict) break;
        platform.y -= 38;
        platform.baseY = platform.y;
        if (platform.y < 188) {
          platform.y += 118;
          platform.baseY = platform.y;
          platform.x += 34;
          platform.baseX = platform.x;
        }
        attempts += 1;
      }
    }
  }

  function platformOverlapCount() {
    let count = 0;
    const elevated = world.platforms.filter((platform) => !platform.ground);
    for (let leftIndex = 0; leftIndex < elevated.length; leftIndex += 1) {
      const left = elevated[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < elevated.length; rightIndex += 1) {
        const right = elevated[rightIndex];
        if (right.x > left.x + left.w + 8) break;
        const horizontal = left.x < right.x + right.w && left.x + left.w > right.x;
        const vertical = left.y < right.y + right.h + 14 && left.y + left.h + 14 > right.y;
        if (horizontal && vertical) count += 1;
      }
    }
    return count;
  }

  function loadPreferences() {
    try {
      const raw = JSON.parse(localStorage.getItem('jft-world3-settings') || '{}');
      game.musicVolume = clamp(Number(raw.musicVolume ?? 0.7), 0, 1);
      game.effectsVolume = clamp(Number(raw.effectsVolume ?? 0.82), 0, 1);
      game.reducedShake = Object.prototype.hasOwnProperty.call(raw, 'reducedShake')
        ? Boolean(raw.reducedShake)
        : prefersReducedMotion;
      game.muted = Boolean(raw.muted ?? false);
      const best = JSON.parse(localStorage.getItem(`jft-best-${levelId}`) || '{}');
      game.personalBest = { score: Number(best.score || 0), time: Number(best.time || 0), runs: Number(best.runs || 0) };
    } catch { /* local preferences are optional */ }
    if (ui.musicVolume) ui.musicVolume.value = String(Math.round(game.musicVolume * 100));
    if (ui.effectsVolume) ui.effectsVolume.value = String(Math.round(game.effectsVolume * 100));
    if (ui.reducedShake) ui.reducedShake.checked = game.reducedShake;
    refreshVolumeLabels();
    if (ui.personalBestText) {
      ui.personalBestText.textContent = game.personalBest.runs
        ? `Personal best: ${game.personalBest.score.toLocaleString()} points • ${formatTime(game.personalBest.time)}`
        : `Your first ${config.title} run sets the record!`;
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem('jft-world3-settings', JSON.stringify({
        musicVolume: game.musicVolume,
        effectsVolume: game.effectsVolume,
        reducedShake: game.reducedShake,
        muted: game.muted,
      }));
    } catch { /* local preferences are optional */ }
  }

  function refreshVolumeLabels() {
    if (ui.musicVolumeValue) ui.musicVolumeValue.textContent = `${Math.round(game.musicVolume * 100)}%`;
    if (ui.effectsVolumeValue) ui.effectsVolumeValue.textContent = `${Math.round(game.effectsVolume * 100)}%`;
    if (ui.muteBtn) ui.muteBtn.textContent = game.muted ? '🔇 Sound Off' : '🔊 Sound On';
  }

  function audioPosition(worldX) {
    return clamp(((worldX - game.cameraX) / canvas.width) * 2 - 1, -1, 1);
  }

  function playAudio(eventId, options = {}) {
    return audio?.play(eventId, options) || null;
  }

  function syncAudioSettings(immediateDuck = false) {
    if (!audio) return;
    audio.setMusicVolume(game.musicVolume);
    audio.setEffectsVolume(game.effectsVolume);
    audio.setMuted(game.muted);
    audio.setMusicDuck(game.musicDuck, { immediate: immediateDuck, timeConstant: 0.07 });
  }

  function ensureAudio() {
    audio?.init({
      musicVolume: game.musicVolume,
      effectsVolume: game.effectsVolume,
      muted: game.muted,
    });
    syncAudioSettings(true);
  }

  function stopVehicleIdle() {
    if (!vehicleIdleLoop) return;
    audio?.stopLoop(vehicleIdleLoop);
    vehicleIdleLoop = null;
  }

  function startVehicleIdle(vehicleType = config.vehicle.kind) {
    if (vehicleIdleLoop || !audio) return;
    vehicleIdleLoop = audio.startLoop('vehicle.cosmicIdle', { vehicleType, gain: 0.72 });
  }

  function stopWorldAmbience() {
    if (!ambienceLoop) return;
    audio?.stopLoop(ambienceLoop);
    ambienceLoop = null;
  }

  function startWorldAmbience() {
    if (ambienceLoop || !audio) return;
    ambienceLoop = audio.startLoop('ambience.cosmicCarnival', { gain: levelId === '3-3' ? 0.82 : 0.58 });
  }

  function silenceUnused(except = []) {
    Object.entries(tracks).forEach(([key, track]) => {
      if (except.includes(key)) return;
      track.pause();
      track.volume = 0;
    });
  }

  function alignLoopPhase(from, to) {
    if (!from || !to || !Number.isFinite(from.duration) || !Number.isFinite(to.duration) || from.duration <= 0 || to.duration <= 0) {
      to.currentTime = 0;
      return;
    }
    const phase = (from.currentTime % from.duration) / from.duration;
    to.currentTime = phase * to.duration;
  }

  function setMusic(nextKey, immediate = false) {
    if (!tracks[nextKey] || game.activeMusic === nextKey) return;
    const previousKey = game.activeMusic;
    const next = tracks[nextKey];
    const previous = tracks[previousKey];
    const token = game.musicToken + 1;
    game.musicToken = token;
    game.musicTransition = null;
    silenceUnused(previousKey && previousKey !== nextKey ? [previousKey, nextKey] : [nextKey]);
    if (previousKey !== nextKey) alignLoopPhase(previous, next);
    next.volume = immediate ? 1 : 0;
    next.play().then(() => {
      if (game.musicToken !== token && game.activeMusic !== nextKey) {
        next.pause();
        next.volume = 0;
      }
    }).catch(() => {});
    if (!previousKey || immediate || !previous) {
      game.activeMusic = nextKey;
      silenceUnused([nextKey]);
      return;
    }
    const fromRatio = clamp(previous.volume, 0, 1);
    game.musicTransition = {
      token,
      from: previousKey,
      to: nextKey,
      elapsed: 0,
      duration: 3.2,
      fromRatio: Math.max(0.12, fromRatio),
    };
    game.activeMusic = nextKey;
  }

  function updateMusic(dt) {
    const target = 1;
    if (!game.musicTransition) {
      Object.entries(tracks).forEach(([key, track]) => {
        if (key === game.activeMusic) track.volume = target;
        else if (!track.paused) {
          track.pause();
          track.volume = 0;
        }
      });
      return;
    }
    const transition = game.musicTransition;
    if (transition.token !== game.musicToken) {
      game.musicTransition = null;
      silenceUnused(game.activeMusic ? [game.activeMusic] : []);
      return;
    }
    transition.elapsed += dt;
    const t = clamp(transition.elapsed / transition.duration, 0, 1);
    const from = tracks[transition.from];
    const to = tracks[transition.to];
    if (from) from.volume = target * transition.fromRatio * Math.cos(t * Math.PI * 0.5);
    if (to) to.volume = target * Math.sin(t * Math.PI * 0.5);
    if (t >= 1) {
      if (from) {
        from.pause();
        from.volume = 0;
      }
      if (to) to.volume = target;
      silenceUnused([transition.to]);
      game.musicTransition = null;
    }
  }

  function startCosmicReprise() {
    const reprise = tracks['cosmic-reprise'];
    if (!reprise) return;
    setMusic('cosmic-reprise');
    try { reprise.currentTime = 0; } catch { /* playback position is best effort */ }
  }

  function showMessage(text, duration = 2.2, sub = '') {
    game.message = text;
    game.messageTimer = duration;
    game.subMessage = sub;
    game.subMessageTimer = duration;
  }

  function addImpact(text, x, y, color = '#fff3a4', size = 28, duration = 1.1) {
    if (game.impactTexts.length >= 18) game.impactTexts.shift();
    game.impactTexts.push({ text, x, y, color, size, life: duration, maxLife: duration });
  }

  function burst(x, y, count = 18, colors = ['#ffd65a', '#ff68b4', '#65e7ff', '#9cff79'], speed = 170) {
    const particleLimit = game.reducedShake ? 130 : constrainedDevice ? 240 : 340;
    const requested = game.reducedShake ? Math.ceil(count * 0.55) : count;
    const amount = Math.max(0, Math.min(requested, particleLimit - game.particles.length));
    for (let index = 0; index < amount; index += 1) {
      const angle = seeded() * Math.PI * 2;
      const velocity = speed * (0.45 + seeded() * 0.75);
      game.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 45,
        gravity: 320,
        life: 0.8 + seeded() * 0.9,
        maxLife: 1.7,
        color: colors[index % colors.length],
        size: 3 + seeded() * 7,
        star: index % 5 === 0,
      });
    }
  }

  function launchFirework(x, y, color, delay = 0, shape = 'burst') {
    const fireworkLimit = game.reducedShake ? 8 : constrainedDevice ? 12 : 22;
    if (game.fireworks.length >= fireworkLimit) game.fireworks.shift();
    game.fireworks.push({
      x,
      y,
      color,
      delay,
      life: 1.65,
      maxLife: 1.65,
      spokes: shape === 'star' ? 10 : shape === 'taco' ? 9 : 12,
      shape,
    });
  }

  function startHitStop(duration, source = 'effect') {
    const safeDuration = clamp(Number(duration) || 0, 0, 0.3);
    if (safeDuration <= 0) return;
    game.hitStop = Math.max(game.hitStop, safeDuration);
    game.hitStopEvents += 1;
    game.maxHitStop = Math.max(game.maxHitStop, game.hitStop);
    game.lastHitStopSource = source;
  }

  function updateHitStop(dt) {
    if (game.hitStop <= 0) return false;
    game.hitStop = Math.max(0, game.hitStop - Math.max(0, dt));
    if (game.hitStop === 0) game.hitStopRecoveries += 1;
    return true;
  }

  function resetGame() {
    stopVehicleIdle();
    stopWorldAmbience();
    buildWorld();
    Object.assign(player, {
      x: previewStart || 140,
      y: 340,
      previousBottom: 388,
      vx: 0,
      vy: 0,
      dir: 1,
      grounded: false,
      platform: null,
      coyote: 0,
      jumpBuffer: 0,
      invulnerable: 1,
      anim: 0,
      rotation: 0,
      scale: 1,
    });
    Object.assign(game, {
      state: 'playing',
      score: 0,
      collected: 0,
      goldenCollected: 0,
      hearts: 3,
      cameraX: clamp(player.x - 260, 0, WORLD_WIDTH - canvas.width),
      levelTime: 0,
      finishTime: 0,
      sectionIndex: config.sections.findIndex((section) => player.x >= section.start && player.x < section.end),
      announcedSections: new Set(),
      latestCheckpoint: null,
      message: '',
      messageTimer: 0,
      subMessage: '',
      subMessageTimer: 0,
      novaCharge: 0,
      novaBestCharge: 0,
      novaTimer: 0,
      novaCount: 0,
      novaFlash: 0,
      finalTacosCollected: 0,
      eclipseBreakTimer: 0,
      eclipseBreakDuration: 3.2,
      spawnedBonusTacos: 0,
      splatCombo: 0,
      splatTimer: 0,
      bestSplat: 0,
      vehicle: {
        state: player.x > config.vehicle.end ? 'done' : 'waiting',
        x: 0,
        y: 245,
        baseY: 245,
        timer: 0,
        dropTimer: 0,
        clackBeat: -1,
        launcherPulse: 0,
        throwCount: 0,
        catches: 0,
      },
      particles: [],
      impactTexts: [],
      fireworks: [],
      cameraShake: 0,
      hitStop: 0,
      hitStopEvents: 0,
      hitStopRecoveries: 0,
      maxHitStop: 0,
      lastHitStopSource: 'none',
      celebrationTime: 0,
      celebrationBeat: -1,
      resultsShown: false,
      sceneryBlend: game.sceneryBlend,
      activeMusic: null,
      musicTransition: null,
      musicDuck: 1,
      respawn: heroCore.createRespawnState(),
      setPieceComplete: false,
      lastInput: 'none',
      visibilityPaused: false,
      victoryDashAnnounced: false,
      finalePrompted: false,
      cloudtopFinale: createCloudtopFinaleState(),
      midnightFinale: createMidnightFinaleState(),
      cosmicFinale: createCosmicFinaleState(),
      respawnCount: 0,
      respawnFallbacks: 0,
      lastRespawnLanding: 'none',
      controllerStateSequence: 0,
      controllerStateSyncs: 0,
      audioAbilityState: { magnet: false, frenzy: false },
    });
    clearAllInputs();
    sharedAbilities.reset(game.abilities);
    if (previewSuper) {
      sharedAbilities.activateSuper(game.abilities, 'qa-preview', { silent: true });
      game.abilities.transformTimer = 0;
    }
    if (world.boss && previewBossHits > 0) {
      world.boss.hits = clamp(Math.floor(previewBossHits), 0, 3);
      if (world.boss.hits >= 3) {
        world.boss.defeated = true;
        world.boss.state = 'defeated';
        world.boss.vulnerable = false;
        game.setPieceComplete = true;
        if (world.boss.kind === 'ringmaster') game.eclipseBreakTimer = game.eclipseBreakDuration;
      } else {
        world.boss.state = 'dizzy';
        world.boss.vulnerable = true;
      }
    }
    if (world.pinata && previewPinataHits > 0) {
      world.pinata.hits = clamp(Math.floor(previewPinataHits), 0, 3);
      if (world.pinata.hits >= 3) {
        world.pinata.broken = true;
        game.setPieceComplete = true;
      }
    }
    if (world.finalePinata && previewFinaleHits > 0) {
      world.finalePinata.hits = clamp(Math.floor(previewFinaleHits), 0, 2);
    }
    if (levelId === '3-1' && previewFinalePhase && world.finalePinata) {
      player.x = world.goal.x - 275;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
      game.cameraX = WORLD_WIDTH - canvas.width;
      startCloudtopFinale();
      game.cloudtopFinale.truckX = game.cloudtopFinale.truckStopX;
      game.cloudtopFinale.oliviaVisible = true;
      game.cloudtopFinale.oliviaX = world.goal.x - 120;
      game.cloudtopFinale.oliviaY = GROUND_Y - 118;
      if (previewFinalePhase === 'awaiting-second') {
        world.finalePinata.hits = 1;
        player.x = world.finalePinata.x - player.w + 8;
        setCloudtopFinalePhase('awaiting-second');
      } else if (previewFinalePhase === 'awaiting-third') {
        world.finalePinata.hits = 2;
        player.x = world.finalePinata.x - player.w + 8;
        setCloudtopFinalePhase('awaiting-third');
      } else if (previewFinalePhase === 'taco-rain') {
        world.finalePinata.hits = 3;
        breakFinalePinata();
      } else if (previewFinalePhase === 'final-pose') {
        world.finalePinata.hits = 3;
        world.finalePinata.broken = true;
        game.setPieceComplete = true;
        setCloudtopFinalePhase('final-pose');
        game.cloudtopFinale.timer = 0.75;
        game.cloudtopFinale.bannerReveal = 0.45;
      }
    }
    if (levelId === '3-2' && previewFinalePhase) {
      if (world.boss) {
        world.boss.hits = 3;
        world.boss.defeated = true;
        world.boss.state = 'defeated';
        world.boss.vulnerable = false;
      }
      game.setPieceComplete = true;
      game.victoryDashAnnounced = true;
      player.x = world.goal.x - 430;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
      game.cameraX = WORLD_WIDTH - canvas.width;
      startMidnightFinale();
      const finale = game.midnightFinale;
      finale.padCount = clamp(Math.floor(previewMidwayPads), 0, 3);
      finale.coasterX = finale.coasterStopX;
      finale.oliviaX = world.goal.x - 42;
      finale.oliviaY = GROUND_Y - 118;
      finale.oliviaVisible = true;
      if (previewFinalePhase === 'coaster-entry') {
        setMidnightFinalePhase('coaster-entry');
        finale.timer = 1.05;
      } else if (previewFinalePhase === 'pads') {
        setMidnightFinalePhase('pads');
      } else if (previewFinalePhase === 'full-relight') {
        finale.padCount = 3;
        setMidnightFinalePhase('full-relight');
        finale.timer = 1.4;
        finale.relight = smoothstep(finale.timer / 2.6);
      } else if (previewFinalePhase === 'coaster-lap') {
        finale.padCount = 3;
        finale.oliviaVisible = false;
        finale.relight = 1;
        setMidnightFinalePhase('coaster-lap');
        finale.timer = 1.25;
      } else if (previewFinalePhase === 'final-pose') {
        finale.padCount = 3;
        finale.oliviaVisible = false;
        finale.relight = 1;
        setMidnightFinalePhase('final-pose');
        finale.timer = 0.85;
        finale.bannerReveal = 0.52;
      }
    }
    ui.startOverlay?.classList.add('hidden');
    ui.startOverlay?.classList.remove('visible');
    ui.winOverlay?.classList.add('hidden');
    ui.winOverlay?.classList.remove('visible');
    ui.newBestText?.classList.add('hidden');
    ensureAudio();
    playAudio('ui.start');
    startWorldAmbience();
    Object.values(tracks).forEach((track) => {
      track.pause();
      track.currentTime = 0;
      track.volume = 0;
    });
    game.musicToken += 1;
    const section = currentSection();
    game.sectionIndex = Math.max(0, config.sections.indexOf(section));
    setMusic(section.music, true);
    showMessage(section.name.toUpperCase(), 2.4, 'WORLD 3 • MAXIMUM CARNIVAL ENERGY');
    if (levelId === '3-3' && previewFinalePhase) {
      if (world.boss) {
        world.boss.hits = 3;
        world.boss.defeated = true;
        world.boss.state = 'defeated';
        world.boss.vulnerable = false;
      }
      game.victoryDashAnnounced = true;
      player.x = world.goal.x - 300;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
      game.cameraX = WORLD_WIDTH - canvas.width;
      game.sectionIndex = config.sections.length - 1;
      setMusic(config.sections.at(-1).music, true);
      startCosmicFinale();
      const finale = game.cosmicFinale;
      if (previewFinalePhase === 'zeppelin-return') {
        setCosmicFinalePhase('zeppelin-return');
        finale.timer = 1.5;
      } else if (previewFinalePhase === 'golden-taco') {
        setCosmicFinalePhase('golden-taco');
        finale.timer = 0.75;
      } else if (previewFinalePhase === 'star-relight') {
        finale.goldenTaco.active = false;
        finale.goldenTaco.caught = true;
        setCosmicFinalePhase('star-relight');
        finale.timer = clamp(previewCosmicStars, 0, 9) * 0.5;
        finale.litStars = clamp(Math.floor(previewCosmicStars), 0, 9);
        finale.lastRelitStar = finale.litStars - 1;
        finale.relightWave = finale.litStars / 9;
      } else if (previewFinalePhase === 'taco-nova') {
        finale.goldenTaco.active = false;
        finale.goldenTaco.caught = true;
        finale.litStars = 9;
        finale.relightWave = 1;
        setCosmicFinalePhase('taco-nova');
        finale.timer = 2.5;
      } else if (previewFinalePhase === 'low-gravity') {
        finale.goldenTaco.active = false;
        finale.goldenTaco.caught = true;
        finale.litStars = 9;
        finale.relightWave = 1;
        setCosmicFinalePhase('low-gravity');
        finale.timer = 1.5;
      } else if (previewFinalePhase === 'landing' || previewFinalePhase === 'final-pose') {
        finale.goldenTaco.active = false;
        finale.goldenTaco.caught = true;
        finale.litStars = 9;
        finale.relightWave = 1;
        setCosmicFinalePhase('landing');
        finale.timer = previewFinalePhase === 'final-pose' ? 2.35 : 0.8;
        if (previewFinalePhase === 'final-pose') {
          game.message = '';
          game.messageTimer = 0;
          game.subMessage = '';
          game.subMessageTimer = 0;
        }
      }
      if (['star-relight', 'taco-nova', 'low-gravity', 'landing', 'final-pose'].includes(previewFinalePhase)) {
        startCosmicReprise();
      }
    }
    if (levelId === '3-3' && previewCelebration > 0) {
      game.cosmicFinale.active = true;
      game.cosmicFinale.phase = 'complete';
      game.cosmicFinale.litStars = 9;
      game.cosmicFinale.relightWave = 1;
      game.cosmicFinale.goldenTaco.caught = true;
      game.cosmicFinale.oliviaVisible = true;
      game.cosmicFinale.oliviaX = world.goal.x - 150;
      game.cosmicFinale.oliviaY = GROUND_Y - 118;
      game.cosmicFinale.maximumCrunchReveal = 1;
      game.cosmicFinale.allLevelsReveal = 1;
      game.state = 'won';
      game.celebrationTime = clamp(previewCelebration, 0, FINALE_RESULTS_DELAY - 0.05);
      game.celebrationBeat = Math.max(-1, Math.floor(game.celebrationTime * 1.35) - 1);
      game.message = '';
      game.messageTimer = 0;
      game.subMessage = '';
      game.subMessageTimer = 0;
      player.x = world.goal.x - 275;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
      game.cameraX = WORLD_WIDTH - canvas.width;
      startCosmicReprise();
    }
    if (previewPinataBreak && world.pinata && !world.pinata.broken) {
      world.pinata.hits = 3;
      breakPinata();
    } else if (previewHitStop > 0) {
      startHitStop(previewHitStop, 'qa-preview');
    }
    if (previewRespawn) {
      const checkpoint = world.checkpoints[previewRespawnCheckpoint];
      if (checkpoint) {
        checkpoint.activated = true;
        game.latestCheckpoint = checkpoint;
        player.x = Math.max(player.x, checkpoint.x + checkpoint.w + 120);
      }
      player.y = canvas.height + 130;
      beginRespawn();
    }
  }

  function findRespawnLanding(sourceX) {
    const checkpointX = game.latestCheckpoint
      ? game.latestCheckpoint.x + game.latestCheckpoint.w + 36
      : null;
    const desiredX = clamp(checkpointX ?? sourceX - 420, 90, WORLD_WIDTH - player.w - 90);
    const candidates = world.platforms.filter((platform) => (
      !platform.moving
      && platform.w >= player.w + 80
      && (platform.ground || platform.mainRoute || platform.bossRoute || platform.checkpointPad)
    ));
    const scored = candidates.map((platform) => {
      const safeLeft = platform.x + 34;
      const safeRight = platform.x + platform.w - player.w - 34;
      if (safeRight < safeLeft) return null;
      const targetX = clamp(desiredX, safeLeft, safeRight);
      const center = platform.x + platform.w / 2;
      const aheadPenalty = center > sourceX + 120 ? 900 : 0;
      const elevatedPenalty = platform.ground ? 0 : 260;
      const checkpointBonus = game.latestCheckpoint && Math.abs(center - checkpointX) < 420 ? -700 : 0;
      return {
        platform,
        targetX,
        targetY: platform.y - player.h,
        airY: Math.max(62, platform.y - player.h - 265),
        score: Math.abs(targetX - desiredX) + aheadPenalty + elevatedPenalty + checkpointBonus,
      };
    }).filter(Boolean).sort((left, right) => left.score - right.score);
    if (scored.length) return scored[0];
    return {
      platform: null,
      targetX: clamp(desiredX, 100, WORLD_WIDTH - player.w - 100),
      targetY: GROUND_Y - player.h,
      airY: 118,
      score: 0,
    };
  }

  function beginRespawn() {
    if (game.respawn.active) return;
    sharedAbilities.clearForRespawn(game.abilities);
    const landing = findRespawnLanding(player.x);
    heroCore.beginRespawn(game.respawn, {
      fromX: player.x,
      fromY: player.y,
      targetX: landing.targetX,
      targetY: landing.targetY,
      airY: landing.airY,
    });
    game.respawn.landingPlatform = landing.platform;
    game.lastRespawnLanding = landing.platform?.ground ? 'ground' : landing.platform ? 'platform' : 'fallback-ground';
    Object.assign(keys, { left: false, right: false, jump: false });
    player.jumpBuffer = 0;
    player.coyote = 0;
    game.hearts = Math.max(0, game.hearts - 1);
    if (game.hearts === 0) game.hearts = 3;
    game.novaCharge = 0;
    game.novaTimer = 0;
    game.splatCombo = 0;
    game.splatTimer = 0;
    showMessage('TACO HERO RE-CRUNCHED!', 1.8, 'Golden-beam delivery in progress');
    playAudio('hero.respawnBeam', { position: audioPosition(landing.targetX) });
  }

  function finishRespawnLanding(platform, usedFallback = false) {
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    player.platform = platform || null;
    player.jumpBuffer = 0;
    player.coyote = heroPhysics.coyoteTime;
    heroCore.finishRespawn(game.respawn, player, 1.5);
    game.respawnCount += 1;
    if (usedFallback) game.respawnFallbacks += 1;
    burst(player.x + player.w / 2, player.y + player.h - 8, 22, ['#ffd65a', '#fff7c6', '#65e7ff'], 130);
    playAudio('hero.respawnLand', { position: audioPosition(player.x + player.w / 2) });
  }

  function updateRespawn(dt) {
    if (!game.respawn.active) return false;
    const result = heroCore.advanceRespawn(game.respawn, player, dt);
    if (result.shouldPlace) heroCore.placeRespawn(game.respawn, player);
    if (!game.respawn.spawnPlaced) return true;

    const previousBottom = player.y + player.h;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.y += player.vy * dt;
    player.grounded = false;
    player.platform = null;

    const landing = world.platforms
      .filter((platform) => (
        player.x + player.w >= platform.x + 7
        && player.x <= platform.x + platform.w - 7
        && previousBottom <= platform.y + Math.max(12, platform.dy + 6)
        && player.y + player.h >= platform.y
      ))
      .sort((left, right) => left.y - right.y)[0];
    if (landing) {
      player.y = landing.y - player.h;
      finishRespawnLanding(landing);
      return true;
    }

    if (game.respawn.timer >= 3) {
      const fallback = game.respawn.landingPlatform;
      player.x = game.respawn.targetX;
      player.y = fallback ? fallback.y - player.h : game.respawn.targetY;
      game.lastRespawnLanding = fallback?.ground ? 'ground-safety' : fallback ? 'platform-safety' : 'fallback-safety';
      finishRespawnLanding(fallback, true);
    }
    return true;
  }

  function updatePlatforms(dt) {
    world.platforms.forEach((platform) => {
      platform.dx = 0;
      platform.dy = 0;
      if (!platform.moving) return;
      const oldX = platform.x;
      const oldY = platform.y;
      const wave = Math.sin(game.levelTime * platform.speed + platform.phase);
      if (platform.axis === 'x') platform.x = platform.baseX + wave * platform.range;
      else platform.y = platform.baseY + wave * platform.range;
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;
    });
    if (player.platform) {
      player.x += player.platform.dx;
      player.y += player.platform.dy;
    }
  }

  function updatePlayer(dt) {
    if (game.respawn.active) {
      updateRespawn(dt);
      return;
    }
    const wasGrounded = player.grounded;
    const turbo = game.abilities.frenzyTimer > 0;
    const acceleration = player.grounded ? 1700 : 1150;
    const maxSpeed = turbo ? 350 : 270;
    const cloudtopPhase = game.cloudtopFinale?.phase;
    const cloudtopPlayerLocked = levelId === '3-1'
      && game.cloudtopFinale?.active
      && ['hero-approach', 'olivia-arrival', 'final-pose'].includes(cloudtopPhase);
    const cosmicPhase = game.cosmicFinale?.phase;
    const cosmicPlayerLocked = levelId === '3-3'
      && game.cosmicFinale?.active
      && ['star-dormant', 'zeppelin-return', 'star-relight', 'taco-nova', 'landing', 'complete'].includes(cosmicPhase);
    const cosmicLowGravity = levelId === '3-3'
      && game.cosmicFinale?.active
      && cosmicPhase === 'low-gravity';
    const playerLocked = cloudtopPlayerLocked || cosmicPlayerLocked;
    if (sharedAbilities.suspendForTransformation(game.abilities, player, { disabled: playerLocked, platformAlreadyCarried: true })) return;
    if (player.grounded) sharedAbilities.land(game.abilities);
    const left = playerLocked ? false : keys.left;
    const right = cloudtopPlayerLocked
      ? cloudtopPhase === 'hero-approach'
      : cosmicPlayerLocked
        ? false
        : keys.right || previewAutoRun;
    if (left === right) {
      player.vx *= Math.pow(player.grounded ? 0.0008 : 0.18, dt);
    } else {
      const direction = left ? -1 : 1;
      player.vx += direction * acceleration * dt;
      player.dir = direction;
    }
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    if (previewAutoJump && !playerLocked && player.grounded && Math.floor(game.levelTime * 1.5) % 2 === 0) {
      player.jumpBuffer = heroPhysics.jumpBufferTime;
    }
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? heroPhysics.coyoteTime : Math.max(0, player.coyote - dt);
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -heroPhysics.jumpVelocity * (cosmicLowGravity ? 0.82 : 1);
      player.grounded = false;
      player.platform = null;
      player.coyote = 0;
      player.jumpBuffer = 0;
      playAudio('hero.jump', { position: audioPosition(player.x + player.w / 2) });
    } else if (player.jumpBuffer > 0 && !player.grounded) {
      const superJumpVelocity = sharedAbilities.trySuperJump(game.abilities, {
        suspended: playerLocked || cosmicLowGravity,
        position: audioPosition(player.x + player.w / 2),
      });
      if (superJumpVelocity) {
        player.vy = -superJumpVelocity;
        player.platform = null;
        player.jumpBuffer = 0;
        game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 5);
      } else if (playerLocked || cosmicLowGravity) player.jumpBuffer = 0;
    }
    player.x = clamp(player.x + player.vx * dt, 0, WORLD_WIDTH - player.w);
    const previousBottom = player.y + player.h;
    player.previousY = player.y;
    player.previousBottom = previousBottom;
    const gravityScale = cosmicLowGravity ? 0.42 : 1;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * gravityScale * dt);
    player.y += player.vy * dt;
    player.grounded = false;
    player.platform = null;
    let landingVelocity = 0;
    if (player.vy >= 0) {
      for (const platform of world.platforms) {
        const top = platform.y;
        if (player.x + player.w < platform.x + 7 || player.x > platform.x + platform.w - 7) continue;
        if (previousBottom <= top + Math.max(10, platform.dy + 5) && player.y + player.h >= top) {
          landingVelocity = player.vy;
          player.y = top - player.h;
          player.vy = 0;
          player.grounded = true;
          player.platform = platform;
          sharedAbilities.land(game.abilities);
          break;
        }
      }
    }
    if (!wasGrounded && player.grounded && landingVelocity > 110) {
      playAudio(landingVelocity >= 830 ? 'hero.landHard' : 'hero.landSoft', {
        position: audioPosition(player.x + player.w / 2),
      });
    }
    if (player.y > canvas.height + 110) {
      playAudio('hero.fall', { position: audioPosition(player.x + player.w / 2) });
      beginRespawn();
    }
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.anim += dt * (Math.abs(player.vx) > 25 ? 10 : 4);
  }

  function triggerNovaMilestone(value) {
    if (![25, 50, 75, 100].includes(value)) return;
    const milestonePosition = audioPosition(player.x + player.w / 2);
    if (value === 25) {
      showMessage('TACO NOVA 25% • STAR SPARK!', 1.5);
      burst(player.x + 20, player.y + 20, 22);
      playAudio('ability.tacoNovaMilestone', { milestone: value, position: milestonePosition, pitchCents: -120 });
    } else if (value === 50) {
      showMessage('TACO NOVA 50% • MAGNETIC MIDWAY!', 1.7);
      sharedAbilities.activateMagnet(game.abilities, 5);
      burst(player.x + 20, player.y + 20, 36);
      playAudio('ability.tacoNovaMilestone', { milestone: value, position: milestonePosition });
      playAudio('ability.magnetStart', { position: milestonePosition, delay: 0.08 });
    } else if (value === 75) {
      showMessage('TACO NOVA 75% • RAINBOW RUSH!', 1.8);
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 8);
      burst(player.x + 20, player.y + 20, 54);
      playAudio('ability.tacoNovaMilestone', { milestone: value, position: milestonePosition, pitchCents: 120 });
    } else {
      game.novaCount += 1;
      game.score += 5000;
      game.novaFlash = 1.7;
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 9 : 18);
      sharedAbilities.activateFrenzy(game.abilities, 8);
      sharedAbilities.activateMagnet(game.abilities, 9);
      showMessage('TACO NOVA! MAXIMUM STARS, MAXIMUM CRUNCH!', 2.8, '100-taco chain complete');
      addImpact('TACO NOVA!', player.x + 20, player.y - 28, '#fff3a4', 46, 2);
      burst(player.x + 20, player.y + 20, 150, ['#ffd65a', '#ff68b4', '#65e7ff', '#a87bff', '#7dffb2'], 310);
      playAudio('ability.tacoNovaStart', { position: milestonePosition });
      playAudio('ability.frenzyStart', { position: milestonePosition, delay: 0.1, gain: 0.82 });
      playAudio('ability.magnetStart', { position: milestonePosition, delay: 0.18, gain: 0.78 });
      game.novaCharge = 0;
    }
  }

  function announceSuper(x = player.x + player.w / 2, y = player.y + player.h / 2) {
    showMessage('SUPER TACO HERO!', 2.1, 'One true mid-air Super Jump is ready');
    burst(x, y, game.reducedShake ? 42 : 92, ['#ffd65a', '#65e7ff', '#ff68b4'], 220);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 10);
  }

  function damagePlayer(fromX, options = {}) {
    if (player.invulnerable > 0 || game.respawn.active) return false;
    const direction = fromX < player.x ? 1 : -1;
    const knockbackX = options.knockbackX ?? direction * (options.horizontal ?? 180);
    const knockbackY = options.knockbackY ?? -340;
    if (sharedAbilities.absorbDamage(game.abilities, { position: audioPosition(player.x + player.w / 2) })) {
      player.invulnerable = sharedAbilities.definitions.superHero.damageInvulnerabilityDuration;
      player.vx = knockbackX; player.vy = knockbackY;
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 9);
      showMessage('SUPER POWER DOWN! NORMAL TACO HERO!', 1.45, 'The next hit uses the normal heart system');
      burst(player.x + player.w / 2, player.y + player.h / 2, 42, ['#ff68b4', '#65e7ff', '#ffd65a'], 190);
      return true;
    }
    player.invulnerable = 1.2;
    player.vx = knockbackX; player.vy = knockbackY;
    game.hearts -= 1;
    if (options.message) showMessage(options.message, options.duration || 1.2, options.subMessage || '');
    playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
    if (game.hearts <= 0) beginRespawn();
    return true;
  }

  function collectItem(item) {
    if (item.collected) return;
    item.collected = true;
    if (item.type === 'golden') {
      const superStarted = sharedAbilities.collectGoldenTaco(game.abilities, { position: audioPosition(item.x + item.w / 2) });
      game.goldenCollected += 1;
      game.score += 1200;
      playAudio('collect.goldenTaco', { position: audioPosition(item.x + item.w / 2) });
      showMessage(superStarted ? 'GOLDEN TACO TICKET — SUPER TACO HERO!' : 'GOLDEN TACO TICKET!', superStarted ? 2.1 : 1.15, `${game.goldenCollected}/8 hidden tickets`);
      burst(item.x, item.y, 30, ['#ffd65a', '#fff6ad', '#ff9c4f'], 180);
      return;
    }
    game.collected += 1;
    game.score += 100;
    if (item.novaTrail) {
      game.finalTacosCollected += 1;
      if ([11, 22, 33, 44].includes(game.finalTacosCollected)) {
        const percent = Math.round(game.finalTacosCollected / 44 * 100);
        showMessage(
          `GOLDEN TACO STAR ${percent}%!`,
          1.45,
          game.finalTacosCollected < 44 ? 'Keep the cosmic crunch chain alive' : 'SUPER-NOVA SEQUENCE ARMED',
        );
        burst(item.x, item.y, game.finalTacosCollected === 44 ? 56 : 24, ['#ffd65a', '#65e7ff', '#ff68b4'], 180);
        playAudio('ability.tacoNovaMilestone', {
          milestone: game.finalTacosCollected,
          position: audioPosition(item.x + item.w / 2),
          pitchCents: game.finalTacosCollected * 5,
        });
      }
    }
    game.novaTimer = 3.6;
    const previous = game.novaCharge;
    game.novaCharge = Math.min(100, game.novaCharge + 1);
    game.novaBestCharge = Math.max(game.novaBestCharge, game.novaCharge);
    [25, 50, 75, 100].forEach((milestone) => {
      if (previous < milestone && game.novaCharge >= milestone) triggerNovaMilestone(milestone);
    });
    const superStarted = sharedAbilities.collectTaco(game.abilities, 'taco', { position: audioPosition(item.x + item.w / 2) });
    if (superStarted) announceSuper(item.x, item.y);
    if (item.fromOlivia) game.vehicle.catches += 1;
    if (item.fromOlivia && [5, 15, 30].includes(game.vehicle.catches)) {
      const label = game.vehicle.catches === 5
        ? 'AIRMAIL APPETIZER!'
        : game.vehicle.catches === 15
          ? 'OLIVIA CATCH COMBO!'
          : 'NO CRUMBS LEFT BEHIND!';
      showMessage(label, 1.55, `${game.vehicle.catches} aerial tacos caught`);
      burst(item.x, item.y, game.vehicle.catches === 30 ? 65 : 30);
      playAudio(game.vehicle.catches === 30 ? 'collect.airMailComplete' : 'collect.airMail', {
        position: audioPosition(item.x + item.w / 2),
        pitchCents: game.vehicle.catches === 15 ? 90 : 0,
      });
    }
    if (item.cosmicBonus) {
      game.cosmicFinale.bonusCollected += 1;
      const bonusCount = game.cosmicFinale.bonusCollected;
      if ([9, 18, 27].includes(bonusCount)) {
        showMessage(
          bonusCount === 27 ? 'ALL BONUS TACOS CAUGHT!' : `${bonusCount} LOW-GRAVITY TACOS!`,
          1.35,
          bonusCount === 27 ? 'Maximum cosmic crunch achieved' : 'Keep floating through the taco trails',
        );
      }
    }
    playAudio('collect.taco', {
      position: audioPosition(item.x + item.w / 2),
      streak: Math.max(1, game.novaCharge),
    });
    if (game.collected % 10 === 0) addImpact(`×${game.collected} TACOS!`, item.x, item.y - 10, '#fff3a4', 22);
  }

  function updateCollectibles(dt) {
    const magnet = sharedAbilities.hasMagnet(game.abilities) || game.novaCharge >= 50;
    const activeLeft = game.cameraX - 520;
    const activeRight = game.cameraX + canvas.width + 520;
    world.collectibles.forEach((item) => {
      if (item.collected) return;
      if (!item.dynamic && (item.x < activeLeft || item.x > activeRight)) return;
      item.bob += dt * 3.3;
      if (item.dynamic) {
        item.vy += 620 * dt;
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        if (item.y > GROUND_Y - item.h) {
          item.y = GROUND_Y - item.h;
          item.vy *= -0.42;
          item.vx *= 0.86;
          if (Math.abs(item.vy) < 45) {
            item.dynamic = false;
            item.vy = 0;
          }
        }
      }
      const dx = player.x + player.w / 2 - (item.x + item.w / 2);
      const dy = player.y + player.h / 2 - (item.y + item.h / 2);
      const distance = Math.hypot(dx, dy);
      if (magnet && distance < 330) {
        const pull = 520 * (1 - distance / 360);
        item.x += (dx / Math.max(1, distance)) * pull * dt;
        item.y += (dy / Math.max(1, distance)) * pull * dt;
      }
      if (intersects(player, item) || distance < 28) collectItem(item);
    });
    if (game.novaTimer > 0) game.novaTimer -= dt;
    else if (game.novaCharge > 0) game.novaCharge = Math.max(0, game.novaCharge - dt * 9);
    sharedAbilities.update(game.abilities, dt);
    const magnetActive = sharedAbilities.hasMagnet(game.abilities) || game.novaCharge >= 50;
    const frenzyActive = sharedAbilities.isFrenzy(game.abilities);
    if (game.audioAbilityState.magnet && !magnetActive) playAudio('ability.magnetEnd');
    if (game.audioAbilityState.frenzy && !frenzyActive) playAudio('ability.frenzyEnd');
    game.audioAbilityState.magnet = magnetActive;
    game.audioAbilityState.frenzy = frenzyActive;
  }

  function defeatEnemy(enemy, perfectBounce = true) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.defeated = true;
    game.splatCombo = game.splatTimer > 0 ? game.splatCombo + 1 : 1;
    game.splatTimer = 2.1;
    game.bestSplat = Math.max(game.bestSplat, game.splatCombo);
    game.score += 450 * game.splatCombo;
    const feedback = heroCore.splatFeedback(game.splatCombo, true);
    addImpact(feedback.text, enemy.x + enemy.w / 2, enemy.y, feedback.color, feedback.size);
    playAudio(perfectBounce ? 'combat.enemyStomp' : 'combat.enemySplat', {
      enemyType: enemy.type,
      combo: game.splatCombo,
      position: audioPosition(enemy.x + enemy.w / 2),
    });
    burst(enemy.x + enemy.w / 2, enemy.y + 18, game.splatCombo >= 5 ? 95 : game.splatCombo >= 2 ? 42 : 12);
    const celebration = heroCore.celebrateSplatCombo(game.splatCombo, {
      reduced: game.reducedShake,
      onCelebrate: (reward) => {
        showMessage(reward.label, reward.duration);
        game.cameraShake = Math.max(game.cameraShake, reward.shake);
        startHitStop(reward.hitStop, `splat-${reward.tier || 'combo'}`);
        playAudio('combat.comboMilestone', {
          combo: game.splatCombo,
          position: audioPosition(enemy.x + enemy.w / 2),
          gain: reward.tier === 'supremacy' ? 1.06 : 0.96,
        });
      },
    });
    if (celebration?.tier === 'mega') {
      registerBonusTacos(12);
      for (let index = 0; index < 12; index += 1) {
        addItem(enemy.x + (seeded() - 0.5) * 130, enemy.y - 20, 'taco', {
          dynamic: true,
          vx: (seeded() - 0.5) * 240,
          vy: -220 - seeded() * 180,
          jackpot: true,
        });
      }
    }
    const superStarted = sharedAbilities.splatEnemy(game.abilities, { position: audioPosition(enemy.x + enemy.w / 2) });
    if (superStarted) announceSuper(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
  }

  function updateEnemies(dt) {
    let stompResolvedThisFrame = false;
    world.enemies.forEach((enemy, index) => {
      if (!enemy.alive) return;
      const previousEnemyTop = enemy.y;
      const speedScale = heroCore.updateEnemyBehavior(enemy, dt, { index, fallback: enemy.behaviorType });
      const minX = Number.isFinite(enemy.minX) ? enemy.minX : enemy.roamLeft ?? enemy.x;
      const maxX = Number.isFinite(enemy.maxX) ? enemy.maxX : enemy.roamRight ?? enemy.x;
      const speed = Number.isFinite(enemy.speed) ? enemy.speed : (enemy.baseSpeed || 40);
      enemy.x += enemy.dir * speed * speedScale * dt;
      if (enemy.x <= minX || enemy.x >= maxX) {
        enemy.x = clamp(enemy.x, minX, maxX);
        enemy.dir *= -1;
      }
      const action = enemy.charging || enemy.rolling || enemy.y < enemy.baseY - 3;
      enemy.anim = (enemy.anim || 0) + dt * heroPhysics.enemyVisualAnimationRate;
      const slowBeat = Math.floor(enemy.anim + (enemy.animationPhase || 0));
      if (enemy.type === 'popcorn' || enemy.type === 'lemon') {
        enemy.frame = action ? 1 : slowBeat % 5 === 4 ? 1 : 0;
      } else if (enemy.type === 'cotton') {
        enemy.frame = enemy.y < enemy.baseY - 3 ? 1 : enemy.telegraph && slowBeat % 2 ? 1 : 0;
      } else if (enemy.type === 'pretzel' || enemy.type === 'corndog') {
        enemy.frame = action ? slowBeat % 2 : 0;
      } else {
        enemy.frame = slowBeat % 2;
      }
      if (player.invulnerable > 0 || game.respawn.active) return;
      const contact = heroCore.classifyEnemyContact(player, enemy, {
        routeHelper: enemy.routeHelper,
        previousBottom: player.previousBottom,
        previousTargetTop: previousEnemyTop,
      });
      if (!contact || stompResolvedThisFrame) return;
      const stomp = contact === 'stomp';
      const frenzyContact = !stomp && sharedAbilities.isFrenzy(game.abilities);
      if (stomp || frenzyContact) {
        if (stomp) {
          stompResolvedThisFrame = true;
          player.y = Math.min(player.y, enemy.y - player.h - 1);
        }
        defeatEnemy(enemy, stomp);
        if (stomp) {
          player.vy = -heroPhysics.enemyBounceVelocity;
          player.grounded = false;
          player.platform = null;
        }
      } else {
        game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 9);
        damagePlayer(enemy.x, { knockbackX: -player.dir * 180, knockbackY: -340, message: 'CRUNCH CHECK!', subMessage: 'Bounce on enemies from above' });
      }
    });
    if (game.splatTimer > 0) game.splatTimer -= dt;
    else game.splatCombo = 0;
  }

  function activateCheckpoint(checkpoint) {
    if (checkpoint.activated) return;
    checkpoint.activated = true;
    game.latestCheckpoint = checkpoint;
    game.score += 800;
    game.hearts = 3;
    showMessage(checkpoint.name.toUpperCase(), 3, checkpoint.warning);
    burst(checkpoint.x + checkpoint.w / 2, checkpoint.y + 50, 42, ['#ffd65a', '#65e7ff', '#ff68b4'], 180);
    playAudio('checkpoint.activate', { position: audioPosition(checkpoint.x + checkpoint.w / 2) });
  }

  function updateCheckpoints() {
    world.checkpoints.forEach((checkpoint) => {
      if (player.x + player.w > checkpoint.x && player.x < checkpoint.x + checkpoint.w) activateCheckpoint(checkpoint);
    });
  }

  function vehicleRearLauncherOrigin(vehicle = game.vehicle, type = config.vehicle.kind) {
    const visual = WORLD3_VEHICLE_VISUALS[type];
    return { x: vehicle.x + visual.launcherX, y: vehicle.y + visual.launcherY };
  }

  function throwVehicleTaco() {
    const vehicle = game.vehicle;
    const zeppelin = config.vehicle.kind === 'zeppelin';
    const origin = vehicleRearLauncherOrigin(vehicle);
    const x = origin.x;
    const y = origin.y;
    const arcIndex = vehicle.throwCount % 3;
    addItem(x, y, 'taco', {
      dynamic: true,
      vx: zeppelin ? -168 - arcIndex * 22 : -125 - seeded() * 85,
      vy: zeppelin ? -250 - arcIndex * 54 : -250 - seeded() * 150,
      fromOlivia: true,
      deliveryArc: zeppelin ? arcIndex : null,
    });
    registerBonusTacos(1);
    vehicle.throwCount += 1;
    vehicle.launcherPulse = visualScale.tacoLauncher.pulseSeconds;
    playAudio('vehicle.cosmicTacoDrop', {
      vehicleType: config.vehicle.kind,
      position: audioPosition(x),
      pitchCents: arcIndex * 35,
    });
  }

  function updateVehicle(dt) {
    const event = config.vehicle;
    const vehicle = game.vehicle;
    if (vehicle.state === 'done') return;
    vehicle.launcherPulse = Math.max(0, vehicle.launcherPulse - dt);
    if (vehicle.state === 'waiting' && player.x >= event.start - 520) {
      vehicle.state = 'enter';
      vehicle.x = player.x - 760;
      vehicle.baseY = event.kind === 'coaster' ? 322 : event.kind === 'zeppelin' ? 178 : 158;
      vehicle.y = vehicle.baseY;
      vehicle.timer = 0;
      showMessage(
        event.kind === 'balloon' ? 'OLIVIA’S HIGH-ALTITUDE TACO DROP!' : event.kind === 'coaster' ? 'OLIVIA’S COASTER COURIER!' : 'OLIVIA’S TACO ZEPPELIN PARADE!',
        2.2,
        event.kind === 'coaster' ? 'Rail service is experiencing delicious delays' : 'Catch the glowing taco stream',
      );
      playAudio('vehicle.cosmicApproach', { vehicleType: event.kind, position: -0.82 });
      if (event.kind === 'coaster') playAudio('ride.machineStart', { position: -0.65, delay: 0.12 });
    }
    if (vehicle.state === 'enter') {
      vehicle.timer += dt;
      const targetX = player.x + 270;
      vehicle.x += (targetX - vehicle.x) * Math.min(1, dt * 2.4);
      if (Math.abs(vehicle.x - targetX) < 24 || vehicle.timer > 2.7) {
        vehicle.state = 'drop';
        vehicle.timer = 0;
        showMessage('OLIVIA TAKES THE LEAD!', 1.7, 'She is tossing the taco trail back to you');
        playAudio('vehicle.cosmicAccelerate', {
          vehicleType: event.kind,
          position: audioPosition(vehicle.x),
        });
        startVehicleIdle(event.kind);
      }
    } else if (vehicle.state === 'drop') {
      vehicle.timer += dt;
      vehicle.dropTimer -= dt;
      if (event.kind === 'coaster') {
        const clackBeat = Math.floor(vehicle.timer * 2.5);
        if (clackBeat !== vehicle.clackBeat) {
          vehicle.clackBeat = clackBeat;
          playAudio('ride.coasterClack', { position: audioPosition(vehicle.x), gain: 0.72 });
        }
      }
      const lead = event.kind === 'balloon' ? 315 : 285;
      const targetX = player.x + lead;
      vehicle.x += (targetX - vehicle.x) * Math.min(1, dt * (event.kind === 'balloon' ? 5.4 : 7));
      if (event.kind === 'coaster') vehicle.y = 322 + Math.sin(game.levelTime * 3.5) * 6;
      else vehicle.y = vehicle.baseY + Math.sin(game.levelTime * (event.kind === 'balloon' ? 1.15 : 2)) * (event.kind === 'balloon' ? 2.5 : 5);
      if (vehicle.dropTimer <= 0) {
        vehicle.dropTimer = event.kind === 'zeppelin' ? 0.3 : 0.36;
        throwVehicleTaco();
      }
      if (player.x >= event.end - 360 || vehicle.timer > 23) {
        vehicle.state = 'exit';
        vehicle.timer = 0;
        showMessage('OLIVIA: DELIVERY COMPLETE! MOSTLY!', 1.8);
        stopVehicleIdle();
        playAudio('vehicle.cosmicBoost', {
          vehicleType: event.kind,
          position: audioPosition(vehicle.x),
        });
      }
    } else if (vehicle.state === 'exit') {
      vehicle.timer += dt;
      vehicle.x += (420 + vehicle.timer * 120) * dt;
      vehicle.y -= 18 * dt;
      if (vehicle.x - game.cameraX > canvas.width + 420) {
        vehicle.state = 'done';
        playAudio('vehicle.cosmicDepart', { vehicleType: event.kind, position: 0.9 });
      }
    }
  }

  function breakPinata() {
    if (!world.pinata || world.pinata.broken) return;
    world.pinata.broken = true;
    game.setPieceComplete = true;
    game.score += 5000;
    game.cameraShake = game.reducedShake ? 10 : 21;
    startHitStop(0.14, 'pinata-jackpot');
    showMessage('KABOOM! CLOUDTOP TACO RAINBOW JACKPOT!', 3, 'Maximum-dopamine piñata achieved');
    addImpact('KABOOM!', world.pinata.x + 58, world.pinata.y - 24, '#fff3a4', 52, 2.2);
    burst(world.pinata.x + 58, world.pinata.y + 52, 175, ['#ffd65a', '#ff68b4', '#65e7ff', '#a87bff', '#7dffb2'], 360);
    registerBonusTacos(34);
    for (let index = 0; index < 34; index += 1) {
      addItem(world.pinata.x + 46, world.pinata.y + 30, 'taco', {
        dynamic: true,
        vx: (seeded() - 0.5) * 430,
        vy: -260 - seeded() * 390,
        jackpot: true,
      });
    }
    playAudio('pinata.break', { position: audioPosition(world.pinata.x + world.pinata.w / 2) });
  }

  function updatePinata(dt) {
    if (!world.pinata || world.pinata.broken) return;
    world.pinata.bounceLock = Math.max(0, world.pinata.bounceLock - dt);
    if (!intersects(player, world.pinata) || world.pinata.bounceLock > 0) return;
    if (heroCore.isStomp(player, world.pinata, {
      topTolerance: 58,
      previousBottom: player.previousBottom,
      previousTargetTop: world.pinata.y,
    })) {
      world.pinata.hits += 1;
      world.pinata.bounceLock = 0.42;
      player.y = Math.min(player.y, world.pinata.y - player.h - 1);
      player.vy = -heroPhysics.enemyBounceVelocity;
      game.cameraShake = game.reducedShake ? 4 : 9;
      playAudio('pinata.hit', {
        combo: world.pinata.hits,
        position: audioPosition(world.pinata.x + world.pinata.w / 2),
      });
      burst(world.pinata.x + 58, world.pinata.y + 40, 38);
      showMessage(`PIÑATA STOMP ${world.pinata.hits}/3!`, 1.1);
      if (world.pinata.hits >= 3) breakPinata();
    }
  }

  function setCloudtopFinalePhase(phase) {
    game.cloudtopFinale.phase = phase;
    game.cloudtopFinale.timer = 0;
  }

  function startCloudtopFinale() {
    if (levelId !== '3-1' || game.cloudtopFinale.active || !world.finalePinata) return;
    const finale = game.cloudtopFinale;
    finale.active = true;
    finale.heroStartX = player.x;
    finale.truckX = world.goal.x + 720;
    finale.truckStopX = world.goal.x + 70;
    finale.oliviaX = finale.truckStopX + 42;
    finale.oliviaY = GROUND_Y - 118;
    setCloudtopFinalePhase('hero-approach');
    game.finalePrompted = true;
    showMessage('VICTORY! TACO HERO IS GOING IN!', 1.8, 'The fiesta stays live for the final three-stomp celebration');
  }

  function sprinkleFinaleCrackTacos(pinata) {
    const crackTacos = 7;
    registerBonusTacos(crackTacos);
    for (let index = 0; index < crackTacos; index += 1) {
      addItem(pinata.x + pinata.w / 2, pinata.y + 38, 'taco', {
        dynamic: true,
        vx: (seeded() - 0.5) * 230,
        vy: -160 - seeded() * 210,
        jackpot: true,
        finaleCrack: true,
      });
    }
  }

  function strikeFinalePinata(scripted = false) {
    const pinata = world.finalePinata;
    if (!pinata || pinata.broken || pinata.bounceLock > 0) return;
    pinata.hits += 1;
    pinata.bounceLock = 0.44;
    player.vy = -heroPhysics.enemyBounceVelocity;
    player.x = pinata.x - player.w + 8;
    player.grounded = false;
    player.platform = null;
    game.cameraShake = game.reducedShake ? 6 : 12;
    startHitStop(0.08 + pinata.hits * 0.025, `fiesta-pinata-${pinata.hits}`);
    playAudio('pinata.hit', {
      combo: pinata.hits,
      position: audioPosition(pinata.x + pinata.w / 2),
      pitchCents: pinata.hits * 55,
    });
    burst(pinata.x + pinata.w / 2, pinata.y + 54, 34 + pinata.hits * 18);
    addImpact(
      pinata.hits === 1 ? 'THUNK!' : pinata.hits === 2 ? 'CRACK!' : 'THIRD STOMP!',
      pinata.x + pinata.w / 2,
      pinata.y - 20,
      pinata.hits === 3 ? '#fff3a4' : '#65e7ff',
      30 + pinata.hits * 6,
      1.45,
    );
    if (pinata.hits === 1) {
      setCloudtopFinalePhase('olivia-arrival');
      showMessage('THUNK! THE PIÑATA IS WOBBLING!', 1.45, scripted ? 'The whole carnival cheers as Taco Hero bounces clear' : 'One stomp down');
    } else if (pinata.hits === 2) {
      sprinkleFinaleCrackTacos(pinata);
      setCloudtopFinalePhase('awaiting-third');
      showMessage('OLIVIA: ONE MORE!', 2, 'A few tacos escape while she points up at the cracked piñata');
    } else {
      breakFinalePinata();
    }
  }

  function spawnCloudtopRainTaco() {
    const finale = game.cloudtopFinale;
    if (finale.rainRemaining <= 0) return;
    const left = world.goal.x - 610;
    const right = Math.min(WORLD_WIDTH - 34, world.goal.x + 280);
    addItem(lerp(left, right, seeded()), -45 - seeded() * 180, 'taco', {
      dynamic: true,
      vx: (seeded() - 0.5) * 74,
      vy: 45 + seeded() * 150,
      jackpot: true,
      fiestaRain: true,
    });
    finale.rainRemaining -= 1;
    finale.rainSpawned += 1;
  }

  function breakFinalePinata() {
    const pinata = world.finalePinata;
    if (!pinata || pinata.broken) return;
    const finale = game.cloudtopFinale;
    const rainTarget = cloudtopTacoRainTarget();
    const openingBurst = Math.min(48, rainTarget);
    pinata.broken = true;
    pinata.explosionTimer = 0;
    game.setPieceComplete = true;
    game.score += 15000;
    game.novaFlash = Math.max(game.novaFlash, 1.7);
    game.cameraShake = game.reducedShake ? 12 : 27;
    startHitStop(0.22, 'cloudtop-fiesta-super-kaboom');
    finale.slowMotionTimer = 0.5;
    setCloudtopFinalePhase('taco-rain');
    finale.rainElapsed = 0;
    finale.rainSpawnTimer = 0;
    finale.rainRemaining = rainTarget - openingBurst;
    finale.rainSpawned = openingBurst;
    finale.voiceLineTimer = 0.85;
    finale.catchPoseTimer = 0.5;
    showMessage('OLIVIA: IT’S RAINING TACOS!!', 4.2, 'Keep moving—the next 9 seconds are a fully collectible taco shower');
    addImpact('KABOOM!', pinata.x + pinata.w / 2, pinata.y - 42, '#fff3a4', 62, 2.8);
    addImpact('IT’S RAINING TACOS!', pinata.x + pinata.w / 2, pinata.y + 28, '#65e7ff', 34, 2.5);
    const colors = ['#ffd65a', '#ff68b4', '#65e7ff', '#a87bff', '#7dffb2', '#ff8d68'];
    burst(pinata.x + pinata.w / 2, pinata.y + 58, 230, colors, 470);
    ['burst', 'star', 'ring', 'taco', 'spiral'].forEach((shape, index) => {
      launchFirework(
        pinata.x - 350 + index * 165,
        92 + (index % 2) * 70,
        colors[index % colors.length],
        0.06 + index * 0.1,
        shape,
      );
    });
    registerBonusTacos(rainTarget);
    for (let index = 0; index < openingBurst; index += 1) {
      addItem(pinata.x + pinata.w / 2, pinata.y + 45, 'taco', {
        dynamic: true,
        vx: (seeded() - 0.5) * 560,
        vy: -300 - seeded() * 470,
        jackpot: true,
        fiestaRain: true,
      });
    }
    sharedAbilities.activateMagnet(game.abilities, CLOUDTOP_TACO_RAIN_DURATION + 1.4);
    playAudio('ability.magnetStart', { position: audioPosition(pinata.x + pinata.w / 2), delay: 0.18 });
    playAudio('pinata.break', {
      position: audioPosition(pinata.x + pinata.w / 2),
      duckDb: 9,
      gain: 1.08,
    });
  }

  function updateCloudtopFinaleFireworks() {
    const finale = game.cloudtopFinale;
    const beat = Math.floor((finale.rainElapsed + finale.timer) * 1.55);
    if (beat === finale.fireworkBeat) return;
    finale.fireworkBeat = beat;
    const shapes = ['burst', 'star', 'taco', 'ring'];
    const colors = ['#ffd65a', '#65e7ff', '#ff68b4', '#a87bff', '#7dffb2'];
    launchFirework(
      world.goal.x - 420 + (beat % 4) * 230,
      82 + (beat % 3) * 46,
      colors[beat % colors.length],
      0,
      shapes[beat % shapes.length],
    );
  }

  function updateCloudtopFinale(dt) {
    const finale = game.cloudtopFinale;
    const pinata = world.finalePinata;
    if (!finale.active || !pinata) return;
    finale.timer += dt;
    finale.catchPoseTimer = Math.max(0, finale.catchPoseTimer - dt);

    if (finale.phase === 'hero-approach') {
      const progress = clamp(finale.timer / 1.25, 0, 1);
      const eased = smoothstep(progress);
      player.x = lerp(finale.heroStartX, pinata.x + 18, eased);
      player.y = GROUND_Y - player.h - Math.sin(progress * Math.PI) * 112;
      player.vx = 235 * (1 - progress);
      player.vy = 0;
      player.dir = 1;
      player.grounded = false;
      player.platform = null;
      if (progress >= 1) strikeFinalePinata(true);
      return;
    }

    if (finale.phase === 'olivia-arrival') {
      player.vx *= Math.pow(0.0008, dt);
      const driveProgress = smoothstep(clamp(finale.timer / 1.08, 0, 1));
      finale.truckX = lerp(world.goal.x + 720, finale.truckStopX, driveProgress);
      if (!finale.brakeEffectPlayed && finale.timer >= 0.98) {
        finale.brakeEffectPlayed = true;
        burst(finale.truckStopX + 20, GROUND_Y - 12, 24, ['#d9b37a', '#fff0b5', '#ff68b4'], 118);
        playAudio('ride.machineStart', { position: audioPosition(finale.truckStopX + 20) });
      }
      if (finale.timer >= 0.92) {
        finale.oliviaVisible = true;
        const jumpProgress = clamp((finale.timer - 0.92) / 0.82, 0, 1);
        finale.oliviaX = lerp(finale.truckStopX + 70, world.goal.x - 118, smoothstep(jumpProgress));
        finale.oliviaY = GROUND_Y - 118 - Math.sin(jumpProgress * Math.PI) * 92;
      }
      if (!finale.arrivalCheerPlayed && finale.timer >= 1.32) {
        finale.arrivalCheerPlayed = true;
        showMessage('OLIVIA: YOU DID IT!!', 2.1, 'She jumps out smiling as the villagers answer with a confetti cheer');
        burst(world.goal.x - 92, 248, 46, ['#ffd65a', '#ff68b4', '#65e7ff', '#7dffb2'], 188);
      }
      if (finale.timer >= 2.35) {
        finale.oliviaX = world.goal.x - 120;
        finale.oliviaY = GROUND_Y - 118;
        setCloudtopFinalePhase('awaiting-second');
        showMessage('OLIVIA: YOUR TURN!', 1.8, 'Jump into the piñata for stomp number two');
      }
      return;
    }

    if (finale.phase === 'taco-rain') {
      finale.rainElapsed += dt;
      finale.rainSpawnTimer += dt;
      const remainingAfterBurst = Math.max(1, cloudtopTacoRainTarget() - 48);
      const spawnInterval = CLOUDTOP_TACO_RAIN_DURATION / remainingAfterBurst;
      while (finale.rainRemaining > 0 && finale.rainSpawnTimer >= spawnInterval) {
        finale.rainSpawnTimer -= spawnInterval;
        spawnCloudtopRainTaco();
      }
      const runCenter = world.goal.x - 205;
      finale.oliviaX = clamp(
        runCenter + Math.sin(finale.rainElapsed * 1.55) * 245,
        world.goal.x - 560,
        WORLD_WIDTH - 150,
      );
      finale.oliviaY = GROUND_Y - 118 - Math.abs(Math.sin(finale.rainElapsed * 2.35)) * 88;
      finale.voiceLineTimer -= dt;
      if (finale.voiceLineTimer <= 0) {
        const offset = 1 + Math.floor(seeded() * (CLOUDTOP_VOICE_LINES.length - 1));
        finale.voiceLineIndex = (finale.voiceLineIndex + offset) % CLOUDTOP_VOICE_LINES.length;
        finale.voiceLineTimer = 1.6 + seeded() * 0.95;
        showMessage(`OLIVIA: ${CLOUDTOP_VOICE_LINES[finale.voiceLineIndex]}`, 1.35, `${game.collected.toLocaleString()} tacos collected and the score is still climbing`);
      }
      if (finale.catchPoseTimer <= 0) {
        finale.catchPoseTimer = 1.15 + seeded() * 0.65;
        finale.catchCount += 1;
        burst(finale.oliviaX, finale.oliviaY + 28, 10, ['#ffd65a', '#fff3a4', '#ff68b4'], 105);
        addImpact('GOT ONE!', finale.oliviaX, finale.oliviaY - 8, '#fff3a4', 18, 0.72);
      }
      updateCloudtopFinaleFireworks();
      if (finale.rainElapsed >= CLOUDTOP_TACO_RAIN_DURATION && finale.rainRemaining <= 0) {
        setCloudtopFinalePhase('final-pose');
        finale.bannerReveal = 0;
        showMessage('FINAL FIESTA PHOTO!', 0.72, 'Olivia joins Taco Hero as the carnival banner unfolds');
      }
      return;
    }

    if (finale.phase === 'final-pose') {
      const poseEase = 1 - Math.pow(0.002, dt);
      player.x = lerp(player.x, world.goal.x - 215, poseEase);
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
      player.dir = 1;
      finale.oliviaX = lerp(finale.oliviaX, world.goal.x - 88, poseEase);
      finale.oliviaY = GROUND_Y - 118;
      finale.bannerReveal = smoothstep(clamp((finale.timer - 0.38) / 0.9, 0, 1));
      updateCloudtopFinaleFireworks();
      if (finale.timer >= 2.75) finishLevel();
    }
  }

  function setMidnightFinalePhase(phase) {
    const finale = game.midnightFinale;
    finale.phase = phase;
    finale.timer = 0;
    finale.fireworkBeat = -1;
  }

  function startMidnightFinale() {
    if (levelId !== '3-2' || game.midnightFinale.active) return;
    const finale = game.midnightFinale;
    finale.active = true;
    finale.heroStartX = player.x;
    finale.coasterX = world.goal.x + 720;
    finale.coasterY = GROUND_Y - 142;
    finale.oliviaVisible = false;
    finale.padCount = 0;
    finale.relight = 0;
    world.projectiles = [];
    game.finalePrompted = true;
    setMidnightFinalePhase('blackout');
    showMessage('MIDWAY POWER DOWN!', 1.7, 'Cornelius is popped—the victory lights are waiting for an encore');
    playAudio('ride.machineStart', { position: 0.2, pitchCents: -420 });
  }

  function spawnMidnightPadTacoArc(padIndex) {
    const pad = game.midnightFinale.pads[padIndex];
    if (!pad) return;
    const count = MIDNIGHT_PAD_TACOS;
    const gap = 31;
    const startX = clamp(
      pad.x - ((count - 1) * gap) / 2,
      world.goal.x - 650,
      WORLD_WIDTH - count * gap - 18,
    );
    registerBonusTacos(count);
    for (let index = 0; index < count; index += 1) {
      const progress = count === 1 ? 0 : index / (count - 1);
      addItem(
        startX + index * gap,
        GROUND_Y - 66 - Math.sin(progress * Math.PI) * (70 + padIndex * 13),
        'taco',
        {
          bob: progress * Math.PI + padIndex * 0.55,
          midnightEncore: true,
          midnightPad: padIndex,
        },
      );
    }
  }

  function activateMidnightPad() {
    const finale = game.midnightFinale;
    const padIndex = finale.padCount;
    const pad = finale.pads[padIndex];
    if (!pad || finale.padCooldown > 0) return;
    finale.padCount += 1;
    finale.padCooldown = 0.48;
    finale.padAirborne = false;
    game.score += 1800;
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 6 : 12);
    startHitStop(0.1 + padIndex * 0.02, `midnight-light-pad-${padIndex + 1}`);
    playAudio('ride.machineStart', {
      position: audioPosition(pad.x + 60),
      pitchCents: padIndex * 160,
      duckDb: 4.5 + padIndex * 0.5,
    });
    burst(
      pad.x + 60,
      GROUND_Y - 20,
      54 + padIndex * 18,
      ['#65e7ff', '#ff68b4', '#ffd65a', '#a87bff', '#7dffb2'],
      225,
    );
    addImpact(`LIGHT ${padIndex + 1}!`, pad.x + 60, GROUND_Y - 82, '#fff3a4', 32, 1.6);
    spawnMidnightPadTacoArc(padIndex);
    const [headline, subline] = MIDNIGHT_PAD_MESSAGES[padIndex];
    showMessage(headline, 1.75, subline);
    sharedAbilities.activateMagnet(game.abilities, 12);
    playAudio('ability.magnetStart', { position: audioPosition(pad.x + 60), delay: 0.1, gain: 0.78 });
    if (finale.padCount >= finale.pads.length) {
      setMidnightFinalePhase('full-relight');
      finale.relight = 0;
    }
  }

  function updateMidnightFinaleFireworks() {
    const finale = game.midnightFinale;
    const beat = Math.floor(finale.timer * 1.45);
    if (beat === finale.fireworkBeat) return;
    finale.fireworkBeat = beat;
    const colors = ['#65e7ff', '#ff68b4', '#ffd65a', '#a87bff', '#7dffb2'];
    const shapes = ['ring', 'star', 'burst', 'taco'];
    launchFirework(
      world.goal.x - 520 + (beat % 4) * 205,
      82 + (beat % 3) * 44,
      colors[beat % colors.length],
      0,
      shapes[beat % shapes.length],
    );
    if (beat % 2 === 0) {
      burst(
        world.goal.x - 530 + (beat % 3) * 270,
        GROUND_Y - 70,
        15,
        ['#fff3a4', '#ffd65a', '#ff68b4', '#65e7ff'],
        170,
      );
    }
  }

  function updateMidnightFinale(dt) {
    const finale = game.midnightFinale;
    if (!finale.active) return;
    finale.timer += dt;
    finale.padCooldown = Math.max(0, finale.padCooldown - dt);
    player.x = clamp(player.x, world.goal.x - 665, WORLD_WIDTH - player.w - 18);

    if (finale.phase === 'blackout') {
      player.vx *= Math.pow(0.001, dt);
      if (finale.timer >= 1.65) {
        setMidnightFinalePhase('coaster-entry');
        showMessage('OLIVIA: YOU POPPED HIM!', 2.1, 'Her maintenance coaster is arriving for the midnight encore');
        playAudio('vehicle.cosmicApproach', { vehicleType: 'coaster', position: 0.88 });
      }
      return;
    }

    if (finale.phase === 'coaster-entry') {
      player.vx *= Math.pow(0.005, dt);
      const driveProgress = smoothstep(clamp(finale.timer / 1.45, 0, 1));
      finale.coasterX = lerp(world.goal.x + 720, finale.coasterStopX, driveProgress);
      finale.coasterY = GROUND_Y - 142 - Math.abs(Math.sin(driveProgress * Math.PI * 3)) * 4;
      if (!finale.brakeEffectPlayed && finale.timer >= 1.25) {
        finale.brakeEffectPlayed = true;
        burst(finale.coasterStopX + 42, GROUND_Y - 12, 28, ['#d9b37a', '#fff0b5', '#65e7ff'], 128);
        playAudio('ride.coasterDrop', { position: audioPosition(finale.coasterStopX + 42) });
      }
      if (finale.timer >= 1.35) {
        finale.oliviaVisible = true;
        const jumpProgress = clamp((finale.timer - 1.35) / 0.82, 0, 1);
        finale.oliviaX = lerp(finale.coasterStopX + 88, world.goal.x - 48, smoothstep(jumpProgress));
        finale.oliviaY = GROUND_Y - 118 - Math.sin(jumpProgress * Math.PI) * 92;
      }
      if (!finale.arrivalCheerPlayed && finale.timer >= 1.62) {
        finale.arrivalCheerPlayed = true;
        burst(world.goal.x - 34, 242, 46, ['#ffd65a', '#ff68b4', '#65e7ff', '#7dffb2'], 188);
      }
      if (finale.timer >= 2.5) {
        finale.oliviaX = world.goal.x - 46;
        finale.oliviaY = GROUND_Y - 118;
        setMidnightFinalePhase('pads');
        showMessage('OLIVIA: HIT THE LIGHTS!', 2.2, 'Jump and stomp the three glowing pads from left to right');
        sharedAbilities.activateMagnet(game.abilities, 18);
      }
      return;
    }

    if (finale.phase === 'pads') {
      finale.oliviaY = GROUND_Y - 118 - Math.abs(Math.sin(finale.timer * 2.1)) * 12;
      if (!player.grounded && player.y + player.h < GROUND_Y - 24) finale.padAirborne = true;
      if (player.grounded && finale.padAirborne && finale.padCooldown <= 0) {
        const pad = finale.pads[finale.padCount];
        const playerCenter = player.x + player.w / 2;
        if (pad && playerCenter >= pad.x - 12 && playerCenter <= pad.x + 132) activateMidnightPad();
        else finale.padAirborne = false;
      }
      return;
    }

    if (finale.phase === 'full-relight') {
      finale.relight = smoothstep(clamp(finale.timer / 2.6, 0, 1));
      finale.oliviaY = GROUND_Y - 118 - Math.abs(Math.sin(finale.timer * 3.2)) * 34;
      updateMidnightFinaleFireworks();
      if (!finale.relightAnnounced && finale.timer >= 0.72) {
        finale.relightAnnounced = true;
        showMessage('THE ENTIRE MIDWAY IS LIT!', 2.4, 'Rides spinning, villagers dancing, popcorn officially promoted to confetti');
        game.novaFlash = Math.max(game.novaFlash, 1.15);
        playAudio('cosmic.finale', { position: 0.25, duckDb: 7.5 });
      }
      if (finale.timer >= 3.45) {
        finale.oliviaVisible = false;
        setMidnightFinalePhase('coaster-lap');
        showMessage('OLIVIA: ENCORE LAP!', 1.9, 'The maintenance coaster is circling the party');
        playAudio('vehicle.cosmicBoost', { vehicleType: 'coaster', position: 0.1 });
      }
      return;
    }

    if (finale.phase === 'coaster-lap') {
      const progress = clamp(finale.timer / 4.35, 0, 1);
      const angle = -Math.PI * 0.12 + progress * Math.PI * 2;
      finale.coasterX = world.goal.x - 285 + Math.cos(angle) * 430;
      finale.coasterY = GROUND_Y - 174 + Math.sin(angle) * 54;
      const clackBeat = Math.floor(finale.timer * 2.2);
      if (clackBeat !== finale.coasterClackBeat) {
        finale.coasterClackBeat = clackBeat;
        playAudio('ride.coasterClack', { position: audioPosition(finale.coasterX), gain: 0.7 });
      }
      updateMidnightFinaleFireworks();
      if (progress >= 1) {
        finale.coasterX = world.goal.x - 285;
        finale.coasterY = GROUND_Y - 150;
        setMidnightFinalePhase('final-pose');
        finale.bannerReveal = 0;
        showMessage('OLIVIA: HANDS UP!', 1.45, 'Taco Hero takes the front seat for the final midway photo');
      }
      return;
    }

    if (finale.phase === 'final-pose') {
      const poseEase = 1 - Math.pow(0.001, dt);
      finale.coasterX = lerp(finale.coasterX, world.goal.x - 285, poseEase);
      finale.coasterY = lerp(finale.coasterY, GROUND_Y - 150, poseEase);
      player.x = lerp(player.x, finale.coasterX + 175, poseEase);
      player.y = lerp(player.y, finale.coasterY + 17, poseEase);
      player.vx = 0;
      player.vy = 0;
      player.grounded = false;
      player.platform = null;
      player.dir = 1;
      finale.bannerReveal = smoothstep(clamp((finale.timer - 0.38) / 0.95, 0, 1));
      updateMidnightFinaleFireworks();
      if (finale.timer >= 2.8) finishLevel();
    }
  }

  function setCosmicFinalePhase(phase) {
    const finale = game.cosmicFinale;
    finale.phase = phase;
    finale.timer = 0;
    if (phase === 'star-dormant') game.musicDuck = 0.18;
    else if (phase === 'zeppelin-return') {
      game.musicDuck = 0.24;
      playAudio('vehicle.cosmicApproach', { vehicleType: 'zeppelin', position: 0.85 });
    }
    else if (phase === 'golden-taco') {
      game.musicDuck = 0.3;
      Object.assign(finale.goldenTaco, {
        active: true,
        caught: false,
        magnetized: false,
        x: world.goal.x + 120,
        y: 232,
        vx: -178,
        vy: -142,
        rotation: -0.18,
      });
    } else if (phase === 'star-relight') {
      game.musicDuck = 1;
      finale.relightWave = 0;
      finale.litStars = 0;
      finale.lastRelitStar = -1;
    } else if (phase === 'taco-nova') {
      game.musicDuck = 1;
      finale.novaBeat = -1;
      game.novaFlash = Math.max(game.novaFlash, 1.55);
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 7 : 14);
      showMessage('NINE-STAR TACO NOVA!', 2.8, 'Every adventure is lighting the sky together');
      playAudio('cosmic.finale', { position: 0.15 });
    } else if (phase === 'low-gravity') {
      game.musicDuck = 1;
      spawnCosmicBonusTacos();
      sharedAbilities.activateMagnet(game.abilities, 5.2);
      showMessage('LOW-GRAVITY BONUS TACO FLIGHT!', 2.4, 'Keep jumping while Olivia circles the celebration');
      playAudio('ability.lowGravityStart', { position: 0.1 });
      playAudio('ability.magnetStart', { position: 0.1, delay: 0.14, gain: 0.76 });
    } else if (phase === 'landing') {
      game.musicDuck = 1;
      finale.oliviaVisible = true;
      finale.oliviaX = world.goal.x - 150;
      finale.oliviaY = 158;
      finale.maximumCrunchReveal = 0;
      finale.allLevelsReveal = 0;
      world.collectibles.forEach((item) => {
        if (item.cosmicBonus && !item.collected) item.collected = true;
      });
      showMessage('OLIVIA: WE DID IT!', 0.95, 'One last fist-bump for all nine levels');
    }
    audio?.setMusicDuck(game.musicDuck, { timeConstant: 0.09 });
  }

  function startCosmicFinale() {
    if (levelId !== '3-3' || game.cosmicFinale.active || game.state !== 'playing') return;
    game.cosmicFinale = createCosmicFinaleState();
    game.cosmicFinale.active = true;
    game.cosmicFinale.finishTime = game.levelTime;
    game.finishTime = game.levelTime;
    game.vehicle.state = 'done';
    game.vehicle.launcherPulse = 0;
    player.x = world.goal.x - 300;
    player.y = GROUND_Y - player.h;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    player.platform = groundAt(player.x + player.w / 2) || null;
    game.cameraX = WORLD_WIDTH - canvas.width;
    setCosmicFinalePhase('star-dormant');
    showMessage('THE GOLDEN TACO STAR IS STILL DARK...', 2.75, 'One final taco will complete all nine adventures');
    playAudio('cosmic.finale', { position: 0.12, gain: 0.48, duckDb: 0, pitchCents: -720 });
    game.cosmicFinale.heartbeatBeat = 0;
  }

  function catchCosmicGoldenTaco() {
    const finale = game.cosmicFinale;
    if (!finale.active || finale.phase !== 'golden-taco' || finale.goldenTaco.caught) return;
    finale.goldenTaco.active = false;
    finale.goldenTaco.caught = true;
    game.setPieceComplete = true;
    game.score += 9000;
    sharedAbilities.collectGoldenTaco(game.abilities, { position: audioPosition(player.x + player.w / 2) });
    game.novaFlash = Math.max(game.novaFlash, 1.05);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 5 : 10);
    addImpact('GOLDEN TACO CAUGHT!', player.x + player.w / 2, player.y - 32, '#fff3a4', 34, 1.7);
    burst(player.x + player.w / 2, player.y + 12, 110, ['#ffd65a', '#fff3a4', '#65e7ff', '#ff68b4', '#a87bff'], 270);
    playAudio('collect.cosmicGoldenTaco', { position: audioPosition(player.x + player.w / 2) });
    startCosmicReprise();
    setCosmicFinalePhase('star-relight');
    showMessage('NINE-STAR TACO POWER!', 2.6, 'One star for every completed level');
  }

  function spawnCosmicBonusTacos() {
    const finale = game.cosmicFinale;
    if (finale.bonusSpawned) return;
    finale.bonusSpawned = true;
    const rows = [
      { start: world.goal.x - 650, y: GROUND_Y - 70, gap: 27, height: 80 },
      { start: world.goal.x - 405, y: GROUND_Y - 115, gap: 27, height: 65 },
      { start: world.goal.x - 190, y: GROUND_Y - 70, gap: 27, height: 80 },
    ];
    rows.forEach((row, rowIndex) => {
      for (let index = 0; index < 9; index += 1) {
        const progress = index / 8;
        addItem(
          row.start + index * row.gap,
          row.y - Math.sin(progress * Math.PI) * row.height,
          'taco',
          {
            cosmicBonus: true,
            bonusOrder: rowIndex * 9 + index,
            bob: progress * Math.PI + rowIndex * 0.65,
          },
        );
      }
    });
    registerBonusTacos(COSMIC_BONUS_TACOS);
  }

  function updateCosmicFinaleFireworks() {
    const finale = game.cosmicFinale;
    const beat = Math.floor(finale.timer * 1.65);
    if (beat === finale.novaBeat) return;
    finale.novaBeat = beat;
    const shapes = ['taco', 'star', 'ring', 'spiral'];
    const colors = ['#ffd65a', '#65e7ff', '#ff68b4', '#a87bff', '#7dffb2'];
    const zones = [-430, -185, 85, 300];
    const shapeIndex = beat % shapes.length;
    launchFirework(
      world.goal.x + zones[shapeIndex],
      78 + (beat % 3) * 46,
      colors[beat % colors.length],
      0,
      shapes[shapeIndex],
    );
    if (beat % 2 === 0) {
      burst(
        world.goal.x - 500 + (beat % 4) * 210,
        160 + (beat % 2) * 65,
        18,
        colors,
        185,
      );
    }
  }

  function updateCosmicFinale(dt) {
    const finale = game.cosmicFinale;
    if (!finale.active || game.state !== 'playing') return;
    finale.timer += dt;
    finale.totalTime += dt;
    const duration = COSMIC_FINALE_PHASE_DURATIONS[finale.phase] || 0;
    player.x = clamp(player.x, world.goal.x - 660, WORLD_WIDTH - player.w - 18);

    if (finale.phase === 'star-dormant') {
      const heartbeat = Math.floor(finale.timer);
      if (heartbeat !== finale.heartbeatBeat) {
        finale.heartbeatBeat = heartbeat;
        playAudio('cosmic.finale', { position: 0.12, gain: 0.44, duckDb: 0, pitchCents: -720 });
      }
      player.x = lerp(player.x, world.goal.x - 300, 1 - Math.pow(0.001, dt));
      if (finale.timer >= duration) {
        setCosmicFinalePhase('zeppelin-return');
        showMessage('OLIVIA: LAST TACO, TACO HERO!', 2.8, 'Her zeppelin is returning with the final piece of the star');
      }
      return;
    }

    if (finale.phase === 'zeppelin-return') {
      if (finale.timer >= duration) {
        setCosmicFinalePhase('golden-taco');
        showMessage('OLIVIA: CATCH!', 2, 'Jump for the giant Golden Taco—magnet assist is standing by');
        playAudio('vehicle.cosmicTacoDrop', { vehicleType: 'zeppelin', position: 0.5, gain: 1.1 });
      }
      return;
    }

    if (finale.phase === 'golden-taco') {
      const taco = finale.goldenTaco;
      taco.vy += 255 * dt;
      taco.x += taco.vx * dt;
      taco.y += taco.vy * dt;
      taco.rotation += dt * 1.6;
      if (finale.timer >= 0.82) taco.magnetized = true;
      if (taco.magnetized) {
        const targetX = player.x + player.w / 2 - taco.w / 2;
        const targetY = player.y + 10;
        const pull = 1 - Math.pow(0.035, dt);
        taco.x = lerp(taco.x, targetX, pull);
        taco.y = lerp(taco.y, targetY, pull);
      }
      const tacoBox = { x: taco.x, y: taco.y, w: taco.w, h: taco.h };
      if ((finale.timer > 0.28 && intersects(player, tacoBox)) || finale.timer >= duration - 0.04) {
        catchCosmicGoldenTaco();
      }
      return;
    }

    if (finale.phase === 'star-relight') {
      finale.relightWave = smoothstep(clamp(finale.timer / duration, 0, 1));
      const nextLitStars = Math.min(9, Math.floor(finale.timer / (duration / 9)) + 1);
      while (finale.lastRelitStar < nextLitStars - 1) {
        finale.lastRelitStar += 1;
        finale.litStars = finale.lastRelitStar + 1;
        const [offsetX, offsetY] = NINE_STAR_OFFSETS[finale.lastRelitStar];
        burst(
          world.goal.x + 65 + offsetX,
          GROUND_Y - 158 + offsetY,
          24,
          ['#fff3a4', '#ffd65a', '#65e7ff', '#ff68b4'],
          145,
        );
        playAudio('cosmic.starRelight', {
          position: clamp(offsetX / 550, -1, 1),
          pitchCents: finale.lastRelitStar * 105,
        });
      }
      if (finale.timer >= duration) setCosmicFinalePhase('taco-nova');
      return;
    }

    if (finale.phase === 'taco-nova') {
      updateCosmicFinaleFireworks();
      if (finale.timer >= duration) setCosmicFinalePhase('low-gravity');
      return;
    }

    if (finale.phase === 'low-gravity') {
      updateCosmicFinaleFireworks();
      if (finale.timer >= duration) setCosmicFinalePhase('landing');
      return;
    }

    if (finale.phase === 'landing') {
      const landingProgress = smoothstep(clamp(finale.timer / 1.25, 0, 1));
      finale.oliviaX = lerp(world.goal.x + 32, world.goal.x - 150, landingProgress);
      finale.oliviaY = lerp(158, GROUND_Y - 118, landingProgress);
      const poseEase = 1 - Math.pow(0.001, dt);
      player.x = lerp(player.x, world.goal.x - 285, poseEase);
      player.y = lerp(player.y, GROUND_Y - player.h, poseEase);
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
      player.dir = 1;
      finale.maximumCrunchReveal = smoothstep(clamp((finale.timer - 1.05) / 0.62, 0, 1));
      finale.allLevelsReveal = smoothstep(clamp((finale.timer - 1.8) / 0.62, 0, 1));
      updateCosmicFinaleFireworks();
      if (!finale.fistBumpPlayed && finale.timer >= 1.35) {
        finale.fistBumpPlayed = true;
        burst(world.goal.x - 178, GROUND_Y - 86, 54, ['#ffd65a', '#fff3a4', '#65e7ff', '#ff68b4'], 180);
        playAudio('ability.lowGravityEnd', { position: 0.05 });
        playAudio('cosmic.landing', { position: 0.1 });
      }
      if (finale.timer >= duration) {
        finale.phase = 'complete';
        finale.timer = 0;
        finale.maximumCrunchReveal = 1;
        finale.allLevelsReveal = 1;
        finishLevel();
      }
    }
  }

  function updateFinalePinata(dt) {
    const pinata = world.finalePinata;
    if (!pinata) return;
    pinata.bounceLock = Math.max(0, pinata.bounceLock - dt);
    if (!game.cloudtopFinale.active && player.x >= world.goal.x - 520) startCloudtopFinale();
    updateCloudtopFinale(dt);
    if (pinata.broken) return;
    if (!['awaiting-second', 'awaiting-third'].includes(game.cloudtopFinale.phase)) return;
    if (!intersects(player, pinata) || pinata.bounceLock > 0) return;
    if (!heroCore.isStomp(player, pinata, {
      topTolerance: 72,
      previousBottom: player.previousBottom,
      previousTargetTop: pinata.y,
    })) return;
    player.y = Math.min(player.y, pinata.y - player.h - 1);
    strikeFinalePinata(false);
  }

  function fireBossProjectile(boss) {
    const fromLeft = boss.dir > 0;
    world.projectiles.push({
      x: boss.x + (fromLeft ? boss.w : 0),
      y: boss.y + 40,
      w: 30,
      h: 30,
      vx: boss.dir * (190 + boss.hits * 35),
      vy: boss.kind === 'ringmaster' ? 80 : -260,
      gravity: boss.kind === 'ringmaster' ? 220 : 520,
      life: 4,
      bounceable: true,
    });
    playAudio(boss.kind === 'ringmaster' ? 'boss.special' : 'boss.attack', {
      bossType: boss.kind,
      position: audioPosition(boss.x + boss.w / 2),
    });
  }

  function defeatBoss() {
    const boss = world.boss;
    boss.defeated = true;
    boss.state = 'defeated';
    boss.vulnerable = false;
    game.setPieceComplete = true;
    if (boss.kind === 'ringmaster') game.eclipseBreakTimer = game.eclipseBreakDuration;
    game.score += 9000;
    game.cameraShake = game.reducedShake ? 12 : 24;
    startHitStop(0.16, `${boss.kind}-boss-victory`);
    const text = boss.kind === 'cornelius'
      ? 'KERNEL KABOOM! SIR CORNELIUS GOT POPPED!'
      : 'FINAL ACT FLATTENED! RINGMASTER RADISH IS TOAST!';
    showMessage(
      text,
      3.3,
      boss.kind === 'ringmaster' ? 'The eclipse is breaking—the Taco Nova route is open' : 'The victory route is open',
    );
    addImpact('BOSS CRUNCH!', boss.x + boss.w / 2, boss.y - 35, '#fff3a4', 50, 2.4);
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 190, ['#ffd65a', '#ff68b4', '#65e7ff', '#a87bff', '#7dffb2'], 390);
    registerBonusTacos(28);
    for (let index = 0; index < 28; index += 1) {
      addItem(boss.x + boss.w / 2, boss.y + 30, 'taco', {
        dynamic: true,
        vx: (seeded() - 0.5) * 400,
        vy: -240 - seeded() * 360,
        jackpot: true,
      });
    }
    playAudio('boss.defeat', {
      bossType: boss.kind,
      position: audioPosition(boss.x + boss.w / 2),
    });
    playAudio('boss.celebrate', {
      bossType: boss.kind,
      position: audioPosition(boss.x + boss.w / 2),
      delay: 0.22,
      gain: 0.82,
    });
    if (boss.kind === 'ringmaster') {
      playAudio('boss.phase', { bossType: boss.kind, position: 0, delay: 0.16, duckDb: 7 });
    }
  }

  function updateBoss(dt) {
    const boss = world.boss;
    if (!boss || boss.defeated || player.x < boss.x - 1150) return;
    const previousBossTop = boss.y;
    if (!boss.announced) {
      boss.announced = true;
      const warning = boss.kind === 'cornelius'
        ? 'SIR CORNELIUS POP DEMANDS THREE CRUNCHY STOMPS!'
        : 'RINGMASTER RADISH HAS ONE LAST AIRBORNE ACT!';
      showMessage(warning, 2.8, 'Wait for the golden dizzy opening, then bounce');
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 8);
      playAudio('boss.enter', { bossType: boss.kind, position: audioPosition(boss.x + boss.w / 2) });
    }
    boss.timer += dt;
    boss.invulnerable = Math.max(0, boss.invulnerable - dt);
    const phase = boss.timer % 5.6;
    if (phase < 1.1) {
      boss.state = 'telegraph';
      boss.vulnerable = false;
    } else if (phase < 3.3) {
      boss.state = boss.kind === 'ringmaster' ? 'bombard' : 'charge';
      boss.vulnerable = false;
      boss.x += boss.dir * (boss.kind === 'ringmaster' ? 78 : 145) * dt;
      if (phase > 1.25 && phase - dt <= 1.25) fireBossProjectile(boss);
    } else {
      boss.state = 'dizzy';
      boss.vulnerable = true;
    }
    if (boss.state !== boss.audioState) {
      if (boss.state === 'telegraph') {
        playAudio('boss.windup', { bossType: boss.kind, position: audioPosition(boss.x + boss.w / 2) });
      } else if (boss.state === 'dizzy') {
        playAudio('boss.vulnerable', { bossType: boss.kind, position: audioPosition(boss.x + boss.w / 2) });
      } else if (boss.state === 'bombard' || boss.state === 'charge') {
        playAudio('boss.move', { bossType: boss.kind, position: audioPosition(boss.x + boss.w / 2) });
      }
      boss.audioState = boss.state;
    }
    const left = boss.roamLeft ?? config.boss.x - 440;
    const right = boss.roamRight ?? config.boss.x + 430;
    if (boss.x < left || boss.x > right) {
      boss.x = clamp(boss.x, left, right);
      boss.dir *= -1;
    }
    boss.y = boss.kind === 'ringmaster'
      ? boss.baseY + Math.sin(game.levelTime * 2.2) * 38 + (boss.state === 'dizzy' ? 56 : 0)
      : boss.baseY;
    if (intersects(player, boss) && player.invulnerable <= 0 && !game.respawn.active) {
      if (boss.vulnerable && boss.invulnerable <= 0 && heroCore.isStomp(player, boss, {
        topTolerance: 70,
        previousBottom: player.previousBottom,
        previousTargetTop: previousBossTop,
      })) {
        boss.hits += 1;
        boss.invulnerable = 1.15;
        boss.vulnerable = false;
        boss.timer = 0;
        player.y = Math.min(player.y, boss.y - player.h - 1);
        player.vy = -heroPhysics.enemyBounceVelocity;
        game.cameraShake = game.reducedShake ? 7 : 14;
        showMessage(`BOSS BOUNCE ${boss.hits}/3!`, 1.5, boss.kind === 'cornelius' ? 'THE BUTTERED KNIGHT IS SHOOK' : 'THE RADISH HAS LOST THE PLOT');
        playAudio('boss.damage', {
          bossType: boss.kind,
          combo: boss.hits,
          position: audioPosition(boss.x + boss.w / 2),
          pitchCents: boss.hits * 65,
        });
        if (boss.hits < 3) {
          playAudio('boss.phase', {
            bossType: boss.kind,
            position: audioPosition(boss.x + boss.w / 2),
            delay: 0.12,
            gain: 0.78,
          });
        }
        burst(boss.x + boss.w / 2, boss.y + 30, 70);
        if (boss.hits >= 3) defeatBoss();
      } else {
        damagePlayer(boss.x, { horizontal: 230, knockbackY: -360 });
      }
    }
    if (!boss.defeated && player.x > boss.gateX - 70) {
      player.x = boss.gateX - 72;
      player.vx = Math.min(0, player.vx);
      showMessage('DEFEAT THE BOSS TO OPEN THE STAR GATE!', 1.1);
    }
  }

  function updateProjectiles(dt) {
    world.projectiles.forEach((projectile) => {
      projectile.life -= dt;
      projectile.vy += projectile.gravity * dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (projectile.y > GROUND_Y - projectile.h) {
        projectile.y = GROUND_Y - projectile.h;
        projectile.vy *= -0.55;
      }
      if (projectile.life <= 0 || !intersects(player, projectile) || player.invulnerable > 0) return;
      if (heroCore.isStomp(player, projectile, { topTolerance: 50 })) {
        projectile.life = 0;
        player.vy = -heroPhysics.enemyBounceVelocity;
        game.score += 350;
        addImpact('RETURN TO SENDER!', projectile.x, projectile.y, '#65e7ff', 22);
        burst(projectile.x, projectile.y, 20);
        playAudio('combat.enemyStomp', {
          enemyType: world.boss?.kind === 'cornelius' ? 'popcorn' : 'lemon',
          position: audioPosition(projectile.x),
        });
      } else {
        projectile.life = 0;
        damagePlayer(projectile.x, { horizontal: 0, knockbackY: -320, message: 'CARNIVAL PROJECTILE!', duration: 1.1, subMessage: 'Stomp it or hop clear' });
      }
    });
    world.projectiles = world.projectiles.filter((projectile) => projectile.life > 0);
  }

  function updateParticles(dt) {
    game.particles.forEach((particle) => {
      particle.life -= dt;
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    });
    game.particles = game.particles.filter((particle) => particle.life > 0);
    game.fireworks.forEach((firework) => {
      if (firework.delay > 0) {
        firework.delay -= dt;
        return;
      }
      firework.life -= dt;
    });
    game.fireworks = game.fireworks.filter((firework) => firework.delay > 0 || firework.life > 0);
    game.impactTexts.forEach((impact) => {
      impact.life -= dt;
      impact.y -= 45 * dt;
    });
    game.impactTexts = game.impactTexts.filter((impact) => impact.life > 0);
  }

  function finishLevel() {
    if (game.state !== 'playing') return;
    if (world.boss && !world.boss.defeated) {
      showMessage('THE STAR GATE IS STILL LOCKED!', 1.5, 'Three boss bounces will open it');
      return;
    }
    if (world.finalePinata && (!world.finalePinata.broken || world.finalePinata.explosionTimer > 0)) {
      showMessage('THE FIESTA NEEDS ITS KABOOM!', 1.4, 'Bounce on the final piñata three times');
      return;
    }
    if (levelId === '3-2' && (!game.midnightFinale.active || game.midnightFinale.phase !== 'final-pose')) {
      startMidnightFinale();
      return;
    }
    if (levelId === '3-3' && (!game.cosmicFinale.active || game.cosmicFinale.phase !== 'complete')) {
      startCosmicFinale();
      return;
    }
    game.state = 'won';
    game.finishTime = levelId === '3-3' && game.cosmicFinale.finishTime
      ? game.cosmicFinale.finishTime
      : game.levelTime;
    game.celebrationTime = 0;
    game.celebrationBeat = -1;
    game.resultsShown = false;
    game.score += 12000 + game.hearts * 1200 + game.goldenCollected * 700;
    if (levelId === '3-3') {
      game.setPieceComplete = true;
      player.x = world.goal.x - 285;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = groundAt(player.x + player.w / 2) || null;
    }
    if (levelId !== '3-3') setMusic(config.sections.at(-1).music);
    const previous = game.personalBest;
    const newBest = previous.runs === 0 || game.score > previous.score || game.finishTime < previous.time;
    game.personalBest = {
      score: Math.max(previous.score, game.score),
      time: previous.runs === 0 ? game.finishTime : Math.min(previous.time, game.finishTime),
      runs: previous.runs + 1,
    };
    try { localStorage.setItem(`jft-best-${levelId}`, JSON.stringify(game.personalBest)); } catch { /* optional */ }
    if (ui.resultScore) ui.resultScore.textContent = game.score.toLocaleString();
    if (ui.resultTime) ui.resultTime.textContent = formatTime(game.finishTime);
    if (ui.resultTacos) ui.resultTacos.textContent = `${game.collected}/${game.totalCollectibles}`;
    if (ui.resultGolden) ui.resultGolden.textContent = `${game.goldenCollected}/8`;
    if (ui.resultNova) ui.resultNova.textContent = String(game.novaCount);
    if (ui.resultSetPiece) ui.resultSetPiece.textContent = game.setPieceComplete ? 'MAXIMUM!' : 'Still crunchy';
    if (ui.medalBadge) ui.medalBadge.textContent = game.novaCount >= 2 ? `NOVA ${config.medal}` : config.medal;
    if (ui.winText) ui.winText.textContent = config.finishText;
    if (newBest) ui.newBestText?.classList.remove('hidden');
    game.messageTimer = 0;
    game.message = '';
    game.subMessage = '';
    burst(world.goal.x + 65, GROUND_Y - 120, 48, ['#ffd65a', '#ff68b4', '#65e7ff', '#a87bff', '#7dffb2'], 230);
    playAudio('level.complete', { position: 0.1 });
  }

  function showResultsOverlay() {
    if (game.resultsShown) return;
    game.resultsShown = true;
    ui.winOverlay?.classList.remove('hidden');
    ui.winOverlay?.classList.add('visible');
    requestAnimationFrame(() => ui.winOverlay?.querySelector('[data-next-level]')?.focus());
  }

  function updateFinaleCelebration() {
    const beat = Math.floor(game.celebrationTime * 1.35);
    if (beat === game.celebrationBeat) return;
    game.celebrationBeat = beat;
    playAudio('level.celebrationPulse', {
      position: (beat % 3 - 1) * 0.6,
      pitchCents: (beat % 4) * 75,
    });
    const left = world.goal.x - 210 + (beat % 3) * 135;
    if (levelId === '3-1') {
      burst(left, 215 - (beat % 2) * 55, 12, ['#ffd65a', '#ff68b4', '#65e7ff', '#7dffb2'], 175);
    } else if (levelId === '3-2') {
      const cannonX = beat % 2 ? world.goal.x - 185 : world.goal.x + 230;
      burst(cannonX, GROUND_Y - 65, 14, ['#65e7ff', '#ff68b4', '#ffd65a', '#a87bff'], 190);
    } else {
      const shapes = ['taco', 'star', 'ring', 'spiral'];
      const colors = ['#ffd65a', '#65e7ff', '#ff68b4', '#a87bff'];
      const zones = [-250, 210, -85, 90];
      const shapeIndex = beat % shapes.length;
      launchFirework(
        world.goal.x + zones[shapeIndex],
        92 + (beat % 3) * 34,
        colors[shapeIndex],
        0,
        shapes[shapeIndex],
      );
      // Keep the post-pose sky active without pulling Olivia back into the
      // zeppelin after she has already landed beside Taco Hero.
      burst(left, 145 + (beat % 2) * 34, 10, ['#fff3a4', '#65e7ff', '#a87bff', '#ff68b4'], 175);
    }
  }

  function updateProgress(dt) {
    game.eclipseBreakTimer = Math.max(0, game.eclipseBreakTimer - dt);
    const section = currentSection();
    const index = config.sections.indexOf(section);
    if (index !== game.sectionIndex) {
      game.sectionIndex = index;
      showMessage(section.name.toUpperCase(), 2.1);
      setMusic(section.music);
    }
    if (!game.victoryDashAnnounced && player.x >= victoryRouteStart() && (!world.boss || world.boss.defeated)) {
      game.victoryDashAnnounced = true;
      const victoryMessage = levelId === '3-1'
        ? 'PIÑATA PARADE VICTORY DASH!'
        : levelId === '3-2'
          ? 'CORNELIUS IS POPPED—THE MIDWAY IS YOURS!'
          : 'RINGMASTER ROASTED—LIGHT THE GOLDEN TACO STAR!';
      showMessage(victoryMessage, 2.5, 'No enemies ahead—just tacos, cheers, and maximum sparkle');
      burst(player.x + 80, 190, 90, ['#ffd65a', '#ff68b4', '#65e7ff', '#a87bff', '#7dffb2'], 250);
      playAudio('goal.enter', { position: audioPosition(player.x + 80) });
    }
    if (player.x + player.w >= world.goal.x && !world.finalePinata) {
      if (levelId === '3-2') startMidnightFinale();
      else if (levelId === '3-3') startCosmicFinale();
      else finishLevel();
    }
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    game.subMessageTimer = Math.max(0, game.subMessageTimer - dt);
    game.novaFlash = Math.max(0, game.novaFlash - dt);
    game.cameraShake = Math.max(0, game.cameraShake - dt * 18);
  }

  function update(dt) {
    if (game.visibilityPaused) return;
    updateMusic(dt);
    const sceneryKeys = levelId === '3-1'
      ? ['envSunrise', 'envBalloon', 'envNoon', 'envSunset', 'envStarlight']
      : levelId === '3-2'
        ? [
          'midnightBlueHour',
          'midnightCoaster',
          'midnightFunhouse',
          'midnightBlacklight',
          'midnightTempest',
          'midnightVictory',
        ]
        : [
          'novaLaunch',
          'novaRingway',
          'novaNebula',
          'novaZeppelin',
          'novaEclipse',
          'novaAscension',
        ];
    const sceneryReady = sceneryKeys.every((key) => images[key]?.complete && images[key].naturalWidth);
    if (sceneryReady) game.sceneryBlend = Math.min(1, game.sceneryBlend + dt * 1.6);
    if (game.state !== 'playing') {
      if (game.state === 'won') {
        game.celebrationTime += dt;
        game.messageTimer = Math.max(0, game.messageTimer - dt);
        game.subMessageTimer = Math.max(0, game.subMessageTimer - dt);
        updateFinaleCelebration();
        const resultsDelay = levelId === '3-1'
          ? CLOUDTOP_RESULTS_DELAY
          : levelId === '3-2'
            ? MIDNIGHT_RESULTS_DELAY
            : FINALE_RESULTS_DELAY;
        if (game.celebrationTime >= resultsDelay) showResultsOverlay();
        updateParticles(dt);
      }
      return;
    }
    if (game.settingsOpen) return;
    if (updateHitStop(dt)) {
      updateParticles(dt);
      return;
    }
    const simulationDt = levelId === '3-1' && game.cloudtopFinale.slowMotionTimer > 0 ? dt * 0.42 : dt;
    game.cloudtopFinale.slowMotionTimer = Math.max(0, game.cloudtopFinale.slowMotionTimer - dt);
    game.levelTime += simulationDt;
    updatePlatforms(simulationDt);
    updatePlayer(simulationDt);
    updateCollectibles(simulationDt);
    updateEnemies(simulationDt);
    updateCheckpoints();
    updateVehicle(simulationDt);
    updatePinata(simulationDt);
    updateFinalePinata(simulationDt);
    updateMidnightFinale(simulationDt);
    updateCosmicFinale(simulationDt);
    updateBoss(simulationDt);
    updateProjectiles(simulationDt);
    updateParticles(simulationDt);
    updateProgress(simulationDt);
    const targetCamera = clamp(player.x - canvas.width * 0.36, 0, WORLD_WIDTH - canvas.width);
    game.cameraX = lerp(game.cameraX, targetCamera, 1 - Math.pow(0.0008, simulationDt));
  }

  function drawCell(image, index, columns, rows, dx, dy, dw, dh, alpha = 1) {
    if (!image?.complete || !image.naturalWidth) return false;
    const column = index % columns;
    const row = Math.floor(index / columns);
    const sw = image.naturalWidth / columns;
    const sh = image.naturalHeight / rows;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, column * sw, row * sh, sw, sh, dx, dy, dw, dh);
    ctx.restore();
    return true;
  }

  function drawCellTrimmed(image, index, columns, rows, trims, dx, dy, dw, dh, alpha = 1) {
    if (!image?.complete || !image.naturalWidth) return false;
    const safeTrims = trims || {};
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellWidth = image.naturalWidth / columns;
    const cellHeight = image.naturalHeight / rows;
    const top = safeTrims.top || 0;
    const right = safeTrims.right || 0;
    const bottom = safeTrims.bottom || 0;
    const left = safeTrims.left || 0;
    const sourceWidth = Math.max(1, cellWidth - left - right);
    const sourceHeight = Math.max(1, cellHeight - top - bottom);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      image,
      column * cellWidth + left,
      row * cellHeight + top,
      sourceWidth,
      sourceHeight,
      dx,
      dy,
      dw,
      dh,
    );
    ctx.restore();
    return true;
  }

  function drawWorldPanoramaBand(image, band, destWidth, destHeight, bottom, alpha = 1) {
    if (!image?.complete || !image.naturalWidth) return false;
    const bandY = [0, 341, 683][band];
    const bandHeight = [341, 342, 341][band];
    const cameraProgress = clamp(game.cameraX / (WORLD_WIDTH - canvas.width), 0, 1);
    // Reveal each authored panorama exactly once across the entire level. Keeping
    // both edges just outside the canvas avoids the modulo reset and mirrored
    // tile boundary that previously produced a visible background "skip".
    const x = lerp(-2, canvas.width - destWidth + 2, cameraProgress);
    ctx.save();
    ctx.globalAlpha = alpha * game.sceneryBlend;
    ctx.drawImage(image, 0, bandY, 1536, bandHeight, x, bottom - destHeight, destWidth, destHeight);
    ctx.restore();
    return true;
  }

  function drawHdPanorama(image, destWidth, destHeight, bottom, alpha = 1) {
    if (!image?.complete || !image.naturalWidth) return false;
    const cameraProgress = clamp(game.cameraX / (WORLD_WIDTH - canvas.width), 0, 1);
    const x = lerp(-3, canvas.width - destWidth + 3, cameraProgress);
    ctx.save();
    ctx.globalAlpha = alpha * game.sceneryBlend;
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, x, bottom - destHeight, destWidth, destHeight);
    ctx.restore();
    return true;
  }

  function smoothstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function kickoffEnvironmentBlend(worldX = game.cameraX + canvas.width * 0.5) {
    const halfTransition = KICKOFF_ENVIRONMENT_TRANSITION * 0.5;
    for (let index = 1; index < KICKOFF_ENVIRONMENT_STAGES.length; index += 1) {
      const boundary = KICKOFF_ENVIRONMENT_STAGES[index].start;
      if (worldX < boundary - halfTransition || worldX > boundary + halfTransition) continue;
      return {
        from: KICKOFF_ENVIRONMENT_STAGES[index - 1],
        to: KICKOFF_ENVIRONMENT_STAGES[index],
        mix: smoothstep((worldX - boundary + halfTransition) / KICKOFF_ENVIRONMENT_TRANSITION),
      };
    }
    const stage = [...KICKOFF_ENVIRONMENT_STAGES]
      .reverse()
      .find((candidate) => worldX >= candidate.start) || KICKOFF_ENVIRONMENT_STAGES[0];
    return { from: stage, to: stage, mix: 0 };
  }

  function drawKickoffEnvironmentPanorama(image, stage, alpha) {
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
    const worldCenter = game.cameraX + canvas.width * 0.5;
    const stageProgress = clamp((worldCenter - stage.start) / Math.max(1, stage.end - stage.start), 0, 1);
    const crop = 0.9;
    const sourceWidth = image.naturalWidth * crop;
    const sourceHeight = image.naturalHeight * crop;
    const sourceXRange = image.naturalWidth - sourceWidth;
    const sourceXProgress = clamp(0.5 + (stageProgress - 0.5) * 0.78, 0, 1);
    const sourceX = sourceXRange * sourceXProgress;
    const sourceY = (image.naturalHeight - sourceHeight) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  }

  function drawKickoffEnvironmentScene(stage, alpha) {
    const image = images[stage.image];
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
    return drawKickoffEnvironmentPanorama(image, stage, alpha);
  }

  function drawKickoffEnvironmentLights(environment) {
    const night = lerp(environment.from.night, environment.to.night, environment.mix);
    const warmth = lerp(environment.from.warmth, environment.to.warmth, environment.mix);
    if (warmth > 0.01) {
      const warmthWash = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      warmthWash.addColorStop(0, `rgba(255,164,112,${(warmth * 0.05).toFixed(3)})`);
      warmthWash.addColorStop(1, 'rgba(255,92,176,0)');
      ctx.fillStyle = warmthWash;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (night <= 0.03) return;

    const nightWash = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 30);
    nightWash.addColorStop(0, `rgba(32,24,105,${(night * 0.13).toFixed(3)})`);
    nightWash.addColorStop(0.72, `rgba(91,38,124,${(night * 0.05).toFixed(3)})`);
    nightWash.addColorStop(1, 'rgba(26,14,63,0)');
    ctx.fillStyle = nightWash;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y + 30);

    ctx.save();
    const lightCamera = game.cameraX * 0.42;
    const spacing = 164;
    const firstLight = Math.floor(lightCamera / spacing) - 2;
    for (let index = firstLight; index < firstLight + 10; index += 1) {
      const x = index * spacing - lightCamera + 72;
      const y = 330 + (Math.abs(index * 37) % 82);
      const sparkle = 0.82 + Math.sin(game.levelTime * 1.7 + index * 0.9) * 0.18;
      ctx.globalAlpha = night * sparkle;
      ctx.fillStyle = index % 3 === 0 ? '#65e7ff' : index % 3 === 1 ? '#ffd65a' : '#ff68b4';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, 2.6 + night * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawKickoffEnvironment() {
    const environment = kickoffEnvironmentBlend();
    const baseReady = drawKickoffEnvironmentScene(environment.from, game.sceneryBlend);
    if (!baseReady) return false;
    if (environment.to !== environment.from && environment.mix > 0) {
      drawKickoffEnvironmentScene(environment.to, game.sceneryBlend * environment.mix);
    }
    const night = lerp(environment.from.night, environment.to.night, environment.mix);
    const decorVisibility = 1 - night * 0.42;
    drawHdPanorama(images.middleKickoff, 2290, 500, GROUND_Y + 54, 0.14 * decorVisibility);
    drawHdPanorama(images.nearKickoff, 2360, 486, canvas.height + 20, 0.1 * decorVisibility);
    drawKickoffEnvironmentLights(environment);
    return true;
  }

  function midnightEnvironmentBlend(worldX = game.cameraX + canvas.width * 0.5) {
    const halfTransition = MIDNIGHT_ENVIRONMENT_TRANSITION * 0.5;
    for (let index = 1; index < MIDNIGHT_ENVIRONMENT_STAGES.length; index += 1) {
      const boundary = MIDNIGHT_ENVIRONMENT_STAGES[index].start;
      if (worldX < boundary - halfTransition || worldX > boundary + halfTransition) continue;
      return {
        from: MIDNIGHT_ENVIRONMENT_STAGES[index - 1],
        to: MIDNIGHT_ENVIRONMENT_STAGES[index],
        mix: smoothstep((worldX - boundary + halfTransition) / MIDNIGHT_ENVIRONMENT_TRANSITION),
      };
    }
    const stage = [...MIDNIGHT_ENVIRONMENT_STAGES]
      .reverse()
      .find((candidate) => worldX >= candidate.start) || MIDNIGHT_ENVIRONMENT_STAGES[0];
    return { from: stage, to: stage, mix: 0 };
  }

  function drawMidnightEnvironmentPanorama(image, stage, alpha) {
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
    const worldCenter = game.cameraX + canvas.width * 0.5;
    const stageProgress = clamp((worldCenter - stage.start) / Math.max(1, stage.end - stage.start), 0, 1);
    // Each scene is a single seamless panorama. A shallow overscan crop gives
    // it a continuous subpixel pan without tiling, snapping, or revealing an
    // edge when a transition begins.
    const crop = 0.9;
    const sourceWidth = image.naturalWidth * crop;
    const sourceHeight = image.naturalHeight * crop;
    const sourceXRange = image.naturalWidth - sourceWidth;
    const sourceXProgress = clamp(0.5 + (stageProgress - 0.5) * 0.78, 0, 1);
    const sourceX = sourceXRange * sourceXProgress;
    const sourceY = (image.naturalHeight - sourceHeight) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  }

  function drawMidnightEnvironmentScene(stage, alpha) {
    const image = images[stage.image];
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
    return drawMidnightEnvironmentPanorama(image, stage, alpha);
  }

  function midnightEnvironmentValue(environment, key) {
    return lerp(environment.from[key], environment.to[key], environment.mix);
  }

  function drawMidnightEnvironmentEffects(environment) {
    const glow = midnightEnvironmentValue(environment, 'glow');
    const coaster = midnightEnvironmentValue(environment, 'coaster');
    const prism = midnightEnvironmentValue(environment, 'prism');
    const storm = midnightEnvironmentValue(environment, 'storm');
    const victory = midnightEnvironmentValue(environment, 'victory');
    const parallaxCamera = game.cameraX * 0.38;

    ctx.save();

    // A world-anchored string of small bulbs supplies the independent near
    // parallax layer. Its positions move continuously instead of swapping
    // between background tiles.
    const bulbSpacing = 146;
    const firstBulb = Math.floor(parallaxCamera / bulbSpacing) - 2;
    for (let index = firstBulb; index < firstBulb + 11; index += 1) {
      const x = index * bulbSpacing - parallaxCamera + 44;
      const y = 344 + (Math.abs(index * 29) % 56);
      const victoryWave = victory > 0
        ? smoothstep((player.x - 31800 - (index - firstBulb) * 110) / 900)
        : 0;
      const twinkle = 0.84 + Math.sin(game.levelTime * 1.45 + index * 0.83) * 0.16;
      ctx.globalAlpha = (0.2 + glow * 0.48 + victoryWave * 0.28) * twinkle;
      ctx.fillStyle = index % 3 === 0 ? '#65e7ff' : index % 3 === 1 ? '#ffd65a' : '#ff68b4';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10 + glow * 10;
      ctx.beginPath();
      ctx.arc(x, y, 2.3 + glow * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (coaster > 0.03) {
      const trailCamera = game.cameraX * 0.16;
      const trailSpan = 1180;
      const firstTrail = Math.floor(trailCamera / trailSpan) - 1;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.2;
      for (let index = firstTrail; index < firstTrail + 3; index += 1) {
        const x = index * trailSpan - trailCamera - 90;
        const drift = Math.sin(game.levelTime * 0.8 + index) * 16;
        ctx.globalAlpha = coaster * 0.25;
        ctx.strokeStyle = index % 2 ? '#ff68b4' : '#65e7ff';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x, 245 + drift);
        ctx.bezierCurveTo(x + 210, 106 + drift, x + 475, 312 + drift, x + 730, 152 + drift);
        ctx.stroke();
      }
    }

    if (prism > 0.03) {
      const glintCamera = game.cameraX * 0.24;
      const glintSpacing = 238;
      const firstGlint = Math.floor(glintCamera / glintSpacing) - 2;
      for (let index = firstGlint; index < firstGlint + 8; index += 1) {
        const x = index * glintSpacing - glintCamera + 82;
        const y = 125 + (Math.abs(index * 61) % 170);
        const sparkle = Math.max(0, Math.sin(game.levelTime * 2 + index * 1.7));
        ctx.globalAlpha = prism * (0.08 + sparkle * 0.28);
        ctx.fillStyle = index % 2 ? '#ffd65a' : '#b78cff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 13;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 3.5, y);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 3.5, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // The tempest animates only the distant lightning itself. The scene never
    // receives a full-screen brightness pulse, which keeps the boss readable.
    if (storm > 0.03) {
      const flash = Math.pow(Math.max(0, Math.sin(game.levelTime * 1.55 + 0.8)), 22);
      const lightningCamera = game.cameraX * 0.12;
      const lightningSpacing = 1320;
      const firstStrike = Math.floor(lightningCamera / lightningSpacing) - 1;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#ffe98a';
      ctx.shadowColor = '#ffbd5a';
      ctx.shadowBlur = 18;
      ctx.globalAlpha = storm * (0.07 + flash * 0.48);
      for (let index = firstStrike; index < firstStrike + 3; index += 1) {
        const x = index * lightningSpacing - lightningCamera + 330;
        ctx.beginPath();
        ctx.moveTo(x, 55);
        ctx.lineTo(x - 15, 98);
        ctx.lineTo(x + 8, 122);
        ctx.lineTo(x - 22, 174);
        ctx.lineTo(x - 4, 204);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - 5, 222, 8, Math.PI * 0.15, Math.PI * 1.65);
        ctx.stroke();
      }
    }

    if (victory > 0.03) {
      const relight = smoothstep((player.x - 31800) / 1500) * victory;
      ctx.globalAlpha = relight * 0.1;
      for (let index = 0; index < 4; index += 1) {
        const x = 120 + index * 245;
        const beam = ctx.createLinearGradient(x, 80, x, 410);
        beam.addColorStop(0, index % 2 ? 'rgba(255,214,90,.9)' : 'rgba(101,231,255,.9)');
        beam.addColorStop(1, 'rgba(255,104,180,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(x - 16, 80);
        ctx.lineTo(x + 16, 80);
        ctx.lineTo(x + 120, 410);
        ctx.lineTo(x - 120, 410);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawMidnightEnvironment() {
    const environment = midnightEnvironmentBlend();
    const fromAlpha = environment.to === environment.from ? 1 : 1 - environment.mix;
    const fromReady = drawMidnightEnvironmentScene(
      environment.from,
      game.sceneryBlend * fromAlpha,
    );
    if (!fromReady && environment.to === environment.from) return false;
    if (environment.to !== environment.from && environment.mix > 0) {
      drawMidnightEnvironmentScene(environment.to, game.sceneryBlend * environment.mix);
    }
    drawMidnightEnvironmentEffects(environment);
    return true;
  }

  function novaEnvironmentBlend(worldX = game.cameraX + canvas.width * 0.5) {
    const halfTransition = NOVA_ENVIRONMENT_TRANSITION * 0.5;
    for (let index = 1; index < NOVA_ENVIRONMENT_STAGES.length; index += 1) {
      const boundary = NOVA_ENVIRONMENT_STAGES[index].start;
      if (worldX < boundary - halfTransition || worldX > boundary + halfTransition) continue;
      return {
        from: NOVA_ENVIRONMENT_STAGES[index - 1],
        to: NOVA_ENVIRONMENT_STAGES[index],
        mix: smoothstep((worldX - boundary + halfTransition) / NOVA_ENVIRONMENT_TRANSITION),
      };
    }
    const stage = [...NOVA_ENVIRONMENT_STAGES]
      .reverse()
      .find((candidate) => worldX >= candidate.start) || NOVA_ENVIRONMENT_STAGES[0];
    return { from: stage, to: stage, mix: 0 };
  }

  function drawNovaEnvironmentPanorama(image, stage, alpha) {
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
    const worldCenter = game.cameraX + canvas.width * 0.5;
    const stageProgress = clamp((worldCenter - stage.start) / Math.max(1, stage.end - stage.start), 0, 1);
    // The panorama has a small overscan crop, allowing a continuous subpixel
    // pan throughout the act without repeating, mirroring, or revealing edges.
    const crop = 0.9;
    const sourceWidth = image.naturalWidth * crop;
    const sourceHeight = image.naturalHeight * crop;
    const sourceXRange = image.naturalWidth - sourceWidth;
    const sourceXProgress = clamp(0.5 + (stageProgress - 0.5) * 0.78, 0, 1);
    const sourceX = sourceXRange * sourceXProgress;
    const sourceY = (image.naturalHeight - sourceHeight) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  }

  function drawNovaEnvironmentScene(stage, alpha) {
    const image = images[stage.image];
    if (!image?.complete || !image.naturalWidth || alpha <= 0) return false;
    return drawNovaEnvironmentPanorama(image, stage, alpha);
  }

  function novaEnvironmentValue(environment, key) {
    return lerp(environment.from[key], environment.to[key], environment.mix);
  }

  function drawNovaConstellations(strength, motionScale) {
    if (strength <= 0.04) return;
    const camera = game.cameraX * 0.13;
    const spacing = 1180;
    const first = Math.floor(camera / spacing) - 1;
    const shapes = [
      [[0, 30], [48, 4], [92, 42], [142, 18], [188, 55]],
      [[0, 48], [42, 8], [86, 30], [124, 0], [166, 40]],
      [[0, 18], [44, 54], [92, 12], [138, 42], [184, 8]],
    ];
    ctx.save();
    ctx.lineWidth = 1.2;
    for (let group = first; group < first + 3; group += 1) {
      const points = shapes[Math.abs(group) % shapes.length];
      const originX = group * spacing - camera + 160;
      const originY = 62 + (Math.abs(group * 37) % 92);
      ctx.globalAlpha = strength * 0.17;
      ctx.strokeStyle = group % 2 ? '#65e7ff' : '#fff3a4';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      points.forEach(([px, py], index) => {
        const driftY = Math.sin(game.levelTime * 0.18 * motionScale + group + index) * 1.4;
        if (index === 0) ctx.moveTo(originX + px, originY + py + driftY);
        else ctx.lineTo(originX + px, originY + py + driftY);
      });
      ctx.stroke();
      points.forEach(([px, py], index) => {
        const driftY = Math.sin(game.levelTime * 0.18 * motionScale + group + index) * 1.4;
        ctx.globalAlpha = strength * 0.34;
        ctx.fillStyle = index % 2 ? '#bfa6ff' : '#fff3a4';
        ctx.beginPath();
        ctx.arc(originX + px, originY + py + driftY, index === 2 ? 2.4 : 1.7, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawNovaAuroras(strength, motionScale) {
    if (strength <= 0.04) return;
    const drift = Math.sin(game.levelTime * 0.11 * motionScale) * 34;
    ctx.save();
    ctx.lineCap = 'round';
    [
      { y: 84, color: '#65e7ff', offset: drift },
      { y: 128, color: '#ff68b4', offset: -drift * 0.7 },
    ].forEach((ribbon, index) => {
      ctx.globalAlpha = strength * (index ? 0.055 : 0.07);
      ctx.strokeStyle = ribbon.color;
      ctx.shadowColor = ribbon.color;
      ctx.shadowBlur = 22;
      ctx.lineWidth = constrainedDevice ? 17 : 26;
      ctx.beginPath();
      ctx.moveTo(-90, ribbon.y + ribbon.offset * 0.2);
      ctx.bezierCurveTo(
        canvas.width * 0.24,
        ribbon.y + 54 + ribbon.offset,
        canvas.width * 0.68,
        ribbon.y - 52 - ribbon.offset * 0.45,
        canvas.width + 90,
        ribbon.y + 18,
      );
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawZeppelinLandingBeacons(strength, motionScale) {
    if (levelId !== '3-3' || strength <= 0.04) return;
    const event = config.vehicle;
    if (player.x < event.start - 1800 || player.x > event.end + 700) return;
    ctx.save();
    for (let index = 0; index < 6; index += 1) {
      const worldX = event.start + 540 + index * 1180;
      const screenX = worldX - game.cameraX;
      if (screenX < -80 || screenX > canvas.width + 80) continue;
      const active = smoothstep((player.x - (worldX - 1050)) / 620);
      const pulse = prefersReducedMotion ? 0.86 : 0.82 + Math.sin(game.levelTime * 2.1 * motionScale + index) * 0.12;
      ctx.globalAlpha = strength * (0.12 + active * 0.42) * pulse;
      ctx.strokeStyle = index % 2 ? '#ffd65a' : '#65e7ff';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, 268);
      ctx.lineTo(screenX, 408);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(screenX, 270, 13 + active * 6, 5 + active * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(screenX, 270, 2.5 + active * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEclipseArenaEffects(eclipse) {
    if (levelId !== '3-3' || eclipse <= 0.04 || !world.boss) return;
    const boss = world.boss;
    const approach = smoothstep((player.x - (config.boss.x - 1220)) / 930);
    const centerX = canvas.width * 0.5;
    const centerY = canvas.height * 0.135;

    ctx.save();
    // Carnival bulbs extinguish in a readable left-to-right sweep as the
    // Ringmaster takes the arena. They remain entirely behind gameplay.
    for (let index = 0; index < 12; index += 1) {
      const local = index / 11;
      const light = 1 - smoothstep((approach - local * 0.82) / 0.18);
      const x = 42 + local * (canvas.width - 84);
      ctx.globalAlpha = eclipse * (0.05 + light * 0.46);
      ctx.fillStyle = index % 2 ? '#ffd65a' : '#ff68b4';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = light * 12;
      ctx.beginPath();
      ctx.arc(x, 316, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!boss.defeated && approach > 0.18) {
      const bossX = boss.x + boss.w / 2 - game.cameraX;
      const spotlight = ctx.createLinearGradient(bossX, 38, bossX, GROUND_Y);
      spotlight.addColorStop(0, 'rgba(255,243,164,.28)');
      spotlight.addColorStop(1, 'rgba(255,104,180,0)');
      ctx.globalAlpha = eclipse * approach * 0.34;
      ctx.fillStyle = spotlight;
      ctx.beginPath();
      ctx.moveTo(bossX - 24, 38);
      ctx.lineTo(bossX + 24, 38);
      ctx.lineTo(bossX + 118, GROUND_Y);
      ctx.lineTo(bossX - 118, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }

    if (boss.defeated) {
      const breakProgress = clamp(
        1 - game.eclipseBreakTimer / Math.max(0.01, game.eclipseBreakDuration),
        0,
        1,
      );
      const reveal = smoothstep(Math.min(1, breakProgress * 1.7));
      const star = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 76);
      star.addColorStop(0, 'rgba(255,255,224,.98)');
      star.addColorStop(0.28, 'rgba(255,214,90,.92)');
      star.addColorStop(0.62, 'rgba(101,231,255,.46)');
      star.addColorStop(1, 'rgba(101,231,255,0)');
      ctx.globalAlpha = eclipse * reveal;
      ctx.fillStyle = star;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 78, 0, Math.PI * 2);
      ctx.fill();

      if (game.eclipseBreakTimer > 0) {
        const radius = 58 + breakProgress * 350;
        ['#ffd65a', '#65e7ff', '#ff68b4', '#a87bff'].forEach((color, index) => {
          ctx.globalAlpha = eclipse * (1 - breakProgress) * (0.54 - index * 0.07);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4 - index * 0.55;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius + index * 11, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      const relightFront = canvas.width * smoothstep(breakProgress);
      const wave = ctx.createLinearGradient(Math.max(0, relightFront - 170), 0, relightFront + 25, 0);
      wave.addColorStop(0, 'rgba(255,214,90,0)');
      wave.addColorStop(0.74, 'rgba(101,231,255,.2)');
      wave.addColorStop(1, 'rgba(255,104,180,0)');
      ctx.globalAlpha = eclipse * 0.42;
      ctx.fillStyle = wave;
      ctx.fillRect(0, 328, Math.max(0, relightFront + 25), 78);
    }
    ctx.restore();
  }

  function drawNovaEnvironmentEffects(environment) {
    const stars = novaEnvironmentValue(environment, 'stars');
    const rings = novaEnvironmentValue(environment, 'rings');
    const nebula = novaEnvironmentValue(environment, 'nebula');
    const comets = novaEnvironmentValue(environment, 'comets');
    const eclipse = novaEnvironmentValue(environment, 'eclipse');
    const victory = novaEnvironmentValue(environment, 'victory');
    const motionScale = prefersReducedMotion ? 0.22 : constrainedDevice ? 0.62 : 1;

    ctx.save();

    // Three world-anchored star fields move at distinct continuous rates. On
    // constrained phones the far and middle fields remain while density drops.
    const starLayers = constrainedDevice
      ? [
        { speed: 0.07, spacing: 156, baseY: 58, range: 206, alpha: 0.2, size: 1.3, offset: 19 },
        { speed: 0.18, spacing: 218, baseY: 102, range: 226, alpha: 0.28, size: 1.9, offset: 83 },
      ]
      : [
        { speed: 0.06, spacing: 128, baseY: 48, range: 204, alpha: 0.18, size: 1.15, offset: 19 },
        { speed: 0.16, spacing: 176, baseY: 84, range: 228, alpha: 0.24, size: 1.6, offset: 83 },
        { speed: 0.3, spacing: 246, baseY: 122, range: 220, alpha: 0.3, size: 2.15, offset: 137 },
      ];
    starLayers.forEach((layer, layerIndex) => {
      const parallaxCamera = game.cameraX * layer.speed;
      const firstStar = Math.floor(parallaxCamera / layer.spacing) - 2;
      const count = Math.ceil(canvas.width / layer.spacing) + 5;
      for (let localIndex = 0; localIndex < count; localIndex += 1) {
        const index = firstStar + localIndex;
        const x = index * layer.spacing - parallaxCamera + layer.offset;
        const seed = Math.abs(index * (43 + layerIndex * 18) + layer.offset * 7);
        const y = layer.baseY + (seed % layer.range);
        const twinkle = prefersReducedMotion
          ? 0.86
          : 0.82 + Math.sin(game.levelTime * (1.1 + layerIndex * 0.23) + index * 0.79) * 0.18;
        ctx.globalAlpha = stars * layer.alpha * twinkle;
        ctx.fillStyle = (index + layerIndex) % 3 === 0
          ? '#fff4ad'
          : (index + layerIndex) % 3 === 1
            ? '#76edff'
            : '#d2a6ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 5 + layerIndex * 3;
        ctx.beginPath();
        ctx.arc(x, y, layer.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    drawNovaConstellations(stars * (0.48 + rings * 0.52), motionScale);

    if (rings > 0.03) {
      const ringCamera = game.cameraX * 0.1;
      const ringSpacing = 1260;
      const firstRing = Math.floor(ringCamera / ringSpacing) - 1;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -game.levelTime * 12 * motionScale;
      for (let index = firstRing; index < firstRing + 3; index += 1) {
        const x = index * ringSpacing - ringCamera + 260;
        const y = 118 + (Math.abs(index * 47) % 84);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.sin(index * 1.7) * 0.24) + game.levelTime * 0.015 * motionScale);
        ctx.globalAlpha = rings * 0.15;
        ctx.strokeStyle = index % 2 ? '#ffd65a' : '#65e7ff';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, 148, 48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = rings * 0.08;
        ctx.beginPath();
        ctx.ellipse(0, 0, 110, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);
    }

    if (nebula > 0.03) {
      const drift = Math.sin(game.levelTime * 0.14 * motionScale) * 26;
      const leftGlow = ctx.createRadialGradient(115 + drift, 130, 8, 115 + drift, 130, 260);
      leftGlow.addColorStop(0, 'rgba(255,104,180,.2)');
      leftGlow.addColorStop(0.54, 'rgba(168,123,255,.08)');
      leftGlow.addColorStop(1, 'rgba(168,123,255,0)');
      ctx.globalAlpha = nebula * 0.58;
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, 420, 390);

      const rightGlow = ctx.createRadialGradient(
        canvas.width - 90 - drift,
        120,
        8,
        canvas.width - 90 - drift,
        120,
        250,
      );
      rightGlow.addColorStop(0, 'rgba(101,231,255,.19)');
      rightGlow.addColorStop(0.58, 'rgba(125,255,178,.06)');
      rightGlow.addColorStop(1, 'rgba(101,231,255,0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(canvas.width - 430, 0, 430, 390);
    }
    drawNovaAuroras(nebula, motionScale);
    drawZeppelinLandingBeacons(comets * (1 - eclipse), motionScale);

    if (comets > 0.03) {
      const cometCount = constrainedDevice ? 2 : 4;
      ctx.lineCap = 'round';
      for (let index = 0; index < cometCount; index += 1) {
        const distance = canvas.width + 520;
        const travel = (game.levelTime * (62 + index * 9) * motionScale + index * 430) % distance;
        const x = canvas.width + 230 - travel;
        const y = 55 + index * 54 + Math.sin(index * 1.9) * 18;
        const trail = ctx.createLinearGradient(x - 96, y + 44, x, y);
        trail.addColorStop(0, 'rgba(101,231,255,0)');
        trail.addColorStop(0.7, index % 2 ? 'rgba(255,104,180,.52)' : 'rgba(101,231,255,.52)');
        trail.addColorStop(1, 'rgba(255,244,173,.92)');
        ctx.globalAlpha = comets * 0.5;
        ctx.strokeStyle = trail;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = index % 2 ? '#ff68b4' : '#65e7ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x - 96, y + 44);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    drawEclipseArenaEffects(eclipse);

    // The eclipse itself lives in the authored panorama. Only its restrained
    // corona and hit cracks animate, so the arena never flashes or pulses over
    // the player. Each boss hit permanently adds one readable fracture.
    if (eclipse > 0.05) {
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.135;
      const bossHits = clamp(world.boss?.hits || 0, 0, 3);
      ctx.globalAlpha = eclipse * (0.24 + bossHits * 0.07);
      ctx.strokeStyle = bossHits >= 3 ? '#7dffb2' : '#ffbe63';
      ctx.shadowColor = bossHits >= 3 ? '#65e7ff' : '#ff786a';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 52 + bossHits * 3, 0, Math.PI * 2);
      ctx.stroke();
      const cracks = [
        [[-15, -45], [-7, -29], [-15, -17], [-5, -5]],
        [[42, -16], [24, -11], [30, 4], [12, 14]],
        [[-37, 26], [-22, 16], [-15, 32], [-1, 23]],
      ];
      ctx.globalAlpha = eclipse * 0.72;
      ctx.strokeStyle = '#fff3a4';
      ctx.lineWidth = 2.4;
      for (let crackIndex = 0; crackIndex < bossHits; crackIndex += 1) {
        ctx.beginPath();
        cracks[crackIndex].forEach(([offsetX, offsetY], pointIndex) => {
          if (pointIndex === 0) ctx.moveTo(centerX + offsetX, centerY + offsetY);
          else ctx.lineTo(centerX + offsetX, centerY + offsetY);
        });
        ctx.stroke();
      }
    }

    if (victory > 0.03) {
      const relight = smoothstep((player.x - 31500) / 1500) * victory;
      ctx.globalAlpha = relight * 0.09;
      for (let index = 0; index < 5; index += 1) {
        const x = 92 + index * (canvas.width - 184) / 4;
        const beam = ctx.createLinearGradient(x, 56, x, 420);
        beam.addColorStop(0, index % 2 ? 'rgba(255,214,90,.95)' : 'rgba(101,231,255,.95)');
        beam.addColorStop(1, 'rgba(255,104,180,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(x - 13, 56);
        ctx.lineTo(x + 13, 56);
        ctx.lineTo(x + 92, 420);
        ctx.lineTo(x - 92, 420);
        ctx.closePath();
        ctx.fill();
      }
      const starX = canvas.width * 0.5;
      const starY = canvas.height * 0.18;
      ctx.globalAlpha = relight * 0.42;
      ctx.strokeStyle = '#fff3a4';
      ctx.shadowColor = '#65e7ff';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(starX, starY, 24 + Math.sin(game.levelTime * 0.8 * motionScale) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawNovaEnvironment() {
    const environment = novaEnvironmentBlend();
    const fromAlpha = environment.to === environment.from ? 1 : 1 - environment.mix;
    const fromReady = drawNovaEnvironmentScene(
      environment.from,
      game.sceneryBlend * fromAlpha,
    );
    if (!fromReady && environment.to === environment.from) return false;
    if (environment.to !== environment.from && environment.mix > 0) {
      drawNovaEnvironmentScene(environment.to, game.sceneryBlend * environment.mix);
    }
    drawNovaEnvironmentEffects(environment);
    return true;
  }

  function drawGroundGapUnderlay() {
    const palettes = [
      ['rgba(255,238,241,.98)', 'rgba(206,179,233,.98)', 'rgba(125,92,180,.98)'],
      ['rgba(67,35,104,.98)', 'rgba(34,18,69,.99)', 'rgba(16,9,42,.99)'],
      ['rgba(53,43,126,.98)', 'rgba(25,20,84,.99)', 'rgba(9,7,45,.99)'],
    ][config.band];
    const gradient = ctx.createLinearGradient(0, GROUND_Y - 8, 0, canvas.height);
    gradient.addColorStop(0, palettes[0]);
    gradient.addColorStop(0.5, palettes[1]);
    gradient.addColorStop(1, palettes[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, GROUND_Y - 6, canvas.width, canvas.height - GROUND_Y + 6);

    // A quiet lower-atmosphere texture makes intentional platform gaps read as
    // cloud/space depth without pretending that they are collision surfaces.
    ctx.save();
    ctx.globalAlpha = config.band === 0 ? 0.34 : 0.2;
    ctx.fillStyle = config.band === 0 ? '#fff7f0' : config.band === 1 ? '#ff68b4' : '#65e7ff';
    for (let index = 0; index < 7; index += 1) {
      const x = 55 + index * 158;
      const y = GROUND_Y + 31 + (index % 3) * 19;
      ctx.beginPath();
      ctx.ellipse(x, y, 90, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBackground() {
    if (images.far.complete && images.far.naturalWidth) {
      const bandY = [0, 341, 683][config.band];
      const bandHeight = [341, 342, 341][config.band];
      ctx.drawImage(images.far, 0, bandY, 1536, bandHeight, 0, 0, canvas.width, canvas.height);
    } else {
      const gradients = [
        ['#f8849f', '#8152a1', '#95ddfa'],
        ['#21134f', '#3d1976', '#e94e9a'],
        ['#090629', '#222268', '#5c2f9f'],
      ][config.band];
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, gradients[0]);
      gradient.addColorStop(0.55, gradients[1]);
      gradient.addColorStop(1, gradients[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawGroundGapUnderlay();
    if (levelId === '3-1') {
      drawKickoffEnvironment();
    } else if (levelId === '3-2') {
      drawMidnightEnvironment();
    } else if (levelId === '3-3') {
      drawNovaEnvironment();
    } else {
      // These master rows contain different scenery from left to right. They
      // span the whole world without repeating or snapping between tiles.
      drawWorldPanoramaBand(images.middle, config.band, 1900, 422, GROUND_Y + 54, 0.9);
      drawWorldPanoramaBand(images.near, config.band, 2100, 466, canvas.height + 22, 0.95);
    }
    const haze = ctx.createLinearGradient(0, 130, 0, GROUND_Y);
    haze.addColorStop(0, 'rgba(255,255,255,0)');
    haze.addColorStop(1, config.band === 0 ? 'rgba(255,181,169,.08)' : 'rgba(81,64,164,.08)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 120, canvas.width, GROUND_Y - 120);
  }

  function drawGroundTile(platform, screenX) {
    const style = platform.style;
    const alignedX = Math.floor(screenX) - 2;
    const alignedWidth = Math.ceil(platform.w) + 4;
    if (!images.terrain.complete || !images.terrain.naturalWidth) {
      ctx.fillStyle = ['#d9edf4', '#25183e', '#20184f'][style];
      ctx.fillRect(alignedX, platform.y, alignedWidth, platform.h);
      ctx.fillStyle = ['#fff', '#48e4ef', '#aa78ff'][style];
      ctx.fillRect(alignedX, platform.y, alignedWidth, 8);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(alignedX, platform.y - 12, alignedWidth, platform.h + 70);
    ctx.clip();
    const sourceX = style * 512;
    const tileWidth = 320;
    for (let offset = 0; offset < alignedWidth + tileWidth; offset += tileWidth - 9) {
      ctx.drawImage(images.terrain, sourceX, 0, 512, 220, alignedX + offset, platform.y - 38, tileWidth + 2, 139);
    }
    ctx.restore();
  }

  function drawUpperPlatform(platform, screenX) {
    if (!images.terrain.complete || !images.terrain.naturalWidth) {
      ctx.fillStyle = ['#effbff', '#34264f', '#2b2162'][platform.style];
      ctx.fillRect(screenX, platform.y, platform.w, platform.h);
      return;
    }
    ctx.drawImage(
      images.terrain,
      platform.style * 512,
      210,
      512,
      150,
      screenX - 4,
      platform.y - 40,
      platform.w + 8,
      92,
    );
    if (platform.moving) {
      ctx.save();
      ctx.strokeStyle = ['rgba(255,255,255,.72)', 'rgba(101,231,255,.7)', 'rgba(183,140,255,.72)'][platform.style];
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(screenX + platform.w / 2, platform.y - 42);
      ctx.lineTo(screenX + platform.w / 2, platform.y - 78);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlatforms() {
    world.platforms.forEach((platform) => {
      const x = platform.x - game.cameraX;
      if (x + platform.w < -80 || x > canvas.width + 80) return;
      if (platform.ground) drawGroundTile(platform, x);
      else drawUpperPlatform(platform, x);
    });
  }

  function drawTaco(item) {
    const x = item.x - game.cameraX;
    if (x < -50 || x > canvas.width + 50 || item.collected) return;
    const y = item.y + Math.sin(item.bob) * 4;
    if (item.type === 'golden') {
      const pulse = 1 + Math.sin(game.levelTime * 5 + item.bob) * 0.1;
      ctx.save();
      ctx.translate(x + 15, y + 15);
      ctx.scale(pulse, pulse);
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ffd65a';
      ctx.fillStyle = '#fff0a0';
      ctx.strokeStyle = '#b96a20';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const radius = point % 2 ? 7 : 14;
        const angle = -Math.PI / 2 + point * Math.PI / 5;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (images.items.complete) ctx.drawImage(images.items, 0, 0, 16, 16, -8, -8, 16, 16);
      ctx.restore();
      return;
    }
    ctx.save();
    if (item.fromOlivia) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#65e7ff';
    } else if (item.cosmicBonus) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = item.bonusOrder % 2 ? '#ffd65a' : '#a87bff';
    } else if (item.jackpot) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ff68b4';
    }
    if (images.items.complete && images.items.naturalWidth) ctx.drawImage(images.items, 0, 0, 16, 16, x, y, item.w, item.h);
    else {
      ctx.fillStyle = '#ffd65a';
      ctx.fillRect(x, y + 8, item.w, item.h - 8);
    }
    ctx.restore();
  }

  function enemyCell(type, frame) {
    const safeFrame = Number.isFinite(frame) ? Math.abs(Math.floor(frame)) : 0;
    const base = { popcorn: 0, cotton: 2, pretzel: 4, lemon: 6, bumper: 8, corndog: 10 }[type] || 0;
    return base + (safeFrame % 2);
  }

  const ENEMY_SPRITE_PROFILES = Object.freeze({
    popcorn: {
      width: 82,
      height: 82,
      groundInset: 5,
      trims: [
        { top: 62, right: 57, bottom: 0, left: 133 },
        { top: 82, right: 45, bottom: 0, left: 76 },
      ],
    },
    cotton: {
      width: 78,
      height: 84,
      groundInset: 5,
      trims: [
        { top: 67, right: 110, bottom: 0, left: 108 },
        { top: 66, right: 147, bottom: 31, left: 62 },
      ],
    },
    pretzel: {
      width: 92,
      height: 76,
      groundInset: 5,
      trims: [
        { top: 46, right: 64, bottom: 50, left: 123 },
        { top: 63, right: 123, bottom: 56, left: 44 },
      ],
    },
    lemon: {
      width: 82,
      height: 84,
      groundInset: 5,
      trims: [
        { top: 45, right: 122, bottom: 51, left: 84 },
        { top: 53, right: 92, bottom: 49, left: 14 },
      ],
    },
    bumper: {
      width: 104,
      height: 70,
      groundInset: 4,
      trims: [
        { top: 9, right: 70, bottom: 96, left: 113 },
        { top: 4, right: 99, bottom: 95, left: 51 },
      ],
    },
    corndog: {
      width: 82,
      height: 86,
      groundInset: 5,
      trims: [
        { top: 0, right: 141, bottom: 76, left: 58 },
        { top: 9, right: 161, bottom: 82, left: 21 },
      ],
    },
  });

  function drawEnemies() {
    world.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const x = enemy.x - game.cameraX;
      if (x < -130 || x > canvas.width + 130) return;
      const bob = enemy.telegraph ? Math.sin(game.levelTime * 9 + enemy.animationPhase) * 1.25 : 0;
      const cell = enemyCell(enemy.type, enemy.frame);
      const profile = ENEMY_SPRITE_PROFILES[enemy.type] || ENEMY_SPRITE_PROFILES.popcorn;
      const stretchX = enemy.charging ? 1.12 : enemy.telegraph ? 0.92 : 1;
      const stretchY = enemy.charging ? 0.9 : enemy.telegraph ? 1.08 : 1;
      const actionTilt = enemy.type === 'pretzel' && enemy.frame
        ? enemy.dir * 0.075
        : enemy.type === 'corndog' && enemy.frame
          ? enemy.dir * -0.085
          : enemy.type === 'bumper'
            ? Math.sin(game.levelTime * 2.1 + enemy.animationPhase) * 0.018
            : 0;
      ctx.save();
      // Anchor the opaque feet themselves into the platform surface. The old
      // oval sat on the terrain while the artwork sat on the oval, which made
      // correctly placed enemies read as though they were floating.
      ctx.translate(x + enemy.w / 2, enemy.y + enemy.h + profile.groundInset);
      ctx.rotate(actionTilt);
      ctx.scale(enemy.dir < 0 ? -1 : 1, 1);
      ctx.scale(stretchX, stretchY);
      if (!drawCellTrimmed(
        images.enemies,
        cell,
        4,
        4,
        profile.trims[Number.isFinite(enemy.frame) ? Math.abs(Math.floor(enemy.frame)) % 2 : 0] || {},
        -profile.width / 2,
        -profile.height + bob,
        profile.width,
        profile.height,
      )) {
        ctx.fillStyle = '#ff9c4f';
        ctx.fillRect(-enemy.w / 2, -enemy.h, enemy.w, enemy.h);
      }
      ctx.restore();
      heroCore.drawEnemyBehaviorSignals(ctx, enemy, x, { warningColor: '#ffd65a', chargeColor: '#ff68b4', rollColor: '#65e7ff' });
    });
  }

  const CHECKPOINT_SPRITE_PROFILES = Object.freeze({
    0: { trims: {}, width: 246, height: 164, groundInset: 6 },
    1: { trims: {}, width: 236, height: 174, groundInset: 6 },
    2: { trims: {}, width: 260, height: 155, groundInset: 7 },
    3: { trims: {}, width: 246, height: 160, groundInset: 7 },
    4: { trims: { top: 45 }, width: 238, height: 154, groundInset: 6 },
    5: { trims: { top: 58, bottom: 8 }, width: 242, height: 148, groundInset: 6 },
  });

  function drawCheckpoints() {
    world.checkpoints.forEach((checkpoint) => {
      const x = checkpoint.x - game.cameraX;
      if (x < -270 || x > canvas.width + 270) return;
      const groundY = checkpoint.groundY ?? GROUND_Y;
      const alpha = checkpoint.activated ? 1 : 0.88;
      const pulse = checkpoint.activated ? 1 + Math.sin(game.levelTime * 4) * 0.02 : 1;
      const sprite = CHECKPOINT_SPRITE_PROFILES[checkpoint.look] || CHECKPOINT_SPRITE_PROFILES[0];
      const visualGroundY = groundY + sprite.groundInset;
      ctx.save();
      // The building base is the visual anchor. Shadows are deliberately not
      // part of checkpoint placement, so the structure cannot appear to rest
      // on an oval above the platform.
      ctx.translate(x + 95, visualGroundY);
      ctx.scale(pulse, pulse);
      drawCellTrimmed(
        images.finale,
        checkpoint.look,
        4,
        4,
        sprite.trims,
        -sprite.width / 2,
        -sprite.height,
        sprite.width,
        sprite.height,
        alpha,
      );
      ctx.restore();
      if (checkpoint.activated) {
        ctx.save();
        ctx.fillStyle = 'rgba(18,8,43,.7)';
        ctx.strokeStyle = '#65e7ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 14, groundY - 195, 218, 35, 13);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff4b8';
        ctx.font = '900 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(checkpoint.name.toUpperCase(), x + 95, groundY - 173);
        ctx.restore();
      }
      const oliviaFrame = checkpoint.activated ? 2 : 1;
      drawCell(images.olivia, oliviaFrame, 4, 3, x + 132, groundY - 112, 136, 121, checkpoint.activated ? 1 : 0.92);
    });
  }

  function drawVehicleRearLauncherPulse(screenX, screenY, launcherPulse) {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.shadowColor = '#ffd65a';
    ctx.shadowBlur = launcherPulse > 0 ? 14 : 5;
    ctx.fillStyle = '#d83983';
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -5, 18, 10, 5);
    ctx.fill();
    ctx.stroke();
    if (launcherPulse > 0) {
      const progress = clamp(1 - launcherPulse / visualScale.tacoLauncher.pulseSeconds, 0, 1);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#65e7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-2, 0, 8 + progress * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffd65a';
      ctx.beginPath();
      ctx.arc(-2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVehicle() {
    const vehicle = game.vehicle;
    if (vehicle.state === 'waiting' || vehicle.state === 'done') return;
    const x = vehicle.x - game.cameraX;
    const type = config.vehicle.kind;
    const visual = WORLD3_VEHICLE_VISUALS[type];
    drawCell(images.olivia, visual.cell, 4, 3, x, vehicle.y, visual.width, visual.height);
    if (vehicle.state === 'drop') {
      const origin = vehicleRearLauncherOrigin(vehicle, type);
      drawVehicleRearLauncherPulse(origin.x - game.cameraX, origin.y, vehicle.launcherPulse);
    }
    if (vehicle.state === 'exit') {
      ctx.save();
      ctx.strokeStyle = '#65e7ff';
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.65;
      for (let index = 0; index < 4; index += 1) {
        ctx.beginPath();
        ctx.moveTo(x - 20 - index * 15, vehicle.y + 95 + index * 13);
        ctx.lineTo(x - 130 - index * 32, vehicle.y + 95 + index * 13);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawPinata() {
    if (!world.pinata) return;
    const pinata = world.pinata;
    const x = pinata.x - game.cameraX;
    if (x < -180 || x > canvas.width + 180) return;
    if (pinata.broken) {
      drawCellTrimmed(images.finale, 14, 4, 4, { right: 88, bottom: 10 }, x - 38, pinata.y - 40, 192, 150, 0.92);
      return;
    }
    const frame = pinata.hits > 0 ? 13 : 12;
    const bounce = Math.sin(game.levelTime * 3.3) * 5;
    if (frame === 13) {
      drawCellTrimmed(images.finale, frame, 4, 4, { right: 52, bottom: 12 }, x - 24, pinata.y - 5 + bounce, 168, 118);
    } else {
      drawCellTrimmed(images.finale, frame, 4, 4, { left: 76, right: 70, bottom: 16 }, x - 28, pinata.y - 8 + bounce, 175, 117);
    }
    ctx.save();
    ctx.fillStyle = 'rgba(24,9,51,.72)';
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 8, pinata.y - 38, 132, 28, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3b5';
    ctx.font = '900 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`PIÑATA ${pinata.hits}/3`, x + 58, pinata.y - 19);
    ctx.restore();
  }

  const BOSS_SPRITE_PROFILES = Object.freeze({
    cornelius: [
      { cell: 12, trims: { left: 102, right: 38, bottom: 84 }, width: 215, height: 143 },
      { cell: 13, trims: { left: 67, right: 90, bottom: 79 }, width: 215, height: 143 },
    ],
    ringmaster: [
      { cell: 14, trims: { left: 42, right: 119, bottom: 90 }, width: 250, height: 167 },
      { cell: 15, trims: { left: 3, right: 108, bottom: 89 }, width: 250, height: 167 },
    ],
  });

  function drawBoss() {
    const boss = world.boss;
    if (!boss || boss.defeated) return;
    const x = boss.x - game.cameraX;
    if (x < -280 || x > canvas.width + 280) return;
    const profileIndex = boss.kind === 'cornelius'
      ? (boss.state === 'dizzy' ? 1 : 0)
      : (boss.state === 'bombard' ? 1 : 0);
    const profile = BOSS_SPRITE_PROFILES[boss.kind][profileIndex];
    const groundY = boss.groundY ?? GROUND_Y;
    const telegraphPulse = boss.state === 'telegraph' ? 1 + Math.sin(game.levelTime * 18) * 0.07 : 1;
    const dizzyTilt = boss.state === 'dizzy' ? Math.sin(game.levelTime * 9) * 0.08 : 0;
    if (boss.kind === 'ringmaster') {
      // Ringmaster Radish is intentionally airborne, so only this boss keeps
      // an aerial projection on the arena below.
      ctx.save();
      ctx.fillStyle = 'rgba(101,231,255,.16)';
      ctx.beginPath();
      ctx.ellipse(x + boss.w / 2, GROUND_Y - 4, 78, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (boss.vulnerable) {
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffd65a';
      ctx.fillStyle = 'rgba(255,214,90,.15)';
      ctx.beginPath();
      ctx.ellipse(x + boss.w / 2, boss.y + boss.h / 2, 92, 67, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    const renderBottom = boss.kind === 'ringmaster' ? boss.y + 78 : groundY + 5;
    ctx.translate(x + boss.w / 2, renderBottom);
    ctx.rotate(dizzyTilt);
    ctx.scale(telegraphPulse, 2 - telegraphPulse);
    drawCellTrimmed(
      images.enemies,
      profile.cell,
      4,
      4,
      profile.trims,
      -profile.width / 2,
      -profile.height,
      profile.width,
      profile.height,
      boss.invulnerable > 0 && Math.floor(game.levelTime * 18) % 2 ? 0.45 : 1,
    );
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(18,8,43,.8)';
    ctx.strokeStyle = boss.vulnerable ? '#7dffb2' : '#ff68b4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - 35, boss.y - 55, boss.w + 70, 38, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff5c2';
    ctx.font = '900 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.kind === 'cornelius' ? 'SIR CORNELIUS POP' : 'RINGMASTER RADISH'}  ${boss.hits}/3`, x + boss.w / 2, boss.y - 31);
    ctx.restore();
  }

  function drawBossGate() {
    const boss = world.boss;
    if (!boss || boss.defeated) return;
    const x = boss.gateX - game.cameraX;
    if (x < -80 || x > canvas.width + 80) return;
    ctx.save();
    const gradient = ctx.createLinearGradient(x - 20, 0, x + 20, 0);
    gradient.addColorStop(0, 'rgba(255,104,180,0)');
    gradient.addColorStop(0.45, 'rgba(255,104,180,.72)');
    gradient.addColorStop(0.55, 'rgba(101,231,255,.78)');
    gradient.addColorStop(1, 'rgba(101,231,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 34, 120, 68, GROUND_Y - 120);
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 4;
    for (let y = 132; y < GROUND_Y; y += 34) {
      ctx.globalAlpha = 0.45 + Math.sin(game.levelTime * 6 + y * 0.04) * 0.22;
      ctx.beginPath();
      ctx.moveTo(x - 24, y);
      ctx.lineTo(x + 24, y + 18);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(22,8,50,.84)';
    ctx.strokeStyle = '#ffd65a';
    ctx.beginPath();
    ctx.roundRect(x - 92, 92, 184, 38, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3b5';
    ctx.font = '1000 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`STAR GATE LOCKED • ${boss.hits}/3`, x, 116);
    ctx.restore();
  }

  function drawProjectiles() {
    world.projectiles.forEach((projectile) => {
      const x = projectile.x - game.cameraX;
      ctx.save();
      ctx.translate(x + projectile.w / 2, projectile.y + projectile.h / 2);
      ctx.rotate(game.levelTime * 7);
      ctx.shadowBlur = 13;
      ctx.shadowColor = '#ff68b4';
      ctx.fillStyle = '#b3ed62';
      ctx.strokeStyle = '#593075';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, projectile.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawHero() {
    if (heroCore.hidePlayerDuringRespawn(game.respawn)) return;
    const x = player.x - game.cameraX;
    const airborne = !player.grounded;
    const running = !airborne && Math.abs(player.vx) > 35;
    const frame = airborne ? (player.vy < 0 ? 4 : 5) : running ? 1 + (Math.floor(player.anim) % 3) : 0;
    sharedAbilities.drawHeroEffects(ctx, game.abilities, player, game.cameraX, game.levelTime * 1000, { reducedMotion: game.reducedShake });
    ctx.save();
    ctx.translate(x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(player.rotation);
    sharedAbilities.applyHeroVisualTransform(ctx, game.abilities, { direction: player.dir, baseScale: player.scale || 1, anchorY: 33, time: game.levelTime * 1000 });
    if (game.abilities.frenzyTimer > 0) {
      ctx.shadowBlur = 22;
      ctx.shadowColor = '#ffd65a';
    } else if (game.novaCharge >= 75) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#65e7ff';
    }
    sharedAbilities.applyHeroStyle(ctx, game.abilities);
    if (player.invulnerable > 0 && Math.floor(game.levelTime * 15) % 2) ctx.globalAlpha = 0.5;
    if (images.hero.complete && images.hero.naturalWidth) {
      sharedAbilities.drawHeroSpriteFrame(ctx, game.abilities, images.hero, frame, { x: -33, y: -33, width: 66, height: 66, running, animation: player.anim });
    } else {
      ctx.fillStyle = '#ffd65a';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    game.particles.forEach((particle) => {
      const screenX = particle.x - game.cameraX;
      if (screenX < -80 || screenX > canvas.width + 80 || particle.y < -80 || particle.y > canvas.height + 80) return;
      const alpha = clamp(particle.life / Math.min(particle.maxLife, 1), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(screenX, particle.y);
      ctx.rotate(particle.life * 7);
      ctx.fillStyle = particle.color;
      if (particle.star) {
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const radius = point % 2 ? particle.size * 0.45 : particle.size;
          const angle = -Math.PI / 2 + point * Math.PI / 5;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.58);
      }
      ctx.restore();
    });
    game.fireworks.forEach((firework) => {
      if (firework.delay > 0) return;
      const progress = clamp(1 - firework.life / firework.maxLife, 0, 1);
      const alpha = Math.sin(progress * Math.PI);
      const radius = 24 + progress * 118;
      const screenX = firework.x - game.cameraX;
      ctx.save();
      ctx.translate(screenX, firework.y);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = firework.color;
      ctx.fillStyle = firework.color;
      ctx.lineWidth = 3.5 * (1 - progress * 0.55);
      ctx.shadowBlur = 14;
      ctx.shadowColor = firework.color;
      if (firework.shape === 'ring') {
        [0.62, 0.82, 1].forEach((scale, index) => {
          ctx.globalAlpha = alpha * (0.82 - index * 0.16);
          ctx.lineWidth = 4 - index * 0.8;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * scale, radius * scale * 0.38, progress * 0.22 + index * 0.22, 0, Math.PI * 2);
          ctx.stroke();
        });
      } else if (firework.shape === 'star') {
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const pointRadius = point % 2 ? radius * 0.44 : radius;
          const angle = -Math.PI / 2 + point * Math.PI / 5 + progress * 0.12;
          const px = Math.cos(angle) * pointRadius;
          const py = Math.sin(angle) * pointRadius;
          if (point === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.28;
        ctx.fill();
      } else if (firework.shape === 'taco') {
        for (let taco = 0; taco < firework.spokes; taco += 1) {
          const angle = taco * Math.PI * 2 / firework.spokes + progress * 0.16;
          const outer = radius * (0.78 + (taco % 2) * 0.11);
          ctx.save();
          ctx.translate(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillStyle = '#ffd65a';
          ctx.strokeStyle = '#fff3a4';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 3, 7, Math.PI, Math.PI * 2);
          ctx.lineTo(7, 4);
          ctx.lineTo(-7, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = taco % 2 ? '#ff68b4' : '#7dffb2';
          ctx.fillRect(-4, -1, 2.5, 2.5);
          ctx.fillRect(2, 0, 2.5, 2.5);
          ctx.restore();
        }
      } else if (firework.shape === 'spiral') {
        const palette = ['#ffd65a', '#65e7ff', '#ff68b4', '#a87bff', '#7dffb2'];
        const points = constrainedDevice ? 28 : 44;
        ctx.shadowBlur = 9;
        for (let point = 0; point < points; point += 1) {
          const fraction = point / Math.max(1, points - 1);
          const angle = point * 0.58 + progress * 2.1;
          const pointRadius = fraction * radius * 1.18;
          ctx.globalAlpha = alpha * (0.48 + fraction * 0.52);
          ctx.fillStyle = palette[point % palette.length];
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * pointRadius, Math.sin(angle) * pointRadius, 2.4 + fraction * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        for (let spoke = 0; spoke < firework.spokes; spoke += 1) {
          const angle = spoke * Math.PI * 2 / firework.spokes + progress * 0.18;
          const inner = radius * 0.48;
          const outer = radius * (0.82 + (spoke % 3) * 0.08);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * outer, Math.sin(angle) * outer, 2.5 + (spoke % 2), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
    game.impactTexts.forEach((impact) => {
      ctx.save();
      ctx.globalAlpha = clamp(impact.life / impact.maxLife, 0, 1);
      ctx.fillStyle = impact.color;
      ctx.strokeStyle = '#24103f';
      ctx.lineWidth = 5;
      ctx.font = `1000 ${impact.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.strokeText(impact.text, impact.x - game.cameraX, impact.y);
      ctx.fillText(impact.text, impact.x - game.cameraX, impact.y);
      ctx.restore();
    });
  }

  function drawVillagerBubble(centerX, top, lines, groupIndex) {
    const palettes = [
      ['#29205f', '#482369', '#ffd65a', '#65e7ff'],
      ['#17194f', '#44205f', '#65e7ff', '#ff8ac8'],
      ['#171448', '#382067', '#ffd65a', '#a991ff'],
    ][config.band];
    let fontSize = 9.5;
    ctx.save();
    ctx.font = `1000 ${fontSize}px Arial`;
    const maxTextWidth = 122;
    while (fontSize > 8 && Math.max(...lines.map((line) => ctx.measureText(line).width)) > maxTextWidth) {
      fontSize -= 0.5;
      ctx.font = `1000 ${fontSize}px Arial`;
    }
    const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const width = clamp(textWidth + 22, 102, 144);
    const height = 39;
    const left = centerX - width / 2;
    const tailOffset = groupIndex % 2 ? 18 : -18;
    const gradient = ctx.createLinearGradient(left, top, left + width, top + height);
    gradient.addColorStop(0, palettes[0]);
    gradient.addColorStop(1, palettes[1]);
    ctx.shadowBlur = 9;
    ctx.shadowColor = 'rgba(10,5,35,.45)';
    ctx.fillStyle = gradient;
    ctx.strokeStyle = palettes[2];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + tailOffset - 8, top + height - 1);
    ctx.lineTo(centerX + tailOffset, top + height + 10);
    ctx.lineTo(centerX + tailOffset + 8, top + height - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, 13);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left + 4, top + 4, width - 8, height - 8, 9);
    ctx.stroke();
    ctx.font = `1000 ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff4c6';
    ctx.fillText(lines[0], centerX, top + 16);
    ctx.fillStyle = palettes[3];
    ctx.fillText(lines[1], centerX, top + 29);
    ctx.restore();
  }

  function midnightFinaleDimAmount() {
    if (levelId !== '3-2' || !game.midnightFinale.active) return 0;
    const finale = game.midnightFinale;
    if (finale.phase === 'blackout') return 0.64 * smoothstep(clamp(finale.timer / 0.48, 0, 1));
    if (finale.phase === 'coaster-entry') return 0.64;
    if (finale.phase === 'pads') return Math.max(0.14, 0.62 - finale.padCount * 0.16);
    if (finale.phase === 'full-relight') return 0.14 * (1 - finale.relight);
    return 0;
  }

  function drawMidnightFinaleAtmosphere() {
    if (levelId !== '3-2' || !game.midnightFinale.active) return;
    const finale = game.midnightFinale;
    const dim = midnightFinaleDimAmount();
    if (dim > 0.001) {
      ctx.save();
      ctx.globalAlpha = dim;
      const blackout = ctx.createLinearGradient(0, 0, 0, canvas.height);
      blackout.addColorStop(0, '#05051d');
      blackout.addColorStop(0.72, '#0c0824');
      blackout.addColorStop(1, '#18102c');
      ctx.fillStyle = blackout;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    for (let index = 0; index < finale.padCount; index += 1) {
      const pad = finale.pads[index];
      const screenX = pad.x + 60 - game.cameraX;
      const colors = ['#65e7ff', '#ffd65a', '#ff68b4'];
      const glow = ctx.createRadialGradient(screenX, 290, 18, screenX, 290, 210);
      glow.addColorStop(0, `${colors[index]}8a`);
      glow.addColorStop(0.42, `${colors[index]}28`);
      glow.addColorStop(1, `${colors[index]}00`);
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(game.levelTime * 3.2 + index) * 0.08;
      ctx.fillStyle = glow;
      ctx.fillRect(screenX - 230, 60, 460, 390);
      ctx.restore();
    }
  }

  function drawMidnightFinalePads() {
    if (levelId !== '3-2' || !game.midnightFinale.active) return;
    const finale = game.midnightFinale;
    const visible = ['pads', 'full-relight', 'coaster-lap', 'final-pose'].includes(finale.phase)
      || game.state === 'won';
    if (!visible) return;
    finale.pads.forEach((pad, index) => {
      const x = pad.x - game.cameraX;
      if (x < -160 || x > canvas.width + 80) return;
      const powered = index < finale.padCount;
      const current = index === finale.padCount && finale.phase === 'pads';
      const pulse = current ? 0.82 + Math.sin(game.levelTime * 8) * 0.18 : 1;
      const color = powered ? ['#65e7ff', '#ffd65a', '#ff68b4'][index] : current ? '#fff3a4' : '#67527e';
      ctx.save();
      ctx.globalAlpha = current || powered ? 1 : 0.62;
      ctx.shadowColor = color;
      ctx.shadowBlur = (powered ? 20 : current ? 26 : 5) * pulse;
      const padGradient = ctx.createLinearGradient(x, GROUND_Y - 28, x + 120, GROUND_Y);
      padGradient.addColorStop(0, powered ? '#172d56' : '#211934');
      padGradient.addColorStop(0.5, powered ? color : '#3b2a4c');
      padGradient.addColorStop(1, powered ? '#28133e' : '#171126');
      ctx.fillStyle = padGradient;
      ctx.strokeStyle = color;
      ctx.lineWidth = current ? 4 : 2.5;
      ctx.beginPath();
      ctx.roundRect(x, GROUND_Y - 24, 120, 24, 11);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = powered ? '#fff7c9' : '#d9c9ef';
      ctx.font = '1000 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${index + 1} • ${pad.label}`, x + 60, GROUND_Y - 8);
      if (powered) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 60, GROUND_Y - 36, 5 + Math.sin(game.levelTime * 5 + index) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawMidnightCorneliusEncore() {
    const finale = game.midnightFinale;
    if (levelId !== '3-2' || !finale.active || finale.padCount < 3) return;
    const x = world.goal.x - 650 - game.cameraX;
    const y = GROUND_Y - 154;
    ctx.save();
    ctx.globalAlpha = smoothstep(clamp((finale.timer + 0.35) / 0.9, 0, 1));
    ctx.fillStyle = 'rgba(20,9,48,.9)';
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y + 63, 154, 75, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff68b4';
    ctx.fillRect(x + 14, y + 79, 126, 8);
    ctx.fillStyle = '#fff3b2';
    ctx.font = '1000 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POPCORN PEACE MIX', x + 77, y + 112);
    drawCell(images.enemies, 13, 4, 4, x + 39, y, 80, 58, 0.9);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 126, y + 22);
    ctx.lineTo(x + 126, y - 24);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + 126, y - 24);
    ctx.lineTo(x + 154, y - 15);
    ctx.lineTo(x + 126, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawMidnightFinaleBackdrop() {
    if (levelId !== '3-2' || !game.midnightFinale.active) return;
    const finale = game.midnightFinale;
    drawMidnightCorneliusEncore();
    if (finale.phase !== 'coaster-lap') return;
    const progress = clamp(finale.timer / 4.35, 0, 1);
    const alpha = 0.68 + Math.max(0, Math.sin(progress * Math.PI * 2)) * 0.22;
    const x = finale.coasterX - game.cameraX;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#65e7ff';
    ctx.shadowBlur = 14;
    drawCell(images.olivia, Math.floor(finale.timer * 3) % 2 ? 7 : 6, 4, 3, x, finale.coasterY, 286, 190);
    ctx.restore();
  }

  function drawMidnightFinaleCast() {
    if (levelId !== '3-2' || !game.midnightFinale.active) return;
    const finale = game.midnightFinale;
    if (finale.phase === 'coaster-entry') {
      const fade = 1 - smoothstep(clamp((finale.timer - 1.35) / 0.58, 0, 1));
      if (fade > 0.01) {
        ctx.save();
        ctx.globalAlpha = fade;
        drawCell(images.olivia, 6, 4, 3, finale.coasterX - game.cameraX, finale.coasterY, 286, 190);
        ctx.restore();
      }
    }
    if (finale.phase === 'final-pose' || game.state === 'won') {
      const x = finale.coasterX - game.cameraX;
      ctx.save();
      ctx.shadowColor = '#ffd65a';
      ctx.shadowBlur = 18;
      drawCell(images.olivia, 7, 4, 3, x, finale.coasterY, 286, 190);
      ctx.restore();
      return;
    }
    if (!finale.oliviaVisible || finale.phase === 'coaster-lap') return;
    let frame = 3;
    if (finale.phase === 'coaster-entry') frame = 2;
    else if (finale.phase === 'full-relight') frame = Math.floor(finale.timer * 4) % 2 ? 2 : 0;
    ctx.save();
    drawCell(images.olivia, frame, 4, 3, finale.oliviaX - game.cameraX - 62, finale.oliviaY, 124, 118);
    ctx.restore();
  }

  function drawVictoryRoute() {
    const start = victoryRouteStart();
    const end = world.goal.x - 650;
    if (game.cameraX + canvas.width < start - 200) return;
    const first = Math.floor(start / 650) * 650;
    const bubbleLines = levelId === '3-1'
      ? [
        ['PIÑATA PANICKED', 'TACO HERO DIDN’T'],
        ['CLOUD FORECAST', '100% CRUNCH'],
        ['THREE STOMPS', 'ZERO REGRETS'],
        ['AIRBORNE TACOS', 'PERFECT VIBES'],
        ['WE CAME FOR', 'THE KABOOM'],
        ['SKY-HIGH', 'SPLAT CERTIFIED'],
        ['OLIVIA SAID', 'THIS WAS SAFE'],
        ['CONFETTI HAS', 'NO ALTITUDE LIMIT'],
        ['LOCAL TACO', 'DEFEATS GRAVITY'],
        ['THE CLOUDS', 'CHEERED TOO'],
      ]
      : levelId === '3-2'
        ? [
          ['CORNELIUS GOT', 'POP-CORRECTED'],
          ['BUTTER LUCK', 'NEXT TIME'],
          ['PRESSURE ZERO', 'TACOS MANY'],
          ['KERNEL PANIC', 'OFFICIALLY OVER'],
          ['POPPED, SALTED', 'AND SERVED'],
          ['THREE STOMPS', 'EXTRA BUTTER'],
          ['MIDWAY SAVED', 'SNACK SECURED'],
          ['TACO HERO', 'NEVER HALF-POPS'],
          ['CORN MAZE?', 'CORN FLATTENED'],
          ['OLIVIA CALLED', 'IT EXPECTED'],
        ]
        : [
          ['RADISH GOT', 'ROASTED'],
          ['RINGMASTER?', 'MORE LIKE SNACK'],
          ['FINAL ACT', 'FULLY FLATTENED'],
          ['TACO HERO', 'IS HEADLINING'],
          ['BLIMP DEFLATED', 'VIBES INFLATED'],
          ['SPACE CALLED', 'IT DELICIOUS'],
          ['NO CRUMBS', 'IN ORBIT'],
          ['GOLDEN STAR', 'READY TO CRUNCH'],
          ['OLIVIA PARKED', 'THE ZEPPELIN'],
          ['WORLD 3 WENT', 'FULL NOVA'],
        ];
    for (let x = first; x < end; x += 650) {
      const screenX = x - game.cameraX;
      if (screenX < -190 || screenX > canvas.width + 190) continue;
      const groupIndex = Math.max(0, Math.round((x - first) / 650));
      const cloudtopDance = levelId === '3-1'
        && game.cloudtopFinale.active
        && (['taco-rain', 'final-pose'].includes(game.cloudtopFinale.phase) || game.state === 'won');
      const midnightDance = levelId === '3-2'
        && game.midnightFinale.active
        && (game.midnightFinale.padCount > 0 || game.state === 'won');
      const cosmicDance = levelId === '3-3'
        && game.cosmicFinale.active
        && (['taco-nova', 'low-gravity', 'landing', 'complete'].includes(game.cosmicFinale.phase) || game.state === 'won');
      const danceLift = cloudtopDance || midnightDance || cosmicDance
        ? Math.abs(Math.sin((game.levelTime + game.celebrationTime) * 3.1 + groupIndex * 0.8)) * 9
        : 0;
      ctx.save();
      ctx.translate(screenX + 45, GROUND_Y + 12 - danceLift);
      drawCellTrimmed(images.finale, 8, 4, 4, { top: 54, bottom: 12 }, -115, -118, 230, 118);
      ctx.restore();
      const bubbleTop = GROUND_Y - 177 - (groupIndex % 2) * 7;
      drawVillagerBubble(screenX + 45, bubbleTop, bubbleLines[groupIndex % bubbleLines.length], groupIndex);
    }
  }

  function drawFinaleActivity(t) {
    const celebrating = game.state === 'won';
    if (levelId === '3-1') {
      const pinata = world.finalePinata;
      ctx.save();
      if (pinata?.broken || celebrating) {
        ctx.translate(0, -8);
        const settledPose = game.cloudtopFinale.active
          && (game.cloudtopFinale.phase === 'final-pose' || celebrating);
        drawCellTrimmed(
          images.finale,
          14,
          4,
          4,
          { right: 88, bottom: 10 },
          settledPose ? -112 : -148,
          settledPose ? -180 : -214,
          settledPose ? 224 : 296,
          settledPose ? 154 : 204,
          settledPose ? 0.32 : 1,
        );
      } else {
        const hitTilt = (pinata?.hits || 0) * 0.025 * ((pinata?.hits || 0) % 2 ? -1 : 1);
        ctx.translate(0, -1);
        ctx.rotate(hitTilt);
        drawCellTrimmed(images.finale, 12, 4, 4, { left: 76, right: 70, bottom: 16 }, -96, -178, 192, 178);
      }
      ctx.restore();
      return;
    }

    if (levelId === '3-2') {
      ctx.save();
      ctx.translate(0, -Math.abs(Math.sin(t * 2.5)) * (celebrating ? 2 : 1));
      drawCellTrimmed(images.finale, 10, 4, 4, { top: 58, bottom: 20 }, -155, -144, 310, 144);
      ctx.restore();
      return;
    }

    ctx.save();
    const trailCharge = clamp(game.finalTacosCollected / 44, 0, 1);
    const cosmic = game.cosmicFinale;
    const starCharge = cosmic.active
      ? ['star-dormant', 'zeppelin-return', 'golden-taco'].includes(cosmic.phase)
        ? 0.16 + trailCharge * 0.22
        : cosmic.phase === 'star-relight'
          ? 0.38 + cosmic.relightWave * 0.62
          : 1
      : trailCharge;
    const starGlow = ctx.createRadialGradient(0, -158, 8, 0, -158, 92 + starCharge * 34);
    starGlow.addColorStop(0, 'rgba(255,255,224,.96)');
    starGlow.addColorStop(0.24, `rgba(255,214,90,${0.28 + starCharge * 0.48})`);
    starGlow.addColorStop(0.62, `rgba(101,231,255,${0.08 + starCharge * 0.25})`);
    starGlow.addColorStop(1, 'rgba(101,231,255,0)');
    ctx.globalAlpha = 0.34 + starCharge * 0.66;
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(0, -158, 126, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.translate(0, Math.sin(t * 1.35) * (celebrating ? 2.5 : 1.5));
    drawCellTrimmed(images.finale, 7, 4, 4, { bottom: 8 }, -145, -227, 290, 227);
    ctx.restore();
  }

  function drawFinaleZeppelinOrbit(goalScreenX) {
    const finale = game.cosmicFinale;
    if (levelId !== '3-3' || !finale.active || game.state === 'won') return;
    if (['star-dormant', 'star-relight', 'landing', 'complete'].includes(finale.phase)) return;
    let orbitX = goalScreenX + 130;
    let orbitY = 146;
    let movingLeft = false;
    if (finale.phase === 'zeppelin-return') {
      const progress = smoothstep(clamp(finale.timer / COSMIC_FINALE_PHASE_DURATIONS['zeppelin-return'], 0, 1));
      orbitX = lerp(goalScreenX + 470, goalScreenX + 132, progress);
      orbitY = 144 - Math.sin(progress * Math.PI) * 34;
    } else if (finale.phase === 'taco-nova') {
      const progress = clamp(finale.timer / COSMIC_FINALE_PHASE_DURATIONS['taco-nova'], 0, 1);
      const angle = -Math.PI * 0.45 + progress * Math.PI * 2;
      orbitX = goalScreenX + Math.cos(angle) * 235;
      orbitY = 174 + Math.sin(angle) * 68;
      movingLeft = Math.sin(angle) > 0;
    } else if (finale.phase === 'low-gravity') {
      const progress = clamp(finale.timer / COSMIC_FINALE_PHASE_DURATIONS['low-gravity'], 0, 1);
      const angle = Math.PI + progress * Math.PI * 2;
      orbitX = goalScreenX + Math.cos(angle) * 255;
      orbitY = 170 + Math.sin(angle) * 76;
      movingLeft = Math.sin(angle) > 0;
    } else {
      orbitY += Math.sin(finale.totalTime * 1.6) * 4;
    }
    ctx.save();
    ctx.globalAlpha = smoothstep(clamp(finale.totalTime / 0.4, 0, 1));
    ctx.translate(orbitX, orbitY);
    if (movingLeft) ctx.scale(-1, 1);
    ctx.shadowColor = '#65e7ff';
    ctx.shadowBlur = 14;
    drawCell(images.olivia, 8, 4, 3, -165, -100, 330, 220);
    if (finale.phase === 'golden-taco' && finale.timer < visualScale.tacoLauncher.pulseSeconds) {
      const visual = WORLD3_VEHICLE_VISUALS.zeppelin;
      drawVehicleRearLauncherPulse(
        -165 + visual.launcherX,
        -100 + visual.launcherY,
        visualScale.tacoLauncher.pulseSeconds - finale.timer,
      );
    }
    ctx.restore();
  }

  function traceFivePointStar(centerX, centerY, outerRadius, innerRadius = outerRadius * 0.45) {
    ctx.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 ? innerRadius : outerRadius;
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (point === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawCosmicFinaleSky() {
    const finale = game.cosmicFinale;
    if (levelId !== '3-3' || !finale.active) return;
    const centerX = world.goal.x + 65 - game.cameraX;
    const centerY = GROUND_Y - 158;
    const relight = game.state === 'won' || ['taco-nova', 'low-gravity', 'landing', 'complete'].includes(finale.phase)
      ? 1
      : finale.relightWave;
    if (relight > 0) {
      const radius = 70 + relight * 880;
      const wave = ctx.createRadialGradient(centerX, centerY, 28, centerX, centerY, radius);
      wave.addColorStop(0, `rgba(255,243,164,${0.22 + relight * 0.1})`);
      wave.addColorStop(0.28, 'rgba(101,231,255,.13)');
      wave.addColorStop(0.58, 'rgba(255,104,180,.08)');
      wave.addColorStop(1, 'rgba(168,123,255,0)');
      ctx.save();
      ctx.fillStyle = wave;
      ctx.fillRect(0, 0, canvas.width, GROUND_Y);
      ctx.globalAlpha = 0.42 * (1 - relight * 0.48);
      ctx.strokeStyle = '#fff3a4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 64 + relight * 470, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const litStars = game.state === 'won' || finale.phase === 'complete' ? 9 : finale.litStars;
    const colors = ['#ff9c70', '#ffd65a', '#ff68b4', '#65e7ff', '#7dffb2', '#ffd65a', '#a87bff', '#ff68b4', '#fff3a4'];
    NINE_STAR_OFFSETS.forEach(([offsetX, offsetY], index) => {
      const x = centerX + offsetX;
      const y = centerY + offsetY;
      const lit = index < litStars;
      ctx.save();
      ctx.globalAlpha = lit ? 1 : 0.2;
      ctx.fillStyle = lit ? colors[index] : '#38265e';
      ctx.strokeStyle = lit ? '#fff6c2' : '#7e6ba8';
      ctx.lineWidth = lit ? 2.2 : 1.4;
      ctx.shadowColor = colors[index];
      ctx.shadowBlur = lit ? 15 : 0;
      traceFivePointStar(x, y, lit ? 15 : 12);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = lit ? '#fff6d0' : '#9c8bbd';
      ctx.font = '900 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(NINE_STAR_LEVELS[index], x, y + 27);
      ctx.restore();
    });
  }

  function drawCosmicGoldenTaco() {
    const taco = game.cosmicFinale.goldenTaco;
    if (!taco.active) return;
    const x = taco.x - game.cameraX + taco.w / 2;
    const y = taco.y + taco.h / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(taco.rotation);
    ctx.shadowColor = '#ffd65a';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffd65a';
    ctx.strokeStyle = '#fff6ba';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 8, 28, Math.PI, Math.PI * 2);
    ctx.lineTo(28, 10);
    ctx.lineTo(-28, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7dffb2';
    ctx.fillRect(-17, -1, 7, 5);
    ctx.fillStyle = '#ff68b4';
    ctx.fillRect(-3, -5, 7, 6);
    ctx.fillStyle = '#ff786a';
    ctx.fillRect(11, 0, 7, 5);
    ctx.restore();
  }

  function drawCosmicFinaleCast() {
    const finale = game.cosmicFinale;
    if (levelId !== '3-3' || !finale.active) return;
    drawCosmicGoldenTaco();
    if (!finale.oliviaVisible && game.state !== 'won') return;
    const x = finale.oliviaX - game.cameraX;
    const y = game.state === 'won' ? GROUND_Y - 118 : finale.oliviaY;
    const frame = game.state !== 'won' && finale.phase === 'landing' && finale.timer < 1.18 ? 2 : 3;
    ctx.save();
    if (finale.fistBumpPlayed || game.state === 'won') {
      ctx.shadowColor = '#ffd65a';
      ctx.shadowBlur = 12;
    }
    drawCell(images.olivia, frame, 4, 3, x - 62, y, 124, 118);
    ctx.restore();
  }

  function drawCloudtopFinaleCast(layer = 'all') {
    if (levelId !== '3-1' || !game.cloudtopFinale.active) return;
    const finale = game.cloudtopFinale;
    if (layer !== 'olivia' && finale.phase !== 'hero-approach') {
      const truckX = finale.truckX - game.cameraX;
      ctx.save();
      ctx.fillStyle = 'rgba(28,12,47,.28)';
      ctx.beginPath();
      ctx.ellipse(truckX + 150, GROUND_Y + 3, 132, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      drawCellTrimmed(
        images.olivia,
        11,
        4,
        3,
        { top: 34, right: 78, bottom: 10, left: 6 },
        truckX,
        GROUND_Y - 166,
        304,
        166,
        0.98,
      );
      ctx.restore();
    }
    if (layer === 'truck') return;
    if (!finale.oliviaVisible) return;
    let frame = 0;
    if (finale.phase === 'olivia-arrival' && finale.oliviaY < GROUND_Y - 132) frame = 2;
    else if (finale.phase === 'awaiting-third') frame = 3;
    else if (finale.phase === 'taco-rain') {
      frame = finale.catchPoseTimer > 0.88 ? 0 : finale.oliviaY < GROUND_Y - 142 ? 2 : 3;
    }
    const x = finale.oliviaX - game.cameraX;
    ctx.save();
    if (finale.phase === 'taco-rain') {
      ctx.translate(x, finale.oliviaY);
      ctx.scale(Math.sin(finale.rainElapsed * 1.55) < 0 ? -1 : 1, 1);
      drawCell(images.olivia, frame, 4, 3, -62, 0, 124, 118);
      if (finale.catchPoseTimer > 0.88 && images.items.complete && images.items.naturalWidth) {
        ctx.drawImage(images.items, 0, 0, 16, 16, -12, -22, 24, 24);
      }
    } else {
      drawCell(images.olivia, frame, 4, 3, x - 62, finale.oliviaY, 124, 118);
    }
    ctx.restore();
  }

  function drawFinaleBannerPlate(label, centerX, top, reveal, fontSize, requestedWidth, palettes) {
    ctx.save();
    ctx.font = `1000 ${fontSize}px Arial`;
    const width = requestedWidth || clamp(ctx.measureText(label).width + 38, 194, 282);
    const safeCenter = clamp(centerX, width / 2 + 16, canvas.width - width / 2 - 16);
    const left = safeCenter - width / 2;
    ctx.translate(safeCenter, top + 19);
    ctx.scale(Math.max(0.02, reveal), 1);
    ctx.translate(-safeCenter, -(top + 19));
    const gradient = ctx.createLinearGradient(left, top, left + width, top + 38);
    gradient.addColorStop(0, palettes[0]);
    gradient.addColorStop(1, palettes[1]);
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(8,4,30,.5)';
    ctx.fillStyle = gradient;
    ctx.strokeStyle = palettes[2];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(left, top, width, 38, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left + 4, top + 4, width - 8, 30, 10);
    ctx.stroke();
    ctx.fillStyle = '#fff5cb';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, safeCenter, top + 19);
    ctx.fillStyle = palettes[3];
    ctx.beginPath();
    ctx.arc(left + 14, top + 19, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(left + width - 14, top + 19, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFinaleNameplate(centerX, top) {
    const palettes = [
      ['#25164f', '#4b205f', '#ffd65a', '#ff9ed4'],
      ['#151749', '#35205f', '#65e7ff', '#ffd65a'],
      ['#171446', '#382066', '#ffd65a', '#a991ff'],
    ][config.band];
    const cloudtopComplete = levelId === '3-1'
      && game.cloudtopFinale.active
      && (game.cloudtopFinale.phase === 'final-pose' || game.state === 'won')
      && (game.cloudtopFinale.timer >= 0.38 || game.state === 'won');
    const midnightComplete = levelId === '3-2'
      && game.midnightFinale.active
      && (game.midnightFinale.phase === 'final-pose' || game.state === 'won')
      && (game.midnightFinale.timer >= 0.38 || game.state === 'won');
    const cosmicComplete = levelId === '3-3'
      && game.cosmicFinale.active
      && (game.cosmicFinale.phase === 'landing' || game.cosmicFinale.phase === 'complete' || game.state === 'won')
      && (game.cosmicFinale.timer >= 1.05 || game.cosmicFinale.phase === 'complete' || game.state === 'won');
    if (cosmicComplete) {
      const maximumReveal = game.state === 'won' || game.cosmicFinale.phase === 'complete'
        ? 1
        : game.cosmicFinale.maximumCrunchReveal;
      const allLevelsReveal = game.state === 'won' || game.cosmicFinale.phase === 'complete'
        ? 1
        : game.cosmicFinale.allLevelsReveal;
      drawFinaleBannerPlate(
        'WORLD 3 HAS ACHIEVED MAXIMUM CRUNCH.',
        centerX,
        top,
        maximumReveal,
        18,
        510,
        palettes,
      );
      if (allLevelsReveal > 0) {
        drawFinaleBannerPlate(
          'ALL 9 LEVELS COMPLETE!',
          centerX,
          top + 46,
          allLevelsReveal,
          22,
          350,
          ['#34206f', '#7b2d86', '#65e7ff', '#ffd65a'],
        );
      }
      return;
    }
    const label = cloudtopComplete
      ? 'CARNIVAL COMPLETE!'
      : midnightComplete
        ? 'MIDNIGHT MIDWAY IS LIT!'
        : finaleConfig.label;
    const reveal = cloudtopComplete
      ? game.state === 'won' ? 1 : game.cloudtopFinale.bannerReveal
      : midnightComplete
        ? game.state === 'won' ? 1 : game.midnightFinale.bannerReveal
        : 1;
    const fontSize = cloudtopComplete ? 27 : midnightComplete ? 25 : 13;
    const width = cloudtopComplete ? 500 : midnightComplete ? 470 : null;
    drawFinaleBannerPlate(label, centerX, top, reveal, fontSize, width, palettes);
  }

  function drawGoal() {
    const x = world.goal.x - game.cameraX;
    if (x < -380 || x > canvas.width + 380) return;
    const t = game.levelTime + game.celebrationTime;
    const proximity = clamp(1 - Math.abs(player.x - world.goal.x) / 2300, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.08 + proximity * 0.16;
    for (let beam = 0; beam < 2; beam += 1) {
      const beamX = x + 65 + Math.sin(t * 0.45 + beam * 2.2) * 105;
      const gradient = ctx.createLinearGradient(beamX, 90, beamX, GROUND_Y);
      gradient.addColorStop(0, beam % 2 ? 'rgba(101,231,255,.72)' : 'rgba(255,104,180,.72)');
      gradient.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(beamX - 15, 80);
      ctx.lineTo(beamX + 15, 80);
      ctx.lineTo(x + 65 + (beam ? 76 : -76), GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    drawFinaleZeppelinOrbit(x + 65);
    ctx.save();
    ctx.translate(x + 65, GROUND_Y);
    drawFinaleActivity(t);
    ctx.restore();
    const centeredEncore = (levelId === '3-1'
      && game.cloudtopFinale.active
      && (game.cloudtopFinale.phase === 'final-pose' || game.state === 'won'))
      || (levelId === '3-2'
        && game.midnightFinale.active
        && (game.midnightFinale.phase === 'final-pose' || game.state === 'won'))
      || (levelId === '3-3'
        && game.cosmicFinale.active
        && (['landing', 'complete'].includes(game.cosmicFinale.phase) || game.state === 'won'));
    const hideCosmicLaunchPlate = levelId === '3-3'
      && game.cosmicFinale.active
      && !(['landing', 'complete'].includes(game.cosmicFinale.phase) || game.state === 'won');
    if (!hideCosmicLaunchPlate) {
      drawFinaleNameplate(
        centeredEncore ? canvas.width / 2 : x + 65,
        centeredEncore
          ? levelId === '3-3' ? 92 : levelId === '3-2' ? 112 : 118
          : GROUND_Y - 258,
      );
    }
    if (world.finalePinata && !world.finalePinata.broken) {
      ctx.save();
      ctx.fillStyle = 'rgba(27,9,57,.86)';
      ctx.strokeStyle = '#65e7ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x - 12, GROUND_Y - 75, 154, 34, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff4bf';
      ctx.font = '1000 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`STOMP ${world.finalePinata.hits}/3`, x + 65, GROUND_Y - 53);
      ctx.restore();
    }
  }

  function drawHud() {
    const section = currentSection();
    ctx.save();
    ctx.fillStyle = 'rgba(20,7,48,.56)';
    ctx.strokeStyle = 'rgba(255,225,121,.63)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(18, 18, 310, 112, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff5ce';
    ctx.font = '1000 20px Arial';
    ctx.fillText(`WORLD ${levelId} • ${config.title}`, 34, 45);
    ctx.font = '900 15px Arial';
    ctx.fillStyle = '#ffd65a';
    ctx.fillText(`Score ${game.score.toLocaleString()}   🌮 ${game.collected}/${game.totalCollectibles}`, 34, 71);
    ctx.fillStyle = '#fff';
    ctx.fillText(`★ Tickets ${game.goldenCollected}/8   ${'♥'.repeat(game.hearts)}${'♡'.repeat(3 - game.hearts)}`, 34, 95);
    ctx.fillStyle = '#65e7ff';
    ctx.fillText(`Splat ${game.splatCombo || 0}×   Nova ${game.novaCount}`, 34, 118);

    const progress = clamp(player.x / WORLD_WIDTH, 0, 1);
    ctx.fillStyle = 'rgba(20,7,48,.58)';
    ctx.strokeStyle = 'rgba(101,231,255,.58)';
    ctx.beginPath();
    ctx.roundRect(350, 18, 592, 82, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.fillRect(376, 53, 540, 10);
    const progressGradient = ctx.createLinearGradient(376, 0, 916, 0);
    progressGradient.addColorStop(0, '#ffd65a');
    progressGradient.addColorStop(0.5, '#ff68b4');
    progressGradient.addColorStop(1, '#65e7ff');
    ctx.fillStyle = progressGradient;
    ctx.fillRect(376, 53, 540 * progress, 10);
    ctx.fillStyle = '#fff5ce';
    ctx.font = '900 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(section.name, 646, 42);
    ctx.font = '800 12px Arial';
    ctx.fillText(`${Math.round(player.x).toLocaleString()} / 35,000`, 646, 83);

    ctx.fillStyle = 'rgba(20,7,48,.6)';
    ctx.strokeStyle = sharedAbilities.isSuper(game.abilities) ? '#ffd65a' : '#ff68b4';
    ctx.beginPath();
    ctx.roundRect(258, 496, 444, 30, 14);
    ctx.fill();
    ctx.stroke();
    sharedAbilities.drawTacoPowerHUD(ctx, game.abilities, { x: 268, y: 505, width: 424, height: 12, labelX: 480, labelY: 516, textAlign: 'center', textColor: '#fff', font: '1000 11px Arial' });
    ctx.restore();
  }

  function drawMessages() {
    if (game.messageTimer <= 0) return;
    const alpha = clamp(Math.min(game.messageTimer, 0.5) * 2, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(26,8,56,.78)';
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(170, 148, 620, game.subMessage ? 82 : 62, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff4b8';
    ctx.strokeStyle = '#52205f';
    ctx.lineWidth = 5;
    ctx.font = '1000 25px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(game.message, 480, 184);
    ctx.fillText(game.message, 480, 184);
    if (game.subMessage) {
      ctx.fillStyle = '#65e7ff';
      ctx.font = '900 14px Arial';
      ctx.fillText(game.subMessage, 480, 211);
    }
    ctx.restore();
  }

  function drawNovaOverlay() {
    if (game.novaFlash <= 0) return;
    const progress = 1 - game.novaFlash / 1.7;
    ctx.save();
    ctx.globalAlpha = clamp(game.novaFlash / 1.7, 0, 0.65);
    const gradient = ctx.createRadialGradient(480, 270, 20, 480, 270, 620);
    gradient.addColorStop(0, 'rgba(255,250,189,.88)');
    gradient.addColorStop(0.3, 'rgba(255,104,180,.38)');
    gradient.addColorStop(0.62, 'rgba(101,231,255,.24)');
    gradient.addColorStop(1, 'rgba(167,123,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = ['#ffd65a', '#ff68b4', '#65e7ff'][Math.floor(progress * 12) % 3];
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(player.x - game.cameraX + 20, player.y + 20, 70 + progress * 520, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const shakeX = game.cameraShake > 0 ? (seeded() - 0.5) * game.cameraShake : 0;
    const shakeY = game.cameraShake > 0 ? (seeded() - 0.5) * game.cameraShake * 0.55 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawCosmicFinaleSky();
    drawMidnightFinaleAtmosphere();
    drawMidnightFinaleBackdrop();
    drawPlatforms();
    drawVictoryRoute();
    drawMidnightFinalePads();
    drawCheckpoints();
    world.collectibles.forEach(drawTaco);
    drawEnemies();
    drawVehicle();
    drawPinata();
    drawBoss();
    drawBossGate();
    drawProjectiles();
    drawCloudtopFinaleCast('truck');
    drawGoal();
    drawCosmicFinaleCast();
    drawCloudtopFinaleCast('olivia');
    drawMidnightFinaleCast();
    drawHero();
    heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, performance.now(), {
      beamTop: 'rgba(255,245,177,0)',
      beamOuter: 'rgba(255,104,180,.28)',
      beamCore: 'rgba(255,246,184,.74)',
      beamEdge: 'rgba(101,231,255,.62)',
      landingRing: 'rgba(255,214,90,.9)',
    });
    drawParticles();
    ctx.restore();
    drawNovaOverlay();
    const hideHudForCosmicPhoto = levelId === '3-3'
      && game.cosmicFinale.active
      && (['landing', 'complete'].includes(game.cosmicFinale.phase) || game.state === 'won');
    if (!hideHudForCosmicPhoto) drawHud();
    drawMessages();
  }

  function updateQaState() {
    if (!qaMode) return;
    const grounds = world.platforms.filter((platform) => platform.ground).sort((a, b) => a.x - b.x);
    const kickoffEnvironment = kickoffEnvironmentBlend(player.x);
    const kickoffAssetsReady = KICKOFF_ENVIRONMENT_STAGES.filter((stage) => (
      images[stage.image]?.complete && images[stage.image].naturalWidth
    )).length;
    const midnightEnvironment = midnightEnvironmentBlend(player.x);
    const midnightAssetsReady = MIDNIGHT_ENVIRONMENT_STAGES.filter((stage) => (
      images[stage.image]?.complete && images[stage.image].naturalWidth
    )).length;
    const novaEnvironment = novaEnvironmentBlend(player.x);
    const novaAssetsReady = NOVA_ENVIRONMENT_STAGES.filter((stage) => (
      images[stage.image]?.complete && images[stage.image].naturalWidth
    )).length;
    let maxGap = 0;
    for (let index = 1; index < grounds.length; index += 1) maxGap = Math.max(maxGap, grounds[index].x - (grounds[index - 1].x + grounds[index - 1].w));
    canvas.dataset.qaState = JSON.stringify({
      level: levelId,
      state: game.state,
      playerX: Math.round(player.x),
      cameraX: Math.round(game.cameraX),
      platforms: world.platforms.length,
      enemies: world.enemies.length,
      world3Remaster: game.world3Remaster || null,
      cloudtopRouteAudit: game.cloudtopRouteAudit || null,
      midnightRouteAudit: game.midnightRouteAudit || null,
      novaRouteAudit: game.novaRouteAudit || null,
      startupEnemyFramesReady: world.enemies.every((enemy) => Number.isFinite(enemy.frame)),
      enemyPatrolAudit: game.enemyPatrolAudit || null,
      world3FormationRules: game.world3FormationRules || null,
      world3FormationOverlapCount: game.world3FormationOverlapCount || 0,
      world3ForbiddenEnemyCounts: game.world3ForbiddenEnemyCounts || {},
      world3CombatOutliers: game.world3CombatOutliers || 0,
      tacos: game.totalCollectibles,
      golden: world.collectibles.filter((item) => item.type === 'golden').length,
      maxGroundGap: Math.round(maxGap),
      section: currentSection().id,
      activeMusic: game.activeMusic,
      transitioning: Boolean(game.musicTransition),
      playingTracks: Object.entries(tracks)
        .filter(([, track]) => !track.paused && track.volume > 0.001)
        .map(([key, track]) => `${key}:${track.volume.toFixed(2)}`),
      vehicle: game.vehicle.state,
      vehicleLead: Math.round(game.vehicle.x - player.x),
      vehicleLauncherPulse: Number(game.vehicle.launcherPulse.toFixed(3)),
      armAnimationRemoved: true,
      rearVehicleLauncher: true,
      launcherPolicy: visualScale.tacoLauncher.policy,
      vehicleHorizontalWobble: levelId === '3-1' ? 0 : null,
      vehicleCatches: game.vehicle.catches,
      oliviaTacoVelocity: world.collectibles.find((item) => item.fromOlivia && !item.collected)?.vx ?? null,
      zeppelinBaseFrameStable: levelId === '3-3',
      zeppelinLauncherDirection: levelId === '3-3' ? 'rearward' : null,
      zeppelinDeliveryPattern: levelId === '3-3' ? 'three-organized-ballistic-arcs' : null,
      bossHits: world.boss?.hits ?? null,
      bossDefeated: world.boss?.defeated ?? null,
      bossState: world.boss?.state ?? null,
      bossVulnerable: world.boss?.vulnerable ?? null,
      bossGateLocked: Boolean(world.boss && !world.boss.defeated),
      pinataHits: world.pinata?.hits ?? null,
      pinataBroken: world.pinata?.broken ?? null,
      finalePinataHits: world.finalePinata?.hits ?? null,
      finalePinataBroken: world.finalePinata?.broken ?? null,
      finaleExplosionTimer: Number((world.finalePinata?.explosionTimer || 0).toFixed(2)),
      cloudtopFinalePhase: levelId === '3-1' ? game.cloudtopFinale.phase : null,
      cloudtopOliviaActive: levelId === '3-1' ? game.cloudtopFinale.oliviaVisible : null,
      cloudtopTruckX: levelId === '3-1' ? Math.round(game.cloudtopFinale.truckX) : null,
      cloudtopTacoRainDuration: levelId === '3-1' ? CLOUDTOP_TACO_RAIN_DURATION : null,
      cloudtopTacoRainTarget: levelId === '3-1' ? cloudtopTacoRainTarget() : null,
      cloudtopTacoRainSpawned: levelId === '3-1' ? game.cloudtopFinale.rainSpawned : null,
      cloudtopOliviaCatches: levelId === '3-1' ? game.cloudtopFinale.catchCount : null,
      cloudtopSlowMotion: levelId === '3-1' ? Number(game.cloudtopFinale.slowMotionTimer.toFixed(2)) : null,
      cloudtopVoiceLine: levelId === '3-1' && game.cloudtopFinale.voiceLineIndex >= 0
        ? CLOUDTOP_VOICE_LINES[game.cloudtopFinale.voiceLineIndex]
        : null,
      cloudtopBanner: levelId === '3-1'
        && game.cloudtopFinale.active
        && (game.cloudtopFinale.phase === 'final-pose' || game.state === 'won')
        ? 'CARNIVAL COMPLETE!'
        : null,
      midnightFinalePhase: levelId === '3-2' ? game.midnightFinale.phase : null,
      midnightFinaleActive: levelId === '3-2' ? game.midnightFinale.active : null,
      midnightPoweredPads: levelId === '3-2' ? game.midnightFinale.padCount : null,
      midnightPadOrder: levelId === '3-2' ? MIDNIGHT_PAD_LABELS : null,
      midnightPadTacos: levelId === '3-2' ? MIDNIGHT_PAD_TACOS : null,
      midnightOliviaActive: levelId === '3-2' ? game.midnightFinale.oliviaVisible : null,
      midnightCoasterX: levelId === '3-2' ? Math.round(game.midnightFinale.coasterX) : null,
      midnightRelight: levelId === '3-2' ? Number(game.midnightFinale.relight.toFixed(2)) : null,
      midnightDim: levelId === '3-2' ? Number(midnightFinaleDimAmount().toFixed(2)) : null,
      midnightBanner: levelId === '3-2'
        && game.midnightFinale.active
        && (game.midnightFinale.phase === 'final-pose' || game.state === 'won')
        ? 'MIDNIGHT MIDWAY IS LIT!'
        : null,
      cosmicFinalePhase: levelId === '3-3' ? game.cosmicFinale.phase : null,
      cosmicFinaleActive: levelId === '3-3' ? game.cosmicFinale.active : null,
      cosmicFinaleTime: levelId === '3-3' ? Number(game.cosmicFinale.totalTime.toFixed(2)) : null,
      cosmicLitStars: levelId === '3-3' ? game.cosmicFinale.litStars : null,
      cosmicRelightWave: levelId === '3-3' ? Number(game.cosmicFinale.relightWave.toFixed(3)) : null,
      cosmicGoldenTacoActive: levelId === '3-3' ? game.cosmicFinale.goldenTaco.active : null,
      cosmicGoldenTacoCaught: levelId === '3-3' ? game.cosmicFinale.goldenTaco.caught : null,
      cosmicGoldenTacoMagnetized: levelId === '3-3' ? game.cosmicFinale.goldenTaco.magnetized : null,
      cosmicLowGravity: levelId === '3-3' ? game.cosmicFinale.phase === 'low-gravity' : null,
      cosmicBonusTacos: levelId === '3-3' ? COSMIC_BONUS_TACOS : null,
      cosmicBonusCollected: levelId === '3-3' ? game.cosmicFinale.bonusCollected : null,
      cosmicRepriseActive: levelId === '3-3' ? game.activeMusic === 'cosmic-reprise' : null,
      cosmicMusicDuck: levelId === '3-3' ? Number(game.musicDuck.toFixed(2)) : null,
      hitStop: Number(game.hitStop.toFixed(3)),
      hitStopEvents: game.hitStopEvents,
      hitStopRecoveries: game.hitStopRecoveries,
      maxHitStop: Number(game.maxHitStop.toFixed(3)),
      lastHitStopSource: game.lastHitStopSource,
      novaCharge: Math.floor(game.novaCharge),
      novaBestCharge: Math.floor(game.novaBestCharge),
      novaCount: game.novaCount,
      spawnedBonusTacos: game.spawnedBonusTacos,
      groundedLayers: true,
      platformOverlaps: platformOverlapCount(),
      backgroundMode: levelId === '3-1'
        ? 'five-act-preloaded-seamless-parallax'
        : levelId === '3-2'
          ? 'six-act-preloaded-seamless-parallax'
          : 'six-act-cosmic-preloaded-seamless-parallax',
      backgroundRepeats: 0,
      parallaxSubpixel: true,
      kickoffEnvironment: levelId === '3-1' ? kickoffEnvironment.from.id : null,
      kickoffEnvironmentNext: levelId === '3-1' ? kickoffEnvironment.to.id : null,
      kickoffEnvironmentMix: levelId === '3-1' ? Number(kickoffEnvironment.mix.toFixed(3)) : null,
      kickoffEnvironmentTransition: levelId === '3-1' ? KICKOFF_ENVIRONMENT_TRANSITION : null,
      kickoffEnvironmentAssetsReady: levelId === '3-1' ? kickoffAssetsReady : null,
      kickoffBackgroundResolution: levelId === '3-1' ? 'five-high-resolution-16x9-scenes' : null,
      midnightEnvironment: levelId === '3-2' ? midnightEnvironment.from.id : null,
      midnightEnvironmentNext: levelId === '3-2' ? midnightEnvironment.to.id : null,
      midnightEnvironmentMix: levelId === '3-2' ? Number(midnightEnvironment.mix.toFixed(3)) : null,
      midnightEnvironmentTransition: levelId === '3-2' ? MIDNIGHT_ENVIRONMENT_TRANSITION : null,
      midnightEnvironmentAssetsReady: levelId === '3-2' ? midnightAssetsReady : null,
      midnightBackgroundResolution: levelId === '3-2' ? 'six-high-resolution-16x9-scenes' : null,
      novaEnvironment: levelId === '3-3' ? novaEnvironment.from.id : null,
      novaEnvironmentNext: levelId === '3-3' ? novaEnvironment.to.id : null,
      novaEnvironmentMix: levelId === '3-3' ? Number(novaEnvironment.mix.toFixed(3)) : null,
      novaEnvironmentTransition: levelId === '3-3' ? NOVA_ENVIRONMENT_TRANSITION : null,
      novaEnvironmentAssetsReady: levelId === '3-3' ? novaAssetsReady : null,
      novaBackgroundResolution: levelId === '3-3' ? 'six-high-resolution-16x9-scenes' : null,
      eclipseBossCracks: levelId === '3-3' ? clamp(world.boss?.hits || 0, 0, 3) : null,
      eclipseBreakTimer: levelId === '3-3' ? Number(game.eclipseBreakTimer.toFixed(2)) : null,
      backgroundTransitionPulse: false,
      sceneryBlend: Number(game.sceneryBlend.toFixed(2)),
      heroRenderSize: 66,
      layerAnchors: { middle: GROUND_Y + 54, near: canvas.height + 22, checkpoints: GROUND_Y },
      finaleType: finaleConfig.activity,
      celebrationTime: Number(game.celebrationTime.toFixed(2)),
      resultsShown: game.resultsShown,
      sourceVersion: SOURCE_VERSION,
      superHero: { ...sharedAbilities.snapshot(game.abilities), collisionWidth: player.w, collisionHeight: player.h },
      lastInput: game.lastInput,
      inputs: { ...keys },
      controllerStateSequence: game.controllerStateSequence,
      controllerStateSyncs: game.controllerStateSyncs,
      visibilityPaused: game.visibilityPaused,
      particleCount: game.particles.length,
      particleBudget: game.reducedShake ? 130 : constrainedDevice ? 240 : 340,
      victoryRouteEnemies: world.enemies.filter((enemy) => enemy.x >= victoryRouteStart()).length,
      groundedEnemies: world.enemies.filter((enemy) => footprintIsGrounded(
        enemy.x,
        enemy.w,
        enemy.baseY + enemy.h,
      )).length,
      groundedCheckpoints: world.checkpoints.filter((checkpoint) => footprintIsGrounded(
        checkpoint.spriteLeft,
        checkpoint.spriteWidth,
        checkpoint.groundY,
      )).length,
      groundedBoss: !world.boss
        || world.boss.kind === 'ringmaster'
        || footprintIsGrounded(world.boss.x, world.boss.w, world.boss.groundY),
      bossGroundingMode: world.boss?.kind === 'ringmaster' ? 'intentional-aerial' : world.boss ? 'grounded' : 'none',
      victorySigns: 0,
      victoryBubbles: Math.max(0, Math.ceil((world.goal.x - 650 - Math.floor(victoryRouteStart() / 650) * 650) / 650)),
      finaleSpriteLayers: 1,
      finalePulseScale: false,
      cleanCheckpointCrops: true,
      groundedEnemySprites: true,
      visualGroundingMode: 'opaque-foot-and-base-baseline',
      enemyShadowAnchors: false,
      checkpointShadowAnchors: false,
      enemyAnimationProfiles: Object.keys(ENEMY_SPRITE_PROFILES).length,
      fireworkCount: game.fireworks.length,
      fireworkShapes: [...new Set(game.fireworks.map((firework) => firework.shape))],
      finalTacosCollected: levelId === '3-3' ? game.finalTacosCollected : null,
      finalTacosTotal: levelId === '3-3' ? world.collectibles.filter((item) => item.novaTrail).length : null,
      finaleBanner: levelId === '3-3'
        && game.cosmicFinale.active
        && (game.cosmicFinale.maximumCrunchReveal > 0 || game.cosmicFinale.phase === 'complete' || game.state === 'won')
        ? 'WORLD 3 HAS ACHIEVED MAXIMUM CRUNCH.'
        : null,
      allLevelsBanner: levelId === '3-3'
        && game.cosmicFinale.active
        && (game.cosmicFinale.allLevelsReveal > 0 || game.cosmicFinale.phase === 'complete' || game.state === 'won')
        ? 'ALL 9 LEVELS COMPLETE!'
        : null,
      finaleOrbitProgress: levelId === '3-3' && game.cosmicFinale.phase === 'low-gravity'
        ? Number(clamp(game.cosmicFinale.timer / COSMIC_FINALE_PHASE_DURATIONS['low-gravity'], 0, 1).toFixed(2))
        : null,
      respawn: {
        active: game.respawn.active,
        placed: game.respawn.spawnPlaced,
        timer: Number(game.respawn.timer.toFixed(2)),
        targetX: Math.round(game.respawn.targetX || 0),
        targetY: Math.round(game.respawn.targetY || 0),
        playerY: Math.round(player.y),
        grounded: player.grounded,
        count: game.respawnCount,
        fallbacks: game.respawnFallbacks,
        landing: game.lastRespawnLanding,
      },
    });
    document.documentElement.dataset.world3Ready = 'true';
  }

  function frame(timestamp) {
    const dt = Math.min(0.033, Math.max(0, (timestamp - lastFrame) / 1000 || 0));
    lastFrame = timestamp;
    update(dt);
    draw();
    updateQaState();
    requestAnimationFrame(frame);
  }

  function setKey(event, down) {
    const key = event.key.toLowerCase();
    const input = ['arrowleft', 'a'].includes(key)
      ? 'left'
      : ['arrowright', 'd'].includes(key)
        ? 'right'
        : ['arrowup', 'w', ' '].includes(key)
          ? 'jump'
          : null;
    if (!input) return;
    if (!event.isTrusted && window.JFT_CONTROLLER) return;
    if (down) ensureAudio();
    setDigitalInput('keyboard', input, down);
    if (['arrowleft', 'arrowright', 'arrowup', ' '].includes(key)) event.preventDefault();
  }

  window.addEventListener('keydown', (event) => setKey(event, true), { passive: false });
  window.addEventListener('keyup', (event) => setKey(event, false), { passive: false });
  window.addEventListener('jft:controlleraction', (event) => {
    const { action, pressed } = event.detail || {};
    if (!['left', 'right', 'jump'].includes(action)) return;
    if (pressed) ensureAudio();
    setDigitalInput('controller', action, Boolean(pressed));
  });
  window.addEventListener('jft:controllerstate', (event) => {
    const detail = event.detail || {};
    game.controllerStateSequence = Number(detail.sequence) || game.controllerStateSequence;
    if (detail.connected === false) {
      clearInputSource('controller');
      return;
    }
    ['left', 'right'].forEach((input) => {
      const pressed = Boolean(detail[input]);
      if (inputSources.controller[input] === pressed) return;
      setDigitalInput('controller', input, pressed);
      game.controllerStateSyncs += 1;
    });
  });
  window.addEventListener('jft:gamepaddisconnected', () => clearInputSource('controller'));
  window.addEventListener('blur', clearAllInputs);
  document.addEventListener('visibilitychange', () => {
    clearAllInputs();
    game.visibilityPaused = document.hidden;
    if (document.hidden) {
      game.musicToken += 1;
      game.musicTransition = null;
      silenceUnused([]);
      stopVehicleIdle();
      stopWorldAmbience();
    } else if (['playing', 'won'].includes(game.state) && game.activeMusic && tracks[game.activeMusic]) {
      audio?.init({
        musicVolume: game.musicVolume,
        effectsVolume: game.effectsVolume,
        muted: game.muted,
      }).catch(() => {});
      const active = tracks[game.activeMusic];
      active.volume = 1;
      active.play().catch(() => {});
      syncAudioSettings(true);
      startWorldAmbience();
      if (game.vehicle.state === 'drop') startVehicleIdle(config.vehicle.kind);
    }
  });
  document.querySelectorAll('[data-input]').forEach((button) => {
    const input = button.dataset.input;
    const press = (event) => {
      event.preventDefault();
      ensureAudio();
      setTouchInput(input, true, event.pointerId);
      button.setPointerCapture?.(event.pointerId);
    };
    const release = (event) => {
      event.preventDefault();
      setTouchInput(input, false, event.pointerId);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
  const releaseTouch = (event) => releaseTouchPointer(event.pointerId);
  window.addEventListener('pointerup', releaseTouch);
  window.addEventListener('pointercancel', releaseTouch);

  window.JFT_LEVEL_START?.bind(resetGame, {
    label: ui.startBtn?.textContent?.trim() || 'Launch the Carnival!',
    ariaLabel: ui.startBtn?.getAttribute('aria-label') || `Start World ${levelId}`,
  });
  ui.restartBtn?.addEventListener('click', resetGame);
  ui.playAgainBtn?.addEventListener('click', resetGame);
  ui.muteBtn?.addEventListener('click', () => {
    game.muted = !game.muted;
    refreshVolumeLabels();
    audio?.setMuted(game.muted);
    updateMusic(0);
    savePreferences();
  });
  ui.settingsBtn?.addEventListener('click', () => {
    playAudio('ui.confirm');
    game.settingsOpen = true;
    ui.settingsOverlay?.classList.remove('hidden');
    ui.settingsOverlay?.classList.add('visible');
  });
  ui.closeSettingsBtn?.addEventListener('click', () => {
    playAudio('ui.confirm');
    game.settingsOpen = false;
    ui.settingsOverlay?.classList.add('hidden');
    ui.settingsOverlay?.classList.remove('visible');
    savePreferences();
  });
  ui.musicVolume?.addEventListener('input', () => {
    game.musicVolume = Number(ui.musicVolume.value) / 100;
    refreshVolumeLabels();
    audio?.setMusicVolume(game.musicVolume);
    updateMusic(0);
  });
  ui.effectsVolume?.addEventListener('input', () => {
    game.effectsVolume = Number(ui.effectsVolume.value) / 100;
    refreshVolumeLabels();
    audio?.setEffectsVolume(game.effectsVolume);
  });
  ui.reducedShake?.addEventListener('change', () => {
    game.reducedShake = ui.reducedShake.checked;
  });

  buildWorld();
  loadPreferences();
  syncAudioSettings(true);
  audio?.preloadGroups(['global', 'world3']).catch(() => {});
  draw();
  updateQaState();
  requestAnimationFrame(frame);
})();
