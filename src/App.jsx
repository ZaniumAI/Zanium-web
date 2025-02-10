import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import 'antd/dist/reset.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import Router components
import Login from './components/Login';
import Signup from './components/Signup';
import RecoverPassword from './components/RecoverPassword';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar is open on larger screens

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen); // Toggle sidebar visibility
  };

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth <= 768) {
  //       setIsSidebarOpen(false); // Close sidebar on mobile
  //     } else {
  //       setIsSidebarOpen(true); // Open sidebar on larger screens
  //     }
  //   };

  //   window.addEventListener('resize', handleResize); // Add resize event listener

  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);

  return (
    <Router>
      <div className="flex flex-col h-screen">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          {isSidebarOpen && <Sidebar />}
          <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[16vw]' : 'ml-0'}`}>
            <Routes>
              <Route path="/" element={<Chat isSidebarOpen={isSidebarOpen} />} />
              <Route path='/login' element={<Login />}/>
              <Route path='/signup' element={<Signup />}/>
              <Route path='/forgot-password' element={<RecoverPassword />}/>
              <Route path="/uploads/:id" element={<Chat isSidebarOpen={isSidebarOpen} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
