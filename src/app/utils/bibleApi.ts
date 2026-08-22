// Bible API integration using bible-api.com (free, no API key required)
// This provides access to the full Bible in KJV translation

interface BibleVerse {
  number: number;
  text: string;
}

interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

// Cache to avoid repeated API calls
const chapterCache = new Map<string, BibleChapter>();

/**
 * Fetches a Bible chapter from the Bible API
 * @param book - The book name (e.g., "John", "Romans", "1 Corinthians")
 * @param chapter - The chapter number
 * @returns Promise with the chapter data
 */
export async function fetchBibleChapter(book: string, chapter: number): Promise<BibleChapter> {
  const cacheKey = `${book}-${chapter}`;
  
  // Check cache first
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  try {
    // Format the book name for the API (handle spaces and numbers)
    const formattedBook = book.replace(/\s+/g, '+');
    const url = `https://bible-api.com/${formattedBook}+${chapter}?translation=kjv`;
    
    console.log('[BibleAPI] Fetching:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.statusText}`);
    }
    
    const data: BibleApiResponse = await response.json();
    
    // Transform the API response to our format
    const verses: BibleVerse[] = data.verses.map(v => ({
      number: v.verse,
      text: v.text.trim()
    }));
    
    const chapterData: BibleChapter = {
      book: data.verses[0]?.book_name || book,
      chapter,
      verses
    };
    
    // Cache the result
    chapterCache.set(cacheKey, chapterData);
    
    console.log('[BibleAPI] Successfully fetched chapter with', verses.length, 'verses');
    
    return chapterData;
  } catch (error) {
    console.error('[BibleAPI] Error fetching chapter:', error);
    
    // Return a fallback chapter
    return {
      book,
      chapter,
      verses: [{
        number: 1,
        text: 'Unable to load this chapter. Please check your internet connection and try again.'
      }]
    };
  }
}

/**
 * Prefetch multiple chapters for better performance
 * @param book - The book name
 * @param chapters - Array of chapter numbers to prefetch
 */
export async function prefetchChapters(book: string, chapters: number[]): Promise<void> {
  const promises = chapters.map(chapter => fetchBibleChapter(book, chapter));
  await Promise.allSettled(promises);
}

/**
 * Clear the chapter cache (useful if switching translations in the future)
 */
export function clearBibleCache(): void {
  chapterCache.clear();
}

/**
 * Get cache statistics
 */
export function getBibleCacheStats() {
  return {
    size: chapterCache.size,
    chapters: Array.from(chapterCache.keys())
  };
}
