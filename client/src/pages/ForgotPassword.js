import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    // State to track if OTP has been generated
    const [isOtpSent, setIsOtpSent] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await axiosInstance.post('forgot-password/', { email });
            
            setMessage('OTP generated successfully!');
            setIsOtpSent(true); // This triggers the button to change
            
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong.");
            setIsOtpSent(false);
        } finally {
            setLoading(false);
        }
    };

    // Function to go to the reset page
    const goToResetPage = () => {
        navigate('/reset-password', { state: { email: email } });
    };

    return (
        <div>
            <Navbar />
            <div className="forgot-password-background">
                <div className="glass-card">
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive a verification code.</p>

                    <form onSubmit={handleSubmit}>
                        {error && <p className="error-msg">{error}</p>}
                        {message && <p className="success-msg">{message}</p>}

                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                className="form-input"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="name@example.com"
                                // Lock the input after OTP is sent so they don't change email
                                disabled={isOtpSent} 
                            />
                        </div>

                        {/* --- CONDITIONAL BUTTON LOGIC --- */}
                        
                        {!isOtpSent ? (
                            // STATE 1: Show "Send OTP" (Before generation)
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Generating...' : 'Send OTP'}
                            </button>
                        ) : (
                            // STATE 2: Show "Reset Password" (Only AFTER generation)
                            <button 
                                type="button" 
                                onClick={goToResetPage} 
                                className="btn-primary"
                                style={{ backgroundColor: '#FF8F00' }} // Orange to match theme
                            >
                                Reset Password &rarr;
                            </button>
                        )}

                    </form>

                    <Link to="/login" className="back-link">
                        &larr; Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;