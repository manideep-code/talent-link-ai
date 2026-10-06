import React, { useEffect, useState, useRef } from 'react';
import financeService from '../../services/financeService';
import { Autocomplete, TextField } from '@mui/material';
import axiosInstance from '../../utils/axiosInstance';
import { exportToCSV } from '../../utils/exportUtils';

// --- SVG Icons ---
const Icons = {
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-8h-4z"/></svg>,
  Invoice: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  ArrowUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
};

// local state until backend present
const DEFAULT_STATS = { total_spent: '₹0.00', pending: '₹0.00', last_payment: '—' };

// transactions will be loaded from API

const ClientFinancials = () => {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileRefs = useRef({});
  const [actionLoading, setActionLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ freelancer: '', amount: '', paid_amount: '', payment_type: '', description: '' });
  const [freelancerOptions, setFreelancerOptions] = useState([]);
  const [freelancerInput, setFreelancerInput] = useState('');
  const freelancerSearchTimeout = useRef(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_type: 'full' });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await financeService.getClientOverview().catch(() => null);
        const tx = await financeService.getClientTransactions().catch(() => null);
        if (!mounted) return;
        if (s) setStats(s);
        if (tx) setTransactions(tx);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleUploadProof = async (transactionId) => {
    const file = fileRefs.current[transactionId]?.files?.[0];
    if (!file) return alert('Select a file first');
    try {
      await financeService.submitTransactionProof(transactionId, file);
      alert('Uploaded proof');
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    }
  };

  const formatDisplayDate = (value) => {
    if (!value) return '—';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString();
  };

  const resolveInvoiceId = (tx) => tx?.invoice_id || tx?.invoiceId || tx?.id || '—';

  const reloadTransactions = async () => {
    setLoading(true);
    try {
      const [s, tx] = await Promise.all([
        financeService.getClientOverview().catch(() => null),
        financeService.getClientTransactions().catch(() => null),
      ]);
      if (s) setStats(s);
      setTransactions(tx || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTransactions = () => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.warn('No transactions available for export');
      return;
    }

    const rows = transactions.map((tx) => ({
      invoice_id: resolveInvoiceId(tx),
      date: formatDisplayDate(tx.created_at || tx.date),
      description: tx.description || '',
      freelancer: tx.freelancer_name || tx.freelancer_email || tx.freelancer || tx.recipient || '',
      amount: tx.amount || tx.total_amount || '',
      status: tx.status || '',
    }));

    exportToCSV({
      filename: 'client-transactions.csv',
      data: rows,
      columns: [
        { key: 'invoice_id', label: 'Invoice ID' },
        { key: 'date', label: 'Date' },
        { key: 'description', label: 'Description' },
        { key: 'freelancer', label: 'Freelancer' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
      ],
    });
  };

  const handleClientAction = async (invoiceId, action) => {
    if (!invoiceId) return;
    if (action === 'pay') {
      // if tx provided in call, use its remaining amount as default
      const tx = transactions.find((x) => (x.invoice_id || x.id) === invoiceId || (x.id === invoiceId));
      let defaultAmount = '';
      if (tx) {
        const amt = Number(tx.amount || 0);
        const paid = Number(tx.paid_amount || 0);
        const remaining = Math.max(0, amt - paid);
        defaultAmount = remaining > 0 ? remaining.toString() : amt.toString();
      }
      setPayInvoiceId(invoiceId);
      setPayForm({ amount: defaultAmount, payment_type: defaultAmount && Number(defaultAmount) < Number(tx?.amount || 0) ? 'partial' : 'full' });
      setPayDialogOpen(true);
    } else if (action === 'reject' || action === 'hold') {
      setActionLoading(true);
      try {
        await financeService.clientTransactionAction(invoiceId, { action });
        alert('Action performed');
        await reloadTransactions();
      } catch (e) {
        console.error(e);
        alert('Action failed');
      } finally { setActionLoading(false); }
    }
  };

  const closePayDialog = () => {
    setPayDialogOpen(false);
    setPayInvoiceId(null);
    setPayForm({ amount: '', payment_type: 'full' });
  };

  const submitPay = async () => {
    if (!payInvoiceId || !payForm.amount) return alert('Amount is required');
    setActionLoading(true);
    try {
      await financeService.clientTransactionAction(payInvoiceId, { action: 'pay', amount: payForm.amount, payment_type: payForm.payment_type });
      alert('Payment recorded');
      closePayDialog();
      await reloadTransactions();
    } catch (e) {
      console.error(e);
      alert('Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateDialog = () => setCreateDialogOpen(true);
  const closeCreateDialog = () => setCreateDialogOpen(false);
  const submitCreateTransaction = async () => {
    // If user typed an email and didn't select, try resolving it via search
    let freelancerId = createForm.freelancer;
    if ((!freelancerId || freelancerId === '') && freelancerInput) {
      try {
        const res = await axiosInstance.get(`users/search/?q=${encodeURIComponent(freelancerInput)}`);
        const first = (res.data || [])[0];
        if (first && first.id) {
          freelancerId = first.id;
        }
      } catch (err) {
        console.error('resolve freelancer', err);
      }
    }

    if (!freelancerId || !createForm.amount) return alert('Freelancer and amount required');
    try {
      await financeService.createClientTransaction({ freelancer: freelancerId, amount: createForm.amount, paid_amount: createForm.paid_amount || 0, payment_type: createForm.payment_type, description: createForm.description });
      alert('Transaction created');
      closeCreateDialog();
      await reloadTransactions();
    } catch (e) {
      console.error(e);
      alert('Create failed');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Financial Overview</h1>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <StatCard title="Total Spent" amount={stats.total_spent || '—'} icon={<Icons.Wallet />} color="#3b82f6" />
        <StatCard title="Pending Amount" amount={stats.pending || '—'} icon={<Icons.Invoice />} color="#f59e0b" />
        <StatCard title="Pending Invoices" amount={stats.pending_invoices_count ?? '0'} icon={<Icons.Invoice />} color="#f97316" />
        <StatCard title="Last Payment" amount={stats.last_payment || '—'} sub={stats.last_payment_to || ''} icon={<Icons.ArrowUp />} color="#10b981" />
      </div>

      {/* Create Transaction Dialog for Client */}
      {createDialogOpen && (
        <div style={{position:'fixed', top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',padding:20,borderRadius:8,width:480}}>
            <h3>Create Transaction</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <Autocomplete
                freeSolo
                options={freelancerOptions}
                getOptionLabel={(opt) => opt?.email || ''}
                inputValue={freelancerInput}
                onInputChange={(_e, newInput) => {
                  setFreelancerInput(newInput);
                  if (freelancerSearchTimeout.current) clearTimeout(freelancerSearchTimeout.current);
                  if (!newInput || newInput.length < 2) return setFreelancerOptions([]);
                  freelancerSearchTimeout.current = setTimeout(async () => {
                    try {
                      const res = await axiosInstance.get(`users/search/?q=${encodeURIComponent(newInput)}`);
                      setFreelancerOptions(res.data || []);
                    } catch (err) {
                      console.error('freelancer search', err);
                      setFreelancerOptions([]);
                    }
                  }, 300);
                }}
                onChange={(_e, value) => {
                  if (value && value.id) setCreateForm({...createForm, freelancer: value.id});
                  else setCreateForm({...createForm, freelancer: ''});
                }}
                renderInput={(params) => <TextField {...params} label="Freelancer (email)" />}
              />
              <input placeholder="Amount" value={createForm.amount} onChange={(e)=>setCreateForm({...createForm, amount:e.target.value})} />
              <input placeholder="Paid amount (optional)" value={createForm.paid_amount} onChange={(e)=>setCreateForm({...createForm, paid_amount:e.target.value})} />
              <input placeholder="Payment type (advance/partial/full)" value={createForm.payment_type} onChange={(e)=>setCreateForm({...createForm, payment_type:e.target.value})} />
              <input placeholder="Description" value={createForm.description} onChange={(e)=>setCreateForm({...createForm, description:e.target.value})} />
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button onClick={closeCreateDialog}>Cancel</button>
              <button onClick={submitCreateTransaction}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Dialog */}
      {payDialogOpen && (
        <div style={{position:'fixed', top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',padding:20,borderRadius:8,width:420}}>
            <h3>Pay Invoice</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <input placeholder="Amount" value={payForm.amount} onChange={(e)=>setPayForm({...payForm, amount: e.target.value})} />
              <select value={payForm.payment_type} onChange={(e)=>setPayForm({...payForm, payment_type: e.target.value})}>
                <option value="full">Full</option>
                <option value="partial">Partial</option>
                <option value="advance">Advance</option>
              </select>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button onClick={closePayDialog}>Cancel</button>
              <button onClick={submitPay} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Pay'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Transaction History</h2>
          <div style={{display:'flex', gap:8}}>
            <button style={styles.outlineBtn} onClick={handleExportTransactions} disabled={!transactions || transactions.length === 0}>
              <span style={{marginRight: '8px', display:'flex'}}><Icons.Download /></span> Export Report
            </button>
            <button style={styles.outlineBtn} onClick={openCreateDialog}>Create Transaction</button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: 20}}>Loading...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tHeadRow}>
                <th style={styles.th}>Invoice ID</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Freelancer</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions && transactions.length ? transactions.map((t) => {
                const refKey = t.invoice_id || t.id;
                return (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{resolveInvoiceId(t)}</td>
                  <td style={styles.td}>{formatDisplayDate(t.created_at || t.date)}</td>
                  <td style={{...styles.td, fontWeight: '500'}}>{t.description}</td>
                  <td style={styles.td}>{t.freelancer_name || t.freelancer_email || t.freelancer || t.recipient}</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>
                    {t.amount}
                    {t.paid_amount ? (
                      <div style={{fontSize:12,color:'#64748b'}}>Paid: {t.paid_amount}{Number(t.paid_amount) < Number(t.amount) ? ` — Remaining: ${ (Number(t.amount) - Number(t.paid_amount)).toFixed(2) }` : ''}</div>
                    ) : null}
                  </td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, backgroundColor: t.status === 'paid' ? '#dcfce7' : '#fef3c7', color: t.status === 'paid' ? '#166534' : '#b45309'}}>
                      {t.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {t.status === 'pending' && (
                      <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                        <input ref={(el) => { fileRefs.current[refKey] = el; }} type="file" />
                        <button style={styles.linkBtn} onClick={() => handleUploadProof(refKey)}>Upload Proof</button>
                        {(t.proof_url || t.proof || t.receipt_url) && (
                          <button
                            style={{ ...styles.linkBtn, borderStyle: 'dashed' }}
                            onClick={() => window.open(t.proof_url || t.proof || t.receipt_url, '_blank')}
                          >
                            View Proof
                          </button>
                        )}
                      </div>
                    )}
                    {t.status === 'pending' && (
                      <div style={{display:'flex', gap:8, marginTop:8}}>
                        <button style={styles.linkBtn} onClick={() => handleClientAction(t.invoice_id || t.id, 'pay')}>Pay</button>
                        <button style={styles.linkBtn} onClick={() => handleClientAction(t.invoice_id || t.id, 'reject')}>Reject</button>
                        <button style={styles.linkBtn} onClick={() => handleClientAction(t.invoice_id || t.id, 'hold')}>Hold</button>
                      </div>
                    )}
                    {t.status === 'partial' && (
                      <div style={{display:'flex', gap:8, marginTop:8}}>
                        <button
                          style={styles.linkBtn}
                          disabled={actionLoading}
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              const remaining = Math.max(0, Number(t.amount || 0) - Number(t.paid_amount || 0));
                              const amountToPay = remaining || Number(t.amount || 0) || '';
                              await financeService.clientTransactionAction(t.invoice_id || t.id, { action: 'pay', amount: amountToPay, payment_type: 'full' });
                              await reloadTransactions();
                            } catch (err) {
                              console.error(err);
                              alert('Failed to mark as paid');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                        >
                          Mark as Paid
                        </button>
                        <button style={styles.linkBtn} onClick={() => handleClientAction(t.invoice_id || t.id, 'pay')}>Pay</button>
                      </div>
                    )}
                    {(t.download_url || t.proof_url || t.proof || t.receipt_url) && (
                      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop: t.status === 'pending' ? 8 : 0}}>
                        {t.download_url && (
                          <button style={styles.linkBtn} onClick={() => window.open(t.download_url, '_blank')}>Download</button>
                        )}
                        {(t.proof_url || t.proof || t.receipt_url) && (
                          <button style={{ ...styles.linkBtn, borderStyle: 'dashed' }} onClick={() => window.open(t.proof_url || t.proof || t.receipt_url, '_blank')}>
                            View Proof
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );}) : (
                <tr><td colSpan={7} style={{padding:20}}>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, sub, icon, color }) => (
  <div style={styles.statCard}>
    <div style={{...styles.iconBox, backgroundColor: `${color}15`, color: color}}>{icon}</div>
    <div>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statAmount}>{amount}</div>
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  </div>
);

const styles = {
  container: {
    width: '100%',
    margin: 0,
    padding: '32px',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
    minHeight: '100%',
  },
  pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#1e293b', marginBottom: '28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  statAmount: { fontSize: '26px', fontWeight: 'bold', color: '#1e293b' },
  statSub: { fontSize: '12px', color: '#94a3b8' },
  card: { backgroundColor: 'white', padding: '32px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b' },
  outlineBtn: { padding: '12px 18px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569', fontSize: '14px', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tHeadRow: { borderBottom: '2px solid #f1f5f9' },
  th: { textAlign: 'left', padding: '14px 12px', fontSize: '13px', color: '#64748b', fontWeight: '700', letterSpacing: '0.01em' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '16px 12px', fontSize: '14px', color: '#334155' },
  badge: { padding: '6px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' },
  linkBtn: { background: 'none', border: '1px solid #e2e8f0', color: '#1d4ed8', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '8px 12px', borderRadius: '10px' }
};

export default ClientFinancials;