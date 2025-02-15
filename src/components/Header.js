import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { UserIcon, ArrowRightOnRectangleIcon, ClockIcon } from '@heroicons/react/24/solid';

function Header({ disableNavigation }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const auth = getAuth();

  const handleLogout = async () => {
    if (disableNavigation) {
      alert('Please complete or end the interview before logging out.');
      return;
    }

    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const viewPreviousReports = () => {
    if (disableNavigation) {
      alert('Please complete or end the interview before viewing previous reports.');
      return;
    }
    navigate('/reports-history');
  };

  const handleLogoClick = () => {
    if (disableNavigation) {
      alert('Please complete or end the interview before navigating away.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <header className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <button 
              onClick={handleLogoClick}
              className="focus:outline-none flex items-center space-x-2"
              disabled={disableNavigation}
            >
              <img src="/Twemoji_1f351.svg.png" alt="MockDiddy Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                MockDiddy
              </h1>
            </button>
          </div>
          
          <div className="relative">
            <button
              onClick={() => !disableNavigation && setShowDropdown(!showDropdown)}
              className={`flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none px-4 py-2 rounded-lg transition-all duration-200 ${
                disableNavigation ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
              disabled={disableNavigation}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <UserIcon className="h-5 w-5" />
              </div>
              <span className="font-medium">{auth.currentUser?.displayName || 'Profile'}</span>
            </button>

            {showDropdown && !disableNavigation && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 transform transition-all duration-200 animate-fade-in">
                <div className="py-1" role="menu">
                  <button
                    onClick={viewPreviousReports}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <ClockIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Previous Reports</span>
                      <span className="text-xs text-gray-500">View your interview history</span>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Logout</span>
                      <span className="text-xs text-red-500">End your session</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header; 