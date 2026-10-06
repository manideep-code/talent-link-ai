import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4">404 — Page Not Found</Typography>
      <Button component={Link} to="/" sx={{ mt: 2 }} variant="contained">
        Go home
      </Button>
    </Container>
  );
}
