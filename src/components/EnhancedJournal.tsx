import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Image as ImageIcon,
  Video,
  Mic,
  Calendar,
  X,
  Edit2,
  MessageCircle,
  Send,
  Smile,
  Camera,
  Play,
  Pause,
  Download,
  Trash2,
  MapPin,
  Sparkles,
  BookOpen,
  Home
} from 'lucide-react';
import { JournalEntry } from '../types';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

interface EnhancedJournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: any) => Promise<void>;
  onUpdateEntry?: (id: string, entry: any) => Promise<void>;
  onDeleteEntry?: (id: string) => Promise<void>;
  userName?: string;
  partnerName?: string;
  userAvatar?: string;
  partnerAvatar?: string;
  accessToken: string;
  onBackToHome?: () => void;
}

interface MediaFile {
  type: 'image' | 'video' | 'audio';
  file: File;
  preview: string;
  name: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export function EnhancedJournal({ 
  entries, 
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  userName = 'You',
  partnerName = 'Partner',
  userAvatar,
  partnerAvatar,
  accessToken,
  onBackToHome
}: EnhancedJournalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entryType, setEntryType] = useState<'journal' | 'event'>('journal');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [commentingEntry, setCommentingEntry] = useState<JournalEntry | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Debug: Log entries
  useEffect(() => {
    console.log('=== JOURNAL DEBUG ===');
    console.log('Total entries received:', entries.length);
    console.log('Entries data:', entries);
    entries.forEach((entry, index) => {
      console.log(`Entry ${index}:`, {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        entryType: (entry as any).entryType,
        emoji: (entry as any).emoji,
        createdAt: entry.createdAt,
        hasTitle: !!entry.title,
        hasContent: !!entry.content,
        hasEmoji: !!(entry as any).emoji,
        hasValidDate: entry.createdAt && !isNaN(new Date(entry.createdAt).getTime())
      });
    });
    console.log('===================');
  }, [entries]);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [emoji, setEmoji] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isShared, setIsShared] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Common emojis for events
  const commonEmojis = ['❤️', '😊', '🎉', '✨', '🙏', '💑', '💍', '🎂', '🌟', '🎊', '💕', '🌹'];

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const validTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid ${type} format`);
      return;
    }

    const preview = URL.createObjectURL(file);
    setMediaFiles(prev => [...prev, { type, file, preview, name: file.name }]);
    toast.success(`${type === 'image' ? 'Photo' : 'Video'} added!`);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        const preview = URL.createObjectURL(audioBlob);
        
        setMediaFiles(prev => [...prev, { 
          type: 'audio', 
          file: audioFile, 
          preview, 
          name: audioFile.name 
        }]);
        
        toast.success('Voice note recorded!');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started...');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadMediaFiles = async (): Promise<Array<{ type: string; url: string; name: string }>> => {
    if (mediaFiles.length === 0) return [];

    const uploadedFiles = [];

    for (const mediaFile of mediaFiles) {
      try {
        // Convert to base64 data URL
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(mediaFile.file);
        });

        // For now, store base64 directly since upload endpoint doesn't exist
        // In production, this should upload to Supabase Storage
        uploadedFiles.push({
          type: mediaFile.type,
          url: base64, // Store base64 data URL directly
          name: mediaFile.name
        });

        console.log(`Media file processed: ${mediaFile.name} (${mediaFile.type})`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to process ${mediaFile.name}`);
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const uploadedMedia = await uploadMediaFiles();

      const entryData = { 
        title, 
        content,
        location: location || undefined,
        emoji: emoji || undefined,
        entryType,
        isShared,
        // Only update mediaFiles if new ones were uploaded, otherwise preserve existing
        ...(uploadedMedia.length > 0 ? { mediaFiles: uploadedMedia } : {}),
        // Only include createdAt when creating new entries, not when editing
        ...(editingEntry ? {} : { createdAt: selectedDate.toISOString() })
      };

      if (editingEntry) {
        await onUpdateEntry?.(editingEntry.id, entryData);
        toast.success('Entry updated!');
      } else {
        await onAddEntry(entryData);
        toast.success('Entry saved!');
      }
      
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentingEntry) return;

    try {
      const comment: Comment = {
        id: `comment:${Date.now()}`,
        userId: 'current-user', // This should come from auth
        userName: userName,
        userAvatar: userAvatar,
        content: commentText,
        createdAt: new Date().toISOString()
      };

      const updatedComments = [...(commentingEntry.comments || []), comment];
      
      await onUpdateEntry?.(commentingEntry.id, {
        comments: updatedComments
      });

      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    // Check if this is a partner's entry
    const isPartner = (entry as any).isPartner;
    if (isPartner) {
      toast.error("You can't edit your partner's entries");
      return;
    }

    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content || '');
    setLocation((entry as any).location || '');
    setEmoji((entry as any).emoji || '');
    setEntryType((entry as any).entryType || 'journal');
    setIsShared(entry.isShared);
    setSelectedDate(new Date(entry.createdAt));
    setIsOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setLocation('');
    setEmoji('');
    setIsShared(true);
    setMediaFiles([]);
    setSelectedDate(new Date());
    setEditingEntry(null);
    setEntryType('journal');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Group entries by date
  const groupedEntries = entries
    // Filter out invalid entries
    .filter(entry => {
      const hasContent = entry.title || entry.content || (entry as any).emoji;
      const hasValidDate = entry.createdAt && !isNaN(new Date(entry.createdAt).getTime());
      return hasContent && hasValidDate;
    })
    // Sort by date (newest first)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .reduce((acc, entry) => {
      const date = new Date(entry.createdAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, JournalEntry[]>);

  // Sort the date keys in descending order (newest first)
  const sortedDateKeys = Object.keys(groupedEntries).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const validEntries = entries.filter(entry => {
    const hasContent = entry.title || entry.content || (entry as any).emoji;
    const hasValidDate = entry.createdAt && !isNaN(new Date(entry.createdAt).getTime());
    return hasContent && hasValidDate;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBackToHome} className="w-10 h-10">
            <Home className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-semibold dark:text-white">Our Journal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Shared memories & moments</p>
          </div>
          <Button variant="ghost" size="icon" className="w-10 h-10">
            <Calendar className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">{/* pb-32 for FAB spacing */}
        {sortedDateKeys.map(dateKey => {
          const date = new Date(dateKey);
          const month = date.toLocaleDateString('en-US', { month: 'long' });
          const day = date.getDate();
          const year = date.getFullYear();
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

          return (
            <div key={dateKey} className="relative">
              {/* Date Header with Timeline */}
              <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm py-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center text-white shadow-lg">
                      <span className="text-xs font-medium opacity-90">{month.slice(0, 3)}</span>
                      <span className="text-2xl font-bold leading-none">{day}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{dayOfWeek}</h3>
                    <p className="text-sm text-gray-500">{month} {day}, {year}</p>
                  </div>
                </div>
              </div>

              {/* Entries for this date */}
              <div className="space-y-6 relative pl-8">
                {/* Vertical Timeline Line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-purple-300"></div>

                {groupedEntries[dateKey].map((entry, index) => {
                  const isEvent = (entry as any).entryType === 'event';
                  const emoji = (entry as any).emoji;
                  const location = (entry as any).location;
                  const isPartner = (entry as any).isPartner;
                  const entryDate = new Date(entry.createdAt);
                  const timeStr = entryDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  const hasMedia = entry.mediaFiles && entry.mediaFiles.length > 0;
                  const imageMedia = entry.mediaFiles?.find(m => m.type === 'image');

                  // Debug logging for media files
                  console.log(`Entry "${entry.title}" media:`, {
                    hasMedia,
                    mediaFilesArray: entry.mediaFiles,
                    imageMedia,
                    mediaCount: entry.mediaFiles?.length || 0
                  });

                  return (
                    <div key={entry.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[33px] top-6 w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-gray-50 shadow-sm group-hover:scale-125 transition-transform"></div>

                      {/* Entry Card */}
                      <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border-0 bg-white">
                        {/* Image Header (if exists) */}
                        {imageMedia && imageMedia.url && (
                          <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                            <img 
                              src={imageMedia.url} 
                              alt={entry.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                console.error(`Image failed to load for entry "${entry.title}":`, {
                                  src: imageMedia.url?.substring(0, 100),
                                  fullUrl: imageMedia.url,
                                  error: e
                                });
                                // Hide the broken image
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log(`✅ Image loaded successfully for "${entry.title}"`);
                              }}
                            />
                            {emoji && (
                              <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
                                {emoji}
                              </div>
                            )}
                          </div>
                        )}

                        <CardContent className="p-6">
                          {/* Header Row */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              {/* Entry Type Badge */}
                              <div className="flex items-center gap-2 mb-3">
                                {isEvent && !imageMedia && (
                                  <span className="text-3xl">{emoji || '📝'}</span>
                                )}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isEvent 
                                    ? 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800'
                                    : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800'
                                }`}>
                                  {isEvent ? '✨ Special Event' : '📖 Journal Entry'}
                                </span>
                                {isPartner && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-100 to-red-100 text-pink-800">
                                    💕 {partnerName}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                                {entry.title}
                              </h3>

                              {/* Location & Time */}
                              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {timeStr}
                                </span>
                                {location && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {location}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          {entry.content && (
                            <div className="prose prose-sm max-w-none mb-4">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {entry.content}
                              </p>
                            </div>
                          )}

                          {/* Media Grid (non-image) */}
                          {hasMedia && entry.mediaFiles!.filter(m => m.type !== 'image').length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {entry.mediaFiles!.filter(m => m.type !== 'image').map((media, idx) => (
                                <div key={idx} className="relative rounded-lg overflow-hidden bg-gray-100 p-3 flex items-center gap-2">
                                  {media.type === 'video' && <Video className="w-5 h-5 text-gray-600" />}
                                  {media.type === 'audio' && <Mic className="w-5 h-5 text-gray-600" />}
                                  <span className="text-xs text-gray-600 truncate flex-1">{media.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Comments Section */}
                          {entry.comments && entry.comments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <MessageCircle className="w-4 h-4" />
                                <span>{entry.comments.length} {entry.comments.length === 1 ? 'Comment' : 'Comments'}</span>
                              </div>
                              
                              {entry.comments.slice(0, 2).map((comment: any) => (
                                <div key={comment.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={comment.userAvatar || ""} alt={comment.userName} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                                      {comment.userName?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900">{comment.userName}</p>
                                    <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                                  </div>
                                </div>
                              ))}

                              {entry.comments.length > 2 && (
                                <button 
                                  onClick={() => setCommentingEntry(entry)}
                                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                >
                                  View all {entry.comments.length} comments →
                                </button>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCommentingEntry(entry)}
                              className="flex-1 h-9 text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            {!isPartner && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(entry)}
                                  className="flex-1 h-9 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm('Delete this entry?')) {
                                      try {
                                        await onDeleteEntry?.(entry.id);
                                      } catch (error) {
                                        console.error('Failed to delete entry:', error);
                                      }
                                    }
                                  }}
                                  className="flex-1 h-9 text-gray-700 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {validEntries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Entries Yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Start documenting your spiritual journey together. Create your first memory!
            </p>
            <Button 
              onClick={() => setIsOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Entry
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Entry Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Entry' : 'New Entry'}</DialogTitle>
            <DialogDescription>
              {entryType === 'journal' ? 'Record your thoughts and memories' : 'Mark a special moment'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={entryType} onValueChange={(v) => setEntryType(v as 'journal' | 'event')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="event">Event</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setSelectedDate(newDate);
                      }
                    }}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs text-muted-foreground">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={`${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const newDate = new Date(selectedDate);
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setSelectedDate(newDate);
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Event Emoji (Event only) */}
              {entryType === 'event' && (
                <div className="space-y-2">
                  <Label>Select Emoji</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {commonEmojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-3xl p-3 rounded-lg border-2 transition-all ${
                          emoji === e 
                            ? 'border-purple-500 bg-purple-50 scale-110' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder={entryType === 'event' ? 'Event name' : "What's on your heart?"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Location (Event only) */}
              {entryType === 'event' && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Where did this happen?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Details {entryType === 'event' && '(Optional)'}</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required={entryType === 'journal'}
                />
              </div>

              {/* Media Attachments */}
              <div className="space-y-3">
                <Label>Attach Media</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={isRecording ? 'bg-red-50 border-red-300' : ''}
                  >
                    <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'text-red-600' : ''}`} />
                    {isRecording ? 'Stop' : 'Voice'}
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'image')}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'video')}
                />

                {mediaFiles.length > 0 && (
                  <div className="space-y-2">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative border rounded-lg p-2 flex items-center gap-3">
                        {media.type === 'image' && (
                          <img src={media.preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                        )}
                        {media.type === 'video' && (
                          <video src={media.preview} className="w-16 h-16 object-cover rounded" />
                        )}
                        {media.type === 'audio' && (
                          <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center">
                            <Mic className="w-6 h-6 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{media.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{media.type}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedia(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <Label htmlFor="shared" className="cursor-pointer">
                  {isShared ? 'Shared with Partner' : 'Private Entry'}
                </Label>
                <Switch
                  id="shared"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingEntry ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={!!commentingEntry} onOpenChange={(open) => !open && setCommentingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>{commentingEntry?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommentingEntry(null)}>
                Cancel
              </Button>
              <Button onClick={handleAddComment}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center z-[100] hover:scale-110 active:scale-95"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}