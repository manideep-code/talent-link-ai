

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import axiosInstance from "../../utils/axiosInstance";

export default function CreateContractModal({ open, onClose, proposal, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    start_date: "",
    terms: "",
  });

  useEffect(() => {
    if (proposal) {
      setForm({
        title: `${proposal.job_title || 'Project'} - Contract ${proposal.id ?? ''}`,
        start_date: new Date().toISOString().split("T")[0],
        terms: proposal.cover_letter || "",
      });
    }
  }, [proposal]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        proposal_id: proposal.id,
        title: form.title,
        start_date: form.start_date,
        terms: form.terms,
      };

      await axiosInstance.post("/contracts/create/", payload);

      alert("✅ Contract created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Contract create error:", err.response?.data || err);
      alert(err.response?.data?.error || "Failed to create contract");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Create Contract
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Freelancer: <strong>{proposal?.freelancer_name}</strong>
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Agreed Amount: <strong>₹{proposal?.bid_amount}</strong>
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Contract Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Start Date"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Contract Terms"
            name="terms"
            value={form.terms}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Send Contract
        </Button>
      </DialogActions>
    </Dialog>
  );
}
