import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { resetPasswordConfirm } from '../services/password'; 

const ResetPasswordForm = () => {
    const location = useLocation();
    
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await resetPasswordConfirm(email, otp, newPassword);
            setIsSuccess(true); 
        } catch (err) {
            setError(err.detail || err.error || "Failed to reset password.");
            setLoading(false);
        }
    };

    // --- 1. SUCCESS VIEW (Modern & Professional) ---
    if (isSuccess) {
        return (
            <div className="success-view-container">
                {/* Professional SVG Icon with Animation Wrapper */}
                <div className="success-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" className="success-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="success-title">Password Updated!</h3>
                <p className="success-desc">
                    Your password has been changed successfully. You can now login with your new credentials.
                </p>
                
                <Link to="/login" className="btn-orange">
                    Login Now
                </Link>
            </div>
        );
    }

    // --- 2. FORM VIEW ---
    return (
        <div>
            {/* Headers are HERE so they disappear when success shows */}
            <h2 style={{ marginBottom: '10px', color: '#222' }}>Set New Password</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Enter the OTP from your email and your new password.
            </p>

            <form onSubmit={handleSubmit}>
                {error && <p className="error-msg" style={{marginBottom: '15px'}}>{error}</p>}

                <div className="form-group">
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        className="form-input"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Enter OTP</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        required 
                        placeholder="Check your terminal"
                        maxLength="6"
                    />
                </div>

                <div className="form-group">
                    <label>New Password</label>
                    <input 
                        type="password" 
                        className="form-input"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                        placeholder="Set new password"
                    />
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                    {loading ? 'Resetting...' : 'Set New Password'}
                </button>

                <div className="cancel-link-container">
                    <Link to="/login" className="cancel-link">
                        Cancel & Back to Login
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ResetPasswordForm;