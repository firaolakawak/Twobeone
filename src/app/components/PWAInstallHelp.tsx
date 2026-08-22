import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { HelpCircle, Share, Plus, Smartphone, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function PWAInstallHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-8">
          <HelpCircle className="w-16 h-16" />
          Install as App
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-8">
            <Smartphone className="w-20 h-20" style={{ color: 'var(--primary-600)' }} />
            Install TwoBeOne as an App
          </DialogTitle>
          <DialogDescription className="sr-only">
            Step-by-step instructions for installing TwoBeOne as a home screen app on iOS and Android.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ios" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ios">iOS / Safari</TabsTrigger>
            <TabsTrigger value="android">Android / Chrome</TabsTrigger>
          </TabsList>

          <TabsContent value="ios" className="space-y-16 mt-16">
            <div className="rounded-lg p-16" style={{ background: 'var(--secondary-50)', border: '1px solid var(--secondary-200)' }}>
              <p className="text-sm" style={{ color: 'var(--secondary-900)' }}>
                <strong>Important:</strong> This only works in Safari browser on iOS devices
              </p>
            </div>

            <div className="space-y-12">
              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)' }}>
                  <span style={{ color: 'var(--primary-600)' }}>1</span>
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Tap the Share button
                  </h4>
                  <div className="flex items-center gap-8 text-sm text-muted-foreground">
                    <Share className="w-20 h-20" style={{ color: 'var(--secondary-500)' }} />
                    <span>Found at the bottom (iPhone) or top (iPad) of Safari</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)' }}>
                  <span style={{ color: 'var(--primary-600)' }}>2</span>
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Scroll down in the menu
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Look for "Add to Home Screen" option
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)' }}>
                  <span style={{ color: 'var(--primary-600)' }}>3</span>
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Tap "Add to Home Screen"
                  </h4>
                  <div className="flex items-center gap-8 text-sm text-muted-foreground">
                    <Plus className="w-20 h-20" />
                    <span>Then tap "Add" in the top right</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--success-50)' }}>
                  <CheckCircle2 className="w-20 h-20" style={{ color: 'var(--success-700)' }} />
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Done!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    TwoBeOne will appear on your home screen like a native app
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-16" style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-500)' }}>
              <h4 className="mb-8" style={{ color: 'var(--warning-700)' }}>Troubleshooting</h4>
              <ul className="space-y-4 text-sm" style={{ color: 'var(--warning-700)' }}>
                <li>• Make sure you're using Safari (not Chrome or other browsers)</li>
                <li>• If already installed, delete it from home screen first</li>
                <li>• Try clearing Safari cache in Settings → Safari</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="android" className="space-y-16 mt-16">
            <div className="rounded-lg p-16" style={{ background: 'var(--success-50)', border: '1px solid var(--success-500)' }}>
              <p className="text-sm" style={{ color: 'var(--success-700)' }}>
                <strong>Note:</strong> Works in Chrome, Edge, Firefox, and other browsers on Android
              </p>
            </div>

            <div className="space-y-12">
              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)' }}>
                  <span style={{ color: 'var(--primary-600)' }}>1</span>
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Tap the menu button
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Usually three dots (⋮) in the top right corner
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)' }}>
                  <span style={{ color: 'var(--primary-600)' }}>2</span>
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Look for "Install app" or "Add to Home screen"
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Chrome may show an install banner automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)' }}>
                  <span style={{ color: 'var(--primary-600)' }}>3</span>
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Tap "Install"
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Confirm the installation when prompted
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-12">
                <div className="flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--success-50)' }}>
                  <CheckCircle2 className="w-20 h-20" style={{ color: 'var(--success-700)' }} />
                </div>
                <div className="flex-1 pt-4">
                  <h4 className="text-foreground mb-4">
                    Done!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    TwoBeOne will appear in your app drawer and home screen
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg p-16 mt-16" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
          <h4 className="mb-8" style={{ color: 'var(--primary-900)' }}>✨ Benefits of Installing</h4>
          <ul className="space-y-4 text-sm" style={{ color: 'var(--primary-800)' }}>
            <li>• Launch directly from your home screen</li>
            <li>• Full-screen experience without browser UI</li>
            <li>• Faster loading with offline support</li>
            <li>• Receive notifications for devotionals and prayers</li>
            <li>• Works like a native app</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
