import { useState, useEffect } from 'react';
import { Search, Users, Heart, TrendingUp, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  partnerId: string | null;
  partnerName: string | null;
  joinedDate: string;
  lastActive: string;
  completedDays: number;
  journalEntries: number;
  prayerRequests: number;
  status: 'active' | 'inactive';
}

interface UsersManagerProps {
  accessToken?: string;
}

export function UsersManager({ accessToken }: UsersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { users: apiUsers } = await response.json();
        
        // Transform API data to match User interface
        const transformedUsers = apiUsers.map((u: any) => ({
          id: u.id,
          name: u.name || 'Unknown User',
          email: u.email,
          partnerId: u.partnerId || null,
          partnerName: u.partnerName || null,
          joinedDate: u.createdAt || u.relationshipStart || new Date().toISOString(),
          lastActive: u.createdAt || new Date().toISOString(),
          completedDays: 0, // Will be enhanced later with real completion data
          journalEntries: 0, // Will be enhanced later
          prayerRequests: 0, // Will be enhanced later
          status: 'active' as const
        }));

        setUsers(transformedUsers);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Group users into couples
  const couples = users.reduce((acc, user) => {
    if (user.partnerId) {
      const coupleId = [user.id, user.partnerId].sort().join('-');
      if (!acc.find(c => c.id === coupleId)) {
        const partner = users.find(u => u.id === user.partnerId);
        if (partner) {
          acc.push({
            id: coupleId,
            user1: user,
            user2: partner,
          });
        }
      }
    }
    return acc;
  }, [] as Array<{ id: string; user1: User; user2: User }>);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCouples = couples.filter(c =>
    c.user1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user1.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user2.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    activeCouples: couples.length,
    activeToday: users.filter(u => {
      const lastActive = new Date(u.lastActive);
      const today = new Date();
      return lastActive.toDateString() === today.toDateString();
    }).length,
    avgCompletion: Math.round(users.reduce((acc, u) => acc + u.completedDays, 0) / users.length),
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      const result = await response.json();
      toast.success(result.message || 'User deleted successfully');
      
      // Reload users
      await loadUsers();
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl mb-2">User Management</h2>
        <p className="text-gray-600">View and manage registered users and couples</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
          <p className="text-2xl font-semibold">{stats.totalUsers}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <p className="text-sm text-gray-600">Active Couples</p>
          </div>
          <p className="text-2xl font-semibold">{stats.activeCouples}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Active Today</p>
          </div>
          <p className="text-2xl font-semibold">{stats.activeToday}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600">Avg Completion</p>
          </div>
          <p className="text-2xl font-semibold">{stats.avgCompletion} days</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="couples">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="couples">Couples View</TabsTrigger>
          <TabsTrigger value="individuals">Individual Users</TabsTrigger>
        </TabsList>

        {/* Couples View */}
        <TabsContent value="couples" className="space-y-4 mt-4">
          {filteredCouples.map((couple) => (
            <Card key={couple.id} className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <Heart className="w-6 h-6 text-rose-600 fill-rose-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {couple.user1.name} & {couple.user2.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Together since {new Date(couple.user1.joinedDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="default" className="bg-green-600">Active</Badge>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t pt-4">
                {/* User 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {couple.user1.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{couple.user1.name}</p>
                      <p className="text-xs text-gray-600">{couple.user1.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Days</p>
                      <p className="font-semibold">{couple.user1.completedDays}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Journal</p>
                      <p className="font-semibold">{couple.user1.journalEntries}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prayers</p>
                      <p className="font-semibold">{couple.user1.prayerRequests}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Last active: {new Date(couple.user1.lastActive).toLocaleDateString()}
                  </p>
                </div>

                {/* User 2 */}
                <div className="space-y-3 border-l pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-rose-100 text-rose-700">
                        {couple.user2.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{couple.user2.name}</p>
                      <p className="text-xs text-gray-600">{couple.user2.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Days</p>
                      <p className="font-semibold">{couple.user2.completedDays}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Journal</p>
                      <p className="font-semibold">{couple.user2.journalEntries}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prayers</p>
                      <p className="font-semibold">{couple.user2.prayerRequests}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Last active: {new Date(couple.user2.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Individual Users View */}
        <TabsContent value="individuals" className="space-y-4 mt-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                    
                    {user.partnerId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>Partnered with {user.partnerName}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Joined</p>
                        <p className="font-medium">
                          {new Date(user.joinedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed Days</p>
                        <p className="font-medium">{user.completedDays}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Journal Entries</p>
                        <p className="font-medium">{user.journalEntries}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Prayer Requests</p>
                        <p className="font-medium">{user.prayerRequests}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Last active: {new Date(user.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setUserToDelete(user)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                </p>
                <p className="mt-4">This will permanently delete:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>User profile and account</li>
                  <li>All journal entries</li>
                  <li>All prayer requests</li>
                  <li>All milestones</li>
                  <li>All question responses</li>
                  <li>All devotional completions</li>
                  <li>Scripture memory progress</li>
                  {userToDelete?.partnerId && (
                    <li className="text-yellow-600">
                      <strong>Warning:</strong> This will unlink their partner ({userToDelete.partnerName})
                    </li>
                  )}
                </ul>
                <p className="mt-4">
                  <strong className="text-red-600">This action cannot be undone.</strong>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}