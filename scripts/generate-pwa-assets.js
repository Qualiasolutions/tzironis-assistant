// This script can be used to generate PWA icons from a source image
// Install sharp first: npm install sharp
// Then run: node scripts/generate-pwa-assets.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_ICON = path.join(__dirname, '../public/logo.png'); // Update with your source icon
const ICONS_DIR = path.join(__dirname, '../public/icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error(`Source icon not found at ${SOURCE_ICON}`);
      console.log('Please place your app logo at public/logo.png or update the SOURCE_ICON path');
      return;
    }

    console.log('Generating PWA icons...');
    
    // Generate icons for all required sizes
    for (const size of sizes) {
      const outputFile = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      console.log(`Created ${outputFile}`);
    }
    
    console.log('PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 