import { Hono } from 'npm:hono@4';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2';

const landing = new Hono();

// Initialize Supabase client for storage operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SCREENSHOT_BUCKET = 'make-6d579fee-landing-screenshots';

// Initialize storage bucket
async function initializeStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === SCREENSHOT_BUCKET);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(SCREENSHOT_BUCKET, {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      });
      console.log('Landing screenshots bucket created successfully');
    }
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
  }
}

// Initialize on startup
initializeStorageBucket();

// Default landing page content
const defaultContent = {
  hero: {
    badge: 'Where Faith Meets Love',
    title: 'Grow Together',
    subtitle: 'In Faith & Love',
    description: 'TwoBeOne helps Christian couples strengthen their relationship through daily devotionals, shared prayers, and meaningful conversations rooted in Scripture.',
    scripture: {
      text: '"Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh."',
      reference: '— Genesis 2:24'
    },
    socialProof: {
      couplesCount: '10,000+',
      rating: 5
    }
  },
  screenshot: {
    greeting: 'Good Morning! ☀️',
    coupleNames: 'Sarah & Mike',
    streakDays: '45',
    devotional: {
      badge: "Today's Devotional",
      title: 'Love is Patient',
      verse: '"Love is patient and kind; love does not envy or boast..."'
    },
    stats: {
      devotionals: '45',
      prayers: '23',
      questions: '18'
    },
    prayerRequest: {
      title: 'New Prayer Request',
      text: 'Mike needs prayer for work project'
    }
  },
  features: [
    {
      title: 'Daily Devotionals',
      description: 'Scripture-based devotions written specifically for couples to strengthen your spiritual foundation together.',
      icon: 'BookOpen',
      color: 'from-warning-500 to-warning-500'
    },
    {
      title: 'Shared Journaling',
      description: 'Express your hearts, reflect on your journey, and share intimate thoughts in a private, secure space.',
      icon: 'MessageSquare',
      color: 'from-sky-500 to-sky-500'
    },
    {
      title: 'Prayer Together',
      description: 'Create prayer requests, pray for each other daily, and celebrate when God answers. Build faith together.',
      icon: 'Heart',
      color: 'from-primary-500 to-primary-500'
    },
    {
      title: '100+ Meaningful Questions',
      description: 'Deep, faith-based conversation starters across 12 categories to help you truly know each other.',
      icon: 'Users',
      color: 'from-primary-500 to-sky-500'
    },
    {
      title: 'Learning Modules',
      description: 'Biblical guidance on communication, conflict resolution, intimacy, and spiritual growth.',
      icon: 'Sparkles',
      color: 'from-success-500 to-success-500'
    },
    {
      title: 'Progress Tracking',
      description: 'Track devotional streaks, milestones, and spiritual growth. Celebrate your journey together!',
      icon: 'TrendingUp',
      color: 'from-primary-500 to-primary-500'
    }
  ],
  whySection: {
    badge: 'Why TwoBeOne?',
    title: 'More Than Just an App',
    description: 'We built TwoBeOne because we believe that when Christ is at the center of a relationship, that relationship becomes unbreakable. But staying connected spiritually requires intentionality.',
    reasons: [
      {
        icon: 'Shield',
        title: 'Private & Secure',
        description: 'Bank-level encryption. Your data stays between you and your partner.'
      },
      {
        icon: 'Zap',
        title: 'Real-Time Sync',
        description: 'Instant synchronization across all devices. Stay connected anywhere.'
      },
      {
        icon: 'Globe',
        title: 'Works Everywhere',
        description: 'Web, iOS, and Android. Access from any device, anytime.'
      }
    ]
  },
  stats: [
    { label: 'Active Couples', value: '10k+', gradient: 'from-primary-50 to-primary-50' },
    { label: 'Devotionals Read', value: '500k+', gradient: 'from-primary-50 to-sky-50' },
    { label: 'Prayers Shared', value: '250k+', gradient: 'from-warning-50 to-warning-50' },
    { label: 'Average Rating', value: '4.9★', gradient: 'from-success-50 to-success-50' }
  ],
  testimonials: [
    {
      name: 'Sarah & Mike',
      location: 'Austin, TX',
      image: '💑',
      quote: 'TwoBeOne transformed our marriage! We pray together daily now and our conversations have never been deeper. This app brought us closer to God and each other.',
      rating: 5,
      married: '3 years'
    },
    {
      name: 'Emily & David',
      location: 'Nashville, TN',
      image: '👫',
      quote: 'As a newly engaged couple, TwoBeOne is helping us build a Christ-centered foundation before we say "I do." The questions sparked conversations we never would have had!',
      rating: 5,
      married: 'Engaged'
    },
    {
      name: 'Rachel & Jonathan',
      location: 'Colorado Springs, CO',
      image: '💏',
      quote: 'After 10 years of marriage, we thought we knew everything about each other. TwoBeOne proved us wrong in the best way possible. We\'re falling in love all over again!',
      rating: 5,
      married: '10 years'
    }
  ],
  faqs: [
    {
      question: 'Is TwoBeOne free?',
      answer: 'Yes! TwoBeOne is completely free to download and use. We believe every couple deserves access to faith-based relationship tools.'
    },
    {
      question: 'Do we both need to download the app?',
      answer: 'Yes, both partners need the app. You\'ll connect via a unique invite code, and all your shared content will sync automatically between your devices.'
    },
    {
      question: 'Is our data private and secure?',
      answer: 'Absolutely! We use bank-level encryption, and your data is only shared between you and your partner. We never sell your information or use it for advertising.'
    },
    {
      question: 'What makes TwoBeOne different from other relationship apps?',
      answer: 'TwoBeOne is specifically designed for Christian couples with faith at the center. Every feature is rooted in biblical principles, and our content is written with a Christ-centered perspective.'
    },
    {
      question: 'Can we use it if we\'re not married yet?',
      answer: 'Absolutely! TwoBeOne is perfect for engaged couples, dating couples, newlyweds, and married couples of any duration. If you\'re in a committed Christian relationship, this is for you!'
    },
    {
      question: 'How much time does it take daily?',
      answer: 'As little or as much as you want! A daily devotional takes 5-10 minutes. Questions and journaling are flexible. The key is consistency, not perfection.'
    }
  ],
  cta: {
    title: 'Ready to Grow Together?',
    description: 'Join thousands of Christian couples who are building stronger, faith-centered relationships with TwoBeOne.',
    newsletterLabel: 'Get notified about updates and tips',
    buttonText: 'Get Started Free',
    footer: '✨ Free forever. No credit card required. ✨'
  }
};

