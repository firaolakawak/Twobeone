import { useState } from 'react';
import { MobileAppBar, MobileTabBar, MobileFAB } from '../mobile-ui/MobileNavigation';
import { MobileButton } from '../mobile-ui/MobileButton';
import { MobileInput, MobileTextarea } from '../mobile-ui/MobileInput';
import { MobileCard, MobileCardHeader, MobileCardContent, MobileCardFooter } from '../mobile-ui/MobileCard';
import { MobileAlert, MobileBadge, MobileLoader, MobileSkeleton, MobileEmptyState } from '../mobile-ui/MobileFeedback';
import { MobileList, MobileListItem, MobileAvatar, MobileDivider } from '../mobile-ui/MobileList';
import { Home, Settings, User, Heart, Mail, Phone, MapPin, Calendar, Plus, Search, Bell, MessageCircle, Camera } from 'lucide-react';

/**
 * UIKitDemoScreen
 * 
 * Comprehensive demo showing all mobile UI components
 * Following all mobile guidelines:
 * - Safe areas (44px top, 34px bottom)
 * - Touch targets (min 48dp)
 * - Spacing system (4/8/16/24)
 * - Typography scale
 * - AA+ contrast
 */
export function UIKitDemoScreen() {
  const [activeTab, setActiveTab] = useState('buttons');
  const [showAlert, setShowAlert] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const tabs = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'cards', label: 'Cards' },
    { id: 'lists', label: 'Lists' },
    { id: 'feedback', label: 'Feedback' }
  ];
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Safe area top: 44px */}
      <div className="pt-11">
        {/* App Bar */}
        <MobileAppBar
          title="UI Kit Demo"
          onBack={() => console.log('Back')}
          rightAction={
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Settings className="w-6 h-6" />
            </button>
          }
        />
        
        {/* Tab Bar */}
        <MobileTabBar
          tabs={tabs}
          activeId={activeTab}
          onTabClick={setActiveTab}
        />
        
        {/* Main Content - 16dp horizontal padding, max 90% width */}
        <main className="px-4 py-6 pb-32 max-w-6xl mx-auto">
          
          {/* BUTTONS TAB */}
          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
                <div className="space-y-3">
                  <MobileButton fullWidth>Primary Button</MobileButton>
                  <MobileButton variant="secondary" fullWidth>Secondary Button</MobileButton>
                  <MobileButton variant="ghost" fullWidth>Ghost Button</MobileButton>
                  <MobileButton variant="text" fullWidth>Text Button</MobileButton>
                  <MobileButton variant="destructive" fullWidth>Destructive Button</MobileButton>
                </div>
              </section>
              
              <MobileDivider label="Sizes" />
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
                <div className="space-y-3">
                  <MobileButton size="sm" fullWidth>Small (40dp)</MobileButton>
                  <MobileButton size="md" fullWidth>Medium (48dp - Touch Target)</MobileButton>
                  <MobileButton size="lg" fullWidth>Large (56dp - Comfortable)</MobileButton>
                </div>
              </section>
              
              <MobileDivider label="States" />
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Button States</h2>
                <div className="space-y-3">
                  <MobileButton 
                    fullWidth 
                    icon={<Heart className="w-5 h-5" />}
                    iconPosition="left"
                  >
                    With Left Icon
                  </MobileButton>
                  
                  <MobileButton 
                    fullWidth 
                    icon={<Heart className="w-5 h-5" />}
                    iconPosition="right"
                  >
                    With Right Icon
                  </MobileButton>
                  
                  <MobileButton fullWidth disabled>Disabled Button</MobileButton>
                  
                  <MobileButton 
                    fullWidth 
                    loading={loading}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 2000);
                    }}
                  >
                    Loading Button
                  </MobileButton>
                </div>
              </section>
            </div>
          )}
          
          {/* INPUTS TAB */}
          {activeTab === 'inputs' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Input Fields</h2>
                <div className="space-y-4">
                  <MobileInput
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    icon={<Mail className="w-5 h-5" />}
                    required
                  />
                  
                  <MobileInput
                    label="Phone Number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    icon={<Phone className="w-5 h-5" />}
                    helperText="We'll never share your number"
                  />
                  
                  <MobileInput
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    error="Password must be at least 8 characters"
                  />
                  
                  <MobileInput
                    label="Search"
                    type="search"
                    placeholder="Search..."
                    icon={<Search className="w-5 h-5" />}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  
                  <MobileTextarea
                    label="Message"
                    placeholder="Type your message here..."
                    helperText="Maximum 500 characters"
                    rows={4}
                  />
                </div>
              </section>
            </div>
          )}
          
          {/* CARDS TAB */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <MobileCard>
                <MobileCardHeader
                  title="Default Card"
                  subtitle="With header and content"
                  icon={<Heart className="w-6 h-6" />}
                  action={
                    <button className="text-primary-600 text-sm font-medium">
                      Action
                    </button>
                  }
                />
                <MobileCardContent>
                  <p>This is a standard card with 16dp internal padding, 12dp border radius, and proper spacing. Cards never touch screen edges.</p>
                </MobileCardContent>
                <MobileCardFooter>
                  <div className="flex gap-2">
                    <MobileButton size="sm" fullWidth>Primary</MobileButton>
                    <MobileButton size="sm" variant="secondary" fullWidth>Secondary</MobileButton>
                  </div>
                </MobileCardFooter>
              </MobileCard>
              
              <MobileCard 
                variant="outlined"
                onClick={() => console.log('Card clicked')}
              >
                <MobileCardHeader
                  title="Clickable Card"
                  subtitle="Tap to interact"
                />
                <MobileCardContent>
                  This card is clickable and has touch feedback with scale animation.
                </MobileCardContent>
              </MobileCard>
              
              <MobileCard variant="filled" shadow="md">
                <MobileCardHeader
                  title="Filled Variant"
                  subtitle="With medium shadow"
                  icon={<Camera className="w-6 h-6" />}
                />
                <MobileCardContent>
                  <div className="aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-3 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-neutral-400" />
                  </div>
                  <p className="text-sm">Cards can contain images and media content.</p>
                </MobileCardContent>
              </MobileCard>
            </div>
          )}
          
          {/* LISTS TAB */}
          {activeTab === 'lists' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">List Items</h2>
                <MobileCard padding="none">
                  <MobileList>
                    <MobileListItem
                      title="One-line item"
                      icon={<Home className="w-6 h-6" />}
                      showChevron
                      onClick={() => console.log('Item clicked')}
                    />
                    
                    <MobileListItem
                      title="Two-line item"
                      subtitle="With subtitle text"
                      icon={<Mail className="w-6 h-6" />}
                      trailing={
                        <MobileBadge variant="error">3</MobileBadge>
                      }
                      onClick={() => console.log('Item clicked')}
                    />
                    
                    <MobileListItem
                      title="Three-line item"
                      subtitle="With subtitle"
                      description="And additional description text that can span multiple lines for detailed information"
                      icon={<MessageCircle className="w-6 h-6" />}
                      showChevron
                      onClick={() => console.log('Item clicked')}
                    />
                    
                    <MobileListItem
                      title="With Avatar"
                      subtitle="User profile item"
                      avatar={
                        <MobileAvatar
                          fallback="JD"
                          status="online"
                        />
                      }
                      trailing={
                        <span className="text-sm text-neutral-500">2m ago</span>
                      }
                    />
                  </MobileList>
                </MobileCard>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Avatars</h2>
                <div className="flex items-center gap-4">
                  <MobileAvatar size="sm" fallback="S" />
                  <MobileAvatar size="md" fallback="M" status="online" />
                  <MobileAvatar size="lg" fallback="L" status="away" />
                  <MobileAvatar size="xl" fallback="XL" status="offline" />
                </div>
              </section>
            </div>
          )}
          
          {/* FEEDBACK TAB */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Alerts</h2>
                <div className="space-y-4">
                  {showAlert && (
                    <MobileAlert
                      type="success"
                      title="Success"
                      message="Your changes have been saved successfully."
                      onClose={() => setShowAlert(false)}
                    />
                  )}
                  
                  <MobileAlert
                    type="error"
                    title="Error"
                    message="Something went wrong. Please try again."
                  />
                  
                  <MobileAlert
                    type="warning"
                    message="Your session will expire in 5 minutes."
                  />
                  
                  <MobileAlert
                    type="info"
                    message="New features are now available. Check them out!"
                  />
                </div>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  <MobileBadge>Default</MobileBadge>
                  <MobileBadge variant="success" dot>Active</MobileBadge>
                  <MobileBadge variant="error">Error</MobileBadge>
                  <MobileBadge variant="warning">Warning</MobileBadge>
                  <MobileBadge variant="info" size="lg">Info Large</MobileBadge>
                </div>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Loaders</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <MobileLoader size="sm" />
                    <MobileLoader size="md" />
                    <MobileLoader size="lg" />
                  </div>
                  
                  <MobileLoader text="Loading..." />
                </div>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Skeletons</h2>
                <MobileCard>
                  <div className="space-y-3">
                    <MobileSkeleton variant="text" width="60%" />
                    <MobileSkeleton variant="text" width="100%" />
                    <MobileSkeleton variant="text" width="80%" />
                    <div className="flex items-center gap-3 pt-3">
                      <MobileSkeleton variant="circular" width="40px" height="40px" />
                      <div className="flex-1 space-y-2">
                        <MobileSkeleton variant="text" width="40%" />
                        <MobileSkeleton variant="text" width="60%" />
                      </div>
                    </div>
                  </div>
                </MobileCard>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Empty State</h2>
                <MobileCard>
                  <MobileEmptyState
                    icon={<MessageCircle className="w-full h-full" />}
                    title="No messages yet"
                    description="Start a conversation by sending your first message"
                    action={
                      <MobileButton icon={<Plus className="w-5 h-5" />}>
                        New Message
                      </MobileButton>
                    }
                  />
                </MobileCard>
              </section>
            </div>
          )}
        </main>
        
        {/* Floating Action Button */}
        <MobileFAB
          icon={<Plus className="w-6 h-6" />}
          onClick={() => console.log('FAB clicked')}
          label="Add new item"
        />
      </div>
    </div>
  );
}
