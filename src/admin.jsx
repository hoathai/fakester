import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './components/Auth';
import AdminPanel from './components/admin/AdminPanel';
import { supabase, getUserRole, signOut } from './lib/supabase';
import { Button } from './components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import './styles/main.css';

function AdminApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        if (session && event === 'SIGNED_IN') {
          await checkUserRole(session.user.id);
        } else if (!session) {
          setUserRole(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId) => {
    const { data } = await getUserRole(userId);
    setUserRole(data);

    if (data !== 'RootUser' && data !== 'AdminUser') {
      window.location.href = '/index.html';
      return;
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">
                {userRole === 'RootUser' ? 'Root User Access' : 'Administrator Access'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AdminPanel
          currentUserId={session.user.id}
          currentUserRole={userRole}
        />
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<AdminApp />);
