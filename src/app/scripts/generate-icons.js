/**
 * TwoBeOne Icon Generator Script
 * 
 * This script generates all required PWA icons from the SVG source.
 * 
 * Usage:
 *   npm install sharp
 *   node scripts/generate-icons.js
 * 
 * Or use the web-based generator at /public/generate-icons.html
 */

const fs = require('fs');
const path = require('path');

// Icon sizes to generate
const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512, 1024];

// Paths
const SVG_SOURCE = path.join(__dirname, '../public/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Try to import sharp (it may not be installed)
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('❌ Sharp is not installed. Install it with: npm install sharp');
      console.log('\n📝 Alternative: Use the web-based generator at /public/generate-icons.html');
      process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Read SVG source
    const svgBuffer = fs.readFileSync(SVG_SOURCE);

    console.log('🎨 Generating TwoBeOne app icons...\n');

    // Generate each icon size
    for (const size of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} icon`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Verify icons look correct');
    console.log('   2. Test "Add to Home Screen" on mobile devices');
    console.log('   3. Deploy your app with the new icons');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, ICON_SIZES };
