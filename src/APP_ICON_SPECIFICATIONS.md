# TwoBeOne - App Icon Design Specifications

**Version:** 1.0  
**Last Updated:** November 16, 2025  
**Designer:** TwoBeOne Design Team

---

## 🎨 Icon Concept

**Core Concept:** Two hearts merging into one, symbolizing unity in Christ  
**Design Philosophy:** Modern, minimalist, faith-centered, and instantly recognizable  
**Visual Metaphor:** Two becoming one (Genesis 2:24) with divine light/presence

---

## 📐 Primary Design Version

### Design A: "United Hearts with Cross"

**Visual Elements:**
1. **Two Hearts:** Overlapping hearts forming a single unified shape
2. **Cross Element:** Subtle cross formed at the intersection point
3. **Divine Light:** Radial rays emanating from the center
4. **Gradient Flow:** Smooth gradient from rose to purple, representing love and spirituality

**Symbol Meaning:**
- Left Heart: One partner
- Right Heart: Other partner
- Intersection: Unity in marriage
- Cross: Christ at the center
- Light Rays: God's blessing and presence

---

## 🎨 Exact Color Specifications

### Primary Colors

**Rose/Pink (Partner 1)**
- **Hex:** `#f43f5e`
- **RGB:** `244, 63, 94`
- **HSL:** `350, 89%, 60%`
- **CMYK:** `0, 74, 61, 4`
- **Pantone:** 1925 C (closest match)
- **Usage:** Left heart, primary brand color

**Purple (Partner 2)**
- **Hex:** `#a855f7`
- **RGB:** `168, 85, 247`
- **HSL:** `271, 91%, 65%`
- **CMYK:** `32, 66, 0, 3`
- **Pantone:** 2665 C (closest match)
- **Usage:** Right heart, secondary brand color

**Indigo (Unity)**
- **Hex:** `#6366f1`
- **RGB:** `99, 102, 241`
- **HSL:** `239, 84%, 67%`
- **CMYK:** `59, 58, 0, 5`
- **Pantone:** 2726 C (closest match)
- **Usage:** Intersection, merged area

### Accent Colors

**Gold/Yellow (Divine Light)**
- **Hex:** `#fbbf24`
- **RGB:** `251, 191, 36`
- **HSL:** `43, 96%, 56%`
- **CMYK:** `0, 24, 86, 2`
- **Pantone:** 1235 C (closest match)
- **Usage:** Light rays, highlights, divine presence

**White (Purity)**
- **Hex:** `#ffffff`
- **RGB:** `255, 255, 255`
- **HSL:** `0, 0%, 100%`
- **CMYK:** `0, 0, 0, 0`
- **Usage:** Cross element, highlights, inner glow

### Gradient Specifications

**Primary Gradient (Left to Right)**
```css
background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%);
```

**Radial Gradient (Center Light)**
```css
background: radial-gradient(circle at center, #fbbf24 0%, rgba(251, 191, 36, 0) 70%);
```

**Overlay Gradient (Depth)**
```css
background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%);
```

---

## 📏 Size Requirements

### iOS Sizes

| Size (px) | Usage | Filename |
|-----------|-------|----------|
| 1024 × 1024 | App Store | icon-1024.png |
| 180 × 180 | iPhone (60pt @3x) | icon-180.png |
| 120 × 120 | iPhone (60pt @2x) | icon-120.png |
| 167 × 167 | iPad Pro (83.5pt @2x) | icon-167.png |
| 152 × 152 | iPad (76pt @2x) | icon-152.png |
| 120 × 120 | iPad (60pt @2x) | icon-120-ipad.png |
| 87 × 87 | iPhone (29pt @3x) Settings | icon-87.png |
| 80 × 80 | iPad (40pt @2x) Spotlight | icon-80.png |
| 76 × 76 | iPad (76pt @1x) | icon-76.png |
| 58 × 58 | iPhone (29pt @2x) Settings | icon-58.png |
| 40 × 40 | iPad (20pt @2x) Notifications | icon-40.png |
| 29 × 29 | iPad (29pt @1x) Settings | icon-29.png |
| 20 × 20 | iPad (20pt @1x) Notifications | icon-20.png |

### Android Sizes

| Size (px) | Density | Folder | Filename |
|-----------|---------|--------|----------|
| 192 × 192 | xxxhdpi | mipmap-xxxhdpi | ic_launcher.png |
| 144 × 144 | xxhdpi | mipmap-xxhdpi | ic_launcher.png |
| 96 × 96 | xhdpi | mipmap-xhdpi | ic_launcher.png |
| 72 × 72 | hdpi | mipmap-hdpi | ic_launcher.png |
| 48 × 48 | mdpi | mipmap-mdpi | ic_launcher.png |
| 512 × 512 | Play Store | - | play-store-icon.png |

### Web/PWA Sizes

