import React, { useState, useEffect } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import { loginWithGoogle } from '../services/login';
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

const SignupForm = () => {
    // 1. ADD ROLE STATE (Default 'freelancer')
    const [role, setRole] = useState('freelancer');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [googleError, setGoogleError] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const { clientId, updateClientId, loading: configLoading, error: configError } = useGoogleClientId();
    const [manualClientId, setManualClientId] = useState('');
    const [configMessage, setConfigMessage] = useState('');
    
    const { signup, isLoading, error, isSuccess } = useSignup();
    const { firstName, lastName, email } = formData;
    const navigate = useNavigate();
    const { login } = useUser();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. TOGGLE FUNCTION FOR THE ARROW
    const toggleRole = () => {
        setRole(prevRole => prevRole === 'freelancer' ? 'client' : 'freelancer');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 3. PASS 'role' TO SIGNUP FUNCTION
        await signup(
            formData.firstName, 
            formData.lastName, 
            formData.email, 
            formData.password,
            role // <--- Passing the selected role
        );
    };

    const completeGoogleSignup = (response) => {
        if (login) {
            login(response);
        }

        try {
            const displayName = getDisplayName(response);
            const message = displayName ? `Welcome ${displayName}!` : 'Welcome!';
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
            localStorage.setItem('pending_welcome', JSON.stringify({ title: note.title, message: note.message, variant: 'new' }));
            localStorage.removeItem('seen_welcome');
        } catch (storageError) {
            console.warn('Could not persist welcome after Google signup', storageError);
        }

        const userRole = response.role || role;
        if (userRole && userRole.toLowerCase() === 'client') {
            navigate('/client');
        } else {
            navigate('/freelancer');
        }
    };

    const handleGoogleSignup = async (credential) => {
        if (!clientId) {
            setGoogleError('Google Sign-Up is not configured. Please provide a Client ID.');
            return;
        }
        if (!credential) {
            setGoogleError('Google authentication failed. Please try again.');
            return;
        }

        setGoogleError('');
        setGoogleLoading(true);

        try {
            const response = await loginWithGoogle({ idToken: credential, role });
            completeGoogleSignup(response);
        } catch (err) {
            console.error('Google Signup Error:', err);
            setGoogleError(err.detail || 'Unable to sign up with Google right now.');
        } finally {
            setGoogleLoading(false);
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
            setConfigMessage('Google Client ID saved. You can now sign up with Google.');
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

    useEffect(() => {
        if (!isSuccess) {
            return;
        }

        try {
            const displayName = getDisplayName({ first_name: firstName, last_name: lastName });
            const message = displayName ? `Welcome ${displayName}!` : 'Welcome!';
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
            localStorage.setItem('pending_welcome', JSON.stringify({ title: note.title, message: note.message, variant: 'new' }));
            localStorage.removeItem('seen_welcome');
        } catch (e) {
            console.warn('Could not persist welcome after signup', e);
        }
    }, [isSuccess, firstName, lastName, email]);

    if (isSuccess) {
        return (
            <div style={{ textAlign: 'center' }}>
                <h3 className="success-msg">Registration Successful!</h3>
                <p style={{ marginBottom: '15px' }}>Please check your email for the OTP.</p>
                <Link to="/verify-otp" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 20px' }}>
                    Go to Verification
                </Link>
            </div>
        );
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {error && error.detail && <p className="error-msg">{error.detail}</p>}
                {googleError && <p className="error-msg">{googleError}</p>}
                {configError && <p className="error-msg">{configError}</p>}

                <div className="form-group">
                    <label>First Name</label>
                    <input 
                        name="firstName" className="form-input"
                        value={formData.firstName} onChange={handleChange} required 
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input 
                        name="lastName" className="form-input"
                        value={formData.lastName} onChange={handleChange} required 
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" name="email" className="form-input"
                        value={formData.email} onChange={handleChange} required 
                    />
                    {error && error.email && <small className="error-msg">{error.email[0]}</small>}
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" name="password" className="form-input"
                        value={formData.password} onChange={handleChange} required 
                    />
                    {error && error.password && <small className="error-msg">{error.password[0]}</small>}
                </div>

                {/* --- 4. NEW SPLIT BUTTON UI --- */}
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* The Main Submit Button */}
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={isLoading}
                        style={{ 
                            flex: 1, 
                            borderTopRightRadius: 0, 
                            borderBottomRightRadius: 0,
                            marginRight: '1px' // Thin line separator
                        }}
                    >
                        {isLoading 
                            ? 'Creating Account...' 
                            : `Sign Up as ${role === 'client' ? 'Client' : 'Freelancer'}`
                        }
                    </button>

                    {/* The Arrow Button (Toggles Role) */}
                    <button 
                        type="button" 
                        className="btn-primary"
                        onClick={toggleRole}
                        disabled={isLoading}
                        style={{ 
                            width: '40px', 
                            borderTopLeftRadius: 0, 
                            borderBottomLeftRadius: 0,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            backgroundColor: '#0056b3' // Slightly darker shade for contrast
                        }}
                        title="Click to switch between Freelancer and Client"
                    >
                        ▼
                    </button>
                </div>

            </form>

            <div style={{ marginTop: '16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '12px', color: '#6b7280', fontSize: '0.875rem' }}>
                    or continue with
                </div>
                {clientId ? (
                    <GoogleOAuthProvider clientId={clientId}>
                        <GoogleLogin
                            onSuccess={(credentialResponse) => handleGoogleSignup(credentialResponse?.credential)}
                            onError={() => setGoogleError('Google authentication was cancelled.')}
                            text="signup_with"
                            shape="rectangular"
                            width="100%"
                            useOneTap={false}
                        />
                    </GoogleOAuthProvider>
                ) : (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                        <p style={{ marginBottom: '12px', color: '#475569', fontSize: '0.875rem' }}>
                            Paste your Google OAuth Client ID to enable Google signup and login.
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
                            <p style={{ textAlign: 'center', marginTop: '8px', color: '#4b5563', fontSize: '0.875rem' }}>
                                Loading configuration…
                            </p>
                        )}
                        {configMessage && (
                            <p style={{ textAlign: 'center', marginTop: '8px', color: '#16a34a', fontSize: '0.75rem' }}>
                                {configMessage}
                            </p>
                        )}
                    </div>
                )}
                {clientId && googleLoading && (
                    <p style={{ textAlign: 'center', marginTop: '8px', color: '#4b5563', fontSize: '0.875rem' }}>
                        Completing Google sign up…
                    </p>
                )}
            </div>
        </div>
    );
};

export default SignupForm;




