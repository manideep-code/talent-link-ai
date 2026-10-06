import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../../services/profileService';
import { profileImageOrFallback } from '../../utils/profileImage';
import { MapPin, Edit2, Mail, Building, Loader } from 'lucide-react';
const ClientProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await profileService.client.getProfile();
            setProfile(data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Fallback if no profile exists yet
                const userData = localStorage.getItem('user');
                const user = userData ? JSON.parse(userData) : {};
                setProfile({
                    first_name: user.name || 'Client',
                    last_name: '',
                    email: user.email || '',
                    company_name: '',
                    company_description: '',
                    location: '',
                });
            } else {
                setError('Failed to load profile');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-red-500">
                <p>{error}</p>
                <button
                    onClick={fetchProfile}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const profileImage = profileImageOrFallback(
        profile?.profile_image,
        profile?.first_name || profile?.email || 'Client'
    );

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 lg:px-6">
            <div className="w-full space-y-6">

                {/* Header / Basic Info */}
                <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 relative">
                    <button
                        onClick={() => navigate('/client/profile/edit')}
                        className="absolute top-6 right-6 p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-colors"
                        title="Edit Profile"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {profile.first_name || 'Client'} {profile.last_name}
                            </h1>
                            <div className="mt-2 flex flex-col items-center sm:items-start gap-1 text-gray-500">
                                {profile.company_name && (
                                    <div className="flex items-center gap-2 font-medium text-gray-700">
                                        <Building className="w-4 h-4" />
                                        <span>{profile.company_name}</span>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                {profile.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span>{profile.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company Description */}
                <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-600" />
                        About Company
                    </h2>
                    <div className="prose text-gray-600">
                        {profile.company_description ? (
                            <p className="whitespace-pre-wrap">{profile.company_description}</p>
                        ) : (
                            <p className="text-gray-400 text-sm">No company description added.</p>
                        )}
                    </div>
                </div>

                {/* Extended Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Projects */}
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">Top Projects</h2>
                        <div className="prose text-gray-600 text-sm">
                            {profile.projects ? (
                                <p className="whitespace-pre-wrap">{profile.projects}</p>
                            ) : (
                                <p className="text-gray-400 italic">No projects listed.</p>
                            )}
                        </div>
                    </div>

                    {/* Skills Required */}
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">Skills Required</h2>
                        <div className="prose text-gray-600 text-sm">
                            {profile.skills ? (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.split(',').map((skill, idx) => (
                                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic">No skills specified.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Previous Work */}
                <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">Portfolio & Previous Work</h2>
                    <div className="prose text-gray-600">
                        {profile.works ? (
                            <p className="whitespace-pre-wrap">{profile.works}</p>
                        ) : (
                            <p className="text-gray-400 italic text-sm">No portfolio added.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClientProfile;
