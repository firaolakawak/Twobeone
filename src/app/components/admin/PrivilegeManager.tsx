import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { PrivilegeWorkspace } from './privileges/PrivilegeWorkspace';
import '../../styles/privileges-console.css';

export interface PrivilegeUser { id: string; email: string; name: string; isAdmin: boolean; hasPartner: boolean; createdAt: string; }
export interface AdminUser { id: string; email: string; name: string; addedAt: string; }
export interface PrivilegeActivity { id?: string; action: 'granted' | 'revoked'; targetUser: { id: string; email: string; name: string }; performedBy: { id?: string; email: string; name?: string }; timestamp: string; }
interface PrivilegeManagerProps { accessToken?: string; }

export function PrivilegeManager({ accessToken }: PrivilegeManagerProps) {
  const [users, setUsers] = useState<PrivilegeUser[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<PrivilegeActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'directory' | 'admins' | 'activity'>('directory');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{ action: 'grant' | 'revoke'; user: PrivilegeUser } | null>(null);
  const base = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/privileges`;
  const headers = useMemo(() => ({ Authorization: `Bearer ${accessToken || publicAnonKey}`, 'Content-Type': 'application/json' }), [accessToken]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersResponse, adminsResponse, activityResponse] = await Promise.all([
        fetch(`${base}/users`, { headers }), fetch(`${base}/list`, { headers }), fetch(`${base}/activity-log`, { headers }),
      ]);
      if (!usersResponse.ok || !adminsResponse.ok || !activityResponse.ok) throw new Error('Privilege request failed');
      const [usersData, adminsData, activityData] = await Promise.all([usersResponse.json(), adminsResponse.json(), activityResponse.json()]);
      const nextUsers = Array.isArray(usersData.users) ? usersData.users : [];
      setUsers(nextUsers); setAdmins(Array.isArray(adminsData.admins) ? adminsData.admins : []); setActivity(Array.isArray(activityData.activityLog) ? activityData.activityLog : []);
      setSelectedId((current) => current && nextUsers.some((user: PrivilegeUser) => user.id === current) ? current : nextUsers[0]?.id || null);
    } catch (error) { console.error('Error loading privilege data:', error); toast.error('Could not load access-control data'); }
    finally { setIsLoading(false); }
  }, [base, headers]);
  useEffect(() => { void loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => { const query = searchTerm.trim().toLowerCase(); return users.filter((user) => !query || [user.name, user.email].some((value) => value.toLowerCase().includes(query))).filter((user) => roleFilter === 'all' || (roleFilter === 'admin' ? user.isAdmin : !user.isAdmin)); }, [users, searchTerm, roleFilter]);
  const selectedUser = filteredUsers.find((user) => user.id === selectedId) || filteredUsers[0] || null;

  const applyPrivilegeChange = async () => {
    if (!pendingChange) return;
    const { action, user } = pendingChange;
    setProcessingUserId(user.id);
    try {
      const response = await fetch(`${base}/${action}`, { method: 'POST', headers, body: JSON.stringify({ targetUserId: user.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} admin privilege`);
      toast.success(data.message || `Administrator access ${action === 'grant' ? 'granted' : 'revoked'}`);
      setPendingChange(null); await loadData();
    } catch (error) { const message = error instanceof Error ? error.message : 'Privilege change failed'; console.error('Privilege update failed:', error); toast.error(message); }
    finally { setProcessingUserId(null); }
  };

  return <PrivilegeWorkspace users={users} filteredUsers={filteredUsers} admins={admins} activity={activity} isLoading={isLoading}
    searchTerm={searchTerm} view={view} roleFilter={roleFilter} selectedUser={selectedUser} selectedId={selectedId}
    processingUserId={processingUserId} pendingChange={pendingChange} onSearchChange={setSearchTerm} onViewChange={setView}
    onRoleFilterChange={setRoleFilter} onSelect={setSelectedId} onRefresh={loadData} onChangeRequest={(action, user) => setPendingChange({ action, user })}
    onChangeCancel={() => setPendingChange(null)} onChangeConfirm={applyPrivilegeChange} />;
}
