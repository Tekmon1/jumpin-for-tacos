(() => {
  const definitions = Object.freeze({
    tacoMeter: Object.freeze({ id: 'taco-meter', label: 'Taco Meter', threshold: 100 }),
    tacoFrenzy: Object.freeze({ id: 'taco-frenzy', label: 'Taco Frenzy', duration: 8 }),
    tacoMagnet: Object.freeze({ id: 'taco-magnet', label: 'Taco Magnet', duration: 9, radius: 310 }),
  });

  function createState() {
    return { tacoMeter: 0, frenzyTimer: 0, magnetTimer: 0, frenzyCount: 0 };
  }

  function reset(state) {
    Object.assign(state, createState());
    return state;
  }

  function update(state, dt) {
    state.frenzyTimer = Math.max(0, state.frenzyTimer - dt);
    state.magnetTimer = Math.max(0, state.magnetTimer - dt);
  }

  function addMeter(state, amount) {
    if (state.frenzyTimer > 0) return false;
    state.tacoMeter = Math.min(definitions.tacoMeter.threshold, state.tacoMeter + amount);
    if (state.tacoMeter < definitions.tacoMeter.threshold) return false;
    state.tacoMeter = 0;
    state.frenzyTimer = definitions.tacoFrenzy.duration;
    state.frenzyCount += 1;
    return true;
  }

  function collectTaco(state, premium = false) {
    return addMeter(state, premium ? 16 : 7);
  }

  function splatEnemy(state) {
    return addMeter(state, 14);
  }

  function activateMagnet(state, duration = definitions.tacoMagnet.duration) {
    state.magnetTimer = Math.max(state.magnetTimer, duration);
  }

  window.JFT_SHARED_ABILITIES = Object.freeze({
    definitions,
    createState,
    reset,
    update,
    collectTaco,
    splatEnemy,
    activateMagnet,
    isFrenzy: (state) => state.frenzyTimer > 0,
    hasMagnet: (state) => state.magnetTimer > 0,
  });
})();
