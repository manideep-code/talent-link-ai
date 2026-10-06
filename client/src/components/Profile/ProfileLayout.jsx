import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import profileService from '../../services/profileService.js';

export default function ProfileLayout({ children, title = 'Profile', basePath = '/profile' }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : {};
        if (user.role === 'freelancer') {
          const p = await profileService.freelancer.getProfile();
          setProfile(p);
        } else if (user.role === 'client') {
          const p = await profileService.client.getProfile();
          setProfile(p);
        }
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  const tabs = [
    { to: `${basePath}`, label: 'Profile' },
    { to: `${basePath}/skills`, label: 'Skills' },
    { to: `${basePath}/portfolio`, label: 'Portfolio' },
    { to: `${basePath}/work`, label: 'Work' },
    { to: `${basePath}/settings`, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-3">
      <div className="w-full px-3 sm:px-4 lg:px-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <aside className="w-full lg:w-64 bg-white rounded-lg p-5 shadow">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {profile?.first_name?.[0] || 'U'}{profile?.last_name?.[0] || ''}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{(profile && `${profile.first_name || ''} ${profile.last_name || ''}`) || 'Your Profile'}</h3>
                {profile?.company_name ? (
                  <p className="text-sm text-gray-500">{profile.company_name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Profile information</p>
                )}
              </div>
            </div>

            <nav className="mt-6 space-y-1">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6">
              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md">Edit profile</button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg p-5 shadow">
              <h2 className="text-2xl font-bold">{title}</h2>
              <div className="mt-4">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

