


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar"; 
import { FaShieldAlt, FaRocket, FaHandshake, FaLinkedin, FaGithub, FaTimes } from "react-icons/fa"; 
import "./Home.css"; 

const HERO_IMAGE = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const Home = () => {
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false); // State for Contact Form

  const handleContactClick = () => {
    setShowContact(true);
  };

  return (
    <div className="home-container">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">#1 Freelance Marketplace</span>
          <h1 className="hero-title">
            Hire the best talent <br />
            <span style={{ color: "#3b82f6" }}>anywhere, anytime.</span>
          </h1>
          <p className="hero-subtitle">
            Connect with top-tier freelancers and clients. Whether you need a developer, 
            designer, or writer, TalentLink makes it easy to build your dream team.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/signup")}>Find Talent</button>
            <button className="btn-outline" onClick={() => navigate("/signup")}>Find Work</button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={HERO_IMAGE} alt="Collaboration" className="hero-img" />
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="stats-section">
        <div className="stat-item">
            <div className="stat-number">20k+</div>
            <div className="stat-label">Freelancers</div>
        </div>
        <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Projects Completed</div>
        </div>
        <div className="stat-item">
            <div className="stat-number">98%</div>
            <div className="stat-label">Satisfaction Rate</div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="features-section">
        <h2 className="section-title">Why Choose TalentLink?</h2>
        <div className="features-grid">
            <div className="feature-card">
                <div className="feature-icon"><FaShieldAlt /></div>
                <h3 className="feature-title">Secure Payments</h3>
                <p className="feature-desc">
                    Your money is held safely until you approve the work. We ensure peace of mind for both sides.
                </p>
            </div>
            <div className="feature-card">
                <div className="feature-icon"><FaRocket /></div>
                <h3 className="feature-title">Fast Hiring</h3>
                <p className="feature-desc">
                   Post a job and get proposals within minutes. Our matching algorithm connects you instantly.
                </p>
            </div>
            <div className="feature-card">
                <div className="feature-icon"><FaHandshake /></div>
                <h3 className="feature-title">Verified Talent</h3>
                <p className="feature-desc">
                    We vet our freelancers to ensure high-quality deliverables for every project size.
                </p>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-grid">
            <div className="footer-brand">
                <h2>TalentLink</h2>
                <p className="footer-desc">
                    The bridge between companies and world-class freelancers. 
                    Building the future of work, one connection at a time.
                </p>
                {/* SOCIAL LINKS ADDED HERE */}
                <div className="footer-socials">
                    <a href="https://www.linkedin.com/in/sowjanya-kumar-gosala/" target="_blank" rel="noreferrer" className="social-icon">
                        <FaLinkedin />
                    </a>
                    <a href="https://github.com/KumarGosala24" target="_blank" rel="noreferrer" className="social-icon">
                        <FaGithub />
                    </a>
                </div>
            </div>
            <div className="footer-col">
                <h4>For Clients</h4>
                <ul>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/signup')}>
                        How to Hire
                      </button>
                    </li>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/signup')}>
                        Talent Marketplace
                      </button>
                    </li>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/signup')}>
                        Payment Services
                      </button>
                    </li>
                </ul>
            </div>
            <div className="footer-col">
                <h4>For Talent</h4>
                <ul>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/signup')}>
                        How to Find Work
                      </button>
                    </li>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/signup')}>
                        Direct Contracts
                      </button>
                    </li>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/signup')}>
                        Opportunity Feed
                      </button>
                    </li>
                </ul>
            </div>
            <div className="footer-col">
                <h4>Company</h4>
                <ul>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/')}>
                        About Us
                      </button>
                    </li>
                    <li>
                      <button type="button" className="footer-link-button" onClick={() => navigate('/')}>
                        Careers
                      </button>
                    </li>
                    {/* TRIGGER POPUP ON CLICK */}
                    <li>
                      <button type="button" className="footer-link-button" onClick={handleContactClick}>
                        Contact Support
                      </button>
                    </li>
                </ul>
            </div>
        </div>
        <div className="footer-bottom">
            &copy; 2025 TalentLink Inc. All rights reserved.
        </div>
      </footer>

      {/* --- CONTACT FORM MODAL --- */}
      {showContact && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowContact(false)}>
                <FaTimes />
            </button>
            <h2>Contact Support</h2>
            <p>We're here to help! Fill out the form below.</p>
            
            <form className="contact-form">
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="Your Name" />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="email@example.com" />
                </div>
                <div className="form-group">
                    <label>Message</label>
                    <textarea rows="4" placeholder="How can we help you?"></textarea>
                </div>
                <button type="button" className="btn-primary" onClick={() => setShowContact(false)}>
                    Send Message
                </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;