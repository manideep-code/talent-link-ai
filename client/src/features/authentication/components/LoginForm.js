import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { loginUser, loginWithGoogle } from '../services/login';
// FIX 1: Correct import path (Go up 3 levels to reach src/context)
import { useUser } from '../../../context/UserContext';
import useGoogleClientId from '../../../hooks/useGoogleClientId';

const getDisplayName = (payload = {}) => {
    const first = payload.first_name || payload.firstName || payload.given_name;
    const last = payload.last_name || payload.lastName || payload.family_name;
    const combined = [first, last].filter(Boolean).join(' ').trim();
    if (combined) {
        return combined;
    }
    if (payload.name) {
        return payload.name;
    }
    if (payload.username) {
        return payload.username;
    }
    return '';
};

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // FIX 2: Get the login function from Global Context
    const { login } = useUser();
    const { clientId, updateClientId, loading: configLoading, error: configError } = useGoogleClientId();
    const [manualClientId, setManualClientId] = useState('');
    const [configMessage, setConfigMessage] = useState('');

    const finalizeAuth = (response) => {
        if (login) {
            login(response);
        }

        try {
            const name = getDisplayName(response);
            const message = name ? `Welcome back, ${name}!` : 'Welcome back!';
            const note = {
                id: Date.now(),
                title: 'Welcome to TalentLink',
                message,
                date: new Date().toISOString(),
                read: false
            };
            const existing = JSON.parse(localStorage.getItem('local_notifications') || '[]');
            existing.unshift(note);
            localStorage.setItem('local_notifications', JSON.stringify(existing));
            localStorage.setItem('pending_welcome', JSON.stringify({ title: note.title, message: note.message, variant: 'returning' }));
            localStorage.removeItem('seen_welcome');
        } catch (e) {
            console.warn('Could not persist welcome notification', e);
        }

        const userRole = response.role || localStorage.getItem('role');

        if (userRole && userRole.toLowerCase() === 'freelancer') {
            navigate('/freelancer');
        } else if (userRole && userRole.toLowerCase() === 'client') {
            navigate('/client');
        } else {
            navigate('/');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginUser(email, password);
            finalizeAuth(response);
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.detail || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credential) => {
        if (!clientId) {
            setError('Google Sign-In is not configured. Please provide a Client ID.');
            return;
        }
        if (!credential) {
            setError('Google authentication failed. Please try again.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await loginWithGoogle({ idToken: credential });
            finalizeAuth(response);
        } catch (err) {
            console.error('Google Login Error:', err);
            setError(err.detail || 'Unable to authenticate with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyClientId = async () => {
        if (!manualClientId.trim()) {
            setConfigMessage('Please paste a valid Google OAuth Client ID.');
            return;
        }

        try {
            setConfigMessage('');
            await updateClientId(manualClientId.trim());
            setConfigMessage('Google Client ID saved. You can now continue with Google.');
        } catch (err) {
            setConfigMessage('');
        }
    };

    useEffect(() => {
        if (!clientId) {
            return;
        }
        setManualClientId('');
    }, [clientId]);

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-msg">{error}</p>}
                {configError && <p className="error-msg">{configError}</p>}
                
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="form-input" 
                        value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input type="password" className="form-input"
                        value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <div className="forgot-password-container">
                        <Link to="/forgot-password" className="forgot-password-text">Forgot Password?</Link>
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <div style={{ marginTop: '16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '12px', color: '#6b7280', fontSize: '0.875rem' }}>
                    or continue with
                </div>
                {clientId ? (
                    <GoogleOAuthProvider clientId={clientId}>
                        <GoogleLogin
                            onSuccess={(credentialResponse) => handleGoogleSuccess(credentialResponse?.credential)}
                            onError={() => setError('Google authentication was cancelled.')}
                            text="signin_with"
                            shape="rectangular"
                            width="100%"
                        />
                    </GoogleOAuthProvider>
                ) : (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                        <p style={{ marginBottom: '12px', color: '#475569', fontSize: '0.875rem' }}>
                            Paste your Google OAuth Client ID to enable one-click sign in. You can find it in the Google Cloud Console under OAuth 2.0 Client IDs.
                        </p>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Paste Google OAuth Client ID"
                            value={manualClientId}
                            onChange={(e) => setManualClientId(e.target.value)}
                            disabled={configLoading}
                        />
                        <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '12px' }}
                            onClick={handleApplyClientId}
                            disabled={configLoading}
                        >
                            Save Client ID
                        </button>
                        {configLoading && (
                            <p style={{ marginTop: '8px', color: '#4b5563', fontSize: '0.75rem', textAlign: 'center' }}>
                                Loading configuration…
                            </p>
                        )}
                        {configMessage && (
                            <p style={{ marginTop: '8px', color: '#16a34a', fontSize: '0.75rem', textAlign: 'center' }}>
                                {configMessage}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginForm;