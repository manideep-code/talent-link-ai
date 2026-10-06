import React, { useEffect, useState } from "react";
import { ChevronDown, User, Settings, LogOut, Briefcase } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profileService.js';
import { resolveProfileImage } from '../utils/profileImage';

const ProfileMenu = ({ isOpen, setIsOpen, menuRef, buttonRef }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const userData = localStorage.getItem('user');
        let role = null;
        if (userData) role = JSON.parse(userData).role;

        if (role === 'freelancer') {
          const p = await profileService.freelancer.getProfile();
          setProfile(p);
        } else if (role === 'client') {
          const p = await profileService.client.getProfile();
          setProfile(p);
        }
      } catch (err) {
        console.error('Failed to load profile in ProfileMenu:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : {};

  const name = profile?.first_name || user?.first_name || user?.username || 'User';
  const email = user?.email || profile?.email || '';
  const initials = (profile?.first_name?.[0] || user?.first_name?.[0] || 'U') + (profile?.last_name?.[0] || user?.last_name?.[0] || '');

  const role = user?.role;

  const avatarSrc = resolveProfileImage(profile?.profile_image);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${avatarSrc ? '' : 'bg-indigo-600'}`}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="text-white text-sm font-medium">{initials}</span>
          )}
        </div>

        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
        >
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            {email && <p className="text-xs text-gray-500">{email}</p>}
            {loading && <p className="text-xs text-gray-400">Loading profile...</p>}
          </div>

          {/* Show profile/settings links based on role */}
          {role === 'freelancer' && (
            <>
              <button
                onClick={() => navigate('/freelancer/profile')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="h-4 w-4 mr-3" />
                Profile
              </button>
              <button
                onClick={() => navigate('/freelancer/profile/settings')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
            </>
          )}
          {role === 'client' && (
            <>
              <button
                onClick={() => navigate('/client/profile')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="h-4 w-4 mr-3" />
                Profile
              </button>
              <button
                onClick={() => navigate('/client/projects')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Briefcase className="h-4 w-4 mr-3" />
                My Projects
              </button>
              <button
                onClick={() => navigate('/client/profile/settings')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
            </>
          )}

          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('access_token');
                window.location.href = '/login';
              }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

