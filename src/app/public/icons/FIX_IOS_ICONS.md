# 🛠️ Fix iOS App Icon Issue

## Problem
The TwoBeOne app icon is not displaying on iOS devices (showing just a "T" letter instead). This happens because the required PNG icon files are missing from the `/public/icons/` directory.

## Solution

Follow these steps to generate and upload the required icons:

### Step 1: Generate Icons
1. Open this URL in your browser: `/generate-app-icons.html`
2. Click the **"Generate All Icons"** button
3. Wait for all 10 icons to be generated (~5 seconds)
4. Click **"Download All as ZIP"**

### Step 2: Upload Icons
1. Extract the downloaded `twobeone-icons.zip` file
2. You should see 10 PNG files:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-180x180.png ⭐ (Most important for iOS)
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png
   - icon-1024x1024.png

3. Upload ALL 10 PNG files to the `/public/icons/` directory (replace the existing placeholder files)

### Step 3: Test
1. Clear your browser cache or do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. On iOS: Delete the existing TwoBeOne app from home screen
3. Re-add the app to your home screen using Safari's "Add to Home Screen" option
4. The proper heart icon should now appear! ✨

## Why This Happens

iOS requires actual PNG files (not SVG) to display PWA icons on the home screen. While the `/public/icon.svg` exists, iOS specifically looks for:
- `icon-180x180.png` (iPhone)
- `icon-152x152.png` (iPad)
- `icon-192x192.png` (general PWA)

## Technical Details

The icons are referenced in:
- `/index.html` - Apple touch icon links
- `/public/manifest.json` - PWA manifest icons array

Both files already have the correct configuration, but the actual PNG files need to be present for iOS to use them.

## Need Help?

If you see a warning banner in the app about "iOS Icons Missing", click the "Generate Icons" button to open the generator automatically.
