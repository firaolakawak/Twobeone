import { useEffect } from 'react';

/**
 * SEOHead — injects all SEO, OG, Twitter, and JSON-LD structured-data tags
 * into document.head at runtime for the TwoBeOne SPA.
 *
 * Mounted once at the App root. All strings use only CSS custom properties
 * for any rendered UI; this component has no visible DOM output.
 */
export function SEOHead() {
  useEffect(() => {
    // ── Helpers ────────────────────────────────────────────────────────────
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta') as HTMLMetaElement;
        const [attrName, attrValue] = selector.replace('[', '').replace(']', '').split('=');
        el.setAttribute(attrName.trim(), attrValue.replace(/"/g, '').trim());
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
      const existing = document.head.querySelector(`link[rel="${rel}"][href="${href}"]`);
      if (existing) return;
      const el = document.createElement('link');
      el.rel = rel;
      el.href = href;
      if (extra) Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    };

    const injectJsonLd = (id: string, data: object) => {
      const existing = document.getElementById(id);
      if (existing) { existing.textContent = JSON.stringify(data); return; }
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    // ── Title & basic meta ─────────────────────────────────────────────────
    document.title = 'TwoBeOne — Christian Couples App | Daily Devotionals, Prayer & Journal';

    setMeta('meta[name="description"]', 'content',
      'TwoBeOne is a free Christian couples app for daily devotionals, shared prayer, journaling, and 1,000+ faith-based conversation questions. Supports English, Amharic, and Afan Oromo.');
    setMeta('meta[name="keywords"]', 'content',
      'Christian couples app, marriage devotional app, couples prayer, faith relationship app, pre-marriage guidance, couples Bible study, Amharic couples app, Ethiopia Christian app, Oromiffa couples app');
    setMeta('meta[name="author"]', 'content', 'TwoBeOne');
    setMeta('meta[name="robots"]', 'content',
      'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // Canonical
    setLink('canonical', 'https://www.twobeone.app/');

    // ── Open Graph ─────────────────────────────────────────────────────────
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:url"]', 'content', 'https://www.twobeone.app/');
    setMeta('meta[property="og:site_name"]', 'content', 'TwoBeOne');
    setMeta('meta[property="og:title"]', 'content', 'TwoBeOne — Christian Couples App');
    setMeta('meta[property="og:description"]', 'content',
      'Free app for Christian couples — daily devotionals, shared prayer, journaling, and 1,000+ faith-based conversation questions. Supports English, Amharic & Afan Oromo.');
    // Fix: use PNG not SVG — Facebook/WhatsApp do not render SVGs
    setMeta('meta[property="og:image"]', 'content', 'https://www.twobeone.app/og-image.png');
    setMeta('meta[property="og:image:width"]', 'content', '1200');
    setMeta('meta[property="og:image:height"]', 'content', '630');
    setMeta('meta[property="og:image:alt"]', 'content', 'TwoBeOne — Grow Together in Faith');
    setMeta('meta[property="og:locale"]', 'content', 'en_US');

    // ── Twitter / X Card ──────────────────────────────────────────────────
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[property="twitter:url"]', 'content', 'https://www.twobeone.app/');
    setMeta('meta[property="twitter:title"]', 'content', 'TwoBeOne — Christian Couples App');
    setMeta('meta[property="twitter:description"]', 'content',
      'Free app for Christian couples — daily devotionals, shared prayer, journaling, and faith-based conversation questions.');
    setMeta('meta[property="twitter:image"]', 'content', 'https://www.twobeone.app/og-image.png');
    setMeta('meta[property="twitter:image:alt"]', 'content', 'TwoBeOne — Grow Together in Faith');

    // ── Structured Data: WebApplication ────────────────────────────────────
    injectJsonLd('jsonld-webapp', {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'TwoBeOne',
      alternateName: ['TwoBeOne Couples App', '2B1'],
      description: 'A free faith-based app helping Christian couples grow together through daily devotionals, shared prayer, journaling, and meaningful faith-based conversations.',
      url: 'https://www.twobeone.app',
      applicationCategory: 'LifestyleApplication',
      applicationSubCategory: 'Religion & Spirituality',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      featureList: [
        'Daily Biblical Devotionals for Couples',
        'Shared Prayer Board with answered prayer tracking',
        'Couples Journal — private and shared entries',
        '1000+ Faith-based Conversation Questions across 11 categories',
        'Devotional Streak Tracking',
        'Pre-Marriage Biblical Guidance Modules',
        'AI-powered Compatibility Analysis using Google Gemini',
        'Mood Tracking and Weekly Emotional Reports',
        'Relationship Milestones Timeline',
        'Scripture Memory Practice',
        'Community Groups for Christian Couples',
        'Multilingual: English, Amharic, Afan Oromo',
      ],
      audience: { '@type': 'Audience', audienceType: 'Christian Couples' },
      inLanguage: ['en', 'am', 'om'],
      creator: { '@type': 'Organization', name: 'TwoBeOne', url: 'https://www.twobeone.app' },
      screenshot: 'https://www.twobeone.app/og-image.png',
    });

    // ── Structured Data: FAQPage (GEO — AI engines cite FAQ answers) ───────
    injectJsonLd('jsonld-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is TwoBeOne?',
          acceptedAnswer: { '@type': 'Answer', text: 'TwoBeOne is a free Christian couples app that helps partners grow together spiritually through daily Bible-based devotionals, a shared prayer board, couples journaling, and over 1,000 faith-based conversation questions across 11 categories.' },
        },
        {
          '@type': 'Question',
          name: 'Is TwoBeOne free?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes. TwoBeOne is completely free with no subscription required. Both partners download the app and connect via a unique invite code.' },
        },
        {
          '@type': 'Question',
          name: 'What languages does TwoBeOne support?',
          acceptedAnswer: { '@type': 'Answer', text: 'TwoBeOne supports English, Amharic (አማርኛ), and Afan Oromo (Oromiffa), making it one of the few Christian couples apps with Ethiopian language support.' },
        },
        {
          '@type': 'Question',
          name: 'Can engaged or dating couples use TwoBeOne?',
          acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. TwoBeOne is designed for Christian couples at any stage — dating, engaged, newlywed, or married. The pre-marriage guidance modules are especially valuable for engaged couples.' },
        },
        {
          '@type': 'Question',
          name: 'How does the AI compatibility analysis work in TwoBeOne?',
          acceptedAnswer: { '@type': 'Answer', text: 'When both partners answer the same conversation question, TwoBeOne uses Google Gemini AI to semantically analyse both answers and generate a compatibility score, identify shared strengths, suggest growth areas, and provide a personalised weekly action recommendation. Results are saved permanently so they are consistent across sessions.' },
        },
        {
          '@type': 'Question',
          name: 'Is TwoBeOne data private?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes. Data is private and shared only between you and your partner. TwoBeOne never sells personal data or uses it for advertising.' },
        },
      ],
    });

    // ── Structured Data: Organization ──────────────────────────────────────
    injectJsonLd('jsonld-org', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TwoBeOne',
      url: 'https://www.twobeone.app',
      logo: 'https://www.twobeone.app/icons/icon-512x512.png',
      description: 'Creators of TwoBeOne — the free Christian couples app for daily devotionals, prayer, journaling, and meaningful faith conversations.',
      knowsAbout: ['Christian marriage', 'couples devotionals', 'faith-based relationships', 'pre-marriage preparation', 'Ethiopian Christian community'],
    });
  }, []);

  // No visible output — this component only injects into document.head
  return null;
}
