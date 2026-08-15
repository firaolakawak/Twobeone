// Internationalization utility for TwoBeOne
// Supports English and Amharic (አማርኛ)

export type Language = 'en' | 'am' | 'om';

export interface Translations {
  // Common
  common: {
    welcome: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    share: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    yes: string;
    no: string;
    ok: string;
    error: string;
    success: string;
    today: string;
    yesterday: string;
    tomorrow: string;
  };

  // Navigation
  nav: {
    home: string;
    devotions: string;
    journal: string;
    prayer: string;
    questions: string;
    profile: string;
    settings: string;
    bible: string;
    community: string;
  };

  // Auth
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    forgotPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    enterEmail: string;
    enterPassword: string;
    enterName: string;
    passwordMismatch: string;
    invalidEmail: string;
    weakPassword: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    growingTogetherInFaith: string;
    daysTogether: string;
    devotionalStreak: string;
    journalEntries: string;
    prayers: string;
    questions: string;
    answered: string;
    shared: string;
    quickActions: string;
    continueJourney: string;
    dailyVerse: string;
    readFullChapter: string;
    todaysMood: string;
    yourMood: string;
    partnersMood: string;
    relationshipMilestones: string;
    celebrateJourney: string;
    yourJourneyTogether: string;
    buildingFoundation: string;
    recentActivity: string;
    viewAll: string;
    addPartner: string;
    connectWithPartner: string;
    noPartnerYet: string;
    sharedJourney: string;
    stage: string;
    stages: { seed: string; growth: string; unity: string; commitment: string; covenant: string };
    daysLeft: string;
    nextStage: string;
    milestoneReached: string;
    firstMilestoneReached: string;
    locationSettings: string;
    locationNotSet: string;
    shareLocation: string;
    waitingForPartnerLocation: string;
    online: string;
    offline: string;
    notSharedYet: string;
  };

  // Devotionals
  devotionals: {
    title: string;
    todaysDevotional: string;
    dailyReflection: string;
    scriptureReading: string;
    prayerPrompt: string;
    discussionQuestions: string;
    markComplete: string;
    shareWithPartner: string;
    partnerCompleted: string;
    yourThoughts: string;
    writeReflection: string;
    saveReflection: string;
    streak: string;
    days: string;
    keepGoing: string;
    audioTab: string;
    versesTab: string;
    highlightsTab: string;
    filter: string;
    completed: string;
    loading: string;
    noDevotionals: string;
  };

  // Journal
  journal: {
    title: string;
    newEntry: string;
    myEntries: string;
    sharedEntries: string;
    writeTitle: string;
    writeContent: string;
    shareWithPartner: string;
    private: string;
    shared: string;
    save: string;
    delete: string;
    edit: string;
    noEntries: string;
    startWriting: string;
    searchPlaceholder: string;
    sortBy: string;
    all: string;
    media: string;
  };

  // Prayer
  prayer: {
    title: string;
    prayerRequests: string;
    newRequest: string;
    myPrayers: string;
    partnersPrayers: string;
    prayTogether: string;
    markAnswered: string;
    answered: string;
    pending: string;
    writeRequest: string;
    noRequests: string;
    addFirstPrayer: string;
    praiseReport: string;
    howAnswered: string;
    together: string;
    searchPrayers: string;
    requestTitle: string;
  };

  // Questions
  questions: {
    title: string;
    knowEachOther: string;
    selectCategory: string;
    answerQuestion: string;
    yourAnswer: string;
    partnersAnswer: string;
    notAnsweredYet: string;
    writeAnswer: string;
    saveAnswer: string;
    questionsAnswered: string;
    viewResponses: string;
    shareYourAnswer: string;
    shareYourThoughts: string;
    writeAReply: string;
    savePriva: string;
    sendAndSave: string;
    reply: string;
    private: string;
    shared: string;
    discuss: string;
    categories: {
      faith: string;
      values: string;
      dreams: string;
      family: string;
      intimacy: string;
      conflict: string;
      finance: string;
      daily: string;
      dailyLifeHabits: string;
      intimacyLifestyle: string;
      loveBalance: string;
      dreamWeddingHome: string;
      travelAdventure: string;
      relationshipBoundaries: string;
      trustTruth: string;
      kidsFuture: string;
      financeGoals: string;
      familyRelations: string;
      bibleConvictions: string;
    };
    categoryDescriptions: {
      dailyLifeHabits: string;
      intimacyLifestyle: string;
      loveBalance: string;
      dreamWeddingHome: string;
      travelAdventure: string;
      relationshipBoundaries: string;
      trustTruth: string;
      kidsFuture: string;
      financeGoals: string;
      familyRelations: string;
      bibleConvictions: string;
    };
  };

  bible: {
    title: string;
    selectBook: string;
    selectChapter: string;
    oldTestament: string;
    newTestament: string;
    search: string;
    bookmarks: string;
    highlights: string;
    addHighlight: string;
    addNote: string;
    shareVerse: string;
    copyVerse: string;
  };

  // Notifications
  notifications: {
    title: string;
    enableNotifications: string;
    disableNotifications: string;
    notificationsOn: string;
    notificationsOff: string;
    youllBeNotified: string;
    sharedVerse: string;
    newPrayer: string;
    journalEntry: string;
    devotionalComplete: string;
    milestone: string;
    dailyReminder: string;
    pushNotifications: string;
    stayConnected: string;
    permissionRequired: string;
    enableInSettings: string;
    unreadItems: string;
    markAllRead: string;
    allCaughtUp: string;
    noNewNotifications: string;
    markRead: string;
    removed: string;
    removeFailed: string;
  };

  // Mood
  mood: {
    title: string;
    great: string;
    good: string;
    okay: string;
    sad: string;
    notSetYet: string;
    analytics: string;
    analyticsDescription: string;
    weeklyReport: string;
    moodTrends: string;
    howAreYouFeelingToday: string;
    shareEmotionalState: string;
    addNote: string;
    notePlaceholder: string;
    generating: string;
    analysisGenerated: string;
    saveMood: string;
    moodSaved: string;
    failedSave: string;
    failedLoad: string;
    needPartnerForAnalysis: string;
    relationshipReflection: string;
    reflectionReady: string;
    generateReflection: string;
    reflectionDescription: string;
    basicMoodSummary: string;
    reportUnavailable: string;
    weeklyReflection: string;
    entry: string;
    entries: string;
    you: string;
    partner: string;
    low: string;
  };

  // Partner setup
  partner: {
    connectTitle: string;
    connectDesc: string;
    partnerEmail: string;
    partnerEmailPlaceholder: string;
    partnerName: string;
    partnerNamePlaceholder: string;
    relationshipStarted: string;
    connecting: string;
    connect: string;
    createTitle: string;
    createDesc: string;
    creating: string;
    createConnect: string;
    back: string;
    notFound: string;
    failedConnect: string;
    fillAllFields: string;
    createdFor: string;
    failedCreate: string;
    allSet: string;
    connectedWith: string;
    tempPasswordNote: string;
    ifNoAccount: string;
  };

  // Offline / network
  offline: {
    backOnline: string;
    youreOffline: string;
  };

  // Messages
  messages: {
    savedSuccessfully: string;
    deletedSuccessfully: string;
    sharedSuccessfully: string;
    errorOccurred: string;
    noInternetConnection: string;
    tryAgainLater: string;
    confirmDelete: string;
    areYouSure: string;
    cannotUndo: string;
  };

  // Time
  time: {
    second: string;
    seconds: string;
    minute: string;
    minutes: string;
    hour: string;
    hours: string;
    day: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    year: string;
    years: string;
    ago: string;
    justNow: string;
  };

  // Install Banner
  install: {
    title: string;
    subtitle: string;
    iosInstructions: string;
    iosStep1: string;
    iosStep2: string;
    iosStep3: string;
    androidInstructions: string;
    installButton: string;
    gotIt: string;
    dismiss: string;
    benefit1Title: string;
    benefit1Desc: string;
    benefit2Title: string;
    benefit2Desc: string;
    benefit3Title: string;
    benefit3Desc: string;
  };

  // Community
  community: {
    title: string;
    myGroups: string;
    joinGroup: string;
    createGroup: string;
    groupName: string;
    groupDescription: string;
    members: string;
    posts: string;
    noPosts: string;
    writePost: string;
    sendMessage: string;
    leaveGroup: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      welcome: 'Welcome',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      share: 'Share',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      error: 'Error',
      success: 'Success',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
    },

    nav: {
      home: 'Home',
      devotions: 'Devotions',
      journal: 'Journal',
      prayer: 'Prayer',
      questions: 'Questions',
      profile: 'Profile',
      settings: 'Settings',
      bible: 'Bible',
      community: 'Community',
    },

    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      enterName: 'Enter your name',
      passwordMismatch: 'Passwords do not match',
      invalidEmail: 'Invalid email address',
      weakPassword: 'Password must be at least 6 characters',
    },

    dashboard: {
      title: 'Dashboard',
      growingTogetherInFaith: 'Growing together in faith',
      daysTogether: 'Days Together',
      devotionalStreak: 'Devotional Streak',
      journalEntries: 'Journal Entries',
      prayers: 'Prayers',
      questions: 'Questions',
      answered: 'answered',
      shared: 'shared',
      quickActions: 'Quick Actions',
      continueJourney: 'Continue your spiritual journey',
      dailyVerse: 'Daily Verse',
      readFullChapter: 'Read Full Chapter',
      todaysMood: "Today's Mood",
      yourMood: 'Your Mood',
      partnersMood: "Partner's Mood",
      relationshipMilestones: 'Relationship Milestones',
      celebrateJourney: 'Celebrate your journey together',
      yourJourneyTogether: 'Your Journey Together',
      buildingFoundation: 'Building a strong foundation in faith',
      recentActivity: 'Recent Activity',
      viewAll: 'View All',
      addPartner: 'Add Partner',
      connectWithPartner: 'Connect with your partner to begin your journey together',
      noPartnerYet: 'No partner connected yet',
      sharedJourney: 'Your shared journey',
      stage: 'Stage',
      stages: { seed: 'Seed', growth: 'Growth', unity: 'Unity', commitment: 'Commitment', covenant: 'Covenant' },
      daysLeft: 'days left',
      nextStage: 'Next',
      milestoneReached: 'Milestone reached! ✨',
      firstMilestoneReached: 'First milestone reached! ✨',
      locationSettings: 'Location settings',
      locationNotSet: 'Location not set',
      shareLocation: 'Share your location',
      waitingForPartnerLocation: "Waiting for your partner's location",
      online: 'online',
      offline: 'offline',
      notSharedYet: 'Not shared yet',
    },

    devotionals: {
      title: 'Daily Devotionals',
      todaysDevotional: "Today's Devotional",
      dailyReflection: 'Daily Reflection',
      scriptureReading: 'Scripture Reading',
      prayerPrompt: 'Prayer Prompt',
      discussionQuestions: 'Discussion Questions',
      markComplete: 'Mark Complete',
      shareWithPartner: 'Share with Partner',
      partnerCompleted: 'Partner Completed',
      yourThoughts: 'Your Thoughts',
      writeReflection: 'Write your reflection...',
      saveReflection: 'Save Reflection',
      streak: 'Streak',
      days: 'days',
      keepGoing: 'Keep going!',
      audioTab: 'Audio',
      versesTab: 'Verses',
      highlightsTab: 'Highlights',
      filter: 'Filter',
      completed: 'Completed',
      loading: 'Loading devotionals...',
      noDevotionals: 'No devotionals found',
    },

    journal: {
      title: 'Journal',
      newEntry: 'New Entry',
      myEntries: 'My Entries',
      sharedEntries: 'Shared Entries',
      writeTitle: 'Entry title...',
      writeContent: 'Write your thoughts...',
      shareWithPartner: 'Share with Partner',
      private: 'Private',
      shared: 'Shared',
      save: 'Save Entry',
      delete: 'Delete Entry',
      edit: 'Edit Entry',
      noEntries: 'No journal entries yet',
      startWriting: 'Start writing your first entry',
      searchPlaceholder: 'Search entries...',
      sortBy: 'Sort by',
      all: 'All',
      media: 'Media',
    },

    prayer: {
      title: 'Prayer',
      prayerRequests: 'Prayer Requests',
      newRequest: 'New Request',
      myPrayers: 'My Prayers',
      partnersPrayers: "Partner's Prayers",
      prayTogether: 'Pray Together',
      markAnswered: 'Mark as Answered',
      answered: 'Answered',
      pending: 'Pending',
      writeRequest: 'Write your prayer request...',
      noRequests: 'No prayer requests yet',
      addFirstPrayer: 'Add your first prayer',
      praiseReport: 'Praise Report',
      howAnswered: 'How was this prayer answered?',
      together: 'Together',
      searchPrayers: 'Search prayers...',
      requestTitle: 'Prayer Title',
    },

    questions: {
      title: 'Know Each Other',
      knowEachOther: 'Get to know each other better',
      selectCategory: 'Select a Category',
      answerQuestion: 'Answer Question',
      yourAnswer: 'Your Answer',
      partnersAnswer: "Partner's Answer",
      notAnsweredYet: 'Not answered yet',
      writeAnswer: 'Write your answer...',
      saveAnswer: 'Save Answer',
      questionsAnswered: 'Questions Answered',
      viewResponses: 'View Responses',
      shareYourAnswer: 'Share your answer',
      shareYourThoughts: 'Share your thoughts...',
      writeAReply: 'Write a reply...',
      savePriva: 'Save Privately',
      sendAndSave: 'Send and Save',
      reply: 'Reply',
      private: 'Private',
      shared: 'Shared',
      discuss: 'Discuss',
      categories: {
        faith: 'Faith & Beliefs',
        values: 'Values & Goals',
        dreams: 'Dreams & Future',
        family: 'Family & Children',
        intimacy: 'Love & Intimacy',
        conflict: 'Conflict Resolution',
        finance: 'Money & Finance',
        daily: 'Daily Life',
        dailyLifeHabits: 'Daily Life & Habits',
        intimacyLifestyle: 'Intimacy & Lifestyle',
        loveBalance: 'Love & Balance',
        dreamWeddingHome: 'Dream Wedding / Dream Home',
        travelAdventure: 'Travel & Adventure',
        relationshipBoundaries: 'Relationship Boundaries',
        trustTruth: 'Trust & Truth',
        kidsFuture: 'Kids & Future',
        financeGoals: 'Finance & Goals',
        familyRelations: 'Family Relations',
        bibleConvictions: 'Bible Convictions',
      },
      categoryDescriptions: {
        dailyLifeHabits: 'Explore daily routines and habits',
        intimacyLifestyle: 'Deepen connection and understanding',
        loveBalance: 'Finding harmony in relationships',
        dreamWeddingHome: 'Plan your future together',
        travelAdventure: 'Explore the world together',
        relationshipBoundaries: 'Establish healthy boundaries',
        trustTruth: 'Build trust and transparency',
        kidsFuture: 'Discuss family planning',
        financeGoals: 'Plan your financial future',
        familyRelations: 'Navigate family dynamics',
        bibleConvictions: 'Discuss faith and beliefs',
      },
    },

    profile: {
      title: 'Profile',
      myProfile: 'My Profile',
      editProfile: 'Edit Profile',
      partnerCode: 'Partner Code',
      enterPartnerCode: 'Enter partner code',
      linkPartner: 'Link Partner',
      relationshipStart: 'Relationship Start Date',
      linkedWith: 'Linked with',
      notLinked: 'Not linked',
      preferences: 'Preferences',
      language: 'Language',
      notifications: 'Notifications',
      theme: 'Theme',
      about: 'About',
      version: 'Version',
    },

    bible: {
      title: 'Bible',
      selectBook: 'Select a Book',
      selectChapter: 'Select Chapter',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      search: 'Search',
      bookmarks: 'Bookmarks',
      highlights: 'Highlights',
      addHighlight: 'Add Highlight',
      addNote: 'Add Note',
      shareVerse: 'Share Verse',
      copyVerse: 'Copy Verse',
    },

    notifications: {
      title: 'Notifications',
      enableNotifications: 'Enable Notifications',
      disableNotifications: 'Disable Notifications',
      notificationsOn: 'Notifications On',
      notificationsOff: 'Enable Notifications',
      youllBeNotified: "You'll be notified about:",
      sharedVerse: 'Shared Bible verses and highlights',
      newPrayer: 'New prayer requests from your partner',
      journalEntry: 'Journal entries and devotional completions',
      devotionalComplete: 'Daily devotional reminders',
      milestone: 'Milestone celebrations and achievements',
      dailyReminder: 'Daily reminders',
      pushNotifications: 'Push Notifications',
      stayConnected: 'Stay connected with your partner through instant notifications',
      permissionRequired: 'Permission Required',
      enableInSettings: 'Enable notifications in your browser settings',
      unreadItems: 'unread items',
      markAllRead: 'Mark all read',
      allCaughtUp: 'All caught up!',
      noNewNotifications: "You'll see new updates from your partner here.",
      markRead: 'Mark read',
      removed: 'Notification removed',
      removeFailed: 'Failed to delete notification',
    },

    milestones: {
      title: 'Milestones',
      addMilestone: 'Add Milestone',
      editMilestone: 'Edit Milestone',
      deleteMilestone: 'Delete Milestone',
      milestoneTitle: 'Milestone Title',
      milestoneDescription: 'Description',
      milestoneDate: 'Date',
      selectIcon: 'Select Icon',
      noMilestones: 'No milestones yet',
      addFirstMilestone: 'Add your first milestone',
    },

    mood: {
      title: 'Mood',
      great: 'Great',
      good: 'Good',
      okay: 'Okay',
      sad: 'Sad',
      notSetYet: 'Not set yet',
      analytics: 'Mood Analytics',
      analyticsDescription: 'Track your emotional journey together',
      weeklyReport: 'Weekly Report',
      moodTrends: 'Mood Trends',
      howAreYouFeelingToday: "How are you feeling today?",
      shareEmotionalState: 'Share your emotional state with your partner',
      addNote: 'Add a note (optional)',
      notePlaceholder: 'What\'s on your heart today?',
      generating: 'Generating...',
      analysisGenerated: 'Your reflection is ready! 💝',
      saveMood: 'Save Mood',
      moodSaved: 'Mood saved! 💝',
      failedSave: 'Failed to save mood',
      failedLoad: 'Failed to load mood data',
      needPartnerForAnalysis: 'Connect with your partner to create a reflection',
      relationshipReflection: 'Relationship Reflection',
      reflectionReady: 'Your reflection is ready 💝',
      generateReflection: 'Create Reflection',
      reflectionDescription: 'A warm reflection on your emotional journey together',
      basicMoodSummary: 'Mood Summary',
      reportUnavailable: 'A simple mood summary is shown while the personalized reflection is unavailable.',
      weeklyReflection: 'Weekly Reflection',
      entry: 'entry',
      entries: 'entries',
      you: 'You',
      partner: 'Partner',
      low: 'Low',
    },

    partner: {
      connectTitle: 'Connect with Your Partner',
      connectDesc: 'Add your partner to start your journey together',
      partnerEmail: "Partner's Email",
      partnerEmailPlaceholder: 'partner@example.com',
      partnerName: "Partner's Name",
      partnerNamePlaceholder: "Enter partner's name",
      relationshipStarted: 'Relationship Started',
      connecting: 'Connecting...',
      connect: 'Connect with Partner',
      createTitle: 'Create Partner Account',
      createDesc: 'Create an account so you can connect',
      creating: 'Creating...',
      createConnect: 'Create & Connect',
      back: 'Back',
      notFound: 'Partner account not found. Create one for them?',
      failedConnect: 'Failed to connect with partner',
      fillAllFields: 'Please fill in all fields',
      createdFor: 'Created account for',
      failedCreate: 'Failed to create partner account',
      allSet: 'All Set! 💕',
      connectedWith: "You're now connected with",
      tempPasswordNote: 'A temporary password will be created. Share it with your partner so they can sign in and change it.',
      ifNoAccount: "If your partner doesn't have an account yet, we'll help you create one for them",
    },

    offline: {
      backOnline: 'Back online',
      youreOffline: "You're offline. Some features may be limited.",
    },

    messages: {
      savedSuccessfully: 'Saved successfully',
      deletedSuccessfully: 'Deleted successfully',
      sharedSuccessfully: 'Shared successfully',
      errorOccurred: 'An error occurred',
      noInternetConnection: 'No internet connection',
      tryAgainLater: 'Please try again later',
      confirmDelete: 'Confirm Delete',
      areYouSure: 'Are you sure?',
      cannotUndo: 'This action cannot be undone',
    },

    time: {
      second: 'second',
      seconds: 'seconds',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years',
      ago: 'ago',
      justNow: 'just now',
    },

    install: {
      title: 'Install TwoBeOne',
      subtitle: 'Add to your home screen for the best experience',
      iosInstructions: 'To install on iOS:',
      iosStep1: 'Tap the Share button below',
      iosStep2: 'Scroll and tap "Add to Home Screen"',
      iosStep3: 'Tap "Add" to confirm',
      androidInstructions: 'Tap the button below to install TwoBeOne on your device',
      installButton: 'Install App',
      gotIt: 'Got it!',
      dismiss: 'Dismiss',
      benefit1Title: 'Faster',
      benefit1Desc: 'Instant access',
      benefit2Title: 'Native',
      benefit2Desc: 'App-like feel',
      benefit3Title: 'Alerts',
      benefit3Desc: 'Get notified',
    },

    community: {
      title: 'Community',
      myGroups: 'My Groups',
      joinGroup: 'Join Group',
      createGroup: 'Create Group',
      groupName: 'Group Name',
      groupDescription: 'Description',
      members: 'Members',
      posts: 'Posts',
      noPosts: 'No posts yet',
      writePost: 'Write a post...',
      sendMessage: 'Send',
      leaveGroup: 'Leave Group',
    },
  },

  am: {
    common: {
      welcome: 'እንኳን ደህና መጡ',
      loading: 'በመጫን ላይ...',
      save: 'አስቀምጥ',
      cancel: 'ሰርዝ',
      delete: 'ሰርዝ',
      edit: 'አስተካክል',
      share: 'አጋራ',
      close: 'ዝጋ',
      back: 'ተመለስ',
      next: 'ቀጣይ',
      previous: 'ቀዳሚ',
      yes: 'አዎ',
      no: 'አይ',
      ok: 'እሺ',
      error: 'ስህተት',
      success: 'ተሳክቷል',
      today: 'ዛሬ',
      yesterday: 'ትናንት',
      tomorrow: 'ነገ',
    },

    nav: {
      home: 'መነሻ',
      devotions: 'የእምነት ጥናት',
      journal: 'ማስታወሻ',
      prayer: 'ጸሎት',
      questions: 'ጥያቄዎች',
      profile: 'መገለጫ',
      settings: 'ቅንብሮች',
      bible: 'መጽሐፍ ቅዱስ',
      community: 'ማህበረሰብ',
    },

    auth: {
      signIn: 'ግባ',
      signUp: 'ይመዝገቡ',
      signOut: 'ውጣ',
      email: 'ኢሜይል',
      password: 'የይለፍ ቃል',
      name: 'ስም',
      confirmPassword: 'የይለፍ ቃል አረጋግጥ',
      forgotPassword: 'የይለፍ ቃል ረስተዋል?',
      createAccount: 'መለያ ፍጠር',
      alreadyHaveAccount: 'መለያ አለዎት?',
      dontHaveAccount: 'መለያ የለዎትም?',
      enterEmail: 'ኢሜይልዎን ያስገቡ',
      enterPassword: 'የይለፍ ቃልዎን ያስገቡ',
      enterName: 'ስምዎን ያስገቡ',
      passwordMismatch: 'የይለፍ ቃሎች አይዛመዱም',
      invalidEmail: 'የተሳሳተ ኢሜይል አድራሻ',
      weakPassword: 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት',
    },

    dashboard: {
      title: 'መነሻ ገጽ',
      growingTogetherInFaith: 'በእምነት አብረን እናድጋለን',
      daysTogether: 'አብረን የቆይንበት ቀናት',
      devotionalStreak: 'የቀጣይነት ጥናት',
      journalEntries: 'የማስታወሻ ግቤቶች',
      prayers: 'ጸሎቶች',
      questions: 'ጥያቄዎች',
      answered: 'ተመልሷል',
      shared: 'ተጋርቷል',
      quickActions: 'ፈጣን እርምጃዎች',
      continueJourney: 'መንፈሳዊ ጉዞዎን ይቀጥሉ',
      dailyVerse: 'የዛሬው ጥቅስ',
      readFullChapter: 'ምዕራፉን በሙሉ አንብብ',
      todaysMood: 'የዛሬው ስሜት',
      yourMood: 'የእርስዎ ስሜት',
      partnersMood: 'የባልደረባዎ ስሜት',
      relationshipMilestones: 'የግንኙነት ክስተቶች',
      celebrateJourney: 'ጉዞዎን አብረው ያክብሩ',
      yourJourneyTogether: 'የእርስዎ ጉዞ አብረን',
      buildingFoundation: 'በእምነት ጠንካራ መሰረት መገንባት',
      recentActivity: 'የቅርብ ጊዜ እንቅስቃሴ',
      viewAll: 'ሁሉንም ይመልከቱ',
      addPartner: 'ባልደረባ ጨምር',
      connectWithPartner: 'ጉዞዎን ለመጀመር ከባልደረባዎ ጋር ይገናኙ',
      noPartnerYet: 'እስካሁን ባልደረባ አልተገናኘም',
      sharedJourney: 'የጋራ ጉዞዎ',
      stage: 'ደረጃ',
      stages: { seed: 'ዘር', growth: 'እድገት', unity: 'አንድነት', commitment: 'ቁርጠኝነት', covenant: 'ቃል ኪዳን' },
      daysLeft: 'ቀናት ቀርተዋል',
      nextStage: 'ቀጣይ',
      milestoneReached: 'የጉዞ ምዕራፍ ደርሷል! ✨',
      firstMilestoneReached: 'የመጀመሪያው የጉዞ ምዕራፍ ደርሷል! ✨',
      locationSettings: 'የአካባቢ ቅንብሮች',
      locationNotSet: 'አካባቢ አልተዘጋጀም',
      shareLocation: 'አካባቢዎን ያጋሩ',
      waitingForPartnerLocation: 'የባልደረባዎን አካባቢ በመጠበቅ ላይ',
      online: 'መስመር ላይ',
      offline: 'ከመስመር ውጭ',
      notSharedYet: 'እስካሁን አልተጋራም',
    },

    devotionals: {
      title: 'የእለት ጥናት',
      todaysDevotional: 'የዛሬው ጥናት',
      dailyReflection: 'የእለት ማሰላሰል',
      scriptureReading: 'የመጽሐፍ ቅዱስ ንባብ',
      prayerPrompt: 'የጸሎት መመሪያ',
      discussionQuestions: 'የውይይት ጥያቄዎች',
      markComplete: 'እንደተጠናቀቀ አድርግ',
      shareWithPartner: 'ለባልደረባ አጋራ',
      partnerCompleted: 'ባልደረባ አጠናቋል',
      yourThoughts: 'ሃሳብዎ',
      writeReflection: 'ማሰላሰልዎን ይጻፉ...',
      saveReflection: 'ማሰላሰል አስቀምጥ',
      streak: 'ቀጣይነት',
      days: 'ቀናት',
      keepGoing: 'ይቀጥሉ!',
      audioTab: 'ኦዲዮ',
      versesTab: 'ጥቅሶች',
      highlightsTab: 'ድምቀቶች',
      filter: 'ማጣሪያ',
      completed: 'ተጠናቋል',
      loading: 'ጥናቶችን በመጫን ላይ...',
      noDevotionals: 'ምንም ጥናቶች አልተገኙም',
    },

    journal: {
      title: 'ማስታወሻ',
      newEntry: 'አዲስ ግቤት',
      myEntries: 'የእኔ ግቤቶች',
      sharedEntries: 'የተጋሩ ግቤቶች',
      writeTitle: 'የግቤት ርዕስ...',
      writeContent: 'ሃሳብዎን ይጻፉ...',
      shareWithPartner: 'ለባልደረባ አጋራ',
      private: 'ግላዊ',
      shared: 'የተጋራ',
      save: 'ግቤት አስቀምጥ',
      delete: 'ግቤት ሰርዝ',
      edit: 'ግቤት አስተካክል',
      noEntries: 'እስካሁን ምንም ግቤቶች የሉም',
      startWriting: 'የመጀመሪያ ግቤትዎን ይጻፉ',
      searchPlaceholder: 'ግቤቶች ፈልግ...',
      sortBy: 'ደርድር',
      all: 'ሁሉም',
      media: 'ሚዲያ',
    },

    prayer: {
      title: 'ጸሎት',
      prayerRequests: 'የጸሎት ጥያቄዎች',
      newRequest: 'አዲስ ጥያቄ',
      myPrayers: 'የእኔ ጸሎቶች',
      partnersPrayers: 'የባልደረባ ጸሎቶች',
      prayTogether: 'አብረን እንጸልይ',
      markAnswered: 'እንደተመለሰ አድርግ',
      answered: 'ተመልሷል',
      pending: 'በመጠባበቅ ላይ',
      writeRequest: 'የጸሎት ጥያቄዎን ይጻፉ...',
      noRequests: 'እስካሁን የጸሎት ጥያቄዎች የሉም',
      addFirstPrayer: 'የመጀመሪያ ጸሎትዎን ይጨምሩ',
      praiseReport: 'የምስጋና ሪፖርት',
      howAnswered: 'ይህ ጸሎት እንዴት ተመልሷል?',
      together: 'አብሮ',
      searchPrayers: 'ጸሎቶችን ፈልግ...',
      requestTitle: 'የጸሎት ርዕስ',
    },

    questions: {
      title: 'እርስ በእርስ እናውቃለን',
      knowEachOther: 'እርስ በእርሳችን በደንብ እናውቃለን',
      selectCategory: 'ምድብ ይምረጡ',
      answerQuestion: 'ጥያቄ መልስ',
      yourAnswer: 'የእርስዎ መልስ',
      partnersAnswer: 'የባልደረባ መልስ',
      notAnsweredYet: 'እስካሁን አልተመለሰም',
      writeAnswer: 'መልስዎን ይጻፉ...',
      saveAnswer: 'መልስ አስቀምጥ',
      questionsAnswered: 'የተመለሱ ጥያቄዎች',
      viewResponses: 'መልሶችን ይመልከቱ',
      shareYourAnswer: 'መልስዎን ያጋሩ',
      shareYourThoughts: 'ሃሳብዎን ያጋሩ...',
      writeAReply: 'መልስ ይጻፉ...',
      savePriva: 'በምስጢር አስቀምጥ',
      sendAndSave: 'ላክ እና አስቀምጥ',
      reply: 'መልስ',
      private: 'ምስጢራዊ',
      shared: 'የጋራ',
      discuss: 'ተወያይ',
      categories: {
        faith: 'እምነት እና እምነቶች',
        values: 'እሴቶች እና ግቦች',
        dreams: 'ህልሞች እና ወደፊት',
        family: 'ቤተሰብ እና ልጆች',
        intimacy: 'ፍቅር እና ቅርበት',
        conflict: 'ግጭት አፈታት',
        finance: 'ገንዘብ እና ፋይናንስ',
        daily: 'የእለት ተእለት ህይወት',
        dailyLifeHabits: 'ዕለታዊ ሕይወት እና የልምድ ልምዶች',
        intimacyLifestyle: 'ውርደት እና የሕይወት ሁኔታ',
        loveBalance: 'ፍቅር እና ሚዛን',
        dreamWeddingHome: 'የጋራ ሕልም / የወደፍት ቤታችን',
        travelAdventure: 'በጋራ ማየት የምፍልጉ ቦታዎች',
        relationshipBoundaries: 'የግንኙነት ገደሎች',
        trustTruth: 'እምነት እና እውነታ',
        kidsFuture: 'የወደፍት ልጆች ',
        financeGoals: 'የፋይናንስ አጠቃቀም',
        familyRelations: 'የቤተሰብ ግንኙነቶች',
        bibleConvictions: 'የመጽሐፍ ቅዱስ ኃላፊነቶች',
      },
      categoryDescriptions: {
        dailyLifeHabits: 'ዕለታዊ ሕይወት እና ልምዶችን ይሙከሩ',
        intimacyLifestyle: 'ግንኙነትን ያሳድጉ እና ያስተዋወቁ',
        loveBalance: 'በግንኙነት ውስጥ ሚዛን ይፈልጉ',
        dreamWeddingHome: 'የፊትለፊት እቅድዎን ያውቁ',
        travelAdventure: 'ከእርስዎ ጋር ዓለምን ይጎብኙ',
        relationshipBoundaries: 'ጤናማ ገደሎችን ያቋቋሙ',
        trustTruth: 'እምነትን እና እውነታን ያከብሩ',
        kidsFuture: 'የቤተሰብ እቅድን ይወዱ',
        financeGoals: 'የፋይናንስ ፍላጎቶችን ይዘጋጁ',
        familyRelations: 'የቤተሰብ ውይይትን ያስተካክሉ',
        bibleConvictions: 'እምነት እና ሃላፊነትን ያውሩ',
      },
    },

    profile: {
      title: 'መገለጫ',
      myProfile: 'የእኔ መገለጫ',
      editProfile: 'መገለጫ አስተካክል',
      partnerCode: 'የባልደረባ ኮድ',
      enterPartnerCode: 'የባልደረባ ኮድ ያስገቡ',
      linkPartner: 'ባልደረባን አገናኝ',
      relationshipStart: 'የግንኙነት መጀመሪያ ቀን',
      linkedWith: 'ተገናኝቷል ከ',
      notLinked: 'አልተገናኘም',
      preferences: 'ምርጫዎች',
      language: 'ቋንቋ',
      notifications: 'ማሳወቂያዎች',
      theme: 'ገፅታ',
      about: 'ስለ',
      version: 'ስሪት',
    },

    bible: {
      title: 'መጽሐፍ ቅዱስ',
      selectBook: 'መጽሐፍ ይምረጡ',
      selectChapter: 'ምዕራፍ ይምረጡ',
      oldTestament: 'ብሉይ ኪዳን',
      newTestament: 'አዲስ ኪዳን',
      search: 'ፈልግ',
      bookmarks: 'ዕልባቶች',
      highlights: 'ድምቀቶች',
      addHighlight: 'ድምቀት ጨምር',
      addNote: 'ማስታወሻ ጨምር',
      shareVerse: 'ጥቅስ አጋራ',
      copyVerse: 'ጥቅስ ቅዳ',
    },

    notifications: {
      title: 'ማሳወቂያዎች',
      enableNotifications: 'ማሳወቂያዎችን አንቃ',
      disableNotifications: 'ማሳወቂያዎችን አሰናክል',
      notificationsOn: 'ማሳወቂያዎች በርተዋል',
      notificationsOff: 'ማሳወቂያዎችን አንቃ',
      youllBeNotified: 'የሚሰጡዎት ማሳወቂያዎች:',
      sharedVerse: 'የተጋሩ የመጽሐፍ ቅዱስ ጥቅሶች እና ድምቀቶች',
      newPrayer: 'ከባልደረባዎ አዲስ የጸሎት ጥያቄዎች',
      journalEntry: 'የማስታወሻ ግቤቶች እና የጥናት ማጠናቀቂያዎች',
      devotionalComplete: 'የእለት ጥናት አስታዋሾች',
      milestone: 'የክስተት በዓላት እና ስኬቶች',
      dailyReminder: 'የእለት አስታዋሾች',
      pushNotifications: 'የፑሽ ማሳወቂያዎች',
      stayConnected: 'በፈጣን ማሳወቂያዎች ከባልደረባዎ ጋር ተገናኝተው ይቆዩ',
      permissionRequired: 'ፈቃድ ያስፈልጋል',
      enableInSettings: 'በአሳሽዎ ቅንብሮች ውስጥ ማሳወቂያዎችን አንቃ',
      unreadItems: 'ያልተነበቡ ማሳወቂያዎች',
      markAllRead: 'ሁሉንም እንደተነበበ ምልክት ያድርጉ',
      allCaughtUp: 'ሁሉንም ተመልክተዋል!',
      noNewNotifications: 'ከባልደረባዎ የሚመጡ አዳዲስ መረጃዎችን እዚህ ያያሉ።',
      markRead: 'እንደተነበበ ምልክት ያድርጉ',
      removed: 'ማሳወቂያው ተወግዷል',
      removeFailed: 'ማሳወቂያውን መሰረዝ አልተሳካም',
    },

    milestones: {
      title: 'ክስተቶች',
      addMilestone: 'ክስተት ጨምር',
      editMilestone: 'ክስተት አስተካክል',
      deleteMilestone: 'ክስተት ሰርዝ',
      milestoneTitle: 'የክስተት ርዕስ',
      milestoneDescription: 'መግለጫ',
      milestoneDate: 'ቀን',
      selectIcon: 'አዶ ይምረጡ',
      noMilestones: 'እስካሁን ክስተቶች የሉም',
      addFirstMilestone: 'የመጀመሪያ ክስተትዎን ይጨምሩ',
    },

    mood: {
      title: 'ስሜት',
      great: 'በጣም ጥሩ',
      good: 'ጥሩ',
      okay: 'እሺ',
      sad: 'ሀዘን',
      notSetYet: 'እስካሁን አልተዘጋጀም',
      analytics: 'የስሜት ትንታኔ',
      analyticsDescription: 'የስሜት ጉዟችሁን አብረን ተከታተሉ',
      weeklyReport: 'ሳምንታዊ ሪፖርት',
      moodTrends: 'የስሜት አዝማሚያዎች',
      howAreYouFeelingToday: 'ዛሬ እንዴት ይሰማዎታል?',
      shareEmotionalState: 'ስሜትዎን ከባልደረባዎ ጋር ያጋሩ',
      addNote: 'ማስታወሻ ጨምር (ምርጫ)',
      notePlaceholder: 'ዛሬ ልብዎ ምን ይላል?',
      generating: 'በማዘጋጀት ላይ...',
      analysisGenerated: 'ነጸብራቅዎ ዝግጁ ነው! 💝',
      saveMood: 'ስሜት አስቀምጥ',
      moodSaved: 'ስሜት ተቀምጧል! 💝',
      failedSave: 'ስሜት ማስቀመጥ አልተሳካም',
      failedLoad: 'የስሜት ውሂብ መጫን አልተሳካም',
      needPartnerForAnalysis: 'ነጸብራቅ ለመፍጠር ከባልደረባዎ ጋር ይገናኙ',
      relationshipReflection: 'የግንኙነት ነጸብራቅ',
      reflectionReady: 'ነጸብራቅዎ ዝግጁ ነው 💝',
      generateReflection: 'ነጸብራቅ ይፍጠሩ',
      reflectionDescription: 'በጋራ ስላላችሁ የስሜት ጉዞ ሞቅ ያለ ነጸብራቅ',
      basicMoodSummary: 'የስሜት ማጠቃለያ',
      reportUnavailable: 'ግላዊ ነጸብራቁ ባልተገኘበት ጊዜ ቀላል የስሜት ማጠቃለያ ቀርቧል።',
      weeklyReflection: 'ሳምንታዊ ነጸብራቅ',
      entry: 'መዝገብ',
      entries: 'መዝገቦች',
      you: 'እርስዎ',
      partner: 'ባልደረባ',
      low: 'ዝቅተኛ',
    },

    partner: {
      connectTitle: 'ከባልደረባዎ ጋር ይገናኙ',
      connectDesc: 'ጉዟችሁን ለመጀመር ባልደረባዎን ያክሉ',
      partnerEmail: 'የባልደረባ ኢሜይል',
      partnerEmailPlaceholder: 'partner@example.com',
      partnerName: 'የባልደረባ ስም',
      partnerNamePlaceholder: 'የባልደረባ ስም ያስገቡ',
      relationshipStarted: 'ግንኙነት የጀመረው',
      connecting: 'በማገናኘት ላይ...',
      connect: 'ከባልደረባ ጋር ተገናኝ',
      createTitle: 'የባልደረባ መለያ ፍጠር',
      createDesc: 'እንዲገናኙ መለያ ፍጠሩ',
      creating: 'በመፍጠር ላይ...',
      createConnect: 'ፍጠር እና ተገናኝ',
      back: 'ተመለስ',
      notFound: 'የባልደረባ መለያ አልተገኘም። ለእሱ/ለእሷ ይፍጠሩ?',
      failedConnect: 'ከባልደረባ ጋር ማገናኘት አልተሳካም',
      fillAllFields: 'እባክዎ ሁሉንም መስኮች ይሙሉ',
      createdFor: 'ለ... መለያ ተፈጥሯል',
      failedCreate: 'የባልደረባ መለያ መፍጠር አልተሳካም',
      allSet: 'ሁሉም ዝግጁ! 💕',
      connectedWith: 'ከ... ጋር ተገናኝተዋል',
      tempPasswordNote: 'ጊዜያዊ የይለፍ ቃል ይፈጠራል። ለባልደረባዎ ያጋሩት።',
      ifNoAccount: 'ባልደረባዎ መለያ ከሌለዋቸው ለእሱ/ለእሷ ለመፍጠር እንረዳዎታለን',
    },

    offline: {
      backOnline: 'ተገናኝቷል',
      youreOffline: 'ከኢንተርኔት ተቋርጠዋል። አንዳንድ ባህሪያት ላይሰሩ ይችላሉ።',
    },

    messages: {
      savedSuccessfully: 'በተሳካ ሁኔታ ተቀምጧል',
      deletedSuccessfully: 'በተሳካ ሁኔታ ተሰርዟል',
      sharedSuccessfully: 'በተሳካ ሁኔታ ተጋርቷል',
      errorOccurred: 'ስህተት ተከስቷል',
      noInternetConnection: 'የበይነመረብ ግንኙነት የለም',
      tryAgainLater: 'እባክዎ ቆይተው ይሞክሩ',
      confirmDelete: 'መሰረዝን አረጋግጥ',
      areYouSure: 'እርግጠኛ ነዎት?',
      cannotUndo: 'ይህ እርምጃ መልሶ መቀልበስ አይቻልም',
    },

    time: {
      second: 'ሰከንድ',
      seconds: 'ሰከንዶች',
      minute: 'ደቂቃ',
      minutes: 'ደቂቃዎች',
      hour: 'ሰዓት',
      hours: 'ሰዓታት',
      day: 'ቀን',
      days: 'ቀናት',
      week: 'ሳምንት',
      weeks: 'ሳምንታት',
      month: 'ወር',
      months: 'ወራት',
      year: 'ዓመት',
      years: 'ዓመታት',
      ago: 'በፊት',
      justNow: 'አሁን ብቻ',
    },

    install: {
      title: 'TwoBeOne ጫን',
      subtitle: 'ለተሻለ ተሞክሮ ወደ መነሻ ስክሪንዎ ያክሉ',
      iosInstructions: 'በ iOS ላይ ለመጫን:',
      iosStep1: 'ከታች ያለውን የማጋራት ቁልፍ መታ ያድርጉ',
      iosStep2: 'ይሸብልሉ እና "ወደ መነሻ ስክሪን አክል" ን ይጫኑ',
      iosStep3: 'ለማረጋገጥ "አክል" ን ይጫኑ',
      androidInstructions: 'TwoBeOne በመሳሪያዎ ላይ ለመጫን ከታች ያለውን ቁልፍ ይጫኑ',
      installButton: 'መተግበሪያ ጫን',
      gotIt: 'ገባኝ!',
      dismiss: 'አሰናብት',
      benefit1Title: 'ፈጣን',
      benefit1Desc: 'ፈጣን መዳረሻ',
      benefit2Title: 'አገናኝ',
      benefit2Desc: 'እንደ መተግበሪያ',
      benefit3Title: 'ማሳወቂያዎች',
      benefit3Desc: 'ማሳወቂያ ይደርስዎታል',
    },

    community: {
      title: 'ማህበረሰብ',
      myGroups: 'የእኔ ቡድኖች',
      joinGroup: 'ቡድን ተቀላቀል',
      createGroup: 'ቡድን ፍጠር',
      groupName: 'የቡድን ስም',
      groupDescription: 'መግለጫ',
      members: 'አባላት',
      posts: 'ልጥፎች',
      noPosts: 'እስካሁን ምንም ልጥፎች የሉም',
      writePost: 'ልጥፍ ይጻፉ...',
      sendMessage: 'ላክ',
      leaveGroup: 'ቡድን ለቅቅ',
    },
  },

  om: {
    common: {
      welcome: 'Baga Nagaan Dhuftan',
      loading: "Fe'aa jira...",
      save: 'Kuuxi',
      cancel: 'Dhiisi',
      delete: 'Haquu',
      edit: 'Gulaali',
      share: 'Qoodi',
      close: 'Cufi',
      back: "Deebi'i",
      next: 'Itti aanu',
      previous: 'Kan dura',
      yes: 'Eeyyee',
      no: 'Miti',
      ok: 'Tole',
      error: 'Dogoggora',
      success: "Milkaa'e",
      today: "Har'aa",
      yesterday: 'Kaleessa',
      tomorrow: 'Boru',
    },
    nav: {
      home: 'Mana',
      devotions: 'Kaayyoo Amantii',
      journal: 'Yaadannoo',
      prayer: 'Kadhannaa',
      questions: 'Gaaffilee',
      profile: 'Eenyummaa',
      settings: "Qindaa'ina",
      bible: 'Macaafa Qulqulluu',
      community: 'Hawaasa',
    },
    auth: {
      signIn: 'Seeni',
      signUp: "Galmaa'i",
      signOut: "Ba'i",
      email: 'Imeelii',
      password: 'Jecha Darbii',
      name: 'Maqaa',
      confirmPassword: 'Jecha Darbii Mirkaneessi',
      forgotPassword: 'Jecha Darbii Dagatte?',
      createAccount: 'Herrega Bani',
      alreadyHaveAccount: 'Herrega qabdaa?',
      dontHaveAccount: 'Herrega hin qabduu?',
      enterEmail: 'Imeelii kee galchi',
      enterPassword: 'Jecha darbii kee galchi',
      enterName: 'Maqaa kee galchi',
      passwordMismatch: 'Jecha darbiin wal hin simatu',
      invalidEmail: 'Teessuma imeelii dogongora',
      weakPassword: 'Jecha darbiin sadarkaawwan 6 ol qabaachuu qaba',
    },
    dashboard: {
      title: 'Fuula Jalqabaa',
      growingTogetherInFaith: 'Amantiin waliin guddachaa jirra',
      daysTogether: 'Guyyaa Waliin',
      devotionalStreak: 'Taateen Amantii',
      journalEntries: 'Yaadannoo',
      prayers: 'Kadhannaa',
      questions: 'Gaaffilee',
      answered: 'deebii argateera',
      shared: 'qoodameera',
      quickActions: 'Tarkaanfiiwwan Ariifataawaa',
      continueJourney: 'Imala amantii kee itti fufi',
      dailyVerse: 'Weeji Guyyaa',
      readFullChapter: 'Boqonnaa Hunda Dubbisi',
      todaysMood: "Miira Har'aa",
      yourMood: 'Miira Kee',
      partnersMood: 'Miira Hiriyaa Kee',
      relationshipMilestones: 'Balbala Hariiroo',
      celebrateJourney: 'Imala waliin kabajaa',
      yourJourneyTogether: 'Imala Keessan Waliin',
      buildingFoundation: 'Hundee cimaa amantiin ijaaruu',
      recentActivity: 'Hojii Dhiyoo',
      viewAll: 'Hunda Ilaali',
      addPartner: 'Hiriyaa Dabaluu',
      connectWithPartner: 'Imala waliin jalqabuuf hiriyaa kee waliin quunnamaa',
      noPartnerYet: 'Hiriyaan ammaaf hin quunnamne',
      sharedJourney: 'Imala keessan waliin',
      stage: 'Sadarkaa',
      stages: { seed: 'Sanyii', growth: 'Guddina', unity: 'Tokkummaa', commitment: 'Kutannoo', covenant: 'Kakuu' },
      daysLeft: 'guyyaa hafe',
      nextStage: 'Itti aanu',
      milestoneReached: 'Sadarkaan imalaa gaheera! ✨',
      firstMilestoneReached: 'Sadarkaan imalaa jalqabaa gaheera! ✨',
      locationSettings: "Qindaa'ina bakka",
      locationNotSet: 'Bakki hin qindaa’in',
      shareLocation: 'Bakka kee qoodi',
      waitingForPartnerLocation: 'Bakka hiriyaa kee eegaa jira',
      online: 'sarara irra',
      offline: 'sararaan ala',
      notSharedYet: 'Ammaaf hin qoodamne',
    },
    devotionals: {
      title: 'Kaayyoo Amantii Guyyaa Guyyaa',
      todaysDevotional: "Kaayyoo Har'aa",
      dailyReflection: 'Yaadannoo Guyyaa Guyyaa',
      scriptureReading: 'Macaafa Qulqulluu Dubbisuu',
      prayerPrompt: 'Qajeelfama Kadhannaa',
      discussionQuestions: 'Gaaffilee Marii',
      markComplete: 'Xumurameera Jedhii',
      shareWithPartner: 'Hiriyaa Waliin Qoodi',
      partnerCompleted: 'Hiriyaan Xumureera',
      yourThoughts: 'Yaada Kee',
      writeReflection: 'Yaadannoo kee barreessi...',
      saveReflection: 'Yaadannoo Kuuxi',
      streak: 'Itti fufinsa',
      days: 'guyyaa',
      keepGoing: 'Itti fufi!',
      audioTab: 'Sagalee',
      versesTab: 'Weejiilee',
      highlightsTab: 'Ibsituuwwan',
      filter: 'Calaluu',
      completed: 'Xumurameera',
      loading: "Kaayyoolee fe'aa jira...",
      noDevotionals: 'Kaayyoon argamu hin jiru',
    },
    journal: {
      title: 'Yaadannoo',
      newEntry: "Galma'a Haaraa",
      myEntries: "Galma'aa Kiyya",
      sharedEntries: "Galma'a Qoodame",
      writeTitle: "Mata-duree galma'aa...",
      writeContent: 'Yaada kee barreessi...',
      shareWithPartner: 'Hiriyaa Waliin Qoodi',
      private: 'Dhuunfaa',
      shared: 'Qoodame',
      save: "Galma'a Kuuxi",
      delete: "Galma'a Haquu",
      edit: "Galma'a Gulaali",
      noEntries: "Ammaaf galma'aan hin jiru",
      startWriting: "Galma'a jalqabaa kee barreessi",
      searchPlaceholder: "Galma'aawwan barbaadi...",
      sortBy: 'Tartiibaan',
      all: 'Hunda',
      media: 'Miidiyaa',
    },
    prayer: {
      title: 'Kadhannaa',
      prayerRequests: 'Gaaffii Kadhannaa',
      newRequest: 'Gaaffii Haaraa',
      myPrayers: 'Kadhannaa Kiyya',
      partnersPrayers: 'Kadhannaa Hiriyaa',
      prayTogether: 'Waliin Kadhadhu',
      markAnswered: 'Deebii Argateera Jedhii',
      answered: 'Deebii Argateera',
      pending: 'Eeggachaa jira',
      writeRequest: 'Gaaffii kadhannaa kee barreessi...',
      noRequests: 'Ammaaf gaaffiin kadhannaa hin jiru',
      addFirstPrayer: 'Kadhannaa jalqabaa kee dabaluu',
      praiseReport: 'Gabaasa Galata',
      howAnswered: 'Kadhannaan kun akkamiin deebii argateef?',
      together: 'Waliin',
      searchPrayers: 'Kadhannaa barbaadi...',
      requestTitle: 'Mata-duree Kadhannaa',
    },
    questions: {
      title: 'Walii Barina',
      knowEachOther: 'Walii ofitti gad-fageenyaan barina',
      selectCategory: 'Caasaa Filadhu',
      answerQuestion: 'Gaaffii Deebisi',
      yourAnswer: 'Deebii Kee',
      partnersAnswer: 'Deebii Hiriyaa',
      notAnsweredYet: 'Ammaaf deebii hin arganne',
      writeAnswer: 'Deebii kee barreessi...',
      saveAnswer: 'Deebii Kuuxi',
      questionsAnswered: "Gaaffilee Deebi'an",
      viewResponses: 'Deebiiwwan Ilaali',
      shareYourAnswer: 'Deebii kee qoodi',
      shareYourThoughts: 'Yaada kee qoodi...',
      writeAReply: "Deebi'i barreessi...",
      savePriva: 'Dhuunfaan Kuuxi',
      sendAndSave: 'Ergi fi Kuuxi',
      reply: "Deebi'i",
      private: 'Dhuunfaa',
      shared: 'Qoodame',
      discuss: "Mari'adhu",
      categories: {
        faith: 'Amantii fi Yaadota',
        values: 'Gatii fi Kaayyoo',
        dreams: 'Hawwii fi Fuuldura',
        family: "Maatii fi Daa'imman",
        intimacy: 'Jaalala fi Waldhabbii',
        conflict: 'Rakkoo Furuu',
        finance: 'Faayinaansii fi Qabeenya',
        daily: 'Jireenya Guyyaa Guyyaa',
        dailyLifeHabits: 'Jireenya Guyyaa fi Hojii Guyyaa',
        intimacyLifestyle: 'Jaalalaa fi Jireenya',
        loveBalance: 'Jaalala fi Madaallii',
        dreamWeddingHome: 'Abdi kan Fuulduratti ',
        travelAdventure: 'Imala fi Bashannana',
        relationshipBoundaries: 'Daangaa Walqunnamtii',
        trustTruth: 'Amantii fi Dhugaa',
        kidsFuture: 'Ijoollee fi Fuuldura',
        financeGoals: 'Maallaqa fi Kaayyoo',
        familyRelations: 'Walitti Dhufeenya Maatii',
        bibleConvictions: 'Amantii Macaafa Qulqulluu',
      },
      categoryDescriptions: {
        dailyLifeHabits: 'Jireenya guyyaa fi akkamitti hojjechuu baradhu',
        intimacyLifestyle: 'Waliin hariiroo siif cimu tolchi',
        loveBalance: 'Madaallii waliinii argadhu',
        dreamWeddingHome: 'Fuulduratti karoora kee qopheessi',
        travelAdventure: 'Addunyaa waliin qoradhu',
        relationshipBoundaries: 'Daangaa fayyaa uumi',
        trustTruth: 'Amantii fi dhugaa ijaari',
        kidsFuture: 'Karoorri maatii ni mari’adha',
        financeGoals: 'Maallaqaaf karoora qopheessi',
        familyRelations: 'Waliigaltee maatii tasgabbeessi',
        bibleConvictions: 'Amantii fi yaada Macaafa Qulqulluu irratti mariadhu',
      },
    },
    profile: {
      title: 'Eenyummaa',
      myProfile: 'Eenyummaa Kiyya',
      editProfile: 'Eenyummaa Gulaali',
      partnerCode: 'Koodii Hiriyaa',
      enterPartnerCode: 'Koodii hiriyaa galchi',
      linkPartner: 'Hiriyaa Walqabsiisi',
      relationshipStart: 'Guyyaa Hariiroo Jalqabame',
      linkedWith: 'Walqabatee jira',
      notLinked: 'Walqabatee miti',
      preferences: 'Filannoo',
      language: 'Afaan',
      notifications: 'Beeksisa',
      theme: 'Fakkaataa',
      about: "Waa'ee",
      version: 'Vershinii',
    },
    bible: {
      title: 'Macaafa Qulqulluu',
      selectBook: 'Kitaaba Filadhu',
      selectChapter: 'Boqonnaa Filadhu',
      oldTestament: 'Kakuu Moofaa',
      newTestament: 'Kakuu Haaraa',
      search: 'Barbaadi',
      bookmarks: 'Mallattoo',
      highlights: 'Ibsituu',
      addHighlight: 'Ibsituu Dabaluu',
      addNote: 'Yaadannoo Dabaluu',
      shareVerse: 'Weeji Qoodi',
      copyVerse: 'Weeji Kopii',
    },
    notifications: {
      title: 'Beeksisa',
      enableNotifications: 'Beeksisa Dandeessisi',
      disableNotifications: 'Beeksisa Dhaabi',
      notificationsOn: 'Beeksisni Banaa dha',
      notificationsOff: 'Beeksisa Dandeessisi',
      youllBeNotified: 'Beeksisa argatta:',
      sharedVerse: 'Weejjonni fi ibsituuwwan Macaafa Qulqulluu qoodame',
      newPrayer: 'Gaaffii kadhannaa haaraa hiriyaa keetii irraa',
      journalEntry: "Galma'aa yaadannoo fi xumura kaayyoo",
      devotionalComplete: 'Yaadachiisa kaayyoo amantii guyyaa guyyaa',
      milestone: "Kabaja fi milkaa'ina balbala",
      dailyReminder: 'Yaadachiisa guyyaa guyyaa',
      pushNotifications: 'Beeksisa Push',
      stayConnected: 'Beeksisa ariifataan hiriyaa keetiin quunnamaa tulli',
      permissionRequired: 'Hayyama Barbaachisa',
      enableInSettings: "Qindaa'ina browser keessatti beeksisa dandeessisi",
      unreadItems: 'beeksisa hin dubbifamne',
      markAllRead: 'Hunda dubbifame godhi',
      allCaughtUp: 'Hunda ilaaltetta!',
      noNewNotifications: 'Odeeffannoo haaraa hiriyaa kee irraa asitti argita.',
      markRead: 'Dubbifame godhi',
      removed: 'Beeksisni haqameera',
      removeFailed: 'Beeksisa haquun hin danda’amne',
    },
    milestones: {
      title: 'Balbala',
      addMilestone: 'Balbala Dabaluu',
      editMilestone: 'Balbala Gulaali',
      deleteMilestone: 'Balbala Haquu',
      milestoneTitle: 'Mata-duree Balbala',
      milestoneDescription: 'Ibsa',
      milestoneDate: 'Guyyaa',
      selectIcon: 'Akaakuu Filadhu',
      noMilestones: 'Ammaaf balballi hin jiru',
      addFirstMilestone: 'Balbala jalqabaa kee dabaluu',
    },
    mood: {
      title: 'Miira',
      great: "Baay'ee Gaarii",
      good: 'Gaarii',
      okay: 'Tole',
      sad: 'Gadda',
      notSetYet: "Ammaaf hin qindaa'ofne",
      analytics: 'Xiinxala Miiraa',
      analyticsDescription: 'Imala miiraa keessan waliin hordofaa',
      weeklyReport: 'Gabaasa Torban',
      moodTrends: 'Achiistuu Miiraa',
      howAreYouFeelingToday: "Har'aa akkam itti dhagahama?",
      shareEmotionalState: 'Haala miiraa kee hiriyaa keetiin qoodi',
      addNote: 'Yaadannoo dabaluu (filannoo)',
      notePlaceholder: "Har'aa garaan kee maal jedha?",
      generating: 'Qopheessaa jira...',
      analysisGenerated: "Calaqqeen kee qophaa'e! 💝",
      saveMood: 'Miira Kuuxi',
      moodSaved: 'Miirri kuufame! 💝',
      failedSave: 'Miira kuuxuu dadhabame',
      failedLoad: 'Deetaa miiraa fe\'uu dadhabame',
      needPartnerForAnalysis: 'Calaqqee uumuuf hiriyaa kee waliin quunnami',
      relationshipReflection: 'Calaqqee Walqunnamtii',
      reflectionReady: 'Calaqqeen kee qophaa’eera 💝',
      generateReflection: 'Calaqqee Uumi',
      reflectionDescription: 'Imala miiraa keessan waliinii irratti calaqqee ho’aa',
      basicMoodSummary: 'Cuunfaa Miiraa',
      reportUnavailable: 'Calaqqeen dhuunfaa yeroo hin argamnetti cuunfaan miiraa salphaan agarsiifama.',
      weeklyReflection: 'Calaqqee Torbanii',
      entry: 'galmee',
      entries: 'galmeewwan',
      you: 'Ati',
      partner: 'Hiriyaa',
      low: 'Gadi aanaa',
    },

    partner: {
      connectTitle: 'Hiriyaa Kee Waliin Quunnamaa',
      connectDesc: 'Imala waliin jalqabuuf hiriyaa kee dabaluu',
      partnerEmail: 'Imeelii Hiriyaa',
      partnerEmailPlaceholder: 'partner@example.com',
      partnerName: 'Maqaa Hiriyaa',
      partnerNamePlaceholder: 'Maqaa hiriyaa galchi',
      relationshipStarted: 'Hariiroon Eegale',
      connecting: 'Quunnamaa jira...',
      connect: 'Hiriyaa Waliin Quunnamaa',
      createTitle: 'Herrega Hiriyaa Uumi',
      createDesc: 'Quunnamuuf herrega uumi',
      creating: 'Uumaa jira...',
      createConnect: "Uumi fi Quunnamaa",
      back: "Deebi'i",
      notFound: "Herrega hiriyaa hin argamne. Isaaf/isheetiif uumuu?",
      failedConnect: "Hiriyaa waliin quunnamuu dadhabame",
      fillAllFields: "Maaloo dirreewwan hunda guuti",
      createdFor: "Herreega uumame",
      failedCreate: "Herrega hiriyaa uumuu dadhabame",
      allSet: "Hunda Qophaa'e! 💕",
      connectedWith: "...waliin quunnamte",
      tempPasswordNote: "Jecha darbii yeroo gabaabaaf uumama. Hiriyaa keetif qoodi.",
      ifNoAccount: "Hiriyaan kee herrega hin qabaatin yoo ta'e, isaa/isheetiif uumuuf si gargaarra",
    },

    offline: {
      backOnline: 'Deebi\'ee quunname',
      youreOffline: "Intarneetiin hin jiru. Muuxannooleen tokko tokko hojjechuu dhabu.",
    },
    messages: {
      savedSuccessfully: "Milkaa'inaan kuufame",
      deletedSuccessfully: "Milkaa'inaan haqqame",
      sharedSuccessfully: "Milkaa'inaan qoodame",
      errorOccurred: 'Dogoggori uumameera',
      noInternetConnection: 'Quunnamtii intarneetii hin jiru',
      tryAgainLater: "Maaloo booda irra deebi'i yaali",
      confirmDelete: 'Haquusa Mirkaneessi',
      areYouSure: 'Mirkana?',
      cannotUndo: "Tarkaanfiin kun deebi'ee deemuu hin danda'u",
    },
    time: {
      second: 'sekondii',
      seconds: 'sekondiiwwan',
      minute: 'daqiiqaa',
      minutes: 'daqiiqaalee',
      hour: "sa'atii",
      hours: "sa'aatiiwwan",
      day: 'guyyaa',
      days: 'guyyaalee',
      week: 'torban',
      weeks: 'torbanoolee',
      month: "ji'a",
      months: "ji'ootni",
      year: 'bara',
      years: 'barootni',
      ago: 'dura',
      justNow: 'amma dura',
    },
    install: {
      title: 'TwoBeOne Diriirsi',
      subtitle: 'Muuxannoo gaarii argachuuf screen jalqabaa kee irratti dabaluu',
      iosInstructions: 'iOS irratti diriirsuuf:',
      iosStep1: 'Caancala Qoodi gadiitti cuqi',
      iosStep2: 'Tiirirsii "Screen Jalqabaatti Dabaluu" cuqi',
      iosStep3: 'Mirkaneessuuf "Dabaluu" cuqi',
      androidInstructions: 'TwoBeOne meeshaa kee irratti diriirsuuf caancala gadii cuqi',
      installButton: 'Appii Diriirsi',
      gotIt: 'Hubadhe!',
      dismiss: 'Dhiisi',
      benefit1Title: 'Ariifataa',
      benefit1Desc: "Saffisaan galmaa'a",
      benefit2Title: 'Uummamaa',
      benefit2Desc: 'Akka appitti',
      benefit3Title: 'Beeksisa',
      benefit3Desc: 'Beeksisa argadhu',
    },
    community: {
      title: 'Hawaasa',
      myGroups: 'Gareelee Kiyya',
      joinGroup: "Garee Makama'a",
      createGroup: 'Garee Uumi',
      groupName: 'Maqaa Garee',
      groupDescription: 'Ibsa',
      members: 'Miseensota',
      posts: 'Maxxansa',
      noPosts: 'Ammaaf maxxansaan hin jiru',
      writePost: 'Maxxansa barreessi...',
      sendMessage: 'Ergi',
      leaveGroup: 'Garee Dhiisi',
    },
  },
};

// Get translation by key path
export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} for language: ${lang}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Get all translations for a language
export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

// Language metadata
export const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'am' as Language, name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om' as Language, name: 'Afan Oromo', nativeName: 'Oromiffa', flag: '🇪🇹' },
];
