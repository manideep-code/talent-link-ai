import React from 'react';
import Navbar from '../layout/Navbar';
import ResetPasswordForm from '../features/authentication/components/ResetPasswordForm';

const ResetPassword = () => {
    return (
        <div>
            <Navbar />
            <div style={styles.pageContainer}>
                <div className="login-card-container">
                    <h2 style={{ marginBottom: '10px' }}>Set New Password</h2>
                    <p style={{ color: '#666', marginBottom: '30px' }}>
                        Check your terminal/email for the OTP.
                    </p>
                    <ResetPasswordForm />
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: '#f8f8f8',
        padding: '20px'
    }
};

export default ResetPassword;