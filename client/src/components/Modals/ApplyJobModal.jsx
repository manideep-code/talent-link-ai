import React, { useState } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Typography, Alert 
} from "@mui/material";
import axiosInstance from "../../utils/axiosInstance";

export default function ApplyJobModal({ open, onClose, project }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    if (!bidAmount || !coverLetter) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
    }

    try {
      // 1. Construct the payload matching your Django Serializer
      const payload = {
        project: project.id,        // CRITICAL: Must be 'project' (ID), not 'projectId'
        bid_amount: bidAmount,      // Must match 'bid_amount' in models.py
        cover_letter: coverLetter,  // Must match 'cover_letter' in models.py
      };

      console.log("Sending Payload:", payload); // Debugging

      // 2. Send POST request
      const response = await axiosInstance.post("/proposals/", payload);

      console.log("Success:", response.data);
      alert("Proposal sent successfully!");
      onClose();
    } catch (err) {
      console.error("Apply Error:", err.response?.data || err.message);
      // Show exact error from backend (e.g., "You have already applied")
      setError(err.response?.data?.detail || "Failed to send proposal. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply for {project?.title}</DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Client Budget: ₹{project?.budget}
        </Typography>

        <TextField
          label="Bid Amount (₹)"
          type="number"
          fullWidth
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />

        <TextField
          label="Cover Letter"
          multiline
          rows={4}
          fullWidth
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Why are you the best fit for this job?"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Proposal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}