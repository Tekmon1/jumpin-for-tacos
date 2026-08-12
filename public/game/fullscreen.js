(() => {
  const shell = document.getElementById('gameShell');
  const button = document.getElementById('fullscreenBtn');
  const help = document.getElementById('fullscreenHelp');
  const closeButton = document.getElementById('closeFullscreenHelp');
  const helpText = document.getElementById('fullscreenHelpText');
  if (!shell || !button) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => Boolean(
    window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone
  );
  const canRequestFullscreen = () => Boolean(
    document.fullscreenEnabled
    && typeof shell.requestFullscreen === 'function'
  );

  function updateButton() {
    const active = Boolean(document.fullscreenElement) || isStandalone();
    button.textContent = active ? '✓ Full Screen' : '⛶ Full Screen';
    button.setAttribute('aria-pressed', String(active));
    document.documentElement.classList.toggle('standalone-game', isStandalone());
  }

  function showHelp(message) {
    if (!help) return;
    if (helpText) helpText.textContent = message;
    help.classList.remove('hidden');
    help.classList.add('visible');
  }

  function hideHelp() {
    if (!help) return;
    help.classList.add('hidden');
    help.classList.remove('visible');
  }

  async function requestLandscape() {
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch {
      // Orientation locking is optional and browser-controlled.
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (isStandalone()) {
      showHelp('You are already using the full-screen Home Screen version. Rotate your phone sideways for the largest game view.');
      return;
    }
    if (canRequestFullscreen()) {
      try {
        await shell.requestFullscreen({ navigationUI: 'hide' });
        await requestLandscape();
        return;
      } catch {
        // Fall through to the platform-specific installation guidance.
      }
    }

    if (isIOS) {
      showHelp('For full-screen play on iPhone: tap Safari’s Share button, choose “Add to Home Screen,” then launch Jumpin’ For Tacos from its new icon.');
    } else {
      showHelp('This browser does not currently allow the game to enter full screen. Installing it to your Home Screen or trying the latest browser usually enables the largest view.');
    }
  }

  button.addEventListener('click', toggleFullscreen);
  closeButton?.addEventListener('click', hideHelp);
  help?.addEventListener('click', (event) => {
    if (event.target === help) hideHelp();
  });
  document.addEventListener('fullscreenchange', updateButton);
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', updateButton);
  updateButton();
})();
