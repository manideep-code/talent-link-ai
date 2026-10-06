import React, { useEffect, useMemo, useState } from "react";
import { Typography, Grid, Card, Avatar, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, TextField } from "@mui/material";
import { useSearch } from "../../context/SearchContext";
import profileService from "../../services/profileService";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { searchTerm, setSearchTerm } = useSearch();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await profileService.client.listProfiles();
        const items = data?.results || data || [];
        if (!mounted) return;
        setClients(items);
      } catch (err) {
        console.error("Failed to load clients", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const openProfile = async (profile) => {
    if (!profile) return;
    setSelected(profile);
    setDetailLoading(true);
    try {
      const id = profile.id;
      const userId = profile.user || profile.user_id || profile.userId;
      let detail = { ...profile };

      if (id) {
        try {
          const full = await profileService.client.getProfileById(id);
          if (full) detail = { ...detail, ...full };
        } catch (error) {
          console.debug('getProfileById failed', id);
        }
      }

      if (!detail.email && userId) {
        try {
          const fallback = await profileService.client.getProfileByUserId(userId);
          if (fallback) detail = { ...detail, ...fallback };
        } catch (error) {
          console.debug('getProfileByUserId failed', userId);
        }
      }

      if (!detail.email && (userId || id)) {
        try {
          const list = await profileService.client.listProfiles({ user_id: userId || id });
          const arr = list?.results || list || [];
          if (arr && arr.length > 0) detail = { ...detail, ...arr[0] };
        } catch (error) {
          console.debug('listProfiles filter failed');
        }
      }

      setSelected(detail);
    } catch (err) {
      console.error('Failed to load profile detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const query = searchTerm.toLowerCase();
    return clients.filter((client) => {
      const fields = [
        client.name,
        client.first_name,
        client.last_name,
        client.company,
        client.title,
        client.email,
        client.skills
      ];
      return fields.some((value) =>
        value && value.toString().toLowerCase().includes(query)
      );
    });
  }, [clients, searchTerm]);

  return (
    <Box
      sx={{
        minHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 3, md: 4 },
        bgcolor: 'background.default'
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5" fontWeight={700}>Find New Clients</Typography>

          <TextField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search clients"
            size="small"
            fullWidth
            disabled={loading}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          filteredClients.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 6, color: 'text.secondary' }}>No clients match that search.</Box>
          ) : (
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {filteredClients.map((c) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={c.id || c.user || JSON.stringify(c)}>
                  <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                    <Avatar sx={{ width: 64, height: 64, margin: '0 auto', mb: 2 }} src={c.profile_image || c.avatar || undefined}>{!(c.profile_image || c.avatar) && (c.first_name ? (c.first_name[0] + (c.last_name ? c.last_name[0] : '')).toUpperCase() : 'C')}</Avatar>
                    <Typography variant="h6">{c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company || 'Client'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{c.company || c.company_name || c.title || ''}</Typography>
                    <Button variant="outlined" size="small" fullWidth onClick={() => openProfile(c)}>View Profile</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )
        )}
      </Box>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Client Profile</DialogTitle>
        <DialogContent dividers>
          {detailLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
          {!detailLoading && selected && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar src={selected.profile_image || selected.avatar} sx={{ width: 72, height: 72 }}>
                  {!selected.profile_image && !selected.avatar && (selected.first_name ? (selected.first_name[0] + (selected.last_name ? selected.last_name[0] : '')).toUpperCase() : 'C')}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selected.name || `${selected.first_name || ''} ${selected.last_name || ''}`.trim() || selected.company_name || 'Client'}</Typography>
                  {selected.company_name && (
                    <Typography variant="body2" color="text.secondary">{selected.company_name}</Typography>
                  )}
                </Box>
              </Box>

              {/* Contact & Metadata */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {selected.email && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{selected.email}</Typography>
                  </Box>
                )}
                {selected.phone && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{selected.phone}</Typography>
                  </Box>
                )}
                {selected.location && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Location</Typography>
                    <Typography variant="body2">{selected.location}</Typography>
                  </Box>
                )}
                {selected.website && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Website</Typography>
                    <Typography variant="body2"><a href={selected.website} target="_blank" rel="noreferrer">{selected.website}</a></Typography>
                  </Box>
                )}
              </Box>

              {selected.company_name && (
                <Box>
                  <Typography variant="subtitle2">Company</Typography>
                  <Typography variant="body2">{selected.company_name}</Typography>
                </Box>
              )}

              {selected.company_description && (
                <Box>
                  <Typography variant="subtitle2">Company Description</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.company_description}</Typography>
                </Box>
              )}

              {selected.bio && (
                <Box>
                  <Typography variant="subtitle2">About</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.bio}</Typography>
                </Box>
              )}

              {selected.projects && (
                <Box>
                  <Typography variant="subtitle2">Projects</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.projects}</Typography>
                </Box>
              )}

              {selected.skills && (
                <Box>
                  <Typography variant="subtitle2">Skills Needed</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selected.skills.split(',').map((s, i) => (
                      <Box key={i} sx={{ px: 1.5, py: 0.5, bgcolor: 'grey.100', borderRadius: 1, fontSize: 12 }}>{s.trim()}</Box>
                    ))}
                  </Box>
                </Box>
              )}

              {selected.works && (
                <Box>
                  <Typography variant="subtitle2">Recent Work</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.works}</Typography>
                </Box>
              )}

              {selected.documents && (
                <Box>
                  <Typography variant="subtitle2">Documents</Typography>
                  <a href={selected.documents} target="_blank" rel="noreferrer">{selected.documents.split('/').pop()}</a>
                </Box>
              )}

              {selected.portfolio_links && (
                <Box>
                  <Typography variant="subtitle2">Portfolio Links</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selected.portfolio_links.split(',').map((link, i) => (
                      <a key={i} href={link.trim()} target="_blank" rel="noreferrer">{link.trim()}</a>
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {selected.created_at && (
                  <Typography variant="caption" color="text.secondary">Joined: {new Date(selected.created_at).toLocaleDateString()}</Typography>
                )}
                {selected.updated_at && (
                  <Typography variant="caption" color="text.secondary">Updated: {new Date(selected.updated_at).toLocaleDateString()}</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}