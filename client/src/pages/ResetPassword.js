
import React from 'react';
import Navbar from '../layout/Navbar';
import ResetPasswordForm from '../features/authentication/components/ResetPasswordForm';

const ResetPassword = () => {
    return (
        <div>
            <Navbar />
            {/* Reusing the Forgot Password Background for consistency */}
            <div className="forgot-password-background">
                
                <div className="glass-card">
                    <h2>Set New Password</h2>
                    <p>Enter the OTP from your email/terminal and your new password.</p>
                    <ResetPasswordForm />
                </div>
                
            </div>
        </div>
    );
};

export default ResetPassword;