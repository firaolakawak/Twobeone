/** Original TwoBeOne activities. Scripture references are reading prompts, not quotations. */
export type FaithQuestMode = 'heart' | 'grace' | 'kindness';

export interface FaithQuestChapter {
  id: string;
  title: string;
  virtue: string;
  description: string;
  scripture: string;
  emoji: string;
}

export interface FaithQuestMission {
  id: string;
  chapterId: string;
  mode: FaithQuestMode;
  title: string;
  prompt: string;
  options: readonly [string, string, string];
  /** Optional roleplay samples aligned with the three choices, never predicted partner reactions. */
  followUps?: readonly [string, string, string];
  action: string;
  reflection: string;
  scripture: string;
  minutes: number;
}

export const FAITH_QUEST_CHAPTERS: readonly FaithQuestChapter[] = [
  { id: 'love', title: 'Love', virtue: 'Love', description: 'Notice what makes each other feel loved.', scripture: '1 Corinthians 13:4–7', emoji: '💗' },
  { id: 'patience', title: 'Patience', virtue: 'Patience', description: 'Make room for each other at a gentler pace.', scripture: 'James 1:19', emoji: '🌱' },
  { id: 'kindness', title: 'Kindness', virtue: 'Kindness', description: 'Turn caring thoughts into small acts.', scripture: 'Ephesians 4:32', emoji: '🎁' },
  { id: 'peace', title: 'Peace', virtue: 'Peace', description: 'Listen well and find a calm way forward.', scripture: 'Romans 12:18', emoji: '🕊️' },
  { id: 'faithfulness', title: 'Faithfulness', virtue: 'Faithfulness', description: 'Build trust through everyday care.', scripture: 'Luke 16:10', emoji: '🤝' },
  { id: 'joy', title: 'Joy', virtue: 'Joy', description: 'Share gratitude and make room for delight.', scripture: 'Philippians 4:4', emoji: '☀️' },
];

const actions: Record<FaithQuestMode, string> = {
  heart: 'Reveal your choices. Ask how to offer the care your partner picked.',
  grace: 'Share why you chose that response. Agree on one small next step.',
  kindness: 'Choose a surprise. Do it offline, then return to reveal it.',
};

const reflections: Record<string, string> = {
  love: 'What helped you feel cared for?',
  patience: 'Where could a little more time help?',
  kindness: 'Which small act made a difference?',
  peace: 'What helped you understand each other?',
  faithfulness: 'What is one promise you can realistically keep?',
  joy: 'What would you like to enjoy together again?',
};

type MissionSeed = Pick<FaithQuestMission, 'id' | 'chapterId' | 'mode' | 'title' | 'prompt' | 'options' | 'followUps'>;

