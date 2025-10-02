import React, { useState } from 'react';
import UserList from './UserList';
import UserEditForm from './UserEditForm';
import ActivityLog from './ActivityLog';

export default function AdminPanel({ currentUserId, currentUserRole }) {
  const [view, setView] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setView('edit');
  };

  const handleFormComplete = () => {
    setView('users');
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {!selectedUser && (
        <div className="flex border-b">
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              view === 'users'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('users')}
          >
            Users
          </button>
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              view === 'activity'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('activity')}
          >
            Activity Log
          </button>
        </div>
      )}

      {view === 'users' && !selectedUser && (
        <UserList
          onEditUser={handleEditUser}
          currentUserId={currentUserId}
        />
      )}

      {view === 'edit' && selectedUser && (
        <UserEditForm
          user={selectedUser}
          currentUserRole={currentUserRole}
          onComplete={handleFormComplete}
          onCancel={() => {
            setView('users');
            setSelectedUser(null);
          }}
        />
      )}

      {view === 'activity' && (
        <ActivityLog />
      )}
    </div>
  );
}
