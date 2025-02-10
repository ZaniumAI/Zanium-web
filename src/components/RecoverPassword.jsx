import React, { useState } from 'react';
import { Input, Button, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import {auth} from '../lib/firebase'
const RecoverPassword = () => {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const handleLoginRedirect = () => {
        navigate('/login');
    };
    const handleRecover=()=>{
        console.log('Recover Password');
    }
    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-1 justify-center items-center bg-gray-50 py-16">
                <div className="bg-white p-8 flex flex-col gap-4 rounded-lg shadow-lg w-[90vw] sm:w-[400px]">
                    <h2 className="text-2xl text-[#015BA3] font-bold text-center ">Recover Password</h2>
                    <p className='text-center'>Please enter your registered email address. We will send you instructions to rest your password</p>
                    <div className="mb-4">
                        <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#015BA3]"
                        />
                    </div>
                    <Button
                        type="primary"
                        className="w-full py-5 mb-4 bg-[#015BA3] text-white font-semibold hover:bg-[#015BA3] focus:ring-2 focus:ring-[#015BA3]"
                        onClick={handleRecover}
                    >
                        RecoverPassword
                    </Button>

                    <div className="flex flex-col items-center gap-2 justify-between text-sm text-gray-500">
                        <a
                            onClick={handleLoginRedirect}
                            className="cursor-pointer text-[#015BA3] "
                        >
                            Back to Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RecoverPassword