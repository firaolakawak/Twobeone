import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { GroupsWorkspace } from './groups/GroupsWorkspace';
import '../../styles/groups-console.css';

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  meetingDay: string;
  location: string;
  leader: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  isPublic?: boolean;
  createdAt?: string;
}

interface GroupsManagerProps { accessToken?: string; }

const emptyGroup: Partial<Group> = {
  name: '', description: '', category: 'Pre-Marriage', members: 0,
  meetingDay: '', location: '', leader: '', status: 'active', isPublic: true,
};

function normalizeGroup(raw: Record<string, unknown>): Group | null {
  if (!raw?.id || !raw?.name) return null;
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: String(raw.description || ''),
    category: String(raw.category || raw.type || 'Community'),
    members: Number(raw.members ?? raw.memberCount ?? 0),
    meetingDay: String(raw.meetingDay || raw.nextMeeting || ''),
    location: String(raw.location || 'Online'),
    leader: String(raw.leader || 'Community host'),
    status: raw.status === 'inactive' ? 'inactive' : 'active',
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    isPublic: raw.isPublic !== false,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

export function GroupsManager({ accessToken }: GroupsManagerProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Group['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'members' | 'name' | 'recent'>('members');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<Partial<Group>>(emptyGroup);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${accessToken || publicAnonKey}` }), [accessToken]);
  const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/groups`;

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${endpoint}/list`, { headers: authHeaders });
      if (!response.ok) throw new Error(`Group request failed (${response.status})`);
      const payload = await response.json();
      const nextGroups = (Array.isArray(payload.groups) ? payload.groups : [])
        .map((group: Record<string, unknown>) => normalizeGroup(group))
        .filter((group: Group | null): group is Group => Boolean(group));
      setGroups(nextGroups);
      setSelectedId((current) => current && nextGroups.some((group) => group.id === current) ? current : nextGroups[0]?.id || null);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Could not load community groups');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, endpoint]);

  useEffect(() => { void loadGroups(); }, [loadGroups]);

  const categories = useMemo(() => Array.from(new Set(['Pre-Marriage', 'Newlyweds', 'Young Families', 'Growing Together', 'Empty Nesters', ...groups.map((group) => group.category)])), [groups]);
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groups
      .filter((group) => !query || [group.name, group.description, group.category, group.leader, group.location].some((value) => value.toLowerCase().includes(query)))
      .filter((group) => statusFilter === 'all' || group.status === statusFilter)
      .filter((group) => categoryFilter === 'all' || group.category === categoryFilter)
      .sort((a, b) => sortOrder === 'name' ? a.name.localeCompare(b.name) : sortOrder === 'recent' ? (b.createdAt || '').localeCompare(a.createdAt || '') : b.members - a.members);
  }, [groups, searchQuery, statusFilter, categoryFilter, sortOrder]);
  const selectedGroup = filteredGroups.find((group) => group.id === selectedId) || filteredGroups[0] || null;

  const openNew = () => { setEditingGroup(null); setFormData({ ...emptyGroup }); setIsDialogOpen(true); };
  const handleEdit = (group: Group) => { setEditingGroup(group); setFormData(group); setIsDialogOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this community group? This cannot be undone.')) return;
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE', headers: authHeaders });
      if (!response.ok) throw new Error('Delete failed');
      setGroups((current) => current.filter((group) => group.id !== id));
      setSelectedId((current) => current === id ? null : current);
      toast.success('Group deleted successfully');
    } catch (error) { console.error('Failed to delete group:', error); toast.error('Could not delete group'); }
  };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(editingGroup ? `${endpoint}/${editingGroup.id}` : endpoint, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, memberCount: Number(formData.members || 0) }),
      });
      if (!response.ok) throw new Error('Save failed');
      toast.success(editingGroup ? 'Group updated successfully' : 'Group created successfully');
      setIsDialogOpen(false); setEditingGroup(null); setFormData({ ...emptyGroup });
      await loadGroups();
    } catch (error) { console.error('Failed to save group:', error); toast.error('Could not save group'); }
  };

  return <GroupsWorkspace
    groups={groups} filteredGroups={filteredGroups} selectedGroup={selectedGroup} selectedId={selectedId}
    isLoading={isLoading} searchQuery={searchQuery} statusFilter={statusFilter} categoryFilter={categoryFilter}
    sortOrder={sortOrder} categories={categories} editorOpen={isDialogOpen} editingGroup={editingGroup}
    formData={formData} onSearchChange={setSearchQuery} onStatusFilterChange={setStatusFilter}
    onCategoryFilterChange={setCategoryFilter} onSortOrderChange={setSortOrder} onSelect={setSelectedId}
    onRefresh={loadGroups} onNew={openNew} onEdit={handleEdit} onDelete={handleDelete}
    onEditorOpenChange={setIsDialogOpen} onSubmit={handleSubmit} setFormData={setFormData}
  />;
}
