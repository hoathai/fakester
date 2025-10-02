import React, { useState, useEffect } from 'react';
import { createFakeUser, updateFakeUser, getTags, addTagToFakeUser, removeTagFromFakeUser } from '../lib/supabase';

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
    <div className="fake-user-form">
      <div className="form-header">
        <h2>{user ? 'Edit User' : 'New User'}</h2>
        <button onClick={onCancel} className="btn-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M15 5L5 15M5 5l10 10" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St, City, State 12345"
            rows="2"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional information..."
            rows="3"
          />
        </div>

        {allTags.length > 0 && (
          <div className="form-group">
            <label>Tags</label>
            <div className="tag-selection">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-select-btn ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                  style={{
                    borderColor: tag.color,
                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                    color: selectedTags.includes(tag.id) ? '#fff' : tag.color
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : user ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
