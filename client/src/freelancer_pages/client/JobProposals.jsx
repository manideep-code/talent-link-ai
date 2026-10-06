


import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonBase,
  Avatar,
  Stack,
  Link,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import CreateContractModal from "../../components/Modals/CreateContractModal"; 
import FreelancerProfileModal from "../../components/Modals/FreelancerProfileModal";
import axiosInstance from "../../utils/axiosInstance";
import profileService from "../../services/profileService";
import { profileImageOrFallback } from "../../utils/profileImage";
import "../../App.css";

const PROPOSAL_STATUS_FILTERS = [
  { value: "hired", label: "Hired" },
  { value: "considering", label: "Considering" },
];

const normalizeProposalStatus = (status) => (status || "").toLowerCase();

const formatProposalStatusLabel = (status) => {
  const normalized = normalizeProposalStatus(status);
  if (normalized === "accepted") return "Hired";
  if (normalized === "considering") return "Considering";
  if (normalized === "submitted") return "Submitted";
  if (normalized === "rejected") return "Rejected";
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Pending";
};

export default function JobProposals() {
  const [proposals, setProposals] = useState([]);
  const [contractProposal, setContractProposal] = useState(null);
  const [detailProposal, setDetailProposal] = useState(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalError, setProfileModalError] = useState("");
  const [selectedFreelancerProfile, setSelectedFreelancerProfile] = useState(null);
  const [profileFallback, setProfileFallback] = useState({ name: "", email: "" });
  const [statusUpdateId, setStatusUpdateId] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState("");
  const [filters, setFilters] = useState({
    projectId: "all",
    freelancer: "all",
    status: "all",
  });
  const profileCacheRef = useRef(new Map());

  const fetchProposals = useCallback(async () => {
    try {
      const res = await axiosInstance.get("proposals/received/");
      const data = Array.isArray(res.data) ? res.data : [];
      const enriched = await attachFreelancerProfiles(data);
      setProposals(enriched);
      setDetailProposal(enriched.length ? enriched[0] : null);
    } catch (err) {
      console.error("Error fetching proposals", err);
      setProposals([]);
      setDetailProposal(null);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const updateProposalStatus = (proposalId, nextStatus) => {
    setProposals((prev) =>
      prev.map((proposal) =>
        proposal.id === proposalId ? { ...proposal, status: nextStatus } : proposal
      )
    );
    setDetailProposal((prev) =>
      prev && prev.id === proposalId ? { ...prev, status: nextStatus } : prev
    );
  };


  const attachFreelancerProfiles = async (items) => {
    const ids = [...new Set(items.map((proposal) => proposal?.freelancer?.id).filter(Boolean))];
    if (!ids.length) return items;

    await Promise.all(
      ids.map(async (userId) => {
        if (profileCacheRef.current.has(userId)) return;
        try {
          const profile = await profileService.freelancer.getProfileByUserId(userId);
          profileCacheRef.current.set(userId, profile || null);
        } catch (error) {
          console.error(`Unable to load freelancer profile ${userId}`, error);
          profileCacheRef.current.set(userId, null);
        }
      })
    );

    return items.map((proposal) => ({
      ...proposal,
      freelancer_profile: proposal?.freelancer?.id ? profileCacheRef.current.get(proposal.freelancer.id) : null,
    }));
  };

  const handleHireClick = (proposal) => {
    setContractProposal(proposal);
    setIsContractModalOpen(true);
  };

  // ✅ KEEP your step-2 (local update)
  const handleContractSuccess = () => {
    if (contractProposal) {
      updateProposalStatus(contractProposal.id, "accepted");
    }
  };

  const handleViewDetails = (proposal) => {
    setDetailProposal(proposal);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileModalLoading(false);
    setProfileModalError("");
    setSelectedFreelancerProfile(null);
  };

  const handleFreelancerClick = async (proposal) => {
    if (!proposal) return;
    setProfileFallback({
      name: proposal.freelancer_name || "Freelancer",
      email: proposal.freelancer_email || "",
    });
    setSelectedFreelancerProfile(null);
    setProfileModalError("");
    setIsProfileModalOpen(true);

    const userId = proposal.freelancer?.id;
    if (!userId) {
      setProfileModalError("Freelancer account is unavailable.");
      return;
    }

    if (proposal.freelancer_profile) {
      setSelectedFreelancerProfile(proposal.freelancer_profile);
      return;
    }

    if (profileCacheRef.current.has(userId)) {
      setSelectedFreelancerProfile(profileCacheRef.current.get(userId));
      return;
    }

    setProfileModalLoading(true);
    try {
      const profile = await profileService.freelancer.getProfileByUserId(userId);
      if (profile) {
        profileCacheRef.current.set(userId, profile);
        setSelectedFreelancerProfile(profile);
      } else {
        setSelectedFreelancerProfile(null);
      }
    } catch (error) {
      console.error("Unable to load freelancer profile", error);
      setSelectedFreelancerProfile(null);
      setProfileModalError(error.response?.data?.detail || "Unable to load this profile.");
    } finally {
      setProfileModalLoading(false);
    }
  };

  const handleConsiderClick = async (proposal) => {
    if (!proposal) return;
    setStatusUpdateError("");
    setStatusUpdateId(proposal.id);
    try {
      await axiosInstance.post(`proposals/${proposal.id}/consider/`);
      updateProposalStatus(proposal.id, "considering");
    } catch (error) {
      console.error("Unable to update proposal status", error);
      setStatusUpdateError(error.response?.data?.detail || "Unable to update proposal status.");
    } finally {
      setStatusUpdateId(null);
    }
  };

  const formatINR = (value) => {
    if (value === null || value === undefined || value === "") return "₹0";
    const amount = Number(value);
    if (Number.isNaN(amount)) {
      return `₹${value}`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const buildFreelancerKey = (proposal) => {
    if (proposal?.freelancer && proposal.freelancer.id) {
      return `id:${proposal.freelancer.id}`;
    }
    if (proposal?.freelancer_email) {
      return `email:${proposal.freelancer_email.toLowerCase()}`;
    }
    return `name:${(proposal?.freelancer_name || "unknown").toLowerCase()}`;
  };

  const availableProjects = useMemo(() => {
    const map = new Map();
    proposals.forEach((prop) => {
      if (!prop.project_id) return;
      const key = String(prop.project_id);
      if (!map.has(key)) {
        map.set(key, prop.project_title || prop.job_title || `Project #${prop.project_id}`);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [proposals]);

  const availableFreelancers = useMemo(() => {
    const map = new Map();
    proposals.forEach((prop) => {
      const key = buildFreelancerKey(prop);
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: prop.freelancer_name || "Unknown Freelancer",
        });
      }
    });
    return Array.from(map.values());
  }, [proposals]);

  const filteredProposals = useMemo(() => (
    proposals.filter((prop) => {
      const projectMatch =
        filters.projectId === "all" || String(prop.project_id) === filters.projectId;
      const freelancerMatch =
        filters.freelancer === "all" || buildFreelancerKey(prop) === filters.freelancer;
      const normalizedStatus = normalizeProposalStatus(prop.status);
      const statusMatch = (() => {
        if (filters.status === "all") return true;
        if (filters.status === "hired") return normalizedStatus === "accepted";
        if (filters.status === "considering") return normalizedStatus === "considering";
        return false;
      })();
      return projectMatch && freelancerMatch && statusMatch;
    })
  ), [proposals, filters]);

  const detailProposalId = detailProposal ? detailProposal.id : null;

  useEffect(() => {
    if (!filteredProposals.length) {
      setDetailProposal(null);
      return;
    }
    if (!detailProposalId || !filteredProposals.some((p) => p.id === detailProposalId)) {
      setDetailProposal(filteredProposals[0]);
    }
  }, [filteredProposals, detailProposalId]);

  const handleFilterChange = (key) => (event) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Box className="proposals-page-container" sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Review Proposals
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
          <FormControl fullWidth size="small">
            <InputLabel id="project-filter-label">Project</InputLabel>
            <Select
              labelId="project-filter-label"
              value={filters.projectId}
              label="Project"
              onChange={handleFilterChange("projectId")}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {availableProjects.map((project) => (
                <MenuItem key={project.value} value={project.value}>
                  {project.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="freelancer-filter-label">Freelancer</InputLabel>
            <Select
              labelId="freelancer-filter-label"
              value={filters.freelancer}
              label="Freelancer"
              onChange={handleFilterChange("freelancer")}
            >
              <MenuItem value="all">All Freelancers</MenuItem>
              {availableFreelancers.map((freelancer) => (
                <MenuItem key={freelancer.value} value={freelancer.value}>
                  {freelancer.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filters.status}
              label="Status"
              onChange={handleFilterChange("status")}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {PROPOSAL_STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Freelancer</TableCell>
              <TableCell>Job Applied For</TableCell>
              <TableCell>Bid</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredProposals.map((prop) => {
              const normalizedStatus = normalizeProposalStatus(prop.status);
              const isHired = normalizedStatus === "accepted";
              const isConsidering = normalizedStatus === "considering";
              const isSelected = detailProposal?.id === prop.id;
              const statusLabel = formatProposalStatusLabel(prop.status);
              const avatarSrc = profileImageOrFallback(
                prop?.freelancer_profile?.profile_image,
                prop.freelancer_name || prop.freelancer_email || "Freelancer"
              );

              return (
                <TableRow key={prop.id} selected={isSelected} hover>
                  <TableCell>
                    <ButtonBase
                      onClick={() => handleFreelancerClick(prop)}
                      sx={{
                        textAlign: "left",
                        borderRadius: 1,
                        px: 0,
                        py: 0.5,
                        display: "block",
                        width: "100%",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={avatarSrc}>{prop.freelancer_name?.[0] || "F"}</Avatar>
                        <Box>
                          <Typography fontWeight={600}>{prop.freelancer_name}</Typography>
                          {prop.freelancer_email && (
                            <Typography variant="caption" color="text.secondary">
                              {prop.freelancer_email}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </ButtonBase>
                  </TableCell>

                  <TableCell>{prop.project_title || prop.job_title || `Project #${prop.project_id}`}</TableCell>

                  <TableCell>{formatINR(prop.bid_amount)}</TableCell>

                  <TableCell>
                    {statusLabel}
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleViewDetails(prop)}
                    >
                      View Details
                    </Button>
                  </TableCell>

                  <TableCell>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        variant={isConsidering ? "contained" : "outlined"}
                        color="secondary"
                        size="small"
                        disabled={isHired || isConsidering || statusUpdateId === prop.id}
                        onClick={() => handleConsiderClick(prop)}
                      >
                        {isConsidering
                          ? "Considering"
                          : statusUpdateId === prop.id
                            ? "Updating..."
                            : "Mark Considering"}
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isHired}
                        onClick={() => handleHireClick(prop)}
                      >
                        {isHired ? "Contract Created" : "Hire Freelancer"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProposals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No proposals match the selected filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {statusUpdateError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {statusUpdateError}
        </Typography>
      )}

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Proposal Details
        </Typography>
        {detailProposal ? (
          <Box>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Project
                </Typography>
                <Typography fontWeight={600}>
                  {detailProposal.project_title || `Project #${detailProposal.project_id}`}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Bid Amount
                </Typography>
                <Typography>{formatINR(detailProposal.bid_amount)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Proposed Timeline
                </Typography>
                <Typography>{detailProposal.completion_time || "Not specified"}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography>{formatProposalStatusLabel(detailProposal.status)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Cover Letter
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {detailProposal.cover_letter || "No cover letter provided."}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Attachments
                </Typography>
                {Array.isArray(detailProposal.attachments) && detailProposal.attachments.length ? (
                  <Stack spacing={1} mt={1}>
                    {detailProposal.attachments.map((attachment) => (
                      <Link
                        key={attachment.id}
                        href={attachment.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        Download file ({attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleString() : ""})
                      </Link>
                    ))}
                  </Stack>
                ) : (
                  <Typography>No attachments uploaded.</Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Submitted On
                </Typography>
                <Typography>
                  {detailProposal.created_at ? new Date(detailProposal.created_at).toLocaleString() : "Unknown"}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ) : (
          <Typography color="text.secondary">Select a proposal to view details.</Typography>
        )}
      </Paper>

      <CreateContractModal
        open={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        proposal={contractProposal}
        onSuccess={handleContractSuccess}
      />

      <FreelancerProfileModal
        open={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        profile={selectedFreelancerProfile}
        loading={profileModalLoading}
        error={profileModalError}
        fallbackName={profileFallback.name}
        fallbackEmail={profileFallback.email}
      />
    </Box>
  );
}
