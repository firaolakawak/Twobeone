import type { Language } from '../utils/i18n';

export type CalendarItemType = 'plan' | 'event' | 'reminder' | 'routine';
export type CalendarCategory = 'faith' | 'relationship' | 'family' | 'health' | 'finance' | 'service' | 'other';
export type CalendarRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface CoupleCalendarItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: CalendarItemType;
  category: CalendarCategory;
  emoji?: string;
  startsAt: string;
  endsAt?: string | null;
  allDay: boolean;
  recurrence: CalendarRecurrence;
  reminderMinutes: number | null;
  location?: string;
  status: 'upcoming' | 'completed';
  createPrayer: boolean;
  prayerId?: string | null;
  prayerTitle?: string;
  prayerText?: string;
  scripture?: string;
  createdAt: string;
  updatedAt: string;
  isPartner?: boolean;
}

export interface CalendarDraft {
  title: string;
  description: string;
  type: CalendarItemType;
  category: CalendarCategory;
  emoji: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  recurrence: CalendarRecurrence;
  reminderMinutes: number | null;
  location: string;
  createPrayer: boolean;
  language: Language;
}

export const CALENDAR_TYPE_META = {
  plan: { icon: '✦', color: 'rose' },
  event: { icon: '♡', color: 'violet' },
  reminder: { icon: '◷', color: 'amber' },
  routine: { icon: '↻', color: 'emerald' },
} as const;

export const CALENDAR_CATEGORY_EMOJI: Record<CalendarCategory, string> = {
  faith: '🙏', relationship: '💕', family: '🏡', health: '🌿', finance: '🌱', service: '🤲', other: '✨',
};

