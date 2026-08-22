import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Heart, Star, Gift, PartyPopper, Calendar, Plus } from 'lucide-react';
import { milestones as milestonesApi } from '../utils/api';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface AddMilestoneDialogProps {
  onAddMilestone: (milestone: {
    id: string;
    title: string;
    date: string;
    description: string;
    icon: string;
  }) => void;
}

export function AddMilestoneDialog({ onAddMilestone }: AddMilestoneDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('heart');
  const [isSaving, setIsSaving] = useState(false);

  const icons = [
    { value: 'heart', icon: Heart, label: 'Heart', color: 'text-primary-600' },
    { value: 'star', icon: Star, label: 'Star', color: 'text-warning-500' },
    { value: 'gift', icon: Gift, label: 'Gift', color: 'text-primary-600' },
    { value: 'party', icon: PartyPopper, label: 'Party', color: 'text-primary-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) {
      return;
    }

    setIsSaving(true);
    try {
      // Save to backend
      const { milestone } = await milestonesApi.create({
        title: title.trim(),
        description: description.trim(),
        date,
        category: 'relationship', // Default category
      });

      // Call parent callback with the created milestone
      onAddMilestone({
        id: milestone.id,
        title: milestone.title,
        date: milestone.date,
        description: milestone.description,
        icon: selectedIcon,
      });

      // Reset form
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setSelectedIcon('heart');
      setOpen(false);
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast.error('Failed to save milestone');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          title="Add Milestone"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.milestones.addMilestone}</DialogTitle>
          <DialogDescription>
            {t.dashboard.celebrateJourney}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">{t.milestones.milestoneTitle}</Label>
              <Input
                id="title"
                placeholder={t.milestones.milestoneTitle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">{t.milestones.milestoneDate}</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">{t.milestones.milestoneDescription}</Label>
              <Textarea
                id="description"
                placeholder={t.devotionals.writeReflection}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Icon Selection */}
            <div className="grid gap-2">
              <Label>{t.milestones.selectIcon}</Label>
              <div className="flex gap-2">
                {icons.map(({ value, icon: Icon, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedIcon(value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedIcon === value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-border'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${selectedIcon === value ? color : 'text-muted-foreground'}`} />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!title.trim() || !date || isSaving}>
              {isSaving ? t.common.saving : t.milestones.addMilestone}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}