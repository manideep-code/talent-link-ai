import React from 'react';
import Navbar from '../layout/Navbar';
import LoginForm from '../features/authentication/components/LoginForm';

const Login = () => {
    return (
        <div>
            <Navbar />
            <div className="login-page-background">
                <div className="glass-card">
                    <h2>Welcome Back</h2>
                    <p>Please login to your account</p>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
};

export default Login;