| Size (px) | Usage | Filename |
|-----------|-------|----------|
| 512 × 512 | Splash screen | icon-512.png |
| 192 × 192 | Homescreen | icon-192.png |
| 180 × 180 | iOS Safari | apple-touch-icon.png |
| 32 × 32 | Favicon | favicon-32.png |
| 16 × 16 | Favicon | favicon-16.png |
| *.ico | Multi-size favicon | favicon.ico |

---

## 🎯 Design Guidelines

### Spacing & Margins

**Safe Area:**
- 10% margin from all edges
- Critical elements must stay within safe area
- On 1024px icon: 102px margin on all sides

**Icon Content Area:**
- 80% of total icon size
- On 1024px icon: Content fits within 820 × 820px center

**Optical Adjustments:**
- Heart shapes may extend slightly beyond mathematical center for visual balance
- Light rays can extend to edges for impact

### Shape & Geometry

**Heart Shapes:**
- Base: 400px wide × 360px tall (on 1024px canvas)
- Overlap: 25% of width at center
- Rounded corners: 20px radius
- Symmetrical design

**Cross Element:**
- Width: 60px
- Height: 80px
- Position: Centered at heart intersection
- Style: Solid or outlined depending on background contrast

**Light Rays:**
- Count: 8 rays (octagonal pattern)
- Length: From center to 90% of icon radius
- Width: 40px at base, tapering to 10px at tip
- Opacity: 30-50% for subtlety

### Shadow & Depth

**Outer Glow (Optional for depth):**
```css
box-shadow: 
  0 20px 60px rgba(168, 85, 247, 0.4),
  0 10px 30px rgba(244, 63, 94, 0.3);
```

**Inner Shadow (Depth):**
```css
box-shadow: inset 0 -4px 8px rgba(0, 0, 0, 0.1);
```

**Highlight:**
```css
box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.5);
```

### Typography (if text is included)

**Not Recommended:** Text should be avoided in icon for scalability  
**If Absolutely Necessary:**
- Font: Poppins Bold or similar modern sans-serif
- Size: Maximum 180px (on 1024px canvas)
- Color: White with subtle shadow
- Position: Bottom third of icon
- Text: "2in1" or "Two"

---

## 🎨 Alternative Design Versions

### Design B: "Infinity Hearts"

**Concept:** Two hearts forming an infinity symbol (∞)  
**Colors:** Same gradient (rose to purple)  
**Symbolism:** Eternal love, endless commitment  
**Cross Placement:** Center of infinity loop

**Color Application:**
- Left loop: `#f43f5e` (Rose)
- Right loop: `#a855f7` (Purple)
- Center cross: `#fbbf24` (Gold)

---

### Design C: "Shield of Love"

**Concept:** Shield shape with two hearts inside  
**Colors:** Purple shield with gradient hearts  
**Symbolism:** Protection, strength, divine armor  
**Scripture Reference:** Ephesians 6:16 (shield of faith)

**Color Application:**
- Shield outline: `#6366f1` (Indigo)
- Left heart: `#f43f5e` (Rose)
- Right heart: `#a855f7` (Purple)
- Center cross: `#fbbf24` (Gold)

---

### Design D: "Minimalist Cross-Heart"

**Concept:** Heart shape with cross integrated into design  
**Colors:** Single gradient heart with white cross  
**Symbolism:** Christ-centered love, simplicity  
**Style:** Modern, clean, highly recognizable

**Color Application:**
- Heart gradient: `#f43f5e` to `#a855f7` (Rose to Purple)
- Cross: `#ffffff` (White)
- Glow: `#fbbf24` (Gold) at 20% opacity

---

## 🖼️ Background Variations

### Light Background
- Use full color version
- Slight shadow for depth
- High contrast ensured

### Dark Background
- Add subtle white outline (2px)
- Increase glow effect
- Maintain color vibrancy

### Adaptive Icon (Android)

**Foreground Layer:**
- Hearts and cross
- Transparent background
- Safe area: 108 × 108dp, display: 72 × 72dp

**Background Layer:**
- Solid gradient: `#f43f5e` to `#a855f7`
- Or solid `#6366f1` (Indigo)
- Covers full 108 × 108dp

---

## 🎭 Logo Variations

### App Icon (Square)
- Aspect Ratio: 1:1
- Rounded corners: 22.37% (iOS standard)
- All elements centered

### Horizontal Logo
- Aspect Ratio: 3:1 or 4:1
- Icon on left, "TwoBeOne" text on right
- Text color: `#1f2937` (dark gray) or `#ffffff` (white)

### Vertical Logo
- Aspect Ratio: 1:2
- Icon on top, "TwoBeOne" text below
- Stacked for app store screenshots

### Wordmark Only
- Font: Poppins Bold or Montserrat Bold
- Gradient text: `#f43f5e` to `#a855f7`
- Alternative: Solid `#6366f1` (Indigo)

