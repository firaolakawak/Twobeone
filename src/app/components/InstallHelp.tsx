import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Share2, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { isIOS, isAndroid, getDeviceType } from '../utils/pwa';

interface InstallHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallHelp({ open, onOpenChange }: InstallHelpProps) {
  const deviceType = getDeviceType();
  const defaultTab = deviceType === 'ios' ? 'ios' : deviceType === 'android' ? 'android' : 'desktop';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-600" />
            How to Install TwoBeOne
          </DialogTitle>
          <DialogDescription>
            Get the full app experience by installing TwoBeOne on your device
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="ios" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">iOS</span>
            </TabsTrigger>
            <TabsTrigger value="android" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Android</span>
            </TabsTrigger>
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Desktop</span>
            </TabsTrigger>
          </TabsList>

          {/* iOS Instructions */}
          <TabsContent value="ios" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-900/20 border-sky-200 dark:border-sky-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground ">
                    <strong>Important:</strong> You must use Safari browser on iOS. 
                    Other browsers cannot install web apps.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground dark:text-white mb-2">
                    Open Safari
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Navigate to TwoBeOne in Safari browser (not Chrome or other browsers)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground dark:text-white mb-2 flex items-center gap-2">
                    Tap the Share Button
                    <Share2 className="w-4 h-4 text-sky-500" />
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                    Look for the Share button at the bottom of Safari (square with arrow pointing up)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground dark:text-white mb-2">
                    Add to Home Screen
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Scroll down in the Share menu and tap "Add to Home Screen"
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground dark:text-white mb-2">
                    Confirm & Install
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Tap "Add" in the top right corner. The app icon will appear on your home screen!
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-r from-success-50 to-success-50 dark:from-success-700/20 dark:to-success-700/20 border-success-500/30 dark:border-success-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-700 mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground ">
                    <p className="font-semibold mb-1">You'll know it worked when:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>TwoBeOne icon appears on home screen</li>
                      <li>App opens full-screen (no Safari bars)</li>
                      <li>Purple theme in status bar</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Android Instructions */}
          <TabsContent value="android" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-success-50 to-success-50 dark:from-success-700/20 dark:to-success-700/20 border-success-500/30 dark:border-success-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-700 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground ">
                    <strong>Good news!</strong> Android makes it easy to install web apps. 
                    Use Chrome or Samsung Internet for best results.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground dark:text-white">
                Method 1: Automatic Install Prompt (Recommended)
              </h4>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Open TwoBeOne in Chrome or Samsung Internet
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Wait a few seconds - an install banner will appear at the top or bottom
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Tap "Install" or "Add to Home Screen" and confirm. Done! 🎉
                  </p>
                </div>
              </div>

              <div className="border-t border-border  my-4" />

              <h4 className="font-semibold text-foreground dark:text-white">
                Method 2: Browser Menu
              </h4>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <MoreVertical className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Tap the three dots (⋮) in the top right → Select "Install app" or "Add to Home Screen"
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 border-primary-200 dark:border-primary-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground ">
                    <p className="font-semibold mb-1">You'll know it worked when:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>TwoBeOne appears in your app drawer</li>
                      <li>Opens like a regular app</li>
                      <li>Can receive notifications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Desktop Instructions */}
          <TabsContent value="desktop" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-900/20 border-sky-200 dark:border-sky-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground ">
                    Install TwoBeOne on your computer for a dedicated app window. 
                    Works with Chrome, Edge, and Opera.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground dark:text-white">
                Method 1: Address Bar Icon (Easiest)
              </h4>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Look for the install icon (⊕ or 🖥️) in the address bar (right side)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Click the icon and then click "Install" in the popup
                  </p>
                </div>
              </div>

              <div className="border-t border-border  my-4" />

              <h4 className="font-semibold text-foreground dark:text-white">
                Method 2: Browser Menu
              </h4>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <MoreVertical className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Click the three dots (⋮) in the top right → Click "Install TwoBeOne..." → Confirm
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-r from-success-50 to-success-50 dark:from-success-700/20 dark:to-success-700/20 border-success-500/30 dark:border-success-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-700 mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground ">
                    <p className="font-semibold mb-1">Benefits of desktop installation:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Own app window (not a browser tab)</li>
                      <li>Pin to taskbar or dock</li>
                      <li>Launch from Start Menu/Applications</li>
                      <li>Faster loading than browser</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800 mt-4">
          <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
          <div className="text-sm text-foreground ">
            <p className="font-semibold mb-1">Still having trouble?</p>
            <p>Go to Settings → App → PWA Status to check your installation status and get help.</p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>
            Got It!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
