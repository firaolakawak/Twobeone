// Amharic Bible from: github.com/Beblia/Holy-Bible-XML-Format/AmharicBible.xml
// Fetched once, parsed with DOMParser, all chapters cached in-memory.

const RAW_URL =
  'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/AmharicBible.xml';

export interface AmharicVerse {
  number: number;
  text: string;
}

export interface AmharicChapter {
  bookNumber: number;
  bookName: string;       // Amharic name from XML
  chapter: number;
  verses: AmharicVerse[];
}

// book number (1-66) → Amharic name (populated after first parse)
const bookNames = new Map<number, string>();
// cache key: "{bookNumber}-{chapter}" → chapter data
const chapterCache = new Map<string, AmharicChapter>();

let parsePromise: Promise<void> | null = null;
let parsed = false;

// ----- English book name → canonical number (1-66) -----
export const BOOK_NUMBER: Record<string, number> = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
  'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
  'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
  'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
  'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46,
  '2 Corinthians': 47, 'Galatians': 48, 'Ephesians': 49, 'Philippians': 50,
  'Colossians': 51, '1 Thessalonians': 52, '2 Thessalonians': 53,
  '1 Timothy': 54, '2 Timothy': 55, 'Titus': 56, 'Philemon': 57,
  'Hebrews': 58, 'James': 59, '1 Peter': 60, '2 Peter': 61,
  '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66,
};

// Fallback Amharic book names if not found in XML
export const AMHARIC_BOOK_NAMES: Record<string, string> = {
  'Genesis': 'ዘፍጥረት', 'Exodus': 'ዘፀዓት', 'Leviticus': 'ዘሌዋውያን',
  'Numbers': 'ዘኍልቍ', 'Deuteronomy': 'ዘዳግም', 'Joshua': 'ኢያሱ',
  'Judges': 'መሳፍንት', 'Ruth': 'ሩት', '1 Samuel': '1ሳሙኤል',
  '2 Samuel': '2ሳሙኤል', '1 Kings': '1ነገሥት', '2 Kings': '2ነገሥት',
  '1 Chronicles': '1ዜና መዋዕል', '2 Chronicles': '2ዜና መዋዕል',
  'Ezra': 'ዕዝራ', 'Nehemiah': 'ነህምያ', 'Esther': 'አስቴር', 'Job': 'ኢዮብ',
  'Psalms': 'መዝሙር', 'Proverbs': 'ምሳሌ', 'Ecclesiastes': 'መክብብ',
  'Song of Solomon': 'መኃልየ ዘሰሎሞን', 'Isaiah': 'ኢሳይያስ',
  'Jeremiah': 'ኤርምያስ', 'Lamentations': 'ዋይታ', 'Ezekiel': 'ሕዝቅኤል',
  'Daniel': 'ዳንኤል', 'Hosea': 'ሆሴዕ', 'Joel': 'ኢዮኤል', 'Amos': 'አሞጽ',
  'Obadiah': 'አብድዩ', 'Jonah': 'ዮናስ', 'Micah': 'ሚክያስ', 'Nahum': 'ናሆም',
  'Habakkuk': 'ዕንባቆም', 'Zephaniah': 'ሶፎንያስ', 'Haggai': 'ሐጌ',
  'Zechariah': 'ዘካርያስ', 'Malachi': 'ሚልክያስ', 'Matthew': 'ማቴዎስ',
  'Mark': 'ማርቆስ', 'Luke': 'ሉቃስ', 'John': 'ዮሐንስ',
  'Acts': 'የሐዋርያት ሥራ', 'Romans': 'ሮሜ', '1 Corinthians': '1ቆሮንቶስ',
  '2 Corinthians': '2ቆሮንቶስ', 'Galatians': 'ገላትያ', 'Ephesians': 'ኤፌሶን',
  'Philippians': 'ፊልጵስዩስ', 'Colossians': 'ቆላስይስ',
  '1 Thessalonians': '1ተሰሎንቄ', '2 Thessalonians': '2ተሰሎንቄ',
  '1 Timothy': '1ጢሞቴዎስ', '2 Timothy': '2ጢሞቴዎስ', 'Titus': 'ቲቶ',
  'Philemon': 'ፊልሞና', 'Hebrews': 'ዕብራውያን', 'James': 'ያዕቆብ',
  '1 Peter': '1ጴጥሮስ', '2 Peter': '2ጴጥሮስ', '1 John': '1ዮሐንስ',
  '2 John': '2ዮሐንስ', '3 John': '3ዮሐንስ', 'Jude': 'ይሁዳ',
  'Revelation': 'ራዕይ',
};