// Get landing page content
landing.get('/content', async (c) => {
  try {
    const content = await kv.get('landing_page:content');
    
    if (!content) {
      // If no custom content exists, return default content
      return c.json({ content: defaultContent }, 200);
    }
    
    return c.json({ content }, 200);
  } catch (error: any) {
    console.error('[Landing] Get content error:', error);
    return c.json({ error: 'Failed to get landing page content' }, 500);
  }
});

// Update landing page content (admin only)
landing.put('/content', async (c) => {
  try {
    const content = await c.req.json();
    
    // Validate content structure
    if (!content.hero || !content.features || !content.testimonials || !content.faqs) {
      return c.json({ error: 'Invalid content structure' }, 400);
    }
    
    // Store updated content
    await kv.set('landing_page:content', {
      ...content,
      updatedAt: new Date().toISOString()
    });
    
    console.log('[Landing] Content updated successfully');
    
    return c.json({ 
      message: 'Landing page content updated successfully',
      content 
    }, 200);
  } catch (error: any) {
    console.error('[Landing] Update content error:', error);
    return c.json({ error: 'Failed to update landing page content' }, 500);
  }
});

// Reset to default content (admin only)
landing.post('/content/reset', async (c) => {
  try {
    await kv.set('landing_page:content', {
      ...defaultContent,
      updatedAt: new Date().toISOString()
    });
    
    console.log('[Landing] Content reset to default');
    
    return c.json({ 
      message: 'Landing page content reset to default',
      content: defaultContent 
    }, 200);
  } catch (error: any) {
    console.error('[Landing] Reset content error:', error);
    return c.json({ error: 'Failed to reset landing page content' }, 500);
  }
});

