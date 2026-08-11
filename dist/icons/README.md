# TwoBeOne App Icons

This directory contains all the PWA icons for the TwoBeOne app in various sizes for different platforms.

## 🎨 Generating Icons

### Option 1: Using the Icon Generator Tool (Recommended)

1. Open `/public/generate-icons.html` in your web browser
2. The tool will automatically generate all required icon sizes
3. Click "Download All Icons" to download them as a ZIP file
4. Extract the ZIP and place all PNG files in this `/public/icons/` directory

### Option 2: Manual Generation

If you prefer to generate icons manually:

1. Use an online tool like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/

2. Upload the `/public/icon.svg` file

3. Generate the following sizes:
   - 72x72 (icon-72x72.png)
   - 96x96 (icon-96x96.png)
   - 128x128 (icon-128x128.png)
   - 144x144 (icon-144x144.png)
   - 152x152 (icon-152x152.png)
   - 180x180 (icon-180x180.png)
   - 192x192 (icon-192x192.png)
   - 384x384 (icon-384x384.png)
   - 512x512 (icon-512x512.png)
   - 1024x1024 (icon-1024x1024.png)

4. Place all generated PNG files in this directory

## 📱 Icon Usage by Platform

### iOS (Safari)
- **152x152**: iPad home screen
- **180x180**: iPhone home screen (primary)
- **167x167**: iPad Pro home screen
- **1024x1024**: App Store / high-res displays

### Android (Chrome)
- **72x72**: Low-density screens
- **96x96**: Medium-density screens
- **128x128**: High-density screens
- **144x144**: Extra-high density screens
- **192x192**: Standard launcher icon
- **384x384**: Large devices
- **512x512**: Splash screens, high-res

### Windows (Microsoft Edge)
- **72x72**: Small tile (70x70)
- **152x152**: Medium tile (150x150)
- **144x144**: Windows tile
- **384x384**: Large tile (310x310)

### Desktop Browsers
- **128x128**: Standard favicon
- **192x192**: Browser install prompt
- **512x512**: Install dialog, splash screens

## ✅ Verification Checklist

After generating and placing icons:

- [ ] All 10 PNG files are in `/public/icons/` directory
- [ ] Files are named correctly (icon-{size}x{size}.png)
- [ ] Icons appear correctly when testing "Add to Home Screen"
- [ ] Icons appear in browser tabs
- [ ] Icons appear in Windows tiles
- [ ] Icons appear on iOS home screen
- [ ] Icons appear on Android home screen

## 🔍 Testing

### iOS Safari
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Verify the icon appears correctly

### Android Chrome
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Verify the icon appears correctly

### Desktop Chrome
1. Open the app in Chrome
2. Click the install icon in the address bar
3. Verify the icon appears in the install dialog
4. After installing, check the icon in your applications

## 🎨 Icon Design

The TwoBeOne icon features:
- **Gradient background**: Purple (#7c3aed) to Pink (#ec4899)
- **Symbol**: Three overlapping hearts representing two becoming one
- **Rounded corners**: 115px radius for the 512px version
- **Colors**: White hearts on gradient background
- **Maskable**: Safe zone properly configured for adaptive icons

## 📝 Notes

- The SVG version (`/public/icon.svg`) is also used as a fallback
- Modern browsers support SVG favicons, but PNG is more widely compatible
- Maskable icons ensure the logo looks good on all Android launchers
- Apple requires PNG for home screen icons (SVG is not supported)
