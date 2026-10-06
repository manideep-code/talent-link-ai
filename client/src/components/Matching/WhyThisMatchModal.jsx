import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StarsIcon from '@mui/icons-material/Stars';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const SCORE_FACTORS = [
  { key: 'skill_score', label: 'Skill Compatibility', weight: '35%', color: '#10b981' },
  { key: 'portfolio_score', label: 'Portfolio & Project Similarity', weight: '20%', color: '#3b82f6' },
  { key: 'experience_score', label: 'Experience Level', weight: '15%', color: '#8b5cf6' },
  { key: 'budget_score', label: 'Budget Compatibility', weight: '10%', color: '#f59e0b' },
  { key: 'availability_score', label: 'Availability & Timeline', weight: '10%', color: '#06b6d4' },
  { key: 'reputation_score', label: 'Platform Reputation', weight: '10%', color: '#ec4899' },
];

export default function WhyThisMatchModal({ open, onClose, match, freelancerName }) {
  if (!match) return null;

  const {
    match_score = 0,
    matched_skills = [],
    missing_skills = [],
    strengths = [],
    match_reasons = [],
    confidence = 'Medium',
  } = match;

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const badgeColor = getScoreBadgeColor(match_score);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              Why {freelancerName || 'this candidate'} is a {match_score}% Match
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Deterministic, transparent breakdown computed from verified platform data
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${match_score}% Match`}
              sx={{
                bgcolor: badgeColor,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            />
            <Chip
              icon={<InfoOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
              label={`${confidence} Confidence`}
              size="small"
              variant="outlined"
              color={confidence === 'High' ? 'success' : confidence === 'Medium' ? 'primary' : 'warning'}
            />
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Factor Progress Bars */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: '#334155' }}>
            Weighted Scoring Breakdown
          </Typography>
          <Grid container spacing={2}>
            {SCORE_FACTORS.map((factor) => {
              const val = match[factor.key] ?? 70;
              return (
                <Grid item xs={12} sm={6} key={factor.key}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} color="#475569">
                        {factor.label}{' '}
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                          ({factor.weight})
                        </span>
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color={factor.color}>
                        {val}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={val}
                      sx={{
                        height: 7,
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: factor.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Strengths & Reasons */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#166534' }}>
              ✓ Key Match Reasons & Signals
            </Typography>
            <Stack spacing={1}>
              {match_reasons.map((reason, idx) => (
                <Stack key={idx} direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon sx={{ color: '#16a34a', fontSize: '1.1rem', mt: 0.2 }} />
                  <Typography variant="body2" color="#334155">
                    {reason}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {strengths && strengths.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#1e3a8a' }}>
                  ★ Candidate Strengths
                </Typography>
                <Stack spacing={0.75}>
                  {strengths.map((str, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      <StarsIcon sx={{ color: '#3b82f6', fontSize: '1rem' }} />
                      <Typography variant="body2" color="#1e293b" fontWeight={500}>
                        {str}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Matched Skills */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#047857' }}>
                Matched Skills ({matched_skills.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {matched_skills.length > 0 ? (
                  matched_skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={`✓ ${skill}`}
                      size="small"
                      sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No exact technology matches detected.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Missing Skills */}
            {missing_skills.length > 0 && (
              <Box sx={{ p: 1.5, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fef3c7' }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                  <WarningAmberIcon sx={{ color: '#b45309', fontSize: '1.1rem' }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#92400e' }}>
                    Missing Required Skills ({missing_skills.length})
                  </Typography>
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {missing_skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={`⚠ ${skill}`}
                      size="small"
                      sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="#78350f" sx={{ display: 'block', mt: 1 }}>
                  The candidate has not listed these specific technologies in their profile or past projects.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#1b4332', '&:hover': { bgcolor: '#2d6a4f' } }}>
          Close Breakdown
        </Button>
      </DialogActions>
    </Dialog>
  );
}