---

## 📱 Icon Mockups & Testing

### Visual Testing
Test icon at various sizes:
- ✅ 16×16px (Must be recognizable)
- ✅ 32×32px (Must show key elements)
- ✅ 64×64px (Full detail visible)
- ✅ 512×512px (Perfect clarity)
- ✅ 1024×1024px (Master version)

### Context Testing
View icon in context:
- On white background
- On black background
- On colorful wallpapers
- Next to competitor apps
- In app store search results
- On device home screen

### Accessibility
- Color blind friendly (test with simulators)
- High contrast for visibility
- Distinct shape recognizable in grayscale
- No small text (if possible)

---

## 💾 File Format Specifications

### Master Files
- **Adobe Illustrator:** .ai (vector, CMYK and RGB versions)
- **SVG:** Scalable Vector Graphics (web-optimized)
- **PDF:** High-resolution print version

### Export Files
- **PNG-24:** Transparent background, 32-bit color
- **PNG-8:** Optimized for smaller file sizes
- **JPEG:** For web previews only (not for app submission)
- **ICO:** Multi-resolution favicon (16, 32, 48px)

### Naming Convention
```
twobeone-icon-[size]-[variant]-[version].png

Examples:
twobeone-icon-1024-primary-v1.png
twobeone-icon-512-light-bg-v1.png
twobeone-icon-180-ios-v1.png
```

---

## 🎨 Color Psychology

**Rose/Pink (#f43f5e):**
- Represents: Love, romance, compassion, warmth
- Emotional Response: Caring, nurturing, affection
- Biblical: God's love (agape)

**Purple (#a855f7):**
- Represents: Spirituality, royalty, wisdom, faith
- Emotional Response: Inspiration, mystery, devotion
- Biblical: Royalty of Christ, divine authority

**Gold/Yellow (#fbbf24):**
- Represents: Divine light, joy, glory, hope
- Emotional Response: Optimism, happiness, enlightenment
- Biblical: God's glory, heavenly light

**Indigo (#6366f1):**
- Represents: Unity, trust, stability, peace
- Emotional Response: Calm, confidence, depth
- Biblical: Peace of God, heavenly realm

---

## 📋 Design Checklist

### Pre-Production
- [ ] Concept approved by stakeholders
- [ ] Color palette finalized
- [ ] Vector files created
- [ ] All size variants prepared
- [ ] Accessibility tested

### Production
- [ ] iOS sizes exported (all required sizes)
- [ ] Android sizes exported (all densities)
- [ ] Web/PWA sizes exported
- [ ] File naming convention followed
- [ ] Compression optimized (< 1MB per file)

### Quality Assurance
- [ ] Tested on iOS devices
- [ ] Tested on Android devices
- [ ] Tested in app stores
- [ ] Tested with various backgrounds
- [ ] Color blind simulation passed
- [ ] Grayscale version recognizable

### Delivery
- [ ] All files organized in folders
- [ ] Documentation included
- [ ] Brand guidelines provided
- [ ] Backup files stored
- [ ] Version control implemented

---

## 🚀 Implementation Guide

### iOS (Xcode)
1. Open Xcode project
2. Navigate to Assets.xcassets
3. Select AppIcon
4. Drag and drop each size to corresponding slot
5. Verify all sizes are present
6. Build and test on device

### Android (Android Studio)
1. Open Android Studio project
2. Navigate to res/mipmap folders
3. Place icons in appropriate density folders
4. Update AndroidManifest.xml if needed
5. Build and test on device/emulator

### Web/PWA (manifest.json)
```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 📞 Design Resources

**Icon Generation Tools:**
- https://appicon.co (iOS & Android generator)
- https://realfavicongenerator.net (Favicon generator)
- https://www.canva.com (Simple design tool)
- Figma (Professional design tool)
- Adobe Illustrator (Vector graphics)

**Testing Tools:**
- https://colorblindcheck.com (Accessibility)
- iOS Simulator (Xcode)
- Android Emulator (Android Studio)

**Color Tools:**
- https://coolors.co (Palette generator)
- https://www.colorhexa.com (Color information)
- Adobe Color (Harmony testing)

---

## 📄 License & Usage

**Copyright:** © 2025 TwoBeOne. All rights reserved.  
**Usage:** This icon is proprietary to TwoBeOne and may not be used without explicit permission.  
**Modifications:** Only authorized designers may modify the icon.  
**Distribution:** Icon files are for TwoBeOne app use only.

---

## 📞 Contact

For icon design questions or modifications:
- **Email:** design@twobeone.live
- **Design Team:** creative@twobeone.live

---

**May this icon represent the beauty of unity in Christ! 💕✝️**

---

*App Icon Specifications v1.0 - Last Updated: November 16, 2025*
