import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Heart, Loader2, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { useLanguage } from '../contexts/LanguageContext';

interface PartnerSetupProps {
  accessToken: string;
  onSuccess: () => void;
}

export function PartnerSetup({ accessToken, onSuccess }: PartnerSetupProps) {
  const { t } = useLanguage();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [relationshipStart, setRelationshipStart] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'create' | 'done'>('connect');

  const handleConnectExistingPartner = async () => {
    if (!partnerEmail) {
      toast.error(t.auth.enterEmail);
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
          body: JSON.stringify({ partnerEmail, relationshipStart })
        }
      );

      if (!response.ok) throw new Error(t.partner.failedConnect);

      const result = await response.json();

      if (result.partnerFound) {
        toast.success(`${t.partner.connectedWith} ${partnerEmail}!`);
        setStep('done');
        setTimeout(onSuccess, 1500);
      } else {
        toast.info(t.partner.notFound);
        setStep('create');
      }
    } catch (error) {
      toast.error(t.partner.failedConnect);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePartnerAccount = async () => {
    if (!partnerEmail || !partnerName) {
      toast.error(t.partner.fillAllFields);
      return;
    }

    setIsLoading(true);
    try {
      const signupResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: partnerEmail,
            password: 'TempPassword123!',
            name: partnerName,
            partnerEmail: ''
          })
        }
      );

      if (!signupResponse.ok) {
        const err = await signupResponse.json();
        throw new Error(err.error || t.partner.failedCreate);
      }

      await handleConnectExistingPartner();
      toast.success(`${t.partner.createdFor} ${partnerName}!`);
    } catch (error: any) {
      toast.error(error.message || t.partner.failedCreate);
      setIsLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--success-500)' }}
            >
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.partner.allSet}</h2>
            <p className="text-muted-foreground mb-4">
              {t.partner.connectedWith} {partnerName || partnerEmail}
            </p>
            {relationshipStart && (
              <p className="text-sm text-muted-foreground">
                {t.partner.relationshipStarted}: {new Date(relationshipStart).toLocaleDateString()}
              </p>
            )}
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
              <UserPlus className="w-6 h-6" style={{ color: 'var(--primary)' }} />
              {t.partner.createTitle}
            </CardTitle>
            <CardDescription>
              {t.partner.createDesc} — {partnerEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">{t.partner.partnerName}</Label>
              <Input
                id="partner-name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder={t.partner.partnerNamePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.partner.partnerEmail}</Label>
              <Input type="email" value={partnerEmail} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship-start-confirm">{t.partner.relationshipStarted}</Label>
              <Input
                id="relationship-start-confirm"
                type="date"
                value={relationshipStart}
                onChange={(e) => setRelationshipStart(e.target.value)}
              />
            </div>

            <div
              className="rounded-lg p-4 border text-sm"
              style={{ background: 'color-mix(in srgb, var(--primary) 6%, var(--background))', borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)' }}
            >
              <p style={{ color: 'var(--primary)' }}>📧 {t.partner.tempPasswordNote}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--primary)' }}>
                Temporary: <code className="rounded px-2 py-0.5" style={{ background: 'color-mix(in srgb, var(--primary) 12%, var(--background))' }}>TempPassword123!</code>
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('connect')} disabled={isLoading} className="flex-1">
                {t.partner.back}
              </Button>
              <Button onClick={handleCreatePartnerAccount} disabled={isLoading} className="flex-1" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.partner.creating}</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" />{t.partner.createConnect}</>
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
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--primary)' }}
          >
            <Heart className="w-8 h-8" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <CardTitle>{t.partner.connectTitle}</CardTitle>
          <CardDescription>{t.partner.connectDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partner-email">{t.partner.partnerEmail}</Label>
            <Input
              id="partner-email"
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder={t.partner.partnerEmailPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-start">{t.partner.relationshipStarted}</Label>
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
            className="w-full"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.partner.connecting}</>
            ) : (
              <><Heart className="w-4 h-4 mr-2" />{t.partner.connect}</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t.partner.ifNoAccount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
