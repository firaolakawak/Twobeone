import { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Shield, 
  Bell, 
  Settings, 
  LogOut, 
  Camera, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  HelpCircle, 
  Mail, 
  Lock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Key, 
  Copy, 
  Loader2,
  Bug,
  FileText,
  Scale
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { PartnerDisconnectDialog } from './PartnerDisconnectDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../utils/i18n';
import { PWAStatus } from './PWAStatus';
import { InstallBanner } from './InstallPrompt';
import { PrivacyPolicy } from '../legal/privacy-policy';
import { TermsOfService } from '../legal/terms-of-service';
import { LegalFooter } from './LegalFooter';

interface SettingsScreenProps {
  profile?: UserType;
  partner?: UserType;
  onSignOut: () => void;
  onUpdateProfile: (data: any) => Promise<void>;
  onBack?: () => void;
  accessToken: string;
  onRefresh?: () => Promise<void>;
  onNavigateToAdmin?: () => void;
  onNavigateToDebug?: () => void;
  onNavigateToDebugResponses?: () => void;
  onNavigateToTesting?: () => void;
}

export function SettingsScreen({ 
  profile, 
  partner,
  onSignOut, 
  onUpdateProfile,
  onBack,
  accessToken,
  onRefresh,
  onNavigateToAdmin,
  onNavigateToDebug,
  onNavigateToDebugResponses,
  onNavigateToTesting
}: SettingsScreenProps) {
  // Language context
  const { language, setLanguage, t } = useLanguage();
  
  // Personal Info State - Initialize with empty strings to avoid controlled/uncontrolled warning
  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [relationshipStart, setRelationshipStart] = useState(profile?.relationshipStart ?? '');
  
  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBio(profile.bio ?? '');
      setPhone(profile.phone ?? '');
      setLocation(profile.location ?? '');
      setRelationshipStart(profile.relationshipStart ?? '');
    }
  }, [profile]);

  // Partner linking state
  const [partnerCode, setPartnerCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  // Privacy State
  const [shareJournal, setShareJournal] = useState(true);
  const [sharePrayers, setSharePrayers] = useState(true);
  const [shareProgress, setShareProgress] = useState(true);
  const [shareMilestones, setShareMilestones] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  
  // Notification State
  const [dailyDevotional, setDailyDevotional] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [partnerActivity, setPartnerActivity] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  // Daily reminder preferences — synced to profile
  const [reminderPush,  setReminderPush]  = useState<boolean>(profile?.reminderPush  !== false);
  const [reminderEmail, setReminderEmail] = useState<boolean>(profile?.reminderEmail !== false);

  // Keep reminder toggles in sync when profile loads
  useEffect(() => {
    if (profile) {
      setReminderPush(profile.reminderPush !== false);
      setReminderEmail(profile.reminderEmail !== false);
    }
  }, [profile?.reminderPush, profile?.reminderEmail]);

  const handleReminderToggle = async (key: 'reminderPush' | 'reminderEmail', value: boolean) => {
    if (key === 'reminderPush')  setReminderPush(value);
    if (key === 'reminderEmail') setReminderEmail(value);
    try { await onUpdateProfile({ [key]: value }); }
    catch { if (key === 'reminderPush') setReminderPush(!value); else setReminderEmail(!value); }
  };

  const [testReminderState, setTestReminderState] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const handleTestReminder = async () => {
    setTestReminderState('sending');
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/cron/test-reminder`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (res.ok) {
        setTestReminderState('done');
        toast.success(`Test sent! Push: ${data.push || '—'} · Email: ${data.email || '—'}`);
      } else {
        setTestReminderState('error');
        toast.error(data.error || 'Test reminder failed');
      }
    } catch (e: any) {
      setTestReminderState('error');
      toast.error('Could not reach server');
    }
    setTimeout(() => setTestReminderState('idle'), 4000);
  };
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  const userInitials = profile?.name?.split(' ').map(n => n[0]).join('') || '?';

  const handleUploadProfilePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploadingPicture(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/upload-picture`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                imageData: base64Data,
                fileName: file.name
              })
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload picture');
          }

          toast.success('Profile picture updated!')
          
          // Refresh profile data instead of reloading page
          if (onRefresh) {
            await onRefresh();
          }
          
          setIsUploadingPicture(false);
        } catch (error: any) {
          console.error('Failed to upload profile picture:', error);
          toast.error('Failed to upload profile picture');
          setIsUploadingPicture(false);
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast.error('Failed to upload profile picture');
      setIsUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/delete-picture`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete picture');
      }

      toast.success('Profile picture deleted!');
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      toast.error('Failed to delete profile picture');
    }
  };

  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        name,
        bio,
        phone,
        location,
        relationshipStart
      });
      toast.success('Personal information updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        privacySettings: {
          shareJournal,
          sharePrayers,
          shareProgress,
          shareMilestones,
          showOnlineStatus
        }
      });
      toast.success('Privacy settings updated!');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        notificationSettings: {
          dailyDevotional,
          prayerReminders,
          partnerActivity,
          communityUpdates,
          emailNotifications,
          pushNotifications
        }
      });
      toast.success('Notification settings updated!');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectPartner = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/disconnect-partner`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect from partner');
      }

      toast.success('Disconnected from partner');
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect from partner');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/delete-account`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if user is connected to a partner
        if (errorData.code === 'PARTNER_CONNECTED') {
          toast.error(
            language === 'am' 
              ? 'መለያዎን በአጋርዎ ከተገናኘ በኋላ መሰረዝ አይችሉም። በመጀመሪያ ከአጋርዎ ያላቀቁ።' 
              : 'Cannot delete account while connected to a partner. Please disconnect from your partner first.',
            { duration: 6000 }
          );
          setIsDeleting(false);
          setShowDeleteDialog(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to delete account');
      }

      toast.success(language === 'am' ? 'መለያ በተሳካ ሁኔታ ተሰርዟል' : 'Account deleted successfully');
      // Sign out and redirect
      setTimeout(() => {
        onSignOut();
      }, 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(language === 'am' ? 'መለያ መሰረዝ አልተሳካም' : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing your data export...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/export-data`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();
      
      // Create and download JSON file
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `twobeone-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleLinkByCode = async () => {
    if (!partnerCode || partnerCode.trim().length === 0) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsLinking(true);
    try {
      console.log('[SettingsScreen] Linking with code:', partnerCode);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/link-by-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: partnerCode })
        }
      );

      console.log('[SettingsScreen] Link response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SettingsScreen] Link error:', errorData);
        
        // Show specific error message based on the error
        if (errorData.error === 'Invalid invite code') {
          toast.error('❌ This invite code does not exist. Please check the code and try again.');
        } else if (errorData.error === 'Cannot link with yourself') {
          toast.error('❌ You cannot link with yourself!');
        } else if (errorData.error === 'Already linked with a partner') {
          toast.error('❌ You are already linked with a partner.');
        } else {
          toast.error(`❌ ${errorData.error || 'Failed to link by code'}`);
        }
        
        // Do NOT reload on error - just stop here
        setIsLinking(false);
        return;
      }

      const successData = await response.json();
      console.log('[SettingsScreen] Link success:', successData);
      
      toast.success('✅ Linked with partner successfully! Refreshing...');
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
      
      setIsLinking(false);
      setPartnerCode(''); // Clear the input
    } catch (error: any) {
      console.error('[SettingsScreen] Failed to link by code:', error);
      toast.error('❌ Network error. Please check your connection and try again.');
      setIsLinking(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/generate-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      toast.success(`✅ Your invite code: ${data.inviteCode}`);
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      toast.error('Failed to generate code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactSubject || !contactMessage) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSendingContact(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/send-contact`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: contactSubject,
            message: contactMessage
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send contact message');
      }

      const data = await response.json();
      toast.success(`✅ Message sent successfully!`);
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
      
      setIsSendingContact(false);
      setShowContactDialog(false);
      setContactSubject('');
      setContactMessage('');
    } catch (error) {
      console.error('Failed to send contact message:', error);
      toast.error('Failed to send contact message');
      setIsSendingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-primary-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b">
      </div>

      <div className="max-w-2xl mx-auto px-[0px] py-[10px] pb-[10px] pt-[10px] pr-[2px] pl-[0px]">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400"></div>
          <CardContent className="relative pb-6">
            <div className="flex items-start gap-4 -mt-12">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.profilePicture || ""} alt={profile?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  id="profile-picture-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadProfilePicture}
                  disabled={isUploadingPicture}
                />
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 shadow-md bg-card hover:bg-muted text-foreground"
                  onClick={() => document.getElementById('profile-picture-upload')?.click()}
                  disabled={isUploadingPicture}
                >
                  {isUploadingPicture ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                {profile?.profilePicture && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 shadow-md"
                    onClick={handleDeleteProfilePicture}
                    title="Delete profile picture"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1 mt-12">
                <h2 className="text-xl font-semibold">{profile?.name || 'Your Name'}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                {partner && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Heart className="w-4 h-4 text-primary-500 fill-primary-500" />
                    <span>Connected with {partner.name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="couple" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Couple</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">App</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details and profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/200 characters</p>
                </div>

                <Button 
                  onClick={handleSavePersonalInfo} 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Show Admin Panel button for authorized admins */}
                {onNavigateToAdmin && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-gradient-to-r from-primary-50 to-sky-50 border-primary-300 hover:bg-primary-100"
                      onClick={onNavigateToAdmin}
                    >
                      <Shield className="w-4 h-4 mr-2 text-primary-600" />
                      <span className="text-primary-900">Admin Panel</span>
                    </Button>
                    {onNavigateToDebug && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200 hover:bg-sky-100"
                        onClick={onNavigateToDebug}
                      >
                        <Bug className="w-4 h-4 mr-2 text-sky-600" />
                        <span className="text-sky-700">Debug Questions</span>
                      </Button>
                    )}
                    <Separator className="my-2" />
                  </>
                )}
                
                {/* Debug Responses - Available for all users */}
                {onNavigateToDebugResponses && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gradient-to-r from-success-50 to-success-50 border-success-500/50 hover:bg-success-50"
                    onClick={onNavigateToDebugResponses}
                  >
                    <Bug className="w-4 h-4 mr-2 text-success-700" />
                    <span className="text-success-700">Debug Responses</span>
                  </Button>
                )}
                {/* Testing Dashboard - Available for all users */}
                {onNavigateToTesting && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gradient-to-r from-warning-50 to-error-50 border-warning-500/50 hover:bg-warning-50"
                    onClick={onNavigateToTesting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-warning-700" />
                    <span className="text-warning-700">🧪 Testing Dashboard</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportData}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowHelpDialog(true)}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowContactDialog(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  className="w-full justify-start text-error-500 hover:text-error-700 hover:bg-error-50"
                  onClick={onSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.auth.signOut}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Couple Settings Tab */}
          <TabsContent value="couple" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary-500" />
                  Couple Information
                </CardTitle>
                <CardDescription>Manage your relationship details and connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Partner Status</Label>
                  {partner ? (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-success-50 to-success-50 rounded-lg border border-success-500/30">
                      <CheckCircle className="w-5 h-5 text-success-700" />
                      <div className="flex-1">
                        <p className="font-medium text-success-700">{partner.name}</p>
                        <p className="text-sm text-success-700">{partner.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">No partner connected</p>
                    </div>
                  )}
                </div>

                {/* Link by Code Section */}
                {!partner && (
                  <div className="space-y-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-primary-600" />
                      <h4 className="font-semibold text-primary-900">Link by Code</h4>
                    </div>
                    <p className="text-sm text-foreground mb-3">
                      Connect with your partner using their invite code
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter partner's code"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        className="flex-1 font-mono"
                      />
                      <Button
                        onClick={handleLinkByCode}
                        disabled={isLinking || !partnerCode}
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        {isLinking ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /></>
                        ) : (
                          <>Link</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* My Invite Code */}
                {profile?.inviteCode && (
                  <div className="space-y-2">
                    <Label>My Invite Code</Label>
                    <div className="p-4 bg-gradient-to-r from-sky-50 to-sky-100 rounded-lg border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-foreground">Share this code with your partner:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            try {
                              // Fallback method for clipboard that works in all contexts
                              const textArea = document.createElement('textarea');
                              textArea.value = profile.inviteCode;
                              textArea.style.position = 'fixed';
                              textArea.style.left = '-999999px';
                              textArea.style.top = '-999999px';
                              document.body.appendChild(textArea);
                              textArea.focus();
                              textArea.select();
                              
                              try {
                                document.execCommand('copy');
                                toast.success('✅ Code copied to clipboard!');
                              } catch (err) {
                                console.error('Failed to copy:', err);
                                toast.error('Failed to copy. Please select and copy manually.');
                              }
                              
                              document.body.removeChild(textArea);
                            } catch (err) {
                              console.error('Copy error:', err);
                              toast.error('Failed to copy. Please select and copy manually.');
                            }
                          }}
                          className="text-sky-600 hover:text-sky-700"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-sky-200">
                        <Key className="w-5 h-5 text-sky-600 flex-shrink-0" />
                        <code className="font-mono text-sm font-bold text-sky-700 tracking-wide break-all flex-1">
                          {profile.inviteCode}
                        </code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Code Button (when user doesn't have one) */}
                {!profile?.inviteCode && (
                  <div className="space-y-2">
                    <Label>My Invite Code</Label>
                    <div className="p-4 bg-gradient-to-r from-warning-50 to-warning-50 rounded-lg border border-warning-500/30">
                      <p className="text-sm text-foreground mb-3">
                        You don't have an invite code yet. Generate one to share with your partner!
                      </p>
                      <Button
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="w-full bg-gradient-to-r from-warning-500 to-warning-500 hover:from-warning-700 hover:to-warning-700"
                      >
                        {isGeneratingCode ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                            Generate My Invite Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="relationshipStart">{t.profile.relationshipStart}</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="relationshipStart"
                      type="date"
                      value={relationshipStart}
                      onChange={(e) => setRelationshipStart(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSavePersonalInfo}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-error-500/30 bg-error-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-error-500">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-error-700">
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-error-500 hover:text-error-700 hover:bg-error-50 border-error-500/50"
                      onClick={() => setShowDisconnectDialog(true)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Request Partner Disconnect
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Both partners must agree to disconnect. There is a 30-day grace period.
                    </p>
                    <Separator />
                  </>
                )}

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <p className="text-xs text-error-700">
                  ⚠️ Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Sharing
                </CardTitle>
                <CardDescription>Control what you share with your partner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Share Journal Entries</p>
                    <p className="text-sm text-muted-foreground">Allow partner to view your journal entries</p>
                  </div>
                  <Switch
                    checked={shareJournal}
                    onCheckedChange={setShareJournal}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Share Prayer Requests</p>
                    <p className="text-sm text-muted-foreground">Allow partner to see your prayer requests</p>
                  </div>
                  <Switch
                    checked={sharePrayers}
                    onCheckedChange={setSharePrayers}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Share Progress</p>
                    <p className="text-sm text-muted-foreground">Show your devotional progress to partner</p>
                  </div>
                  <Switch
                    checked={shareProgress}
                    onCheckedChange={setShareProgress}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Share Milestones</p>
                    <p className="text-sm text-muted-foreground">Allow partner to see your milestones</p>
                  </div>
                  <Switch
                    checked={shareMilestones}
                    onCheckedChange={setShareMilestones}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Show Online Status</p>
                    <p className="text-sm text-muted-foreground">Let partner see when you're active</p>
                  </div>
                  <Switch
                    checked={showOnlineStatus}
                    onCheckedChange={setShowOnlineStatus}
                  />
                </div>

                <Button 
                  onClick={handleSavePrivacySettings}
                  disabled={isSaving}
                  className="w-full mt-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  {isSaving ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Data & Security
                </CardTitle>
                <CardDescription>Manage your data and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportData}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Daily Devotional</p>
                    <p className="text-sm text-muted-foreground">Receive daily devotional reminders at 8:00 AM</p>
                  </div>
                  <Switch
                    checked={dailyDevotional}
                    onCheckedChange={setDailyDevotional}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Prayer Reminders</p>
                    <p className="text-sm text-muted-foreground">Get reminded to pray together with your partner</p>
                  </div>
                  <Switch
                    checked={prayerReminders}
                    onCheckedChange={setPrayerReminders}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Partner Activity</p>
                    <p className="text-sm text-muted-foreground">Get notified when partner completes activities</p>
                  </div>
                  <Switch
                    checked={partnerActivity}
                    onCheckedChange={setPartnerActivity}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Community Updates</p>
                    <p className="text-sm text-muted-foreground">Receive updates from your community groups</p>
                  </div>
                  <Switch
                    checked={communityUpdates}
                    onCheckedChange={setCommunityUpdates}
                  />
                </div>

                <Button 
                  onClick={handleSaveNotificationSettings}
                  disabled={isSaving}
                  className="w-full mt-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  {isSaving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{t.notifications.pushNotifications}</p>
                    <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App & PWA Settings Tab */}
          <TabsContent value="app" className="space-y-6">
            {/* Language Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t.profile.language}
                </CardTitle>
                <CardDescription>
                  Choose your preferred language / ቋንቋ ይምረጡ / Afaan filadhu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-4)',
                      borderRadius: 'var(--radius-md)',
                      border: language === lang.code
                        ? '2px solid var(--primary-600)'
                        : '2px solid var(--border)',
                      background: language === lang.code ? 'var(--primary-50)' : 'var(--card)',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <span style={{ fontSize: '1.75rem' }}>{lang.flag}</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0, fontSize: 'var(--text-body)' }}>
                          {lang.nativeName}
                        </p>
                        <p style={{ color: 'var(--muted-foreground)', margin: 0, fontSize: 'var(--text-caption)' }}>
                          {lang.name}
                        </p>
                      </div>
                    </div>
                    {language === lang.code && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Daily Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Daily Reminders
                </CardTitle>
                <CardDescription>
                  Get nudged when you miss your daily habits — mood, devotional, and Q&A
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                      Push Notifications
                    </p>
                    <p className="text-sm" style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                      Daily app notification when inactive for 24 h
                    </p>
                  </div>
                  <Switch
                    checked={reminderPush}
                    onCheckedChange={v => handleReminderToggle('reminderPush', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                      Email Reminders
                    </p>
                    <p className="text-sm" style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                      Sent to {profile?.email || 'your email'} when inactive for 24 h
                    </p>
                  </div>
                  <Switch
                    checked={reminderEmail}
                    onCheckedChange={v => handleReminderToggle('reminderEmail', v)}
                  />
                </div>
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', fontSize: 'var(--text-caption)', color: 'var(--primary-700)' }}
                >
                  💡 Reminders are sent once per day only when you haven't checked in. You'll be prompted to log your mood, complete your devotional, and answer a Q&A question.
                </div>

                {/* Test button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestReminder}
                  disabled={testReminderState === 'sending'}
                  className="w-full"
                  style={{
                    borderColor: 'var(--primary-300)',
                    color: testReminderState === 'done' ? 'var(--success-700)' : testReminderState === 'error' ? 'var(--error-500)' : 'var(--primary-700)',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  {testReminderState === 'sending' && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                  {testReminderState === 'done' && '✅ '}
                  {testReminderState === 'error' && '❌ '}
                  {testReminderState === 'idle' ? '🔔 Send Test Reminder Now' :
                   testReminderState === 'sending' ? 'Sending…' :
                   testReminderState === 'done' ? 'Test Sent!' : 'Failed — try again'}
                </Button>
              </CardContent>
            </Card>

            <PWAStatus />

            <InstallBanner />

            {/* Legal Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  {language === 'am' ? 'ህጋዊ ሰነዶች' : 'Legal Documents'}
                </CardTitle>
                <CardDescription>
                  {language === 'am' 
                    ? 'የግላዊነት መመሪያችንን እና የአገልግሎት ውሎቻችንን ይመልከቱ' 
                    : 'View our Privacy Policy and Terms of Service'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowPrivacyPolicy(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {language === 'am' ? 'የግላዊነት መመሪያ' : 'Privacy Policy'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowTermsOfService(true)}
                >
                  <Scale className="w-4 h-4 mr-2" />
                  {language === 'am' ? 'የአገልግሎት ውሎች' : 'Terms of Service'}
                </Button>

                <div className="pt-2 text-xs text-muted-foreground">
                  {language === 'am' 
                    ? 'በመለያ ማቆያ ጊዜ እነዚህን ሰነዶች ተስማምተዋል።' 
                    : 'You agreed to these documents when you created your account.'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Legal Footer */}
        <div className="mt-8">
          <LegalFooter />
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error-500">
              <AlertTriangle className="w-6 h-6" />
              {language === 'am' ? 'መለያ ሰርዝ' : 'Delete Account'}
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              {profile?.partnerId ? (
                // Show warning if connected to partner
                <div className="space-y-3">
                  <div className="bg-warning-50 border border-warning-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning-700 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="font-semibold text-warning-700">
                          {language === 'am' 
                            ? 'መለያዎ ከአጋርዎ ጋር ተገናኝቷል' 
                            : 'Your account is connected to a partner'}
                        </p>
                        <p className="text-sm text-warning-700">
                          {language === 'am' 
                            ? `መለያዎን ከማጥፍዎ በፊት ከአጋርዎ ${partner?.name || ''} ጋር መለያየት አለብዎት። ከአጋርዎ ለመለያየት ወደ አጋር ማቆያ ክፍል ይሂዱ።`
                            : `You must disconnect from your partner ${partner?.name || ''} before you can delete your account. Go to the Partner section to disconnect.`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'am' 
                      ? 'ከአጋርዎ ከተለያዩ በኋላ መለያዎን መሰረዝ ይችላሉ።' 
                      : 'After disconnecting from your partner, you will be able to delete your account.'}
                  </p>
                </div>
              ) : (
                // Show normal delete warning if not connected
                <>
                  <p className="font-medium text-foreground">
                    {language === 'am' ? 'በእርግጠኝነት ይህንን ማድረግ ይፈልጋሉ?' : 'Are you absolutely sure?'}
                  </p>
                  <p>
                    {language === 'am' 
                      ? 'ይህ እርምጃ መለስ ሊል አይችልም። ይህ መለያዎን እና ሁሉንም መረጃዎን በቋሚነት ይሰርዛል፡-' 
                      : 'This action cannot be undone. This will permanently delete your account and remove all your data including:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{language === 'am' ? 'ሁሉም የማስታወሻ ግቤቶች እና ክስተቶች' : 'All journal entries and events'}</li>
                    <li>{language === 'am' ? 'ሁሉም የጸሎት ጥያቄዎች' : 'All prayer requests'}</li>
                    <li>{language === 'am' ? 'ሁሉም ማዕረግ እና ትውስታዎች' : 'All milestones and memories'}</li>
                    <li>{language === 'am' ? 'ሁሉም እድገቶች እና ስኬቶች' : 'All progress and achievements'}</li>
                  </ul>
                  <p className="mt-4 font-medium">
                    {language === 'am' ? 'ለማረጋገጥ ' : 'Type '}
                    <span className="font-bold text-error-500">DELETE</span>
                    {language === 'am' ? ' ይተይቡ፡' : ' to confirm:'}
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {!profile?.partnerId && (
            <div className="py-4">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={language === 'am' ? 'DELETE ይተይቡ' : 'Type DELETE to confirm'}
                className="border-error-500/50 focus:border-error-500"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
              }}
              disabled={isDeleting}
            >
              {language === 'am' ? 'ሰርዝ' : 'Cancel'}
            </Button>
            {!profile?.partnerId && (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              >
                {isDeleting 
                  ? (language === 'am' ? 'በመሰረዝ ላይ...' : 'Deleting...') 
                  : (language === 'am' ? 'መለያዬን ሰርዝ' : 'Delete My Account')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sky-600">
              <HelpCircle className="w-6 h-6" />
              Help & Support
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p className="font-medium text-foreground">Need assistance?</p>
              <p>Check out our help center or contact us for support.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowHelpDialog(false);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sky-600">
              <Mail className="w-6 h-6" />
              Contact Us
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p className="font-medium text-foreground">Get in touch with us</p>
              <p>Send us a message and we'll get back to you as soon as possible.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="contactSubject">Subject</Label>
              <Input
                id="contactSubject"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="Enter the subject of your message"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactMessage">Message</Label>
              <Textarea
                id="contactMessage"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowContactDialog(false);
                setContactSubject('');
                setContactMessage('');
              }}
              disabled={isSendingContact}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendContact}
              disabled={isSendingContact}
            >
              {isSendingContact ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Disconnect Dialog */}
      <PartnerDisconnectDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        profile={profile}
        partner={partner}
        onDisconnected={onRefresh}
      />

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {language === 'am' ? 'የግላዊነት መመሪያ' : 'Privacy Policy'}
            </DialogTitle>
            <DialogDescription>
              {language === 'am' 
                ? 'የግላዊ መረጃዎን እንዴት እንሰበስብ፣ እንጠቀም እና እንጠብቅ' 
                : 'How we collect, use, and protect your personal information'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <PrivacyPolicy language={language as 'en' | 'am'} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTermsOfService} onOpenChange={setShowTermsOfService}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {language === 'am' ? 'የአገልግሎት ውሎች' : 'Terms of Service'}
            </DialogTitle>
            <DialogDescription>
              {language === 'am' 
                ? 'የቱቤዎንን መተግበሪያ የመጠቀም ውል እና ሁኔታዎች' 
                : 'Agreement and conditions for using TwoBeOne app'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <TermsOfService language={language as 'en' | 'am'} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}