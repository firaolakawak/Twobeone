import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { UsersWorkspace } from './users/UsersWorkspace';
import '../../styles/users-console.css';

export interface User {
  id: string; name: string; email: string; partnerId: string | null; partnerName: string | null;
  joinedDate: string; lastActive: string; completedDays: number; journalEntries: number;
  prayerRequests: number; status: 'active' | 'inactive';
}
export interface Couple { id: string; user1: User; user2: User; }
interface UsersManagerProps { accessToken?: string; }

export function UsersManager({ accessToken }: UsersManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'people' | 'couples'>('people');
  const [statusFilter, setStatusFilter] = useState<'all' | User['status']>('all');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'connected' | 'solo'>('all');
  const [sortOrder, setSortOrder] = useState<'activity' | 'joined' | 'name'>('activity');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/users`;
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${accessToken || publicAnonKey}` }), [accessToken]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(endpoint, { headers: authHeaders });
      if (!response.ok) throw new Error(`User request failed (${response.status})`);
      const payload = await response.json();
      const nextUsers: User[] = (Array.isArray(payload.users) ? payload.users : []).map((raw: Record<string, unknown>) => {
        const joinedDate = String(raw.createdAt || raw.relationshipStart || new Date().toISOString());
        const lastActive = String(raw.lastActive || raw.updatedAt || raw.createdAt || joinedDate);
        const validLastActive = Number.isNaN(new Date(lastActive).getTime()) ? joinedDate : lastActive;
        const daysSinceActive = (Date.now() - new Date(validLastActive).getTime()) / 86_400_000;
        return {
          id: String(raw.id), name: String(raw.name || 'Unknown user'), email: String(raw.email || ''),
          partnerId: raw.partnerId ? String(raw.partnerId) : null,
          partnerName: raw.partnerName ? String(raw.partnerName) : null,
          joinedDate, lastActive: validLastActive,
          completedDays: Number(raw.completedDays ?? raw.daysTogether ?? 0),
          journalEntries: Number(raw.journalEntries ?? 0), prayerRequests: Number(raw.prayerRequests ?? 0),
          status: (daysSinceActive <= (raw.partnerId ? 30 : 7) ? 'active' : 'inactive') as User['status'],
        };
      });
      setUsers(nextUsers);
      setSelectedId((current) => current && nextUsers.some((user) => user.id === current) ? current : nextUsers[0]?.id || null);
    } catch (error) { console.error('Failed to load users:', error); toast.error('Could not load users'); setUsers([]); }
    finally { setIsLoading(false); }
  }, [authHeaders, endpoint]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const couples = useMemo(() => users.reduce((items, user) => {
    if (!user.partnerId) return items;
    const partner = users.find((candidate) => candidate.id === user.partnerId);
    const id = [user.id, user.partnerId].sort().join('-');
    if (partner && !items.some((couple) => couple.id === id)) items.push({ id, user1: user, user2: partner });
    return items;
  }, [] as Couple[]), [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => !query || [user.name, user.email, user.partnerName || ''].some((value) => value.toLowerCase().includes(query)))
      .filter((user) => statusFilter === 'all' || user.status === statusFilter)
      .filter((user) => connectionFilter === 'all' || (connectionFilter === 'connected' ? Boolean(user.partnerId) : !user.partnerId))
      .sort((a, b) => sortOrder === 'name' ? a.name.localeCompare(b.name) : sortOrder === 'joined' ? new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime() : new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  }, [users, searchQuery, statusFilter, connectionFilter, sortOrder]);

  const filteredCouples = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return couples.filter((couple) => !query || [couple.user1.name, couple.user1.email, couple.user2.name, couple.user2.email].some((value) => value.toLowerCase().includes(query)))
      .filter((couple) => statusFilter === 'all' || couple.user1.status === statusFilter || couple.user2.status === statusFilter)
      .sort((a, b) => sortOrder === 'name' ? a.user1.name.localeCompare(b.user1.name) : Math.max(new Date(b.user1.lastActive).getTime(), new Date(b.user2.lastActive).getTime()) - Math.max(new Date(a.user1.lastActive).getTime(), new Date(a.user2.lastActive).getTime()));
  }, [couples, searchQuery, statusFilter, sortOrder]);

  const selectedUser = filteredUsers.find((user) => user.id === selectedId) || filteredUsers[0] || null;
  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${endpoint}/${userId}`, { method: 'DELETE', headers: authHeaders });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete user');
      toast.success(result.message || 'User deleted successfully'); setUserToDelete(null); await loadUsers();
    } catch (error) { const message = error instanceof Error ? error.message : 'Failed to delete user'; console.error('Failed to delete user:', error); toast.error(message); }
    finally { setIsDeleting(false); }
  };

  return <UsersWorkspace users={users} filteredUsers={filteredUsers} couples={couples} filteredCouples={filteredCouples}
    selectedUser={selectedUser} selectedId={selectedId} isLoading={isLoading} searchQuery={searchQuery} view={view}
    statusFilter={statusFilter} connectionFilter={connectionFilter} sortOrder={sortOrder} userToDelete={userToDelete}
    isDeleting={isDeleting} onSearchChange={setSearchQuery} onViewChange={setView} onStatusFilterChange={setStatusFilter}
    onConnectionFilterChange={setConnectionFilter} onSortOrderChange={setSortOrder} onSelect={setSelectedId}
    onRefresh={loadUsers} onDeleteRequest={setUserToDelete} onDeleteCancel={() => setUserToDelete(null)} onDeleteConfirm={handleDeleteUser} />;
}
