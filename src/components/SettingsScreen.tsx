import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User as UserType } from '../types';
import { 
  LogOut, 
  Shield, 
  Trash2, 
  HelpCircle, 
  Camera, 
  User, 
  Heart, 
  Bell, 
  Sparkles,
  Lock,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Settings,
  Key,
  Copy,
  Loader2,
  Home,
  Bug
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';

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
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);

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
        throw new Error('Failed to delete account');
      }

      toast.success('Account deleted successfully');
      // Sign out and redirect
      setTimeout(() => {
        onSignOut();
      }, 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-pink-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold">Settings</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400"></div>
          <CardContent className="relative pb-6">
            <div className="flex items-start gap-4 -mt-12">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.profilePicture || ""} alt={profile?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
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
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 shadow-md bg-white hover:bg-gray-100 text-gray-700"
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
                <p className="text-sm text-gray-600">{profile?.email}</p>
                {partner && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span>Connected with {partner.name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
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
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
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
                    <MapPin className="w-4 h-4 text-gray-400" />
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
                  <p className="text-xs text-gray-500">{bio.length}/200 characters</p>
                </div>

                <Button 
                  onClick={handleSavePersonalInfo} 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                {/* Show Admin Panel button if user's email contains 'admin' */}
                {profile?.email?.includes('admin') && onNavigateToAdmin && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300 hover:bg-purple-100"
                      onClick={onNavigateToAdmin}
                    >
                      <Shield className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="text-purple-900">Admin Panel</span>
                    </Button>
                    {onNavigateToDebug && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 hover:bg-blue-100"
                        onClick={onNavigateToDebug}
                      >
                        <Bug className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-blue-900">Debug Questions</span>
                      </Button>
                    )}
                    <Separator className="my-2" />
                  </>
                )}
                
                {/* Debug Responses - Available for all users */}
                {onNavigateToDebugResponses && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:bg-green-100"
                    onClick={onNavigateToDebugResponses}
                  >
                    <Bug className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-900">Debug Responses</span>
                  </Button>
                )}
                {/* Testing Dashboard - Available for all users */}
                {onNavigateToTesting && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 hover:bg-orange-100"
                    onClick={onNavigateToTesting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="text-orange-900">🧪 Testing Dashboard</span>
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
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Couple Settings Tab */}
          <TabsContent value="couple" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Couple Information
                </CardTitle>
                <CardDescription>Manage your relationship details and connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Partner Status</Label>
                  {partner ? (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">{partner.name}</p>
                        <p className="text-sm text-green-700">{partner.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">No partner connected</p>
                    </div>
                  )}
                </div>

                {/* Link by Code Section */}
                {!partner && (
                  <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Link by Code</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
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
                        className="bg-purple-600 hover:bg-purple-700"
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
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-700">Share this code with your partner:</p>
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
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                        <Key className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <code className="font-mono text-sm font-bold text-blue-900 tracking-wide break-all flex-1">
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
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-gray-700 mb-3">
                        You don't have an invite code yet. Generate one to share with your partner!
                      </p>
                      <Button
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
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
                  <Label htmlFor="relationshipStart">Relationship Started</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-700">
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                          <Heart className="w-4 h-4 mr-2" />
                          Disconnect from Partner
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect from Partner?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the connection with {partner.name}. You will no longer be able to see each other's shared content. Your individual data will be preserved.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDisconnectPartner}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-xs text-gray-600">
                      Remove connection with your partner while keeping your data
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
                <p className="text-xs text-red-700">
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
                    <p className="text-sm text-gray-600">Allow partner to view your journal entries</p>
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
                    <p className="text-sm text-gray-600">Allow partner to see your prayer requests</p>
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
                    <p className="text-sm text-gray-600">Show your devotional progress to partner</p>
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
                    <p className="text-sm text-gray-600">Allow partner to see your milestones</p>
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
                    <p className="text-sm text-gray-600">Let partner see when you're active</p>
                  </div>
                  <Switch
                    checked={showOnlineStatus}
                    onCheckedChange={setShowOnlineStatus}
                  />
                </div>

                <Button 
                  onClick={handleSavePrivacySettings}
                  disabled={isSaving}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                    <p className="text-sm text-gray-600">Receive daily devotional reminders at 8:00 AM</p>
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
                    <p className="text-sm text-gray-600">Get reminded to pray together with your partner</p>
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
                    <p className="text-sm text-gray-600">Get notified when partner completes activities</p>
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
                    <p className="text-sm text-gray-600">Receive updates from your community groups</p>
                  </div>
                  <Switch
                    checked={communityUpdates}
                    onCheckedChange={setCommunityUpdates}
                  />
                </div>

                <Button 
                  onClick={handleSaveNotificationSettings}
                  disabled={isSaving}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive notifications on your device</p>
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
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p className="font-medium text-gray-900">Are you absolutely sure?</p>
              <p>This action cannot be undone. This will permanently delete your account and remove all your data including:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All journal entries and events</li>
                <li>All prayer requests</li>
                <li>All milestones and memories</li>
                <li>All progress and achievements</li>
                <li>Connection with your partner</li>
              </ul>
              <p className="mt-4 font-medium">Type <span className="font-bold text-red-600">DELETE</span> to confirm:</p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="border-red-300 focus:border-red-500"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <HelpCircle className="w-6 h-6" />
              Help & Support
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p className="font-medium text-gray-900">Need assistance?</p>
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
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Mail className="w-6 h-6" />
              Contact Us
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p className="font-medium text-gray-900">Get in touch with us</p>
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
    </div>
  );
}