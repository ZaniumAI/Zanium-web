import React, { useState, useEffect, useRef } from 'react';
import { FaBars } from 'react-icons/fa';
import logo from '../assets/logo.png';
import avatar from '../assets/avatar.png';
import { auth } from '../lib/firebase';
import { useLocalContext } from '../context/context';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Button, Col, Row } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, setUser } = useLocalContext(); // Destructure context values
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown menu
  const modalRef = useRef(null); // Ref for the modal
  const navigate = useNavigate();

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set user in context if logged in
      } else {
        setUser(null); // Clear user from context if logged out
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [setUser]);

  const loginRedirect=()=>{
    navigate('/login');
  }
  const signupRedirect=()=>{
    navigate('/signup');
  }

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out user
      setUser(null); // Clear user context on sign out
      setIsDropdownOpen(false); // Close dropdown after logout
      navigate('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown visibility
  };

  // Close modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false); // Close modal if clicked outside
      }
    };

    if (isModalOpen) {
      window.addEventListener('mousedown', handleClickOutside); // Add event listener
    } else {
      window.removeEventListener('mousedown', handleClickOutside); // Cleanup on modal close
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside); // Cleanup on unmount
    };
  }, [isModalOpen]);

  return (
    <>
      <div className='w-full flex justify-between items-center z-50 px-4 sm:px-6 py-3 shadow-md fixed top-0 bg-white'>
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Render hamburger icon only if the user is logged in */}
          {user && (
            <FaBars
              className="text-black text-2xl cursor-pointer"
              onClick={toggleSidebar} // Toggle sidebar on click
            />
          )}
          <img src={logo} className='h-10 sm:h-12' alt="Logo" /> {/* Responsive logo size */}
        </div>
        <div className="flex items-center gap-4 sm:gap-8 relative">
          {user ? (
            <>
              {/* Display user's name and avatar on larger screens, only avatar on smaller screens */}
              <span className="hidden sm:block font-poppins text-base sm:text-lg text-black">
                {user.displayName || 'User'}
              </span>
              <img
                src={user.photoURL || avatar}
                className="h-8 sm:h-10 w-8 sm:w-10 rounded-full cursor-pointer"
                alt="Avatar"
                onClick={toggleDropdown} // Show dropdown on click
              />
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                  <button
                    className="block px-4 py-2 text-left text-red-600 hover:bg-gray-200 w-full"
                    onClick={handleLogout} // Trigger logout on click
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            // Show Login and Signup buttons when user is not logged in
            <div className="flex gap-4">
              <Button
                type="primary"
                style={{
                  backgroundColor: '#015BA3',
                  borderColor: '#015BA3',
                  color: 'white',
                  width: '60px',
                }}
                onClick={loginRedirect} // Open the modal for login/signup
              >
                Login
              </Button>
              <Button
                style={{
                  backgroundColor: 'white',
                  borderColor: '#015BA3',
                  color: '#015BA3',
                  width: '60px',
                }}
                onClick={signupRedirect} // Open the modal for login/signup
              >
                Signup
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Google Sign-In */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md w-[90vw] md:w-[30vw]" ref={modalRef}>
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-black">Sign in to your account</h2>
              <p className="text-gray-500 mb-8">Generate Reports and more!</p>
              <Row gutter={[16, 16]} justify="center">
                <Col span={24}>
                  <Button
                    type="primary"
                    className="w-full"
                    style={{ backgroundColor: '#db4437', borderColor: '#db4437' }}
                    icon={<GoogleOutlined />}
                    onClick={handleGoogleSignIn}
                  >
                    Sign in with Google
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
