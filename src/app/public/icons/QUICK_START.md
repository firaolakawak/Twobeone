# 🚀 Quick Start: Generate TwoBeOne App Icons

## Option 1: Web Generator (Easiest - 2 minutes)

1. Open: `/public/generate-icons.html` in your browser
2. Icons auto-generate on page load
3. Click "Download All Icons"
4. Extract ZIP and upload all PNG files to `/public/icons/`

✅ Done! Test by adding app to your phone's home screen.

---

## Option 2: Node.js Script

```bash
npm install sharp
node scripts/generate-icons.js
```

✅ Done! Icons are automatically saved to `/public/icons/`

---

## Option 3: Online Tool

1. Go to: https://realfavicongenerator.net/
2. Upload: `/public/icon.svg`
3. Download generated icons
4. Place in: `/public/icons/`

✅ Done!

---

## 🧪 Test Your Icons

### iOS (Safari)
1. Open app in Safari
2. Tap Share → "Add to Home Screen"
3. Check icon looks good ✓

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Check icon looks good ✓

### Desktop (Chrome)
1. Open app in Chrome
2. Click install icon in address bar
3. Check icon looks good ✓

---

## 📋 Icon Sizes Required

- ✅ 72×72 - Android low-density
- ✅ 96×96 - Android medium-density
- ✅ 128×128 - Desktop favicon
- ✅ 144×144 - Windows tile
- ✅ 152×152 - iOS iPad
- ✅ 180×180 - iOS iPhone ⭐
- ✅ 192×192 - Android standard ⭐
- ✅ 384×384 - Android large
- ✅ 512×512 - Splash screens ⭐
- ✅ 1024×1024 - High-res displays

⭐ = Most important

---

## ❓ Need Help?

- Full guide: `/docs/PWA_ICON_SETUP.md`
- Icon details: `/public/icons/README.md`
- Generator tool: `/public/generate-icons.html`
