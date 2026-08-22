# 🚀 TwoBeOne Deployment Guide

Complete guide to deploy your TwoBeOne PWA to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Created all app icons (8 sizes) in `/public/icons/`
- [ ] Tested service worker locally
- [ ] Supabase project configured
- [ ] Environment variables ready
- [ ] Build passes without errors

---

## 🌐 Deployment Options

### **Option 1: Vercel (Recommended)** ⭐

**Why Vercel?**
- ✅ Free tier generous enough
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Instant deployments
- ✅ Perfect for React apps

**Steps:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
# From your project root
vercel

# For production deployment
vercel --prod
```

4. **Set Environment Variables:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other environment variables
```

5. **Custom Domain (Optional):**
```bash
vercel domains add twobeone.app
# Follow DNS instructions
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/service-worker.js", "destination": "/public/service-worker.js" },
    { "source": "/manifest.json", "destination": "/public/manifest.json" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

---

### **Option 2: Netlify**

**Why Netlify?**
- ✅ Free tier with generous limits
- ✅ Drag-and-drop deployment
- ✅ Automatic HTTPS
- ✅ Form handling built-in
- ✅ Great for static sites

**Steps:**

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Build Your App:**
```bash
npm run build
```

3. **Deploy:**
```bash
netlify deploy --prod
```

**Or use the UI:**
1. Go to netlify.com
2. Drag your `dist` folder
3. Done!

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

---

### **Option 3: Firebase Hosting**

**Why Firebase?**
- ✅ Google infrastructure
- ✅ Free tier available
- ✅ Great for PWAs
- ✅ Easy integration with other Firebase services

**Steps:**

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login:**
```bash
firebase login
```

3. **Initialize:**
```bash
firebase init hosting
```

4. **Configure** (`firebase.json`):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

5. **Deploy:**
```bash
firebase deploy
```

---

### **Option 4: GitHub Pages**

**Why GitHub Pages?**
- ✅ Completely free
- ✅ Automatic from GitHub repo
- ✅ HTTPS enabled
- ✅ Simple for static sites

**Steps:**

1. **Add to `package.json`:**
```json
{
  "homepage": "https://yourusername.github.io/twobeone",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

2. **Install gh-pages:**
```bash
npm install --save-dev gh-pages
```

3. **Deploy:**
```bash
npm run deploy
```

4. **Enable in GitHub:**
- Go to repo Settings
- Scroll to GitHub Pages
- Select `gh-pages` branch
- Save

---

## 🔐 Environment Variables

**Required Variables:**
```env
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

**How to Add in Vercel:**
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
```

**How to Add in Netlify:**
1. Go to Site Settings
2. Build & Deploy > Environment
3. Add variables
4. Redeploy

**How to Add in Firebase:**
```bash
firebase functions:config:set supabase.url="your-url"
firebase functions:config:set supabase.anon="your-key"
```

---

## 🎨 Custom Domain Setup

### **Vercel Custom Domain:**
```bash
# Add domain
vercel domains add twobeone.app

# Add DNS records (from your domain registrar):
# Type: A, Name: @, Value: 76.76.21.21
# Type: CNAME, Name: www, Value: cname.vercel-dns.com
```

### **Netlify Custom Domain:**
1. Go to Domain Settings
2. Add custom domain
3. Update DNS:
   - Type: A, Value: 75.2.60.5
   - Type: CNAME, Name: www, Value: your-site.netlify.app

### **Firebase Custom Domain:**
```bash
firebase hosting:channel:deploy production --domain twobeone.app
```

---

## 🔍 SEO Setup

**Update `manifest.json` with your domain:**
```json
{
  "start_url": "https://twobeone.app/",
  "scope": "https://twobeone.app/"
}
```

**Update `sitemap.xml` with your domain:**
```xml
<loc>https://twobeone.app/</loc>
```

**Submit to Search Engines:**
1. Google Search Console: https://search.google.com/search-console
2. Bing Webmaster Tools: https://www.bing.com/webmasters
3. Submit sitemap: `https://twobeone.app/sitemap.xml`

---

## 📊 Analytics Setup

### **Google Analytics (GA4):**

1. Create GA4 property at analytics.google.com
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to your app:

```typescript
// Add to /utils/analytics.ts
export function initAnalytics() {
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
}

// Track PWA install
export function trackPWAInstall() {
  if (window.gtag) {
    window.gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA Installed'
    });
  }
}
```

4. Call in App.tsx:
```typescript
import { initAnalytics, trackPWAInstall } from './utils/analytics';

useEffect(() => {
  initAnalytics();
}, []);

// In PWA install handler:
window.addEventListener('appinstalled', () => {
  trackPWAInstall();
});
```

---

## 🧪 Testing Production Build

### **Test Locally:**
```bash
# Build
npm run build

# Preview build
npm run preview

# Visit http://localhost:4173
```

### **Test PWA Features:**
1. Open Chrome DevTools
2. Application > Manifest - Check all icons
3. Application > Service Workers - Verify registration
4. Lighthouse > Run PWA audit
5. Test offline mode
6. Test install banner

### **Test on Real Devices:**
1. Deploy to staging URL
2. Test on Android phone
3. Test on iPhone
4. Test on Desktop
5. Verify all features work

---

## 🚨 Troubleshooting Deployment

### **Service Worker Not Working?**
✅ Solutions:
- Ensure `/public/service-worker.js` is accessible
- Check headers allow service worker
- Verify HTTPS is enabled
- Clear cache and hard reload

### **Icons Not Showing?**
✅ Solutions:
- Verify `/public/icons/` folder deployed
- Check file paths in manifest.json
- Ensure correct MIME types
- Clear browser cache

### **Environment Variables Not Working?**
✅ Solutions:
- Check variable names match exactly
- Redeploy after adding variables
- Verify variables in deployment logs
- Check if using correct prefix (VITE_, NEXT_PUBLIC_, etc.)

### **Build Failing?**
✅ Solutions:
- Check Node.js version (use 18+)
- Clear node_modules and reinstall
- Check for TypeScript errors
- Review build logs carefully

---

## 📈 Post-Deployment

### **Monitor Performance:**
1. Set up Vercel Analytics (automatic)
2. Enable Lighthouse CI for continuous monitoring
3. Track PWA install rate
4. Monitor error logs

### **Track Metrics:**
- Page load time
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- PWA install conversions
- Offline usage statistics

### **Continuous Deployment:**

**Vercel:**
- Automatic from GitHub pushes
- Preview deployments for PRs
- Rollback with one click

**Netlify:**
- Auto-deploy from Git
- Deploy previews
- Instant rollbacks

---

## 🎉 Launch Checklist

Before announcing your app:

- [ ] All icons display correctly
- [ ] Service worker registered successfully  
- [ ] Lighthouse PWA score > 90
- [ ] Tested on Android device
- [ ] Tested on iOS device
- [ ] Tested on Desktop browser
- [ ] Offline mode works
- [ ] Install banner appears
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking works
- [ ] Environment variables set
- [ ] Error monitoring enabled
- [ ] SEO meta tags complete
- [ ] Sitemap submitted to search engines

---

## 🆘 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Firebase Docs:** https://firebase.google.com/docs/hosting
- **PWA Docs:** https://web.dev/progressive-web-apps/
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse

---

## 🎊 You're Ready to Launch!

Your TwoBeOne PWA is now:
- ✅ Installable on all platforms
- ✅ Accessible via HTTPS
- ✅ Optimized for performance
- ✅ Ready for users worldwide

**Deploy now and start changing lives! 🙏💑**
