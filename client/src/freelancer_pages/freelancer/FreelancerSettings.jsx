import React from "react";
import { Box } from "@mui/material";
import SettingsPanel from "../shared/SettingsPanel";

const FreelancerSettings = () => (
  <Box sx={{ width: "100%", px: { xs: 0, sm: 1 } }}>
    <SettingsPanel role="freelancer" />
  </Box>
);

export default FreelancerSettings;