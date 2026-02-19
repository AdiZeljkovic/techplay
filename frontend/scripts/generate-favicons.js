const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG source and output sizes
const iconSvg = path.join(__dirname, '../app/icon.svg');
const publicDir = path.join(__dirname, '../public');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

async function generateFavicons() {
  console.log('🎨 Generating favicons from SVG...\n');

  // Read SVG
  const svgBuffer = fs.readFileSync(iconSvg);

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);

    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n✨ Favicon generation complete!');
}

generateFavicons().catch(console.error);
