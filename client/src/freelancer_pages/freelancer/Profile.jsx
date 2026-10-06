import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../../services/profileService';
import { User, Briefcase, Link as LinkIcon, Edit2, Mail, Loader } from 'lucide-react';
 
import { resolveProfileImage } from '../../utils/profileImage';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await profileService.freelancer.getProfile();
            setProfile(data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Profile doesn't exist yet, use empty object/localstorage fallback
                const userData = localStorage.getItem('user');
                const user = userData ? JSON.parse(userData) : {};
                setProfile({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    skills: '',
                    portfolio: '',
                    works: '',
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

    // Fallback values
    const profileImage = resolveProfileImage(profile?.profile_image);

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-3 px-3 sm:px-4 lg:px-5">
                <div className="w-full space-y-6">

                    {/* Header / Basic Info */}
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 relative">
                        <button
                            onClick={() => navigate('/freelancer/profile/edit')}
                            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-colors"
                            title="Edit Profile"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <User className="w-16 h-16" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center sm:text-left flex-1">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {profile.first_name || 'User'} {profile.last_name}
                                </h1>
                                <div className="mt-2 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-gray-500">
                                    {profile.email && (
                                        <div className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            <span>{profile.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills ? profile.skills.split(',').map((skill, index) => (
                                <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                                    {skill.trim()}
                                </span>
                            )) : (
                                <p className="text-gray-400 text-sm">No skills added yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-indigo-600" />
                            Portfolio
                        </h2>
                        <div className="prose text-gray-600">
                            {profile.portfolio ? (
                                <p className="whitespace-pre-wrap">{profile.portfolio}</p>
                            ) : (
                                <p className="text-gray-400 text-sm">No portfolio details added.</p>
                            )}
                        </div>
                    </div>

                    {/* Works */}
                    <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            Work Experience
                        </h2>
                        <div className="prose text-gray-600">
                            {profile.works ? (
                                <p className="whitespace-pre-wrap">{profile.works}</p>
                            ) : (
                                <p className="text-gray-400 text-sm">No work history added.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default Profile;
