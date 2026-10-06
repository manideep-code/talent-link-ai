import React, { useEffect, useState } from 'react';
import ProfileLayout from '../../components/Profile/ProfileLayout.jsx';
import profileService from '../../services/profileService';

const ClientProfileView = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await profileService.client.getProfile();
        setProfile(p);
      } catch (err) {
        console.error('Failed to load client profile view', err);
        setProfile(null);
      }
    };
    load();
  }, []);

  return (
    <ProfileLayout title="Profile" basePath="/client/profile">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded shadow flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200" />
              <div>
                <div className="text-xl font-bold">{profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''}</div>
                {profile?.company_name && (
                  <div className="text-sm text-gray-500">{profile.company_name}{profile.location ? ` · ${profile.location}` : ''}</div>
                )}
                {profile?.company_description && (
                  <div className="text-sm text-gray-500 mt-2">{profile.company_description}</div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-white p-6 rounded shadow">
              <div className="text-lg font-semibold">My Projects</div>
              <div className="mt-3 text-sm text-gray-600">No projects yet</div>
            </div>

            <div className="mt-6 bg-white p-6 rounded shadow">
              <div className="text-lg font-semibold">Messages</div>
              <div className="mt-3 text-sm text-gray-600">No messages yet</div>
            </div>
          </div>

          <aside>
            <div className="bg-white p-6 rounded shadow">
              <div className="text-lg font-semibold">Account Settings</div>
              <div className="mt-3 text-sm text-gray-600">Manage your password and security preferences</div>
            </div>

            <div className="mt-6 bg-white p-6 rounded shadow">
              <div className="text-lg font-semibold text-red-600">Danger Zone</div>
            </div>
          </aside>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ClientProfileView;

