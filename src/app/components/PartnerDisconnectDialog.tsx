import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AlertTriangle, Heart, HeartCrack, Clock, X, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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
  const { t } = useLanguage();
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
        toast.info('Your partnership has been disconnected');
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
      toast.success(result.message);
      await checkDisconnectStatus();
    } catch (error: any) {
      console.error('Error requesting disconnect:', error);
      if (error.message?.includes('already requested')) {
        toast.error('You have already requested to disconnect');
        await checkDisconnectStatus();
      } else {
        toast.error(error.message || 'Failed to request disconnect');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDisconnect = async () => {
    setIsLoading(true);
    try {
      const result = await api.partner.cancelDisconnect();
      toast.success(result.message);
      await checkDisconnectStatus();
      setView('initial');
    } catch (error: any) {
      console.error('Error cancelling disconnect:', error);
      toast.error(error.message || 'Failed to cancel disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemainingText = (days: number) => {
    if (days <= 0) return 'Grace period ended';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Initial View - Warning */}
        {view === 'initial' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-error-500">
                <AlertTriangle className="w-5 h-5" />
                Disconnect from Partner
              </DialogTitle>
              <DialogDescription>
                This is a serious step that requires careful consideration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="border-warning-500/30 bg-warning-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-warning-700">
                      Important Information
                    </h3>
                    <ul className="text-sm text-warning-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>Both partners must agree</strong> - One person cannot disconnect alone</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>30-day grace period</strong> - After both agree, you have 30 days to cancel</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>Email notifications</strong> - Both partners will receive email updates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        <span><strong>Your data remains private</strong> - Individual data is not shared after disconnect</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                If you're experiencing difficulties, consider talking with your partner or seeking 
                guidance from a trusted counselor before taking this step.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setView('confirm')}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Confirmation View */}
        {view === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-error-500">
                <HeartCrack className="w-5 h-5" />
                Confirm Disconnect Request
              </DialogTitle>
              <DialogDescription>
                This will notify {partner?.name} of your request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-foreground">
                By clicking "Request Disconnect", you are requesting to end your partnership with{' '}
                <strong>{partner?.name}</strong>.
              </p>

              <Card className="border-error-500/30 bg-error-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-error-700">
                    <strong>What happens next:</strong>
                  </p>
                  <ol className="text-sm text-error-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>{partner?.name} will receive a notification and email</li>
                    <li>If {partner?.name} also agrees, a 30-day grace period begins</li>
                    <li>Either of you can cancel during those 30 days</li>
                    <li>After 30 days, the disconnection becomes permanent</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setView('initial')}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleRequestDisconnect}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Sending Request...' : 'Request Disconnect'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Status View - Active Request */}
        {view === 'status' && disconnectStatus?.hasRequest && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning-700" />
                Disconnect Request Active
              </DialogTitle>
              <DialogDescription>
                {disconnectStatus.status === 'pending' 
                  ? 'Waiting for partner agreement'
                  : 'Both partners have agreed'}
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
                          <span className="font-semibold text-sm text-warning-700">
                            Waiting for {disconnectStatus.userRequested ? partner?.name : 'you'} to respond
                          </span>
                        </div>
                        <p className="text-sm text-warning-700">
                          {disconnectStatus.userRequested 
                            ? `You requested to disconnect. ${partner?.name} must also agree before the grace period begins.`
                            : `${partner?.name} has requested to disconnect. If you also agree, a 30-day grace period will begin.`
                          }
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-error-500" />
                          <span className="font-semibold text-sm text-error-700">
                            Both Partners Agreed
                          </span>
                        </div>
                        <p className="text-sm text-error-700">
                          The 30-day grace period has begun. Either of you can cancel at any time 
                          during this period.
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Timeline</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Request initiated:</span>
                    <span className="font-medium">
                      {new Date(disconnectStatus.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {disconnectStatus.bothAgreedAt && (
                    <div className="flex justify-between">
                      <span>Both agreed:</span>
                      <span className="font-medium">
                        {new Date(disconnectStatus.bothAgreedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Grace period ends:</span>
                    <span className="font-medium">
                      {new Date(disconnectStatus.gracePeriodEnds).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Time remaining:</span>
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
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              {disconnectStatus.status === 'pending' && !disconnectStatus.userRequested && (
                <Button
                  variant="destructive"
                  onClick={handleRequestDisconnect}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Processing...' : 'Agree to Disconnect'}
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleCancelDisconnect}
                disabled={isLoading}
                className="w-full sm:w-auto bg-success-500 hover:bg-success-700"
              >
                <Heart className="w-4 h-4 mr-2" />
                {isLoading ? 'Cancelling...' : 'Cancel Disconnect'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
