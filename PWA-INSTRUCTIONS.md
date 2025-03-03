# Progressive Web App (PWA) Implementation

This document provides instructions for setting up and customizing the PWA functionality of the Tzironis Business Suite.

## What is a PWA?

A Progressive Web App (PWA) allows users to install your web application as a native-like app on their devices. This provides several benefits:

- Offline functionality
- Home screen access
- Full-screen experience
- Push notifications (if implemented)
- Better performance through caching

## Required Files (Already Implemented)

The following files have been implemented to enable PWA functionality:

1. `public/manifest.json` - Defines app metadata for installation
2. `public/service-worker.js` - Manages caching and offline functionality
3. `public/pwa.js` - Handles the installation process
4. `app/components/PWAInstallPrompt.tsx` - Provides a UI for app installation

## Generating App Icons

To generate the required icons for PWA installation:

1. Place your source logo at `public/logo.png` (preferably a square PNG at least 512x512 pixels)
2. Install the Sharp image library: 
   ```bash
   npm install sharp --save-dev
   ```
3. Run the included icon generation script:
   ```bash
   node scripts/generate-pwa-assets.js
   ```

This will create all the necessary icon sizes in the `public/icons` directory.

## Manual Icon Setup

If you prefer to create icons manually, you need the following sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (also used for Apple Touch Icon)
- 384x384
- 512x512

Place these in the `public/icons` directory with the naming convention `icon-{size}x{size}.png`.

## Customizing the PWA

You can customize various aspects of the PWA:

1. App name and description in `public/manifest.json`
2. Colors in `public/manifest.json` (background_color and theme_color)
3. Installation prompt appearance in `app/components/PWAInstallPrompt.tsx`
4. Cached resources in `public/service-worker.js`

## Testing Installation

To test the installation functionality:
1. Deploy your app to a production environment (or use HTTPS in development)
2. Open the app in Chrome, Edge, or another PWA-compatible browser
3. You should see the installation prompt after a short delay
4. Alternatively, use the browser's menu to install the app

## Browser Support

PWA installation is supported in:
- Chrome (desktop and mobile)
- Edge (desktop)
- Firefox (mobile)
- Safari (mobile, with limited functionality)

## Troubleshooting

If the installation prompt doesn't appear:
1. Check browser console for errors
2. Verify that all required files exist and are properly formatted
3. Ensure your app is served over HTTPS
4. Validate your manifest.json using a PWA checker tool
5. Make sure icons exist and are properly referenced

For further assistance or customization, please contact the development team. 