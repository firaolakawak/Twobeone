import { useState } from 'react';
import { Shield, LayoutDashboard, BookOpen, MessageCircle, GraduationCap, Users, ChevronRight, TrendingUp, Home } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { AdminDashboard } from './admin/AdminDashboard';
import { DevotionalsManager } from './admin/DevotionalsManager';
import { QuestionsManager } from './admin/QuestionsManager';
import { ModulesManager } from './admin/ModulesManager';
import { GroupsManager } from './admin/GroupsManager';
import { UsersManager } from './admin/UsersManager';

interface AdminPanelProps {
  onSignOut: () => void;
  accessToken?: string;
  onBackToHome?: () => void;
}

export function AdminPanel({ onSignOut, accessToken, onBackToHome }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState('dashboard');

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devotionals', label: 'Daily Devotionals', icon: BookOpen },
    { id: 'questions', label: 'Q&A Questions', icon: MessageCircle },
    { id: 'modules', label: 'Learning Modules', icon: GraduationCap },
    { id: 'groups', label: 'Community Groups', icon: Users },
    { id: 'users', label: 'User Management', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl">TwoBeOne Admin Panel</h1>
                <p className="text-sm text-purple-100">Content Management System</p>
              </div>
            </div>
            <Button variant="secondary" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <Card className="p-4 sticky top-4">
              <h3 className="font-semibold mb-4 text-sm text-gray-600 uppercase tracking-wide">
                Navigation
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{section.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  );
                })}
                {onBackToHome && (
                  <button
                    onClick={onBackToHome}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5" />
                      <span className="font-medium text-sm">Home</span>
                    </div>
                  </button>
                )}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeSection === 'dashboard' && <AdminDashboard accessToken={accessToken} onNavigate={setActiveSection} />}
            {activeSection === 'devotionals' && <DevotionalsManager accessToken={accessToken} />}
            {activeSection === 'questions' && <QuestionsManager accessToken={accessToken} />}
            {activeSection === 'modules' && <ModulesManager accessToken={accessToken} />}
            {activeSection === 'groups' && <GroupsManager accessToken={accessToken} />}
            {activeSection === 'users' && <UsersManager accessToken={accessToken} />}
          </div>
        </div>
      </div>
    </div>
  );
}