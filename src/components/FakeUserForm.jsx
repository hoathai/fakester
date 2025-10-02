import React, { useState, useEffect } from 'react';
import { createFakeUser, updateFakeUser, getTags, addTagToFakeUser, removeTagFromFakeUser } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { X } from 'lucide-react';

export default function FakeUserForm({ user, teamId, userId, onComplete, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTags();
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        notes: user.notes || ''
      });
      setSelectedTags(user.tags?.map(t => t.id) || []);
    }
  }, [user]);

  const loadTags = async () => {
    const { data, error } = await getTags(teamId);
    if (!error && data) {
      setAllTags(data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        const { error: updateError } = await updateFakeUser(user.id, formData);
        if (updateError) throw updateError;

        const currentTagIds = user.tags?.map(t => t.id) || [];
        const tagsToAdd = selectedTags.filter(id => !currentTagIds.includes(id));
        const tagsToRemove = currentTagIds.filter(id => !selectedTags.includes(id));

        for (const tagId of tagsToAdd) {
          await addTagToFakeUser(user.id, tagId);
        }
        for (const tagId of tagsToRemove) {
          await removeTagFromFakeUser(user.id, tagId);
        }
      } else {
        const { data: newUser, error: createError } = await createFakeUser({
          ...formData,
          team_id: teamId,
          created_by: userId
        });
        if (createError) throw createError;

        for (const tagId of selectedTags) {
          await addTagToFakeUser(newUser.id, tagId);
        }
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{user ? 'Edit User' : 'New User'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email *</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">Phone</label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">Address</label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, City, State 12345"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          {allTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    size="sm"
                    style={{
                      borderColor: tag.color,
                      ...(selectedTags.includes(tag.id) ? { backgroundColor: tag.color, color: 'white' } : { color: tag.color })
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
