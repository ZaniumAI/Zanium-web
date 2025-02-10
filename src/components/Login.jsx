import React, { useState } from 'react';
import { Input, Button, Row, Col, notification } from 'antd'; // Import notification from Ant Design
import { useNavigate } from 'react-router-dom'; // Updated for react-router v6
import { auth } from '../lib/firebase'; // Assuming firebase config is correctly set up
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase authentication method

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // Using useNavigate hook

    const handleLogin = async () => {
        try {
            // Sign in with Firebase authentication
            await signInWithEmailAndPassword(auth, email, password);
            
            // On successful login, redirect to home/dashboard page or any other page
            notification.success({
                message: 'Login Successful',
                description: 'You have logged in successfully!',
                duration: 2,
            });
            navigate('/'); // Replace '/home' with your desired path
        } catch (error) {
            // Human-readable error messages based on Firebase error codes
            let errorMessage = '';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address. Please enter a valid email.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user account has been disabled. Please contact support.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred. Please try again later.';
            }

            // Show error notification with human-readable message
            notification.error({
                message: 'Login Failed',
                description: errorMessage,
                duration: 2,
            });
        }
    };

    const handleSignupRedirect = () => {
        navigate('/signup'); // Redirect to Signup page
    };

    const handleForgotPasswordRedirect = () => {
        navigate('/forgot-password'); // Redirect to Forgot Password page
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-1 justify-center items-center bg-gray-50 py-16">
                <div className="bg-white p-8 rounded-lg shadow-lg w-[90vw] sm:w-[400px]">
                    <h2 className="text-2xl text-[#015BA3] font-bold text-center mb-6">Login</h2>

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

                    {/* Login Button */}
                    <Button
                        type="primary"
                        className="w-full py-5 mb-4 bg-[#015BA3] text-white font-semibold hover:bg-[#015BA3] focus:ring-2 focus:ring-[#015BA3]"
                        onClick={handleLogin}
                    >
                        Login
                    </Button>

                    {/* Forgot Password and Signup links */}
                    <div className="flex flex-col items-center gap-2 justify-between text-sm text-gray-500">
                        <a
                            onClick={handleForgotPasswordRedirect}
                            className="text-[#015BA3] cursor-pointer"
                        >
                            Forgot Password?
                        </a>
                        <a
                            onClick={handleSignupRedirect}
                            className="cursor-pointer"
                        >
                            Don't have an account? <span className='text-[#015BA3]'>Sign up</span> 
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
