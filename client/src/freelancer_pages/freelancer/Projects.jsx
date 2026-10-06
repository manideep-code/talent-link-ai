
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Clock, MapPin, User, Gift, Sparkles } from 'lucide-react';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import matchingService from '../../services/matchingService';
import profileService from '../../services/profileService';
import ClientProfileModal from '../../components/Modals/ClientProfileModal';
import { resolveProfileImage } from '../../utils/profileImage';

const getLocationType = (location = '') => {
  const normalized = location.toLowerCase();
  if (normalized.startsWith('on-site')) return 'on-site';
  if (normalized.startsWith('hybrid')) return 'hybrid';
  if (normalized.startsWith('remote')) return 'remote';
  return 'all';
};

const formatBudgetLabel = (minBudget, maxBudget) => {
  const hasValue = (value) => value !== null && value !== undefined && value !== '';

  if (hasValue(minBudget) && hasValue(maxBudget) && minBudget !== maxBudget) {
    return `₹${minBudget} - ₹${maxBudget}`;
  }
  if (hasValue(minBudget)) {
    return `₹${minBudget}`;
  }
  if (hasValue(maxBudget)) {
    return `₹${maxBudget}`;
  }
  return 'N/A';
};

const STATUS_COLORS = {
  Open: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Active: 'bg-blue-100 text-blue-700',
  Completed: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-red-100 text-red-700'
};

const STATUS_FILTERS = ['all', 'AI Recommended', 'Open', 'Pending', 'Active', 'Completed', 'Cancelled'];

