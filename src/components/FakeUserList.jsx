import React, { useState } from 'react';
import { deleteFakeUser } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Search, Plus, Copy, CreditCard as Edit2, Trash2, Zap } from 'lucide-react';

export default function FakeUserList({ users, onEdit, onAutofill, onRefresh, onNewUser, isWebVersion = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const allTags = [...new Set(users.flatMap(u => u.tags || []))];

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag ||
      user.tags?.some(tag => tag.id === selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleDelete = async (id) => {
    if (confirm('Delete this fake user?')) {
      const { error } = await deleteFakeUser(id);
      if (!error) {
        onRefresh();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            className="pl-10"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={onNewUser} size="default">
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedTag ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTag('')}
          >
            All
          </Button>
          {allTags.map(tag => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(tag.id)}
              style={{
                borderColor: tag.color,
                ...(selectedTag === tag.id ? { backgroundColor: tag.color, color: 'white' } : {})
              }}
            >
              {tag.name}
            </Button>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No fake users yet</p>
            <Button onClick={onNewUser}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map(user => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAutofill(user)}
                      title={isWebVersion ? "Copy to clipboard" : "Autofill"}
                      className="h-8 w-8"
                    >
                      {isWebVersion ? (
                        <Copy className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      title="Edit"
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                      title="Delete"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-mono">{user.email}</p>
                </div>
                {user.phone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-sm font-mono">{user.phone}</p>
                  </div>
                )}
                {user.address && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-sm">{user.address}</p>
                  </div>
                )}
                {user.notes && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{user.notes}</p>
                  </div>
                )}
                {user.tags && user.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {user.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        style={{ backgroundColor: tag.color, color: 'white' }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