const missions: readonly MissionSeed[] = [
  {
    id: 'quest-01', chapterId: 'love', mode: 'heart', title: 'Comfort me',
    prompt: 'After a difficult day, what would help you most?',
    options: ['Listen without fixing', 'Offer gentle encouragement', 'Give me quiet company'],
  },
  {
    id: 'quest-02', chapterId: 'love', mode: 'grace', title: 'A late call',
    prompt: 'Your partner is late for a planned call. How could you respond with care?',
    options: ['Send a gentle check-in', 'Suggest another time', 'Share that you missed them'],
    followUps: [
      'I was looking forward to our call. Is everything okay?',
      'Would another time work better for us today?',
      'I missed you. I would love a little time together.',
    ],
  },
  {
    id: 'quest-03', chapterId: 'love', mode: 'kindness', title: 'A little love note',
    prompt: 'Create a small surprise that says: I am glad you are in my life.',
    options: ['Send a thoughtful voice note', 'Write three things you appreciate', 'Share a treasured memory'],
  },
  {
    id: 'quest-04', chapterId: 'love', mode: 'heart', title: 'Celebrate my small win',
    prompt: 'When something goes well for you, how do you like to celebrate?',
    options: ['Hear a warm well done', 'Tell the whole story', 'Enjoy a little time together'],
  },
  {
    id: 'quest-05', chapterId: 'love', mode: 'grace', title: 'Two different plans',
    prompt: 'One of you wants to talk; the other needs rest. What could you try?',
    options: ['Agree on a short check-in', 'Plan a time after resting', 'Send a caring note for later'],
    followUps: [
      'Could we talk for five minutes, then let you rest?',
      'Please rest first. When could we reconnect?',
      'I will leave a little note for whenever you feel ready.',
    ],
  },
  {
    id: 'quest-06', chapterId: 'patience', mode: 'kindness', title: 'Room to breathe',
    prompt: 'Offer a little breathing room without expecting an immediate reply.',
    options: ['Send a no-rush encouragement', 'Record a short calming prayer', 'Offer a flexible time to connect'],
  },
  {
    id: 'quest-07', chapterId: 'patience', mode: 'heart', title: 'Let me pause',
    prompt: 'When a conversation feels overwhelming, what pause helps you?',
    options: ['A quiet minute together', 'A short break with a return time', 'Time to write my thoughts'],
  },
  {
    id: 'quest-08', chapterId: 'patience', mode: 'grace', title: 'The unread message',
    prompt: 'A message has gone unanswered during a busy day. What could help?',
    options: ['Wait until the agreed check-in', 'Ask when a reply would be easier', 'Name your need without blame'],
    followUps: [
      'I will catch up with you at the time we agreed.',
      'When would replying be easier for you today?',
      'A brief update helps me feel connected. What works for you?',
    ],
  },
  {
    id: 'quest-09', chapterId: 'patience', mode: 'kindness', title: 'A gentler pace',
    prompt: 'Make one shared plan feel less rushed today.',
    options: ['Offer a shorter call', 'Send a simple plan with choices', 'Leave a warm note for their break'],
  },
  {
    id: 'quest-10', chapterId: 'patience', mode: 'heart', title: 'While we wait',
    prompt: 'When you are waiting for uncertain news, what support do you prefer?',
    options: ['A short prayer together', 'A lighthearted distraction', 'Space to talk about my worry'],
  },
  {
    id: 'quest-11', chapterId: 'kindness', mode: 'grace', title: 'A distracted moment',
    prompt: 'Your partner seems distracted while you are speaking. What could you say?',
    options: ['Is another time better?', 'Could we have one focused minute?', 'Is something on your mind?'],
    followUps: [
      'Would a quieter moment work better for this conversation?',
      'Could we set our distractions aside for one minute?',
      'You seem thoughtful. Would you like to tell me what is happening?',
    ],
  },
  {
    id: 'quest-12', chapterId: 'kindness', mode: 'kindness', title: 'Encouragement delivery',
    prompt: 'Send encouragement for something your partner is facing.',
    options: ['Name a strength you see', 'Write a short personal prayer', 'Recall a challenge they overcame'],
  },
  {
    id: 'quest-13', chapterId: 'kindness', mode: 'heart', title: 'Care in small things',
    prompt: 'Which everyday gesture makes you feel especially cared for?',
    options: ['Remembering a small detail', 'Asking how something went', 'Offering practical help'],
  },
  {
    id: 'quest-14', chapterId: 'kindness', mode: 'grace', title: 'Too much to do',
    prompt: 'Your partner feels overwhelmed by tasks. How might you offer support?',
    options: ['Ask which task feels hardest', 'Offer help with one small task', 'Listen before making suggestions'],
    followUps: [
      'Which task feels heaviest right now?',
      'Could I help with one small thing you choose?',
      'Would you like me to listen before we think about solutions?',
    ],
  },
  {
    id: 'quest-15', chapterId: 'kindness', mode: 'kindness', title: 'Thank you for the details',
    prompt: 'Notice an effort that might otherwise go unmentioned.',
    options: ['Thank them for a recent effort', 'Send a specific appreciation', 'Make a tiny digital thank-you card'],
  },
  {
    id: 'quest-16', chapterId: 'peace', mode: 'heart', title: 'Before a hard talk',
    prompt: 'What helps you begin a difficult conversation?',
    options: ['Agreeing on a calm time', 'Hearing that we are a team', 'Starting with a short prayer'],
  },
  {
    id: 'quest-17', chapterId: 'peace', mode: 'grace', title: 'That sounded sharp',
    prompt: 'A text sounds harsher than you expected. What could you try first?',
    options: ['Ask what they meant', 'Explain how the words felt', 'Suggest talking when both are ready'],
    followUps: [
      'Could you help me understand what you meant?',
      'Those words felt sharp to me. Could we talk about them?',
      'Could we choose a time to talk when we both feel ready?',
    ],
  },
  {
    id: 'quest-18', chapterId: 'peace', mode: 'kindness', title: 'A calm minute',
    prompt: 'Offer a small peaceful moment for your partner to enjoy later.',
    options: ['Record a gentle prayer', 'Share a peaceful photo you took', 'Send an invitation to rest'],
  },
  {
    id: 'quest-19', chapterId: 'peace', mode: 'heart', title: 'Finding our way back',
    prompt: 'After a small misunderstanding, what helps you reconnect?',
    options: ['A clear and sincere apology', 'Time to explain both views', 'An agreed change for next time'],
  },
  {
    id: 'quest-20', chapterId: 'peace', mode: 'grace', title: 'Clashing calendars',
    prompt: 'Your free time does not match this week. How could you stay connected?',
    options: ['Find one short shared window', 'Exchange notes at separate times', 'Plan the next unhurried catch-up'],
    followUps: [
      'Could we find ten minutes that suit both our schedules?',
      'Shall we leave each other notes to read when we can?',
      'When could we set aside time for an unhurried conversation?',
    ],
  },
  {
    id: 'quest-21', chapterId: 'faithfulness', mode: 'kindness', title: 'One promise kept',
    prompt: 'Choose one small act of care you can follow through on today.',
    options: ['Send a promised update', 'Follow up on their important news', 'Share a prayer you wrote for them'],
  },
  {
    id: 'quest-22', chapterId: 'faithfulness', mode: 'heart', title: 'Close across the distance',
    prompt: 'When you are apart, what helps you feel connected?',
    options: ['A predictable check-in', 'A glimpse of everyday life', 'A thoughtful message to wake up to'],
  },
  {
    id: 'quest-23', chapterId: 'faithfulness', mode: 'grace', title: 'When plans change',
    prompt: 'You need to change a plan you made together. What caring step could you take?',
    options: ['Explain early and offer a new time', 'Ask how the change affects them', 'Acknowledge the disappointment'],
    followUps: [
      'My plans changed. Could we choose a new time together?',
      'How does this change affect your plans?',
      'I understand this is disappointing. Our time together matters to me.',
    ],
  },
  {
    id: 'quest-24', chapterId: 'faithfulness', mode: 'kindness', title: 'I remembered',
    prompt: 'Show your partner that a detail they shared mattered to you.',
    options: ['Ask about something they mentioned', 'Send a memory of a shared moment', 'Encourage a goal they told you about'],
  },
  {
    id: 'quest-25', chapterId: 'faithfulness', mode: 'heart', title: 'Trust in small things',
    prompt: 'Which everyday habit helps you feel secure in your connection?',
    options: ['Following through on plans', 'Being honest about limits', 'Making time to listen'],
  },
  {
    id: 'quest-26', chapterId: 'joy', mode: 'grace', title: 'Room for a brighter moment',
    prompt: 'It has been a hard day for your partner. How could you gently invite some joy?',
    options: ['Ask whether a funny story would help', 'Offer a favorite shared memory', 'Let them choose a small pleasant activity'],
    followUps: [
      'Would a funny story be welcome, or would you prefer quiet?',
      'Would you like to remember a happy moment we shared?',
      'What small thing might feel good to do together?',
    ],
  },
  {
    id: 'quest-27', chapterId: 'joy', mode: 'kindness', title: 'A tiny adventure',
    prompt: 'Prepare a playful surprise that costs nothing.',
    options: ['Send a three-clue memory riddle', 'Sketch your next imaginary date', 'Record a cheerful personal greeting'],
  },
  {
    id: 'quest-28', chapterId: 'joy', mode: 'heart', title: 'My simple delight',
    prompt: 'Which simple shared moment would brighten your day most?',
    options: ['Laughing at a familiar story', 'Discovering something new together', 'Sharing a quiet moment of gratitude'],
  },
  {
    id: 'quest-29', chapterId: 'joy', mode: 'grace', title: 'Different celebration styles',
    prompt: 'One of you loves big celebrations; the other prefers quiet ones. What could work?',
    options: ['Ask what matters most to each', 'Combine a small surprise and quiet time', 'Take turns choosing the celebration'],
    followUps: [
      'What part of celebrating feels most meaningful to you?',
      'Could we enjoy a small surprise, then have some quiet time?',
      'Would you like to choose this time, and I choose next?',
    ],
  },
  {
    id: 'quest-30', chapterId: 'joy', mode: 'kindness', title: 'A gratitude treasure',
    prompt: 'Gather three small reasons you are thankful for your shared journey.',
    options: ['Send three short gratitude notes', 'Make a three-photo memory collage', 'Record a prayer of thanks'],
  },
];

export const FAITH_QUEST_MISSIONS: readonly FaithQuestMission[] = missions.map((mission) => ({
  ...mission,
  action: actions[mission.mode],
  reflection: reflections[mission.chapterId],
  scripture: FAITH_QUEST_CHAPTERS.find((chapter) => chapter.id === mission.chapterId)!.scripture,
  minutes: mission.mode === 'heart' ? 5 : 7,
}));

export function getFaithQuestMission(id: string): FaithQuestMission | undefined {
  return FAITH_QUEST_MISSIONS.find((mission) => mission.id === id);
}
