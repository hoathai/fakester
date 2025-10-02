import React, { useState, useEffect } from 'react';
import { getTags, createTag, deleteTag } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Trash2 } from 'lucide-react';

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

export default function TagManager({ teamId }) {
  const [tags, setTags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTags();
  }, [teamId]);

  const loadTags = async () => {
    const { data, error } = await getTags(teamId);
    if (!error && data) {
      setTags(data);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: createError } = await createTag({
        name: newTagName,
        color: selectedColor,
        team_id: teamId
      });

      if (createError) throw createError;

      setNewTagName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      setShowForm(false);
      loadTags();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (id) => {
    if (confirm('Delete this tag? It will be removed from all users.')) {
      const { error } = await deleteTag(id);
      if (!error) {
        loadTags();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Tags</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Tag
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="tagName" className="text-sm font-medium">Tag Name</label>
                <Input
                  id="tagName"
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Testing, Production"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-10 h-10 rounded-md border-2 transition-all ${
                        selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setNewTagName('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Tag'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No tags yet</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Tag
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <Badge
                className="text-base px-4 py-2"
                style={{ backgroundColor: tag.color, color: 'white' }}
              >
                {tag.name}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteTag(tag.id)}
                className="text-destructive hover:text-destructive"
                title="Delete tag"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
