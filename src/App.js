import React, { useState, useEffect } from 'react';
import LoginPage from './components/login';
import MainDirectory from './components/MainDirectory';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('skawara_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('skawara_session');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  return <MainDirectory user={currentUser} onLogout={handleLogout} />;
}