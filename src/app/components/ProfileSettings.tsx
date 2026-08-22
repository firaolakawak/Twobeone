import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogOut, Shield, Trash2, HelpCircle, Camera, User, Heart, Bell, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileSettingsProps {
  profile?: {
    name?: string;
    email?: string;
    partnerEmail?: string;
    profilePicture?: string;
  };
  onSignOut: () => void;
  onUpdateProfile: (data: any) => void;
  onAdminAccess?: () => void;
}

export function ProfileSettings({ profile, onSignOut, onUpdateProfile, onAdminAccess }: ProfileSettingsProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(profile?.name || '');
  const [notifications, setNotifications] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const userInitials = profile?.name?.split(' ').map(n => n[0]).join('') || '?';

  const handleClearJournals = async () => {
    try {
      setIsClearing(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error(t.auth.signIn); return; }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/clear-journals`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (!response.ok) throw new Error();
      const result = await response.json();
      toast.success(`${t.messages.deletedSuccessfully}: ${result.deletedCount} ${t.journal.myEntries}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedJournals = async () => {
    try {
      setIsSeeding(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error(t.auth.signIn); return; }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/seed-journals`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      if (!response.ok) throw new Error();
      const result = await response.json();
      toast.success(`${t.messages.savedSuccessfully}: ${result.createdCount} ${t.journal.myEntries}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile?.profilePicture || ''} alt={profile?.name} />
            <AvatarFallback className="text-2xl" style={{ background: 'color-mix(in srgb, var(--primary) 15%, var(--background))', color: 'var(--primary)' }}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 shadow-md" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{profile?.name || t.profile.myProfile}</h1>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="personal"><User className="w-4 h-4 mr-1" /><span className="hidden sm:inline">{t.common.edit}</span></TabsTrigger>
          <TabsTrigger value="couple"><Heart className="w-4 h-4 mr-1" /><span className="hidden sm:inline">{t.profile.partnerCode}</span></TabsTrigger>
          <TabsTrigger value="privacy"><Shield className="w-4 h-4 mr-1" /></TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" /></TabsTrigger>
        </TabsList>

        {/* Personal */}
        <TabsContent value="personal" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">{t.profile.myProfile}</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t.auth.name}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.auth.enterName} />
              </div>
              <div>
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input id="email" type="email" value={profile?.email} disabled className="bg-muted" />
              </div>
              <Button onClick={() => onUpdateProfile({ name })} style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                {t.common.save}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">{t.profile.about}</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />Help &amp; Support
              </Button>
              <Button variant="outline" className="w-full justify-start" style={{ color: 'var(--error-500)' }} onClick={onSignOut}>
                <LogOut className="w-4 h-4 mr-2" />{t.auth.signOut}
              </Button>
              {onAdminAccess && (
                <Button variant="outline" className="w-full justify-start" onClick={onAdminAccess}>
                  <Shield className="w-4 h-4 mr-2" />Admin
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Couple */}
        <TabsContent value="couple" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">{t.profile.partnerCode}</h3>
            <div className="space-y-4">
              <div>
                <Label>{t.auth.email} ({t.profile.linkedWith})</Label>
                <Input value={profile?.partnerEmail || t.profile.notLinked} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="anniversary">{t.partner.relationshipStarted}</Label>
                <Input id="anniversary" type="date" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border" style={{ borderColor: 'color-mix(in srgb, var(--error-500) 30%, transparent)', background: 'color-mix(in srgb, var(--error-500) 4%, var(--background))' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--error-500)' }}>
              <Shield className="w-5 h-5" />Danger Zone
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full" style={{ borderColor: 'color-mix(in srgb, var(--success-500) 50%, transparent)', color: 'var(--success-700)' }} onClick={handleSeedJournals} disabled={isSeeding}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isSeeding ? t.common.loading : `Create 7 Sample ${t.journal.myEntries}`}
              </Button>
              <p className="text-xs" style={{ color: 'var(--success-700)' }}>
                ✨ {t.journal.noEntries} — {t.journal.startWriting}
              </p>
              <Separator className="my-4" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isClearing}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isClearing ? t.common.loading : `${t.common.delete} ${t.journal.myEntries}`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.messages.areYouSure}</AlertDialogTitle>
                    <AlertDialogDescription>{t.messages.cannotUndo}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearJournals} style={{ background: 'var(--error-500)' }}>
                      {t.common.yes}, {t.common.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground">⚠️ {t.messages.cannotUndo}</p>
              <Separator className="my-4" />
              <Button variant="outline" className="w-full" style={{ borderColor: 'color-mix(in srgb, var(--error-500) 50%, transparent)', color: 'var(--error-500)' }}>
                {t.profile.notLinked}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">{t.profile.preferences}</h3>
            <div className="space-y-4">
              {[
                { label: t.journal.shareWithPartner, desc: t.questions.shareYourAnswer },
                { label: t.prayer.prayerRequests, desc: t.questions.shareYourAnswer },
                { label: t.dashboard.recentActivity, desc: t.questions.shareYourAnswer },
              ].map((item, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-foreground">{t.notifications.title}</h3>
            <div className="space-y-4">
              {[
                { label: t.devotionals.title, desc: t.notifications.devotionalComplete, state: notifications, setState: setNotifications },
                { label: t.prayer.prayTogether, desc: t.notifications.newPrayer, state: prayerReminders, setState: setPrayerReminders },
                { label: t.dashboard.recentActivity, desc: t.notifications.journalEntry, state: false, setState: () => {} },
                { label: t.community.title, desc: t.notifications.milestone, state: false, setState: () => {} },
              ].map((item, i) => (
                <div key={i}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.state} onCheckedChange={item.setState} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
