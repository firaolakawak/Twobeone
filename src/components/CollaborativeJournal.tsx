import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { 
  BookHeart, 
  Plus, 
  User, 
  Users, 
  Loader2, 
  Image as ImageIcon,
  Video,
  Mic,
  Camera,
  X,
  Play,
  Pause,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { JournalEntry } from '../types';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

interface CollaborativeJournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: { 
    title: string; 
    content: string; 
    isShared: boolean;
    mediaFiles?: Array<{ type: string; url: string; name: string }>;
    createdAt?: string;
  }) => Promise<void>;
  userName?: string;
  partnerName?: string;
  accessToken: string;
}

type ViewMode = 'timeline' | 'grid';
type FilterMode = 'all' | 'shared' | 'private' | 'mine' | 'partner';

interface MediaFile {
  type: 'image' | 'video' | 'audio';
  file: File;
  preview: string;
  name: string;
}

export function CollaborativeJournal({ 
  entries, 
  onAddEntry, 
  userName, 
  partnerName,
  accessToken 
}: CollaborativeJournalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Validate file type
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
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(mediaFile.file);
        });

        // Upload to server
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/upload-media`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              media: base64,
              type: mediaFile.type,
              name: mediaFile.name
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload media');
        }

        const data = await response.json();
        uploadedFiles.push({
          type: mediaFile.type,
          url: data.mediaUrl,
          name: mediaFile.name
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${mediaFile.name}`);
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Upload media files first
      const uploadedMedia = await uploadMediaFiles();

      await onAddEntry({ 
        title, 
        content, 
        isShared,
        mediaFiles: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        createdAt: selectedDate.toISOString()
      });
      
      // Clean up
      mediaFiles.forEach(m => URL.revokeObjectURL(m.preview));
      setTitle('');
      setContent('');
      setIsShared(true);
      setMediaFiles([]);
      setSelectedDate(new Date()); // Reset to current date
      setIsOpen(false);
      toast.success('Journal entry saved!');
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown Date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown Date';
    }
  };

  const formatTimelineDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown Date';
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown Date';
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatSelectedDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(selectedDate);
    const [year, month, day] = e.target.value.split('-').map(Number);
    newDate.setFullYear(year);
    newDate.setMonth(month - 1);
    newDate.setDate(day);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(selectedDate);
    const [hours, minutes] = e.target.value.split(':').map(Number);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!entry.title.toLowerCase().includes(query) && 
          !entry.content.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Privacy filter
    switch (filterMode) {
      case 'shared':
        return entry.isShared;
      case 'private':
        return !entry.isShared && !entry.isPartner;
      case 'mine':
        return !entry.isPartner;
      case 'partner':
        return entry.isPartner;
      default:
        return true;
    }
  });

  // Group entries by date for timeline
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookHeart className="w-6 h-6 text-rose-500" />
          <h2 className="text-2xl">Collaborative Journal</h2>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
              <DialogDescription>
                Record your thoughts and memories
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date & Time Selector */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formatDateForInput(selectedDate)}
                    onChange={handleDateChange}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs text-muted-foreground">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formatTimeForInput(selectedDate)}
                    onChange={handleTimeChange}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's on your heart?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Entry</Label>
                <Textarea
                  id="content"
                  placeholder="Write your thoughts, feelings, and reflections..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  required
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

                {/* Media Preview */}
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
                <div className="space-y-0.5 flex items-center gap-3">
                  {isShared ? (
                    <Users className="w-5 h-5 text-purple-600" />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <Label htmlFor="shared" className="cursor-pointer">
                      {isShared ? 'Shared with Partner' : 'Private Entry'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isShared 
                        ? 'Your partner can see this entry' 
                        : 'Only you can see this entry'}
                    </p>
                  </div>
                </div>
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
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
                <TabsTrigger value="shared" className="text-xs px-2">
                  <Users className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="private" className="text-xs px-2">
                  <EyeOff className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="mine" className="text-xs px-2">Me</TabsTrigger>
                <TabsTrigger value="partner" className="text-xs px-2">
                  {partnerName?.[0] || 'P'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="timeline">
              <Calendar className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="grid">
              <Filter className="w-4 h-4 mr-2" />
              Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Entries Display */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookHeart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg mb-2">No entries found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try a different search term'
                : 'Start documenting your journey together'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        // Timeline View
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([date, dateEntries]) => (
            <div key={date} className="relative">
              {/* Date Header */}
              <div className="sticky top-16 z-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg px-4 py-2 mb-4 border border-purple-200">
                <h3 className="font-semibold text-purple-900">{formatTimelineDate(dateEntries[0].createdAt)}</h3>
              </div>

              {/* Timeline Line */}
              <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-rose-300 to-purple-300" />

              {/* Entries */}
              <div className="space-y-6">
                {dateEntries.map((entry, index) => (
                  <div key={entry.id} className="relative pl-16">
                    {/* Timeline Dot */}
                    <div className={`absolute left-6 top-6 w-4 h-4 rounded-full border-2 border-white ${
                      entry.isPartner 
                        ? 'bg-blue-500' 
                        : entry.isShared 
                        ? 'bg-rose-500' 
                        : 'bg-gray-400'
                    }`} />

                    <Card className={`${
                      entry.isPartner 
                        ? 'border-blue-200 bg-blue-50/30' 
                        : entry.isShared 
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-gray-200'
                    }`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              {entry.isPartner ? (
                                <User className="w-4 h-4 text-blue-600" />
                              ) : entry.isShared ? (
                                <Users className="w-4 h-4 text-rose-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-600" />
                              )}
                              {entry.title}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <span>{entry.isPartner ? partnerName || 'Partner' : userName || 'You'}</span>
                              <span>•</span>
                              <span>{formatDate(entry.createdAt)}</span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>

                        {/* Media Attachments */}
                        {entry.mediaFiles && entry.mediaFiles.length > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            {entry.mediaFiles.map((media: any, idx: number) => (
                              <MediaPreview key={idx} media={media} />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid View
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredEntries.map((entry) => (
            <Card 
              key={entry.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                entry.isPartner 
                  ? 'border-blue-200 bg-blue-50/30' 
                  : entry.isShared 
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedEntry(entry)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {entry.isPartner ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : entry.isShared ? (
                    <Users className="w-4 h-4 text-rose-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-600" />
                  )}
                  {entry.title}
                </CardTitle>
                <CardDescription>
                  {entry.isPartner ? partnerName || 'Partner' : userName || 'You'} • {formatDate(entry.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {entry.content}
                </p>
                {entry.mediaFiles && entry.mediaFiles.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {entry.mediaFiles.slice(0, 3).map((media: any, idx: number) => (
                      <div key={idx} className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center">
                        {media.type === 'image' && <ImageIcon className="w-5 h-5 text-purple-600" />}
                        {media.type === 'video' && <Video className="w-5 h-5 text-purple-600" />}
                        {media.type === 'audio' && <Mic className="w-5 h-5 text-purple-600" />}
                      </div>
                    ))}
                    {entry.mediaFiles.length > 3 && (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs">
                        +{entry.mediaFiles.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Entry Detail Dialog */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby="entry-detail-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEntry.isPartner ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : selectedEntry.isShared ? (
                  <Users className="w-5 h-5 text-rose-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-600" />
                )}
                {selectedEntry.title}
              </DialogTitle>
              <DialogDescription id="entry-detail-description">
                By {selectedEntry.isPartner ? partnerName || 'Partner' : userName || 'You'} on {formatDate(selectedEntry.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedEntry.content}
              </p>
              {selectedEntry.mediaFiles && selectedEntry.mediaFiles.length > 0 && (
                <div className="space-y-3">
                  <Label>Attachments</Label>
                  {selectedEntry.mediaFiles.map((media: any, idx: number) => (
                    <MediaPreview key={idx} media={media} fullSize />
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Media Preview Component
function MediaPreview({ media, fullSize = false }: { media: { type: string; url: string; name: string }; fullSize?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (media.type === 'image') {
    return (
      <div className={`relative ${fullSize ? '' : 'aspect-square'} overflow-hidden rounded-lg border`}>
        <img 
          src={media.url} 
          alt={media.name} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (media.type === 'video') {
    return (
      <div className={`relative ${fullSize ? '' : 'aspect-video'} overflow-hidden rounded-lg border`}>
        <video 
          src={media.url} 
          controls 
          className="w-full h-full"
        >
          Your browser doesn't support video playback.
        </video>
      </div>
    );
  }

  if (media.type === 'audio') {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAudio}
            className="flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{media.name}</p>
            <p className="text-xs text-muted-foreground">Voice Note</p>
          </div>
          <a href={media.url} download={media.name}>
            <Button type="button" variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
        <audio ref={audioRef} src={media.url} onEnded={() => setIsPlaying(false)} className="hidden" />
      </div>
    );
  }

  return null;
}