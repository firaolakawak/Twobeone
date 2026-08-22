// Curated Bible verses for couples and marriage

export interface MemoryVerse {
  id: string;
  reference: string;
  text: string;
  category: 'marriage' | 'love' | 'unity' | 'forgiveness' | 'faith' | 'prayer' | 'commitment' | 'communication';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export const curatedVerses: MemoryVerse[] = [
  // Marriage
  {
    id: 'gen2-24',
    reference: 'Genesis 2:24',
    text: 'Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.',
    category: 'marriage',
    difficulty: 'medium',
    tags: ['marriage', 'unity', 'commitment']
  },
  {
    id: 'ecc4-9',
    reference: 'Ecclesiastes 4:9-10',
    text: 'Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow.',
    category: 'unity',
    difficulty: 'medium',
    tags: ['partnership', 'support', 'unity']
  },
  {
    id: 'prov31-10',
    reference: 'Proverbs 31:10',
    text: 'An excellent wife who can find? She is far more precious than jewels.',
    category: 'marriage',
    difficulty: 'easy',
    tags: ['wife', 'value', 'appreciation']
  },
  
  // Love
  {
    id: '1cor13-4',
    reference: '1 Corinthians 13:4-5',
    text: 'Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It does not insist on its own way; it is not irritable or resentful.',
    category: 'love',
    difficulty: 'hard',
    tags: ['love', 'patience', 'kindness']
  },
  {
    id: '1cor13-7',
    reference: '1 Corinthians 13:7',
    text: 'Love bears all things, believes all things, hopes all things, endures all things.',
    category: 'love',
    difficulty: 'easy',
    tags: ['love', 'endurance', 'hope']
  },
  {
    id: '1cor13-8',
    reference: '1 Corinthians 13:8',
    text: 'Love never ends.',
    category: 'love',
    difficulty: 'easy',
    tags: ['love', 'eternal']
  },
  {
    id: 'col3-14',
    reference: 'Colossians 3:14',
    text: 'And above all these put on love, which binds everything together in perfect harmony.',
    category: 'love',
    difficulty: 'easy',
    tags: ['love', 'unity', 'harmony']
  },
  {
    id: '1jn4-19',
    reference: '1 John 4:19',
    text: 'We love because he first loved us.',
    category: 'love',
    difficulty: 'easy',
    tags: ['love', 'God']
  },
  
  // Unity & Partnership
  {
    id: 'matt19-6',
    reference: 'Matthew 19:6',
    text: 'So they are no longer two but one flesh. What therefore God has joined together, let not man separate.',
    category: 'unity',
    difficulty: 'medium',
    tags: ['unity', 'marriage', 'commitment']
  },
  {
    id: 'ecc4-12',
    reference: 'Ecclesiastes 4:12',
    text: 'And though a man might prevail against one who is alone, two will withstand him—a threefold cord is not quickly broken.',
    category: 'unity',
    difficulty: 'medium',
    tags: ['unity', 'strength', 'God']
  },
  {
    id: 'amos3-3',
    reference: 'Amos 3:3',
    text: 'Do two walk together, unless they have agreed to meet?',
    category: 'unity',
    difficulty: 'easy',
    tags: ['unity', 'agreement', 'partnership']
  },
  
  // Forgiveness
  {
    id: 'eph4-32',
    reference: 'Ephesians 4:32',
    text: 'Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.',
    category: 'forgiveness',
    difficulty: 'medium',
    tags: ['forgiveness', 'kindness', 'grace']
  },
  {
    id: 'col3-13',
    reference: 'Colossians 3:13',
    text: 'Bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive.',
    category: 'forgiveness',
    difficulty: 'hard',
    tags: ['forgiveness', 'grace', 'patience']
  },
  {
    id: 'matt6-14',
    reference: 'Matthew 6:14-15',
    text: 'For if you forgive others their trespasses, your heavenly Father will also forgive you, but if you do not forgive others their trespasses, neither will your Father forgive your trespasses.',
    category: 'forgiveness',
    difficulty: 'hard',
    tags: ['forgiveness', 'grace']
  },
  
  // Communication
  {
    id: 'prov15-1',
    reference: 'Proverbs 15:1',
    text: 'A soft answer turns away wrath, but a harsh word stirs up anger.',
    category: 'communication',
    difficulty: 'easy',
    tags: ['communication', 'conflict', 'wisdom']
  },
  {
    id: 'prov18-13',
    reference: 'Proverbs 18:13',
    text: 'If one gives an answer before he hears, it is his folly and shame.',
    category: 'communication',
    difficulty: 'medium',
    tags: ['listening', 'wisdom', 'communication']
  },
  {
    id: 'james1-19',
    reference: 'James 1:19',
    text: 'Know this, my beloved brothers: let every person be quick to hear, slow to speak, slow to anger.',
    category: 'communication',
    difficulty: 'medium',
    tags: ['listening', 'patience', 'anger']
  },
  {
    id: 'eph4-29',
    reference: 'Ephesians 4:29',
    text: 'Let no corrupting talk come out of your mouths, but only such as is good for building up, as fits the occasion, that it may give grace to those who hear.',
    category: 'communication',
    difficulty: 'hard',
    tags: ['communication', 'encouragement', 'grace']
  },
  
  // Faith Together
  {
    id: 'josh24-15',
    reference: 'Joshua 24:15',
    text: 'But as for me and my house, we will serve the Lord.',
    category: 'faith',
    difficulty: 'easy',
    tags: ['faith', 'commitment', 'family']
  },
  {
    id: 'prov3-5',
    reference: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
    category: 'faith',
    difficulty: 'medium',
    tags: ['trust', 'guidance', 'faith']
  },
  
  // Prayer
  {
    id: 'matt18-20',
    reference: 'Matthew 18:20',
    text: 'For where two or three are gathered in my name, there am I among them.',
    category: 'prayer',
    difficulty: 'easy',
    tags: ['prayer', 'unity', 'presence']
  },
  {
    id: '1thess5-17',
    reference: '1 Thessalonians 5:17',
    text: 'Pray without ceasing.',
    category: 'prayer',
    difficulty: 'easy',
    tags: ['prayer', 'habit']
  },
  
  // Commitment
  {
    id: 'ruth1-16',
    reference: 'Ruth 1:16',
    text: 'But Ruth said, "Do not urge me to leave you or to return from following you. For where you go I will go, and where you lodge I will lodge. Your people shall be my people, and your God my God."',
    category: 'commitment',
    difficulty: 'hard',
    tags: ['commitment', 'loyalty', 'devotion']
  },
  {
    id: 'mal2-16',
    reference: 'Malachi 2:16',
    text: 'For the man who does not love his wife but divorces her, says the Lord, the God of Israel, covers his garment with violence, says the Lord of hosts. So guard yourselves in your spirit, and do not be faithless.',
    category: 'commitment',
    difficulty: 'hard',
    tags: ['commitment', 'faithfulness', 'marriage']
  }
];

export const getVersesByCategory = (category: string) => {
  return curatedVerses.filter(v => v.category === category);
};

export const getVersesByDifficulty = (difficulty: string) => {
  return curatedVerses.filter(v => v.difficulty === difficulty);
};

export const getRandomVerse = () => {
  return curatedVerses[Math.floor(Math.random() * curatedVerses.length)];
};