export default function FreelancerProjects() {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientModalLoading, setClientModalLoading] = useState(false);
  const [clientModalError, setClientModalError] = useState('');
  const [selectedClientProfile, setSelectedClientProfile] = useState(null);
  const [clientProfileFallback, setClientProfileFallback] = useState({ name: '', email: '' });
  const [clientProfiles, setClientProfiles] = useState({});

  const fetchJobs = useCallback(async () => {
    try {
      const jobsData = await jobService.getJobs();
      setJobs(jobsData);
    } catch (err) {
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (statusFilter === 'AI Recommended' && recommendedJobs.length === 0) {
      matchingService.getRecommendedProjects()
        .then(rec => setRecommendedJobs(rec))
        .catch(e => console.error('Failed to load recommended jobs', e));
    }
  }, [statusFilter, recommendedJobs.length]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const currentDataset = statusFilter === 'AI Recommended' ? (recommendedJobs.length > 0 ? recommendedJobs : jobs) : jobs;

  const filteredJobs = currentDataset.filter(j => {
    const titleText = j.title ? String(j.title) : '';
    const clientName = j.client_name ? String(j.client_name) : '';
    const descriptionText = j.description ? String(j.description) : '';

    const matchesSearch =
      normalizedSearch.length === 0 ||
      titleText.toLowerCase().includes(normalizedSearch) ||
      clientName.toLowerCase().includes(normalizedSearch) ||
      descriptionText.toLowerCase().includes(normalizedSearch);

    const matchesLocation =
      locationFilter === 'all' ||
      getLocationType(j.location) === locationFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (j.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setClientModalLoading(false);
    setClientModalError('');
    setSelectedClientProfile(null);
  };

  const handleClientClick = async (job) => {
    if (!job) return;

    const fallbackName = job.client_name || 'Client';
    setClientProfileFallback({ name: fallbackName, email: job.client_email || '' });
    setSelectedClientProfile(null);
    setClientModalError('');
    setIsClientModalOpen(true);

    const userId = job.client || job.client_id || job.client_user_id;
    if (!userId) {
      setClientModalError('Client account is unavailable.');
      return;
    }

    const cacheKey = String(userId);
    if (clientProfiles[cacheKey]) {
      setSelectedClientProfile(clientProfiles[cacheKey]);
      return;
    }

    setClientModalLoading(true);
    try {
      const profile = await profileService.client.getProfileByUserId(userId);
      if (profile) {
        setClientProfiles((prev) => ({ ...prev, [cacheKey]: profile }));
        setSelectedClientProfile(profile);
      } else {
        setSelectedClientProfile(null);
      }
    } catch (error) {
      console.error('Unable to load client profile', error);
      setSelectedClientProfile(null);
      setClientModalError(error.response?.data?.detail || 'Unable to load this profile.');
    } finally {
      setClientModalLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Jobs Available</h1>
        <p className="text-gray-600 mb-6">Find your dream job here</p>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs by title, client, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="flex space-x-3 mb-6">
          {STATUS_FILTERS.map(option => {
            const buttonLabel = option === 'all' ? 'All' : option;

            return (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${statusFilter === option ? 'bg-[#3b82f6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {buttonLabel}
              </button>
            );
          })}
        </div>
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => setLocationFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${locationFilter === 'all' ? 'bg-[#3b82f6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All Locations
          </button>
          <button
            onClick={() => setLocationFilter('on-site')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${locationFilter === 'on-site' ? 'bg-[#3b82f6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            On-Site
          </button>
          <button
            onClick={() => setLocationFilter('remote')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${locationFilter === 'remote' ? 'bg-[#3b82f6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Remote
          </button>
          <button
            onClick={() => setLocationFilter('hybrid')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${locationFilter === 'hybrid' ? 'bg-[#3b82f6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Hybrid
          </button>
        </div>
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const minBudget = job.min_budget ?? job.budget;
            const maxBudget = job.max_budget ?? job.budget;
            const budgetLabel = formatBudgetLabel(minBudget, maxBudget);
            const badgeClass = STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700';
            const cacheKey = job.client ? String(job.client) : null;
            const cachedProfile = cacheKey ? clientProfiles[cacheKey] : null;
            const clientDisplayName = (cachedProfile ? `${cachedProfile.first_name || ''} ${cachedProfile.last_name || ''}`.trim() : '')
              || job.client_name
              || 'Unknown';
            const clientAvatarSrc = cachedProfile?.profile_image ? resolveProfileImage(cachedProfile.profile_image) : null;
            const clientAvatarLetter = (clientDisplayName || 'C').charAt(0).toUpperCase();
            const renderClientPreview = (className = '') => (
              <button
                type="button"
                onClick={() => handleClientClick(job)}
                className={`flex items-center gap-3 text-left focus:outline-none hover:opacity-90 ${className}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold overflow-hidden">
                  {clientAvatarSrc ? (
                    <img src={clientAvatarSrc} alt={`${clientDisplayName} avatar`} className="w-full h-full object-cover" />
                  ) : (
                    clientAvatarLetter
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-gray-800 truncate">{clientDisplayName}</span>
                  {(cachedProfile?.company_name || cachedProfile?.location) && (
                    <span className="text-xs text-gray-500">
                      {cachedProfile?.company_name || cachedProfile?.location}
                    </span>
                  )}
                  {!cachedProfile && (
                    <span className="text-xs text-[#3b82f6]">View profile</span>
                  )}
                </div>
              </button>
            );

            return (
              <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex flex-col lg:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                      {job.match_score && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{job.match_score}% AI Match</span>
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>{job.status}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{job.location || 'N/A'}</span>
                    </div>
                    <p className="text-gray-600 mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Array.isArray(job.skills) ? job.skills : typeof job.skills === 'string' ? job.skills.split(',').map(s => s.trim()).filter(Boolean) : []).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{skill}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center"><FaIndianRupeeSign className="w-4 h-4 mr-1" /><span>{budgetLabel}</span></div>
                      <div className="flex items-center"><Clock className="w-4 h-4 mr-1" />
                        <span>{job.duration || job.deadline || 'N/A'}</span>
                      </div>
                      <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /><span>{job.location || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 w-full">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 font-medium">Client:</span>
                        <div className="flex-1 min-w-0">
                          {renderClientPreview('w-full justify-start')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between mt-4 lg:mt-0 lg:ml-6">
                    <div className="text-right mb-4">
                      <p className="text-sm text-gray-500">Posted by</p>
                      <div className="flex justify-end mt-2">
                        {renderClientPreview('justify-end')}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{job.posted || ''}</p>
                    </div>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-lg shadow-sm">
              <Gift className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">No jobs found</p>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
              <button
                onClick={() => {
                  setLocationFilter('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors"
              >
                Find Work
              </button>
            </div>
          )}
        </div>
        {/* Job Detail Modal */}
        {selectedJob && (
          (() => {
            const detailBudget = formatBudgetLabel(
              selectedJob.min_budget ?? selectedJob.budget,
              selectedJob.max_budget ?? selectedJob.budget
            );
            const detailLocation = selectedJob.location || 'N/A';
            const detailClient = selectedJob.client_name || 'Unknown';
            const postedOn = selectedJob.posted_on || selectedJob.posted || 'N/A';
            const totalProposals = typeof selectedJob.proposals_count === 'number' ? selectedJob.proposals_count : (selectedJob.proposals || 0);

            return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedJob.title}</h2>
                    <p className="text-gray-600">Posted by <span className="font-semibold">{detailClient}</span></p>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Budget</p>
                    <p className="font-semibold">{detailBudget}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="font-semibold">{selectedJob.duration || selectedJob.deadline || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Proposals</p>
                    <p className="font-semibold">{totalProposals}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-semibold">{selectedJob.project_type || selectedJob.type || 'N/A'}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{selectedJob.description}</p>
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selectedJob.skills) ? selectedJob.skills : typeof selectedJob.skills === 'string' ? selectedJob.skills.split(',').map(s => s.trim()).filter(Boolean) : []).map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Project Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Location:</span><span className="font-medium">{detailLocation}</span></div>
                    <div className="flex justify-between"><span>Posted:</span><span className="font-medium">{postedOn}</span></div>
                    <div className="flex justify-between"><span>Status:</span><span className="font-medium">{selectedJob.status}</span></div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/freelancer/projects/${selectedJob.id}`)}
                    className="flex-1 px-6 py-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors"
                  >
                    Submit Proposal
                  </button>
                  <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Save for Later</button>
                </div>
              </div>
            </div>
          </div>
            );
          })()
        )}
      </div>
      <ClientProfileModal
        open={isClientModalOpen}
        onClose={handleCloseClientModal}
        profile={selectedClientProfile}
        loading={clientModalLoading}
        error={clientModalError}
        fallbackName={clientProfileFallback.name}
        fallbackEmail={clientProfileFallback.email}
      />
    </>
  );
}
