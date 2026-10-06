import React from 'react';
import Navbar from '../layout/Navbar';
import SignupForm from '../features/authentication/components/SignupForm';

const Signup = () => {
    return (
        <div>
            <Navbar />
            {/* Apply the new background class here */}
            <div className="signup-page-background"> 
                <div className="glass-card"> {/* The card style remains */}
                    <h2>Create an Account</h2>
                    <p>Join TalentLink today</p>
                    <SignupForm />
                </div>
            </div>
        </div>
    );
};

export default Signup;