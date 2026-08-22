import { useState, useEffect } from 'react';
import { Heart, Camera, Upload, Edit2, Save, X, Link2, Users, Calendar, MapPin, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CoupleProfileProps {
  profile?: {
    id?: string;
    name?: string;
    email?: string;
    partnerEmail?: string;
    partnerId?: string;
    coupleId?: string;
    profilePicture?: string;
  };
  partner?: {
    id?: string;
    name?: string;
    email?: string;
    profilePicture?: string;
  };
  accessToken: string;
  onUpdateProfile: (data: any) => void;
  onRefresh?: () => void;
}

interface CoupleData {
  coupleStory?: string;
  relationshipStartDate?: string;
  location?: string;
  couplePicture?: string;
  milestone?: string;
}

export function CoupleProfile({ profile, partner, accessToken, onUpdateProfile, onRefresh }: CoupleProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile data
  const [userName, setUserName] = useState(profile?.name || '');
  const [userPicture, setUserPicture] = useState(profile?.profilePicture || '');
  
  // Couple data
  const [coupleData, setCoupleData] = useState<CoupleData>({
    coupleStory: '',
    relationshipStartDate: '',
    location: '',
    couplePicture: '',
    milestone: ''
  });

  // Link couple fields
  const [linkMethod, setLinkMethod] = useState<'email' | 'code'>('email');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (profile?.coupleId) {
      loadCoupleData();
    }
  }, [profile?.coupleId]);

  const loadCoupleData = async () => {
    if (!profile?.coupleId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/couple-data/${profile.coupleId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.coupleData) {
          setCoupleData(data.coupleData);
        }
      }
    } catch (error) {
      console.error('Error loading couple data:', error);
    }
  };

  const handleImageUpload = async (file: File, type: 'user' | 'couple') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;

        // Upload to server
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/upload-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              image: base64Image,
              type: type,
              coupleId: profile?.coupleId
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();

        if (type === 'user') {
          setUserPicture(data.imageUrl);
          await onUpdateProfile({ profilePicture: data.imageUrl });
          toast.success('Profile picture updated!');
        } else {
          setCoupleData(prev => ({ ...prev, couplePicture: data.imageUrl }));
          await saveCoupleData({ couplePicture: data.imageUrl });
          toast.success('Couple picture updated!');
        }

        if (onRefresh) onRefresh();
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const saveCoupleData = async (updates?: Partial<CoupleData>) => {
    if (!profile?.coupleId) {
      toast.error('Please link with your partner first');
      return;
    }

    try {
      const dataToSave = updates || coupleData;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/couple-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            coupleId: profile.coupleId,
            ...dataToSave
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save couple data');
      }

      if (!updates) {
        toast.success('Couple profile updated!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save couple data');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await onUpdateProfile({ name: userName });
    await saveCoupleData();
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleLinkCouple = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/link-couple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            method: linkMethod,
            partnerEmail: linkMethod === 'email' ? partnerEmail : undefined,
            inviteCode: linkMethod === 'code' ? inviteCode : undefined
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link couple');
      }

      const data = await response.json();
      
      // Store couple ID
      if (data.coupleId) {
        localStorage.setItem('twobeone_couple_id', data.coupleId);
      }

      toast.success('Successfully linked with your partner!');
      setIsLinkDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Link error:', error);
      toast.error(error.message || 'Failed to link couple');
    }
  };

  const calculateDaysTogether = () => {
    if (!coupleData.relationshipStartDate) return 0;
    const start = new Date(coupleData.relationshipStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const userInitials = userName?.split(' ').map(n => n[0]).join('') || '?';
  const partnerInitials = partner?.name?.split(' ').map(n => n[0]).join('') || '?';

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Action Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Couple Profile</h1>
        {!partner ? (
          <Button onClick={() => setIsLinkDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Link2 className="w-4 h-4 mr-2" />
            Link Partner
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        )}
      </div>

      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* User Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={userPicture} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-white text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center shadow-lg hover:bg-rose-700 transition-colors">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'user')}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
            
            <div className="text-center mt-4">
              {isEditing ? (
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-center max-w-[200px]"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-2xl font-semibold">{userName}</h2>
              )}
              <p className="text-sm text-muted-foreground mt-1">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner Linking Card */}
      {!partner && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              Connect with Your Partner
            </CardTitle>
            <CardDescription>
              Link your account with your partner to share your spiritual journey
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              onClick={() => setIsLinkDialogOpen(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Couple Story & Details */}
      {partner && (
        <>
          {/* Couple Picture Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Couple Picture
              </CardTitle>
              <CardDescription>Share a special photo together</CardDescription>
            </CardHeader>
            <CardContent>
              {coupleData.couplePicture ? (
                <div className="relative group">
                  <img 
                    src={coupleData.couplePicture} 
                    alt="Couple" 
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                      <div className="text-white text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Change Photo</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'couple')}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Upload a couple photo</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'couple')}
                    disabled={isUploading || !isEditing}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Our Story */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                Our Story
              </CardTitle>
              <CardDescription>Share your love journey</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={coupleData.coupleStory}
                  onChange={(e) => setCoupleData(prev => ({ ...prev, coupleStory: e.target.value }))}
                  placeholder="Tell your story... How did you meet? What makes your relationship special?"
                  rows={6}
                  className="resize-none"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {coupleData.coupleStory || 'No story added yet. Click Edit Profile to add your story!'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Relationship Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Relationship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Relationship Started
                </Label>
                {isEditing ? (
                  <Input
                    id="startDate"
                    type="date"
                    value={coupleData.relationshipStartDate}
                    onChange={(e) => setCoupleData(prev => ({ ...prev, relationshipStartDate: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-700">
                    {coupleData.relationshipStartDate 
                      ? new Date(coupleData.relationshipStartDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Location
                </Label>
                {isEditing ? (
                  <Input
                    id="location"
                    value={coupleData.location}
                    onChange={(e) => setCoupleData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-gray-700">{coupleData.location || 'Not set'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="milestone" className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-purple-600" />
                  Current Milestone
                </Label>
                {isEditing ? (
                  <Input
                    id="milestone"
                    value={coupleData.milestone}
                    onChange={(e) => setCoupleData(prev => ({ ...prev, milestone: e.target.value }))}
                    placeholder="e.g., Engaged, Dating, Married"
                  />
                ) : (
                  <p className="text-gray-700">{coupleData.milestone || 'Not set'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          {isEditing && (
            <Button onClick={handleSaveProfile} className="w-full" size="lg" disabled={isUploading}>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          )}
        </>
      )}

      {/* Link Couple Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent aria-describedby="link-partner-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              Link with Your Partner
            </DialogTitle>
            <DialogDescription id="link-partner-description">
              Connect your accounts to share your spiritual journey together
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={linkMethod === 'email' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLinkMethod('email')}
              >
                Email
              </Button>
              <Button
                variant={linkMethod === 'code' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLinkMethod('code')}
              >
                Invite Code
              </Button>
            </div>

            {linkMethod === 'email' ? (
              <div>
                <Label htmlFor="partner-email">Partner's Email</Label>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter your partner's registered email address
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="invite-code">Partner's Invite Code</Label>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase tracking-wider text-center text-lg"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the 6-character code your partner shared with you
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkCouple} className="bg-purple-600 hover:bg-purple-700">
              <Link2 className="w-4 h-4 mr-2" />
              Link Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}