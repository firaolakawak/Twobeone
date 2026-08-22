import { useState } from 'react';
import { UIKitDemoScreen } from './screens/UIKitDemoScreen';
import { MobileLoginScreen } from './screens/MobileLoginScreen';
import { MobileDashboardScreen } from './screens/MobileDashboardScreen';
import { MobileButton } from './mobile-ui/MobileButton';
import { MobileCard } from './mobile-ui/MobileCard';
import { Layout, LogIn, LayoutDashboard, Palette, Sun, Moon } from 'lucide-react';

/**
 * MobileUIKitDemo
 * 
 * Demo launcher showing all mobile UI screens and components
 */
export function MobileUIKitDemo() {
  const [activeScreen, setActiveScreen] = useState<'menu' | 'uikit' | 'login' | 'dashboard'>('menu');
  const [darkMode, setDarkMode] = useState(false);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  const screens = [
    {
      id: 'uikit',
      title: 'UI Kit Components',
      description: 'Complete library of buttons, inputs, cards, lists, and feedback components',
      icon: <Palette className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'login',
      title: 'Login / Signup',
      description: 'Authentication screen with form validation and safe areas',
      icon: <LogIn className="w-8 h-8" />,
      color: 'from-rose-500 to-rose-600'
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Complete dashboard with stats, quick actions, and navigation',
      icon: <LayoutDashboard className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600'
    }
  ];
  
  // Show menu
  if (activeScreen === 'menu') {
    return (
      <div className={`min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors ${darkMode ? 'dark' : ''}`}>
        <div className="pt-11 pb-8">
          {/* Header */}
          <div className="px-4 mb-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                    Mobile UI Kit
                  </h1>
                  <p className="text-base text-neutral-600 dark:text-neutral-400">
                    Complete design system & screen templates
                  </p>
                </div>
                
                <button
                  onClick={toggleDarkMode}
                  className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <Moon className="w-6 h-6 text-neutral-700" />
                  )}
                </button>
              </div>
              
              {/* Design System Info */}
              <MobileCard className="mb-6 bg-gradient-to-br from-rose-500 to-rose-600 border-0">
                <div className="text-white">
                  <h2 className="text-xl font-semibold mb-2">Design System Features</h2>
                  <ul className="space-y-2 text-sm text-rose-50">
                    <li>✓ Complete color palette (Primary, Secondary, Neutral, Status)</li>
                    <li>✓ iOS & Android typography scales</li>
                    <li>✓ 8dp spacing system (4/8/16/24)</li>
                    <li>✓ Safe areas (44px top, 34px bottom)</li>
                    <li>✓ 48dp minimum touch targets</li>
                    <li>✓ WCAG AA+ contrast compliance</li>
                    <li>✓ Dark mode support</li>
                    <li>✓ Full responsive system</li>
                  </ul>
                </div>
              </MobileCard>
            </div>
          </div>
          
          {/* Screen Cards */}
          <div className="px-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {screens.map((screen) => (
                <MobileCard
                  key={screen.id}
                  onClick={() => setActiveScreen(screen.id as any)}
                  shadow="md"
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${screen.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {screen.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                        {screen.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {screen.description}
                      </p>
                    </div>
                    
                    <Layout className="w-6 h-6 text-neutral-400 flex-shrink-0" />
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
          
          {/* Component List */}
          <div className="px-4 mt-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                Available Components
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Buttons', 'Inputs', 'Cards', 'Lists',
                  'Navigation', 'Alerts', 'Badges', 'Loaders',
                  'Skeletons', 'Avatars', 'Empty States', 'Forms'
                ].map((component) => (
                  <MobileCard key={component} padding="sm" variant="outlined">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center">
                      {component}
                    </p>
                  </MobileCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show selected screen
  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Back button overlay */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setActiveScreen('menu')}
          className="px-4 h-10 bg-white dark:bg-neutral-900 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-neutral-900 dark:text-white hover:scale-105 transition-transform"
        >
          ← Back to Menu
        </button>
      </div>
      
      {/* Screen content */}
      {activeScreen === 'uikit' && <UIKitDemoScreen />}
      {activeScreen === 'login' && <MobileLoginScreen />}
      {activeScreen === 'dashboard' && <MobileDashboardScreen />}
    </div>
  );
}
