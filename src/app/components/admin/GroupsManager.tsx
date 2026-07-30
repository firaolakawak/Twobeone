import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  meetingDay: string;
  location: string;
  leader: string;
  status: 'active' | 'inactive';
}

export function GroupsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Pre-Marriage Couples',
      description: 'A supportive community for couples preparing for marriage',
      category: 'Pre-Marriage',
      members: 24,
      meetingDay: 'Sundays, 6:00 PM',
      location: 'Online',
      leader: 'Pastor Mike',
      status: 'active',
    },
    {
      id: '2',
      name: 'Newlyweds (0-2 Years)',
      description: 'Navigate the exciting first years of marriage together',
      category: 'Newlyweds',
      members: 18,
      meetingDay: 'Tuesdays, 7:30 PM',
      location: 'Community Center',
      leader: 'David & Sarah',
      status: 'active',
    },
  ]);

  const [formData, setFormData] = useState<Partial<Group>>({
    name: '',
    description: '',
    category: 'Pre-Marriage',
    members: 0,
    meetingDay: '',
    location: '',
    leader: '',
    status: 'active',
  });

  const categories = ['Pre-Marriage', 'Newlyweds', 'Young Families', 'Growing Together', 'Empty Nesters'];

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData(group);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      setGroups(groups.filter(g => g.id !== id));
      toast.success('Group deleted successfully');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGroup) {
      setGroups(groups.map(g => 
        g.id === editingGroup.id ? { ...g, ...formData } as Group : g
      ));
      toast.success('Group updated successfully');
    } else {
      const newGroup: Group = {
        ...formData,
        id: Date.now().toString(),
      } as Group;
      setGroups([newGroup, ...groups]);
      toast.success('Group created successfully');
    }

    setIsDialogOpen(false);
    setEditingGroup(null);
    setFormData({
      name: '',
      description: '',
      category: 'Pre-Marriage',
      members: 0,
      meetingDay: '',
      location: '',
      leader: '',
      status: 'active',
    });
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[24px]">Community Groups</h2>
          <p className="text-sm text-muted-foreground text-[16px]">Manage community groups and small groups</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto text-xs sm:text-sm text-[14px]"
              size="sm"
              onClick={() => {
                setEditingGroup(null);
                setFormData({
                  name: '',
                  description: '',
                  category: 'Pre-Marriage',
                  members: 0,
                  meetingDay: '',
                  location: '',
                  leader: '',
                  status: 'active',
                });
              }}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg lg:text-xl">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingGroup ? 'Update the details of this community group.' : 'Create a new community group for couples to connect and grow together.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-2 sm:pr-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Pre-Marriage Couples"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the group..."
                    rows={3}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-9 sm:h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full h-9 sm:h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="leader" className="text-xs sm:text-sm">Group Leader</Label>
                  <Input
                    id="leader"
                    value={formData.leader}
                    onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                    placeholder="e.g., Pastor Mike"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="meetingDay" className="text-xs sm:text-sm">Meeting Day & Time</Label>
                    <Input
                      id="meetingDay"
                      value={formData.meetingDay}
                      onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                      placeholder="e.g., Sundays, 6:00 PM"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Online or Building A"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                  <Button type="submit" className="flex-1 text-xs sm:text-sm">
                    {editingGroup ? 'Update' : 'Create'} Group
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 text-xs sm:text-sm text-[14px]"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Total Groups</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold font-bold">{groups.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Total Members</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold font-bold">
            {groups.reduce((acc, g) => acc + g.members, 0)}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Active Groups</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-success-700 font-bold">
            {groups.filter(g => g.status === 'active').length}
          </p>
        </Card>
      </div>

      {/* Groups List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg font-bold">{group.name}</h3>
                  <Badge variant="outline" className="text-xs text-[13px]">{group.category}</Badge>
                  <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {group.status}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-foreground mb-2 sm:mb-3 text-[15px]">{group.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground text-[14px]">Leader:</span>
                    <span className="ml-2 font-medium text-[14px] font-bold">{group.leader}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[14px] text-[13px]">Members:</span>
                    <span className="ml-2 font-medium text-[14px] font-bold">{group.members}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[14px] text-[13px]">Meeting:</span>
                    <span className="ml-2 font-medium font-bold text-[14px] text-[13px]">{group.meetingDay}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[14px] text-[13px]">Location:</span>
                    <span className="ml-2 font-medium text-[13px] font-bold">{group.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 sm:ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(group)}
                  className="flex-1 sm:flex-none text-xs text-[14px] font-bold"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-0" />
                  <span className="sm:hidden ml-1">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(group.id)}
                  className="flex-1 sm:flex-none text-xs text-[13px] font-bold"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-error-500 sm:mr-0" />
                  <span className="sm:hidden ml-1">Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}