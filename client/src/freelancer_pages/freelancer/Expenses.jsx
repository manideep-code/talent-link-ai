import React, { useEffect, useState, useRef } from "react";
import { Typography, Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, TextField, Autocomplete } from "@mui/material";
import axiosInstance from '../../utils/axiosInstance';
import AddIcon from "@mui/icons-material/Add";
import financeService from '../../services/financeService';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ item: '', date: '', category: '', amount: '', receipt: null, client: '' });
  const [clientOptions, setClientOptions] = useState([]);
  const [clientInput, setClientInput] = useState('');
  const clientSearchTimeout = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await financeService.getExpenses().catch(() => null);
        if (!mounted) return;
        if (res) setExpenses(res);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleAddToggle = () => setAdding((s) => !s);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // resolve client email to id if user typed but didn't select
      let payload = { ...form };
      if ((!payload.client || payload.client === '') && clientInput) {
        try {
          const res = await axiosInstance.get(`users/search/?q=${encodeURIComponent(clientInput)}`);
          const first = (res.data || [])[0];
          if (first && first.id) payload.client = first.id;
        } catch (err) {
          console.error('resolve client', err);
        }
      }
      await financeService.addExpense(payload);
      alert('Expense added');
      // reload
      const res = await financeService.getExpenses().catch(() => null);
      if (res) setExpenses(res);
      setForm({ item: '', date: '', category: '', amount: '', receipt: null, client: '' });
      setAdding(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        boxSizing: 'border-box',
        px: { xs: 2, md: 4, lg: 6 },
        py: { xs: 3, md: 6 }
      }}
    >
      <Box
        sx={{
          maxWidth: '1380px',
          mx: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" fontWeight={700}>Expenses</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddToggle}>{adding ? 'Cancel' : 'Add Expense'}</Button>
        </Box>

        {adding && (
          <Card sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Item" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} required sx={{ flex: '1 1 220px', minWidth: 200 }} />
                <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} required sx={{ flex: '1 1 180px', minWidth: 180 }} />
                <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required sx={{ flex: '1 1 200px', minWidth: 200 }} />
                <TextField label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required sx={{ flex: '1 1 180px', minWidth: 160 }} />
                <Autocomplete
                  freeSolo
                  options={clientOptions}
                  getOptionLabel={(opt) => opt?.email || ''}
                  inputValue={clientInput}
                  sx={{ flex: '2 1 340px', minWidth: { xs: '100%', sm: 280 }, maxWidth: 460 }}
                  onInputChange={(_e, newInput) => {
                    setClientInput(newInput);
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
                    if (value && value.id) setForm({ ...form, client: value.id });
                    else setForm({ ...form, client: '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client (email)"
                      placeholder="Search by client email"
                    />
                  )}
                />
                <input type="file" onChange={(e) => setForm({ ...form, receipt: e.target.files[0] })} style={{ minWidth: '180px' }} />
              </Box>
              <Box sx={{ mt: 3 }}>
                <Button type="submit" variant="contained">Save Expense</Button>
              </Box>
            </form>
          </Card>
        )}

        <Card sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary' }}>Item</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Date</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Client</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Category</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} sx={{ p: 3 }}>Loading...</TableCell></TableRow>
                ) : expenses && expenses.length ? (
                  expenses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell fontWeight={500}>{row.item}</TableCell>
                      <TableCell color="text.secondary">{row.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.client_email || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.client_name || ''}</Typography>
                      </TableCell>
                      <TableCell><Chip label={row.category} size="small" /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>- {row.amount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} sx={{ p: 3 }}>No expenses found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}