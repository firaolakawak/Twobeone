import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { HandHeart, Plus, User, Loader2, CheckCircle } from 'lucide-react';
import { PrayerRequest } from '../types';

interface PrayerSectionProps {
  prayers: PrayerRequest[];
  onAddPrayer: (prayer: { title: string; description: string }) => Promise<void>;
  onUpdatePrayer: (id: string, isAnswered: boolean) => Promise<void>;
  userName?: string;
  partnerName?: string;
}

export function PrayerSection({ prayers, onAddPrayer, onUpdatePrayer, userName, partnerName }: PrayerSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onAddPrayer({ title, description });
      setTitle('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to add prayer request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const activePrayers = prayers.filter(p => !p.isAnswered);
  const answeredPrayers = prayers.filter(p => p.isAnswered);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HandHeart className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl">Prayer Requests</h2>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Prayer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>New Prayer Request</DialogTitle>
              <DialogDescription>
                Share a prayer request with your partner
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prayer-title">Prayer Title</Label>
                <Input
                  id="prayer-title"
                  placeholder="What can we pray for?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prayer-description">Details</Label>
                <Textarea
                  id="prayer-description"
                  placeholder="Share more details about this prayer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Prayer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Prayers */}
      <div className="space-y-4">
        <h3 className="text-lg">Active Prayers</h3>
        {activePrayers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <HandHeart className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">No active prayers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a prayer request to start praying together
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activePrayers.map((prayer) => (
              <Card key={prayer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className={prayer.isPartner ? "w-4 h-4 text-blue-600" : "w-4 h-4 text-rose-600"} />
                        {prayer.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {prayer.isPartner ? partnerName || 'Partner' : userName || 'You'} • {formatDate(prayer.createdAt)}
                      </CardDescription>
                    </div>
                    {!prayer.isPartner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdatePrayer(prayer.id, true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Answered
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {prayer.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Answered Prayers */}
      {answeredPrayers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg">Answered Prayers</h3>
          <div className="grid gap-4">
            {answeredPrayers.map((prayer) => (
              <Card key={prayer.id} className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {prayer.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {prayer.isPartner ? partnerName || 'Partner' : userName || 'You'} • {formatDate(prayer.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Answered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {prayer.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
