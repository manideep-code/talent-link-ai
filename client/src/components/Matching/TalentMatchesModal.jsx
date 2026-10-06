import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  LinearProgress,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import matchingService from '../../services/matchingService';
import profileService from '../../services/profileService';
import { resolveProfileImage } from '../../utils/profileImage';
import WhyThisMatchModal from './WhyThisMatchModal';
import FreelancerProfileModal from '../Modals/FreelancerProfileModal';

export default function TalentMatchesModal({ open, onClose, project }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchData, setMatchData] = useState(null);

  // Filters & sorting
  const [minScore, setMinScore] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState('all');
  const [sortBy, setSortBy] = useState('ai_match');

  // Explainability & profile modals
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileFallback, setProfileFallback] = useState({ name: '', email: '' });

  // Invitations state
  const [invitingId, setInvitingId] = useState(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const fetchMatches = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        sort_by: sortBy,
      };
      if (minScore) params.min_score = minScore;
      if (availability) params.availability = availability;
      if (experience && experience !== 'all') params.experience = experience;

      const res = await matchingService.getTalentMatches(project.id, params);
      setMatchData(res);
    } catch (err) {
      console.error('Failed to load talent matches:', err);
      setError(
        err.response?.data?.detail || 'Unable to generate recommendations right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [project?.id, minScore, availability, experience, sortBy]);

  useEffect(() => {
    if (open && project?.id) {
      fetchMatches();
    }
  }, [open, project?.id, fetchMatches]);

  const handleOpenWhyModal = (match) => {
    setSelectedMatch(match);
    setWhyModalOpen(true);
  };

  const handleOpenProfileModal = async (freelancer) => {
    setProfileFallback({ name: freelancer.name, email: freelancer.email });
    setProfileLoading(true);
    setProfileModalOpen(true);
    try {
      if (freelancer.profile_id) {
        const p = await profileService.freelancer.getProfileById(freelancer.profile_id);
        setSelectedProfile(p);
      } else {
        const p = await profileService.freelancer.getProfileByUserId(freelancer.id);
        setSelectedProfile(p);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setSelectedProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInvite = async (freelancerId) => {
    if (!project?.id) return;
    setInvitingId(freelancerId);
    setInviteSuccessMsg('');
    try {
      await matchingService.inviteFreelancer(
        project.id,
        freelancerId,
        `Hi! I would love to invite you to review my project "${project.title}" and submit a proposal.`
      );
      setInviteSuccessMsg('Invitation sent successfully!');
      // Update local status
      setMatchData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matches: prev.matches.map((m) =>
            m.freelancer.id === freelancerId ? { ...m, invitation_status: 'pending' } : m
          ),
        };
      });
      setTimeout(() => setInviteSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send invitation. Please try again.');
    } finally {
      setInvitingId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
    if (score >= 75) return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
    if (score >= 60) return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <AutoAwesomeIcon sx={{ color: '#059669', fontSize: '1.4rem' }} />
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Recommended Talent Matches
                </Typography>
                <Chip
                  label="AI-Powered"
                  size="small"
                  sx={{
                    bgcolor: '#ecfdf5',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid #a7f3d0',
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Analyzing candidates for project:{' '}
                <strong style={{ color: '#1e293b' }}>{project?.title || 'Your Project'}</strong>
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Project Details Bar */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: '#ffffff',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AttachMoneyIcon sx={{ fontSize: '1.1rem', color: '#10b981' }} />
              <Typography variant="body2" color="#334155" fontWeight={600}>
                Budget: ₹{project?.min_budget || '0'} – ₹{project?.max_budget || '0'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeIcon sx={{ fontSize: '1.1rem', color: '#6366f1' }} />
              <Typography variant="body2" color="#334155" fontWeight={600}>
                Duration: {project?.duration || 'Flexible'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <WorkOutlineIcon sx={{ fontSize: '1.1rem', color: '#f59e0b' }} />
              <Typography variant="body2" color="#334155" fontWeight={600}>
                Experience: {project?.experience_level || 'Any'}
              </Typography>
            </Stack>
            {matchData && (
              <Chip
                label={`${matchData.matched_count} candidates matched`}
                size="small"
                sx={{ ml: 'auto', bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {inviteSuccessMsg && (
            <Alert severity="success" sx={{ mb: 2.5 }}>
              {inviteSuccessMsg}
            </Alert>
          )}

          {/* Filter & Sort Controls */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #f1f5f9',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 100 }}>
              <FilterListIcon sx={{ color: '#64748b', fontSize: '1.2rem' }} />
              <Typography variant="subtitle2" fontWeight={700} color="#475569">
                Filters:
              </Typography>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Min Score</InputLabel>
              <Select
                value={minScore}
                label="Min Score"
                onChange={(e) => setMinScore(e.target.value)}
              >
                <MenuItem value="">All Scores</MenuItem>
                <MenuItem value="70">70% & Above</MenuItem>
                <MenuItem value="80">80% & Above</MenuItem>
                <MenuItem value="90">90% & Above</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availability}
                label="Availability"
                onChange={(e) => setAvailability(e.target.value)}
              >
                <MenuItem value="">Any Availability</MenuItem>
                <MenuItem value="immediate">Available Now</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Experience</InputLabel>
              <Select
                value={experience}
                label="Experience"
                onChange={(e) => setExperience(e.target.value)}
              >
                <MenuItem value="all">Any Experience</MenuItem>
                <MenuItem value="intermediate">Intermediate+</MenuItem>
                <MenuItem value="expert">Expert Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170, ml: { sm: 'auto' } }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="ai_match">AI Match Score</MenuItem>
                <MenuItem value="reputation">Highest Rating</MenuItem>
                <MenuItem value="experience">Experience</MenuItem>
                <MenuItem value="budget">Budget Fit</MenuItem>
                <MenuItem value="availability">Availability</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Loading State with explainable checklist */}
          {loading && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={42} sx={{ color: '#059669', mb: 2.5 }} />
              <Typography variant="h6" fontWeight={700} color="#1e293b" gutterBottom>
                ✨ Finding the best talent for your project...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', mb: 3 }}>
                TalentLink is analyzing verified skill sets, past contracts, portfolio relevance, real-time availability, and platform reputation.
              </Typography>
              <Stack spacing={1} sx={{ maxWidth: 320, mx: 'auto', textAlign: 'left' }}>
                <Typography variant="caption" color="#166534" fontWeight={600}>✓ Extracting project requirements</Typography>
                <Typography variant="caption" color="#166534" fontWeight={600}>✓ Normalizing technology taxonomy</Typography>
                <Typography variant="caption" color="#166534" fontWeight={600}>✓ Calculating weighted compatibility</Typography>
                <Typography variant="caption" color="#166534" fontWeight={600}>✓ Ranking top matching candidates</Typography>
              </Stack>
            </Box>
          )}

          {/* Error State */}
          {!loading && error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={fetchMatches}>
                  Retry
                </Button>
              }
              sx={{ my: 3 }}
            >
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && matchData?.matches?.length === 0 && (
            <Box
              sx={{
                py: 6,
                px: 3,
                textAlign: 'center',
                bgcolor: '#f8fafc',
                borderRadius: 3,
                border: '1px dashed #cbd5e1',
                my: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#334155" gutterBottom>
                No strong matches found with current filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                Try relaxing the minimum score filter, expanding your project budget, or broadening skill specifications.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setMinScore('');
                  setAvailability('');
                  setExperience('all');
                }}
              >
                Reset Filters
              </Button>
            </Box>
          )}

          {/* Matches List */}
          {!loading && !error && matchData?.matches && matchData.matches.length > 0 && (
            <Grid container spacing={2.5}>
              {matchData.matches.map((item, idx) => {
                const { freelancer, match_score, matched_skills, missing_skills, availability_status, confidence, rating_estimate, invitation_status } = item;
                const scoreTheme = getScoreColor(match_score);
                const isInvited = invitation_status === 'pending' || invitation_status === 'accepted';

                return (
                  <Grid item xs={12} md={6} key={freelancer.id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid #e2e8f0',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                          borderColor: scoreTheme.border,
                        },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Freelancer Header */}
                        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                          <Avatar
                            src={resolveProfileImage(freelancer.avatar)}
                            alt={freelancer.name}
                            sx={{ width: 52, height: 52, bgcolor: '#1b4332', fontSize: '1.2rem', fontWeight: 700 }}
                          >
                            {freelancer.name ? freelancer.name.charAt(0).toUpperCase() : 'U'}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                              <Typography variant="subtitle1" fontWeight={700} color="#0f172a" noWrap>
                                {freelancer.name}
                              </Typography>
                              <Chip
                                label={`#${idx + 1} Rank`}
                                size="small"
                                sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: '0.7rem', height: 20 }}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                              {freelancer.email}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="#059669" fontWeight={600}>
                                ⭐ {rating_estimate || 4.8}/5
                              </Typography>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Typography variant="caption" color="#2563eb" fontWeight={500}>
                                {availability_status}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Match Score Badge */}
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: scoreTheme.bg,
                              border: `1px solid ${scoreTheme.border}`,
                              textAlign: 'center',
                              minWidth: 70,
                            }}
                          >
                            <Typography variant="h6" fontWeight={800} color={scoreTheme.text} lineHeight={1}>
                              {match_score}%
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color={scoreTheme.text} fontSize="0.65rem">
                              AI Match
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Match Bar */}
                        <Box sx={{ mb: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={match_score}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#f1f5f9',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: scoreTheme.text,
                                borderRadius: 3,
                              },
                            }}
                          />
                          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Confidence: <strong>{confidence}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Similar Projects: <strong>{item.similar_projects_count || 0}</strong>
                            </Typography>
                          </Stack>
                        </Box>

                        {/* Matched Skills */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" fontWeight={700} color="#475569" display="block" sx={{ mb: 0.5 }}>
                            Matched Skills ({matched_skills.length}):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {matched_skills.length > 0 ? (
                              matched_skills.slice(0, 4).map((s) => (
                                <Chip
                                  key={s}
                                  label={`✓ ${s}`}
                                  size="small"
                                  sx={{ bgcolor: '#dcfce7', color: '#15803d', fontSize: '0.7rem', height: 22 }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No direct skill matches
                              </Typography>
                            )}
                            {matched_skills.length > 4 && (
                              <Chip
                                label={`+${matched_skills.length - 4} more`}
                                size="small"
                                sx={{ bgcolor: '#f1f5f9', fontSize: '0.7rem', height: 22 }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Missing Skills Warning */}
                        {missing_skills.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="#b45309" display="block" sx={{ mb: 0.5 }}>
                              Missing Required Skills ({missing_skills.length}):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {missing_skills.slice(0, 3).map((s) => (
                                <Chip
                                  key={s}
                                  label={`⚠ ${s}`}
                                  size="small"
                                  sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontSize: '0.7rem', height: 22 }}
                                />
                              ))}
                              {missing_skills.length > 3 && (
                                <Chip
                                  label={`+${missing_skills.length - 3} more`}
                                  size="small"
                                  sx={{ bgcolor: '#fef2f2', color: '#b91c1c', fontSize: '0.7rem', height: 22 }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenWhyModal(item)}
                              startIcon={<HelpOutlineIcon sx={{ fontSize: '1rem !important' }} />}
                              sx={{ flex: 1, textTransform: 'none', fontWeight: 600, color: '#334155' }}
                            >
                              Why this match?
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenProfileModal(freelancer)}
                              startIcon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                              sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              Profile
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={isInvited || invitingId === freelancer.id}
                              onClick={() => handleInvite(freelancer.id)}
                              startIcon={isInvited ? <CheckCircleIcon sx={{ fontSize: '1rem !important' }} /> : <SendIcon sx={{ fontSize: '1rem !important' }} />}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: isInvited ? '#94a3b8' : '#1b4332',
                                '&:hover': { bgcolor: isInvited ? '#94a3b8' : '#2d6a4f' },
                              }}
                            >
                              {invitingId === freelancer.id
                                ? 'Inviting...'
                                : isInvited
                                ? 'Invited ✓'
                                : 'Invite'}
                            </Button>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Why This Match Explainable Modal */}
      <WhyThisMatchModal
        open={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
        match={selectedMatch}
        freelancerName={selectedMatch?.freelancer?.name}
      />

      {/* Freelancer Profile View Modal */}
      <FreelancerProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={selectedProfile}
        loading={profileLoading}
        fallbackName={profileFallback.name}
        fallbackEmail={profileFallback.email}
      />
    </>
  );
}
