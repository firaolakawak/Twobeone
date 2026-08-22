import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User as UserType } from '../types';
import { LogOut, Shield, Trash2, HelpCircle, Camera, User, Heart, Bell, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
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
  const [name, setName] = useState(profile?.name || '');
  const [notifications, setNotifications] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const userInitials = profile?.name?.split(' ').map(n => n[0]).join('') || '?';

  const handleClearJournals = async () => {
    try {
      setIsClearing(true);
      
      // Get access token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/clear-journals`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to clear journals');
      }

      const result = await response.json();
      toast.success(`Cleared ${result.deletedCount} journal entries!`);
      
      // Reload the page to refresh data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to clear journals:', error);
      toast.error('Failed to clear journals');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedJournals = async () => {
    try {
      setIsSeeding(true);
      
      // Get access token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/seed-journals`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to seed journals');
      }

      const result = await response.json();
      toast.success(`Created ${result.createdCount} sample journal entries!`);
      
      // Reload the page to refresh data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to seed journals:', error);
      toast.error('Failed to seed journals');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
            <AvatarImage src={profile?.profilePicture || ""} alt={profile?.name} />
            <AvatarFallback className="bg-rose-100 text-rose-700 text-2xl">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 shadow-md"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        <div>
          <h1 className="text-2xl">{profile?.name || 'Your Profile'}</h1>
          <p className="text-gray-600">{profile?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="personal">
            <User className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="couple">
            <Heart className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Couple</span>
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Settings */}
        <TabsContent value="personal" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <Button onClick={() => onUpdateProfile({ name })}>
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Account Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={onSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              {onAdminAccess && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-blue-600 hover:text-blue-700"
                  onClick={onAdminAccess}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Access
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Couple Settings */}
        <TabsContent value="couple" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Couple Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Partner Email</Label>
                <Input
                  value={profile?.partnerEmail || 'Not connected'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="anniversary">Relationship Started</Label>
                <Input
                  id="anniversary"
                  type="date"
                  placeholder="Select date"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50/50">
            <h3 className="font-semibold mb-4 text-red-600 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Danger Zone
            </h3>
            <div className="space-y-3">
              {/* Seed Sample Journals Button */}
              <Button 
                variant="outline" 
                className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-green-50/50"
                onClick={handleSeedJournals}
                disabled={isSeeding}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isSeeding ? 'Creating...' : 'Create 7 Sample Journal Entries'}
              </Button>
              <p className="text-xs text-green-700">
                ✨ This will add 7 beautifully crafted sample journal entries to see the journal in action
              </p>

              <Separator className="my-4" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isClearing}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isClearing ? 'Clearing...' : 'Clear All Journal Entries'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all of your
                      journal entries from the database. This is useful for starting fresh with
                      an empty journal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearJournals}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, delete all entries
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-red-600">
                ⚠️ This will permanently delete all your journal entries, events, photos, videos, and comments
              </p>
              
              <Separator className="my-4" />
              
              <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                Disconnect from Partner
              </Button>
              <p className="text-xs text-gray-600">
                This will remove all shared data and disconnect you from your partner
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Privacy & Sharing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Share Journal Entries</p>
                  <p className="text-sm text-gray-600">Allow partner to view your entries</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Share Prayer Requests</p>
                  <p className="text-sm text-gray-600">Allow partner to see your prayers</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Share Progress</p>
                  <p className="text-sm text-gray-600">Show your progress to partner</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Devotional</p>
                  <p className="text-sm text-gray-600">Receive daily devotional reminders</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Prayer Reminders</p>
                  <p className="text-sm text-gray-600">Get reminded to pray together</p>
                </div>
                <Switch
                  checked={prayerReminders}
                  onCheckedChange={setPrayerReminders}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Partner Activity</p>
                  <p className="text-sm text-gray-600">Notify when partner completes activities</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Community Updates</p>
                  <p className="text-sm text-gray-600">Get updates from your groups</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}