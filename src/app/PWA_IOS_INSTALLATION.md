# iOS PWA Installation Guide for TwoBeOne

## Why "Add to Home Screen" Might Not Appear on iOS

iOS Safari has specific requirements for showing the "Add to Home Screen" option:

### ✅ Requirements Checklist

1. **HTTPS or Localhost**: The app must be served over HTTPS (production) or localhost (development)
2. **Valid Manifest**: The `manifest.json` file must be accessible and properly formatted
3. **Icons Present**: Apple touch icons must exist and be accessible
4. **Meta Tags**: Proper iOS-specific meta tags must be in the HTML
5. **Service Worker**: While not strictly required for iOS, it helps with PWA detection
6. **Not Already Installed**: If the app is already installed, the option won't show

### 🔍 Current Implementation Status

✅ **Manifest File**: `/public/manifest.json` is configured with:
- App name: "TwoBeOne - Christian Couples App"
- Short name: "TwoBeOne"
- Display mode: "standalone"
- Theme colors and icons

✅ **HTML Meta Tags**: `index.html` includes:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TwoBeOne">
```

✅ **Icons**: SVG icon at `/public/icon.svg` with gradient background and dual-heart design

✅ **iOS Install Prompt**: Custom component that guides users through installation

✅ **Debug Mode**: Tap the top-right corner 5 times to see PWA debug information

## 📱 How to Install on iOS (User Instructions)

### Step 1: Open Safari
The app **MUST** be opened in Safari browser on iOS. Chrome, Firefox, and other browsers on iOS do not support "Add to Home Screen" for PWAs.

### Step 2: Navigate to the App
Go to your deployed TwoBeOne URL (e.g., `https://your-domain.com`)

### Step 3: Tap the Share Button
Look for the Share button (square with arrow pointing up) in Safari's toolbar:
- On iPhone: Bottom center of the screen
- On iPad: Top right of the screen

### Step 4: Scroll Down in Share Menu
The Share menu has many options. **Scroll down** to find "Add to Home Screen". It's usually in the second section of options.

### Step 5: Tap "Add to Home Screen"
You should see:
- App icon preview
- App name: "TwoBeOne"
- Option to edit the name
- "Add" button in the top right

### Step 6: Tap "Add"
The app will be installed on your home screen like a native app.

## 🐛 Troubleshooting

### "Add to Home Screen" Option Not Showing

**Check 1: Using Safari?**
- Only Safari supports PWA installation on iOS
- Chrome, Firefox, and other browsers won't show this option

**Check 2: Already Installed?**
- If you've already installed the app, the option won't appear
- Delete the app from your home screen and try again

**Check 3: HTTPS Required**
- The app must be served over HTTPS in production
- `http://` URLs won't work (except localhost for testing)

**Check 4: Website Data**
- Go to Settings → Safari → Advanced → Website Data
- Search for your domain and clear data if needed
- Try again

**Check 5: Safari Cache**
- Clear Safari's cache: Settings → Safari → Clear History and Website Data
- Reopen the website in Safari

### Enable Debug Mode

To see detailed PWA installation information:
1. Open the app in Safari
2. Tap the top-right corner of the screen 5 times quickly
3. A debug panel will appear showing:
   - Device type (iOS/Android)
   - Browser type
   - PWA installation status
   - Service Worker status
   - Manifest and icon detection

## 🎨 Icon Notes

The app currently uses an SVG icon (`/public/icon.svg`) which should work for most purposes. However, for best compatibility with iOS, you may want to:

### Convert SVG to PNG (Optional but Recommended)

iOS has better support for PNG icons. To create PNG icons:

1. **Option A: Use an online converter**
   - Go to https://svgtopng.com/ or similar
   - Upload `/public/icon.svg`
   - Generate PNGs in these sizes:
     - 180x180 (iPhone retina)
     - 167x167 (iPad Pro)
     - 152x152 (iPad retina)
     - 120x120 (iPhone)

2. **Option B: Use Figma/Photoshop**
   - Open the SVG in your design tool
   - Export as PNG at the sizes above
   - Place in `/public/icons/` folder

3. **Update References**
   - Update `index.html` to point to PNG files instead of SVG
   - Update `manifest.json` to reference PNG icons

## 🚀 Deployment Checklist

Before deploying to production, ensure:

- [ ] App is served over HTTPS
- [ ] `/manifest.json` is accessible at the root
- [ ] `/icon.svg` exists and is accessible
- [ ] All meta tags are present in `index.html`
- [ ] Service Worker is registered (check browser console)
- [ ] Test installation on a real iOS device
- [ ] Test in standalone mode after installation

## 💡 Custom Install Prompt

The app includes a custom iOS install prompt (`IOSInstallPrompt.tsx`) that:
- Detects iOS devices automatically
- Only shows on iOS Safari
- Provides step-by-step installation instructions
- Shows 3 seconds after page load
- Can be dismissed (saves preference to localStorage)
- Includes "Remind Me Later" option

Users will see this prompt instead of relying on finding the native Safari option.

## 🔗 Testing URLs

**Local Testing:**
```
http://localhost:5173
```
(PWA features limited on localhost)

**Production:**
```
https://your-deployed-domain.com
```
(Full PWA features available)

## 📚 Additional Resources

- [Apple PWA Documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [iOS Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)
- [PWA Install Criteria](https://web.dev/install-criteria/)

## ✨ Features Available in Installed App

Once installed on iOS home screen:
- ✅ Launches in full-screen (no Safari UI)
- ✅ Custom splash screen
- ✅ Status bar styling
- ✅ Offline support (with Service Worker)
- ✅ Push notifications (if configured)
- ✅ Native-like experience
- ✅ Appears in app switcher
- ✅ Can be organized in folders

## 🎯 Next Steps

1. Deploy the app to production with HTTPS
2. Test installation on real iOS device
3. Optionally convert SVG icon to PNG for better compatibility
4. Share installation instructions with users
5. Monitor PWA analytics to track installations

---

**Need Help?** Tap the top-right corner 5 times to see detailed debug information about PWA installation status.
