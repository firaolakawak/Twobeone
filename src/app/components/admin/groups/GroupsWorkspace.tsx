import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Activity, ArrowUpDown, CalendarDays, CheckCircle2, ChevronRight, Compass, Edit3, Eye, Globe2, HeartHandshake, Lock, MapPin, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, UserRound, Users, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import { Textarea } from '../../ui/textarea';
import type { Group } from '../GroupsManager';

interface Props {
  groups: Group[]; filteredGroups: Group[]; selectedGroup: Group | null; selectedId: string | null;
  isLoading: boolean; searchQuery: string; statusFilter: 'all' | Group['status']; categoryFilter: string;
  sortOrder: 'members' | 'name' | 'recent'; categories: string[]; editorOpen: boolean;
  editingGroup: Group | null; formData: Partial<Group>;
  onSearchChange: (value: string) => void; onStatusFilterChange: (value: Props['statusFilter']) => void;
  onCategoryFilterChange: (value: string) => void; onSortOrderChange: (value: Props['sortOrder']) => void;
  onSelect: (id: string) => void; onRefresh: () => void; onNew: () => void; onEdit: (group: Group) => void;
  onDelete: (id: string) => void; onEditorOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent) => void;
  setFormData: Dispatch<SetStateAction<Partial<Group>>>;
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }

