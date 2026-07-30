export interface DailyBibleVerse {
  reference: string;
  text: string;
  translation: string;
}

interface BibleBook {
  id: string;
  name: string;
  chapters: number;
}

// Protestant canon in biblical order. The daily permutation visits every
// book once in each 66-day cycle, from Genesis through Revelation.
export const BIBLE_BOOKS: readonly BibleBook[] = [
  { id: "GEN", name: "Genesis", chapters: 50 },
  { id: "EXO", name: "Exodus", chapters: 40 },
  { id: "LEV", name: "Leviticus", chapters: 27 },
  { id: "NUM", name: "Numbers", chapters: 36 },
  { id: "DEU", name: "Deuteronomy", chapters: 34 },
  { id: "JOS", name: "Joshua", chapters: 24 },
  { id: "JDG", name: "Judges", chapters: 21 },
  { id: "RUT", name: "Ruth", chapters: 4 },
  { id: "1SA", name: "1 Samuel", chapters: 31 },
  { id: "2SA", name: "2 Samuel", chapters: 24 },
  { id: "1KI", name: "1 Kings", chapters: 22 },
  { id: "2KI", name: "2 Kings", chapters: 25 },
  { id: "1CH", name: "1 Chronicles", chapters: 29 },
  { id: "2CH", name: "2 Chronicles", chapters: 36 },
  { id: "EZR", name: "Ezra", chapters: 10 },
  { id: "NEH", name: "Nehemiah", chapters: 13 },
  { id: "EST", name: "Esther", chapters: 10 },
  { id: "JOB", name: "Job", chapters: 42 },
  { id: "PSA", name: "Psalms", chapters: 150 },
  { id: "PRO", name: "Proverbs", chapters: 31 },
  { id: "ECC", name: "Ecclesiastes", chapters: 12 },
  { id: "SNG", name: "Song of Solomon", chapters: 8 },
  { id: "ISA", name: "Isaiah", chapters: 66 },
  { id: "JER", name: "Jeremiah", chapters: 52 },
  { id: "LAM", name: "Lamentations", chapters: 5 },
  { id: "EZK", name: "Ezekiel", chapters: 48 },
  { id: "DAN", name: "Daniel", chapters: 12 },
  { id: "HOS", name: "Hosea", chapters: 14 },
  { id: "JOL", name: "Joel", chapters: 3 },
  { id: "AMO", name: "Amos", chapters: 9 },
  { id: "OBA", name: "Obadiah", chapters: 1 },
  { id: "JON", name: "Jonah", chapters: 4 },
  { id: "MIC", name: "Micah", chapters: 7 },
  { id: "NAM", name: "Nahum", chapters: 3 },
  { id: "HAB", name: "Habakkuk", chapters: 3 },
  { id: "ZEP", name: "Zephaniah", chapters: 3 },
  { id: "HAG", name: "Haggai", chapters: 2 },
  { id: "ZEC", name: "Zechariah", chapters: 14 },
  { id: "MAL", name: "Malachi", chapters: 4 },
  { id: "MAT", name: "Matthew", chapters: 28 },
  { id: "MRK", name: "Mark", chapters: 16 },
  { id: "LUK", name: "Luke", chapters: 24 },
  { id: "JHN", name: "John", chapters: 21 },
  { id: "ACT", name: "Acts", chapters: 28 },
  { id: "ROM", name: "Romans", chapters: 16 },
  { id: "1CO", name: "1 Corinthians", chapters: 16 },
  { id: "2CO", name: "2 Corinthians", chapters: 13 },
  { id: "GAL", name: "Galatians", chapters: 6 },
  { id: "EPH", name: "Ephesians", chapters: 6 },
  { id: "PHP", name: "Philippians", chapters: 4 },
  { id: "COL", name: "Colossians", chapters: 4 },
  { id: "1TH", name: "1 Thessalonians", chapters: 5 },
  { id: "2TH", name: "2 Thessalonians", chapters: 3 },
  { id: "1TI", name: "1 Timothy", chapters: 6 },
  { id: "2TI", name: "2 Timothy", chapters: 4 },
  { id: "TIT", name: "Titus", chapters: 3 },
  { id: "PHM", name: "Philemon", chapters: 1 },
  { id: "HEB", name: "Hebrews", chapters: 13 },
  { id: "JAS", name: "James", chapters: 5 },
  { id: "1PE", name: "1 Peter", chapters: 5 },
  { id: "2PE", name: "2 Peter", chapters: 3 },
  { id: "1JN", name: "1 John", chapters: 5 },
  { id: "2JN", name: "2 John", chapters: 1 },
  { id: "3JN", name: "3 John", chapters: 1 },
  { id: "JUD", name: "Jude", chapters: 1 },
  { id: "REV", name: "Revelation", chapters: 22 },
] as const;

const CACHE_KEY = "twobeone_daily_bible_verse";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      86400000,
  );
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function readCache(): {
  date: string;
  verse: DailyBibleVerse;
} | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (
      parsed?.date &&
      parsed?.verse?.reference &&
      parsed?.verse?.text
    ) {
      return parsed;
    }
  } catch {
    // Ignore invalid or unavailable browser storage.
  }
  return null;
}

export async function getDailyBibleVerse(
  date = new Date(),
): Promise<DailyBibleVerse> {
  const dateKey = localDateKey(date);
  const cached = readCache();
  if (cached?.date === dateKey) return cached.verse;

  const dayNumber = localDayNumber(date);
  const bookIndex =
    ((dayNumber * 29 + 17) % BIBLE_BOOKS.length +
      BIBLE_BOOKS.length) %
    BIBLE_BOOKS.length;
  const book = BIBLE_BOOKS[bookIndex];
  const chapter =
    (hash(`${dateKey}:${book.id}:chapter`) % book.chapters) + 1;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://bible-api.com/data/kjv/${book.id}/${chapter}`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error("Failed to fetch daily verse");

    const data = await response.json();
    const verses = Array.isArray(data.verses) ? data.verses : [];
    if (verses.length === 0)
      throw new Error("Daily verse chapter was empty");

    const selected =
      verses[hash(`${dateKey}:${book.id}:${chapter}:verse`) % verses.length];
    const verse: DailyBibleVerse = {
      reference: `${selected.book || book.name} ${chapter}:${selected.verse}`,
      text: String(selected.text || "")
        .replace(/\s+/g, " ")
        .trim(),
      translation: data.translation?.name || "King James Version",
    };

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ date: dateKey, verse }),
    );
    return verse;
  } catch (error) {
    // A previous successful verse is a better offline experience than an
    // empty card. It is replaced automatically after the API recovers.
    if (cached?.verse) return cached.verse;
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
