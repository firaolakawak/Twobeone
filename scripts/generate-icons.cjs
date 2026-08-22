#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'src', 'app', 'public');
const iconsDir = path.join(publicDir, 'icons');
const svgSource = path.join(publicDir, 'icon.svg');
const pngSource = path.join(publicDir, 'icon-source.png');

const sizes = [1024, 512, 384, 192, 180, 167, 152, 144, 128, 96, 72];

async function generate() {
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  let input;
  if (fs.existsSync(pngSource)) {
    console.log('Using PNG source:', pngSource);
    input = pngSource;
  } else if (fs.existsSync(svgSource)) {
    console.log('Using SVG source:', svgSource);
    input = svgSource;
  } else {
    console.error('No source icon found. Place your logo at:', pngSource);
    process.exit(1);
  }

  for (const size of sizes) {
    const out = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(input)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(out);
    console.log('Wrote', out);
  }

  // Create maskable 512 (for PWA)
  const maskableOut = path.join(iconsDir, 'icon-512x512-maskable.png');
  await sharp(input)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 90 })
    .toFile(maskableOut);
  console.log('Wrote', maskableOut);

  console.log('Icon generation complete. Update /src/app/public/manifest.json if needed.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
