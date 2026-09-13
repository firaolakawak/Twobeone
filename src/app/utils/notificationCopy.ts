import type { Language } from './i18n';
import { translateUi, type UiParams } from './uiTranslation';
import { notificationMessages } from '../locales/notification';
import { getQuestionCategorySource } from '../locales/questionsUi';

export interface NotificationCopySource {
  type: string;
  title: string;
  message: string;
}

const compiledTemplates = new Map<string, { expression: RegExp; keys: string[] }>();
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Match a complete, known system sentence. Captured names/content stay verbatim. */
function matchTemplate(source: string, text: string): UiParams | null {
  const editions = [source, ...(notificationMessages[source] ?? [])];
  for (const edition of editions) {
    let compiled = compiledTemplates.get(edition);
    if (!compiled) {
      const keys: string[] = [];
      const pattern = edition.split(/(\{\w+\})/).map(part => {
        if (/^\{\w+\}$/.test(part)) {
          keys.push(part.slice(1, -1));
          return '([\\s\\S]+?)';
        }
        return escapeRegExp(part);
      }).join('');
      compiled = { expression: new RegExp(`^${pattern}$`, 'u'), keys };
      compiledTemplates.set(edition, compiled);
    }
    const match = compiled.expression.exec(text);
    if (match) return Object.fromEntries(compiled.keys.map((key, index) => [key, match[index + 1]]));
  }
  return null;
}

const rules: { type: string; title: string; messages: string[] }[] = [
  { type: 'profile_update', title: '💕 Relationship Date Set!', messages: ['{name} set your relationship start date. Check your profile!'] },
  { type: 'partner_disconnect_request', title: '💔 Partner Disconnect Request', messages: ['{name} has requested to disconnect. Both partners must agree to proceed.'] },
  { type: 'partner_disconnect_agreed', title: '💔 Partner Agreed to Disconnect', messages: ['{name} has agreed to disconnect. You have 30 days to cancel if you change your mind.'] },
  { type: 'partner_disconnect_cancelled', title: '💚 Disconnect Request Cancelled', messages: ['{name} has cancelled the disconnect request. You remain connected!', 'You cancelled the disconnect request. You remain connected with {name}!'] },
  { type: 'partner_disconnected', title: '💔 Partnership Ended', messages: ['Your partnership has been disconnected. Your data remains private.'] },
  { type: 'devotional', title: 'New Prayer Message', messages: ['{name} shared a prayer thought'] },
  { type: 'mood_report', title: '💝 Weekly Mood Reflection', messages: ["This week's mood reflection: {first} ({firstAvg}/4) and {second} ({secondAvg}/4)"] },
  { type: 'mood_analysis', title: '🧠 AI analysis ready', messages: ['Your AI mood analysis is ready to review.'] },
  { type: 'live_started', title: '🔴 Live Session Started', messages: ['{name} is live in {group}'] },
  { type: 'journal', title: '{name} added a new journal entry', messages: ['"{title}" - Check it out in the Journal tab!'] },
  // These bodies are authored chat/Scripture excerpts, even when they resemble UI copy.
  { type: 'chat', title: 'New message from {name}', messages: [] },
  { type: 'verse_shared', title: '{name} shared a verse with you', messages: [] },
  { type: 'question_answered', title: '💬 New Message in Q&A Chat', messages: [] },
  { type: 'question_answered', title: '💬 New Message in Discussion', messages: [] },
];

const questionSources = [
  ['💬 New Answer from Your Partner!', '{name} answered a question in {category}'],
  ['💬 New Reply from Your Partner!', '{name} replied to a question in {category}'],
] as const;
const categories = ['daily-life', 'intimacy', 'love-balance', 'dream-wedding', 'travel', 'boundaries', 'trust', 'kids-future', 'finance', 'family', 'bible'].map(getQuestionCategorySource);

/** Localize only type-qualified application templates from server/index.tsx,
 * community_routes.tsx, App journal notices, and the Q&A notification senders.
 * Unknown broadcasts, authored snippets, names, identifiers and stored records are untouched.
 */
export function getNotificationCopy(notification: NotificationCopySource, language: Language): { title: string; message: string } {
  const original = { title: notification.title, message: notification.message };
  const tr = (source: string, params?: UiParams) => translateUi(language, notificationMessages, source, params);

  if (notification.type === 'question_answered') {
    for (const [titleSource, messageSource] of questionSources) {
      const params = matchTemplate(messageSource, notification.message);
      if (!params || !questionSources.some(([title]) => matchTemplate(title, notification.title))) continue;
      const category = categories.find(source => matchTemplate(source, String(params.category)));
      return { title: tr(titleSource), message: tr(messageSource, { ...params, category: category ? tr(category) : params.category }) };
    }
  }

  for (const rule of rules) {
    if (rule.type !== notification.type) continue;
    const titleParams = matchTemplate(rule.title, notification.title);
    if (!titleParams) continue;
    let message = notification.message;
    for (const source of rule.messages) {
      const params = matchTemplate(source, notification.message);
      if (params) { message = tr(source, params); break; }
    }
    return { title: tr(rule.title, titleParams), message };
  }
  return original;
}
