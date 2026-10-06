import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Typography, Card, Box, Chip, TextField, MenuItem, Stack, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from "@mui/icons-material/Description";
import { contractService } from "../../services/contractService";
import profileService from "../../services/profileService";
import { useUser } from "../../context/UserContext";

export default function Contracts() {
  const { user } = useUser();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // If backend returns contracts scoped by authenticated user, this will work for freelancers.
        // Optionally pass freelancer id: { freelancer: user.id }
        const data = await contractService.getContracts(user ? { freelancer: user.id } : {});
        const items = data?.results || data || [];
        if (!mounted) return;
        setContracts(items);

        // If client name is missing from some contracts, fetch contract details and merge
        const needDetail = items.filter((c) => {
          const name = c.client?.name || c.client_name || (c.client && typeof c.client === 'object' && (c.client.name || c.client.first_name));
          return !name;
        });

        if (needDetail.length > 0) {
          await Promise.all(needDetail.map(async (c) => {
            try {
              const d = await contractService.getContract(c.id);
              if (d) {
                // If client field is an id, try resolving client profile by user id
                if (d.client && (typeof d.client === 'number' || typeof d.client === 'string')) {
                  try {
                    const pf = await profileService.client.getProfileByUserId(d.client);
                    if (pf) d.client = pf;
                  } catch (e) {
                    // ignore
                  }
                }
                setContracts((prev) => prev.map((p) => p.id === d.id ? { ...p, ...d } : p));
              }
            } catch (err) {
              console.debug('Failed to fetch contract detail', c.id, err?.message || err);
            }
          }));
        }
      } catch (err) {
        console.error("Failed to load contracts", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user]);

  const statuses = useMemo(() => ["all", "pending", "signed", "cancelled"], []);

  const visible = useMemo(() => {
    return contracts.filter((c) => {
      // Status filter
      if (status !== "all") {
        const s = (c.status || c.state || "").toString().toLowerCase();
        if (s !== status) return false;
      }

      // Query filter: contract title or client name
      if (query) {
        const q = query.toLowerCase();
        const title = (c.title || c.name || c.contract_title || "").toString().toLowerCase();
        const client = (c.client?.name || c.client_name || c.client || "").toString().toLowerCase();
        return title.includes(q) || client.includes(q);
      }

      return true;
    });
  }, [contracts, query, status]);

  const resolveName = (entity, fallback) => {
    if (entity == null) return fallback || 'N/A';
    if (typeof entity === 'string') return entity;
    if (typeof entity === 'number') return `User #${entity}`;
    if (typeof entity === 'object') {
      if (entity.name) return entity.name;
      const first = entity.first_name || entity.firstName || '';
      const last = entity.last_name || entity.lastName || '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
      if (entity.username) return entity.username;
      if (entity.email) return entity.email;
    }
    return fallback || 'N/A';
  };

  const formatDateSafe = (value) => {
    if (!value) return 'N/A';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString();
  };

  const handleCloseDetails = useCallback(() => {
    setDetailOpen(false);
    setSelectedContract(null);
    setDetailLoading(false);
  }, []);

  const hydrateClient = useCallback(async (detail) => {
    if (!detail) return detail;
    const clientEntity = detail.client ?? detail.client_id ?? detail.client_user;
    if (clientEntity && (typeof clientEntity === 'number' || typeof clientEntity === 'string')) {
      try {
        const profile = await profileService.client.getProfileByUserId(clientEntity).catch(() => null);
        if (profile) {
          return { ...detail, client: profile };
        }
      } catch (err) {
        console.debug('hydrateClient failed', err?.message || err);
      }
    }
    return detail;
  }, []);

  const handleViewContract = useCallback(async (contract) => {
    if (!contract) return;
    setSelectedContract(contract);
    setDetailOpen(true);
    if (!contract.id) return;

    setDetailLoading(true);
    try {
      const detail = await contractService.getContract(contract.id);
      const enriched = await hydrateClient(detail || contract);
      if (enriched) {
        setSelectedContract((prev) => ({ ...(prev || {}), ...enriched }));
        setContracts((prev) => prev.map((item) => item.id === contract.id ? { ...item, ...enriched } : item));
      }
    } catch (err) {
      console.error('Failed to load contract details', err);
    } finally {
      setDetailLoading(false);
    }
  }, [hydrateClient]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        boxSizing: 'border-box',
        px: { xs: 2, md: 4, lg: 6 },
        py: { xs: 3, md: 6 }
      }}
    >
      <Box
        sx={{
          maxWidth: '1380px',
          mx: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 }
        }}
      >
        <Typography variant="h5" fontWeight={700}>Contracts</Typography>

        <Card sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search by contract or client"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
              sx={{ minWidth: 240 }}
            />

            <TextField
              select
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ width: 160 }}
            >
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ ml: { xs: 0, sm: 'auto' } }}>
              <IconButton onClick={() => { setQuery(''); setStatus('all'); }} title="Clear filters">
                Clear
              </IconButton>
            </Box>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
          ) : visible.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>No contracts found.</Box>
          ) : (
            <Stack spacing={2}>
              {visible.map((c) => (
                <Box key={c.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DescriptionIcon color="action" />
                    <Box>
                      <Typography fontWeight={600}>{c.title || c.name || c.contract_title || 'Contract'}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(c.created_at || c.date || c.created || Date.now()).toLocaleDateString()}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{resolveName(c.client ?? c.client_name ?? c.client_user)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={(c.status || c.state || '').toString().replace(/_/g, ' ') || 'Unknown'} color={(c.status || c.state || '').toString().toLowerCase() === 'signed' ? 'success' : 'warning'} size="small" />
                    <Button size="small" onClick={() => handleViewContract(c)}>View</Button>
                    {((c.status || c.state || '').toString().toLowerCase() !== 'signed' && (c.status || c.state || '').toString().toLowerCase() !== 'cancelled') && (
                      <Button size="small" variant="contained" onClick={async () => {
                        const id = c.id;
                        setActionLoading((s) => ({ ...s, [id]: true }));
                        try {
                          await contractService.updateContract(id, { status: 'signed' });
                          setContracts((prev) => prev.map((x) => x.id === id ? { ...x, status: 'signed' } : x));
                          setSelectedContract((prev) => (prev && prev.id === id ? { ...prev, status: 'signed' } : prev));
                        } catch (err) {
                          console.error('Sign contract failed', err);
                        } finally {
                          setActionLoading((s) => { const n = { ...s }; delete n[id]; return n; });
                        }
                      }} disabled={!!actionLoading[c.id]}>
                        {actionLoading[c.id] ? 'Signing...' : 'Sign'}
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </Box>

      {/* Details dialog */}
      <Dialog open={detailOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent dividers>
          {selectedContract ? (
            <Box sx={{ position: 'relative' }}>
              {detailLoading && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.65)', zIndex: 1 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                <Typography variant="h6">{selectedContract.title || selectedContract.name}</Typography>
                <Typography variant="body2" color="text.secondary">Client: {resolveName(selectedContract.client ?? selectedContract.client_name ?? selectedContract.client_user)}</Typography>
                <Typography variant="body2" color="text.secondary">Amount: {selectedContract.total_amount != null ? Number(selectedContract.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">Start Date: {formatDateSafe(selectedContract.start_date)}</Typography>
                <Typography variant="body2" color="text.secondary">End Date: {formatDateSafe(selectedContract.end_date)}</Typography>
                <Box>
                  <Typography variant="subtitle2">Terms</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedContract.terms || 'No terms provided.'}</Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          {selectedContract && ((selectedContract.status || selectedContract.state || '').toString().toLowerCase() !== 'signed' && (selectedContract.status || selectedContract.state || '').toString().toLowerCase() !== 'cancelled') && (
            <Button variant="contained" onClick={async () => {
              const id = selectedContract.id;
              setActionLoading((s) => ({ ...s, [id]: true }));
              try {
                await contractService.updateContract(id, { status: 'signed' });
                setContracts((prev) => prev.map((x) => x.id === id ? { ...x, status: 'signed' } : x));
                setSelectedContract((s) => s ? { ...s, status: 'signed' } : s);
                setDetailOpen(false);
              } catch (err) {
                console.error('Sign from details failed', err);
              } finally {
                setActionLoading((s) => { const n = { ...s }; delete n[id]; return n; });
              }
            }} disabled={!!actionLoading[selectedContract?.id]}> {actionLoading[selectedContract?.id] ? 'Signing...' : 'Sign Contract'}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}