



import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { FaBriefcase } from 'react-icons/fa'; // Import the briefcase icon
import '../App.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMsg, setSnackMsg] = useState('');
    const [snackTitle, setSnackTitle] = useState('');

    useEffect(() => {
        try {
            const pending = localStorage.getItem('pending_welcome');
            if (pending) {
                const p = JSON.parse(pending);
                setSnackTitle(p.title || 'Welcome');
                setSnackMsg(p.message || 'Welcome to TalentLink');
                setSnackOpen(true);
                localStorage.removeItem('pending_welcome');
            }
        } catch (e) {
            // ignore
        }
    }, []);

    const handleSnackClose = () => {
        setSnackOpen(false);
    };

    return (
        <>
        <nav className="navbar">
            {/* --- Logo Section --- */}
            {/* Kept consistent with your screenshot (Briefcase + TalentLink) */}
            <div className="navbar-brand">
                <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    {/* The Blue Briefcase Icon */}
                    <FaBriefcase style={{ color: '#3b82f6', fontSize: '1.4rem' }} />
                    
                    {/* The Text: White 'Talent', Blue 'Link' */}
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                        Talent<span style={{ color: '#3b82f6' }}>Link</span>
                    </span>
                </Link>
            </div>

            {/* --- Navigation Links --- */}
            {/* UPDATED: These now redirect to /signup */}
            <div className="navbar-links">
                <Link to="/signup" className="nav-link">Home</Link>
                <Link to="/signup" className="nav-link">Find Jobs</Link>
                <Link to="/signup" className="nav-link">Companies</Link>
            </div>

            {/* --- Auth Buttons --- */}
            <div className="navbar-auth">
                <button 
                    className="nav-btn-ghost" 
                    onClick={() => navigate('/login')}
                >
                    Log In
                </button>
                <button 
                    className="nav-btn-primary" 
                    onClick={() => navigate('/signup')}
                >
                    Sign Up
                </button>
            </div>
        </nav>
        <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <Alert onClose={handleSnackClose} severity="success" sx={{ width: '100%' }}>
                <strong>{snackTitle}</strong>: {snackMsg}
            </Alert>
        </Snackbar>
        </>
    );
};

export default Navbar;