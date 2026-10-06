import React from "react";
import { Typography, Grid, Card } from "@mui/material";
 

export default function Reports() {
  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Performance Reports</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 4, textAlign: "center", borderStyle: "dashed", borderColor: "divider" }}>
            <Typography variant="h6" color="text.secondary">Monthly Revenue Report</Typography>
            <Typography variant="caption">Generated on Nov 01, 2025</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 4, textAlign: "center", borderStyle: "dashed", borderColor: "divider" }}>
            <Typography variant="h6" color="text.secondary">Yearly Tax Summary</Typography>
            <Typography variant="caption">Generated on Jan 15, 2025</Typography>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}