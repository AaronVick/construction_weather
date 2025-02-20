import React from 'react';
import '../styles/LandingPage.css'; // Import the CSS
import heroImage from '../assets/images/hero-image.jpg'; // Example image
import featureIcon1 from '../assets/icons/cloud-lightning.svg'; // Example icon
import featureIcon2 from '../assets/icons/email.svg'; // Example icon
import featureIcon3 from '../assets/icons/settings.svg'; // Example icon
import testimonialImage1 from '../assets/images/user1.jpg'; // Example testimonial image

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>What Our Users Are Saying</h2>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <img src={testimonialImage1} alt="User 1" />
            <p>"This platform has been a game-changer for our team!"</p>
            <span>- John Doe, Construction Manager</span>
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