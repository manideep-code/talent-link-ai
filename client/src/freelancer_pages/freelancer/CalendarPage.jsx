import React from "react";
import { Typography, Grid, Card, Box } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
 

export default function CalendarPage() {
  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Schedule & Deadlines</Typography>
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: "#ecfdf5", color: "#10b981", borderRadius: 2 }}>
                <EventIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Project Delivery</Typography>
                <Typography variant="body2" color="text.secondary">Dec 12, 2025 • 5:00 PM</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}