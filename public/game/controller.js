(() => {
  if (window.JFT_CONTROLLER) return;

  const DEADZONE = 0.28;
  const bindings = Object.freeze({
    move: 'Left stick or D-pad',
    jumpConfirm: 'A',
    back: 'B',
    special: 'X',
    fullscreen: 'Y',
    settingsPause: 'Menu',
  });
  const keyBindings = Object.freeze({
    left: Object.freeze({ key: 'ArrowLeft', code: 'ArrowLeft' }),
    right: Object.freeze({ key: 'ArrowRight', code: 'ArrowRight' }),
    jump: Object.freeze({ key: ' ', code: 'Space' }),
    special: Object.freeze({ key: 'x', code: 'KeyX' }),
  });
  const state = {
    connected: false,
    index: null,
    id: '',
    confirmHeld: false,
    digital: { left: false, right: false, jump: false, special: false },
    buttons: { fullscreen: false, menu: false, back: false },
    snapshot: { left: false, right: false, jump: false, special: false, back: false, fullscreen: false, menu: false },
    stateSequence: 0,
  };
  const qaHost = ['terminal.local', '127.0.0.1', 'localhost'].includes(window.location.hostname);
  const qaMode = qaHost && new URLSearchParams(window.location.search).get('controllerQa') === '1';
  const qaVirtualButtons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
  const qaVirtualGamepad = qaMode ? {
    axes: [0, 0, 0, 0], buttons: qaVirtualButtons, connected: true, id: 'QA Xbox Controller', index: 99, mapping: 'standard', timestamp: 0,
  } : null;
  let toastTimer = 0;
  let controllerHint = null;

  function buttonPressed(button) {
    if (typeof button === 'number') return button > 0.5;
    return Boolean(button && (button.pressed || button.value > 0.5));
  }

  function resolveSnapshot(gamepad) {
    const axes = gamepad?.axes || [];
    const buttons = gamepad?.buttons || [];
    const horizontal = Number(axes[0] || 0);
    return {
      left: horizontal < -DEADZONE || buttonPressed(buttons[14]),
      right: horizontal > DEADZONE || buttonPressed(buttons[15]),
      jump: buttonPressed(buttons[0]),
      back: buttonPressed(buttons[1]),
      special: buttonPressed(buttons[2]),
      fullscreen: buttonPressed(buttons[3]),
      menu: buttonPressed(buttons[9]),
    };
  }

  function dispatchKey(action, pressed) {
    const binding = keyBindings[action];
    if (!binding) return;
    window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
      key: binding.key,
      code: binding.code,
      bubbles: true,
      cancelable: true,
      repeat: false,
    }));
  }

  function dispatchControllerAction(action, pressed, gamepad) {
    window.dispatchEvent(new CustomEvent('jft:controlleraction', {
      detail: {
        action,
        pressed,
        gamepadIndex: gamepad?.index ?? state.index,
        gamepadId: gamepad?.id || state.id,
      },
    }));
  }

  function dispatchControllerState(input, gamepad, connected = true) {
    state.snapshot = {
      left: Boolean(input.left), right: Boolean(input.right), jump: Boolean(input.jump), special: Boolean(input.special),
      back: Boolean(input.back), fullscreen: Boolean(input.fullscreen), menu: Boolean(input.menu),
    };
    state.stateSequence += 1;
    const detail = {
      ...state.snapshot,
      connected,
      sequence: state.stateSequence,
      gamepadIndex: gamepad?.index ?? state.index,
      gamepadId: gamepad?.id || state.id,
    };
    window.dispatchEvent(new CustomEvent('jft:controllerstate', { detail }));
    if (qaMode) document.documentElement.dataset.controllerState = JSON.stringify(detail);
  }

  function isOpen(element) {
    if (!element || element.classList.contains('hidden')) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function clickIfAvailable(selector) {
    const element = document.querySelector(selector);
    if (!element || element.disabled) return false;
    element.click();
    return true;
  }

  function confirmPrimaryAction() {
    if (isOpen(document.getElementById('fullscreenHelp'))) return clickIfAvailable('#closeFullscreenHelp');
    if (isOpen(document.getElementById('startOverlay'))) return clickIfAvailable('#startBtn');
    if (isOpen(document.getElementById('winOverlay'))) {
      return clickIfAvailable('#winOverlay [data-next-level]') || clickIfAvailable('#playAgainBtn');
    }
    return false;
  }

  function closeDialog() {
    if (isOpen(document.getElementById('settingsOverlay'))) return clickIfAvailable('#closeSettingsBtn');
    if (isOpen(document.getElementById('fullscreenHelp'))) return clickIfAvailable('#closeFullscreenHelp');
    return false;
  }

  function toggleSettings() {
    if (isOpen(document.getElementById('settingsOverlay'))) return clickIfAvailable('#closeSettingsBtn');
    return clickIfAvailable('#settingsBtn');
  }

  function vibrate(duration = 55, strongMagnitude = 0.22, weakMagnitude = 0.12) {
    const gamepad = getActiveGamepad();
    const actuator = gamepad?.vibrationActuator || gamepad?.hapticActuators?.[0];
    if (!actuator) return false;
    try {
      if (typeof actuator.playEffect === 'function') {
        const effect = actuator.playEffect('dual-rumble', { duration, strongMagnitude, weakMagnitude });
        if (effect && typeof effect.catch === 'function') effect.catch(() => {});
        return true;
      }
      if (typeof actuator.pulse === 'function') {
        const pulse = actuator.pulse(Math.max(strongMagnitude, weakMagnitude), duration);
        if (pulse && typeof pulse.catch === 'function') pulse.catch(() => {});
        return true;
      }
    } catch { /* haptics are optional */ }
    return false;
  }

  function handleDigital(action, pressed, gamepad) {
    if (state.digital[action] === pressed) return;
    state.digital[action] = pressed;

    if (action === 'jump' && pressed && confirmPrimaryAction()) {
      state.confirmHeld = true;
      vibrate(45, 0.18, 0.1);
      dispatchControllerAction('confirm', true, gamepad);
      return;
    }
    if (action === 'jump' && !pressed && state.confirmHeld) {
      state.confirmHeld = false;
      dispatchControllerAction('confirm', false, gamepad);
      return;
    }

    dispatchKey(action, pressed);
    dispatchControllerAction(action, pressed, gamepad);
    if (pressed && action === 'jump') vibrate();
    if (pressed && action === 'special') vibrate(75, 0.32, 0.18);
  }

  function handleButtonEdge(action, pressed, gamepad) {
    if (state.buttons[action] === pressed) return;
    state.buttons[action] = pressed;
    dispatchControllerAction(action, pressed, gamepad);
    if (!pressed) return;
    if (action === 'back') closeDialog();
    if (action === 'menu') toggleSettings();
    if (action === 'fullscreen') clickIfAvailable('#fullscreenBtn');
  }

  function releaseHeldInputs() {
    Object.keys(state.digital).forEach((action) => {
      if (!state.digital[action]) return;
      handleDigital(action, false, null);
    });
    Object.keys(state.buttons).forEach((action) => { state.buttons[action] = false; });
  }

  function getGamepads() {
    if (qaVirtualGamepad) return [qaVirtualGamepad];
    try { return Array.from(navigator.getGamepads?.() || []).filter(Boolean); }
    catch { return []; }
  }

  function getActiveGamepad() {
    const gamepads = getGamepads();
    if (state.index !== null) {
      const selected = gamepads.find((gamepad) => gamepad.index === state.index);
      if (selected) return selected;
    }
    return gamepads.find((gamepad) => gamepad.mapping === 'standard') || gamepads[0] || null;
  }

  function showToast(text) {
    let toast = document.getElementById('jftControllerToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'jftControllerToast';
      toast.className = 'jft-controller-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function updateHint(connected) {
    if (!controllerHint) return;
    controllerHint.replaceChildren();
    const label = document.createElement('strong');
    label.textContent = 'Controller:';
    controllerHint.append(label, document.createTextNode(connected
      ? ' Connected — left stick/D-pad + A to jump'
      : ' Xbox/standard gamepad supported'));
  }

  function setConnected(gamepad) {
    const changed = !state.connected || state.index !== gamepad.index;
    state.connected = true;
    state.index = gamepad.index;
    state.id = gamepad.id || 'Standard controller';
    document.documentElement.dataset.gamepad = 'connected';
    updateHint(true);
    if (changed) {
      showToast('🎮 CONTROLLER READY — PRESS A TO JUMP');
      window.dispatchEvent(new CustomEvent('jft:gamepadconnected', { detail: { index: state.index, id: state.id } }));
    }
  }

  function setDisconnected() {
    if (!state.connected) return;
    const previous = { index: state.index, id: state.id };
    releaseHeldInputs();
    state.connected = false;
    state.index = null;
    state.id = '';
    document.documentElement.dataset.gamepad = 'disconnected';
    updateHint(false);
    showToast('CONTROLLER DISCONNECTED — KEYBOARD & TOUCH READY');
    window.dispatchEvent(new CustomEvent('jft:gamepaddisconnected', { detail: previous }));
    dispatchControllerState({ left: false, right: false, jump: false, special: false, back: false, fullscreen: false, menu: false }, null, false);
  }

  function poll() {
    const gamepad = getActiveGamepad();
    if (!gamepad) setDisconnected();
    else {
      setConnected(gamepad);
      const input = resolveSnapshot(gamepad);
      handleDigital('left', input.left, gamepad);
      handleDigital('right', input.right, gamepad);
      handleDigital('jump', input.jump, gamepad);
      handleDigital('special', input.special, gamepad);
      handleButtonEdge('back', input.back, gamepad);
      handleButtonEdge('fullscreen', input.fullscreen, gamepad);
      handleButtonEdge('menu', input.menu, gamepad);
      dispatchControllerState(input, gamepad);
    }
    requestAnimationFrame(poll);
  }

  function installQaUi() {
    if (!qaVirtualGamepad) return;
    const syncQaGamepad = () => {
      const input = resolveSnapshot(qaVirtualGamepad);
      handleDigital('left', input.left, qaVirtualGamepad);
      handleDigital('right', input.right, qaVirtualGamepad);
      handleDigital('jump', input.jump, qaVirtualGamepad);
      handleDigital('special', input.special, qaVirtualGamepad);
      handleButtonEdge('back', input.back, qaVirtualGamepad);
      handleButtonEdge('fullscreen', input.fullscreen, qaVirtualGamepad);
      handleButtonEdge('menu', input.menu, qaVirtualGamepad);
      dispatchControllerState(input, qaVirtualGamepad);
    };
    const panel = document.createElement('div');
    panel.id = 'jftControllerQaPanel';
    panel.setAttribute('aria-label', 'Controller QA controls');
    const holdRight = document.createElement('button');
    holdRight.id = 'jftQaHoldRight';
    holdRight.type = 'button';
    holdRight.textContent = 'Hold Xbox Right';
    holdRight.addEventListener('click', () => {
      qaVirtualGamepad.axes[0] = 1;
      qaVirtualGamepad.timestamp += 1;
      syncQaGamepad();
    });
    const neutral = document.createElement('button');
    neutral.id = 'jftQaNeutral';
    neutral.type = 'button';
    neutral.textContent = 'Xbox Neutral';
    neutral.addEventListener('click', () => {
      qaVirtualGamepad.axes[0] = 0;
      qaVirtualGamepad.timestamp += 1;
      syncQaGamepad();
    });
    const pressA = document.createElement('button');
    pressA.id = 'jftQaPressA';
    pressA.type = 'button';
    pressA.textContent = 'Press Xbox A';
    pressA.addEventListener('click', () => {
      qaVirtualGamepad.buttons[0] = { pressed: true, value: 1 };
      qaVirtualGamepad.timestamp += 1;
      syncQaGamepad();
      window.setTimeout(() => {
        qaVirtualGamepad.buttons[0] = { pressed: false, value: 0 };
        qaVirtualGamepad.timestamp += 1;
        syncQaGamepad();
      }, 90);
    });
    panel.append(holdRight, neutral, pressA);
    document.body.appendChild(panel);
  }

  function installUi() {
    const style = document.createElement('style');
    style.textContent = `
      .jft-controller-toast {
        position: fixed; z-index: 10000; top: max(12px, env(safe-area-inset-top)); left: 50%;
        transform: translate(-50%, -18px); max-width: min(90vw, 560px); padding: 11px 18px;
        border: 3px solid #65d8ff; border-radius: 999px; background: rgba(32, 29, 61, .58);
        -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px);
        color: #fff1a6; box-shadow: 0 10px 34px rgba(0, 0, 0, .38), 0 0 20px rgba(101, 216, 255, .3);
        font: 900 13px/1.2 Arial, sans-serif; letter-spacing: .04em; text-align: center;
        opacity: 0; pointer-events: none; transition: opacity .18s ease, transform .18s ease;
      }
      .jft-controller-toast.visible { opacity: 1; transform: translate(-50%, 0); }
      .controls-grid [data-controller-hint] { color: #c9f4ff; }
      html[data-gamepad='connected'] .controls-grid [data-controller-hint] { color: #fff1a6; }
      #jftControllerQaPanel {
        position: fixed; z-index: 10001; right: 12px; bottom: 12px; display: flex; gap: 8px;
        padding: 8px; border: 2px solid #65d8ff; border-radius: 12px; background: rgba(32, 29, 61, .42);
        -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
      }
      #jftControllerQaPanel button { padding: 7px 10px; border: 0; border-radius: 8px; font-weight: 900; cursor: pointer; }
    `;
    document.head.appendChild(style);
    const controls = document.querySelector('.controls-grid');
    if (controls && !controls.querySelector('[data-controller-hint]')) {
      controllerHint = document.createElement('span');
      controllerHint.dataset.controllerHint = 'true';
      controls.appendChild(controllerHint);
      updateHint(false);
    }
    installQaUi();
  }

  const api = {
    version: 3,
    supported: typeof navigator.getGamepads === 'function',
    bindings,
    resolveSnapshot,
    vibrate,
    getActiveGamepad,
    getSnapshot: () => state.connected ? { ...state.snapshot } : null,
  };
  Object.defineProperties(api, {
    connected: { enumerable: true, get: () => state.connected },
    controllerId: { enumerable: true, get: () => state.id },
  });
  window.JFT_CONTROLLER = Object.freeze(api);

  document.documentElement.dataset.controllerReady = 'true';
  if (qaHost) {
    const qaButtons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    const leftStick = resolveSnapshot({ axes: [-0.8], buttons: qaButtons });
    qaButtons[0] = { pressed: true, value: 1 };
    qaButtons[2] = { pressed: true, value: 1 };
    qaButtons[3] = { pressed: true, value: 1 };
    qaButtons[9] = { pressed: true, value: 1 };
    qaButtons[14] = { pressed: true, value: 1 };
    document.documentElement.dataset.controllerQa = JSON.stringify({
      leftStick,
      mappedButtons: resolveSnapshot({ axes: [0], buttons: qaButtons }),
      bindings,
      continuousState: true,
    });
  }

  const boot = () => {
    installUi();
    window.addEventListener('gamepadconnected', (event) => setConnected(event.gamepad));
    window.addEventListener('gamepaddisconnected', (event) => {
      if (event.gamepad.index === state.index) setDisconnected();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseHeldInputs(); });
    window.addEventListener('blur', releaseHeldInputs);
    requestAnimationFrame(poll);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
