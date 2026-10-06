import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../../services/profileService';
import { Upload, X, Loader } from 'lucide-react';

const EditClientProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        company_name: '',
        company_description: '',
        location: '',
        projects: '',
        skills: '',
        works: '',
        profile_image: null,
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await profileService.client.getProfile();
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    company_name: data.company_name || '',
                    company_description: data.company_description || '',
                    location: data.location || '',
                    projects: data.projects || '',
                    skills: data.skills || '',
                    works: data.works || '',
                    profile_image: null
                });

                if (data.profile_image) {
                    setPreviewImage(data.profile_image.startsWith('http') ? data.profile_image : `${process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'}${data.profile_image}`);
                }

            } catch (err) {
                // If 404, we just leave defaults (empty) but stop loading
                console.error('Failed to load profile (might be new)', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, profile_image: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            // Check if profile exists (by checking if we fetched an ID? No, 'me' usually handles update/create logic)
            // Ideally backend 'me' handles create if not exists on POST/PUT. Service uses PATCH.
            // If it's a new profile, we might need POST if the backend requires it, 
            // BUT my backend `me` implementation handles PUT/PATCH for creation too if !profile.
            await profileService.client.updateProfile(formData);
            navigate('/client/profile');
        } catch (err) {
            console.error(err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-indigo-600 mb-4" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 py-3 px-3 sm:px-4 lg:px-5">
            <div className="w-full bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-9">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Client Profile</h1>
                    <button
                        onClick={() => navigate('/client/profile')}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center">
                            <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                                A clear company logo or brand image helps freelancers recognize you faster.
                            </p>
                            <label className="mt-4 w-full cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Change Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        placeholder="Acme Inc."
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="New Delhi, India"
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Company Description</label>
                                    <textarea
                                        name="company_description"
                                        rows={4}
                                        value={formData.company_description}
                                        onChange={handleChange}
                                        placeholder="Tell us about your mission, team size, and what it's like to work with you..."
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Top Projects</label>
                                    <textarea
                                        name="projects"
                                        rows={3}
                                        value={formData.projects}
                                        onChange={handleChange}
                                        placeholder="List the flagship initiatives or current focus areas..."
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Skills Preferred</label>
                                    <textarea
                                        name="skills"
                                        rows={3}
                                        value={formData.skills}
                                        onChange={handleChange}
                                        placeholder="e.g. React, Python, UI/UX, Product Strategy"
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Work Culture</label>
                                    <textarea
                                        name="works"
                                        rows={3}
                                        value={formData.works}
                                        onChange={handleChange}
                                        placeholder="Share how your team collaborates, communication norms, or links to culture decks."
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/client/profile')}
                            className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditClientProfile;