export function GroupsWorkspace(props: Props) {
  const { groups, filteredGroups, selectedGroup, selectedId, isLoading, searchQuery, statusFilter, categoryFilter,
    sortOrder, categories, editorOpen, editingGroup, formData, onSearchChange, onStatusFilterChange,
    onCategoryFilterChange, onSortOrderChange, onSelect, onRefresh, onNew, onEdit, onDelete,
    onEditorOpenChange, onSubmit, setFormData } = props;
  const members = groups.reduce((total, group) => total + group.members, 0);
  const active = groups.filter((group) => group.status === 'active').length;
  const online = groups.filter((group) => group.location.toLowerCase().includes('online')).length;
  const setField = <K extends keyof Group>(field: K, value: Group[K]) => setFormData((current) => ({ ...current, [field]: value }));

  return <main className="group-console">
    <header className="group-console__hero"><div><span className="group-console__eyebrow"><Sparkles /> Community operations</span><h1>Community Groups</h1><p>Equip leaders, strengthen belonging, and keep every couple connected to a healthy community.</p></div><Button onClick={onNew} className="group-console__primary" aria-label="Create a new community group"><Plus /> New group</Button></header>

    <section className="group-console__metrics" aria-label="Community summary">
      <article><span><HeartHandshake /></span><div><strong>{groups.length}</strong><small>Total groups</small></div></article>
      <article><span><Users /></span><div><strong>{members}</strong><small>Community members</small></div></article>
      <article><span><Activity /></span><div><strong>{active}</strong><small>Active groups</small></div></article>
      <article><span><Globe2 /></span><div><strong>{online}</strong><small>Online communities</small></div></article>
    </section>

    <section className="group-console__toolbar" aria-label="Community group controls">
      <div className="group-console__search"><Search /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search groups, leaders, or locations…" aria-label="Search community groups" />{searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label="Clear group search"><X /></button>}</div>
      <div className="group-console__segments" aria-label="Filter groups by status">{(['all', 'active', 'inactive'] as const).map((status) => <button key={status} type="button" data-active={statusFilter === status || undefined} aria-pressed={statusFilter === status} onClick={() => onStatusFilterChange(status)}>{status}</button>)}</div>
      <label className="group-console__select"><Compass /><span className="sr-only">Category</span><select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} aria-label="Filter groups by category"><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <label className="group-console__select"><ArrowUpDown /><span className="sr-only">Sort</span><select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])} aria-label="Sort community groups"><option value="members">Most members</option><option value="name">Name A–Z</option><option value="recent">Recently created</option></select></label>
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label="Refresh community groups"><RefreshCw className={isLoading ? 'group-console__spin' : ''} /></Button>
    </section>

    <div className="group-console__result-line" role="status"><span>{filteredGroups.length} {filteredGroups.length === 1 ? 'community' : 'communities'}</span>{(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && <button type="button" onClick={() => { onSearchChange(''); onStatusFilterChange('all'); onCategoryFilterChange('all'); }}>Clear filters</button>}</div>

    <section className="group-console__workspace">
      <div className="group-console__library" aria-label="Community group directory" aria-busy={isLoading}>
        {isLoading && [...Array(4)].map((_, index) => <div className="group-console__skeleton" key={index} />)}
        {!isLoading && filteredGroups.map((group, index) => { const activeRow = selectedId ? selectedId === group.id : selectedGroup?.id === group.id; return <article key={group.id} className="group-console__row" data-active={activeRow || undefined}>
          <button type="button" className="group-console__row-main" onClick={() => onSelect(group.id)} aria-label={`Preview ${group.name}`}><span className={`group-console__avatar group-console__avatar--${index % 4}`}>{initials(group.name)}</span><div><div className="group-console__row-title"><h2>{group.name}</h2><span className={`group-console__status group-console__status--${group.status}`}>{group.status}</span></div><p>{group.description || 'Community description pending'}</p><small><span><Users /> {group.members}</span><span><UserRound /> {group.leader}</span><span><MapPin /> {group.location}</span></small></div><ChevronRight /></button>
          <div className="group-console__row-actions"><span>{group.category}</span><div><button type="button" onClick={() => onEdit(group)} aria-label={`Edit ${group.name}`}><Edit3 /> Edit</button><button type="button" onClick={() => onDelete(group.id)} aria-label={`Delete ${group.name}`}><Trash2 /> Delete</button></div></div>
        </article>; })}
        {!isLoading && !filteredGroups.length && <div className="group-console__empty"><Users /><h2>No communities found</h2><p>Adjust the filters or create a welcoming new space.</p><Button onClick={onNew}><Plus /> New group</Button></div>}
      </div>

      <aside className="group-console__preview" aria-label="Community group preview">{selectedGroup ? <>
        <div className="group-console__preview-cover">{selectedGroup.imageUrl ? <img src={selectedGroup.imageUrl} alt="" /> : <><span>{initials(selectedGroup.name)}</span><i /><b /></>}</div>
        <div className="group-console__preview-body"><div className="group-console__preview-top"><div><span className={`group-console__status group-console__status--${selectedGroup.status}`}>{selectedGroup.status}</span><span className="group-console__visibility">{selectedGroup.isPublic === false ? <><Lock /> Private</> : <><Globe2 /> Public</>}</span></div><div><button type="button" onClick={() => onEdit(selectedGroup)} aria-label={`Edit ${selectedGroup.name}`}><Edit3 /></button><button type="button" onClick={() => onDelete(selectedGroup.id)} aria-label={`Delete ${selectedGroup.name}`} className="group-console__danger"><Trash2 /></button></div></div><span className="group-console__category">{selectedGroup.category}</span><h2>{selectedGroup.name}</h2><p>{selectedGroup.description || 'Add a welcoming description for prospective members.'}</p>
          <div className="group-console__health"><div><span>Community health</span><b>{selectedGroup.status === 'active' ? 'Healthy' : 'Needs attention'}</b></div><i><span style={{ width: selectedGroup.status === 'active' ? '82%' : '28%' }} /></i></div>
          <dl><div><dt><Users /> Members</dt><dd>{selectedGroup.members}</dd></div><div><dt><UserRound /> Group leader</dt><dd>{selectedGroup.leader || 'Leader pending'}</dd></div><div><dt><CalendarDays /> Meeting rhythm</dt><dd>{selectedGroup.meetingDay || 'Schedule pending'}</dd></div><div><dt><MapPin /> Gathering place</dt><dd>{selectedGroup.location || 'Location pending'}</dd></div></dl>
          <div className="group-console__preview-note"><ShieldCheck /><div><strong>Admin view</strong><span>Membership, leader, and meeting details are visible for community oversight.</span></div></div>
        </div>
      </> : <div className="group-console__empty"><Eye /><h2>Select a community</h2><p>Operational details and the member-facing preview will appear here.</p></div>}</aside>
    </section>

    <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}><DialogContent className="group-console__editor max-w-[96vw] sm:max-w-3xl max-h-[94vh]"><DialogHeader><DialogTitle>{editingGroup ? 'Edit community group' : 'Create community group'}</DialogTitle><DialogDescription>Define how couples discover the group, who leads it, and when it gathers.</DialogDescription></DialogHeader><ScrollArea className="max-h-[78vh] pr-4"><form onSubmit={onSubmit} className="group-editor">
      <section><div className="group-editor__section-title"><span>01</span><div><h3>Community identity</h3><p>Create a clear and welcoming group profile.</p></div></div><label><Label htmlFor="group-name">Group name</Label><Input id="group-name" value={formData.name || ''} onChange={(event) => setField('name', event.target.value)} placeholder="Pre-Marriage Couples" required /></label><label><Label htmlFor="group-description">Description</Label><Textarea id="group-description" value={formData.description || ''} onChange={(event) => setField('description', event.target.value)} rows={4} placeholder="Help couples understand who this community is for…" required /><small>{formData.description?.length || 0} characters</small></label><div className="group-editor__grid"><label><Label htmlFor="group-category">Life stage</Label><select id="group-category" value={formData.category || categories[0]} onChange={(event) => setField('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label><Label htmlFor="group-status">Status</Label><select id="group-status" value={formData.status || 'active'} onChange={(event) => setField('status', event.target.value as Group['status'])}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label><Label htmlFor="group-visibility">Visibility</Label><select id="group-visibility" value={formData.isPublic === false ? 'private' : 'public'} onChange={(event) => setField('isPublic', event.target.value === 'public')}><option value="public">Public</option><option value="private">Private</option></select></label></div></section>
      <section><div className="group-editor__section-title"><span>02</span><div><h3>Leadership & gathering</h3><p>Give members a reliable point of contact and meeting rhythm.</p></div></div><div className="group-editor__grid group-editor__grid--two"><label><Label htmlFor="group-leader">Group leader</Label><Input id="group-leader" value={formData.leader || ''} onChange={(event) => setField('leader', event.target.value)} placeholder="Pastor Mike" required /></label><label><Label htmlFor="group-members">Member count</Label><Input id="group-members" type="number" min="0" value={formData.members || 0} onChange={(event) => setField('members', Number(event.target.value))} required /></label><label><Label htmlFor="group-meeting">Meeting day & time</Label><Input id="group-meeting" value={formData.meetingDay || ''} onChange={(event) => setField('meetingDay', event.target.value)} placeholder="Sundays, 6:00 PM" required /></label><label><Label htmlFor="group-location">Location</Label><Input id="group-location" value={formData.location || ''} onChange={(event) => setField('location', event.target.value)} placeholder="Online or Community Center" required /></label></div><label><Label htmlFor="group-image">Cover image URL <span>(optional)</span></Label><Input id="group-image" type="url" value={formData.imageUrl || ''} onChange={(event) => setField('imageUrl', event.target.value)} placeholder="https://…" /></label></section>
      <footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>Cancel</Button><Button type="submit" className="group-console__primary">{editingGroup ? 'Save changes' : 'Create group'}</Button></footer>
    </form></ScrollArea></DialogContent></Dialog>
  </main>;
}
