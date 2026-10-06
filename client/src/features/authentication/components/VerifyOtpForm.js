import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { verifyUserOtp } from '../services/verify';

const VerifyOtpForm = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // New state to handle the Success View
    const [isSuccess, setIsSuccess] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyUserOtp(email, otp);
            
            // On success, switch to the Success View instead of auto-redirecting
            setIsSuccess(true); 

        } catch (err) {
            setError(err.detail || err.error || "Invalid OTP or Email");
            setLoading(false);
        }
    };

    // --- 1. SUCCESS VIEW (Professional & Manual Click) ---
    if (isSuccess) {
        return (
            <div className="success-view-container">
                {/* Green Checkmark Icon */}
                <div className="success-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" className="success-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="success-titlehead">Account Verified!</h3>
                <p className="success-desc">
                    Your email has been successfully verified. You can now access your account.
                </p>
                
                {/* Manual Login Button */}
                <Link to="/login" className="btn-orange">
                    Login Now
                </Link>
            </div>
        );
    }

    // --- 2. FORM VIEW ---
    return (
        <div>
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
                        placeholder="Enter the email you used to signup"
                    />
                </div>

                <div className="form-group">
                    <label>OTP Code</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        required 
                        placeholder="Check your terminal for the code"
                        maxLength="6"
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Account'}
                </button>
            </form>
        </div>
    );
};

export default VerifyOtpForm;