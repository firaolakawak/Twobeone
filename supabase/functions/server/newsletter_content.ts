export interface WeeklyNewsletterEdition {
  weekKey: string;
  subject: string;
  preheader: string;
  title: string;
  scripture: string;
  scriptureReference: string;
  encouragement: string;
  guidance: string;
  weeklyPractice: string;
  appreciation: string;
  appFeature: string;
  appFeatureDescription: string;
  appPath: string;
}

interface NewsletterTheme {
  title: string;
  scripture: string;
  scriptureReference: string;
  encouragement: string;
  guidance: string;
  weeklyPractice: string;
  appFeature: string;
  appFeatureDescription: string;
  appPath: string;
}

const THEMES: NewsletterTheme[] = [
  {
    title: 'Choose kindness in the small moments',
    scripture: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.',
    scriptureReference: 'Ephesians 4:32',
    encouragement: 'Strong relationships are often built in ordinary moments: a patient answer, a thoughtful message, or a willingness to begin again.',
    guidance: 'Notice one place where your partner is carrying extra weight. Ask how you can help before offering advice.',
    weeklyPractice: 'Tell your partner one specific quality you appreciate, then do one practical act of kindness without being asked.',
    appFeature: 'Shared Journal',
    appFeatureDescription: 'Capture gratitude, prayers, and meaningful reflections in your private shared space.',
    appPath: '/?tab=journal',
  },
  {
    title: 'Listen with patience and curiosity',
    scripture: 'Everyone should be quick to listen, slow to speak and slow to become angry.',
    scriptureReference: 'James 1:19',
    encouragement: 'Listening is one of the clearest ways to say, “You matter to me.” You do not need perfect words to offer a safe and attentive presence.',
    guidance: 'When a difficult topic comes up, reflect back what you heard before explaining your own perspective.',
    weeklyPractice: 'Set aside ten uninterrupted minutes. Each person shares for five minutes while the other only listens and asks gentle questions.',
    appFeature: 'Conversation Questions',
    appFeatureDescription: 'Use a thoughtful prompt to discover something new about each other this week.',
    appPath: '/?tab=questions',
  },
  {
    title: 'Make gratitude part of your rhythm',
    scripture: 'Give thanks in all circumstances; for this is God’s will for you in Christ Jesus.',
    scriptureReference: '1 Thessalonians 5:18',
    encouragement: 'Gratitude does not ignore difficulty. It helps you recognize the grace, growth, and companionship already present in your story.',
    guidance: 'Be specific when expressing thanks. Naming the action and its impact helps appreciation feel sincere and memorable.',
    weeklyPractice: 'Share three things you are grateful for: one about God, one about your partner, and one about your life together.',
    appFeature: 'Relationship Timeline',
    appFeatureDescription: 'Record a meaningful milestone and celebrate the story you are building together.',
    appPath: '/?tab=home',
  },
  {
    title: 'Pray together, even when words are few',
    scripture: 'For where two or three gather in my name, there am I with them.',
    scriptureReference: 'Matthew 18:20',
    encouragement: 'A short, honest prayer can bring peace and unity. The goal is not eloquence; it is turning toward God together.',
    guidance: 'Keep shared prayer simple: thank God, name one need, and ask for wisdom for the week ahead.',
    weeklyPractice: 'Pray together for two minutes on three different days this week. Let each person choose one request.',
    appFeature: 'Prayer Board',
    appFeatureDescription: 'Share prayer requests, pray for one another, and celebrate answered prayers.',
    appPath: '/?tab=prayer',
  },
  {
    title: 'Protect time for what matters',
    scripture: 'Teach us to number our days, that we may gain a heart of wisdom.',
    scriptureReference: 'Psalm 90:12',
    encouragement: 'Connection rarely happens by accident in a busy week. A small protected window can remind both of you that your relationship is a priority.',
    guidance: 'Choose consistency over complexity. A regular walk, coffee, or evening check-in can matter more than an elaborate plan.',
    weeklyPractice: 'Schedule one phone-free connection time before the week fills up. Put it on both calendars and protect it.',
    appFeature: 'Daily Devotionals',
    appFeatureDescription: 'Read and reflect together with a short, Christ-centered devotional.',
    appPath: '/?tab=devotions',
  },
  {
    title: 'Practice repair after disagreement',
    scripture: 'Bear with each other and forgive one another if any of you has a grievance against someone.',
    scriptureReference: 'Colossians 3:13',
    encouragement: 'Healthy couples are not conflict-free. They learn to return, take responsibility, forgive, and rebuild trust with humility.',
    guidance: 'A helpful repair begins with your own part: “I was wrong when…” followed by “What did that feel like for you?”',
    weeklyPractice: 'Revisit one small unresolved tension calmly. Listen, own your part, and agree on one next step rather than solving everything at once.',
    appFeature: 'Learning Modules',
    appFeatureDescription: 'Explore biblical tools for communication, conflict resolution, and spiritual growth.',
    appPath: '/?tab=home',
  },
  {
    title: 'Encourage the person your partner is becoming',
    scripture: 'Therefore encourage one another and build each other up, just as in fact you are doing.',
    scriptureReference: '1 Thessalonians 5:11',
    encouragement: 'Your words can become a place of courage. Recognizing growth helps your partner see that their effort and faithfulness are noticed.',
    guidance: 'Praise character and progress, not only outcomes. Mention patience, courage, generosity, or faith you have recently observed.',
    weeklyPractice: 'Write a short note describing one way you have seen your partner grow during the past year.',
    appFeature: 'Milestones and Progress',
    appFeatureDescription: 'Celebrate consistent habits and meaningful steps in your relationship journey.',
    appPath: '/?tab=home',
  },
  {
    title: 'Dream and plan as one team',
    scripture: 'Two are better than one, because they have a good return for their labor.',
    scriptureReference: 'Ecclesiastes 4:9',
    encouragement: 'Shared hopes create direction. You may not agree on every detail, but you can learn what matters deeply to one another.',
    guidance: 'Begin with curiosity instead of logistics. Ask what a dream represents before discussing timing, cost, or feasibility.',
    weeklyPractice: 'Choose one hope for the next twelve months. Talk about why it matters and identify the smallest first step you can take together.',
    appFeature: 'Couple Profile',
    appFeatureDescription: 'Keep your shared goals, important dates, and relationship story in one place.',
    appPath: '/?tab=home',
  },
];

