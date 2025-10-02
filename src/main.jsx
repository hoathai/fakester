import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { supabase, getUserRole } from './lib/supabase';
import './styles/main.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
      window.location.href = '/admin.html';
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      {!session ? <Auth /> : <Dashboard session={session} isWebVersion={true} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
