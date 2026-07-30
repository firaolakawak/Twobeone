import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { 
  BookOpen, 
  Highlighter, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  MessageCircle,
  X,
  Menu,
  Search,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { bibleChapters } from '../data/bible-chapters';
import { fetchBibleChapter, prefetchChapters } from '../utils/bibleApi';
import { fetchAmharicChapter, getAmharicBookName, isBibleLoaded } from '../utils/amharicBibleApi';
import { VisuallyHidden } from './ui/visually-hidden';

// Bible books organized by testament
const BIBLE_BOOKS = {
  'Old Testament': [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
    'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ],
  'New Testament': [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
    'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ]
};

// Chapter counts for each book
const CHAPTER_COUNTS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
  'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
  'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
  'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
  'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
  'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16, 'Luke': 24,
  'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16,
  '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6, 'Philippians': 4,
  'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
  '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1,
  'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
  '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
};

interface ComprehensiveBibleReaderProps {
  isOpen: boolean;
  onClose: () => void;
  initialReference?: string;
  reference?: string;
  verse?: string;
  onSaveHighlight?: (data: {
    reference: string;
    verseNumber: number;
    text: string;
    color: string;
    note?: string;
  }) => Promise<void>;
  onShareWithPartner?: (data: {
    reference: string;
    verseNumber: number;
    text: string;
    note?: string;
  }) => Promise<void>;
  partnerName?: string;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', class: 'bg-warning-50', value: 'yellow' },
  { name: 'Green', class: 'bg-success-50', value: 'green' },
  { name: 'Blue', class: 'bg-sky-100', value: 'blue' },
  { name: 'Pink', class: 'bg-primary-200', value: 'pink' },
  { name: 'Purple', class: 'bg-primary-200', value: 'purple' },
];

export function ComprehensiveBibleReader({
  isOpen,
  onClose,
  initialReference,
  reference,
  verse,
  onSaveHighlight,
  onShareWithPartner,
  partnerName = 'Partner'
}: ComprehensiveBibleReaderProps) {
  const [readerLanguage, setReaderLanguage] = useState<'en' | 'am'>('am');
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [selectedBook, setSelectedBook] = useState('Romans');
  const [selectedChapter, setSelectedChapter] = useState(8);
  const [bookChapter, setBookChapter] = useState<any>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [note, setNote] = useState('');
  const [highlights, setHighlights] = useState<Map<number, { color: string; note?: string }>>(new Map());
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bibleDownloading, setBibleDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Parse initial reference if provided
      const ref = initialReference || reference;
      if (ref) {
        const match = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
        if (match) {
          const [, book, chapter] = match;
          setSelectedBook(book.trim());
          setSelectedChapter(parseInt(chapter));
          return; // Let the next useEffect handle loading
        }
      }
    }
  }, [isOpen, initialReference, reference]);

  // Separate effect to load chapter when book, chapter, or language changes
  useEffect(() => {
    if (isOpen) {
      loadChapter(selectedBook, selectedChapter, readerLanguage);
    }
  }, [isOpen, selectedBook, selectedChapter, readerLanguage]);

  const loadChapter = async (book: string, chapter: number, lang: 'en' | 'am') => {
    setIsLoading(true);

    if (lang === 'am') {
      if (!isBibleLoaded()) setBibleDownloading(true);
      try {
        const amData = await fetchAmharicChapter(book, chapter);
        // amData has bookName from XML; adapt to component's expected shape
        setBookChapter({
          book: amData.bookName,
          chapter: amData.chapter,
          verses: amData.verses,
        });
      } catch (error) {
        console.error('[ComprehensiveBibleReader] Amharic fetch failed:', error);
        setBookChapter({
          book: getAmharicBookName(book),
          chapter,
          verses: [{ number: 1, text: 'ምዕራፉን ለመጫን አልተቻለም። የኢንተርኔት ግንኙነቱን ያረጋግጡ።' }],
        });
      } finally {
        setBibleDownloading(false);
        setIsLoading(false);
      }
      return;
    }

    // English path — try local data first, then API
    const chapterData = bibleChapters.find(
      c => c.book.toLowerCase() === book.toLowerCase() && c.chapter === chapter
    );

    if (chapterData) {
      setBookChapter(chapterData);
      setIsLoading(false);
    } else {
      try {
        const apiChapterData = await fetchBibleChapter(book, chapter);
        setBookChapter(apiChapterData);

        const nextChapter = chapter + 1;
        const prevChapter = chapter - 1;
        const maxChapter = CHAPTER_COUNTS[book] || 1;
        const chaptersToFetch: number[] = [];
        if (prevChapter >= 1) chaptersToFetch.push(prevChapter);
        if (nextChapter <= maxChapter) chaptersToFetch.push(nextChapter);
        if (chaptersToFetch.length > 0) {
          prefetchChapters(book, chaptersToFetch).catch(console.error);
        }
      } catch (error) {
        console.error('[ComprehensiveBibleReader] Failed to load chapter:', error);
        setBookChapter({
          book,
          chapter,
          verses: [{ number: 1, text: 'Unable to load this chapter. Please check your internet connection and try again.' }],
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setShowBookSelector(false);
    setShowChapterSelector(true);
  };

  const handleSelectChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    setShowChapterSelector(false);
  };

  const handlePreviousChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // Go to previous book
      const allBooks = [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']];
      const currentIndex = allBooks.indexOf(selectedBook);
      if (currentIndex > 0) {
        const prevBook = allBooks[currentIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(CHAPTER_COUNTS[prevBook] || 1);
      }
    }
  };

  const handleNextChapter = () => {
    const maxChapter = CHAPTER_COUNTS[selectedBook] || 1;
    if (selectedChapter < maxChapter) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // Go to next book
      const allBooks = [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']];
      const currentIndex = allBooks.indexOf(selectedBook);
      if (currentIndex < allBooks.length - 1) {
        const nextBook = allBooks[currentIndex + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
      }
    }
  };

  const handleHighlightVerse = async (verseNumber: number, verseText: string) => {
    if (!onSaveHighlight) return;

    try {
      const newHighlights = new Map(highlights);
      newHighlights.set(verseNumber, { color: highlightColor, note });
      setHighlights(newHighlights);

      await onSaveHighlight({
        reference: `${selectedBook} ${selectedChapter}:${verseNumber}`,
        verseNumber,
        text: verseText,
        color: highlightColor,
        note: note || undefined
      });

      toast.success('Verse highlighted!');
      setSelectedVerse(null);
      setNote('');
      setShowNoteInput(false);
    } catch (error) {
      console.error('Failed to save highlight:', error);
      toast.error('Failed to save highlight');
    }
  };

  const handleShareWithPartner = async (verseNumber: number, verseText: string) => {
    if (!onShareWithPartner) return;

    try {
      await onShareWithPartner({
        reference: `${selectedBook} ${selectedChapter}:${verseNumber}`,
        verseNumber,
        text: verseText,
        note: note || undefined
      });

      toast.success(`Shared with ${partnerName}!`);
      setSelectedVerse(null);
      setNote('');
      setShowNoteInput(false);
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share with partner');
    }
  };

  const getHighlightClass = (verseNumber: number) => {
    const highlight = highlights.get(verseNumber);
    if (!highlight) return '';
    
    const colorMap: Record<string, string> = {
      yellow: 'bg-warning-50',
      green: 'bg-success-50',
      blue: 'bg-sky-100',
      pink: 'bg-primary-200',
      purple: 'bg-primary-200'
    };
    
    return colorMap[highlight.color] || '';
  };

  const filteredBooks = searchQuery
    ? [...BIBLE_BOOKS['Old Testament'], ...BIBLE_BOOKS['New Testament']].filter(book =>
        book.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Bible Reader - {selectedBook} Chapter {selectedChapter}</DialogTitle>
        </VisuallyHidden>
        <DialogDescription className="sr-only">
          Read and study the Bible, highlight verses, and share with your partner
        </DialogDescription>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: 'var(--primary-foreground)', padding: 'var(--spacing-4) var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <BookOpen style={{ width: '1.5rem', height: '1.5rem' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-medium)', margin: 0 }}>
                {readerLanguage === 'am' ? 'መጽሐፍ ቅዱስ' : 'Bible Reader'}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              {/* Language toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                <button
                  onClick={() => setReaderLanguage('am')}
                  style={{
                    background: readerLanguage === 'am' ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: readerLanguage === 'am' ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    padding: 'var(--spacing-1) var(--spacing-2)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  አማርኛ
                </button>
                <button
                  onClick={() => setReaderLanguage('en')}
                  style={{
                    background: readerLanguage === 'en' ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: readerLanguage === 'en' ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    padding: 'var(--spacing-1) var(--spacing-2)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  English
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Book and Chapter Selector */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowBookSelector(!showBookSelector)}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              <Menu className="w-4 h-4 mr-2" />
              {readerLanguage === 'am' ? (getAmharicBookName(selectedBook)) : selectedBook}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              {readerLanguage === 'am' ? `ምዕራፍ ${selectedChapter}` : `Chapter ${selectedChapter}`}
            </Button>

            {/* Navigation */}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousChapter}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextChapter}
                className="text-white hover:bg-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Book Selector */}
        {showBookSelector && (
          <div className="absolute top-24 left-6 right-6 bg-card rounded-lg shadow-2xl border z-50 max-h-[60vh] overflow-hidden">
            <div className="p-4 border-b sticky top-0 bg-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4 space-y-4">
                {(filteredBooks ? filteredBooks.map(book => (
                  <button
                    key={book}
                    onClick={() => handleSelectBook(book)}
                    style={{ width: '100%', textAlign: 'left', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--foreground)', fontFamily: 'inherit' }}
                  >
                    {readerLanguage === 'am' ? (getAmharicBookName(book)) : book}
                  </button>
                )) : Object.entries(BIBLE_BOOKS).map(([testament, books]) => (
                  <div key={testament}>
                    <h3 style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', marginBottom: 'var(--spacing-2)', fontSize: 'var(--text-sm)' }}>
                      {readerLanguage === 'am'
                        ? (testament === 'Old Testament' ? 'ብሉይ ኪዳን' : 'አዲስ ኪዳን')
                        : testament}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {books.map((book: string) => (
                        <button
                          key={book}
                          onClick={() => handleSelectBook(book)}
                          style={{
                            textAlign: 'left',
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'inherit',
                            background: book === selectedBook ? 'var(--primary-50, #f5f3ff)' : 'transparent',
                            color: book === selectedBook ? 'var(--primary)' : 'var(--foreground)',
                            fontWeight: book === selectedBook ? 'var(--font-weight-medium)' : 'normal',
                            transition: 'background 0.1s',
                          }}
                        >
                          {readerLanguage === 'am' ? (getAmharicBookName(book)) : book}
                        </button>
                      ))}
                    </div>
                  </div>
                )))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Chapter Selector */}
        {showChapterSelector && (
          <div className="absolute top-24 left-6 right-6 bg-card rounded-lg shadow-2xl border z-50 max-h-[60vh] overflow-hidden">
            <div className="p-4 border-b bg-primary-50">
              <h3 style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', fontSize: 'var(--text-sm)' }}>
                {readerLanguage === 'am'
                  ? `ምዕራፍ ይምረጡ — ${getAmharicBookName(selectedBook)}`
                  : `Select Chapter — ${selectedBook}`}
              </h3>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4">
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from({ length: CHAPTER_COUNTS[selectedBook] || 1 }, (_, i) => i + 1).map(chapter => (
                    <button
                      key={chapter}
                      onClick={() => handleSelectChapter(chapter)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        chapter === selectedChapter
                          ? 'bg-primary-600 text-white font-semibold'
                          : 'bg-muted hover:bg-primary-50'
                      }`}
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Bible download progress banner */}
        {bibleDownloading && (
          <div style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', padding: 'var(--spacing-2) var(--spacing-6)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--text-sm)' }}>
            <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
            <span>አማርኛ መጽሐፍ ቅዱስ እየተጫነ ነው… (Bible loading for the first time)</span>
          </div>
        )}

        {/* Chapter Content */}
        <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(95vh - 180px)' }}>
          {bookChapter && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 text-center">
                <h1 style={{ fontSize: 'var(--text-display)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: 'var(--spacing-1)' }}>
                  {readerLanguage === 'am'
                    ? `${getAmharicBookName(selectedBook)} ${selectedChapter}`
                    : `${selectedBook} ${selectedChapter}`}
                </h1>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                  {readerLanguage === 'am'
                    ? `ያንብቡ፣ ያጉሉ፣ እና ከ${partnerName} ጋር ያካፍሉ`
                    : `Read, highlight, and share with ${partnerName}`}
                </p>
              </div>

              <div className="space-y-3">
                {bookChapter.verses.map((v: any) => {
                  const isSelected = selectedVerse === v.number;
                  const isHighlighted = highlights.has(v.number);
                  const highlightClass = getHighlightClass(v.number);

                  return (
                    <div key={v.number}>
                      <div
                        className={`p-4 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-50 border-2 border-primary-300'
                            : highlightClass
                            ? `${highlightClass} border border-border`
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedVerse(isSelected ? null : v.number)}
                      >
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                            {v.number}
                          </span>
                          <p className="flex-1 text-foreground leading-relaxed">
                            {v.text}
                          </p>
                        </div>

                        {/* Verse Actions */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            {/* Highlight Colors */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-muted-foreground">Highlight:</span>
                              {HIGHLIGHT_COLORS.map(color => (
                                <button
                                  key={color.value}
                                  className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                                    highlightColor === color.value
                                      ? 'border-primary-600 scale-110'
                                      : 'border-border'
                                  } transition-all hover:scale-110`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHighlightColor(color.value);
                                  }}
                                  title={color.name}
                                />
                              ))}
                            </div>

                            {/* Note Input */}
                            {showNoteInput ? (
                              <textarea
                                style={{ width: '100%', padding: 'var(--spacing-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', resize: 'none', outline: 'none', fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--card)' }}
                                placeholder={readerLanguage === 'am' ? 'ማስታወሻ ይጨምሩ (አማራጭ)...' : 'Add a note (optional)...'}
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNoteInput(true);
                                }}
                                className="text-muted-foreground"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                {readerLanguage === 'am' ? 'ማስታወሻ ይጨምሩ' : 'Add Note'}
                              </Button>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHighlightVerse(v.number, v.text);
                                }}
                                className="flex-1 bg-primary-600 hover:bg-primary-700"
                              >
                                <Highlighter className="w-4 h-4 mr-2" />
                                {readerLanguage === 'am' ? 'ምልክት ያድርጉ' : 'Save Highlight'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareWithPartner(v.number, v.text);
                                }}
                                className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50"
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                {readerLanguage === 'am' ? 'ያካፍሉ' : 'Share'}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show existing note */}
                        {isHighlighted && highlights.get(v.number)?.note && (
                          <div className="mt-3 p-3 bg-card bg-opacity-70 rounded-lg border border-border">
                            <p className="text-sm text-foreground italic">
                              📝 {highlights.get(v.number)?.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div style={{ padding: 'var(--spacing-3) var(--spacing-6)', borderTop: '1px solid var(--border)', background: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Highlighter style={{ width: '1rem', height: '1rem' }} />
              <span>{highlights.size} {readerLanguage === 'am' ? 'ምልክት የተደረገ' : 'highlighted'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <BookOpen style={{ width: '1rem', height: '1rem' }} />
              <span>{bookChapter?.verses.length || 0} {readerLanguage === 'am' ? 'ቁጥሮች' : 'verses'}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}