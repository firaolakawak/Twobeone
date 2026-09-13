import { BrandLoader, LoadingMark } from "../../BrandLoader";
import { useUiCopy } from "../../../utils/uiTranslation";
import { adminCommunityMessages } from "../../../locales/adminCommunity";
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
  const tr = useUiCopy(adminCommunityMessages);
  const { groups, filteredGroups, selectedGroup, selectedId, isLoading, searchQuery, statusFilter, categoryFilter,
    sortOrder, categories, editorOpen, editingGroup, formData, onSearchChange, onStatusFilterChange,
    onCategoryFilterChange, onSortOrderChange, onSelect, onRefresh, onNew, onEdit, onDelete,
    onEditorOpenChange, onSubmit, setFormData } = props;
  const members = groups.reduce((total, group) => total + group.members, 0);
  const active = groups.filter((group) => group.status === 'active').length;
  const online = groups.filter((group) => group.location.toLowerCase().includes('online')).length;
  const setField = <K extends keyof Group>(field: K, value: Group[K]) => setFormData((current) => ({ ...current, [field]: value }));

  return <main className="group-console">
    <header className="group-console__hero"><div><span className="group-console__eyebrow"><Sparkles /> {' '}{tr("Community operations")}</span><h1>{tr("Community Groups")}</h1><p>{tr("Equip leaders, strengthen belonging, and keep every couple connected to a healthy community.")}</p></div><Button onClick={onNew} className="group-console__primary" aria-label={tr("Create a new community group")}><Plus /> {' '}{tr("New group")}</Button></header>

    <section className="group-console__metrics" aria-label={tr("Community summary")}>
      <article><span><HeartHandshake /></span><div><strong>{groups.length}</strong><small>{tr("Total groups")}</small></div></article>
      <article><span><Users /></span><div><strong>{members}</strong><small>{tr("Community members")}</small></div></article>
      <article><span><Activity /></span><div><strong>{active}</strong><small>{tr("Active groups")}</small></div></article>
      <article><span><Globe2 /></span><div><strong>{online}</strong><small>{tr("Online communities")}</small></div></article>
    </section>

    <section className="group-console__toolbar" aria-label={tr("Community group controls")}>
      <div className="group-console__search"><Search /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={tr("Search groups, leaders, or locations…")} aria-label={tr("Search community groups")} />{searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label={tr("Clear group search")}><X /></button>}</div>
      <div className="group-console__segments" aria-label={tr("Filter groups by status")}>{(['all', 'active', 'inactive'] as const).map((status) => <button key={status} type="button" data-active={statusFilter === status || undefined} aria-pressed={statusFilter === status} onClick={() => onStatusFilterChange(status)}>{tr(status)}</button>)}</div>
      <label className="group-console__select"><Compass /><span className="sr-only">{tr("Category")}</span><select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} aria-label={tr("Filter groups by category")}><option value="all">{tr("All categories")}</option>{categories.map((category) => <option key={category} value={category}>{tr(category)}</option>)}</select></label>
      <label className="group-console__select"><ArrowUpDown /><span className="sr-only">{tr("Sort")}</span><select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])} aria-label={tr("Sort community groups")}><option value="members">{tr("Most members")}</option><option value="name">{tr("Name A–Z")}</option><option value="recent">{tr("Recently created")}</option></select></label>
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label={tr("Refresh community groups")}>{isLoading ? <LoadingMark /> : <RefreshCw  />}</Button>
    </section>

    <div className="group-console__result-line" role="status"><span>{filteredGroups.length} {tr(filteredGroups.length === 1 ? 'community' : 'communities')}</span>{(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && <button type="button" onClick={() => { onSearchChange(''); onStatusFilterChange('all'); onCategoryFilterChange('all'); }}>{tr("Clear filters")}</button>}</div>

    <section className="group-console__workspace">
      <div className="group-console__library" aria-label={tr("Community group directory")} aria-busy={isLoading}>
        {isLoading && <BrandLoader className="py-8" />}
        {!isLoading && filteredGroups.map((group, index) => { const activeRow = selectedId ? selectedId === group.id : selectedGroup?.id === group.id; return <article key={group.id} className="group-console__row" data-active={activeRow || undefined}>
          <button type="button" className="group-console__row-main" onClick={() => onSelect(group.id)} aria-label={tr('Preview {name}', { name: group.name })}><span className={`group-console__avatar group-console__avatar--${index % 4}`}>{initials(group.name)}</span><div><div className="group-console__row-title"><h2>{group.name}</h2><span className={`group-console__status group-console__status--${group.status}`}>{tr(group.status)}</span></div><p>{group.description || tr("Community description pending")}</p><small><span><Users /> {group.members}</span><span><UserRound /> {group.leader}</span><span><MapPin /> {group.location}</span></small></div><ChevronRight /></button>
          <div className="group-console__row-actions"><span>{tr(group.category)}</span><div><button type="button" onClick={() => onEdit(group)} aria-label={tr('Edit {name}', { name: group.name })}><Edit3 /> {' '}{tr("Edit")}</button><button type="button" onClick={() => onDelete(group.id)} aria-label={tr('Delete {name}', { name: group.name })}><Trash2 /> {' '}{tr("Delete")}</button></div></div>
        </article>; })}
        {!isLoading && !filteredGroups.length && <div className="group-console__empty"><Users /><h2>{tr("No communities found")}</h2><p>{tr("Adjust the filters or create a welcoming new space.")}</p><Button onClick={onNew}><Plus /> {' '}{tr("New group")}</Button></div>}
      </div>

      <aside className="group-console__preview" aria-label={tr("Community group preview")}>{selectedGroup ? <>
        <div className="group-console__preview-cover">{selectedGroup.imageUrl ? <img src={selectedGroup.imageUrl} alt="" /> : <><span>{initials(selectedGroup.name)}</span><i /><b /></>}</div>
        <div className="group-console__preview-body"><div className="group-console__preview-top"><div><span className={`group-console__status group-console__status--${selectedGroup.status}`}>{tr(selectedGroup.status)}</span><span className="group-console__visibility">{selectedGroup.isPublic === false ? <><Lock /> {' '}{tr("Private")}</> : <><Globe2 /> {' '}{tr("Public")}</>}</span></div><div><button type="button" onClick={() => onEdit(selectedGroup)} aria-label={tr('Edit {name}', { name: selectedGroup.name })}><Edit3 /></button><button type="button" onClick={() => onDelete(selectedGroup.id)} aria-label={tr('Delete {name}', { name: selectedGroup.name })} className="group-console__danger"><Trash2 /></button></div></div><span className="group-console__category">{tr(selectedGroup.category)}</span><h2>{selectedGroup.name}</h2><p>{selectedGroup.description || tr("Add a welcoming description for prospective members.")}</p>
          <div className="group-console__health"><div><span>{tr("Community health")}</span><b>{selectedGroup.status === 'active' ? tr("Healthy") : tr("Needs attention")}</b></div><i><span style={{ width: selectedGroup.status === 'active' ? '82%' : '28%' }} /></i></div>
          <dl><div><dt><Users /> {' '}{tr("Members")}</dt><dd>{selectedGroup.members}</dd></div><div><dt><UserRound /> {' '}{tr("Group leader")}</dt><dd>{selectedGroup.leader || tr("Leader pending")}</dd></div><div><dt><CalendarDays /> {' '}{tr("Meeting rhythm")}</dt><dd>{selectedGroup.meetingDay || tr("Schedule pending")}</dd></div><div><dt><MapPin /> {' '}{tr("Gathering place")}</dt><dd>{selectedGroup.location || tr("Location pending")}</dd></div></dl>
          <div className="group-console__preview-note"><ShieldCheck /><div><strong>{tr("Admin view")}</strong><span>{tr("Membership, leader, and meeting details are visible for community oversight.")}</span></div></div>
        </div>
      </> : <div className="group-console__empty"><Eye /><h2>{tr("Select a community")}</h2><p>{tr("Operational details and the member-facing preview will appear here.")}</p></div>}</aside>
    </section>

    <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}><DialogContent className="group-console__editor max-w-[96vw] sm:max-w-3xl max-h-[94vh]"><DialogHeader><DialogTitle>{editingGroup ? tr("Edit community group") : tr("Create community group")}</DialogTitle><DialogDescription>{tr("Define how couples discover the group, who leads it, and when it gathers.")}</DialogDescription></DialogHeader><ScrollArea className="max-h-[78vh] pr-4"><form onSubmit={onSubmit} className="group-editor">
      <section><div className="group-editor__section-title"><span>01</span><div><h3>{tr("Community identity")}</h3><p>{tr("Create a clear and welcoming group profile.")}</p></div></div><label><Label htmlFor="group-name">{tr("Group name")}</Label><Input id="group-name" value={formData.name || ''} onChange={(event) => setField('name', event.target.value)} placeholder={tr("Pre-Marriage Couples")} required /></label><label><Label htmlFor="group-description">{tr("Description")}</Label><Textarea id="group-description" value={formData.description || ''} onChange={(event) => setField('description', event.target.value)} rows={4} placeholder={tr("Help couples understand who this community is for…")} required /><small>{formData.description?.length || 0} {' '}{tr("characters")}</small></label><div className="group-editor__grid"><label><Label htmlFor="group-category">{tr("Life stage")}</Label><select id="group-category" value={formData.category || categories[0]} onChange={(event) => setField('category', event.target.value)}>{categories.map((category) => <option key={category} value={category}>{tr(category)}</option>)}</select></label><label><Label htmlFor="group-status">{tr("Status")}</Label><select id="group-status" value={formData.status || 'active'} onChange={(event) => setField('status', event.target.value as Group['status'])}><option value="active">{tr("Active")}</option><option value="inactive">{tr("Inactive")}</option></select></label><label><Label htmlFor="group-visibility">{tr("Visibility")}</Label><select id="group-visibility" value={formData.isPublic === false ? 'private' : 'public'} onChange={(event) => setField('isPublic', event.target.value === 'public')}><option value="public">{tr("Public")}</option><option value="private">{tr("Private")}</option></select></label></div></section>
      <section><div className="group-editor__section-title"><span>02</span><div><h3>{tr("Leadership & gathering")}</h3><p>{tr("Give members a reliable point of contact and meeting rhythm.")}</p></div></div><div className="group-editor__grid group-editor__grid--two"><label><Label htmlFor="group-leader">{tr("Group leader")}</Label><Input id="group-leader" value={formData.leader || ''} onChange={(event) => setField('leader', event.target.value)} placeholder={tr("Pastor Mike")} required /></label><label><Label htmlFor="group-members">{tr("Member count")}</Label><Input id="group-members" type="number" min="0" value={formData.members || 0} onChange={(event) => setField('members', Number(event.target.value))} required /></label><label><Label htmlFor="group-meeting">{tr("Meeting day & time")}</Label><Input id="group-meeting" value={formData.meetingDay || ''} onChange={(event) => setField('meetingDay', event.target.value)} placeholder={tr("Sundays, 6:00 PM")} required /></label><label><Label htmlFor="group-location">{tr("Location")}</Label><Input id="group-location" value={formData.location || ''} onChange={(event) => setField('location', event.target.value)} placeholder={tr("Online or Community Center")} required /></label></div><label><Label htmlFor="group-image">{tr("Cover image URL")}{' '}<span>{tr("(optional)")}</span></Label><Input id="group-image" type="url" value={formData.imageUrl || ''} onChange={(event) => setField('imageUrl', event.target.value)} placeholder="https://…" /></label></section>
      <footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>{tr("Cancel")}</Button><Button type="submit" className="group-console__primary">{editingGroup ? tr("Save changes") : tr("Create group")}</Button></footer>
    </form></ScrollArea></DialogContent></Dialog>
  </main>;
}
