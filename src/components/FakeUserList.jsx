import React, { useState } from 'react';
import { deleteFakeUser } from '../lib/supabase';

export default function FakeUserList({ users, onEdit, onAutofill, onRefresh, onNewUser }) {
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
    <div className="fake-user-list">
      <div className="list-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={onNewUser} className="btn btn-primary btn-sm">
          + New User
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <button
            className={`tag-filter-btn ${!selectedTag ? 'active' : ''}`}
            onClick={() => setSelectedTag('')}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag.id}
              className={`tag-filter-btn ${selectedTag === tag.id ? 'active' : ''}`}
              style={{ borderColor: tag.color }}
              onClick={() => setSelectedTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="user-cards">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No fake users yet</p>
            <button onClick={onNewUser} className="btn btn-primary">
              Create Your First User
            </button>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <h3>{user.name}</h3>
                <div className="user-card-actions">
                  <button
                    onClick={() => onAutofill(user)}
                    className="btn-icon"
                    title="Autofill"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="btn-icon"
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.667 14 1.333 14.667l.667-3.334L11.333 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="btn-icon btn-danger"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="user-card-body">
                <div className="user-field">
                  <span className="field-label">Email:</span>
                  <span className="field-value">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="user-field">
                    <span className="field-label">Phone:</span>
                    <span className="field-value">{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="user-field">
                    <span className="field-label">Address:</span>
                    <span className="field-value">{user.address}</span>
                  </div>
                )}
                {user.notes && (
                  <div className="user-field">
                    <span className="field-label">Notes:</span>
                    <span className="field-value">{user.notes}</span>
                  </div>
                )}
              </div>

              {user.tags && user.tags.length > 0 && (
                <div className="user-card-tags">
                  {user.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="tag-badge"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
