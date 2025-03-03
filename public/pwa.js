if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Detect if the app can be installed
let deferredPrompt;
const installButton = document.createElement('div');
installButton.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Update UI to notify the user they can install the PWA
  // This is handled by the PWAInstallPrompt component
  
  // Dispatch a custom event that our React components can listen to
  const event = new CustomEvent('pwaInstallAvailable');
  window.dispatchEvent(event);
});

// Track when the PWA is installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed successfully');
  // Clear the deferredPrompt
  deferredPrompt = null;
}); 