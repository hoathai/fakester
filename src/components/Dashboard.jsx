import React, { useState, useEffect } from 'react';
import { signOut, getUserTeams, createTeam, getFakeUsers } from '../lib/supabase';
import FakeUserList from './FakeUserList';
import FakeUserForm from './FakeUserForm';
import TagManager from './TagManager';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { LogOut, Settings } from 'lucide-react';

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
  const [showSettings, setShowSettings] = useState(false);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showNewTeam && teams.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Your First Team</CardTitle>
            <CardDescription>Teams help you organize and share fake user profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <Input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                required
              />
              <Button type="submit" className="w-full">Create Team</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-background rounded-lg shadow-xl overflow-hidden">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold">Fake User Manager</h1>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted rounded-lg flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex border-t">
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('list')}
          >
            Fake Users
          </button>
          <button
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              view === 'tags'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('tags')}
          >
            Tags
          </button>
        </div>
      </div>

      <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
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
