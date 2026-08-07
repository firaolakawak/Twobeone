import * as kv from './kv_store.tsx';

export async function migrateSeederFlags() {
  try {
    if (await kv.get("system:seeder-flags-v1")) return;
    const allQuestions = await kv.getByPrefix("question:");
    const seededCategories = new Set<string>();
    for (const q of allQuestions) {
      if (q.category) seededCategories.add(q.category);
    }
    for (const cat of seededCategories) {
      const flagKey = cat === "travel" ? "seeded:travel" : "seeded:" + cat;
      if (!(await kv.get(flagKey))) {
        await kv.set(flagKey, true);
        console.log("[SeederMigration] Set flag for existing category:", cat);
      }
    }
    await kv.set("system:seeder-flags-v1", true);
    console.log("[SeederMigration] Done. Categories with questions:", [...seededCategories].join(", "));
  } catch (err) {
    console.error("[SeederMigration] Failed:", err);
  }
}

export async function seedAllCategoryQuestions() {
  try {
    await migrateSeederFlags();

    function toSlug(text: string) {
      return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
    }

    async function seedCategory(categoryId: string, questions: any[]) {
      if (await kv.get("seeded:" + categoryId)) return;
      for (const q of questions) {
        // Deterministic ID — title slug means the same question never gets a second key
        const id = `${categoryId}-${toSlug(q.title || 'question')}`;
        if (!(await kv.get("question:" + id))) {
          await kv.set("question:" + id, { ...q, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          await new Promise((r) => setTimeout(r, 10));
        }
      }
      await kv.set("seeded:" + categoryId, true);
      console.log(`[Seed] ${categoryId} done (deterministic IDs)`);
    }

    // ─── Daily Life & Habits ───────────────────────────────────────────────
    await seedCategory("daily-life", [
      {
        category: "daily-life", language: "en", status: "active",
        title: "Morning Rhythms Together",
        verse: "This is the day the LORD has made; let us rejoice and be glad in it.",
        verseReference: "Psalm 118:24",
        prompts: [
          { id: "dl1p1", text: "Describe your ideal morning routine as a couple.", type: "text" },
          { id: "dl1p2", text: "How important is starting the day with prayer or devotion together?", type: "scale", scaleMax: 5 },
          { id: "dl1p3", text: "Which morning habit would you most want to build together?", type: "multiple_choice", options: ["Prayer & devotion", "Exercise", "Cooking breakfast", "Bible reading", "Quiet time"] },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Chores & Shared Responsibility",
        verse: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace.",
        verseReference: "1 Peter 4:10",
        prompts: [
          { id: "dl2p1", text: "How do you think household responsibilities should be divided between partners?", type: "text" },
          { id: "dl2p2", text: "Which chore do you strongly dislike and would want your partner to handle?", type: "text" },
          { id: "dl2p3", text: "How would you approach it if you felt the division of home duties was unfair?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Screen Time & Digital Habits",
        verse: "Be careful then how you live - not as unwise but as wise, making the most of every opportunity.",
        verseReference: "Ephesians 5:15-16",
        prompts: [
          { id: "dl3p1", text: "How much daily screen time do you think is healthy in a relationship?", type: "multiple_choice", options: ["Under 1 hour", "1-2 hours", "2-4 hours", "No limit"] },
          { id: "dl3p2", text: "Are there times when phones should be put away completely (meals, bedtime, etc.)?", type: "yes_no" },
          { id: "dl3p3", text: "What boundaries around social media would help your relationship thrive?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Eating & Food Culture",
        verse: "So whether you eat or drink or whatever you do, do it all for the glory of God.",
        verseReference: "1 Corinthians 10:31",
        prompts: [
          { id: "dl4p1", text: "How important is cooking and sharing meals together to you?", type: "scale", scaleMax: 5 },
          { id: "dl4p2", text: "What food traditions from your family do you want to carry into your relationship?", type: "text" },
          { id: "dl4p3", text: "How do you handle it when you have different dietary preferences or habits?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Rest & Sleep Habits",
        verse: "He grants sleep to those he loves.",
        verseReference: "Psalm 127:2",
        prompts: [
          { id: "dl5p1", text: "Are you a morning person or a night owl, and how do you think that affects your relationship?", type: "multiple_choice", options: ["Early bird", "Night owl", "Flexible / depends"] },
          { id: "dl5p2", text: "What helps you wind down at the end of the day?", type: "text" },
          { id: "dl5p3", text: "How do you want to handle bedtime routines together as a couple?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Friendships & Social Life",
        verse: "As iron sharpens iron, so one person sharpens another.",
        verseReference: "Proverbs 27:17",
        prompts: [
          { id: "dl6p1", text: "How much time do you each need with friends outside the relationship?", type: "text" },
          { id: "dl6p2", text: "How do you feel about your partner having close friendships with people of the opposite sex?", type: "text" },
          { id: "dl6p3", text: "How should couple friendships (other couples) be prioritized in your social life?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Health & Fitness Together",
        verse: "Do you not know that your bodies are temples of the Holy Spirit?",
        verseReference: "1 Corinthians 6:19",
        prompts: [
          { id: "dl7p1", text: "What role does physical fitness play in your daily life right now?", type: "text" },
          { id: "dl7p2", text: "Would you enjoy working out or exercising together?", type: "yes_no" },
          { id: "dl7p3", text: "How can you support each other in building healthy habits?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Personal Space & Alone Time",
        verse: "But Jesus often withdrew to lonely places and prayed.",
        verseReference: "Luke 5:16",
        prompts: [
          { id: "dl8p1", text: "How much alone time do you need each day to feel recharged?", type: "multiple_choice", options: ["Very little  -  I prefer togetherness", "30 min to 1 hour", "1-2 hours", "Several hours"] },
          { id: "dl8p2", text: "How do you communicate your need for space without hurting your partner?", type: "text" },
          { id: "dl8p3", text: "What does healthy solitude look like in a marriage relationship?", type: "text" },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Work-Life Balance",
        verse: "Unless the LORD builds the house, the builders labor in vain.",
        verseReference: "Psalm 127:1",
        prompts: [
          { id: "dl9p1", text: "How do you currently balance career ambitions with your personal and relationship life?", type: "text" },
          { id: "dl9p2", text: "What would you do if work demands regularly took time away from the relationship?", type: "text" },
          { id: "dl9p3", text: "How important is it to you that both partners prioritize family over career?", type: "scale", scaleMax: 5 },
        ],
      },
      {
        category: "daily-life", language: "en", status: "active",
        title: "Hobbies & Personal Growth",
        verse: "Whatever you do, work at it with all your heart, as working for the Lord.",
        verseReference: "Colossians 3:23",
        prompts: [
          { id: "dl10p1", text: "What hobbies or interests are most important for you to keep as an individual?", type: "text" },
          { id: "dl10p2", text: "Is there a new hobby or skill you would love to learn together?", type: "text" },
          { id: "dl10p3", text: "How do you support each other in personal goals outside the relationship?", type: "text" },
        ],
      },
    ]);

    // ─── Intimacy & Lifestyle ──────────────────────────────────────────────
    await seedCategory("intimacy", [
      {
        category: "intimacy", language: "en", status: "active",
        title: "Understanding Emotional Intimacy",
        verse: "Above all else, guard your heart, for everything you do flows from it.",
        verseReference: "Proverbs 4:23",
        prompts: [
          { id: "in1p1", text: "How do you best feel emotionally close and connected to your partner?", type: "text" },
          { id: "in1p2", text: "How comfortable are you sharing your deepest fears and insecurities?", type: "scale", scaleMax: 5 },
          { id: "in1p3", text: "What helps you feel emotionally safe enough to be fully vulnerable?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Love Languages in Practice",
        verse: "Dear children, let us not love with words or speech but with actions and in truth.",
        verseReference: "1 John 3:18",
        prompts: [
          { id: "in2p1", text: "What is your primary love language and how does it show up in your daily life?", type: "multiple_choice", options: ["Words of affirmation", "Acts of service", "Receiving gifts", "Quality time", "Physical touch"] },
          { id: "in2p2", text: "What does your partner do that makes you feel most loved?", type: "text" },
          { id: "in2p3", text: "When do you feel your love language is being neglected?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Physical Affection",
        verse: "Let him kiss me with the kisses of his mouth, for your love is more delightful than wine.",
        verseReference: "Song of Solomon 1:2",
        prompts: [
          { id: "in3p1", text: "How important is physical affection (hugs, holding hands, etc.) in your daily relationship?", type: "scale", scaleMax: 5 },
          { id: "in3p2", text: "Are there ways you enjoy being touched or shown affection that your partner may not know about?", type: "text" },
          { id: "in3p3", text: "How do you handle differences in your desires for physical closeness?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Spiritual Intimacy",
        verse: "Though one may be overpowered, two can defend themselves. A cord of three strands is not quickly broken.",
        verseReference: "Ecclesiastes 4:12",
        prompts: [
          { id: "in4p1", text: "What spiritual practices help you feel most connected to God and to each other?", type: "multiple_select", options: ["Praying together", "Bible study", "Worship music", "Church attendance", "Serving together", "Devotionals"] },
          { id: "in4p2", text: "How often do you want to pray together as a couple?", type: "multiple_choice", options: ["Daily", "A few times a week", "Weekly", "As needed"] },
          { id: "in4p3", text: "What does keeping God at the center of your relationship look like practically?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Guarding Sexual Purity",
        verse: "Flee from sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body.",
        verseReference: "1 Corinthians 6:18",
        prompts: [
          { id: "in5p1", text: "How do you think couples should set boundaries to guard sexual purity before marriage?", type: "text" },
          { id: "in5p2", text: "What accountability structures help you stay committed to purity?", type: "text" },
          { id: "in5p3", text: "How do you want to handle past mistakes or struggles in this area as a couple?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Quality Time & Presence",
        verse: "Where you go I will go, and where you stay I will stay.",
        verseReference: "Ruth 1:16",
        prompts: [
          { id: "in6p1", text: "What does quality time mean to you  -  what activities make you feel most connected?", type: "text" },
          { id: "in6p2", text: "How often do you need intentional one-on-one time to feel secure in the relationship?", type: "multiple_choice", options: ["Every day", "Several times a week", "Weekly", "As schedules allow"] },
          { id: "in6p3", text: "What gets in the way of quality time most often and how can you address it?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Deep Conversations & Vulnerability",
        verse: "Carry each other burdens, and in this way you will fulfill the law of Christ.",
        verseReference: "Galatians 6:2",
        prompts: [
          { id: "in7p1", text: "What topic do you find hardest to discuss openly with your partner?", type: "text" },
          { id: "in7p2", text: "How do you respond when your partner shares something deeply personal or painful?", type: "text" },
          { id: "in7p3", text: "What would help you feel safer opening up about difficult things?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Celebration & Joy",
        verse: "Rejoice with those who rejoice; mourn with those who mourn.",
        verseReference: "Romans 12:15",
        prompts: [
          { id: "in8p1", text: "How do you like to celebrate wins and milestones together?", type: "text" },
          { id: "in8p2", text: "Do you feel your partner celebrates your achievements in the way that means most to you?", type: "yes_no" },
          { id: "in8p3", text: "What is one area of your partner's life you want to celebrate more intentionally?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Listening & Being Heard",
        verse: "Everyone should be quick to listen, slow to speak and slow to become angry.",
        verseReference: "James 1:19",
        prompts: [
          { id: "in9p1", text: "Do you feel truly heard and understood by your partner in most conversations?", type: "scale", scaleMax: 5 },
          { id: "in9p2", text: "What does active listening look like to you?", type: "text" },
          { id: "in9p3", text: "What is one listening habit you could improve to make your partner feel more valued?", type: "text" },
        ],
      },
      {
        category: "intimacy", language: "en", status: "active",
        title: "Growth Through Seasons",
        verse: "There is a time for everything, and a season for every activity under the heavens.",
        verseReference: "Ecclesiastes 3:1",
        prompts: [
          { id: "in10p1", text: "How has your understanding of intimacy and love grown over the past year?", type: "text" },
          { id: "in10p2", text: "In which season of life do you expect intimacy to be hardest to maintain (newlywed, parenting, career peaks)?", type: "text" },
          { id: "in10p3", text: "What commitment can you make now to nurture intimacy through every season?", type: "text" },
        ],
      },
    ]);

    // ─── Love & Balance ────────────────────────────────────────────────────
    await seedCategory("love-balance", [
      {
        category: "love-balance", language: "en", status: "active",
        title: "Unconditional Love",
        verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
        verseReference: "1 Corinthians 13:4",
        prompts: [
          { id: "lb1p1", text: "What does loving your partner unconditionally look like on a hard day?", type: "text" },
          { id: "lb1p2", text: "Is there a condition you sometimes (even unconsciously) place on your love?", type: "text" },
          { id: "lb1p3", text: "How does God's unconditional love shape how you love your partner?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Selflessness & Sacrifice",
        verse: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves.",
        verseReference: "Philippians 2:3",
        prompts: [
          { id: "lb2p1", text: "In what area of your relationship do you find it hardest to be selfless?", type: "text" },
          { id: "lb2p2", text: "Share a time when your partner made a meaningful sacrifice for you.", type: "text" },
          { id: "lb2p3", text: "How do you make sure that selflessness does not lead to feeling unseen or taken for granted?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Giving & Receiving",
        verse: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over.",
        verseReference: "Luke 6:38",
        prompts: [
          { id: "lb3p1", text: "Are you more naturally a giver or a receiver in the relationship?", type: "multiple_choice", options: ["Mostly a giver", "Mostly a receiver", "Pretty balanced"] },
          { id: "lb3p2", text: "Do you find it easy to receive love and care from your partner graciously?", type: "yes_no" },
          { id: "lb3p3", text: "What is one way your partner gives to you that you deeply appreciate?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Balancing Independence & Togetherness",
        verse: "For this reason a man will leave his father and mother and be united to his wife, and the two will become one flesh.",
        verseReference: "Matthew 19:5",
        prompts: [
          { id: "lb4p1", text: "How do you maintain your individual identity while building a life together?", type: "text" },
          { id: "lb4p2", text: "Do you feel the current balance between independence and togetherness is right?", type: "scale", scaleMax: 5 },
          { id: "lb4p3", text: "What does healthy unity look like without losing who you each are?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Managing Expectations",
        verse: "A longing fulfilled is sweet to the soul.",
        verseReference: "Proverbs 13:19",
        prompts: [
          { id: "lb5p1", text: "What unspoken expectations do you have of your partner that you have never fully communicated?", type: "text" },
          { id: "lb5p2", text: "How do you respond when your expectations go unmet?", type: "text" },
          { id: "lb5p3", text: "How can you communicate needs and expectations more openly?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Forgiveness in Love",
        verse: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
        verseReference: "Ephesians 4:32",
        prompts: [
          { id: "lb6p1", text: "How quickly do you typically forgive your partner after a conflict?", type: "multiple_choice", options: ["Right away", "Within a day", "It takes a few days", "It takes longer"] },
          { id: "lb6p2", text: "Is there anything you have been holding onto that you need to forgive?", type: "text" },
          { id: "lb6p3", text: "What does genuine forgiveness look like versus just moving on?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Acts of Service & Appreciation",
        verse: "For even the Son of Man did not come to be served, but to serve.",
        verseReference: "Mark 10:45",
        prompts: [
          { id: "lb7p1", text: "What acts of service from your partner make you feel most loved and appreciated?", type: "text" },
          { id: "lb7p2", text: "How often do you express gratitude for the small things your partner does?", type: "scale", scaleMax: 5 },
          { id: "lb7p3", text: "What is one act of service you could commit to doing for your partner this week?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Handling Jealousy & Insecurity",
        verse: "Perfect love drives out fear.",
        verseReference: "1 John 4:18",
        prompts: [
          { id: "lb8p1", text: "What situations tend to trigger insecurity or jealousy for you?", type: "text" },
          { id: "lb8p2", text: "How can your partner help you feel more secure without enabling unhealthy behavior?", type: "text" },
          { id: "lb8p3", text: "How does faith help you overcome fear and insecurity in love?", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Encouragement & Affirmation",
        verse: "Therefore encourage one another and build each other up.",
        verseReference: "1 Thessalonians 5:11",
        prompts: [
          { id: "lb9p1", text: "What words of affirmation from your partner mean the most to you?", type: "text" },
          { id: "lb9p2", text: "How often do you intentionally encourage your partner in their faith and calling?", type: "scale", scaleMax: 5 },
          { id: "lb9p3", text: "Write one specific thing you genuinely admire and appreciate about your partner.", type: "text" },
        ],
      },
      {
        category: "love-balance", language: "en", status: "active",
        title: "Growing Love Over Time",
        verse: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.",
        verseReference: "Galatians 6:9",
        prompts: [
          { id: "lb10p1", text: "How do you intentionally keep love growing and not just maintaining the status quo?", type: "text" },
          { id: "lb10p2", text: "What habits or rituals help your love deepen over time?", type: "text" },
          { id: "lb10p3", text: "What does a thriving marriage relationship look like 10 years from now?", type: "text" },
        ],
      },
    ]);

    // ─── Dream Wedding / Dream Home ────────────────────────────────────────
    await seedCategory("dream-wedding", [
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Our Wedding Vision",
        verse: "How beautiful you are, my darling! Oh, how beautiful!",
        verseReference: "Song of Solomon 1:15",
        prompts: [
          { id: "dw1p1", text: "Describe your dream wedding  -  big celebration or intimate gathering?", type: "multiple_choice", options: ["Grand celebration (100+ guests)", "Medium gathering (50-100)", "Intimate ceremony (under 50)", "Elopement / just us"] },
          { id: "dw1p2", text: "What three elements matter most to you on your wedding day?", type: "text" },
          { id: "dw1p3", text: "How important is it that the wedding reflects your faith and values?", type: "scale", scaleMax: 5 },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Wedding Budget & Priorities",
        verse: "Suppose one of you wants to build a tower. Will he not first sit down and estimate the cost?",
        verseReference: "Luke 14:28",
        prompts: [
          { id: "dw2p1", text: "How much do you think a couple should spend on a wedding?", type: "multiple_choice", options: ["Under $5,000", "$5,000-$15,000", "$15,000-$30,000", "$30,000+", "Whatever it takes"] },
          { id: "dw2p2", text: "Which wedding expense would you not be willing to cut back on?", type: "text" },
          { id: "dw2p3", text: "How should family financial contributions affect wedding decisions?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Ceremony & Vows",
        verse: "What God has joined together, let no one separate.",
        verseReference: "Matthew 19:6",
        prompts: [
          { id: "dw3p1", text: "Do you want to write your own vows or use traditional vows?", type: "multiple_choice", options: ["Write our own", "Traditional vows", "A mix of both"] },
          { id: "dw3p2", text: "What Scripture passages are most meaningful to you for a wedding ceremony?", type: "text" },
          { id: "dw3p3", text: "What role do you want prayer and faith to play in your ceremony?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Our Dream Home",
        verse: "By wisdom a house is built, and through understanding it is established.",
        verseReference: "Proverbs 24:3",
        prompts: [
          { id: "dw4p1", text: "Describe your dream home  -  where and what type?", type: "text" },
          { id: "dw4p2", text: "City or suburbs, house or apartment  -  what is your ideal living situation?", type: "multiple_choice", options: ["City apartment", "Suburban house", "Rural / countryside", "Townhouse", "Open to anything"] },
          { id: "dw4p3", text: "How soon after marriage do you hope to own a home?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Creating a Home Environment",
        verse: "As for me and my household, we will serve the LORD.",
        verseReference: "Joshua 24:15",
        prompts: [
          { id: "dw5p1", text: "What values or atmosphere do you want your home to carry?", type: "multiple_select", options: ["Peaceful & calm", "Welcoming & hospitable", "Faith-centered", "Fun & lively", "Creative & artistic", "Orderly & structured"] },
          { id: "dw5p2", text: "How important is hospitality  -  opening your home to others  -  to you?", type: "scale", scaleMax: 5 },
          { id: "dw5p3", text: "What spiritual practices do you want to be part of your home culture (prayer, Bible reading, worship)?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Honeymoon Dreams",
        verse: "He has taken me to the banquet hall, and his banner over me is love.",
        verseReference: "Song of Solomon 2:4",
        prompts: [
          { id: "dw6p1", text: "Where would your dream honeymoon destination be?", type: "text" },
          { id: "dw6p2", text: "What kind of honeymoon experience do you want  -  adventure, relaxation, or exploring culture?", type: "multiple_choice", options: ["Relaxing on a beach", "Exploring a new city", "Adventure & nature", "A mix of all three"] },
          { id: "dw6p3", text: "How important is it to start your marriage with a special getaway together?", type: "scale", scaleMax: 5 },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Family Involvement in Wedding Planning",
        verse: "Honor your father and your mother.",
        verseReference: "Exodus 20:12",
        prompts: [
          { id: "dw7p1", text: "How much input should each partner's family have in wedding decisions?", type: "multiple_choice", options: ["Full involvement", "Consulted but not deciding", "Minimal involvement", "We decide, they attend"] },
          { id: "dw7p2", text: "Which family traditions are important to incorporate into your wedding?", type: "text" },
          { id: "dw7p3", text: "How will you handle disagreements between your families over wedding choices?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Decorating & Nesting Together",
        verse: "She gets up while it is still night; she provides food for her family.",
        verseReference: "Proverbs 31:15",
        prompts: [
          { id: "dw8p1", text: "How would you describe your ideal home decor style?", type: "multiple_choice", options: ["Modern & minimalist", "Cozy & warm", "Rustic & natural", "Bold & eclectic", "Classic & traditional"] },
          { id: "dw8p2", text: "How will you make joint decisions about furnishing and decorating your shared space?", type: "text" },
          { id: "dw8p3", text: "What is one item or element that is non-negotiable in your future home?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "Marriage Preparation",
        verse: "Plans fail for lack of counsel, but with many advisers they succeed.",
        verseReference: "Proverbs 15:22",
        prompts: [
          { id: "dw9p1", text: "Have you or would you do premarital counseling together?", type: "yes_no" },
          { id: "dw9p2", text: "What topics do you most want to discuss with a pastor or counselor before marriage?", type: "text" },
          { id: "dw9p3", text: "What books or resources about marriage have shaped your expectations?", type: "text" },
        ],
      },
      {
        category: "dream-wedding", language: "en", status: "active",
        title: "The First Year of Marriage",
        verse: "If a man has recently married, he must not be sent to war or have any other duty laid on him. For one year he is to be free to stay at home and bring happiness to the wife he has married.",
        verseReference: "Deuteronomy 24:5",
        prompts: [
          { id: "dw10p1", text: "What are your biggest hopes for your first year of marriage?", type: "text" },
          { id: "dw10p2", text: "What challenges do you anticipate in the adjustment to married life?", type: "text" },
          { id: "dw10p3", text: "What rhythms or habits do you want to establish in the very first month of marriage?", type: "text" },
        ],
      },
    ]);

    // ─── Relationship Boundaries ───────────────────────────────────────────
    await seedCategory("boundaries", [
      {
        category: "boundaries", language: "en", status: "active",
        title: "What Are Healthy Boundaries?",
        verse: "Above all else, guard your heart, for everything you do flows from it.",
        verseReference: "Proverbs 4:23",
        prompts: [
          { id: "bo1p1", text: "In your own words, what does a healthy relationship boundary mean to you?", type: "text" },
          { id: "bo1p2", text: "Do you feel comfortable setting and communicating personal boundaries?", type: "scale", scaleMax: 5 },
          { id: "bo1p3", text: "What area of your life needs the clearest boundaries right now?", type: "multiple_choice", options: ["Friendships", "Work & career", "Family", "Social media", "Personal time", "Finances"] },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Boundaries With Exes",
        verse: "Flee the evil desires of youth and pursue righteousness, faith, love and peace.",
        verseReference: "2 Timothy 2:22",
        prompts: [
          { id: "bo2p1", text: "Do you think it is appropriate to maintain friendships with ex-partners while in a committed relationship?", type: "text" },
          { id: "bo2p2", text: "What level of contact with a former partner would you consider a boundary violation?", type: "text" },
          { id: "bo2p3", text: "How do you want to handle social media connections with past relationships?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Emotional Boundaries",
        verse: "Each one should carry their own load.",
        verseReference: "Galatians 6:5",
        prompts: [
          { id: "bo3p1", text: "Is there a pattern of over-relying on your partner emotionally that could become unhealthy?", type: "text" },
          { id: "bo3p2", text: "How do you distinguish between healthy support and emotional dependency?", type: "text" },
          { id: "bo3p3", text: "What outside support systems (friends, counselor, faith community) help you carry your emotional load?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Digital Privacy",
        verse: "Whatever is true, whatever is noble... think about such things.",
        verseReference: "Philippians 4:8",
        prompts: [
          { id: "bo4p1", text: "Do you believe couples should share phone passwords and have full access to each other's devices?", type: "multiple_choice", options: ["Yes, full transparency", "Optional but available", "No, privacy is important", "It depends on the situation"] },
          { id: "bo4p2", text: "How do you handle private conversations with friends that your partner is not part of?", type: "text" },
          { id: "bo4p3", text: "What boundaries around digital communication would make you both feel secure and respected?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Physical Boundaries Before Marriage",
        verse: "It is God's will that you should be sanctified: that you should avoid sexual immorality.",
        verseReference: "1 Thessalonians 4:3",
        prompts: [
          { id: "bo5p1", text: "What specific physical boundaries are you committing to honor before marriage?", type: "text" },
          { id: "bo5p2", text: "How will you hold each other accountable to those commitments?", type: "text" },
          { id: "bo5p3", text: "What situations or environments do you need to avoid to protect your boundaries?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Boundaries With Family",
        verse: "For this reason a man will leave his father and mother and be united to his wife.",
        verseReference: "Genesis 2:24",
        prompts: [
          { id: "bo6p1", text: "In what ways could family members overstep into your relationship, and how would you handle it?", type: "text" },
          { id: "bo6p2", text: "How do you balance honoring parents while building your own independent relationship?", type: "text" },
          { id: "bo6p3", text: "Are there family patterns or dynamics you want to intentionally leave behind?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Work Boundaries",
        verse: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.",
        verseReference: "Romans 12:2",
        prompts: [
          { id: "bo7p1", text: "How do you prevent work stress and demands from spilling into your relationship?", type: "text" },
          { id: "bo7p2", text: "What is an acceptable work schedule that still protects your relationship?", type: "text" },
          { id: "bo7p3", text: "Should a career opportunity that requires significant sacrifice from your partner require their agreement?", type: "yes_no" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Social Media Boundaries",
        verse: "I will not look with approval on anything that is vile.",
        verseReference: "Psalm 101:3",
        prompts: [
          { id: "bo8p1", text: "Are there types of content or accounts that you think couples should avoid following online?", type: "text" },
          { id: "bo8p2", text: "How much of your relationship should you share publicly on social media?", type: "multiple_choice", options: ["Everything  -  we are open books", "Highlights only", "Very little", "Nothing"] },
          { id: "bo8p3", text: "How would you address it if your partner posted something online that made you uncomfortable?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Alone Time With Opposite Sex",
        verse: "Abstain from all appearance of evil.",
        verseReference: "1 Thessalonians 5:22",
        prompts: [
          { id: "bo9p1", text: "Do you think it is appropriate to meet alone with a close friend of the opposite sex?", type: "multiple_choice", options: ["Yes, trust matters more", "Only in public places", "No, it creates unnecessary risk", "Depends on the friendship"] },
          { id: "bo9p2", text: "What boundaries would help you both feel secure around opposite-sex friendships?", type: "text" },
          { id: "bo9p3", text: "How do you guard your heart in workplace relationships with the opposite sex?", type: "text" },
        ],
      },
      {
        category: "boundaries", language: "en", status: "active",
        title: "Respecting Each Other's Boundaries",
        verse: "Do to others as you would have them do to you.",
        verseReference: "Luke 6:31",
        prompts: [
          { id: "bo10p1", text: "How do you respond when your partner sets a boundary that feels restrictive to you?", type: "text" },
          { id: "bo10p2", text: "Have you ever pushed past a boundary your partner set? How did you handle it?", type: "text" },
          { id: "bo10p3", text: "What does it look like to honor your partner's boundaries as an act of love?", type: "text" },
        ],
      },
    ]);

    // ─── Trust & Truth ─────────────────────────────────────────────────────
    await seedCategory("trust", [
      {
        category: "trust", language: "en", status: "active",
        title: "Building Trust From Day One",
        verse: "Love... rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.",
        verseReference: "1 Corinthians 13:6-7",
        prompts: [
          { id: "tr1p1", text: "What actions build trust with you most quickly?", type: "multiple_select", options: ["Keeping promises", "Being consistent", "Full honesty", "Following through on plans", "Being on time", "Sharing emotions"] },
          { id: "tr1p2", text: "How long does it take you to fully trust someone in a relationship?", type: "text" },
          { id: "tr1p3", text: "What has your past experience taught you about trusting people?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Honesty Even When It Hurts",
        verse: "Instead, speaking the truth in love, we will grow to become in every respect the mature body of him who is the head, that is, Christ.",
        verseReference: "Ephesians 4:15",
        prompts: [
          { id: "tr2p1", text: "Do you believe total honesty is always the right approach in a relationship?", type: "yes_no" },
          { id: "tr2p2", text: "Describe a situation where you chose honesty even though it was difficult.", type: "text" },
          { id: "tr2p3", text: "How do you want your partner to deliver hard truths to you?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Transparency & Openness",
        verse: "Nothing in all creation is hidden from God's sight. Everything is uncovered and laid bare before the eyes of him to whom we must give account.",
        verseReference: "Hebrews 4:13",
        prompts: [
          { id: "tr3p1", text: "How transparent do you feel you currently are with your partner?", type: "scale", scaleMax: 5 },
          { id: "tr3p2", text: "Is there anything you have been hesitant to share with your partner that you know you should?", type: "text" },
          { id: "tr3p3", text: "What does radical transparency look like in a healthy relationship?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "When Trust Is Broken",
        verse: "Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.",
        verseReference: "Colossians 3:13",
        prompts: [
          { id: "tr4p1", text: "Have you ever had your trust broken in a significant relationship? How did it affect you?", type: "text" },
          { id: "tr4p2", text: "What would it take for you to trust your partner again after a betrayal?", type: "text" },
          { id: "tr4p3", text: "What specific actions would demonstrate that trust has been genuinely rebuilt?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Secrets & Hidden Things",
        verse: "For there is nothing hidden that will not be disclosed, and nothing concealed that will not be known or brought out into the open.",
        verseReference: "Luke 8:17",
        prompts: [
          { id: "tr5p1", text: "Do you believe that keeping secrets from your partner (even small ones) is harmful?", type: "text" },
          { id: "tr5p2", text: "Is there a past secret or hidden struggle you believe your partner should know about?", type: "text" },
          { id: "tr5p3", text: "How do you create an environment where both of you feel safe enough to confess hard things?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Jealousy & Suspicion",
        verse: "Love... keeps no record of wrongs.",
        verseReference: "1 Corinthians 13:5",
        prompts: [
          { id: "tr6p1", text: "What triggers feelings of jealousy or suspicion for you in a relationship?", type: "text" },
          { id: "tr6p2", text: "How do you communicate jealousy without it becoming controlling or accusatory?", type: "text" },
          { id: "tr6p3", text: "What would help you feel more secure and less prone to suspicion?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Keeping Your Word",
        verse: "All you need to say is simply yes or no; anything beyond this comes from the evil one.",
        verseReference: "Matthew 5:37",
        prompts: [
          { id: "tr7p1", text: "How seriously do you take promises made to your partner?", type: "scale", scaleMax: 5 },
          { id: "tr7p2", text: "What happens in your relationship when a commitment is not kept?", type: "text" },
          { id: "tr7p3", text: "What is one promise you want to make to your partner today?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Financial Honesty",
        verse: "Whoever can be trusted with very little can also be trusted with much.",
        verseReference: "Luke 16:10",
        prompts: [
          { id: "tr8p1", text: "Are you fully honest with your partner about your financial situation, including debt?", type: "yes_no" },
          { id: "tr8p2", text: "Have you ever hidden a purchase or financial decision from your partner? What happened?", type: "text" },
          { id: "tr8p3", text: "What financial information do you think couples should share fully and openly?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Accountability Together",
        verse: "Confess your sins to each other and pray for each other so that you may be healed.",
        verseReference: "James 5:16",
        prompts: [
          { id: "tr9p1", text: "Do you have an accountability partner outside your relationship for areas of personal struggle?", type: "yes_no" },
          { id: "tr9p2", text: "How comfortable are you with your partner holding you accountable in areas of weakness?", type: "scale", scaleMax: 5 },
          { id: "tr9p3", text: "What does loving accountability look like without tipping into control or judgment?", type: "text" },
        ],
      },
      {
        category: "trust", language: "en", status: "active",
        title: "Trusting God Together",
        verse: "Trust in the LORD with all your heart and lean not on your own understanding.",
        verseReference: "Proverbs 3:5",
        prompts: [
          { id: "tr10p1", text: "How has trusting God shaped the way you trust others?", type: "text" },
          { id: "tr10p2", text: "In what area of your relationship do you need to practice trusting God more?", type: "text" },
          { id: "tr10p3", text: "How can you pray together specifically about trust in your relationship?", type: "text" },
        ],
      },
    ]);

    // ─── Finance & Goals ───────────────────────────────────────────────────
    await seedCategory("finance", [
      {
        category: "finance", language: "en", status: "active",
        title: "Money Mindsets",
        verse: "For the love of money is a root of all kinds of evil.",
        verseReference: "1 Timothy 6:10",
        prompts: [
          { id: "fi1p1", text: "How did your family handle money when you were growing up, and how has that shaped you?", type: "text" },
          { id: "fi1p2", text: "Do you consider yourself a spender or a saver?", type: "multiple_choice", options: ["Natural spender", "Natural saver", "Balanced", "It depends"] },
          { id: "fi1p3", text: "What is your biggest financial fear and where do you think it comes from?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Budgeting as a Team",
        verse: "The plans of the diligent lead to profit as surely as haste leads to poverty.",
        verseReference: "Proverbs 21:5",
        prompts: [
          { id: "fi2p1", text: "Do you currently use a budget? How do you feel about budgeting?", type: "text" },
          { id: "fi2p2", text: "How should a couple manage money  -  joint account, separate, or both?", type: "multiple_choice", options: ["Fully joint", "Fully separate", "Joint for shared expenses, separate for personal", "Flexible"] },
          { id: "fi2p3", text: "What is a purchase amount that you think requires mutual agreement before spending?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Giving & Generosity",
        verse: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
        verseReference: "2 Corinthians 9:7",
        prompts: [
          { id: "fi3p1", text: "Do you tithe or give regularly to your church or charity?", type: "yes_no" },
          { id: "fi3p2", text: "How much of your income do you believe a couple should give away?", type: "multiple_choice", options: ["10% (tithe)", "More than 10%", "Less than 10%", "Whatever feels right"] },
          { id: "fi3p3", text: "How should a couple decide where and how much to give?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Debt & Financial Baggage",
        verse: "The rich rule over the poor, and the borrower is slave to the lender.",
        verseReference: "Proverbs 22:7",
        prompts: [
          { id: "fi4p1", text: "What debt are you currently carrying and how are you addressing it?", type: "text" },
          { id: "fi4p2", text: "How do you feel about entering marriage with student loans, credit card debt, or other liabilities?", type: "text" },
          { id: "fi4p3", text: "What is your plan to become debt-free, and how does your partner fit into that?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Saving & Emergency Funds",
        verse: "Go to the ant, you sluggard; consider its ways and be wise! It stores its provisions in summer and gathers its food at harvest.",
        verseReference: "Proverbs 6:6-8",
        prompts: [
          { id: "fi5p1", text: "Do you have an emergency fund, and how many months of expenses does it cover?", type: "multiple_choice", options: ["No emergency fund yet", "1 month", "3 months", "6+ months"] },
          { id: "fi5p2", text: "How much of your income do you think should go to savings each month?", type: "text" },
          { id: "fi5p3", text: "What are you currently saving toward as a couple?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Career & Income Goals",
        verse: "Commit to the LORD whatever you do, and he will establish your plans.",
        verseReference: "Proverbs 16:3",
        prompts: [
          { id: "fi6p1", text: "What are your income goals for the next 5 years?", type: "text" },
          { id: "fi6p2", text: "How should dual-income situations be managed  -  equal contribution or proportional?", type: "multiple_choice", options: ["Equal split always", "Proportional to income", "Whoever earns more covers more", "Discussed case by case"] },
          { id: "fi6p3", text: "What would you do if one partner needed to stop working for a season (illness, children, calling)?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Contentment & Lifestyle",
        verse: "Godliness with contentment is great gain.",
        verseReference: "1 Timothy 6:6",
        prompts: [
          { id: "fi7p1", text: "Are you content with your current financial situation, or are you striving for more?", type: "text" },
          { id: "fi7p2", text: "How do you guard against lifestyle inflation as your income grows?", type: "text" },
          { id: "fi7p3", text: "What does a financially content and faith-filled life look like for you?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Investing in the Future",
        verse: "A good person leaves an inheritance for their children's children.",
        verseReference: "Proverbs 13:22",
        prompts: [
          { id: "fi8p1", text: "Are you currently investing for retirement or long-term financial goals?", type: "yes_no" },
          { id: "fi8p2", text: "What legacy do you want to leave financially for your children or community?", type: "text" },
          { id: "fi8p3", text: "How can you start building wealth in a way that honors God and serves others?", type: "text" },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Financial Goals as a Couple",
        verse: "Where there is no vision, the people perish.",
        verseReference: "Proverbs 29:18",
        prompts: [
          { id: "fi9p1", text: "What are your top three shared financial goals as a couple?", type: "text" },
          { id: "fi9p2", text: "By when do you hope to achieve your most important financial milestone?", type: "text" },
          { id: "fi9p3", text: "How often should you review your financial goals and progress together?", type: "multiple_choice", options: ["Monthly", "Quarterly", "Twice a year", "Annually"] },
        ],
      },
      {
        category: "finance", language: "en", status: "active",
        title: "Kingdom Economics",
        verse: "Seek first his kingdom and his righteousness, and all these things will be given to you as well.",
        verseReference: "Matthew 6:33",
        prompts: [
          { id: "fi10p1", text: "How does putting God first practically change how you manage money?", type: "text" },
          { id: "fi10p2", text: "Have you ever experienced God's provision in an unexpected way? Share the story.", type: "text" },
          { id: "fi10p3", text: "What would it look like to run your household finances as if God were your CFO?", type: "text" },
        ],
      },
    ]);

    // ─── Bible Convictions ─────────────────────────────────────────────────
    await seedCategory("bible", [
      {
        category: "bible", language: "en", status: "active",
        title: "The Word as Your Foundation",
        verse: "Your word is a lamp for my feet, a light on my path.",
        verseReference: "Psalm 119:105",
        prompts: [
          { id: "bi1p1", text: "How regularly do you read the Bible, and what does that look like in your daily life?", type: "multiple_choice", options: ["Daily", "Several times a week", "Weekly", "Occasionally"] },
          { id: "bi1p2", text: "What book of the Bible has shaped your life most and why?", type: "text" },
          { id: "bi1p3", text: "How do you want the Bible to influence your relationship and future home?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Studying Scripture Together",
        verse: "Let the word of Christ dwell in you richly as you teach and admonish one another with all wisdom.",
        verseReference: "Colossians 3:16",
        prompts: [
          { id: "bi2p1", text: "Have you ever studied the Bible together? What was that experience like?", type: "text" },
          { id: "bi2p2", text: "What format of Bible study works best for you as a couple?", type: "multiple_choice", options: ["Devotional book together", "Same chapter daily", "Bible app plan", "Church-based study", "We have not tried yet"] },
          { id: "bi2p3", text: "What topic would you most want to study from Scripture together right now?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Convictions on Marriage",
        verse: "Husbands, love your wives, just as Christ loved the church and gave himself up for her.",
        verseReference: "Ephesians 5:25",
        prompts: [
          { id: "bi3p1", text: "What does Scripture teach about the roles of husband and wife, and how do you interpret it?", type: "text" },
          { id: "bi3p2", text: "How do you understand the concept of mutual submission in Ephesians 5?", type: "text" },
          { id: "bi3p3", text: "Which aspect of the biblical vision of marriage most excites and challenges you?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Prayer Life & Spiritual Discipline",
        verse: "Pray continually.",
        verseReference: "1 Thessalonians 5:17",
        prompts: [
          { id: "bi4p1", text: "What does your personal prayer life look like right now?", type: "text" },
          { id: "bi4p2", text: "How comfortable are you praying out loud with your partner?", type: "scale", scaleMax: 5 },
          { id: "bi4p3", text: "What spiritual disciplines (fasting, journaling, silence, Scripture memory) do you practice?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Church Commitment",
        verse: "Let us not give up meeting together, as some are in the habit of doing, but let us encourage one another.",
        verseReference: "Hebrews 10:25",
        prompts: [
          { id: "bi5p1", text: "How important is regular church attendance and community to you?", type: "scale", scaleMax: 5 },
          { id: "bi5p2", text: "What would your ideal local church look like?", type: "text" },
          { id: "bi5p3", text: "How will you handle it if you and your partner prefer different churches or worship styles?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Faith & Doubt",
        verse: "I do believe; help me overcome my unbelief!",
        verseReference: "Mark 9:24",
        prompts: [
          { id: "bi6p1", text: "Have you ever experienced a season of serious doubt? How did you get through it?", type: "text" },
          { id: "bi6p2", text: "How do you want your partner to support you through spiritual valleys or doubts?", type: "text" },
          { id: "bi6p3", text: "What strengthens your faith most during hard seasons?", type: "multiple_select", options: ["Prayer", "Scripture", "Community", "Worship music", "Nature", "Testimony of others"] },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Serving & Calling",
        verse: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
        verseReference: "Ephesians 2:10",
        prompts: [
          { id: "bi7p1", text: "What do you believe God has uniquely called you to do with your life?", type: "text" },
          { id: "bi7p2", text: "How can your relationship multiply your impact for God's kingdom?", type: "text" },
          { id: "bi7p3", text: "What ministry or serving opportunity do you feel drawn to as a couple?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Convictions on Moral Issues",
        verse: "Do not be conformed to this world, but be transformed by the renewal of your mind.",
        verseReference: "Romans 12:2",
        prompts: [
          { id: "bi8p1", text: "What are your strongest biblical convictions on a cultural or social issue, and how do you hold that conviction with grace?", type: "text" },
          { id: "bi8p2", text: "How do you approach engaging with people who hold different moral views?", type: "text" },
          { id: "bi8p3", text: "In what area do you feel your convictions have grown or changed in recent years?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Passing Faith to the Next Generation",
        verse: "Train up a child in the way he should go; even when he is old he will not depart from it.",
        verseReference: "Proverbs 22:6",
        prompts: [
          { id: "bi9p1", text: "How do you plan to raise children in the faith?", type: "text" },
          { id: "bi9p2", text: "What faith traditions or practices from your upbringing do you want to continue?", type: "text" },
          { id: "bi9p3", text: "What would you do if your child grows up and walks away from faith?", type: "text" },
        ],
      },
      {
        category: "bible", language: "en", status: "active",
        title: "Living by Faith, Not Fear",
        verse: "For God has not given us a spirit of fear, but of power, love, and a sound mind.",
        verseReference: "2 Timothy 1:7",
        prompts: [
          { id: "bi10p1", text: "In what area of your life are you currently operating out of fear rather than faith?", type: "text" },
          { id: "bi10p2", text: "How can you and your partner encourage each other to take bold steps of faith?", type: "text" },
          { id: "bi10p3", text: "What is one step of faith God is calling your relationship to take right now?", type: "text" },
        ],
      },
    ]);

    // ─── Kids & Future ─────────────────────────────────────────────────────
    await seedCategory("kids-future", [
      {
        category: "kids-future", language: "en", status: "active",
        title: "Do We Want Children?",
        verse: "Children are a heritage from the LORD, offspring a reward from him.",
        verseReference: "Psalm 127:3",
        prompts: [
          { id: "kf1p1", text: "Do you want to have children, and if so, how many?", type: "multiple_choice", options: ["1 child", "2-3 children", "4+ children", "Not sure yet", "No children"] },
          { id: "kf1p2", text: "When in your relationship do you hope to have your first child?", type: "text" },
          { id: "kf1p3", text: "How do you feel about adoption or fostering as part of your family plan?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Parenting Philosophy",
        verse: "Fathers, do not exasperate your children; instead, bring them up in the training and instruction of the Lord.",
        verseReference: "Ephesians 6:4",
        prompts: [
          { id: "kf2p1", text: "How would you describe your parenting philosophy?", type: "multiple_choice", options: ["Authoritative (warm & structured)", "Gentle & permissive", "Faith-first", "Grace-based", "Still figuring it out"] },
          { id: "kf2p2", text: "How was discipline handled in your childhood home, and how will yours differ or be similar?", type: "text" },
          { id: "kf2p3", text: "What is the most important thing you want to teach your children?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Work & Family Balance With Kids",
        verse: "Whatever you do, work heartily, as for the Lord and not for men.",
        verseReference: "Colossians 3:23",
        prompts: [
          { id: "kf3p1", text: "After having children, do you expect both partners to continue working full-time?", type: "multiple_choice", options: ["Yes, both full-time", "One stays home", "Flexible, TBD", "Work from home solution"] },
          { id: "kf3p2", text: "How will childcare be handled  -  family, daycare, one parent at home?", type: "text" },
          { id: "kf3p3", text: "How will you protect your marriage relationship after children arrive?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Raising Children in Faith",
        verse: "Start children off on the way they should go, and even when they are old they will not turn from it.",
        verseReference: "Proverbs 22:6",
        prompts: [
          { id: "kf4p1", text: "What does raising children in Christian faith look like practically in your home?", type: "text" },
          { id: "kf4p2", text: "Will you have family devotions, bedtime prayers, or other faith practices?", type: "text" },
          { id: "kf4p3", text: "How will you allow your children to develop their own personal faith rather than just inheriting yours?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Education Choices",
        verse: "The heart of the discerning acquires knowledge, for the ears of the wise seek it out.",
        verseReference: "Proverbs 18:15",
        prompts: [
          { id: "kf5p1", text: "What type of education do you envision for your children?", type: "multiple_choice", options: ["Public school", "Private / Christian school", "Homeschooling", "A mix depending on the child", "Open to all options"] },
          { id: "kf5p2", text: "How important is a faith-based school environment to you?", type: "scale", scaleMax: 5 },
          { id: "kf5p3", text: "How will you be involved in your children's education beyond the classroom?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Long-Term Vision as a Family",
        verse: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.",
        verseReference: "Jeremiah 29:11",
        prompts: [
          { id: "kf6p1", text: "Describe your family life 15 years from now  -  what does it look like?", type: "text" },
          { id: "kf6p2", text: "What legacy do you want to leave for your children and grandchildren?", type: "text" },
          { id: "kf6p3", text: "What family traditions do you want to establish that your children will carry forward?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Health & Wellbeing of Children",
        verse: "Dear friend, I pray that you may enjoy good health and that all may go well with you.",
        verseReference: "3 John 1:2",
        prompts: [
          { id: "kf7p1", text: "What does holistic health (physical, emotional, spiritual) look like for children in your home?", type: "text" },
          { id: "kf7p2", text: "How will you address mental health and emotional wellbeing with your children?", type: "text" },
          { id: "kf7p3", text: "How will you navigate it if your child faces serious health challenges?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Cultural & Ethnic Identity",
        verse: "From one man he made all the nations, that they should inhabit the whole earth.",
        verseReference: "Acts 17:26",
        prompts: [
          { id: "kf8p1", text: "How important is it to pass your cultural heritage and language to your children?", type: "scale", scaleMax: 5 },
          { id: "kf8p2", text: "If you are from different cultural backgrounds, how will you honor both in your home?", type: "text" },
          { id: "kf8p3", text: "What specific cultural traditions or values do you want your children to know and keep?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Handling Infertility or Unexpected Outcomes",
        verse: "But those who hope in the LORD will renew their strength.",
        verseReference: "Isaiah 40:31",
        prompts: [
          { id: "kf9p1", text: "How would you emotionally and spiritually cope if having biological children was not possible?", type: "text" },
          { id: "kf9p2", text: "How do you feel about fertility treatments, surrogacy, or adoption as alternatives?", type: "text" },
          { id: "kf9p3", text: "How can your faith sustain you both through unexpected outcomes in family planning?", type: "text" },
        ],
      },
      {
        category: "kids-future", language: "en", status: "active",
        title: "Setting Goals for Your Future",
        verse: "The heart of man plans his way, but the LORD establishes his steps.",
        verseReference: "Proverbs 16:9",
        prompts: [
          { id: "kf10p1", text: "What are your biggest personal goals for the next 5 years?", type: "text" },
          { id: "kf10p2", text: "What shared goal as a couple excites you most right now?", type: "text" },
          { id: "kf10p3", text: "How do you keep God at the center of your future plans rather than just planning and asking for His blessing?", type: "text" },
        ],
      },
    ]);

    // ─── Family Relations ──────────────────────────────────────────────────
    await seedCategory("family", [
      {
        category: "family", language: "en", status: "active",
        title: "Leaving & Cleaving",
        verse: "That is why a man leaves his father and mother and is united to his wife, and they become one flesh.",
        verseReference: "Genesis 2:24",
        prompts: [
          { id: "fa1p1", text: "What does leaving your family of origin to build your own look like practically?", type: "text" },
          { id: "fa1p2", text: "Do you feel emotionally and relationally independent from your parents?", type: "scale", scaleMax: 5 },
          { id: "fa1p3", text: "Are there ways your family of origin currently has more influence on your decisions than your partner?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "In-Law Relationships",
        verse: "Honor your father and your mother, so that you may live long in the land.",
        verseReference: "Exodus 20:12",
        prompts: [
          { id: "fa2p1", text: "How do you currently relate to your partner's family, and what dynamics do you notice?", type: "text" },
          { id: "fa2p2", text: "How much involvement do you want from each family in your married life?", type: "multiple_choice", options: ["Very involved  -  extended family is everything", "Close but with clear boundaries", "Mostly independent", "Minimal involvement"] },
          { id: "fa2p3", text: "How will you handle it when your partner and your family members do not get along?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Holidays & Family Traditions",
        verse: "In the fear of the LORD one has strong confidence, and his children will have a refuge.",
        verseReference: "Proverbs 14:26",
        prompts: [
          { id: "fa3p1", text: "How will you divide holidays between your families once you are married?", type: "multiple_choice", options: ["Alternate each year", "Split the day", "Create our own traditions", "Visit both"] },
          { id: "fa3p2", text: "Which family tradition from your childhood is most meaningful and non-negotiable to you?", type: "text" },
          { id: "fa3p3", text: "What new traditions do you want to start together as your own family?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Conflict With Extended Family",
        verse: "If it is possible, as far as it depends on you, live at peace with everyone.",
        verseReference: "Romans 12:18",
        prompts: [
          { id: "fa4p1", text: "How do you handle conflict with family members, and what is your default approach?", type: "text" },
          { id: "fa4p2", text: "How will you protect your relationship when extended family creates tension or drama?", type: "text" },
          { id: "fa4p3", text: "What does peacekeeping without people-pleasing look like in family relationships?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Caring for Aging Parents",
        verse: "But if a widow has children or grandchildren, these should learn first of all to put their religion into practice by caring for their own family.",
        verseReference: "1 Timothy 5:4",
        prompts: [
          { id: "fa5p1", text: "What are your expectations around caring for elderly parents as they age?", type: "text" },
          { id: "fa5p2", text: "Would you be open to a parent moving in with you if needed?", type: "yes_no" },
          { id: "fa5p3", text: "How will you balance your marriage and your responsibilities to aging parents?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Siblings & Family Dynamics",
        verse: "How good and pleasant it is when God's people live together in unity!",
        verseReference: "Psalm 133:1",
        prompts: [
          { id: "fa6p1", text: "What role do your siblings play in your life, and how do you see that continuing?", type: "text" },
          { id: "fa6p2", text: "Are there family members whose influence on you has been unhealthy, and how are you navigating that?", type: "text" },
          { id: "fa6p3", text: "How do you want your partner to relate to your siblings and vice versa?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Family Financial Requests",
        verse: "No one can serve two masters. Either you will hate the one and love the other.",
        verseReference: "Matthew 6:24",
        prompts: [
          { id: "fa7p1", text: "How do you handle financial requests or expectations from family members?", type: "text" },
          { id: "fa7p2", text: "Should financial gifts to family members be joint decisions?", type: "yes_no" },
          { id: "fa7p3", text: "What boundaries do you need to set around giving or lending money to family?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Blended Family Considerations",
        verse: "I can do all this through him who gives me strength.",
        verseReference: "Philippians 4:13",
        prompts: [
          { id: "fa8p1", text: "If either partner has children from a previous relationship, what challenges do you anticipate?", type: "text" },
          { id: "fa8p2", text: "How will roles and authority work in a blended family situation?", type: "text" },
          { id: "fa8p3", text: "What does God's redemptive grace mean for blended families?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Your Family's Spiritual Legacy",
        verse: "We will tell the next generation the praiseworthy deeds of the LORD, his power, and the wonders he has done.",
        verseReference: "Psalm 78:4",
        prompts: [
          { id: "fa9p1", text: "What is the spiritual legacy your family of origin passed on to you?", type: "text" },
          { id: "fa9p2", text: "What generational patterns of faith do you want to continue and strengthen?", type: "text" },
          { id: "fa9p3", text: "What generational wounds or broken patterns do you want God to heal and stop with your generation?", type: "text" },
        ],
      },
      {
        category: "family", language: "en", status: "active",
        title: "Building Your Own Identity as a Couple",
        verse: "So they are no longer two, but one flesh.",
        verseReference: "Matthew 19:6",
        prompts: [
          { id: "fa10p1", text: "What does it look like to function as a united couple when facing family pressure?", type: "text" },
          { id: "fa10p2", text: "How do you build loyalty to each other without dishonoring your families?", type: "text" },
          { id: "fa10p3", text: "What is one specific way you can show your family that your partner is your first human priority?", type: "text" },
        ],
      },
    ]);

    console.log("All Q&A categories seeded successfully.");
  } catch (error) {
    console.error("Failed to seed category questions:", error);
  }
}
