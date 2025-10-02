import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { supabase, getUserRole } from './lib/supabase';
import './styles/main.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserRoleAndRedirect(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        if (session && event === 'SIGNED_IN') {
          await checkUserRoleAndRedirect(session.user.id);
        } else {
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoleAndRedirect = async (userId) => {
    const { data: role } = await getUserRole(userId);
    if (role === 'RootUser' || role === 'AdminUser') {
      setShouldRedirect(true);
    } else {
      setLoading(false);
    }
  };

  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Admin Access Detected</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please use the admin portal to access administrative features.
          </p>
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('admin.html') })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Open Admin Portal
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {!session ? <Auth /> : <Dashboard session={session} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
