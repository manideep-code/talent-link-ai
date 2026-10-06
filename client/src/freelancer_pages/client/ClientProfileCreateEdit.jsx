import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../../components/Profile/ProfileLayout.jsx';
import FileUpload from '../../components/FileUpload.jsx';
import ProfileCompletenessBar from '../../components/ProfileCompletenessBar.jsx';
import profileService from '../../services/profileService.js';

const ClientProfileCreateEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    company_description: '',
    website: '',
    phone: '',
    location: '',
    country: '',
    bio: '',
    profile_image: null,
    documents: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileService.client.getProfile();
      setForm(profile);
      setProfileCompleteness(profile.profile_completeness || 0);
      setError('');
    } catch (err) {
      setError('');
      setLoading(false);
    }
  };

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (key) => (file) => {
    setForm((prev) => ({ ...prev, [key]: file }));
  };

  const isAuthenticated = () => {
    return !!(localStorage.getItem('access_token') || localStorage.getItem('token'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated()) {
      setError('You must be logged in to create or update your profile. Redirecting to login...');
        setTimeout(() => navigate('/login'), 900);
      return;
    }

    try {
      setLoading(true);
      let response;

      if (form.id) {
        response = await profileService.client.updateProfile(form);
      } else {
        response = await profileService.client.createProfile(form);
      }

      setProfileCompleteness(response.profile_completeness);
      setSuccess(form.id ? 'Profile updated successfully!' : 'Profile created successfully!');

      setTimeout(() => {
        navigate('/client/profile');
      }, 1500);
    } catch (err) {
      const serverData = err?.response?.data;
      let message = 'An error occurred while saving the profile';
      if (serverData) {
        if (typeof serverData === 'string') message = serverData;
        else if (serverData.detail) message = serverData.detail;
        else message = JSON.stringify(serverData);
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
      console.error('Profile save error:', err);

      if (err?.response?.status === 401) {
        setTimeout(() => navigate('/login'), 900);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && form.id) {
    return (
      <ProfileLayout
        title={form.first_name ? 'Edit Profile' : 'Create Profile'}
        basePath="/client/profile"
      >
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout
      title={form.id ? 'Edit Profile' : 'Create Profile'}
      basePath="/client/profile"
    >
      <div className="w-full">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ProfileCompletenessBar percentage={profileCompleteness} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Personal Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First name</label>
                <input
                  value={form.first_name}
                  onChange={handleChange('first_name')}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last name</label>
                <input
                  value={form.last_name}
                  onChange={handleChange('last_name')}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <FileUpload
                accept="image/*"
                onChange={handleFileChange('profile_image')}
                value={form.profile_image}
                preview
                helperText="JPG, PNG or GIF (max 5MB)"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Company Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                value={form.company_name}
                onChange={handleChange('company_name')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Acme Inc."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Company Description</label>
              <textarea
                value={form.company_description}
                onChange={handleChange('company_description')}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell us about your company..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Company Website</label>
              <input
                type="url"
                value={form.website}
                onChange={handleChange('website')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Company Documents</label>
              <FileUpload
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange('documents')}
                value={form.documents}
                helperText="PDF, DOC or DOCX (max 5MB)"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  value={form.location}
                  onChange={handleChange('location')}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                value={form.country}
                onChange={handleChange('country')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="United States"
              />
            </div>
          </div>

          {/* About */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">About</h3>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={handleChange('bio')}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tell us more about yourself..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : form.id ? 'Update Profile' : 'Create Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/client/profile')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </ProfileLayout>
  );
};

export default ClientProfileCreateEdit;