/** Return the Amharic display name for an English book name */
export function getAmharicBookName(englishBook: string): string {
  const num = BOOK_NUMBER[englishBook];
  if (num && bookNames.has(num)) return bookNames.get(num)!;
  return AMHARIC_BOOK_NAMES[englishBook] || englishBook;
}

// ---- Fetch & parse the full XML (once per session) ----
async function ensureParsed(): Promise<void> {
  if (parsed) return;
  if (parsePromise) return parsePromise;

  parsePromise = (async () => {
    try {
      console.log('[AmharicBible] Fetching XML from GitHub…');
      const res = await fetch(RAW_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();

      console.log('[AmharicBible] Parsing XML…');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');

      const bookEls = doc.querySelectorAll('book');
      bookEls.forEach((bookEl) => {
        const bookNum = parseInt(bookEl.getAttribute('number') || '0', 10);
        if (!bookNum) return;

        // Some XMLs include a name attribute; use it if present
        const nameAttr = bookEl.getAttribute('name') || '';

        const chapterEls = bookEl.querySelectorAll('chapter');
        chapterEls.forEach((chEl) => {
          const chNum = parseInt(chEl.getAttribute('number') || '0', 10);
          if (!chNum) return;

          const verses: AmharicVerse[] = [];
          chEl.querySelectorAll('verse').forEach((vEl) => {
            const vNum = parseInt(vEl.getAttribute('number') || '0', 10);
            const text = (vEl.textContent || '').trim();
            if (vNum && text) verses.push({ number: vNum, text });
          });

          // Derive Amharic book name from first verse content or fallback map
          let amName = nameAttr;
          if (!amName) {
            // Look up via fallback map using book number
            const entry = Object.entries(BOOK_NUMBER).find(([, n]) => n === bookNum);
            amName = entry ? (AMHARIC_BOOK_NAMES[entry[0]] || entry[0]) : `Book ${bookNum}`;
          }
          bookNames.set(bookNum, amName);

          const cacheKey = `${bookNum}-${chNum}`;
          chapterCache.set(cacheKey, {
            bookNumber: bookNum,
            bookName: amName,
            chapter: chNum,
            verses,
          });
        });
      });

      parsed = true;
      console.log(`[AmharicBible] Parsed — ${chapterCache.size} chapters cached.`);
    } catch (err) {
      parsePromise = null; // allow retry
      throw err;
    }
  })();

  return parsePromise;
}

/** Fetch a chapter by English book name + chapter number */
export async function fetchAmharicChapter(
  englishBook: string,
  chapter: number
): Promise<AmharicChapter> {
  await ensureParsed();

  const bookNum = BOOK_NUMBER[englishBook];
  if (!bookNum) {
    return {
      bookNumber: 0,
      bookName: AMHARIC_BOOK_NAMES[englishBook] || englishBook,
      chapter,
      verses: [{ number: 1, text: 'መጽሐፉ አልተገኘም።' }],
    };
  }

  const key = `${bookNum}-${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key)!;

  return {
    bookNumber: bookNum,
    bookName: AMHARIC_BOOK_NAMES[englishBook] || englishBook,
    chapter,
    verses: [{ number: 1, text: 'ምዕራፉ አልተገኘም። ኢንተርኔቱን ያረጋግጡ።' }],
  };
}

/** True once the XML has been fully downloaded and parsed */
export function isBibleLoaded(): boolean {
  return parsed;
}

export function clearAmharicCache(): void {
  chapterCache.clear();
  bookNames.clear();
  parsed = false;
  parsePromise = null;
}
