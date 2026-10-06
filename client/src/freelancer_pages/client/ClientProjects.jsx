import React, { useState, useEffect, useCallback } from "react";
import "../../App.css";
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  MapPin,
  Award,
  Tag,
  FileText,
  ArrowLeft,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import TalentMatchesModal from '../../components/Matching/TalentMatchesModal';

const INDIAN_CITIES = [
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'Delhi',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Noida'
];

const PROJECT_STATUS_OPTIONS = ['Open', 'Pending', 'Active', 'Completed', 'Cancelled'];

const STATUS_BADGE_CLASSES = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700'
};


const ClientProjects = () => {
  const navigate = useNavigate();
  const [postedProjects, setPostedProjects] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selectedMatchProject, setSelectedMatchProject] = useState(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);

  const fetchPostedProjects = useCallback(async () => {
    try {
      const response = await api.get('/projects/?mine=true');
      setPostedProjects(response.data);
    } catch (error) {
      setPostedProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchPostedProjects();
  }, [fetchPostedProjects]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    minBudget: '',
    maxBudget: '',
    duration: '',
    locationType: 'Remote',
    locationCity: '',
    experienceLevel: 'Any',
    projectType: 'Fixed Price'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      if (name === 'locationType' && value === 'Remote') {
        updated.locationCity = '';
      }
      return updated;
    });

    setErrors(prev => {
      if (!prev[name] && !(name === 'locationType' && prev.locationCity)) {
        return prev;
      }
      const updatedErrors = { ...prev };
      delete updatedErrors[name];
      if (name === 'locationType') {
        delete updatedErrors.locationCity;
      }
      if (name === 'locationCity') {
        delete updatedErrors.locationCity;
      }
      return updatedErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!formData.skills.trim()) {
      newErrors.skills = 'Please specify required skills';
    }

    if (formData.minBudget && formData.maxBudget) {
      if (Number(formData.minBudget) > Number(formData.maxBudget)) {
        newErrors.maxBudget = 'Maximum budget must be greater than minimum';
      }
    }

    if (
      (formData.locationType === 'On-site' || formData.locationType === 'Hybrid') &&
      !formData.locationCity
    ) {
      newErrors.locationCity = 'Select a city for on-site or hybrid work';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const locationValue =
        formData.locationType === 'Remote'
          ? 'Remote'
          : `${formData.locationType} - ${formData.locationCity}`;

      const payload = {
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        min_budget: formData.minBudget || null,
        max_budget: formData.maxBudget || null,
        duration: formData.duration,
        location: locationValue,
        experience_level: formData.experienceLevel,
        project_type: formData.projectType
      };

      const res = await api.post('/projects/', payload);
      console.log('Saved project:', res.data);

      setFormData({
        title: '',
        description: '',
        skills: '',
        minBudget: '',
        maxBudget: '',
        duration: '',
        locationType: 'Remote',
        locationCity: '',
        experienceLevel: 'Any',
        projectType: 'Fixed Price'
      });

      setShowPostForm(false);
      fetchPostedProjects();
      if (res.data) {
        setSelectedMatchProject(res.data);
        setMatchModalOpen(true);
      }
    } catch (err) {
      // Improved error logging for backend validation errors
      if (err.response && err.response.data) {
        console.error('Backend error:', err.response.data);
        alert('Error: ' + JSON.stringify(err.response.data));
      } else {
        console.error('Error saving project:', err);
        alert('Something went wrong while saving the project.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!formData.title.trim()) {
      setErrors(prev => ({
        ...prev,
        title: 'Title is required to save as draft'
      }));
      return;
    }

    if (
      (formData.locationType === 'On-site' || formData.locationType === 'Hybrid') &&
      !formData.locationCity
    ) {
      setErrors(prev => ({
        ...prev,
        locationCity: 'Select a city before saving'
      }));
      return;
    }

    try {
      setIsSubmitting(true);

      const locationValue =
        formData.locationType === 'Remote'
          ? 'Remote'
          : `${formData.locationType} - ${formData.locationCity}`;

      const payload = {
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        min_budget: formData.minBudget || null,
        max_budget: formData.maxBudget || null,
        duration: formData.duration,
        location: locationValue,
        experience_level: formData.experienceLevel,
        project_type: formData.projectType,
        status: 'Pending'
      };

      const res = await api.post('/projects/', payload);
      console.log('Saved draft project:', res.data);

      alert('📝 Project saved as draft!');
      navigate('/projects');
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Something went wrong while saving as draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (projectId, currentStatus, newStatus) => {
    if (!newStatus || newStatus === currentStatus) {
      return;
    }

    try {
      setStatusUpdatingId(projectId);
      await api.patch(`/projects/${projectId}/`, { status: newStatus });
      setPostedProjects(prev =>
        prev.map(project =>
          project.id === projectId ? { ...project, status: newStatus } : project
        )
      );
    } catch (err) {
      console.error('Error updating status:', err.response?.data || err);
      alert('Could not update project status. Please try again.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const [showPostForm, setShowPostForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1380px] mx-auto w-full">
        {!showPostForm ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Your Posted Projects</h1>
              <button
                onClick={() => setShowPostForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-indigo-700 hover:to-blue-700 transition-all"
              >
                Post a Job
              </button>
            </div>
            <div className="space-y-6">
              {postedProjects && postedProjects.length > 0 ? (
                postedProjects.map(project => {
                  const statusKey = (project.status || '').toLowerCase();
                  const statusBadgeClass = STATUS_BADGE_CLASSES[statusKey] || STATUS_BADGE_CLASSES.default;

                  return (
                    <div key={project.id} className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 md:p-8">
                      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold text-gray-800">{project.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass}`}>{project.status || 'N/A'}</span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{project.location || 'N/A'}</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(project.skills) ? project.skills : typeof project.skills === 'string' ? project.skills.split(',').map(s => s.trim()).filter(Boolean) : []).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{skill}</span>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600">
                            <div className="flex items-center"><FaIndianRupeeSign className="w-4 h-4 mr-1" /><span>₹{project.min_budget} - ₹{project.max_budget}</span></div>
                            <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /><span>{project.duration || 'N/A'}</span></div>
                            <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /><span>{project.location || 'N/A'}</span></div>
                            <div className="flex items-center"><span className="font-semibold">Type:</span> <span>{project.project_type || 'N/A'}</span></div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between gap-6 rounded-xl border border-gray-100 bg-slate-50/60 p-4 lg:p-5">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                              <p className="text-lg font-semibold text-gray-800">{project.status || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1">Update status</label>
                              <select
                                value={project.status || 'Open'}
                                onChange={e => handleStatusChange(project.id, project.status, e.target.value)}
                                disabled={statusUpdatingId === project.id}
                                className="w-full min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100"
                              >
                                {PROJECT_STATUS_OPTIONS.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                              {statusUpdatingId === project.id && (
                                <p className="mt-1 text-xs text-gray-500">Updating status...</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMatchProject(project);
                                setMatchModalOpen(true);
                              }}
                              className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow flex items-center justify-center gap-1.5"
                            >
                              <Sparkles size={16} />
                              <span>AI Talent Matches</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-white/90 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xl font-semibold text-gray-700 mb-2">No projects posted yet</p>
                  <p className="text-gray-500 mb-6">Your posted projects will appear here.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <button
                onClick={() => setShowPostForm(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Back to Projects</span>
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Briefcase size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Post New Project</h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">
                    Find the perfect freelancer for your project
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-h-[70vh]">
              {/* Form Card */}
              <div className="lg:col-span-2 flex flex-col bg-white/95 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 h-full justify-between">
                <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full space-y-4 sm:space-y-6">
                  {/* Project Title */}
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <FileText size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                      <span>Project Title <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Build a React dashboard"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>
                  {/* Project Description */}
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <FileText size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                      <span>Project Description <span className="text-red-500">*</span></span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Describe your project, requirements, and goals in detail..."
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>
                  {/* Required Skills */}
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <Tag size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                      <span>Required Skills <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="e.g. React, Node.js, PostgreSQL"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.skills ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.skills && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.skills}</p>
                    )}
                  </div>
                  {/* Budget Range */}
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <FaIndianRupeeSign size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                      <span>Budget Range (₹)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <input
                          type="number"
                          name="minBudget"
                          value={formData.minBudget}
                          onChange={handleChange}
                          placeholder="Min Budget (₹)"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          name="maxBudget"
                          value={formData.maxBudget}
                          onChange={handleChange}
                          placeholder="Max Budget (₹)"
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                            errors.maxBudget ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.maxBudget && (
                          <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.maxBudget}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Duration */}
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <Clock size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                      <span>Project Duration</span>
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g. 2 weeks, 3 months"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {/* Experience Level & Project Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Experience Level */}
                    <div>
                      <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        <Award size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                        <span>Experience Level</span>
                      </label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleChange}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="Any">Any Level</option>
                        <option value="Junior">Junior (0-2 years)</option>
                        <option value="Mid-level">Mid-level (2-5 years)</option>
                        <option value="Senior">Senior (5+ years)</option>
                      </select>
                    </div>
                    {/* Project Type */}
                    <div>
                      <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        <Briefcase size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                        <span>Project Type</span>
                      </label>
                      <select
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="Fixed Price">Fixed Price</option>
                        <option value="Hourly">Hourly Rate</option>
                      </select>
                    </div>
                  </div>
                  {/* Location */}
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <MapPin size={16} className="sm:w-4.5 sm:h-4.5 text-indigo-600 flex-shrink-0" />
                      <span>Location Preference</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <select
                        name="locationType"
                        value={formData.locationType}
                        onChange={handleChange}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>

                      {(formData.locationType === 'On-site' || formData.locationType === 'Hybrid') && (
                        <select
                          name="locationCity"
                          value={formData.locationCity}
                          onChange={handleChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="">Select city</option>
                          {INDIAN_CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    {errors.locationCity && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.locationCity}</p>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                    {/* Post Project (active) */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                      {isSubmitting ? 'Posting...' : 'Post Project'}
                    </button>
                    {/* Save as Draft */}
                    <button
                      type="button"
                      onClick={handleSaveAsDraft}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-yellow-50 text-yellow-800 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-yellow-100 transition-all border border-yellow-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Save as Draft
                    </button>
                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={() => setShowPostForm(false)}
                      className="w-full sm:w-auto sm:flex-initial bg-gray-100 text-gray-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
              {/* Right Column: Tips and Posted Projects */}
              <div className="lg:col-span-1 flex flex-col gap-4 h-full">
                {/* Tips Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-4 border border-indigo-100 h-fit">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                    Tips for a Great Project Post
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                      <span>Be specific about your requirements and deliverables</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                      <span>Set a realistic budget based on project complexity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                      <span>List all required skills to attract the right freelancers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                      <span>Include timeline expectations and any important deadlines</span>
                    </li>
                  </ul>
                </div>
                {/* Posted Projects Section (right column) */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Your Posted Projects</h2>
                  <div className="space-y-4 overflow-y-auto">
                    {postedProjects && postedProjects.length > 0 ? (
                      postedProjects.map(project => (
                        <div key={project.id} className="bg-white/95 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
                          <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="text-base font-semibold text-gray-800">{project.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{project.status}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{project.location || 'N/A'}</span>
                            </div>
                            <p className="text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(Array.isArray(project.skills) ? project.skills : typeof project.skills === 'string' ? project.skills.split(',').map(s => s.trim()).filter(Boolean) : []).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{skill}</span>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center"><FaIndianRupeeSign className="w-3 h-3 mr-1" /><span>₹{project.min_budget} - ₹{project.max_budget}</span></div>
                              <div className="flex items-center"><Clock className="w-3 h-3 mr-1" /><span>{project.duration || 'N/A'}</span></div>
                              <div className="flex items-center"><MapPin className="w-3 h-3 mr-1" /><span>{project.location || 'N/A'}</span></div>
                              <div className="flex items-center"><span className="font-semibold">Type:</span> <span>{project.project_type || 'N/A'}</span></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 bg-white/90 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-base font-semibold text-gray-700 mb-2">No projects posted yet</p>
                        <p className="text-gray-500 mb-2 text-xs">Your posted projects will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <TalentMatchesModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        project={selectedMatchProject}
      />
    </div>
  );
};

export default ClientProjects;
