import React, { useState } from 'react';
import '../styles/auth.css';

export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('client');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('Beauty');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Please enter your name or business name.');
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('skawara_users') || '[]');

    if (isSignUp) {
      const alreadyExists = existingUsers.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (alreadyExists) {
        setError('An account with this email already exists. Try signing in.');
        return;
      }

      const newUser = {
        id: Date.now(),
        name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        category: role === 'provider' ? category : 'Client',
        location: 'Soweto / Local Area',
        rating: 'New (0 reviews)',
        startingPrice: 'R200+',
        bio: 'Local entrepreneur offering professional services in the community.',
        phone: '27712345678',
      };

      localStorage.setItem('skawara_users', JSON.stringify([...existingUsers, newUser]));
      localStorage.setItem('skawara_session', JSON.stringify(newUser));
      onLoginSuccess(newUser);
    } else {
      const matchedUser = existingUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matchedUser) {
        localStorage.setItem('skawara_session', JSON.stringify(matchedUser));
        onLoginSuccess(matchedUser);
      } else if (email.endsWith('@skawara.co.za') || password === 'demo1234') {
        const sessionUser = {
          id: 999,
          name: role === 'provider' ? "Naledi's Glam Studio" : 'Thabo Mokoena',
          email: email.trim(),
          role,
          category: role === 'provider' ? 'Beauty' : 'Client',
          location: 'Soweto, Maponya Mall',
          rating: '4.9 (42 reviews)',
          startingPrice: 'R250',
          phone: '27710000001',
          bio: 'Professional local service provider.',
        };
        localStorage.setItem('skawara_session', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);
      } else {
        setError('Invalid credentials. Use a registered account or click a demo shortcut below.');
      }
    }
  };

  const handleDemoFill = (selectedRole) => {
    setIsSignUp(false);
    setRole(selectedRole);
    setError('');
    if (selectedRole === 'provider') {
      setEmail('naledi@skawara.co.za');
      setPassword('demo1234');
    } else {
      setEmail('thabo@skawara.co.za');
      setPassword('demo1234');
    }
  };

  return (
    <div className="ska-auth-page">
      <div className="ska-auth-card">
        <div className="ska-brand-row">
          <span className="ska-logo-pill">Ska wara</span>
          <span className="ska-tagline">No stress. Just sorted.</span>
        </div>

        <div className="ska-auth-header">
          <h1>{isSignUp ? 'Join the Network' : 'Welcome Back'}</h1>
          <p>
            {isSignUp
              ? 'Create an account to book local plugs or list your hustle.'
              : 'Sign in to connect with trusted local service providers.'}
          </p>
        </div>

        <div className="ska-role-grid">
          <button
            type="button"
            className={`ska-role-btn ${role === 'client' ? 'active' : ''}`}
            onClick={() => setRole('client')}
          >
            Looking for a Plug
          </button>
          <button
            type="button"
            className={`ska-role-btn ${role === 'provider' ? 'active' : ''}`}
            onClick={() => setRole('provider')}
          >
            Business Owner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ska-form">
          {error && <div className="ska-error-box">{error}</div>}

          {isSignUp && (
            <div className="ska-field">
              <label>{role === 'provider' ? 'Business Name' : 'Your Full Name'}</label>
              <input
                type="text"
                placeholder={role === 'provider' ? 'e.g. Lerato Nails & Spa' : 'e.g. Karabo Sithole'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          {isSignUp && role === 'provider' && (
            <div className="ska-field">
              <label>Service Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Beauty">Nails & Beauty</option>
                <option value="Catering">Catering & Food</option>
                <option value="Hair">Hairstylist</option>
                <option value="Cleaners">Cleaning Services</option>
              </select>
            </div>
          )}

          <div className="ska-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="ska-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="ska-submit-btn">
            {isSignUp
              ? `Create ${role === 'provider' ? 'Business' : 'Client'} Account`
              : `Sign In as ${role === 'provider' ? 'Business Owner' : 'Client'}`}
          </button>
        </form>

        <div className="ska-mode-switch">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div className="ska-demo-bar">
          <span>Quick Demo Fill (For Presentation)</span>
          <div className="ska-demo-actions">
            <button type="button" onClick={() => handleDemoFill('client')}>
              Fill Client Login
            </button>
            <button type="button" onClick={() => handleDemoFill('provider')}>
              Fill Business Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}