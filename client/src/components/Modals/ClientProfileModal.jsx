import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Box,
  Grid,
  Paper,
} from "@mui/material";
import { resolveProfileImage } from "../../utils/profileImage";

const renderChips = (value, color = "primary") => {
  if (!value) return null;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (
      <Chip
        key={item}
        label={item}
        color={color}
        variant="outlined"
        size="small"
        sx={{ mr: 1, mb: 1 }}
      />
    ));
};

export default function ClientProfileModal({
  open,
  onClose,
  profile,
  loading = false,
  error = "",
  fallbackName = "",
  fallbackEmail = "",
}) {
  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || fallbackName
    : fallbackName;
  const displayEmail = profile?.email || fallbackEmail;
  const profileImage = resolveProfileImage(profile?.profile_image);

  const companyInfo = [
    { label: "Company", value: profile?.company_name },
    { label: "Location", value: profile?.location },
    { label: "Projects", value: profile?.projects },
  ];

  const content = () => {
    if (loading) {
      return (
        <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Loading client profile...
          </Typography>
        </Stack>
      );
    }

    if (error) {
      return (
        <Typography color="error" sx={{ py: 2 }}>
          {error}
        </Typography>
      );
    }

    if (!profile) {
      return (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          This client has not published a profile yet.
        </Typography>
      );
    }

    return (
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "center", sm: "flex-start" }}>
          <Avatar
            src={profileImage || undefined}
            sx={{ width: 80, height: 80, fontSize: 32 }}
          >
            {displayName?.[0] || "C"}
          </Avatar>
          <Box>
            <Typography variant="h6">{displayName || "Client"}</Typography>
            {displayEmail && (
              <Typography variant="body2" color="text.secondary">
                {displayEmail}
              </Typography>
            )}
            {profile.created_at && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Profile created on {new Date(profile.created_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Stack>

        <Grid container spacing={2}>
          {companyInfo.map((item) => (
            <Grid item xs={12} sm={6} key={item.label}>
              <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {item.label}
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {item.value || "Not specified"}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {profile.company_description && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              About the Company
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {profile.company_description}
            </Typography>
          </Box>
        )}

        {profile.skills && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Desired Skills
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap" }}>{renderChips(profile.skills)}</Box>
          </Box>
        )}

        {profile.works && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Projects & Highlights
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{profile.works}</Typography>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Client Profile</DialogTitle>
      <Divider />
      <DialogContent>{content()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
