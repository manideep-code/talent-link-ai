import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import matchingService from '../../services/matchingService';

export default function RecommendedProjectsCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchRecommended() {
      try {
        setLoading(true);
        const data = await matchingService.getRecommendedProjects({ limit: 4 });
        if (!mounted) return;
        setProjects(data);
      } catch (err) {
        console.error('Failed to load recommended projects:', err);
        if (!mounted) return;
        setError('Could not load AI project matches.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRecommended();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, p: 3, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <AutoAwesomeIcon sx={{ color: '#059669', fontSize: '1.4rem' }} />
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Projects Recommended For You
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: '#059669', mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Matching projects tailored to your skill set...
          </Typography>
        </Box>
      </Card>
    );
  }

  if (error || !projects || projects.length === 0) {
    return null; // Gracefully omit if no recommendations available or on error
  }

  return (
    <Card sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon sx={{ color: '#059669', fontSize: '1.4rem' }} />
          <Typography variant="h6" fontWeight={800} color="#0f172a">
            Projects Recommended For You
          </Typography>
          <Chip
            label="AI Match"
            size="small"
            sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #a7f3d0' }}
          />
        </Stack>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem !important' }} />}
          onClick={() => navigate('/freelancer/projects')}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#1b4332' }}
        >
          Browse All Projects
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {projects.map((proj) => {
          const score = proj.match_score || 0;
          const scoreColor =
            score >= 90
              ? { bg: '#dcfce7', text: '#15803d' }
              : score >= 75
              ? { bg: '#dbeafe', text: '#1d4ed8' }
              : { bg: '#fef3c7', text: '#b45309' };

          return (
            <Grid item xs={12} md={6} key={proj.id}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderColor: '#cbd5e1',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#1e293b" noWrap sx={{ maxWidth: '75%' }}>
                    {proj.title}
                  </Typography>
                  <Chip
                    label={`${score}% Match`}
                    size="small"
                    sx={{
                      bgcolor: scoreColor.bg,
                      color: scoreColor.text,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {proj.description || 'No description provided.'}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AttachMoneyIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
                    <Typography variant="caption" fontWeight={600} color="#334155">
                      ₹{proj.min_budget || '0'} – ₹{proj.max_budget || '0'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AccessTimeIcon sx={{ fontSize: '1rem', color: '#6366f1' }} />
                    <Typography variant="caption" fontWeight={500} color="#64748b">
                      {proj.duration || 'Flexible'}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Skills tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, mt: 'auto' }}>
                  {(proj.matched_skills || []).slice(0, 3).map((sk) => (
                    <Chip
                      key={sk}
                      label={`✓ ${sk}`}
                      size="small"
                      sx={{ bgcolor: '#dcfce7', color: '#15803d', fontSize: '0.7rem', height: 20 }}
                    />
                  ))}
                  {(proj.missing_skills || []).slice(0, 2).map((sk) => (
                    <Chip
                      key={sk}
                      label={`⚠ ${sk}`}
                      size="small"
                      sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontSize: '0.7rem', height: 20 }}
                    />
                  ))}
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/freelancer/projects/${proj.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#1b4332',
                    color: '#1b4332',
                    '&:hover': { bgcolor: '#ecfdf5', borderColor: '#1b4332' },
                  }}
                >
                  View Project & Apply
                </Button>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Card>
  );
}
