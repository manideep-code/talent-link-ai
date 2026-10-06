import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../../components/Profile/ProfileLayout.jsx';
import ProfileCompletenessBar from '../../components/ProfileCompletenessBar.jsx';
import profileService from '../../services/profileService.js';
import { MessageCircle, Briefcase, Edit, Trash2, Download } from 'lucide-react';
import { resolveProfileImage } from '../../utils/profileImage';

const FreelancerProfileView = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.freelancer.getProfile();
      setProfile(data);
      setError('');
    } catch (err) {
      setError('Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => navigate('/freelancer/profile/edit');

  const handleDelete = async () => {
    if (!confirm('Delete profile? This cannot be undone.')) return;
    try {
      setLoading(true);
      await profileService.freelancer.deleteProfile(profile.id);
      navigate('/freelancer');
    } catch (err) {
      setError('Failed to delete profile');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProfileLayout title="Profile" basePath="/freelancer/profile">
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </ProfileLayout>
    );
  }

  if (error || !profile) {
    return (
      <ProfileLayout title="Profile" basePath="/freelancer/profile">
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">No Profile Found</h2>
            <p className="mb-6 text-gray-600">You don't have a profile yet. Create one to showcase your skills.</p>
            <button
              onClick={() => navigate('/freelancer/profile/edit')}
              className="px-6 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Profile
            </button>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  const avatarSrc = resolveProfileImage(profile?.profile_image);

  return (
    <ProfileLayout title="Profile" basePath="/freelancer/profile">
      <div className="space-y-6 w-full py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl p-6 md:p-8">
          <div className="flex-shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
                {profile.first_name?.[0] || 'A'}{profile.last_name?.[0] || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.title && (
              <p className="text-lg text-gray-700 mt-2">{profile.title}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.hourly_rate && <span>💰 ₹{profile.hourly_rate}/hr</span>}
              {profile.availability && <span className="text-green-600">✓ Available</span>}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/client/messages')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <MessageCircle size={18} />
                Message
              </button>
              <button
                onClick={() => navigate('/client/contracts')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <Briefcase size={18} />
                Hire Me
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Edit size={18} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="bg-white p-6 rounded-lg shadow">
          <ProfileCompletenessBar percentage={profile.profile_completeness || 0} />
        </div>

        {/* About Section */}
        {profile.bio && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">About</h2>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* Skills Section */}
        {profile.skills && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(',').map((skill, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full bg-indigo-700 text-white text-sm font-medium"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Languages Section */}
        {profile.languages && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.split(',').map((language, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-lg bg-blue-100 text-blue-900 text-sm font-medium"
                >
                  {language.trim()}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio Section */}
        {profile.portfolio_links && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Portfolio</h2>
            <div className="space-y-2">
              {profile.portfolio_links.split(',').map((link, i) => (
                <a
                  key={i}
                  href={link.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  🔗 {link.trim()}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Documents Section */}
        {profile.documents && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Documents</h2>
            <a
              href={profile.documents.startsWith('http') ? profile.documents : `${apiBaseUrl}${profile.documents}`}
              download
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
            >
              <Download size={18} />
              {profile.documents.split('/').pop()}
            </a>
          </section>
        )}
      </div>
    </ProfileLayout>
  );
};

export default FreelancerProfileView;

