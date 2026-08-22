import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Heart, Loader2, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

interface PartnerSetupProps {
  accessToken: string;
  onSuccess: () => void;
}

export function PartnerSetup({ accessToken, onSuccess }: PartnerSetupProps) {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerName, setPartnerName] = useState('Lensa');
  const [relationshipStart, setRelationshipStart] = useState('2023-06-04');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'create' | 'done'>('connect');

  const handleConnectExistingPartner = async () => {
    if (!partnerEmail) {
      toast.error('Please enter partner email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile/connect-partner`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            partnerEmail,
            relationshipStart
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to connect with partner');
      }

      const result = await response.json();
      
      if (result.partnerFound) {
        toast.success(`Connected with ${partnerEmail}!`);
        setStep('done');
        setTimeout(onSuccess, 1500);
      } else {
        toast.info('Partner account not found. Create one for them?');
        setStep('create');
      }
    } catch (error) {
      console.error('Failed to connect partner:', error);
      toast.error('Failed to connect with partner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePartnerAccount = async () => {
    if (!partnerEmail || !partnerName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Create partner account
      const signupResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: partnerEmail,
            password: 'TempPassword123!', // They can change this later
            name: partnerName,
            partnerEmail: '' // Will be set by connect endpoint
          })
        }
      );

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        throw new Error(errorData.error || 'Failed to create partner account');
      }

      // Now connect with the newly created account
      await handleConnectExistingPartner();
      
      toast.success(`Created account for ${partnerName}!`);
    } catch (error: any) {
      console.error('Failed to create partner account:', error);
      toast.error(error.message || 'Failed to create partner account');
      setIsLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">All Set! 💕</h2>
            <p className="text-gray-600 mb-4">
              You're now connected with {partnerName}
            </p>
            <p className="text-sm text-gray-500">
              Relationship started: {new Date(relationshipStart).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-pink-500" />
              Create Partner Account
            </CardTitle>
            <CardDescription>
              Create an account for {partnerEmail} so you can connect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Partner's Name</Label>
              <Input
                id="partner-name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Enter partner's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-email-confirm">Partner's Email</Label>
              <Input
                id="partner-email-confirm"
                type="email"
                value={partnerEmail}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship-start-confirm">Relationship Started</Label>
              <Input
                id="relationship-start-confirm"
                type="date"
                value={relationshipStart}
                onChange={(e) => setRelationshipStart(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                📧 A temporary password will be created. Share it with {partnerName} so they can sign in and change it.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Temporary password: <code className="bg-blue-100 px-2 py-1 rounded">TempPassword123!</code>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('connect')}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreatePartnerAccount}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create & Connect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Connect with Your Partner</CardTitle>
          <CardDescription>
            Add your partner to start your journey together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partner-email">Partner's Email</Label>
            <Input
              id="partner-email"
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="partner@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-start">Relationship Started</Label>
            <Input
              id="relationship-start"
              type="date"
              value={relationshipStart}
              onChange={(e) => setRelationshipStart(e.target.value)}
            />
          </div>

          <Button
            onClick={handleConnectExistingPartner}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Connect with Partner
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            If your partner doesn't have an account yet, we'll help you create one for them
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
