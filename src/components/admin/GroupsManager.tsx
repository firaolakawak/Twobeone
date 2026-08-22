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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl mb-2">Community Groups</h2>
          <p className="text-gray-600">Manage community groups and small groups</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
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
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
              <DialogDescription>
                {editingGroup ? 'Update the details of this community group.' : 'Create a new community group for couples to connect and grow together.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Pre-Marriage Couples"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the group..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-gray-300"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full h-10 px-3 rounded-md border border-gray-300"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="leader">Group Leader</Label>
                  <Input
                    id="leader"
                    value={formData.leader}
                    onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                    placeholder="e.g., Pastor Mike"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meetingDay">Meeting Day & Time</Label>
                    <Input
                      id="meetingDay"
                      value={formData.meetingDay}
                      onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                      placeholder="e.g., Sundays, 6:00 PM"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Online or Building A"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingGroup ? 'Update' : 'Create'} Group
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
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
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Groups</p>
          <p className="text-2xl font-semibold">{groups.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Members</p>
          <p className="text-2xl font-semibold">
            {groups.reduce((acc, g) => acc + g.members, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Active Groups</p>
          <p className="text-2xl font-semibold text-green-600">
            {groups.filter(g => g.status === 'active').length}
          </p>
        </Card>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <Badge variant="outline">{group.category}</Badge>
                  <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                    {group.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-3">{group.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Leader:</span>
                    <span className="ml-2 font-medium">{group.leader}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Members:</span>
                    <span className="ml-2 font-medium">{group.members}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Meeting:</span>
                    <span className="ml-2 font-medium">{group.meetingDay}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{group.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(group)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(group.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}