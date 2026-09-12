import type { Language } from "../utils/i18n";

interface MoodCheckInCopy {
  description: string;
  notNow: string;
  saving: string;
  saveError: string;
  yourMood: string;
  moodInsights: string;
  partnerMood: string;
  dailyHint: string;
}

export const moodCheckInCopy: Record<Language, MoodCheckInCopy> = {
  en: {
    description: "Share how you feel with your partner today.",
    notNow: "Not now",
    saving: "Sharing your mood…",
    saveError: "Your mood could not be shared. Please try again.",
    yourMood: "Your mood",
    moodInsights: "Mood insights",
    partnerMood: "{name} feels {mood}",
    dailyHint: "Share how you feel every 24 hours.",
  },
  am: {
    description: "ዛሬ የሚሰማዎትን ለአጋርዎ ያጋሩ።",
    notNow: "አሁን አይደለም",
    saving: "ስሜትዎን በማጋራት ላይ…",
    saveError: "ስሜትዎን ማጋራት አልተቻለም። እንደገና ይሞክሩ።",
    yourMood: "የእርስዎ ስሜት",
    moodInsights: "የስሜት ትንታኔ",
    partnerMood: "የ{name} ስሜት፦ {mood}",
    dailyHint: "በየ24 ሰዓቱ የሚሰማዎትን ያጋሩ።",
  },
  om: {
    description: "Miira kee har'aa hiriyaa keetiif qoodi.",
    notNow: "Amma miti",
    saving: "Miirri kee qoodamaa jira…",
    saveError: "Miira kee qooduun hin danda'amne. Irra deebi'ii yaali.",
    yourMood: "Miira kee",
    moodInsights: "Xiinxala miiraa",
    partnerMood: "{name} miira {mood} qaba",
    dailyHint: "Sa'aatii 24tti miira kee qoodi.",
  },
};