export const CALENDAR_EVENT_EMOJIS = ['💕', '🙏', '💒', '🌹', '🎉', '💍', '🍽️', '✈️', '🏡', '📖', '🎵', '🌿', '⭐', '🎂', '🔔', '☕'] as const;

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function getMonthGridDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function getYearMonths(anchor: Date): Date[] {
  return Array.from({ length: 12 }, (_, month) => new Date(anchor.getFullYear(), month, 1));
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function occursOnDay(item: CoupleCalendarItem, day: Date): boolean {
  const starts = new Date(item.startsAt);
  if (!Number.isFinite(starts.getTime())) return false;
  const target = new Date(day);
  target.setHours(0, 0, 0, 0);
  const first = new Date(starts);
  first.setHours(0, 0, 0, 0);
  if (target < first) return false;
  if (item.recurrence === 'daily') return true;
  if (item.recurrence === 'weekly') return target.getDay() === first.getDay();
  if (item.recurrence === 'monthly') return target.getDate() === first.getDate();
  return isSameLocalDay(first, target);
}

export function buildPrayerFallback(title: string, category: CalendarCategory, language: Language) {
  const cleanTitle = title.trim() || 'our plan';
  const scriptureByCategory: Record<CalendarCategory, string> = {
    faith: 'Proverbs 3:5–6', relationship: 'Ecclesiastes 4:9–10', family: 'Joshua 24:15',
    health: '3 John 1:2', finance: 'Philippians 4:19', service: 'Galatians 5:13', other: 'Philippians 4:6',
  };
  if (language === 'am') return {
    title: `ስለ ${cleanTitle} ጸሎት`,
    text: `ጌታ ሆይ፣ “${cleanTitle}” የሚለውን እቅዳችንን በእጅህ እናስቀምጣለን። ጥበብ፣ አንድነት እና ሰላም ስጠን፤ እርምጃችንም ፈቃድህን ያክብር። አሜን።`,
    scripture: scriptureByCategory[category],
  };
  if (language === 'om') return {
    title: `Kadhannaa ${cleanTitle}`,
    text: `Yaa Gooftaa, karoora keenya “${cleanTitle}” harka keetti kennina. Ogummaa, tokkummaa fi nagaa nuuf kenni; tarkaanfiin keenyas fedha kee haa kabaju. Ameen.`,
    scripture: scriptureByCategory[category],
  };
  return {
    title: `Prayer for ${cleanTitle}`,
    text: `Lord, we place our plan, “${cleanTitle},” in Your hands. Give us wisdom, unity, and peace, and let every step honor Your will. Amen.`,
    scripture: scriptureByCategory[category],
  };
}

type CalendarCopy = Record<string, string>;

export const coupleCalendarCopy: Record<Language, CalendarCopy> = {
  en: {
    eyebrow: 'Faithful planning, together', title: 'Couple Calendar', subtitle: 'Plan your shared life and carry every commitment into prayer.',
    newItem: 'Create together', calendar: 'Calendar', weekly: 'Weekly', monthlyView: 'Monthly', yearly: 'Yearly', events: 'Event list', prayers: 'Prayer list', today: 'Today',
    markedDays: 'Marked days', items: 'items', selectedAgenda: 'Selected day', milestone: 'Milestone', journal: 'Journal',
    relationshipMilestones: 'Relationship Milestones', recentJournalEntries: 'Recent Journal Entries', ourJourney: 'Our journey', sharedMemories: 'Shared memories', viewAll: 'View all', untitledJournal: 'A shared reflection', noMilestones: 'Your milestones will appear here.', noJournalEntries: 'Your recent journal entries will appear here.',
    chooseEmoji: 'Choose an event emoji', chooseEmojiHint: 'This emoji will animate on the marked calendar day.',
    emptyDay: 'A quiet day', emptyDayHint: 'Create a plan or leave room to rest together.', upcoming: 'Coming up', noUpcoming: 'No upcoming plans yet',
    plansThisWeek: 'This week', linkedPrayers: 'Prayer-linked', routines: 'Routines', newTitle: 'Create a shared plan', newDescription: 'Add it once. We will place it in your planner and prepare a prayer for it.',
    itemType: 'What are you planning?', plan: 'Plan', event: 'Event', reminder: 'Reminder', routine: 'Routine',
    titleLabel: 'Title', titlePlaceholder: 'e.g. Marriage retreat, budget night…', descriptionLabel: 'Notes', descriptionPlaceholder: 'What are you hoping to do together?',
    category: 'Life area', faith: 'Faith', relationship: 'Relationship', family: 'Family', health: 'Health', finance: 'Finance', service: 'Service', other: 'Other',
    starts: 'Starts', ends: 'Ends', location: 'Location', locationPlaceholder: 'Church, home, online…', repeats: 'Repeats', none: 'Does not repeat', daily: 'Daily', weeklyRepeat: 'Weekly', monthly: 'Monthly',
    reminderLabel: 'Remind us', atTime: 'At event time', fifteen: '15 minutes before', hour: '1 hour before', day: '1 day before', noReminder: 'No reminder',
    prayerLink: 'Create a prayer automatically', prayerLinkHint: 'AI prepares a focused couple prayer from your topic and event type.', prayerPreview: 'Prayer preview', scripture: 'Scripture',
    cancel: 'Cancel', create: 'Add to our calendar', creating: 'Creating…', complete: 'Complete', completed: 'Completed', delete: 'Delete', deleteConfirm: 'Delete this plan and its linked prayer?', partner: 'Partner', you: 'You',
    created: 'Plan and prayer created', failed: 'Could not save this plan', loadFailed: 'Could not load your couple calendar', prayerReady: 'Prayer prepared from this plan',
    calendarCta: 'Couple Calendar', calendarCtaHint: 'Plans, reminders, routines & prayer', openPlanner: 'Open planner', allDay: 'All day', back: 'Back',
  },
  am: {
    eyebrow: 'በእምነት አብረን እናቅድ', title: 'የጥንዶች የቀን መቁጠሪያ', subtitle: 'የጋራ ሕይወታችሁን አቅዱ፣ እያንዳንዱንም እቅድ በጸሎት አቅርቡ።',
    newItem: 'አብረን እንፍጠር', calendar: 'የቀን መቁጠሪያ', weekly: 'ሳምንታዊ', monthlyView: 'ወርሃዊ', yearly: 'ዓመታዊ', events: 'የክስተት ዝርዝር', prayers: 'የጸሎት ዝርዝር', today: 'ዛሬ',
    markedDays: 'ምልክት የተደረገባቸው ቀናት', items: 'እቅዶች', selectedAgenda: 'የተመረጠው ቀን', milestone: 'የግንኙነት ምዕራፍ', journal: 'ማስታወሻ',
    relationshipMilestones: 'የግንኙነት ምዕራፎች', recentJournalEntries: 'የቅርብ ጊዜ ማስታወሻዎች', ourJourney: 'የእኛ ጉዞ', sharedMemories: 'የጋራ ትውስታዎች', viewAll: 'ሁሉንም ይመልከቱ', untitledJournal: 'የጋራ ነጸብራቅ', noMilestones: 'የግንኙነት ምዕራፎቻችሁ እዚህ ይታያሉ።', noJournalEntries: 'የቅርብ ጊዜ ማስታወሻዎቻችሁ እዚህ ይታያሉ።',
    chooseEmoji: 'የክስተት ኢሞጂ ይምረጡ', chooseEmojiHint: 'ይህ ኢሞጂ ምልክት በተደረገበት ቀን ይንቀሳቀሳል።',
    emptyDay: 'ጸጥ ያለ ቀን', emptyDayHint: 'እቅድ ይፍጠሩ ወይም አብራችሁ ለማረፍ ጊዜ ይተዉ።', upcoming: 'በቅርቡ', noUpcoming: 'ገና የሚመጣ እቅድ የለም',
    plansThisWeek: 'በዚህ ሳምንት', linkedPrayers: 'ከጸሎት ጋር', routines: 'ልምዶች', newTitle: 'የጋራ እቅድ ፍጠሩ', newDescription: 'አንድ ጊዜ ያክሉት፤ በእቅዳችሁ እናስቀምጠውና ጸሎት እናዘጋጃለን።',
    itemType: 'ምን እያቀዳችሁ ነው?', plan: 'እቅድ', event: 'ክስተት', reminder: 'ማስታወሻ', routine: 'መደበኛ ልምድ',
    titleLabel: 'ርዕስ', titlePlaceholder: 'ለምሳሌ፦ የጋብቻ ማፈግፈግ…', descriptionLabel: 'ማስታወሻ', descriptionPlaceholder: 'አብራችሁ ምን ማድረግ ትፈልጋላችሁ?', category: 'የሕይወት ክፍል', faith: 'እምነት', relationship: 'ግንኙነት', family: 'ቤተሰብ', health: 'ጤና', finance: 'ገንዘብ', service: 'አገልግሎት', other: 'ሌላ',
    starts: 'የሚጀምረው', ends: 'የሚያበቃው', location: 'ቦታ', locationPlaceholder: 'ቤተ ክርስቲያን፣ ቤት፣ ኦንላይን…', repeats: 'ድግግሞሽ', none: 'አይደገምም', daily: 'በየቀኑ', weeklyRepeat: 'በየሳምንቱ', monthly: 'በየወሩ',
    reminderLabel: 'አስታውሰን', atTime: 'በክስተቱ ሰዓት', fifteen: 'ከ15 ደቂቃ በፊት', hour: 'ከ1 ሰዓት በፊት', day: 'ከ1 ቀን በፊት', noReminder: 'ማስታወሻ የለም', prayerLink: 'ጸሎት በራስ-ሰር ፍጠር', prayerLinkHint: 'AI ከርዕሱና ከክስተቱ ዓይነት የጥንዶች ጸሎት ያዘጋጃል።', prayerPreview: 'የጸሎት ቅድመ እይታ', scripture: 'ቅዱስ ቃል',
    cancel: 'ሰርዝ', create: 'ወደ ቀን መቁጠሪያችን ጨምር', creating: 'በመፍጠር ላይ…', complete: 'ጨርስ', completed: 'ተጠናቋል', delete: 'ሰርዝ', deleteConfirm: 'ይህን እቅድና ተያያዥ ጸሎቱን ይሰርዙ?', partner: 'አጋር', you: 'እርስዎ', created: 'እቅድና ጸሎት ተፈጥረዋል', failed: 'እቅዱን ማስቀመጥ አልተቻለም', loadFailed: 'የጥንዶችን ቀን መቁጠሪያ መጫን አልተቻለም', prayerReady: 'ከዚህ እቅድ ጸሎት ተዘጋጅቷል',
    calendarCta: 'የጥንዶች ቀን መቁጠሪያ', calendarCtaHint: 'እቅዶች፣ ማስታወሻዎች፣ ልምዶች እና ጸሎት', openPlanner: 'እቅድ ክፈት', allDay: 'ቀኑን ሙሉ', back: 'ተመለስ',
  },
  om: {
    eyebrow: 'Amanannaadhaan waliin karoorfachuu', title: 'Kaalaandarii Hiriyootaa', subtitle: 'Jireenya waliinii keessan karoorfadhaa; waadaa hundas kadhannaatti fidaa.',
    newItem: 'Waliin uumi', calendar: 'Kaalaandarii', weekly: 'Torban', monthlyView: "Ji'a", yearly: 'Waggaa', events: 'Tarree taateewwanii', prayers: 'Tarree kadhannaa', today: "Har'a",
    markedDays: 'Guyyoota mallatteeffaman', items: 'karoorawwan', selectedAgenda: 'Guyyaa filatame', milestone: 'Milkaaʼina', journal: 'Galmee',
    relationshipMilestones: 'Milkaaʼina Hariiroo', recentJournalEntries: 'Galmeewwan Dhihoo', ourJourney: 'Imala keenya', sharedMemories: 'Yaadannoo waliin', viewAll: 'Hunda ilaali', untitledJournal: 'Yaada waliinii', noMilestones: 'Milkaaʼinoonni keessan asitti mulʼatu.', noJournalEntries: 'Galmeewwan keessan kan dhihoo asitti mulʼatu.',
    chooseEmoji: 'Iimoojii taatee filadhu', chooseEmojiHint: 'Iimoojiin kun guyyaa kaalaandarii mallatteeffame irratti sochoʼa.',
    emptyDay: 'Guyyaa boqonnaa', emptyDayHint: 'Karoora uumi ykn waliin boqachuuf iddoo dhiisi.', upcoming: 'Dhufaa jira', noUpcoming: 'Karoorri dhufu hin jiru',
    plansThisWeek: 'Torban kana', linkedPrayers: 'Kadhannaatti hidhame', routines: 'Barmaatilee', newTitle: 'Karoora waliinii uumaa', newDescription: 'Yeroo tokko dabalaa; karoora keessan keessa kaaʼnee kadhannaa isaaf qopheessina.',
    itemType: 'Maal karoorfachaa jirtu?', plan: 'Karoora', event: 'Taatee', reminder: 'Yaadachiisa', routine: 'Barmaata',
    titleLabel: 'Mata duree', titlePlaceholder: 'Fkn. leenjii gaaʼelaa, galgala baajataa…', descriptionLabel: 'Yaadannoo', descriptionPlaceholder: 'Waliin maal gochuu abdattu?', category: 'Kutaa jireenyaa', faith: 'Amantii', relationship: 'Hariiroo', family: 'Maatii', health: 'Fayyaa', finance: 'Maallaqa', service: 'Tajaajila', other: 'Kan biraa',
    starts: 'Jalqaba', ends: 'Xumura', location: 'Bakka', locationPlaceholder: 'Mana kiristaanaa, mana, toora irra…', repeats: 'Irra deebiʼa', none: 'Hin irra deebiʼu', daily: 'Guyyaa guyyaan', weeklyRepeat: 'Torban torbaniin', monthly: "Ji'a ji'aan",
    reminderLabel: 'Nu yaadachiisi', atTime: 'Yeroo taateetti', fifteen: 'Daqiiqaa 15 dura', hour: "Sa'aatii 1 dura", day: 'Guyyaa 1 dura', noReminder: 'Yaadachiisni hin jiru', prayerLink: 'Kadhannaa ofumaan uumi', prayerLinkHint: 'AI mata duree fi gosa taatee irraa kadhannaa hiriyootaa qopheessa.', prayerPreview: 'Kadhannaa dursee ilaali', scripture: 'Caaffata Qulqulluu',
    cancel: 'Dhiisi', create: 'Kaalaandarii keenyatti dabali', creating: 'Uumamaa jira…', complete: 'Xumuri', completed: 'Xumurame', delete: 'Haqi', deleteConfirm: 'Karoora kanaa fi kadhannaa isaatti hidhame haqtaa?', partner: 'Hiriyyaa', you: 'Ati', created: 'Karooraa fi kadhannaan uumameera', failed: 'Karoora kana kuusuun hin dandaʼamne', loadFailed: 'Kaalaandarii hiriyootaa feʼuun hin dandaʼamne', prayerReady: 'Kadhannaan karoora kana irraa qophaaʼeera',
    calendarCta: 'Kaalaandarii Hiriyootaa', calendarCtaHint: 'Karoora, yaadachiisa, barmaata fi kadhannaa', openPlanner: 'Karoora bani', allDay: 'Guyyaa guutuu', back: "Deebi'i",
  },
};
