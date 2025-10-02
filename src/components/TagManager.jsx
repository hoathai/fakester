import React, { useState, useEffect } from 'react';
import { getTags, createTag, deleteTag } from '../lib/supabase';

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
    <div className="tag-manager">
      <div className="tag-manager-header">
        <h2>Manage Tags</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            + New Tag
          </button>
        )}
      </div>

      {showForm && (
        <div className="tag-form">
          <form onSubmit={handleCreateTag}>
            <div className="form-group">
              <label htmlFor="tagName">Tag Name</label>
              <input
                id="tagName"
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Testing, Production"
                required
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewTagName('');
                  setError('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Tag'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tag-list">
        {tags.length === 0 ? (
          <div className="empty-state">
            <p>No tags yet</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                Create Your First Tag
              </button>
            )}
          </div>
        ) : (
          tags.map(tag => (
            <div key={tag.id} className="tag-item">
              <span
                className="tag-badge large"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="btn-icon btn-danger"
                title="Delete tag"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
