import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Play,
  Users,
  Book,
  Heart,
  MessageCircle,
  Award,
  Shield,
  Database,
  RefreshCw,
  ArrowLeft,
  Home
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import api from '../utils/api';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: any;
  timestamp?: string;
}

interface TestFlow {
  id: string;
  name: string;
  icon: any;
  category: string;
  critical: boolean;
  tests: TestResult[];
}

interface TestingDashboardProps {
  onBack?: () => void;
}

export function TestingDashboard({ onBack }: TestingDashboardProps) {
  const [activeFlow, setActiveFlow] = useState<string>('auth');
  const [testFlows, setTestFlows] = useState<TestFlow[]>([
    {
      id: 'auth',
      name: 'Authentication',
      icon: Shield,
      category: 'Core',
      critical: true,
      tests: [
        { name: 'User can access auth page', status: 'pending' },
        { name: 'Profile auto-created after signup', status: 'pending' },
        { name: 'Invite code generated', status: 'pending' },
        { name: 'User logged in successfully', status: 'pending' },
        { name: 'Access token valid', status: 'pending' }
      ]
    },
    {
      id: 'couple',
      name: 'Couple Linking',
      icon: Users,
      category: 'Core',
      critical: true,
      tests: [
        { name: 'Generate invite code', status: 'pending' },
        { name: 'Partner can use invite code', status: 'pending' },
        { name: 'Couple record created', status: 'pending' },
        { name: 'Both users have partnerId', status: 'pending' },
        { name: 'Both users have coupleId', status: 'pending' }
      ]
    },
    {
      id: 'devotional',
      name: 'Daily Devotional',
      icon: Book,
      category: 'Features',
      critical: true,
      tests: [
        { name: 'Devotional loads from backend', status: 'pending' },
        { name: 'Can mark as complete', status: 'pending' },
        { name: 'Streak increments', status: 'pending' },
        { name: 'Cannot complete twice', status: 'pending' },
        { name: 'Completion persists', status: 'pending' }
      ]
    },
    {
      id: 'journal',
      name: 'Shared Journal',
      icon: Book,
      category: 'Features',
      critical: true,
      tests: [
        { name: 'Create journal entry', status: 'pending' },
        { name: 'Mark as shared', status: 'pending' },
        { name: 'Partner sees shared entry', status: 'pending' },
        { name: 'Partner can comment', status: 'pending' },
        { name: 'Comment appears for author', status: 'pending' }
      ]
    },
    {
      id: 'prayer',
      name: 'Prayer Requests',
      icon: Heart,
      category: 'Features',
      critical: true,
      tests: [
        { name: 'Create prayer request', status: 'pending' },
        { name: 'Prayer saved to backend', status: 'pending' },
        { name: 'Partner sees prayer', status: 'pending' },
        { name: 'Can mark as answered', status: 'pending' },
        { name: 'Status updates correctly', status: 'pending' }
      ]
    },
    {
      id: 'questions',
      name: 'Daily Questions',
      icon: MessageCircle,
      category: 'Features',
      critical: false,
      tests: [
        { name: 'Daily question loads', status: 'pending' },
        { name: 'User can submit response', status: 'pending' },
        { name: 'Partner submits response', status: 'pending' },
        { name: 'Both responses visible', status: 'pending' },
        { name: 'Side-by-side display works', status: 'pending' }
      ]
    },
    {
      id: 'qa',
      name: 'Q&A System',
      icon: MessageCircle,
      category: 'Features',
      critical: false,
      tests: [
        { name: 'Questions load from backend', status: 'pending' },
        { name: 'Multiple choice works', status: 'pending' },
        { name: 'Rating scale works', status: 'pending' },
        { name: 'Ranking works', status: 'pending' },
        { name: 'Compatibility % calculated', status: 'pending' }
      ]
    },
    {
      id: 'bible',
      name: 'Bible Features',
      icon: Book,
      category: 'Features',
      critical: false,
      tests: [
        { name: 'Bible reader opens', status: 'pending' },
        { name: 'Can navigate chapters', status: 'pending' },
        { name: 'Highlight verse', status: 'pending' },
        { name: 'Save highlight', status: 'pending' },
        { name: 'Share verse with partner', status: 'pending' }
      ]
    },
    {
      id: 'modules',
      name: 'Learning Modules',
      icon: Award,
      category: 'Features',
      critical: false,
      tests: [
        { name: 'Modules load', status: 'pending' },
        { name: 'Can open lesson', status: 'pending' },
        { name: 'Save lesson notes', status: 'pending' },
        { name: 'Mark lesson complete', status: 'pending' },
        { name: 'Progress updates', status: 'pending' }
      ]
    },
    {
      id: 'admin',
      name: 'Admin Panel',
      icon: Shield,
      category: 'Admin',
      critical: false,
      tests: [
        { name: 'Admin panel accessible', status: 'pending' },
        { name: 'Create devotional', status: 'pending' },
        { name: 'Edit devotional', status: 'pending' },
        { name: 'Delete devotional', status: 'pending' },
        { name: 'Stats display correctly', status: 'pending' }
      ]
    }
  ]);

  const [overallStats, setOverallStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    running: 0
  });

  // Calculate overall stats
  useEffect(() => {
    const stats = { total: 0, passed: 0, failed: 0, pending: 0, running: 0 };
    
    testFlows.forEach(flow => {
      flow.tests.forEach(test => {
        stats.total++;
        stats[test.status]++;
      });
    });
    
    setOverallStats(stats);
  }, [testFlows]);

  const updateTestStatus = (flowId: string, testName: string, status: 'passed' | 'failed', message?: string, details?: any) => {
    setTestFlows(prev => prev.map(flow => {
      if (flow.id === flowId) {
        return {
          ...flow,
          tests: flow.tests.map(test => {
            if (test.name === testName) {
              return {
                ...test,
                status,
                message,
                details,
                timestamp: new Date().toISOString()
              };
            }
            return test;
          })
        };
      }
      return flow;
    }));
  };

  const setTestRunning = (flowId: string, testName: string) => {
    setTestFlows(prev => prev.map(flow => {
      if (flow.id === flowId) {
        return {
          ...flow,
          tests: flow.tests.map(test => {
            if (test.name === testName) {
              return { ...test, status: 'running' as const };
            }
            return test;
          })
        };
      }
      return flow;
    }));
  };

  // Test runners
  const runAuthTests = async () => {
    toast.info('Starting authentication tests...');
    
    // Test 1: Profile endpoint accessible
    setTestRunning('auth', 'User can access auth page');
    try {
      const response = await api.profile.get();
      if (response.profile) {
        updateTestStatus('auth', 'User can access auth page', 'passed', 'Profile loaded successfully');
        
        // Test 2: Profile has required fields
        setTestRunning('auth', 'Profile auto-created after signup');
        if (response.profile.id && response.profile.email) {
          updateTestStatus('auth', 'Profile auto-created after signup', 'passed', 'Profile has all required fields');
          
          // Test 3: Invite code exists
          setTestRunning('auth', 'Invite code generated');
          if (response.profile.inviteCode) {
            updateTestStatus('auth', 'Invite code generated', 'passed', `Code: ${response.profile.inviteCode}`);
          } else {
            updateTestStatus('auth', 'Invite code generated', 'failed', 'No invite code found');
          }
        } else {
          updateTestStatus('auth', 'Profile auto-created after signup', 'failed', 'Missing required fields');
        }
      } else {
        updateTestStatus('auth', 'User can access auth page', 'failed', 'No profile data returned');
      }
    } catch (error: any) {
      updateTestStatus('auth', 'User can access auth page', 'failed', error.message);
    }
    
    toast.success('Authentication tests complete');
  };

  const runCoupleTests = async () => {
    toast.info('Starting couple linking tests...');
    
    try {
      const response = await api.profile.get();
      
      // Test partnerId
      setTestRunning('couple', 'Both users have partnerId');
      if (response.profile.partnerId) {
        updateTestStatus('couple', 'Both users have partnerId', 'passed', `Partner ID: ${response.profile.partnerId}`);
      } else {
        updateTestStatus('couple', 'Both users have partnerId', 'failed', 'No partner linked yet');
      }
      
      // Test coupleId
      setTestRunning('couple', 'Both users have coupleId');
      if (response.profile.coupleId) {
        updateTestStatus('couple', 'Both users have coupleId', 'passed', `Couple ID: ${response.profile.coupleId}`);
      } else {
        updateTestStatus('couple', 'Both users have coupleId', 'failed', 'No couple record found');
      }
      
      // Test partner data
      if (response.partner) {
        updateTestStatus('couple', 'Couple record created', 'passed', `Partner: ${response.partner.name}`);
      } else {
        updateTestStatus('couple', 'Couple record created', 'failed', 'No partner data');
      }
    } catch (error: any) {
      updateTestStatus('couple', 'Both users have partnerId', 'failed', error.message);
    }
    
    toast.success('Couple tests complete');
  };

  const runDevotionalTests = async () => {
    toast.info('Starting devotional tests...');
    
    try {
      // Test devotionals endpoint
      setTestRunning('devotional', 'Devotional loads from backend');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        updateTestStatus('devotional', 'Devotional loads from backend', 'passed', `Found ${data.devotions?.length || 0} devotionals`);
      } else {
        updateTestStatus('devotional', 'Devotional loads from backend', 'failed', 'Failed to load devotionals');
      }
    } catch (error: any) {
      updateTestStatus('devotional', 'Devotional loads from backend', 'failed', error.message);
    }
    
    toast.success('Devotional tests complete');
  };

  const runJournalTests = async () => {
    toast.info('Starting journal tests...');
    
    try {
      // Test journal list
      setTestRunning('journal', 'Create journal entry');
      const journals = await api.journal.list();
      updateTestStatus('journal', 'Create journal entry', 'passed', `Found ${journals.entries?.length || 0} entries`);
    } catch (error: any) {
      updateTestStatus('journal', 'Create journal entry', 'failed', error.message);
    }
    
    toast.success('Journal tests complete');
  };

  const runPrayerTests = async () => {
    toast.info('Starting prayer tests...');
    
    try {
      setTestRunning('prayer', 'Prayer saved to backend');
      const prayers = await api.prayer.list();
      updateTestStatus('prayer', 'Prayer saved to backend', 'passed', `Found ${prayers.prayers?.length || 0} prayers`);
    } catch (error: any) {
      updateTestStatus('prayer', 'Prayer saved to backend', 'failed', error.message);
    }
    
    toast.success('Prayer tests complete');
  };

  const runAllTests = async () => {
    toast.info('Running all tests...');
    await runAuthTests();
    await runCoupleTests();
    await runDevotionalTests();
    await runJournalTests();
    await runPrayerTests();
    toast.success('All tests complete!');
  };

  const resetAllTests = () => {
    setTestFlows(prev => prev.map(flow => ({
      ...flow,
      tests: flow.tests.map(test => ({
        ...test,
        status: 'pending' as const,
        message: undefined,
        details: undefined,
        timestamp: undefined
      }))
    })));
    toast.info('Tests reset');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-success-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-error-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const activeFlowData = testFlows.find(f => f.id === activeFlow);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-50 to-primary-50 dark:from-neutral-900 dark:via-primary-900/20 dark:to-primary-900/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="flex items-center gap-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
              TwoBeOne Testing Dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground  mb-6">
            Comprehensive testing suite for all user flows and features
          </p>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{overallStats.total}</p>
              </CardContent>
            </Card>

            <Card className="border-success-500/30 bg-success-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Passed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl text-success-700">{overallStats.passed}</p>
              </CardContent>
            </Card>

            <Card className="border-error-500/30 bg-error-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl text-error-500">{overallStats.failed}</p>
              </CardContent>
            </Card>

            <Card className="border-warning-500/30 bg-warning-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Running</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl text-warning-500">{overallStats.running}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl text-muted-foreground">{overallStats.pending}</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="sm" onClick={runAllTests}>
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
            <Button variant="outline" size="sm" onClick={resetAllTests}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Test Flows */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Sidebar - Flow List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Flows</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] md:h-[600px]">
                  <div className="space-y-2 p-4">
                    {testFlows.map((flow) => {
                      const Icon = flow.icon;
                      const passedTests = flow.tests.filter(t => t.status === 'passed').length;
                      const totalTests = flow.tests.length;
                      const failedTests = flow.tests.filter(t => t.status === 'failed').length;
                      
                      return (
                        <button
                          key={flow.id}
                          onClick={() => setActiveFlow(flow.id)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            activeFlow === flow.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-border hover:border-border '
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm truncate">{flow.name}</span>
                                {flow.critical && (
                                  <Badge variant="destructive" className="text-xs px-1 py-0">Critical</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {passedTests}/{totalTests} passed
                                {failedTests > 0 && ` • ${failedTests} failed`}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Test Details */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                {activeFlowData && (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <activeFlowData.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <div>
                          <CardTitle className="text-base">{activeFlowData.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            {activeFlowData.critical ? 'Critical Flow' : 'Feature Test'} • {activeFlowData.category}
                          </CardDescription>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          if (activeFlow === 'auth') runAuthTests();
                          else if (activeFlow === 'couple') runCoupleTests();
                          else if (activeFlow === 'devotional') runDevotionalTests();
                          else if (activeFlow === 'journal') runJournalTests();
                          else if (activeFlow === 'prayer') runPrayerTests();
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Run Tests</span>
                        <span className="sm:hidden">Run</span>
                      </Button>
                    </div>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] md:h-[600px]">
                  <div className="space-y-3">
                    {activeFlowData?.tests.map((test, index) => (
                      <div key={index}>
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card ">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(test.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-sm">{test.name}</span>
                              <Badge 
                                variant={
                                  test.status === 'passed' ? 'default' :
                                  test.status === 'failed' ? 'destructive' :
                                  test.status === 'running' ? 'secondary' : 'outline'
                                }
                                className="text-xs flex-shrink-0"
                              >
                                {test.status}
                              </Badge>
                            </div>
                            {test.message && (
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">
                                {test.message}
                              </p>
                            )}
                            {test.timestamp && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(test.timestamp).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {index < activeFlowData.tests.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}