// Get newsletter subscribers count
landing.get('/stats', async (c) => {
  try {
    const subscribers = await kv.getByPrefix('newsletter:');
    
    return c.json({ 
      subscribersCount: subscribers.length,
      lastUpdated: new Date().toISOString()
    }, 200);
  } catch (error: any) {
    console.error('[Landing] Get stats error:', error);
    return c.json({ error: 'Failed to get landing page stats' }, 500);
  }
});

// Upload screenshot
landing.post('/screenshots/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'hero' or other screenshot types
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${type || 'screenshot'}-${timestamp}.${extension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[Landing] Upload error:', uploadError);
      return c.json({ error: 'Failed to upload screenshot' }, 500);
    }

    // Create signed URL (expires in 10 years for semi-permanent storage)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .createSignedUrl(filename, 315360000); // 10 years in seconds

    if (urlError) {
      console.error('[Landing] Signed URL error:', urlError);
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    // Store screenshot metadata
    const screenshots = await kv.get('landing_page:screenshots') || [];
    const screenshotData = {
      id: `screenshot_${timestamp}`,
      filename,
      url: urlData.signedUrl,
      type: type || 'general',
      uploadedAt: new Date().toISOString(),
      size: file.size,
      contentType: file.type
    };

    screenshots.push(screenshotData);
    await kv.set('landing_page:screenshots', screenshots);

    console.log('[Landing] Screenshot uploaded successfully:', filename);

    return c.json({ 
      message: 'Screenshot uploaded successfully',
      screenshot: screenshotData
    }, 200);
  } catch (error: any) {
    console.error('[Landing] Upload screenshot error:', error);
    return c.json({ error: 'Failed to upload screenshot' }, 500);
  }
});

// Get all screenshots
landing.get('/screenshots', async (c) => {
  try {
    const screenshots = await kv.get('landing_page:screenshots') || [];
    
    // Refresh expired signed URLs if needed
    const updatedScreenshots = [];
    for (const screenshot of screenshots) {
      try {
        // Check if URL is still valid by creating a new signed URL
        const { data: urlData, error: urlError } = await supabase.storage
          .from(SCREENSHOT_BUCKET)
          .createSignedUrl(screenshot.filename, 315360000);

        if (!urlError && urlData) {
          updatedScreenshots.push({
            ...screenshot,
            url: urlData.signedUrl
          });
        }
      } catch (err) {
        console.error('[Landing] Error refreshing URL for screenshot:', screenshot.id, err);
      }
    }

    // Save updated URLs
    if (updatedScreenshots.length > 0) {
      await kv.set('landing_page:screenshots', updatedScreenshots);
    }

    return c.json({ screenshots: updatedScreenshots }, 200);
  } catch (error: any) {
    console.error('[Landing] Get screenshots error:', error);
    return c.json({ error: 'Failed to get screenshots' }, 500);
  }
});

// Delete screenshot
landing.delete('/screenshots/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const screenshots = await kv.get('landing_page:screenshots') || [];
    
    const screenshot = screenshots.find((s: any) => s.id === id);
    if (!screenshot) {
      return c.json({ error: 'Screenshot not found' }, 404);
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .remove([screenshot.filename]);

    if (deleteError) {
      console.error('[Landing] Delete storage error:', deleteError);
    }

    // Remove from metadata
    const updatedScreenshots = screenshots.filter((s: any) => s.id !== id);
    await kv.set('landing_page:screenshots', updatedScreenshots);

    console.log('[Landing] Screenshot deleted successfully:', id);

    return c.json({ 
      message: 'Screenshot deleted successfully'
    }, 200);
  } catch (error: any) {
    console.error('[Landing] Delete screenshot error:', error);
    return c.json({ error: 'Failed to delete screenshot' }, 500);
  }
});

export default landing;