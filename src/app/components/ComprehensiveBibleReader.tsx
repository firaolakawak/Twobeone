import { useUiCopy } from '../utils/uiTranslation';
import { readingUiMessages } from '../locales/readingUi';
import { useCurrentLanguage } from '../utils/languageStore';
import { BrandLoader, LoadingMark } from './BrandLoader';
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
  Search
} from 'lucide-react';
import { toast } from 'sonner';
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
  partnerName
}: ComprehensiveBibleReaderProps) {
  const tr = useUiCopy(readingUiMessages);
  const language = useCurrentLanguage();
  const [readingChoice, setReadingChoice] = useState<{ ui: typeof language; reading: 'en' | 'am' } | null>(null);
  const readerLanguage = readingChoice?.ui === language ? readingChoice.reading : language === 'am' ? 'am' : 'en';
  const setReaderLanguage = (reading: 'en' | 'am') => setReadingChoice({ ui: language, reading });
  const partnerDisplayName = partnerName || tr('Partner');
  const displayBook = (book: string) => readerLanguage === 'am' ? getAmharicBookName(book) : book;
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingAction, setPendingAction] = useState<'highlight' | 'share' | null>(null);

  // An explicit reading choice lasts until the interface language changes.
  useEffect(() => setReadingChoice(null), [language]);

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

  // Ignore stale chapter requests when the book or reading language changes.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadFailed(false);
    setBookChapter(null);
    setSelectedVerse(null);
    setBibleDownloading(readerLanguage === 'am' && !isBibleLoaded());
    const loadChapter = async () => {
      try {
        if (readerLanguage === 'am') {
          const chapter = await fetchAmharicChapter(selectedBook, selectedChapter);
          if (!cancelled) setBookChapter({ book: chapter.bookName, chapter: chapter.chapter, verses: chapter.verses });
        } else {
          const localChapter = bibleChapters.find(c => c.book.toLowerCase() === selectedBook.toLowerCase() && c.chapter === selectedChapter);
          const chapter = localChapter || await fetchBibleChapter(selectedBook, selectedChapter);
          if (cancelled) return;
          // The legacy API helper returns its error as verse text. Keep that
          // operational message out of the reading and translate it below.
          if (!chapter.verses.length || (chapter.verses.length === 1 && chapter.verses[0].text === 'Unable to load this chapter. Please check your internet connection and try again.')) {
            throw new Error('Chapter unavailable');
          }
          setBookChapter(chapter);
          if (!localChapter) {
            const adjacent = [selectedChapter - 1, selectedChapter + 1].filter(number => number >= 1 && number <= (CHAPTER_COUNTS[selectedBook] || 1));
            if (adjacent.length) prefetchChapters(selectedBook, adjacent).catch(console.error);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[ComprehensiveBibleReader] Failed to load chapter:', error);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setBibleDownloading(false);
          setIsLoading(false);
        }
      }
    };
    void loadChapter();
    return () => { cancelled = true; };
  }, [isOpen, selectedBook, selectedChapter, readerLanguage, retryCount]);

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
    if (!onSaveHighlight || pendingAction) return;
    setPendingAction('highlight');

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

      toast.success(tr("Verse highlighted!"));
      setSelectedVerse(null);
      setNote('');
      setShowNoteInput(false);
    } catch (error) {
      console.error('Failed to save highlight:', error);
      toast.error(tr("Failed to save highlight"));
    } finally {
      setPendingAction(null);
    }
  };

  const handleShareWithPartner = async (verseNumber: number, verseText: string) => {
    if (!onShareWithPartner || pendingAction) return;
    setPendingAction('share');

    try {
      await onShareWithPartner({
        reference: `${selectedBook} ${selectedChapter}:${verseNumber}`,
        verseNumber,
        text: verseText,
        note: note || undefined
      });

      toast.success(tr('Shared with {name}!', { name: partnerDisplayName }));
      setSelectedVerse(null);
      setNote('');
      setShowNoteInput(false);
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error(tr("Failed to share with partner"));
    } finally {
      setPendingAction(null);
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
        displayBook(book).toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) || book.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="flex h-[95dvh] max-w-4xl max-h-[95dvh] flex-col gap-0 p-0 overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle className="tbo-dialog-title">{tr('Bible Reader — {book}, chapter {chapter}', { book: displayBook(selectedBook), chapter: selectedChapter })}</DialogTitle>
        </VisuallyHidden>
        <DialogDescription className="tbo-supporting sr-only">

          {tr("Read and study the Bible, highlight verses, and share with your partner")}
        </DialogDescription>

        {/* Header */}
        <div className="shrink-0" style={{ background: 'linear-gradient(to right, var(--primary), var(--secondary))', color: 'var(--primary-foreground)', padding: 'var(--spacing-4) var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <BookOpen style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
              <h2 className="tbo-section-title" style={{   margin: 0 }}>
                {tr('Bible Reader')}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              {/* Language toggle */}
              <div role="group" aria-label={tr('Reading language')} style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                <button className="tbo-action"
                  onClick={() => setReaderLanguage('am')}
                  lang="am" aria-pressed={readerLanguage === 'am'}
                  style={{
                    background: readerLanguage === 'am' ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: readerLanguage === 'am' ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                    borderRadius: 'var(--radius-full)',

                    padding: 'var(--spacing-1) var(--spacing-2)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  አማርኛ
                </button>
                <button className="tbo-action"
                  onClick={() => setReaderLanguage('en')}
                  lang="en" aria-pressed={readerLanguage === 'en'}
                  style={{
                    background: readerLanguage === 'en' ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: readerLanguage === 'en' ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                    borderRadius: 'var(--radius-full)',

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
                aria-label={tr('Close')}
                className="tbo-action text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Book and Chapter Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowBookSelector(!showBookSelector)}
              className="tbo-action h-auto min-h-9 whitespace-normal text-white hover:bg-white/20 border border-white/30"
            >
              <Menu className="w-4 h-4 mr-2" />
              <span lang={readerLanguage}>{displayBook(selectedBook)}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="tbo-action h-auto min-h-9 whitespace-normal text-white hover:bg-white/20 border border-white/30"
            >
              {tr('Chapter {chapter}', { chapter: selectedChapter })}
            </Button>

            {/* Navigation */}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousChapter}
                aria-label={tr('Previous chapter')}
                className="tbo-action text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextChapter}
                aria-label={tr('Next chapter')}
                className="tbo-action text-white hover:bg-white/20"
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
                  placeholder={tr("Search books...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tbo-field pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4 space-y-4">
                {filteredBooks?.length === 0 && <p className="tbo-supporting">{tr('No books found')}</p>}
                {(filteredBooks ? filteredBooks.map(book => (
                  <button className="tbo-action"
                    key={book}
                    onClick={() => handleSelectBook(book)}
                    style={{ width: '100%', textAlign: 'left', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer',  color: 'var(--foreground)', fontFamily: 'inherit' }}
                  >
                    <span lang={readerLanguage}>{displayBook(book)}</span>
                  </button>
                )) : Object.entries(BIBLE_BOOKS).map(([testament, books]) => (
                  <div key={testament}>
                    <h3 className="tbo-card-title" style={{  color: 'var(--primary)', marginBottom: 'var(--spacing-2)',  }}>
                      {tr(testament)}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {books.map((book: string) => (
                        <button className="tbo-action"
                          key={book}
                          onClick={() => handleSelectBook(book)}
                          style={{
                            textAlign: 'left',
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',

                            fontFamily: 'inherit',
                            background: book === selectedBook ? 'var(--primary-50, #f5f3ff)' : 'transparent',
                            color: book === selectedBook ? 'var(--primary)' : 'var(--foreground)',

                            transition: 'background 0.1s',
                          }}
                        >
                          <span lang={readerLanguage}>{displayBook(book)}</span>
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
              <h3 className="tbo-card-title" style={{  color: 'var(--primary)',  }}>
                {tr('Select Chapter — {book}', { book: displayBook(selectedBook) })}
              </h3>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4">
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from({ length: CHAPTER_COUNTS[selectedBook] || 1 }, (_, i) => i + 1).map(chapter => (
                    <button
                      key={chapter}
                      onClick={() => handleSelectChapter(chapter)}
                      className={`tbo-action px-4 py-2 rounded-lg transition-colors ${
                        chapter === selectedChapter
                          ? "bg-primary-600 text-white "
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

        {language === 'om' && (
          <p className="tbo-supporting shrink-0 border-b bg-primary-50 px-6 py-3">
            {tr(readerLanguage === 'am'
              ? 'Afaan Oromo Scripture is not available in this app yet. You have selected the Amharic reading.'
              : 'Afaan Oromo Scripture is not available in this app yet. The reading is shown in English; you can also choose Amharic.')}
          </p>
        )}

        {/* Bible download progress banner */}
        {bibleDownloading && (
          <div style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', padding: 'var(--spacing-2) var(--spacing-6)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--text-sm)' }}>
            <LoadingMark size={20} />
            <span>{tr('Downloading the Amharic Bible for the first time…')}</span>
          </div>
        )}

        {/* Chapter Content */}
        <ScrollArea className="min-h-[16rem] flex-1 shrink-0 px-6 py-4">
          {bookChapter && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 text-center">
                <h1 className="tbo-page-title" style={{   color: 'var(--foreground)', marginBottom: 'var(--spacing-1)' }}>
                  <span lang={readerLanguage}>{displayBook(selectedBook)} {selectedChapter}</span>
                </h1>
                <p className="tbo-body" style={{  color: 'var(--muted-foreground)' }}>
                  {tr('Read, highlight, and share with {name}', { name: partnerDisplayName })}
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
                          <span className="tbo-label flex-shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                            {v.number}
                          </span>
                          <p lang={readerLanguage} className="min-w-0 flex-1 text-foreground leading-relaxed">
                            {v.text}
                          </p>
                        </div>

                        {/* Verse Actions */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            {/* Highlight Colors */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="tbo-supporting text-muted-foreground">{tr("Highlight:")}</span>
                              {HIGHLIGHT_COLORS.map(color => (
                                <button
                                  key={color.value}
                                  className={`tbo-action w-8 h-8 rounded-full ${color.class} border-2 ${
                                    highlightColor === color.value
                                      ? 'border-primary-600 scale-110'
                                      : 'border-border'
                                  } transition-all hover:scale-110`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHighlightColor(color.value);
                                  }}
                                  title={tr(color.name)} aria-label={tr(color.name)} aria-pressed={highlightColor === color.value}
                                />
                              ))}
                            </div>

                            {/* Note Input */}
                            {showNoteInput ? (
                              <textarea className="tbo-field"
                                style={{ width: '100%', padding: 'var(--spacing-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',  resize: 'none', outline: 'none', fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--card)' }}
                                placeholder={tr('Add a note (optional)...')}
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
                                className="tbo-action text-muted-foreground"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                {tr('Add Note')}
                              </Button>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHighlightVerse(v.number, v.text);
                                }}
                                disabled={!!pendingAction || !onSaveHighlight}
                                className="tbo-action h-auto min-h-9 flex-1 whitespace-normal bg-primary-600 hover:bg-primary-700"
                              >
                                {pendingAction === 'highlight' ? <LoadingMark /> : <Highlighter className="w-4 h-4 mr-2 shrink-0" />}
                                {tr('Save Highlight')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareWithPartner(v.number, v.text);
                                }}
                                disabled={!!pendingAction || !onShareWithPartner}
                                className="tbo-action h-auto min-h-9 flex-1 whitespace-normal border-primary-300 text-primary-700 hover:bg-primary-50"
                              >
                                {pendingAction === 'share' ? <LoadingMark /> : <Share2 className="w-4 h-4 mr-2 shrink-0" />}
                                {tr('Share')}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show existing note */}
                        {isHighlighted && highlights.get(v.number)?.note && (
                          <div className="mt-3 p-3 bg-card bg-opacity-70 rounded-lg border border-border">
                            <p className="tbo-supporting text-foreground italic">
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
          {loadFailed && (
            <div role="alert" className="space-y-3 py-6 text-center">
              <p className="tbo-body">{tr('Unable to load this chapter. Please check your internet connection and try again.')}</p>
              <Button onClick={() => setRetryCount(count => count + 1)}>{tr('Retry')}</Button>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <BrandLoader label={tr('Loading chapter…')} />
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div style={{ padding: 'var(--spacing-3) var(--spacing-6)', borderTop: '1px solid var(--border)', background: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Highlighter style={{ width: '1rem', height: '1rem' }} />
              <span>{tr('{count} highlighted', { count: highlights.size })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <BookOpen style={{ width: '1rem', height: '1rem' }} />
              <span>{tr('{count} verses', { count: bookChapter?.verses.length || 0 })}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
