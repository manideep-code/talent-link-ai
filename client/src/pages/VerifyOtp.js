import React from 'react';
import Navbar from '../layout/Navbar';
import VerifyOtpForm from '../features/authentication/components/VerifyOtpForm';

const VerifyOtp = () => {
    return (
        <div>
            <Navbar />
            <div className="verify-page-background">
                <div className="glass-card">
                    <h2>Verify Your Account</h2>
                    <p>Enter the OTP sent to your email/terminal.</p>
                    <VerifyOtpForm />
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;