import { MobileAppBar, MobileBottomNav } from '../mobile-ui/MobileNavigation';
import { MobileCard, MobileCardHeader, MobileCardContent } from '../mobile-ui/MobileCard';
import { MobileButton } from '../mobile-ui/MobileButton';
import { MobileBadge } from '../mobile-ui/MobileFeedback';
import { MobileAvatar } from '../mobile-ui/MobileList';
import { Home, Heart, BookOpen, MessageCircle, User, TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { useState } from 'react';

/**
 * MobileDashboardScreen
 * 
 * Complete dashboard template with:
 * - App bar with user info
 * - Hero/summary section
 * - Stats cards
 * - Quick action buttons
 * - Content sections with proper spacing
 * - Bottom navigation
 */
export function MobileDashboardScreen() {
  const [activeTab, setActiveTab] = useState('home');
  
  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} /> },
    { id: 'devotions', label: 'Devotions', icon: <BookOpen className="w-6 h-6" strokeWidth={activeTab === 'devotions' ? 2.5 : 2} />, badge: 3 },
    { id: 'prayer', label: 'Prayer', icon: <Heart className="w-6 h-6" strokeWidth={activeTab === 'prayer' ? 2.5 : 2} /> },
    { id: 'community', label: 'Community', icon: <MessageCircle className="w-6 h-6" strokeWidth={activeTab === 'community' ? 2.5 : 2} />, badge: 5 },
    { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" strokeWidth={activeTab === 'profile' ? 2.5 : 2} /> }
  ];
  
  const stats = [
    { label: 'Day Streak', value: '12', icon: <TrendingUp className="w-5 h-5" />, color: 'text-success-700-600' },
    { label: 'Devotions', value: '45', icon: <BookOpen className="w-5 h-5" />, color: 'text-sky-600-600' },
    { label: 'Prayers', value: '28', icon: <Heart className="w-5 h-5" />, color: 'text-primary-600' }
  ];
  
  const quickActions = [
    { id: 'daily-verse', label: 'Daily Verse', icon: <BookOpen className="w-6 h-6" />, color: 'bg-secondary-500' },
    { id: 'pray', label: 'Pray Together', icon: <Heart className="w-6 h-6" />, color: 'bg-primary-500' },
    { id: 'journal', label: 'Journal', icon: <Calendar className="w-6 h-6" />, color: 'bg-primary-500' },
    { id: 'goals', label: 'Goals', icon: <Target className="w-6 h-6" />, color: 'bg-warning-500' }
  ];
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Safe area top: 44px */}
      <div className="pt-11">
        
        {/* App Bar */}
        <MobileAppBar
          title="Dashboard"
          leftAction={
            <MobileAvatar
              fallback="JD"
              status="online"
              size="md"
            />
          }
          rightAction={
            <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <MessageCircle className="w-6 h-6" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full border-2 border-white dark:border-neutral-950" />
            </button>
          }
        />
        
        {/* Main Content - 16dp padding, 8dp vertical rhythm */}
        <main className="px-4 py-6 pb-32 max-w-6xl mx-auto">
          
          {/* Hero Section - Couple Card */}
          <MobileCard 
            className="mb-6 bg-gradient-to-br from-primary-500 to-primary-600 border-0 text-white"
            shadow="lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MobileAvatar fallback="JD" size="lg" />
                <div className="text-white">
                  <Heart className="w-5 h-5" fill="currentColor" />
                </div>
                <MobileAvatar fallback="SP" size="lg" />
              </div>
              
              <MobileBadge variant="success" className="bg-white/20 text-white border-0">
                <span className="text-white">Active</span>
              </MobileBadge>
            </div>
            
            <h2 className="text-xl font-semibold mb-1">John & Sarah</h2>
            <p className="text-primary-100 text-sm mb-4">Together for 2 years, 3 months</p>
            
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-200" />
              <span className="text-sm text-primary-100">12 Day Streak - Keep it up! 🔥</span>
            </div>
          </MobileCard>
          
          {/* Stats Grid - 8dp spacing */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {stats.map((stat, index) => (
              <MobileCard key={index} padding="sm" className="text-center">
                <div className={`${stat.color} mb-2 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </div>
              </MobileCard>
            ))}
          </div>
          
          {/* Quick Actions - 12dp spacing */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                    {action.icon}
                  </div>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 text-center">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
          
          {/* Today's Devotion - 16dp spacing */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Today's Devotion
              </h3>
              <button className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                View All
              </button>
            </div>
            
            <MobileCard shadow="md">
              <MobileCardHeader
                title="Love is Patient"
                subtitle="1 Corinthians 13:4-7"
                icon={<BookOpen className="w-6 h-6 text-sky-600-600" />}
                action={<MobileBadge variant="info" size="sm">New</MobileBadge>}
              />
              <MobileCardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-4">
                  Love is patient, love is kind. It does not envy, it does not boast, it is not proud. 
                  It does not dishonor others, it is not self-seeking...
                </p>
                <MobileButton size="sm" fullWidth>
                  Read More
                </MobileButton>
              </MobileCardContent>
            </MobileCard>
          </section>
          
          {/* Recent Activity */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              Recent Activity
            </h3>
            
            <div className="space-y-3">
              <MobileCard padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-success-700-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      New prayer request from Sarah
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      2 hours ago
                    </p>
                  </div>
                </div>
              </MobileCard>
              
              <MobileCard padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-sky-600-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      John completed today's devotion
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      5 hours ago
                    </p>
                  </div>
                </div>
              </MobileCard>
            </div>
          </section>
          
          {/* Weekly Challenge */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              Weekly Challenge
            </h3>
            
            <MobileCard className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 border-warning-200 dark:border-warning-800">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-warning-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    Pray Together 5 Times
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Complete 3 more prayer sessions this week
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-warning-200 dark:bg-warning-900/40 rounded-full h-2 mb-2">
                    <div className="bg-warning-500 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                  
                  <p className="text-xs text-warning-700-700 dark:text-warning-700-400 font-medium">
                    2 of 5 completed
                  </p>
                </div>
              </div>
            </MobileCard>
          </section>
          
        </main>
        
        {/* Bottom Navigation */}
        <MobileBottomNav
          items={navItems}
          activeId={activeTab}
          onItemClick={setActiveTab}
        />
      </div>
    </div>
  );
}
