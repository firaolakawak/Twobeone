import { BrandLoader, LoadingMark } from './BrandLoader';
import { useUiCopy } from '../utils/uiTranslation';
import { settingsMessages } from '../locales/settings';
import { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Shield, 
  Bell, 
  Settings, 
  LogOut, 
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

  Bug,
  FileText,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Textarea } from './ui/textarea';
import { PartnerDisconnectDialog } from './PartnerDisconnectDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../utils/i18n';
import { PWAStatus } from './PWAStatus';
import { PushNotificationSetup } from './PushNotificationSetup';
import { InstallBanner } from './InstallPrompt';
import { PrivacyPolicy } from '../legal/privacy-policy';
import { TermsOfService } from '../legal/terms-of-service';
import { LegalFooter } from './LegalFooter';
import type { User as UserType } from '../types';

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
  onNavigateToDebug
}: SettingsScreenProps) {
  const tr = useUiCopy(settingsMessages);
  // Language context
  const { language, setLanguage, t } = useLanguage();
  const [savingLanguage, setSavingLanguage] = useState(false);
  const changeLanguage = async (next: typeof language) => {
    setLanguage(next);
    setSavingLanguage(true);
    try {
      await onUpdateProfile({ language: next });
    } catch {
      toast.error(tr('Language changed on this device. Account sync failed; please try again.'));
    } finally {
      setSavingLanguage(false);
    }
  };
  
  // Personal Info State - Initialize with empty strings to avoid controlled/uncontrolled warning
  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [relationshipStart, setRelationshipStart] = useState(profile?.relationshipStart ?? '');
  
  // Sync saved field changes; a language-only refresh must preserve draft edits.
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBio(profile.bio ?? '');
      setPhone(profile.phone ?? '');
      setLocation(profile.location ?? '');
      setRelationshipStart(profile.relationshipStart ?? '');
      const privacy = profile.privacySettings;
      const notifications = profile.notificationSettings;
      setShareJournal(privacy?.shareJournal !== false);
      setSharePrayers(privacy?.sharePrayers !== false);
      setShareProgress(privacy?.shareProgress !== false);
      setShareMilestones(privacy?.shareMilestones !== false);
      setShowOnlineStatus(privacy?.showOnlineStatus !== false);
      setDailyDevotional(notifications?.dailyDevotional !== false);
      setPrayerReminders(notifications?.prayerReminders !== false);
      setPartnerActivity(notifications?.partnerActivity !== false);
      setCommunityUpdates(notifications?.communityUpdates === true);
      setEmailNotifications(notifications?.emailNotifications !== false);
      setPushNotifications(notifications?.pushNotifications !== false);
    }
  }, [profile?.id, profile?.name, profile?.bio, profile?.phone, profile?.location,
    profile?.relationshipStart, profile?.privacySettings?.shareJournal,
    profile?.privacySettings?.sharePrayers, profile?.privacySettings?.shareProgress,
    profile?.privacySettings?.shareMilestones, profile?.privacySettings?.showOnlineStatus,
    profile?.notificationSettings?.dailyDevotional, profile?.notificationSettings?.prayerReminders,
    profile?.notificationSettings?.partnerActivity, profile?.notificationSettings?.communityUpdates,
    profile?.notificationSettings?.emailNotifications, profile?.notificationSettings?.pushNotifications]);

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
        toast.success(tr("Test sent! Push: {push} · Email: {email}", { push: data.push || "—", email: data.email || "—" }));
      } else {
        setTestReminderState('error');
        toast.error(data.error || tr("Test reminder failed"));
      }
    } catch (e: any) {
      setTestReminderState('error');
      toast.error(tr("Could not reach server"));
    }
    setTimeout(() => setTestReminderState('idle'), 4000);
  };
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
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
      toast.error(tr("Image must be smaller than 5MB"));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(tr("Please select an image file"));
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

          toast.success(tr("Profile picture updated!"))
          
          // Refresh profile data instead of reloading page
          if (onRefresh) {
            await onRefresh();
          }
          
          setIsUploadingPicture(false);
        } catch (error: any) {
          console.error('Failed to upload profile picture:', error);
          toast.error(tr("Failed to upload profile picture"));
          setIsUploadingPicture(false);
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast.error(tr("Failed to upload profile picture"));
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

      toast.success(tr("Profile picture deleted!"));
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      toast.error(tr("Failed to delete profile picture"));
    }
  };

  const handleUploadCoverPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 10 * 1024 * 1024) {
      toast.error(tr("Cover image must be smaller than 10MB"));
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(tr("Please select an image file"));
      return;
    }

    setIsUploadingCover(true);
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/upload-cover`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageData, fileName: file.name, contentType: file.type })
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to upload cover picture');
      toast.success(tr("Cover picture updated!"));
      await onRefresh?.();
    } catch (error) {
      console.error('Failed to upload cover picture:', error);
      toast.error(error instanceof Error ? error.message : tr("Failed to upload cover picture"));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleDeleteCoverPicture = async () => {
    setIsUploadingCover(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/delete-cover`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to delete cover picture');
      toast.success(tr("Cover picture deleted!"));
      await onRefresh?.();
    } catch (error) {
      console.error('Failed to delete cover picture:', error);
      toast.error(error instanceof Error ? error.message : tr("Failed to delete cover picture"));
    } finally {
      setIsUploadingCover(false);
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
      toast.success(tr("Personal information updated!"));
    } catch (error) {
      toast.error(tr("Failed to update profile"));
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
      toast.success(tr("Privacy settings updated!"));
    } catch (error) {
      toast.error(tr("Failed to update privacy settings"));
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
      toast.success(tr("Notification settings updated!"));
    } catch (error) {
      toast.error(tr("Failed to update notification settings"));
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

      toast.success(tr("Disconnected from partner"));
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error(tr("Failed to disconnect from partner"));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error(t.account.typeDeleteError);
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
          toast.error(t.account.disconnectFirst, { duration: 6000 });
          setIsDeleting(false);
          setShowDeleteDialog(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to delete account');
      }

      toast.success(t.account.deletedSuccess);
      // Sign out and redirect
      setTimeout(() => {
        onSignOut();
      }, 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(t.account.deletedError);
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info(tr("Preparing your data export..."));
      
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
      
      toast.success(tr("Data exported successfully!"));
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error(tr("Failed to export data"));
    }
  };

  const handleLinkByCode = async () => {
    if (!partnerCode || partnerCode.trim().length === 0) {
      toast.error(tr("Please enter an invite code"));
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
          toast.error(tr("❌ This invite code does not exist. Please check the code and try again."));
        } else if (errorData.error === 'Cannot link with yourself') {
          toast.error(tr("❌ You cannot link with yourself!"));
        } else if (errorData.error === 'Already linked with a partner') {
          toast.error(tr("❌ You are already linked with a partner."));
        } else {
          toast.error(`❌ ${errorData.error || tr("Failed to link by code")}`);
        }
        
        // Do NOT reload on error - just stop here
        setIsLinking(false);
        return;
      }

      const successData = await response.json();
      console.log('[SettingsScreen] Link success:', successData);
      
      toast.success(tr("✅ Linked with partner successfully! Refreshing..."));
      
      // Refresh profile data instead of reloading page
      if (onRefresh) {
        await onRefresh();
      }
      
      setIsLinking(false);
      setPartnerCode(''); // Clear the input
    } catch (error: any) {
      console.error('[SettingsScreen] Failed to link by code:', error);
      toast.error(tr("❌ Network error. Please check your connection and try again."));
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
      toast.error(tr("Failed to generate code"));
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactSubject || !contactMessage) {
      toast.error(tr("Please fill in all fields"));
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
      toast.success(tr("✅ Message sent successfully!"));
      
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
      toast.error(tr("Failed to send contact message"));
      setIsSendingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 [overflow-wrap:anywhere]">
      <div className="mx-auto w-full max-w-3xl space-y-7 pb-28">
        <Card className="relative isolate overflow-hidden rounded-[2rem] border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)]">
          <input type="file" id="cover-picture-upload" className="hidden" accept="image/*" onChange={handleUploadCoverPicture} disabled={isUploadingCover} />
          <div className="relative h-40 overflow-hidden bg-[linear-gradient(135deg,#FF3366_0%,#ff6b8f_52%,#fff0d6_100%)] sm:h-44">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" disabled={isUploadingCover} className="group absolute inset-0 h-full w-full overflow-hidden text-left outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-rose-300 disabled:cursor-wait" aria-label={tr("Cover picture options")}>
                  {profile?.coverPicture && <img src={profile.coverPicture} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />}
                  <span className={`absolute inset-0 transition-colors ${profile?.coverPicture ? 'bg-gradient-to-t from-slate-950/30 via-transparent to-white/10 group-hover:bg-slate-950/10' : 'bg-[radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.38),transparent_42%)] group-hover:bg-white/5'}`} aria-hidden="true" />
                  {isUploadingCover && <span className="absolute inset-0 flex items-center justify-center bg-white/70"><LoadingMark className="h-6 w-6  text-rose-600" /></span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-48 rounded-2xl border-rose-100 p-1.5 shadow-xl">
                <DropdownMenuItem onSelect={() => document.getElementById('cover-picture-upload')?.click()} className="tbo-action min-h-10 whitespace-normal rounded-xl px-3 text-slate-700 focus:bg-rose-50 focus:text-rose-700">{tr("Change Cover")}</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" disabled={!profile?.coverPicture} onSelect={() => void handleDeleteCoverPicture()} className="tbo-action min-h-10 whitespace-normal rounded-xl px-3">{tr("Delete Cover")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="tbo-eyebrow pointer-events-none absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-rose-700 shadow-sm ring-1 ring-rose-100 backdrop-blur-sm sm:left-9">
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />
               {tr("Your shared journey")} </div>
          </div>
          <CardContent className="relative px-6 pb-7 sm:px-9 sm:pb-9">
            <div className="flex -mt-11 flex-col gap-5 sm:flex-row sm:items-end">
              <div>
                <input
                  type="file"
                  id="profile-picture-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadProfilePicture}
                  disabled={isUploadingPicture}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" disabled={isUploadingPicture} className="group relative block rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-wait" aria-label={tr("Profile picture options")}>
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-rose-100 transition-shadow group-hover:shadow-xl">
                        <AvatarImage src={profile?.profilePicture || ""} alt={profile?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-rose-500 to-rose-600 text-2xl text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      {isUploadingPicture && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/75"><LoadingMark className="h-5 w-5  text-rose-600" /></span>}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={10} className="w-48 rounded-2xl border-rose-100 p-1.5 shadow-xl">
                    <DropdownMenuItem onSelect={() => document.getElementById('profile-picture-upload')?.click()} className="tbo-action min-h-10 whitespace-normal rounded-xl px-3 text-slate-700 focus:bg-rose-50 focus:text-rose-700">
                       {tr("Change Picture")} </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" disabled={!profile?.profilePicture} onSelect={() => void handleDeleteProfilePicture()} className="tbo-action min-h-10 whitespace-normal rounded-xl px-3">
                       {tr("Delete Picture")} </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="min-w-0 flex-1 sm:pb-1">
                <h1 className="tbo-page-title text-slate-950 min-w-0 break-words">{profile?.name || tr("Your Profile")}</h1>
                <p className="tbo-supporting mt-1 break-all text-slate-500">{profile?.email}</p>
                {partner && (
                  <div className="tbo-label mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-rose-700 ring-1 ring-rose-100">
                    <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                    <span>{tr("Connected with")} {partner.name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="w-full gap-6">
          <TabsList className="mb-6 grid h-14 w-full grid-cols-5 rounded-[1.25rem] border border-slate-200/80 bg-slate-100/70 p-1.5 shadow-inner" aria-label={tr("Profile settings sections")}>
            <TabsTrigger value="personal" aria-label={tr("Personal")} className="h-full gap-2 rounded-[0.9rem] text-slate-500 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm min-w-0 whitespace-normal">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("Personal")}</span>
            </TabsTrigger>
            <TabsTrigger value="couple" aria-label={tr("Couple")} className="h-full gap-2 rounded-[0.9rem] text-slate-500 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm min-w-0 whitespace-normal">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("Couple")}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" aria-label={tr("Privacy")} className="h-full gap-2 rounded-[0.9rem] text-slate-500 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm min-w-0 whitespace-normal">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("Privacy")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" aria-label={tr("Alerts")} className="h-full gap-2 rounded-[0.9rem] text-slate-500 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm min-w-0 whitespace-normal">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("Alerts")}</span>
            </TabsTrigger>
            <TabsTrigger value="app" aria-label={tr("App settings")} className="h-full gap-2 rounded-[0.9rem] text-slate-500 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm min-w-0 whitespace-normal">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("App")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                   <span className="min-w-0 flex-1 break-words">{tr("Personal Information")}</span> </CardTitle>
                <CardDescription>{tr("Update your personal details and profile information")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{tr("Full Name *")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={tr("Enter your full name")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{tr("Email Address")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="tbo-supporting text-muted-foreground">{tr("Email cannot be changed")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{tr("Phone Number")}</Label>
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
                  <Label htmlFor="location">{tr("Location")}</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={tr("City, Country")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{tr("Bio")}</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={tr("Tell us a bit about yourself...")}
                    rows={3}
                  />
                  <p className="tbo-caption text-muted-foreground">{bio.length}{tr("/200 characters")}</p>
                </div>

                <Button 
                  onClick={handleSavePersonalInfo} 
                  disabled={isSaving}
                  className="min-h-11 w-full rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 h-auto whitespace-normal py-2"
                >
                  {isSaving ? tr("Saving...") : tr("Save Changes")}
                </Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                   <span className="min-w-0 flex-1 break-words">{tr("Account Actions")}</span> </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Show Admin Panel button for authorized admins */}
                {onNavigateToAdmin && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-gradient-to-r from-primary-50 to-sky-50 border-primary-300 hover:bg-primary-100 h-auto min-h-9 whitespace-normal py-2"
                      onClick={onNavigateToAdmin}
                    >
                      <Shield className="w-4 h-4 mr-2 text-primary-600" />
                      <span className="text-primary-900">{tr("Admin Panel")}</span>
                    </Button>
                    {onNavigateToDebug && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200 hover:bg-sky-100 h-auto min-h-9 whitespace-normal py-2"
                        onClick={onNavigateToDebug}
                      >
                        <Bug className="w-4 h-4 mr-2 text-sky-600" />
                        <span className="text-sky-700">{tr("Debug Questions")}</span>
                      </Button>
                    )}
                    <Separator className="my-2" />
                  </>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto min-h-9 whitespace-normal py-2"
                  onClick={handleExportData}
                >
                  <Globe className="w-4 h-4 mr-2" />
                   {tr("Export My Data")} </Button>
                <Button variant="outline" className="w-full justify-start h-auto min-h-9 whitespace-normal py-2" onClick={() => setShowHelpDialog(true)}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                   {tr("Help & Support")} </Button>
                <Button variant="outline" className="w-full justify-start h-auto min-h-9 whitespace-normal py-2" onClick={() => setShowContactDialog(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                   {tr("Contact Us")} </Button>
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  className="w-full justify-start text-error-500 hover:text-error-700 hover:bg-error-50 h-auto min-h-9 whitespace-normal py-2"
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
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary-500" />
                   <span className="min-w-0 flex-1 break-words">{tr("Couple Information")}</span> </CardTitle>
                <CardDescription>{tr("Manage your relationship details and connection")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{tr("Partner Status")}</Label>
                  {partner ? (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-success-50 to-success-50 rounded-lg border border-success-500/30">
                      <CheckCircle className="w-5 h-5 text-success-700" />
                      <div className="min-w-0 flex-1 break-words">
                        <p className="tbo-label text-success-700">{partner.name}</p>
                        <p className="tbo-supporting break-all text-success-700">{partner.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="tbo-supporting text-muted-foreground">{tr("No partner connected")}</p>
                    </div>
                  )}
                </div>

                {/* Link by Code Section */}
                {!partner && (
                  <div className="space-y-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-primary-600" />
                      <h4 className="tbo-card-title text-primary-900 min-w-0 break-words">{tr("Link by Code")}</h4>
                    </div>
                    <p className="tbo-supporting text-foreground mb-3">
                       {tr("Connect with your partner using their invite code")} </p>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        placeholder={tr("Enter partner's code")}
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        className="min-w-0 flex-1 basis-40 font-mono"
                      />
                      <Button
                        onClick={handleLinkByCode}
                        aria-label={isLinking ? tr("Loading...") : tr("Link")}
                        aria-busy={isLinking}
                        disabled={isLinking || !partnerCode}
                        className="h-auto min-h-9 max-w-full whitespace-normal rounded-full bg-rose-600 hover:bg-rose-700"
                      >
                        {isLinking ? (
                          <><LoadingMark className="w-4 h-4 " /></>
                        ) : (
                          <>{tr("Link")}</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* My Invite Code */}
                {profile?.inviteCode && (
                  <div className="space-y-2">
                    <Label>{tr("My Invite Code")}</Label>
                    <div className="p-4 bg-gradient-to-r from-sky-50 to-sky-100 rounded-lg border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="tbo-supporting text-foreground">{tr("Share this code with your partner:")}</p>
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
                                toast.success(tr("✅ Code copied to clipboard!"));
                              } catch (err) {
                                console.error('Failed to copy:', err);
                                toast.error(tr("Failed to copy. Please select and copy manually."));
                              }
                              
                              document.body.removeChild(textArea);
                            } catch (err) {
                              console.error('Copy error:', err);
                              toast.error(tr("Failed to copy. Please select and copy manually."));
                            }
                          }}
                          className="text-sky-600 hover:text-sky-700"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                           {tr("Copy")} </Button>
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
                    <Label>{tr("My Invite Code")}</Label>
                    <div className="p-4 bg-gradient-to-r from-warning-50 to-warning-50 rounded-lg border border-warning-500/30">
                      <p className="tbo-supporting text-foreground mb-3">
                         {tr("You don't have an invite code yet. Generate one to share with your partner!")} </p>
                      <Button
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="w-full bg-gradient-to-r from-warning-500 to-warning-500 hover:from-warning-700 hover:to-warning-700 h-auto min-h-9 whitespace-normal py-2"
                      >
                        {isGeneratingCode ? (
                          <>
                            <LoadingMark className="w-4 h-4 mr-2 " />
                             {tr("Generating...")} </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                             {tr("Generate My Invite Code")} </>
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
                  className="min-h-11 w-full rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 h-auto whitespace-normal py-2"
                >
                  {isSaving ? tr("Saving...") : tr("Save Changes")}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="rounded-[1.5rem] border-error-500/30 bg-error-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-error-500">
                  <AlertTriangle className="w-5 h-5" />
                   {tr("Danger Zone")} </CardTitle>
                <CardDescription className="text-error-700">
                   {tr("Irreversible actions that affect your account")} </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-error-500 hover:text-error-700 hover:bg-error-50 border-error-500/50 h-auto min-h-9 whitespace-normal py-2"
                      onClick={() => setShowDisconnectDialog(true)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                       {tr("Request Partner Disconnect")} </Button>
                    <p className="tbo-supporting text-muted-foreground">
                       {tr("Both partners must agree to disconnect. There is a 30-day grace period.")} </p>
                    <Separator />
                  </>
                )}

                <Button
                  variant="destructive"
                  className="w-full h-auto min-h-9 whitespace-normal py-2"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                   {tr("Delete Account")} </Button>
                <p className="tbo-supporting text-error-700">
                   {tr("⚠️ Permanently delete your account and all associated data. This action cannot be undone.")} </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                   <span className="min-w-0 flex-1 break-words">{tr("Privacy & Sharing")}</span> </CardTitle>
                <CardDescription>{tr("Control what you share with your partner")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Share Journal Entries")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Allow partner to view your journal entries")}</p>
                  </div>
                  <Switch
                    checked={shareJournal}
                    onCheckedChange={setShareJournal}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Share Prayer Requests")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Allow partner to see your prayer requests")}</p>
                  </div>
                  <Switch
                    checked={sharePrayers}
                    onCheckedChange={setSharePrayers}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Share Progress")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Show your devotional progress to partner")}</p>
                  </div>
                  <Switch
                    checked={shareProgress}
                    onCheckedChange={setShareProgress}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Share Milestones")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Allow partner to see your milestones")}</p>
                  </div>
                  <Switch
                    checked={shareMilestones}
                    onCheckedChange={setShareMilestones}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Show Online Status")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Let partner see when you're active")}</p>
                  </div>
                  <Switch
                    checked={showOnlineStatus}
                    onCheckedChange={setShowOnlineStatus}
                  />
                </div>

                <Button 
                  onClick={handleSavePrivacySettings}
                  disabled={isSaving}
                  className="mt-4 min-h-11 w-full rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 h-auto whitespace-normal py-2"
                >
                  {isSaving ? tr("Saving...") : tr("Save Privacy Settings")}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                   <span className="min-w-0 flex-1 break-words">{tr("Data & Security")}</span> </CardTitle>
                <CardDescription>{tr("Manage your data and security preferences")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-auto min-h-9 whitespace-normal py-2">
                  <Lock className="w-4 h-4 mr-2" />
                   {tr("Change Password")} </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto min-h-9 whitespace-normal py-2"
                  onClick={handleExportData}
                >
                  <Globe className="w-4 h-4 mr-2" />
                   {tr("Download My Data")} </Button>
                <Button variant="outline" className="w-full justify-start h-auto min-h-9 whitespace-normal py-2">
                  <Shield className="w-4 h-4 mr-2" />
                   {tr("Two-Factor Authentication")} </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                   <span className="min-w-0 flex-1 break-words">{tr("Notification Preferences")}</span> </CardTitle>
                <CardDescription>{tr("Choose what notifications you want to receive")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Daily Devotional")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Receive daily devotional reminders at 8:00 AM")}</p>
                  </div>
                  <Switch
                    checked={dailyDevotional}
                    onCheckedChange={setDailyDevotional}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Prayer Reminders")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Get reminded to pray together with your partner")}</p>
                  </div>
                  <Switch
                    checked={prayerReminders}
                    onCheckedChange={setPrayerReminders}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Partner Activity")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Get notified when partner completes activities")}</p>
                  </div>
                  <Switch
                    checked={partnerActivity}
                    onCheckedChange={setPartnerActivity}
                  />
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Community Updates")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Receive updates from your community groups")}</p>
                  </div>
                  <Switch
                    checked={communityUpdates}
                    onCheckedChange={setCommunityUpdates}
                  />
                </div>

                <Button 
                  onClick={handleSaveNotificationSettings}
                  disabled={isSaving}
                  className="mt-4 min-h-11 w-full rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 h-auto whitespace-normal py-2"
                >
                  {isSaving ? tr("Saving...") : tr("Save Notification Settings")}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>{tr("Notification Channels")}</CardTitle>
                <CardDescription>{tr("Choose how you want to receive notifications")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{t.notifications.pushNotifications}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Receive notifications on your device")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pushNotifications && profile?.id && accessToken && (
                      <PushNotificationSetup
                        userId={profile.id}
                        accessToken={accessToken}
                        notificationsEnabled={pushNotifications}
                      />
                    )}
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label">{tr("Email Notifications")}</p>
                    <p className="tbo-supporting text-muted-foreground">{tr("Receive notifications via email")}</p>
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
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t.profile.language}
                </CardTitle>
                <CardDescription>
                  {tr("Choose your preferred language")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    disabled={savingLanguage}
                    aria-busy={savingLanguage && language === lang.code}
                    onClick={() => changeLanguage(lang.code)}
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
                        <p className="tbo-label" style={{ color: 'var(--foreground)', margin: 0 }}>
                          {lang.nativeName}
                        </p>
                        <p className="tbo-supporting" style={{ color: 'var(--muted-foreground)', margin: 0 }}>
                          {lang.name}
                        </p>
                      </div>
                    </div>
                    {savingLanguage && language === lang.code ? <LoadingMark size={20} /> : language === lang.code && (
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
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                   <span className="min-w-0 flex-1 break-words">{tr("Daily Reminders")}</span> </CardTitle>
                <CardDescription>
                   {tr("Get nudged when you miss your daily habits — mood, devotional, and Q&A")} </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label" style={{ color: 'var(--foreground)' }}>
                       {tr("Push Notifications")} </p>
                    <p className="tbo-supporting" style={{ color: 'var(--muted-foreground)' }}>
                       {tr("Daily app notification when inactive for 24 h")} </p>
                  </div>
                  <Switch
                    checked={reminderPush}
                    onCheckedChange={v => handleReminderToggle('reminderPush', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words">
                    <p className="tbo-label" style={{ color: 'var(--foreground)' }}>
                       {tr("Email Reminders")} </p>
                    <p className="tbo-supporting" style={{ color: 'var(--muted-foreground)' }}>
                      {tr("Sent to {email} when inactive for 24 h", { email: profile?.email || tr("your email") })}
                    </p>
                  </div>
                  <Switch
                    checked={reminderEmail}
                    onCheckedChange={v => handleReminderToggle('reminderEmail', v)}
                  />
                </div>
                <div
                  className="tbo-supporting rounded-lg p-3"
                  style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', color: 'var(--primary-700)' }}
                >
                   {tr("💡 Reminders are sent once per day only when you haven't checked in. You'll be prompted to log your mood, complete your devotional, and answer a Q&A question.")} </div>

                {/* Test button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestReminder}
                  disabled={testReminderState === 'sending'}
                  className="w-full h-auto min-h-9 whitespace-normal py-2"
                  style={{
                    borderColor: 'var(--primary-300)',
                    color: testReminderState === 'done' ? 'var(--success-700)' : testReminderState === 'error' ? 'var(--error-500)' : 'var(--primary-700)',
                  }}
                >
                  {testReminderState === 'sending' && <LoadingMark className="w-3 h-3 mr-2 " />}
                  {testReminderState === 'done' && '✅ '}
                  {testReminderState === 'error' && '❌ '}
                  {testReminderState === 'idle' ? tr("🔔 Send Test Reminder Now") :
                   testReminderState === 'sending' ? tr("Sending…") :
                   testReminderState === 'done' ? tr("Test Sent!") : tr("Failed — try again")}
                </Button>
              </CardContent>
            </Card>

            <PWAStatus />

            <InstallBanner />

            {/* Legal Documents Section */}
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  {t.legal.documents}
                </CardTitle>
                <CardDescription>
                  {t.legal.documentsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto min-h-9 whitespace-normal py-2"
                  onClick={() => setShowPrivacyPolicy(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t.legal.privacyPolicy}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto min-h-9 whitespace-normal py-2"
                  onClick={() => setShowTermsOfService(true)}
                >
                  <Scale className="w-4 h-4 mr-2" />
                  {t.legal.termsOfService}
                </Button>

                <div className="tbo-caption pt-2 text-muted-foreground">
                  {t.account.agreedDocuments}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Legal Footer */}
        <div className="mt-8">
          <LegalFooter language={language} />
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error-500">
              <AlertTriangle className="w-6 h-6" />
              {t.account.deleteAccount}
            </DialogTitle>
            <DialogDescription asChild className="space-y-2 pt-4">
              <div>
              {profile?.partnerId ? (
                // Show warning if connected to partner
                <div className="space-y-3">
                  <div className="bg-warning-50 border border-warning-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning-700 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="tbo-label text-warning-700">
                          {t.account.connectedTitle}
                        </p>
                        <p className="tbo-supporting text-warning-700">
                          {t.account.connectedDescription.replace('{partner}', partner?.name || '')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="tbo-supporting text-muted-foreground">
                    {t.account.disconnectFirst}
                  </p>
                </div>
              ) : (
                // Show normal delete warning if not connected
                <>
                  <p className="tbo-label text-foreground">
                    {t.account.deleteConfirmTitle}
                  </p>
                  <p className="tbo-supporting">
                    {t.account.deleteConfirmDescription}
                  </p>
                  <ul className="tbo-supporting list-disc list-inside space-y-1">
                    <li>{t.account.journalData}</li>
                    <li>{t.account.prayerData}</li>
                    <li>{t.account.milestoneData}</li>
                    <li>{t.account.progressData}</li>
                  </ul>
                  <p className="tbo-label mt-4">
                    {t.account.typeToConfirmPrefix}
                    <span className="font-bold text-error-500">DELETE</span>
                    {t.account.typeToConfirmSuffix}
                  </p>
                </>
              )}
              </div>
            </DialogDescription>
          </DialogHeader>
          {!profile?.partnerId && (
            <div className="py-4">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t.account.deletePlaceholder}
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
              {t.common.cancel}
            </Button>
            {!profile?.partnerId && (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              >
                {isDeleting ? t.account.deleting : t.account.deleteMyAccount}
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
               {tr("Help & Support")} </DialogTitle>
            <DialogDescription asChild className="space-y-2 pt-4">
              <div>
              <p className="tbo-label text-foreground">{tr("Need assistance?")}</p>
              <p className="tbo-supporting">{tr("Check out our help center or contact us for support.")}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowHelpDialog(false);
              }}
            >
               {tr("Close")} </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sky-600">
              <Mail className="w-6 h-6" />
               {tr("Contact Us")} </DialogTitle>
            <DialogDescription asChild className="space-y-2 pt-4">
              <div>
              <p className="tbo-label text-foreground">{tr("Get in touch with us")}</p>
              <p className="tbo-supporting">{tr("Send us a message and we'll get back to you as soon as possible.")}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="contactSubject">{tr("Subject")}</Label>
              <Input
                id="contactSubject"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder={tr("Enter the subject of your message")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactMessage">{tr("Message")}</Label>
              <Textarea
                id="contactMessage"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={tr("Enter your message here...")}
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
               {tr("Cancel")} </Button>
            <Button
              variant="primary"
              onClick={handleSendContact}
              disabled={isSendingContact}
            >
              {isSendingContact ? tr("Sending...") : tr("Send Message")}
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
              {t.legal.privacyPolicy}
            </DialogTitle>
            <DialogDescription>
              {t.legal.privacyDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <PrivacyPolicy language={language} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTermsOfService} onOpenChange={setShowTermsOfService}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {t.legal.termsOfService}
            </DialogTitle>
            <DialogDescription>
              {t.legal.termsDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <TermsOfService language={language} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
