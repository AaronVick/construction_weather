// src/pages/LandingPage.tsx

import React, { useState } from 'react';
import '../styles/LandingPage.css';
import heroImage from '../assets/images/hero-image.png';
import featureIcon1 from '../assets/icons/cloud-lightning.svg';
import featureIcon2 from '../assets/icons/email.svg';
import featureIcon3 from '../assets/icons/settings.svg';
import { supabase } from '../lib/supabaseClient';

const LandingPage: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setIsLoginModalOpen(false);
      window.location.href = '/dashboard';
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
    } else {
      alert('Password reset email sent! Check your inbox.');
      setIsForgotPassword(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Login Button */}
      <button
        className="login-button"
        onClick={() => setIsLoginModalOpen(true)}
      >
        Login
      </button>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{isForgotPassword ? 'Reset Password' : 'Login'}</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {!isForgotPassword && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
              <button type="submit">
                {isForgotPassword ? 'Send Reset Link' : 'Login'}
              </button>
            </form>
            <p>
              {isForgotPassword ? (
                <span onClick={() => setIsForgotPassword(false)}>
                  Back to Login
                </span>
              ) : (
                <span onClick={() => setIsForgotPassword(true)}>
                  Forgot Password?
                </span>
              )}
            </p>
            <button
              className="close-modal"
              onClick={() => setIsLoginModalOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Automate Weather Delay Notifications for Your Jobsite</h1>
          <p>Save time and keep your team informed with automated weather alerts.</p>
          <div className="cta-buttons">
            <button className="primary-cta">Get Started for Free</button>
            <button className="secondary-cta">Learn More</button>
          </div>
        </div>
        <div className="hero-image">
          <img src={heroImage} alt="Construction site with weather overlay" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>How It Works</h2>
        <div className="feature-cards">
          <div className="feature-card">
            <img src={featureIcon1} alt="Automated Weather Monitoring" />
            <h3>Automated Weather Monitoring</h3>
            <p>Our platform checks local weather conditions in real-time.</p>
          </div>
          <div className="feature-card">
            <img src={featureIcon2} alt="Instant Notifications" />
            <h3>Instant Notifications</h3>
            <p>Automatically send emails to workers and managers.</p>
          </div>
          <div className="feature-card">
            <img src={featureIcon3} alt="Customizable Alerts" />
            <h3>Customizable Alerts</h3>
            <p>Tailor alerts to specific jobsites or teams.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <h2>Ready to Simplify Weather Delay Notifications?</h2>
        <p>Join hundreds of construction teams who trust us to keep their jobsites running smoothly.</p>
        <button className="primary-cta">Sign Up for Free</button>
      </section>
    </div>
  );
};

export default LandingPage;