(function initializeGoogleAnalytics() {
  const measurementId = 'G-SLB3LYZTZ7';

  if (window.__JFT_GOOGLE_ANALYTICS_LOADED__) return;
  window.__JFT_GOOGLE_ANALYTICS_LOADED__ = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(tag);

  window.gtag('js', new Date());
  window.gtag('config', measurementId);
})();
