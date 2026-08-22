import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  BookOpen, 
  Highlighter, 
  Share2, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  Bookmark,
  MessageCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { bibleChapters } from '../data/bible-chapters';

interface BibleReaderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
  verse: string;
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
  { name: 'Yellow', class: 'bg-yellow-200', value: 'yellow' },
  { name: 'Green', class: 'bg-green-200', value: 'green' },
  { name: 'Blue', class: 'bg-blue-200', value: 'blue' },
  { name: 'Pink', class: 'bg-pink-200', value: 'pink' },
  { name: 'Purple', class: 'bg-purple-200', value: 'purple' },
];

export function BibleReaderDialog({
  isOpen,
  onClose,
  reference,
  verse,
  onSaveHighlight,
  onShareWithPartner,
  partnerName = 'Partner'
}: BibleReaderDialogProps) {
  const [bookChapter, setBookChapter] = useState<any>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [note, setNote] = useState('');
  const [highlights, setHighlights] = useState<Map<number, { color: string; note?: string }>>(new Map());
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    console.log('[BibleReaderDialog] isOpen changed:', isOpen, 'reference:', reference);
    if (isOpen && reference) {
      loadChapter();
    }
  }, [isOpen, reference]);

  const loadChapter = () => {
    console.log('[BibleReaderDialog] Loading chapter for reference:', reference);
    // Parse reference (e.g., "John 3:16" or "Proverbs 3:5-6" -> book: "John/Proverbs", chapter: 3)
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    console.log('[BibleReaderDialog] Reference match:', match);
    
    if (match) {
      const [, bookRaw, chapter, startVerse, endVerse] = match;
      // Trim any whitespace from book name
      const book = bookRaw.trim();
      console.log('[BibleReaderDialog] Parsed:', { book, chapter, startVerse, endVerse });
      
      // Try exact match first
      let chapterData = bibleChapters.find(
        c => c.book === book && c.chapter === parseInt(chapter)
      );
      
      // If no exact match, try case-insensitive match
      if (!chapterData) {
        console.log('[BibleReaderDialog] Trying case-insensitive match');
        chapterData = bibleChapters.find(
          c => c.book.toLowerCase() === book.toLowerCase() && c.chapter === parseInt(chapter)
        );
      }
      
      console.log('[BibleReaderDialog] Found chapter data:', chapterData ? 'Yes' : 'No');
      
      if (chapterData) {
        setBookChapter(chapterData);
        // Set to the first verse of the range
        setSelectedVerse(parseInt(startVerse));
        console.log('[BibleReaderDialog] Set chapter data with', chapterData.verses.length, 'verses');
      } else {
        // Create fallback with just the provided verse(s)
        console.log('[BibleReaderDialog] Using fallback verse');
        
        // If it's a range, we might have multiple verses
        const verses = [];
        const start = parseInt(startVerse);
        const end = endVerse ? parseInt(endVerse) : start;
        
        // For fallback, we only have the text for the whole range
        // So we'll create a single verse entry
        verses.push({
          number: start,
          text: verse
        });
        
        setBookChapter({
          book,
          chapter: parseInt(chapter),
          verses
        });
        setSelectedVerse(start);
      }
    } else {
      console.error('[BibleReaderDialog] Failed to parse reference:', reference);
      // Fallback: try to at least show something
      setBookChapter({
        book: 'Scripture',
        chapter: 1,
        verses: [{
          number: 1,
          text: verse
        }]
      });
      setSelectedVerse(1);
    }
  };

  const handleHighlightVerse = async (verseNumber: number, verseText: string) => {
    if (!onSaveHighlight) return;

    try {
      // Update local highlights
      const newHighlights = new Map(highlights);
      newHighlights.set(verseNumber, { color: highlightColor, note });
      setHighlights(newHighlights);

      // Save to backend
      await onSaveHighlight({
        reference: `${bookChapter.book} ${bookChapter.chapter}:${verseNumber}`,
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
        reference: `${bookChapter.book} ${bookChapter.chapter}:${verseNumber}`,
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
      yellow: 'bg-yellow-200',
      green: 'bg-green-200',
      blue: 'bg-blue-200',
      pink: 'bg-pink-200',
      purple: 'bg-purple-200'
    };
    
    return colorMap[highlight.color] || '';
  };

  if (!bookChapter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-600" />
                {bookChapter.book} {bookChapter.chapter}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Read, highlight, and share with {partnerName}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-6 py-4">
          <div className="space-y-4">
            {bookChapter.verses.map((v: any) => {
              const isSelected = selectedVerse === v.number;
              const isHighlighted = highlights.has(v.number);
              const highlightClass = getHighlightClass(v.number);

              return (
                <div key={v.number} className="group">
                  <div
                    className={`p-4 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-2 border-purple-300'
                        : highlightClass
                        ? `${highlightClass} border border-gray-200`
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => setSelectedVerse(isSelected ? null : v.number)}
                  >
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {v.number}
                      </span>
                      <p className="flex-1 text-gray-800 leading-relaxed">
                        {v.text}
                      </p>
                    </div>

                    {/* Verse Actions - Show when selected or highlighted */}
                    {(isSelected || isHighlighted) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Highlight Color Picker */}
                        {isSelected && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-600">Highlight:</span>
                              {HIGHLIGHT_COLORS.map(color => (
                                <button
                                  key={color.value}
                                  className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                                    highlightColor === color.value
                                      ? 'border-purple-600 scale-110'
                                      : 'border-gray-300'
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
                              <div className="space-y-2">
                                <textarea
                                  className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  placeholder="Add a note (optional)..."
                                  rows={2}
                                  value={note}
                                  onChange={(e) => setNote(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowNoteInput(true);
                                }}
                                className="text-gray-600"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Add Note
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
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                              >
                                <Highlighter className="w-4 h-4 mr-2" />
                                Save Highlight
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareWithPartner(v.number, v.text);
                                }}
                                className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share with {partnerName}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show existing note */}
                        {isHighlighted && highlights.get(v.number)?.note && (
                          <div className="mt-2 p-3 bg-white bg-opacity-50 rounded border border-gray-200">
                            <p className="text-sm text-gray-700 italic">
                              📝 {highlights.get(v.number)?.note}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Highlighter className="w-4 h-4" />
              <span>{highlights.size} highlighted</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{bookChapter.verses.length} verses</span>
            </div>
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}