export function newsletterWeekKey(date = new Date()): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function generateWeeklyNewsletter(date = new Date()): WeeklyNewsletterEdition {
  const weekKey = newsletterWeekKey(date);
  const weekNumber = Number(weekKey.slice(-2));
  const theme = THEMES[(weekNumber - 1) % THEMES.length];
  return {
    weekKey,
    subject: `Shabbat Shalom — ${theme.title}`,
    preheader: 'A short blessing, practical relationship guidance, and one simple step for the week ahead.',
    ...theme,
    appreciation: 'Thank you for making TwoBeOne part of your relationship journey. It is a privilege to support couples who are choosing faith, honesty, and intentional love.',
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}

export function renderWeeklyNewsletter(
  edition: WeeklyNewsletterEdition,
  unsubscribeUrl: string,
  appOrigin = 'https://www.twobeone.app',
): { html: string; text: string } {
  const appUrl = new URL(edition.appPath, appOrigin).toString();
  const safe = Object.fromEntries(Object.entries(edition).map(([key, value]) => [key, escapeHtml(String(value))])) as Record<string, string>;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${safe.subject}</title></head>
<body style="margin:0;background:#fff7f8;color:#292524;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${safe.preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #ffe4e6;border-radius:20px;overflow:hidden">
<tr><td style="padding:30px;background:#be123c;color:#ffffff;text-align:center"><div style="font-size:13px;letter-spacing:2px;text-transform:uppercase">TwoBeOne · Shabbat Shalom</div><h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">${safe.title}</h1></td></tr>
<tr><td style="padding:30px">
<p style="margin:0 0 22px;font-size:16px;line-height:1.7">${safe.encouragement}</p>
<div style="margin:0 0 24px;padding:20px;background:#fff1f2;border-left:4px solid #e11d48;border-radius:10px"><p style="margin:0 0 8px;font-size:17px;line-height:1.6;font-style:italic">“${safe.scripture}”</p><p style="margin:0;color:#9f1239;font-weight:bold">${safe.scriptureReference}</p></div>
<h2 style="margin:0 0 8px;font-size:19px;color:#881337">Guidance for this week</h2><p style="margin:0 0 22px;font-size:15px;line-height:1.7">${safe.guidance}</p>
<h2 style="margin:0 0 8px;font-size:19px;color:#881337">Try this together</h2><p style="margin:0 0 24px;font-size:15px;line-height:1.7">${safe.weeklyPractice}</p>
<div style="padding:20px;background:#f8fafc;border-radius:12px"><div style="font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#64748b">Inside TwoBeOne</div><h2 style="margin:7px 0;font-size:19px">${safe.appFeature}</h2><p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569">${safe.appFeatureDescription}</p><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:11px 18px;background:#e11d48;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold">Open TwoBeOne</a></div>
<p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#57534e">${safe.appreciation}</p>
</td></tr>
<tr><td style="padding:22px 30px;background:#1c1917;color:#d6d3d1;text-align:center;font-size:12px;line-height:1.6">You received Shabbat Shalom because you have a TwoBeOne account or subscribed to weekly encouragement.<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#fda4af">Unsubscribe</a> anytime. · <a href="https://www.twobeone.app" style="color:#fda4af">twobeone.app</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = `TWOBEONE — SHABBAT SHALOM\n\n${edition.title}\n\n${edition.encouragement}\n\n“${edition.scripture}” — ${edition.scriptureReference}\n\nGUIDANCE FOR THIS WEEK\n${edition.guidance}\n\nTRY THIS TOGETHER\n${edition.weeklyPractice}\n\nINSIDE TWOBEONE: ${edition.appFeature}\n${edition.appFeatureDescription}\nOpen TwoBeOne: ${appUrl}\n\n${edition.appreciation}\n\nYou received Shabbat Shalom because you have a TwoBeOne account or subscribed to weekly encouragement.\nUnsubscribe: ${unsubscribeUrl}`;
  return { html, text };
}
