import React, { useEffect, useState, useRef } from "react";
import { 
  Grid, Card, Typography, Box, Button, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Stack, Autocomplete, TextField 
} from "@mui/material";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

import financeService from '../../services/financeService';
import axiosInstance from '../../utils/axiosInstance';
import exportToCSV from '../../utils/exportUtils';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const statusStyle = (rawStatus) => {
  const s = (rawStatus || '').toString().toLowerCase().trim();
  if (['paid', 'completed', 'complete'].includes(s)) {
    return { bg: '#ecfdf5', fg: '#10b981' };
  }
  if (['pending', 'in-progress', 'processing'].includes(s)) {
    return { bg: '#fff7ed', fg: '#f59e0b' };
  }
  if (s.includes('hold')) {
    return { bg: '#eef2ff', fg: '#4338ca' };
  }
  return { bg: '#fef2f2', fg: '#ef4444' };
};

 

// placeholders until API responds
const DEFAULT_STATS = { total_income: '₹0.00', total_expenses: '₹0.00', net_profit: '₹0.00', pending_invoices: '0' };
const DEFAULT_CHART = [];


export default function Accounting() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [chartData, setChartData] = useState(DEFAULT_CHART);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await financeService.getFreelancerOverview().catch(() => null);
        const tx = await financeService.getFreelancerTransactions().catch(() => null);
        const exp = await financeService.getExpenses().catch(() => null);
        const ch = s?.chart || null;
        if (!mounted) return;
        if (s) setStats(s);
        if (tx) setTransactions(tx?.results || tx || []);
        if (exp) setExpenses(exp?.results || exp || []);
        if (ch) setChartData(ch);
      } catch (err) {
        if (mounted) {
          console.error('Failed to load accounting data', err);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const [txDialogOpen, setTxDialogOpen] = React.useState(false);
  const [txForm, setTxForm] = React.useState({ client: '', amount: '', description: '' });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  const [clientInputValue, setClientInputValue] = useState('');
  const clientSearchTimeout = useRef(null);

  const openTxDialog = () => setTxDialogOpen(true);
  const closeTxDialog = () => {
    setTxDialogOpen(false);
    setSelectedExpense(null);
  };

  const submitTxRequest = async () => {
    if (!txForm.client || !txForm.amount) return alert('Client and amount required');
    try {
      await financeService.createFreelancerTransaction({ client: txForm.client, amount: txForm.amount, description: txForm.description });
      alert('Transaction request created');
      // reload transactions
      const tx = await financeService.getFreelancerTransactions().catch(() => null);
      if (tx) setTransactions(tx?.results || tx || []);
      closeTxDialog();
    } catch (e) {
      console.error(e);
      alert('Failed to create transaction');
    }
  };

  const prefillFromExpense = (expense) => {
    if (!expense) return;
    setSelectedExpense(expense);
    setTxForm((prev) => ({
      ...prev,
      client: expense.client || prev.client || '',
      amount: expense.amount || prev.amount || '',
      description: expense.item ? `Expense: ${expense.item}` : prev.description,
    }));
    setTxDialogOpen(true);
  };

  const handleExport = () => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const rows = transactions.map((row) => ({
      date: row?.date || row?.created_at || '',
      description: row?.description || row?.desc || '',
      type: row?.type || row?.category || '',
      amount: row?.amount,
      status: row?.status || row?.state || '',
    }));

    exportToCSV({
      data: rows,
      filename: 'freelancer-accounting-transactions.csv',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
      ],
    });
  };

  const expenseOptions = Array.isArray(expenses) ? expenses : [];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        px: { xs: 1.5, md: 3 },
        py: { xs: 2, md: 3 },
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 }, flex: 1 }}>
        {/* --- Page Header --- */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexWrap: 'wrap',
            gap: { xs: 2, sm: 3 }
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Accounting & Finance</Typography>
            <Typography variant="body2" color="text.secondary">Track your earnings, expenses, and invoices.</Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Export Report</Button>
            <Button
              variant="outlined"
              sx={{ color: '#1d4ed8', borderColor: '#1d4ed8', '&:hover': { borderColor: '#1e40af', color: '#1e40af', backgroundColor: '#eef2ff' } }}
              startIcon={<AddIcon />}
              onClick={() => prefillFromExpense(expenses[0])}
              disabled={!expenses || expenses.length === 0}
            >
              From Expense
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
              onClick={openTxDialog}
            >
              Add Transaction
            </Button>
          </Stack>
        </Box>

        {/* --- Top Stats Cards --- */}
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
          {(Array.isArray(stats) ? stats : [
            { label: 'Total Income', value: stats.total_income || '—', change: '+', color: '#10b981', icon: <TrendingUpIcon /> },
            { label: 'Total Expenses', value: stats.total_expenses || '—', change: '-', color: '#ef4444', icon: <TrendingDownIcon /> },
            { label: 'Net Profit', value: stats.net_profit || '—', change: '+', color: '#3b82f6', icon: <AccountBalanceWalletIcon /> },
            { label: 'Pending Invoices', value: stats.pending_invoices || '0', change: '—', color: '#f59e0b', icon: <MoreVertIcon /> },
          ]).map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
              <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'space-between', flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </Box>
                  <Chip
                    label={stat.change}
                    size="small"
                    sx={{
                      bgcolor: stat.change.includes('+') ? '#ecfdf5' : '#fef2f2',
                      color: stat.change.includes('+') ? '#10b981' : '#ef4444',
                      fontWeight: 700
                    }}
                  />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* --- Main Content Row --- */}
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
          {/* LEFT: Cash Flow Chart */}
          <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
            <Card sx={{ p: 3, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Cash Flow Analysis</Typography>
                <select style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  <option>This Year</option>
                  <option>Last Year</option>
                </select>
              </Box>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="Expense" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* RIGHT: Recent Transactions */}
          <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
            <Card sx={{ p: 3, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Recent Transactions</Typography>
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary' }}>Description</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>Amount</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>Status</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>Proof</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((row) => (
                      <TableRow key={row.id || `${row.desc}-${row.date}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.desc || row.description}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.date || row.created_at}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: (row.type || '').toLowerCase() === 'income' ? 'success.main' : 'error.main'
                            }}
                          >
                            {row.amount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(() => {
                            const { bg, fg } = statusStyle(row.status);
                            return (
                              <Chip
                                label={row.status || '—'}
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  bgcolor: bg,
                                  color: fg,
                                  textTransform: 'capitalize'
                                }}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell align="right">
                          {row.proof_url || row.proof || row.receipt_url ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(row.proof_url || row.proof || row.receipt_url, '_blank')}
                              sx={{ textTransform: 'none' }}
                            >
                              View Proof
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button fullWidth sx={{ mt: 2, color: 'text.secondary' }}>View All Transactions</Button>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={txDialogOpen} onClose={closeTxDialog} fullWidth maxWidth="sm">
        <DialogTitle>Create Transaction Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 320 }}>
            <Autocomplete
              options={expenseOptions}
              value={selectedExpense}
              onChange={(_e, value) => prefillFromExpense(value)}
              getOptionLabel={(opt) => {
                if (!opt) return '';
                const base = `${opt.item || 'Expense'} • ${opt.amount || ''}`;
                const email = opt.client_email ? ` • ${opt.client_email}` : '';
                return base + email;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pull from expense (optional)"
                  placeholder="Select an expense to prefill"
                />
              )}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              clearOnBlur
            />
            <Autocomplete
              freeSolo
              options={clientOptions}
              getOptionLabel={(opt) => opt?.email || ''}
              inputValue={clientInputValue}
              onInputChange={(_e, newInput) => {
                setClientInputValue(newInput);
                if (clientSearchTimeout.current) clearTimeout(clientSearchTimeout.current);
                if (!newInput || newInput.length < 2) return setClientOptions([]);
                clientSearchTimeout.current = setTimeout(async () => {
                  try {
                    const res = await axiosInstance.get(`users/search/?q=${encodeURIComponent(newInput)}`);
                    setClientOptions(res.data || []);
                  } catch (err) {
                    console.error('user search', err);
                    setClientOptions([]);
                  }
                }, 300);
              }}
              onChange={(_e, value) => {
                if (value && value.id) setTxForm({ ...txForm, client: value.id });
                else setTxForm({ ...txForm, client: '' });
              }}
              renderInput={(params) => <TextField {...params} label="Client (email)" required />}
            />
            <TextField label="Amount" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} required />
            <TextField label="Description" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTxDialog}>Cancel</Button>
          <Button variant="contained" onClick={submitTxRequest}>Send Request</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}