import React, { useState } from 'react';
import { Input, Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Signup = () => {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    // Validate email format
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

    // Handle SignUp logic
    const handleSignup = async () => {
        if (password !== confirmPassword) {
            notification.error({
                message: 'Password Mismatch',
                description: 'The passwords you entered do not match. Please try again.',
                duration: 2,
            });
            return;
        }
        if (!isValidEmail(email)) {
            notification.error({
                message: 'Invalid Email',
                description: 'Please enter a valid email address.',
                duration: 2,
            });
            return;
        }

        // Check if password is strong enough (at least 6 characters)
        if (password.length < 6) {
            notification.error({
                message: 'Weak Password',
                description: 'Password must be at least 6 characters long.',
                duration: 2,
            });
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            notification.success({
                message: 'Signup Successful',
                description: 'Your account has been created successfully.',
                duration: 2,
            });
            navigate('/login');
        } catch (error) {
            let errorMessage = '';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'The email address is not valid.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'The email address is already in use by another account.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please enter a stronger password.';
                    break;
                case 'auth/missing-email':
                    errorMessage = 'Email is required.';
                    break;
                case 'auth/missing-password':
                    errorMessage = 'Password is required.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred. Please try again later.';
            }

            // Show error notification
            notification.error({
                message: 'Signup Failed',
                description: errorMessage,
                duration: 2,
            });
        }
    };

    // Redirect to login page
    const handleLoginRedirect = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-1 justify-center items-center bg-gray-50 py-16">
                <div className="bg-white p-8 rounded-lg shadow-lg w-[90vw] sm:w-[400px]">
                    <h2 className="text-2xl text-[#015BA3] font-bold text-center mb-6">Create an Account</h2>
                    
                    {/* Username Input */}
                    <div className="mb-4">
                        <Input
                            type="text"
                            placeholder="Username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#015BA3]"
                        />
                    </div>

                    {/* Email Input */}
                    <div className="mb-4">
                        <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#015BA3]" 
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <Input.Password
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#015BA3]"
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="mb-6">
                        <Input.Password
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#015BA3]"
                        />
                    </div>

                    {/* Signup Button */}
                    <Button
                        type="primary"
                        className="w-full py-5 mb-4 bg-[#015BA3] text-white font-semibold hover:bg-[#015BA3] focus:ring-2 focus:ring-[#015BA3]"
                        onClick={handleSignup}
                    >
                        Sign Up
                    </Button>

                    {/* Redirect to Login */}
                    <div className="flex flex-col items-center gap-2 justify-between text-sm text-gray-500">
                        <a
                            onClick={handleLoginRedirect}
                            className="cursor-pointer"
                        >
                            Already have an account? <span className='text-[#015BA3]'>Login</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
