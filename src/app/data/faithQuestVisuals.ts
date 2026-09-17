/** Compact visual copy only. Choice indexes match the original mission options. */
export interface FaithQuestVisualChoice {
  emoji: string;
  label: string;
}

export interface FaithQuestVisuals {
  emoji: string;
  prompt: string;
  choices: readonly [FaithQuestVisualChoice, FaithQuestVisualChoice, FaithQuestVisualChoice];
}

const visuals: Readonly<Record<string, FaithQuestVisuals>> = {
  'quest-01': {
    emoji: '😔', prompt: 'Hard day. What would help you?',
    choices: [{ emoji: '👂', label: 'Just listen' }, { emoji: '💬', label: 'Encourage me' }, { emoji: '🫂', label: 'Quiet company' }],
  },
  'quest-02': {
    emoji: '📱', prompt: 'Your partner is late. What do you do?',
    choices: [{ emoji: '💬', label: 'Check in' }, { emoji: '🕰️', label: 'Another time' }, { emoji: '💗', label: 'Miss you' }],
  },
  'quest-03': {
    emoji: '💌', prompt: 'How will you send a little love?',
    choices: [{ emoji: '🎙️', label: 'Voice note' }, { emoji: '📝', label: 'Three appreciations' }, { emoji: '📸', label: 'Treasured memory' }],
  },
  'quest-04': {
    emoji: '🎉', prompt: 'A small win! How would you celebrate?',
    choices: [{ emoji: '👏', label: 'Well done' }, { emoji: '💬', label: 'Tell my story' }, { emoji: '🫶', label: 'Time together' }],
  },
  'quest-05': {
    emoji: '😴', prompt: 'Talk or rest? How can you make room?',
    choices: [{ emoji: '⏱️', label: 'Quick check-in' }, { emoji: '🛋️', label: 'After resting' }, { emoji: '💌', label: 'Note for later' }],
  },
  'quest-06': {
    emoji: '🌿', prompt: 'How can you give them breathing room?',
    choices: [{ emoji: '💬', label: 'No-rush encouragement' }, { emoji: '🙏', label: 'Calming prayer' }, { emoji: '🕰️', label: 'Flexible time' }],
  },
  'quest-07': {
    emoji: '⏸️', prompt: 'Feeling overwhelmed? What pause helps you?',
    choices: [{ emoji: '🫂', label: 'Quiet minute' }, { emoji: '⏳', label: 'Break, then return' }, { emoji: '✍️', label: 'Write thoughts' }],
  },
  'quest-08': {
    emoji: '📩', prompt: 'No reply yet. What could help?',
    choices: [{ emoji: '🕰️', label: 'Wait as agreed' }, { emoji: '💬', label: 'Ask when' }, { emoji: '💗', label: 'Share my need' }],
  },
  'quest-09': {
    emoji: '🐢', prompt: 'How can today feel a little less rushed?',
    choices: [{ emoji: '📱', label: 'Shorter call' }, { emoji: '🗓️', label: 'Flexible plan' }, { emoji: '💌', label: 'Break-time note' }],
  },
  'quest-10': {
    emoji: '⏳', prompt: 'Waiting for news. What support helps you?',
    choices: [{ emoji: '🙏', label: 'Pray together' }, { emoji: '🎈', label: 'Light distraction' }, { emoji: '💬', label: 'Talk about worries' }],
  },
  'quest-11': {
    emoji: '🤔', prompt: 'They seem distracted. What could you say?',
    choices: [{ emoji: '🕰️', label: 'Better time?' }, { emoji: '👂', label: 'One focused minute?' }, { emoji: '💭', label: 'On your mind?' }],
  },
  'quest-12': {
    emoji: '💪', prompt: 'What encouragement will you send today?',
    choices: [{ emoji: '⭐', label: 'Name a strength' }, { emoji: '🙏', label: 'Personal prayer' }, { emoji: '🏔️', label: 'Past victory' }],
  },
  'quest-13': {
    emoji: '🫶', prompt: 'Which small gesture makes you feel cared for?',
    choices: [{ emoji: '🧠', label: 'Remember details' }, { emoji: '💬', label: 'How’d it go?' }, { emoji: '🤝', label: 'Practical help' }],
  },
  'quest-14': {
    emoji: '😵‍💫', prompt: 'Too much to do. How could you help?',
    choices: [{ emoji: '💬', label: 'Hardest task?' }, { emoji: '🤝', label: 'Help one task' }, { emoji: '👂', label: 'Listen first' }],
  },
  'quest-15': {
    emoji: '🌷', prompt: 'How will you thank them for their effort?',
    choices: [{ emoji: '💬', label: 'Thank their effort' }, { emoji: '🔎', label: 'Specific appreciation' }, { emoji: '💌', label: 'Thank-you card' }],
  },
  'quest-16': {
    emoji: '💬', prompt: 'A hard conversation. What helps you begin?',
    choices: [{ emoji: '🕰️', label: 'Calm time' }, { emoji: '🤝', label: 'We’re a team' }, { emoji: '🙏', label: 'Pray first' }],
  },
  'quest-17': {
    emoji: '📲', prompt: 'That text felt sharp. What comes first?',
    choices: [{ emoji: '❔', label: 'Ask their meaning' }, { emoji: '💗', label: 'Share my feelings' }, { emoji: '🕰️', label: 'Talk when ready' }],
  },
  'quest-18': {
    emoji: '🕊️', prompt: 'What peaceful moment will you send?',
    choices: [{ emoji: '🙏', label: 'Gentle prayer' }, { emoji: '🌅', label: 'Peaceful photo' }, { emoji: '🛋️', label: 'Rest invitation' }],
  },
  'quest-19': {
    emoji: '🧩', prompt: 'A misunderstanding. What helps you reconnect?',
    choices: [{ emoji: '💗', label: 'Sincere apology' }, { emoji: '👂', label: 'Hear both sides' }, { emoji: '🤝', label: 'Agree a change' }],
  },
  'quest-20': {
    emoji: '🗓️', prompt: 'Different schedules. How can you stay close?',
    choices: [{ emoji: '⏱️', label: 'Brief shared time' }, { emoji: '💌', label: 'Exchange notes' }, { emoji: '🗓️', label: 'Plan unhurried time' }],
  },
  'quest-21': {
    emoji: '🤝', prompt: 'Which small act will you follow through on?',
    choices: [{ emoji: '📱', label: 'Promised update' }, { emoji: '💬', label: 'Follow up news' }, { emoji: '🙏', label: 'Written prayer' }],
  },
  'quest-22': {
    emoji: '🌍', prompt: 'When apart, what helps you feel close?',
    choices: [{ emoji: '🕰️', label: 'Regular check-in' }, { emoji: '📸', label: 'Everyday glimpse' }, { emoji: '🌅', label: 'Wake-up message' }],
  },
  'quest-23': {
    emoji: '🔄', prompt: 'Your plans changed. How can you show care?',
    choices: [{ emoji: '🗓️', label: 'Explain and reschedule' }, { emoji: '💬', label: 'Ask the impact' }, { emoji: '💗', label: 'Acknowledge disappointment' }],
  },
  'quest-24': {
    emoji: '🧠', prompt: 'How will you show that you remembered?',
    choices: [{ emoji: '💬', label: 'Ask about it' }, { emoji: '📸', label: 'Shared memory' }, { emoji: '🌱', label: 'Encourage their goal' }],
  },
  'quest-25': {
    emoji: '⚓', prompt: 'Which everyday habit helps you feel secure?',
    choices: [{ emoji: '🤝', label: 'Keep our plans' }, { emoji: '💬', label: 'Honest limits' }, { emoji: '👂', label: 'Time to listen' }],
  },
  'quest-26': {
    emoji: '🌤️', prompt: 'A hard day. How could you invite joy?',
    choices: [{ emoji: '😄', label: 'Funny story?' }, { emoji: '📸', label: 'Happy memory' }, { emoji: '🎈', label: 'Their activity choice' }],
  },
  'quest-27': {
    emoji: '🎁', prompt: 'Which free, playful surprise will you prepare?',
    choices: [{ emoji: '🧩', label: 'Memory riddle' }, { emoji: '🎨', label: 'Imaginary date sketch' }, { emoji: '🎙️', label: 'Cheerful greeting' }],
  },
  'quest-28': {
    emoji: '☀️', prompt: 'What simple moment would brighten your day?',
    choices: [{ emoji: '😂', label: 'Familiar funny story' }, { emoji: '🧭', label: 'Discover together' }, { emoji: '🙏', label: 'Quiet gratitude' }],
  },
  'quest-29': {
    emoji: '🎊', prompt: 'Big or quiet celebrations? What could work?',
    choices: [{ emoji: '💬', label: 'What matters most?' }, { emoji: '🎁', label: 'Surprise then quiet' }, { emoji: '🔄', label: 'Take turns choosing' }],
  },
  'quest-30': {
    emoji: '💝', prompt: 'How will you share three reasons for gratitude?',
    choices: [{ emoji: '📝', label: 'Three thank-you notes' }, { emoji: '🖼️', label: 'Three-photo collage' }, { emoji: '🙏', label: 'Thankful prayer' }],
  },
};

export function getFaithQuestVisuals(id: string): FaithQuestVisuals | undefined {
  return Object.prototype.hasOwnProperty.call(visuals, id) ? visuals[id] : undefined;
}
