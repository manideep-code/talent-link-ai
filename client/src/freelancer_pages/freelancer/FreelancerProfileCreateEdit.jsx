import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../../components/Profile/ProfileLayout.jsx';
import FileUpload from '../../components/FileUpload.jsx';
import ProfileCompletenessBar from '../../components/ProfileCompletenessBar.jsx';
import profileService from '../../services/profileService.js';

const FreelancerProfileCreateEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    title: '',
    bio: '',
    location: '',
    languages: '',
    hourly_rate: '',
    availability: true,
    skills: '',
    portfolio_links: '',
    profile_image: null,
    documents: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileService.freelancer.getProfile();
      setForm(profile);
      setProfileCompleteness(profile.profile_completeness || 0);
      setError('');
    } catch (err) {
      setError('');
      setLoading(false);
    } finally {
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
        response = await profileService.freelancer.updateProfile(form);
      } else {
        response = await profileService.freelancer.createProfile(form);
      }

      setProfileCompleteness(response.profile_completeness);
      setSuccess(form.id ? 'Profile updated successfully!' : 'Profile created successfully!');
      
      setTimeout(() => {
        navigate('/freelancer/profile');
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
        basePath="/freelancer/profile"
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
      basePath="/freelancer/profile"
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
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>

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
              <label className="block text-sm font-medium text-gray-700">Professional headline</label>
              <input
                value={form.title}
                onChange={handleChange('title')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Full Stack Developer | React Expert"
              />
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

          {/* Professional Details */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Professional Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">About / Bio</label>
              <textarea
                value={form.bio}
                onChange={handleChange('bio')}
                rows={5}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell us about your experience and expertise..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
              <input
                value={form.skills}
                onChange={handleChange('skills')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="React, JavaScript, Node.js, MongoDB"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Portfolio Links (comma separated)</label>
              <input
                value={form.portfolio_links}
                onChange={handleChange('portfolio_links')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://myportfolio.com, https://github.com/username"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Resume / CV</label>
              <FileUpload
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange('documents')}
                value={form.documents}
                helperText="PDF, DOC or DOCX (max 5MB)"
              />
            </div>
          </div>

          {/* Location & Availability */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Location & Availability</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  value={form.location}
                  onChange={handleChange('location')}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="San Francisco, USA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Languages (comma separated)</label>
                <input
                  value={form.languages}
                  onChange={handleChange('languages')}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="English, Spanish, French"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Hourly Rate (₹)</label>
              <input
                type="number"
                value={form.hourly_rate}
                onChange={handleChange('hourly_rate')}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="75"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.availability}
                onChange={handleChange('availability')}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Available for work</span>
            </label>
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
              onClick={() => navigate('/freelancer/profile')}
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

export default FreelancerProfileCreateEdit;

