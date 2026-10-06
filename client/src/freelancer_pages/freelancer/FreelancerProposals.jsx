


import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress 
} from "@mui/material";
 
import axiosInstance from "../../utils/axiosInstance";

export default function FreelancerProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await axiosInstance.get('/proposals/');
      console.log("Freelancer Proposals Data:", response.data); // Debugging
      setProposals(response.data);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    // Handle both capital and lowercase from backend
    const s = status ? status.toLowerCase() : "";
    if (s === 'accepted') return "success";
    if (s === 'rejected') return "error";
    return "warning"; 
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Proposals</Typography>
        
        {loading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell><strong>Job Title</strong></TableCell>
                  <TableCell><strong>Client</strong></TableCell>
                  <TableCell><strong>Date Sent</strong></TableCell>
                  <TableCell><strong>Bid Amount</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No proposals found.</TableCell>
                  </TableRow>
                ) : (
                  proposals.map((row) => (
                    <TableRow key={row.id}>
                      {/* FIX 1: Use snake_case to match Django Serializer */}
                      <TableCell>{row.project_title || row.job_title || "Untitled Job"}</TableCell>
                      
                      {/* Use serialized client display name */}
                      <TableCell>{row.client_name || "Unknown Client"}</TableCell>
                      
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                      
                      <TableCell sx={{ color: "green", fontWeight: "bold" }}>
                        ₹{row.bid_amount}
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={row.status} 
                          color={getStatusColor(row.status)} 
                          size="small" 
                          variant="outlined" 
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </>
  );
}