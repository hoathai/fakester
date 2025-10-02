import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';
import './styles/main.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="app web-app">
      {!session ? <Auth /> : <Dashboard session={session} isWebVersion={true} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
