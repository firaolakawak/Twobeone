import { formatUiDate } from '../utils/uiDateTime';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { LoadingMark } from './BrandLoader';
import { profileUiMessages } from '../locales/profileUi';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { BackButton } from './BackButton';
import { Card, CardContent } from './ui/card';
import { AlertTriangle, Heart, HeartCrack, Clock, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

interface PartnerDisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: {
    id: string;
    name: string;
  };
  partner?: {
    id: string;
    name: string;
  };
  onDisconnected?: () => void;
}

export function PartnerDisconnectDialog({ 
  open, 
  onOpenChange, 
  profile, 
  partner,
  onDisconnected 
}: PartnerDisconnectDialogProps) {
  const tr = useUiCopy(profileUiMessages);
  const { t, language } = useLanguage();
  const partnerDisplayName = partner?.name || tr('your partner');
  const [isLoading, setIsLoading] = useState(false);
  const [disconnectStatus, setDisconnectStatus] = useState<any>(null);
  const [view, setView] = useState<'initial' | 'confirm' | 'status'>('initial');

  useEffect(() => {
    if (open) {
      checkDisconnectStatus();
    }
  }, [open]);

  const checkDisconnectStatus = async () => {
    try {
      const status = await api.partner.getDisconnectStatus();
      setDisconnectStatus(status);

      if (status.hasRequest) {
        setView('status');
      } else {
        setView('initial');
      }

      // If disconnected, notify parent
      if (status.disconnected) {
        toast.info(tr("Your partnership has been disconnected"));
        onDisconnected?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error checking disconnect status:', error);
    }
  };

  const handleRequestDisconnect = async () => {
    setIsLoading(true);
    try {
      const result = await api.partner.requestDisconnect();
      toast.success(tr(result.status === 'agreed' ? 'Both partners have agreed' : 'Disconnect request sent'));
      await checkDisconnectStatus();
    } catch (error: any) {
      console.error('Error requesting disconnect:', error);
      if (error.message?.includes('already requested')) {
        toast.error(tr("You have already requested to disconnect"));
        await checkDisconnectStatus();
      } else {
        toast.error(tr('Failed to request disconnect'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDisconnect = async () => {
    setIsLoading(true);
    try {
      await api.partner.cancelDisconnect();
      toast.success(tr('Disconnect request cancelled'));
      await checkDisconnectStatus();
      setView('initial');
    } catch (error: any) {
      console.error('Error cancelling disconnect:', error);
      toast.error(tr('Failed to cancel disconnect'));
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemainingText = (days?: number) => {
    if (typeof days !== 'number') return tr('Starts after both agree');
    if (days <= 0) return tr("Grace period ended");
    if (days === 1) return tr("1 day remaining");
    return tr('{count} days remaining', { count: days });
  };

  const formatDate = (value?: string) => value
    ? formatUiDate(new Date(value), UI_LOCALES[language])
    : tr('Starts after both agree');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {/* Initial View - Warning */}
        {view === 'initial' && (
          <>
            <DialogHeader>
              <DialogTitle className="tbo-dialog-title flex items-center gap-2 text-error-500">
                <AlertTriangle className="w-5 h-5" />

                {tr("Disconnect from Partner")}
              </DialogTitle>
              <DialogDescription className="tbo-supporting">

                {tr("This is a serious step that requires careful consideration")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="border-warning-500/30 bg-warning-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="tbo-card-title text-warning-700">

                      {tr("Important Information")}
                    </h3>
                    <ul className="text-sm text-warning-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>{tr("Both partners must agree")}</strong>  {tr("- One person cannot disconnect alone")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>{tr("30-day grace period")}</strong>  {tr("- After both agree, you have 30 days to cancel")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>{tr("Email notifications")}</strong>  {tr("- Both partners will receive email updates")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>{tr("Your data remains private")}</strong>  {tr("- Individual data is not shared after disconnect")}</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <p className="tbo-supporting text-muted-foreground">

                {tr("If you're experiencing difficulties, consider talking with your partner or seeking guidance from a trusted counselor before taking this step.")}
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="tbo-action w-full sm:w-auto"
              >

                {tr("Cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setView('confirm')}
                className="tbo-action w-full sm:w-auto"
              >

                {tr("Continue")}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Confirmation View */}
        {view === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="tbo-dialog-title flex items-center gap-2 text-error-500">
                <HeartCrack className="w-5 h-5" />

                {tr("Confirm Disconnect Request")}
              </DialogTitle>
              <DialogDescription className="tbo-supporting">
                {tr('This will notify {name} of your request', { name: partnerDisplayName })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="tbo-supporting text-foreground">
                {tr('By clicking "Request Disconnect", you are requesting to end your partnership with {name}.', { name: partnerDisplayName })}
              </p>

              <Card className="border-error-500/30 bg-error-50">
                <CardContent className="pt-6">
                  <p className="tbo-supporting text-error-700">
                    <strong>{tr("What happens next:")}</strong>
                  </p>
                  <ol className="text-sm text-error-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>{tr('{name} will receive a notification and email', { name: partnerDisplayName })}</li>
                    <li>{tr('If {name} also agrees, a 30-day grace period begins', { name: partnerDisplayName })}</li>
                    <li>{tr("Either of you can cancel during those 30 days")}</li>
                    <li>{tr("After 30 days, the disconnection becomes permanent")}</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <BackButton
                onClick={() => setView('initial')}
                disabled={isLoading}
                label={t.common.back}
                showLabel
              />
              <Button
                variant="destructive"
                onClick={handleRequestDisconnect}
                disabled={isLoading}
                className="tbo-action w-full sm:w-auto"
              >
                {isLoading && <LoadingMark />}
                {isLoading ? tr("Sending Request...") : tr("Request Disconnect")}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Status View - Active Request */}
        {view === 'status' && disconnectStatus?.hasRequest && (
          <>
            <DialogHeader>
              <DialogTitle className="tbo-dialog-title flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning-700" />

                {tr("Disconnect Request Active")}
              </DialogTitle>
              <DialogDescription className="tbo-supporting">
                {disconnectStatus.status === 'pending' 
                  ? tr("Waiting for partner agreement")
                  : tr("Both partners have agreed")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Status Card */}
              <Card className={disconnectStatus.status === 'agreed' 
                ? 'border-error-500/50 bg-error-50' 
                : 'border-warning-500/30 bg-warning-50'
              }>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {disconnectStatus.status === 'pending' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <X className="w-5 h-5 text-warning-700" />
                          <span className="tbo-label text-warning-700">
                            {tr('Waiting for {name} to respond', { name: disconnectStatus.userRequested ? partnerDisplayName : tr('you') })}
                          </span>
                        </div>
                        <p className="tbo-supporting text-warning-700">
                          {disconnectStatus.userRequested 
                            ? tr('You requested to disconnect. {name} must also agree before the grace period begins.', { name: partnerDisplayName })
                            : tr('{name} has requested to disconnect. If you also agree, a 30-day grace period will begin.', { name: partnerDisplayName })
                          }
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-error-500" />
                          <span className="tbo-label text-error-700">

                            {tr("Both Partners Agreed")}
                          </span>
                        </div>
                        <p className="tbo-supporting text-error-700">

                          {tr("The 30-day grace period has begun. Either of you can cancel at any time during this period.")}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="tbo-card-title text-foreground">{tr("Timeline")}</h4>
                <div className="tbo-supporting space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{tr("Request initiated:")}</span>
                    <span className="font-medium">
                      {formatDate(disconnectStatus.requestedAt)}
                    </span>
                  </div>
                  {disconnectStatus.bothAgreedAt && (
                    <div className="flex justify-between">
                      <span>{tr("Both agreed:")}</span>
                      <span className="font-medium">
                        {formatDate(disconnectStatus.bothAgreedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{tr("Grace period ends:")}</span>
                    <span className="font-medium">
                      {formatDate(disconnectStatus.gracePeriodEnds)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">{tr("Time remaining:")}</span>
                    <span className="font-semibold text-error-500">
                      {getDaysRemainingText(disconnectStatus.daysRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="tbo-action w-full sm:w-auto"
              >

                {tr("Close")}
              </Button>
              {disconnectStatus.status === 'pending' && !disconnectStatus.userRequested && (
                <Button
                  variant="destructive"
                  onClick={handleRequestDisconnect}
                  disabled={isLoading}
                  className="tbo-action w-full sm:w-auto"
                >
                  {isLoading && <LoadingMark />}
                  {isLoading ? tr("Processing...") : tr("Agree to Disconnect")}
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleCancelDisconnect}
                disabled={isLoading}
                className="tbo-action w-full sm:w-auto bg-success-500 hover:bg-success-700"
              >
                {isLoading ? <LoadingMark className="mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
                {isLoading ? tr("Cancelling...") : tr("Cancel Disconnect")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
