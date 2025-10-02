import React, { useState, useEffect } from 'react';
import { signOut, getUserTeams, createTeam, getFakeUsers } from '../lib/supabase';
import FakeUserList from './FakeUserList';
import FakeUserForm from './FakeUserForm';
import TagManager from './TagManager';

export default function Dashboard({ session, isWebVersion = false }) {
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [fakeUsers, setFakeUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [view, setView] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    loadTeams();
  }, [session]);

  useEffect(() => {
    if (currentTeam) {
      loadFakeUsers();
    }
  }, [currentTeam]);

  const loadTeams = async () => {
    setLoading(true);
    const { data, error } = await getUserTeams(session.user.id);
    if (!error && data) {
      setTeams(data);
      if (data.length > 0 && !currentTeam) {
        setCurrentTeam(data[0]);
      } else if (data.length === 0) {
        setShowNewTeam(true);
      }
    }
    setLoading(false);
  };

  const loadFakeUsers = async () => {
    const { data, error } = await getFakeUsers(currentTeam.id);
    if (!error && data) {
      const usersWithTags = data.map(user => ({
        ...user,
        tags: user.fake_user_tags?.map(t => t.tags).filter(Boolean) || []
      }));
      setFakeUsers(usersWithTags);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const { data, error } = await createTeam(newTeamName, session.user.id);
    if (!error && data) {
      setTeams([...teams, data]);
      setCurrentTeam(data);
      setNewTeamName('');
      setShowNewTeam(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setView('form');
  };

  const handleFormComplete = () => {
    setView('list');
    setSelectedUser(null);
    loadFakeUsers();
  };

  const handleAutofill = (user) => {
    if (isWebVersion) {
      alert('Autofill is only available in the Chrome extension version. User data copied to clipboard!');
      const userData = `Name: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone || 'N/A'}\nAddress: ${user.address || 'N/A'}`;
      navigator.clipboard.writeText(userData);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'autofill',
          user: user
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (showNewTeam && teams.length === 0) {
    return (
      <div className="setup-container">
        <h2>Create Your First Team</h2>
        <p>Teams help you organize and share fake user profiles</p>
        <form onSubmit={handleCreateTeam} className="setup-form">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            required
          />
          <button type="submit" className="btn btn-primary">Create Team</button>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-top">
          <select
            value={currentTeam?.id || ''}
            onChange={(e) => {
              const team = teams.find(t => t.id === e.target.value);
              setCurrentTeam(team);
            }}
            className="team-select"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <button onClick={handleSignOut} className="btn-icon" title="Sign Out">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M13 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3M8 14l-5-5 5-5M3 10h11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            Users
          </button>
          <button
            className={`nav-tab ${view === 'tags' ? 'active' : ''}`}
            onClick={() => setView('tags')}
          >
            Tags
          </button>
        </nav>
      </header>

      <div className="dashboard-content">
        {view === 'list' && (
          <FakeUserList
            users={fakeUsers}
            onEdit={handleEdit}
            onAutofill={handleAutofill}
            onRefresh={loadFakeUsers}
            onNewUser={() => {
              setSelectedUser(null);
              setView('form');
            }}
            isWebVersion={isWebVersion}
          />
        )}

        {view === 'form' && (
          <FakeUserForm
            user={selectedUser}
            teamId={currentTeam.id}
            userId={session.user.id}
            onComplete={handleFormComplete}
            onCancel={() => {
              setView('list');
              setSelectedUser(null);
            }}
          />
        )}

        {view === 'tags' && (
          <TagManager teamId={currentTeam.id} />
        )}
      </div>
    </div>
  );
}
