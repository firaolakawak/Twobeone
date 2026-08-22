import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, RefreshCw, Users, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

const supabase = createClient();

export function DebugResponses() {
  const [responses, setResponses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [couples, setCouples] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;

      // Get all responses
      const responsesRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/debug/all-responses`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (responsesRes.ok) {
        const { responses: allResponses } = await responsesRes.json();
        setResponses(allResponses || []);
      }

      // Get all users
      const usersRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/debug/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (usersRes.ok) {
        const { users: allUsers } = await usersRes.json();
        setUsers(allUsers || []);
      }

      // Get all couples
      const couplesRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/debug/couples`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (couplesRes.ok) {
        const { couples: allCouples } = await couplesRes.json();
        setCouples(allCouples || []);
      }

    } catch (error) {
      console.error('Failed to load debug data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllResponses = async () => {
    try {
      setIsDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/debug/clear-responses`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`✅ Deleted ${result.deletedCount} responses`);
        await loadData(); // Reload data
      } else {
        throw new Error('Failed to clear responses');
      }
    } catch (error) {
      console.error('Failed to clear responses:', error);
      toast.error('Failed to clear responses');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFixCouples = async () => {
    try {
      setIsDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/debug/fix-couples`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`✅ Fixed ${result.usersFixed} users${result.couplesCreated ? `, created ${result.couplesCreated} couples` : ''}`);
        await loadData(); // Reload data
      } else {
        throw new Error('Failed to fix couples');
      }
    } catch (error) {
      console.error('Failed to fix couples:', error);
      toast.error('Failed to fix couples');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Q&A Responses Debug</h2>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Users & Couples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users & Couples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Users ({users.length})</h3>
            <div className="space-y-2">
              {users.map((user) => {
                const needsFix = user.partnerId && !user.coupleId;
                return (
                  <div 
                    key={user.id} 
                    className={`p-3 rounded-lg text-sm ${needsFix ? 'bg-error-50 border-2 border-error-500/50' : 'bg-muted'}`}
                  >
                    <div><strong>ID:</strong> {user.id}</div>
                    <div><strong>Name:</strong> {user.name}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Partner ID:</strong> {user.partnerId || 'None'}</div>
                    <div className={needsFix ? 'text-error-500 font-bold' : ''}>
                      <strong>Couple ID:</strong> {user.coupleId || '❌ NOT SET'}
                    </div>
                    {needsFix && (
                      <div className="text-error-500 text-xs mt-2 font-semibold">
                        ⚠️ Has partner but no coupleId! Click "Fix Couple Links" below!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Couples ({couples.length})</h3>
            <div className="space-y-2">
              {couples.map((couple) => (
                <div key={couple.id} className="bg-sky-50 p-3 rounded-lg text-sm">
                  <div><strong>Couple ID:</strong> {couple.id}</div>
                  <div><strong>Partner 1:</strong> {couple.partner1Id}</div>
                  <div><strong>Partner 2:</strong> {couple.partner2Id}</div>
                  <div><strong>Invite Code:</strong> {couple.inviteCode}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fix Couples Button */}
          <Button 
            onClick={handleFixCouples}
            variant="outline" 
            className="w-full"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fixing...</>
            ) : (
              <>🔧 Fix Couple Links (Add coupleId to Users)</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Question Responses ({responses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-muted-foreground">No responses found in database</p>
          ) : (
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Storage Key:</strong> {response.id}</div>
                    <div><strong>User ID:</strong> {response.userId}</div>
                    <div><strong>Question ID:</strong> {response.questionId}</div>
                    <div><strong>Couple ID:</strong> {response.coupleId || 'Not linked'}</div>
                    <div className="col-span-2">
                      <strong>Answers:</strong>
                      <pre className="mt-2 bg-card p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(response.answers, null, 2)}
                      </pre>
                    </div>
                    <div><strong>Created:</strong> {new Date(response.createdAt).toLocaleString()}</div>
                    <div><strong>Updated:</strong> {new Date(response.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear All Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Clear All Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Clearing...' : 'Clear All Responses'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all {responses.length} question responses from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllResponses} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Clear All'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}