import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { BookHeart, Plus, User, Users, Loader2 } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalSectionProps {
  entries: JournalEntry[];
  onAddEntry: (entry: { title: string; content: string; isShared: boolean }) => Promise<void>;
  userName?: string;
  partnerName?: string;
}

export function JournalSection({ entries, onAddEntry, userName, partnerName }: JournalSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onAddEntry({ title, content, isShared });
      setTitle('');
      setContent('');
      setIsShared(true);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to add journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookHeart className="w-6 h-6 text-rose-500" />
          <h2 className="text-2xl">Our Journal</h2>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
              <DialogDescription>
                Share your thoughts, prayers, and reflections with your partner
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Write your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="shared">Share with partner</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow your partner to see this entry
                  </p>
                </div>
                <Switch
                  id="shared"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookHeart className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No journal entries yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start sharing your thoughts and reflections with your partner
              </p>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className={entry.isPartner ? 'border-blue-200 bg-blue-50/30' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {entry.isPartner ? (
                        <>
                          <User className="w-4 h-4 text-blue-600" />
                          {entry.title}
                        </>
                      ) : (
                        <>
                          {entry.isShared ? (
                            <Users className="w-4 h-4 text-rose-600" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          {entry.title}
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {entry.isPartner ? partnerName || 'Partner' : userName || 'You'} • {formatDate(entry.createdAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
