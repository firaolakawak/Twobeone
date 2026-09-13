import { describe, expect, it } from 'vitest';
import { getNotificationCopy } from '../notificationCopy';

const translate = (type: string, title: string, message: string, language: 'en' | 'am' | 'om' = 'om') => getNotificationCopy({ type, title, message }, language);

describe('notification system template presentation', () => {
  it('translates chat titles while preserving an authored body that resembles interface copy', () => {
    const result = translate('chat', 'New message from Firaol [home]', 'New Prayer Message');
    expect(result).toEqual({ title: 'Ergaa haaraa Firaol [home] irraa', message: 'New Prayer Message' });
  });

  it('preserves shared scripture and its reference', () => {
    const message = 'John 3:16 - "For God so loved the world..."';
    expect(translate('verse_shared', 'Keti shared a verse with you', message)).toEqual({
      title: 'Keti caqasa Kitaaba Qulqulluu siif qoodeera', message,
    });
  });

  it('translates journal framing without translating a user-authored title or interpreting its placeholders', () => {
    const result = translate('journal', 'Keti added a new journal entry', '"My prayer for {name}" - Check it out in the Journal tab!');
    expect(result.title).toBe('Keti yaadannoo haaraa galcheera');
    expect(result.message).toBe('"My prayer for {name}" — Caancala Yaadannoo keessatti ilaalaa!');
  });

  it('recognizes existing Amharic mood summaries and preserves the names and averages', () => {
    const notification = Object.freeze({ type: 'mood_report', title: '💝 ሳምንታዊ የስሜት ነጸብራቅ', message: 'የዚህ ሳምንት የስሜት ነጸብራቅ፦ Firaol (3.5/4) እና Keti (2.0/4)' });
    expect(getNotificationCopy(notification, 'en')).toEqual({ title: '💝 Weekly Mood Reflection', message: "This week's mood reflection: Firaol (3.5/4) and Keti (2.0/4)" });
    expect(getNotificationCopy(notification, 'om').message).toBe('Calaqqee miiraa torban kanaa: Firaol (3.5/4) fi Keti (2.0/4)');
    expect(notification.title).toBe('💝 ሳምንታዊ የስሜት ነጸብራቅ');
  });

  it('recognizes stored Oromo Q&A replies and translates a known category separately from the name', () => {
    const result = translate('question_answered', '💬 Deebii haaraa hiriyyaa kee irraa!', 'Firaol gaaffii ramaddii Jireenya guyyaa fi amala keessa jiruuf deebii kenneera', 'am');
    expect(result).toEqual({ title: '💬 ከአጋርዎ አዲስ ምላሽ!', message: 'Firaol በዕለታዊ ሕይወት እና ልማዶች ውስጥ ላለ ጥያቄ ምላሽ ሰጥተዋል' });
  });

  it('does not rewrite unknown broadcasts or a template-like substring', () => {
    const message = 'Your partnership has been disconnected. Your data remains private.';
    expect(translate('general', '💔 Partnership Ended', message)).toEqual({ title: '💔 Partnership Ended', message });
    expect(translate('devotional', 'Our authored update', 'Keti shared a prayer thought')).toEqual({ title: 'Our authored update', message: 'Keti shared a prayer thought' });
    expect(translate('chat', 'Draft: New message from Keti', 'Hello')).toEqual({ title: 'Draft: New message from Keti', message: 'Hello' });
  });

  it.each([
    ['profile_update', '💕 Relationship Date Set!', 'Firaol set your relationship start date. Check your profile!'],
    ['partner_disconnect_request', '💔 Partner Disconnect Request', 'Firaol has requested to disconnect. Both partners must agree to proceed.'],
    ['partner_disconnect_agreed', '💔 Partner Agreed to Disconnect', 'Firaol has agreed to disconnect. You have 30 days to cancel if you change your mind.'],
    ['partner_disconnect_cancelled', '💚 Disconnect Request Cancelled', 'Firaol has cancelled the disconnect request. You remain connected!'],
    ['partner_disconnect_cancelled', '💚 Disconnect Request Cancelled', 'You cancelled the disconnect request. You remain connected with Firaol!'],
    ['partner_disconnected', '💔 Partnership Ended', 'Your partnership has been disconnected. Your data remains private.'],
    ['devotional', 'New Prayer Message', 'Firaol shared a prayer thought'],
    ['live_started', '🔴 Live Session Started', 'Firaol is live in Our authored group'],
  ])('translates the known %s server template', (type, title, message) => {
    for (const language of ['am', 'om'] as const) {
      const result = translate(type, title, message, language);
      expect(result.title).not.toBe(title);
      expect(result.message).not.toBe(message);
      if (message.includes('Firaol')) expect(result.message).toContain('Firaol');
    }
  });
});
