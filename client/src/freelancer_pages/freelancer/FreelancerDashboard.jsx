

import React, { useState, useEffect, useMemo, useCallback } from "react"; // 1. Import useState
import Alert from '@mui/material/Alert';
import { Grid, Card, Typography, Box, Chip, Button, Avatar, List, ListItem, ListItemAvatar, ListItemText, IconButton, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { useUser } from "../../context/UserContext";
import financeService from "../../services/financeService";
import { contractService } from "../../services/contractService";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import RecommendedProjectsCard from "../../components/Matching/RecommendedProjectsCard";

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && typeof value.valueOf === 'function') {
    const parsed = Number(value.valueOf());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrencyINR = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(toNumber(value));

const formatRelativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const statusColorMap = {
  active: '#3b82f6',
  in_progress: '#3b82f6',
  pending: '#f59e0b',
  draft: '#94a3b8',
  completed: '#10b981',
  paused: '#ef4444',
};

const chipColorMap = {
  paid: { bg: '#ecfdf5', color: '#10b981', tone: 'success' },
  completed: { bg: '#ecfdf5', color: '#10b981', tone: 'success' },
  pending: { bg: '#fff7ed', color: '#f59e0b', tone: 'warning' },
  partial: { bg: '#fefce8', color: '#eab308', tone: 'warning' },
  on_hold: { bg: '#f1f5f9', color: '#64748b', tone: 'warning' },
  rejected: { bg: '#fef2f2', color: '#ef4444', tone: 'error' },
  failed: { bg: '#fef2f2', color: '#ef4444', tone: 'error' },
};

const getTransactionAmount = (tx) => {
  const paid = toNumber(tx?.paid_amount);
  if (paid > 0) return paid;
  const status = (tx?.status || '').toLowerCase();
  if (status === 'paid' || status === 'completed') return toNumber(tx?.amount);
  return 0;
};

const startOfWeek = (date) => {
  const base = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = base.getUTCDay();
  const diff = (day + 6) % 7; // convert so Monday is first day
  base.setUTCDate(base.getUTCDate() - diff);
  return base;
};

const computeSeries = (transactions = [], period = 'Daily') => {
  const buckets = new Map();
  const limit = period === 'Daily' ? 14 : period === 'Weekly' ? 12 : 12;

  transactions.forEach((tx) => {
    const createdAt = tx?.created_at ? new Date(tx.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return;
    const amount = getTransactionAmount(tx);
    if (amount <= 0) return;

    let key;
    let label;
    let order;

    if (period === 'Daily') {
      key = createdAt.toISOString().slice(0, 10);
      label = createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      order = Date.UTC(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
    } else if (period === 'Weekly') {
      const weekStart = startOfWeek(createdAt);
      key = weekStart.toISOString().slice(0, 10);
      label = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      order = weekStart.getTime();
    } else {
      key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      label = createdAt.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      order = createdAt.getFullYear() * 12 + createdAt.getMonth();
    }

    const existing = buckets.get(key) || { name: label, value: 0, order };
    existing.value += amount;
    existing.name = label;
    buckets.set(key, existing);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .slice(-limit)
    .map((entry) => ({ name: entry.name, value: Number(entry.value.toFixed(2)) }));
};

const deriveStatsData = (overview, transactions = [], contracts = [], proposals = []) => {
  const totalIncome = toNumber(overview?.total_income);
  const netProfit = toNumber(overview?.net_profit);
  const pendingInvoices = Number(overview?.pending_invoices || 0);

  const activeContracts = contracts.filter((contract) => {
    const status = (contract?.status || '').toLowerCase();
    return status === 'active' || status === 'in_progress';
  });
  const completedContracts = contracts.filter((contract) => (contract?.status || '').toLowerCase() === 'completed');

  const proposalStatuses = proposals.reduce(
    (acc, proposal) => {
      const status = (proposal?.status || '').toLowerCase();
      acc.total += 1;
      if (status === 'accepted') acc.accepted += 1;
      if (status === 'submitted') acc.submitted += 1;
      return acc;
    },
    { total: 0, accepted: 0, submitted: 0 }
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const earnedThisMonth = transactions.reduce((sum, tx) => {
    const createdAt = tx?.created_at ? new Date(tx.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return sum;
    if (createdAt >= monthStart) return sum + getTransactionAmount(tx);
    return sum;
  }, 0);

  return [
    {
      key: 'income',
      title: 'Total Income',
      value: formatCurrencyINR(totalIncome),
      icon: <AttachMoneyIcon />,
      change: `Net ${formatCurrencyINR(netProfit)}`,
      isPositive: netProfit >= 0,
      bgColor: '#ecfdf5',
      iconColor: '#10b981',
    },
    {
      key: 'earned-month',
      title: 'This Month Earnings',
      value: formatCurrencyINR(earnedThisMonth),
      icon: <ArrowUpwardIcon />,
      change: proposalStatuses.submitted ? `${proposalStatuses.submitted} proposals submitted` : 'No proposals yet',
      isPositive: earnedThisMonth > 0,
      bgColor: '#eff6ff',
      iconColor: '#3b82f6',
    },
    {
      key: 'contracts',
      title: 'Active Contracts',
      value: activeContracts.length.toString(),
      icon: <CheckCircleIcon />,
      change: `${completedContracts.length} completed`,
      isPositive: activeContracts.length > 0,
      bgColor: '#fefce8',
      iconColor: '#eab308',
    },
    {
      key: 'invoices',
      title: 'Pending Invoices',
      value: pendingInvoices.toString(),
      icon: <ReceiptLongIcon />,
      change: proposalStatuses.accepted ? `${proposalStatuses.accepted} proposals accepted` : 'Awaiting approvals',
      isPositive: pendingInvoices === 0,
      bgColor: pendingInvoices === 0 ? '#ecfdf5' : '#fef2f2',
      iconColor: pendingInvoices === 0 ? '#10b981' : '#ef4444',
    },
  ];
};

const deriveActiveContracts = (contracts = [], proposals = []) => {
  const proposalById = new Map((proposals || []).map((proposal) => [proposal.id, proposal]));
  return contracts
    .filter((contract) => {
      const status = (contract?.status || '').toLowerCase();
      return status === 'active' || status === 'in_progress' || status === 'pending';
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)
    .map((contract) => {
      const status = (contract?.status || '').toLowerCase();
      const color = statusColorMap[status] || '#8b5cf6';
      const proposal = proposalById.get(contract.proposal);
      const title = contract.title || proposal?.project_title || `Contract #${contract.id}`;
      const subtitleParts = [];
      if (proposal?.client_name) subtitleParts.push(proposal.client_name);
      if (proposal?.bid_amount) subtitleParts.push(formatCurrencyINR(proposal.bid_amount));
      const subtitle = subtitleParts.join(' • ') || 'No additional details';

      let time = 'No end date';
      if (contract.end_date) {
        const end = new Date(contract.end_date);
        if (!Number.isNaN(end.getTime())) {
          const diffDays = Math.ceil((end - new Date()) / 86400000);
          if (diffDays > 1) time = `${diffDays} days left`;
          else if (diffDays === 1) time = 'Due tomorrow';
          else if (diffDays === 0) time = 'Due today';
          else time = `${Math.abs(diffDays)} days overdue`;
        }
      }

      return {
        id: contract.id,
        title,
        subtitle,
        time,
        color,
        status: status || 'active',
      };
    });
};

const deriveLatestClients = (transactions = []) => {
  const byClient = new Map();

  transactions.forEach((tx) => {
    const key = tx?.client || tx?.client_email || tx?.client_name;
    if (!key) return;
    const createdAt = tx?.created_at ? new Date(tx.created_at) : null;
    const clientId = tx?.client || null;
    const email = tx?.client_email || '';
    const latest = byClient.get(key);
    if (!latest || (createdAt && createdAt > latest.createdAt)) {
      byClient.set(key, {
        id: key,
        name: tx?.client_name || tx?.client_email || 'Client',
        clientId,
        email,
        project: tx?.description || 'Recent engagement',
        status: (tx?.status || '').toLowerCase(),
        createdAt: createdAt || new Date(0),
      });
    }
  });

  return Array.from(byClient.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)
    .map((entry) => {
      const chip = chipColorMap[entry.status] || { tone: 'default' };
      const statusLabel = entry.status ? entry.status.replace(/_/g, ' ') : 'Pending';
      return {
        id: entry.id,
        name: entry.name,
        project: entry.project,
        status: statusLabel.replace(/\b\w/g, (char) => char.toUpperCase()),
        statusColor: chip.tone === 'default' ? 'default' : chip.tone,
        avatarColor: chip.color || '#3b82f6',
        createdAt: entry.createdAt,
      };
    });
};

const deriveRecentTransactions = (transactions = []) =>
  transactions
    .filter((tx) => tx?.invoice_id)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 6)
    .map((tx) => {
      const statusKey = (tx?.status || '').toLowerCase();
      const chip = chipColorMap[statusKey] || {};
      return {
        id: tx.invoice_id,
        client: tx.client_name || tx.client_email || 'Client',
        date: tx.created_at ? new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        amount: formatCurrencyINR(getTransactionAmount(tx) || tx.amount),
        status: statusKey ? statusKey.replace(/_/g, ' ') : 'pending',
        chip,
      };
    });

export default function FreelancerDashboard() {
  // 2. State to handle the active time range
  const [timeRange, setTimeRange] = useState("Daily");
  const navigate = useNavigate();
  const { user } = useUser();

  // Welcome / Notification state
  const [welcome, setWelcome] = useState(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [transactionsData, setTransactionsData] = useState([]);
  const [contractsData, setContractsData] = useState([]);
  const [proposalsData, setProposalsData] = useState([]);

  const loadDashboard = useCallback(async () => {
    const requests = [
      financeService.getFreelancerOverview(),
      financeService.getFreelancerTransactions(),
      axiosInstance.get('proposals/').then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return data ? [data] : [];
      }),
      contractService.getContracts(),
    ];

    const sources = ['finance overview', 'transactions', 'proposals', 'contracts'];
    const results = await Promise.allSettled(requests);
    return { results, sources };
  }, []);

  const applyDashboardResults = useCallback((results, sources) => {
    const getValue = (idx, fallback) =>
      results[idx]?.status === 'fulfilled' ? results[idx].value ?? fallback : fallback;

    const normalizeList = (value) => {
      if (Array.isArray(value)) return value;
      if (value && Array.isArray(value.results)) return value.results;
      return value ? [value] : [];
    };

    setOverview(getValue(0, null));
    setTransactionsData(normalizeList(getValue(1, [])));
    setProposalsData(normalizeList(getValue(2, [])));
    setContractsData(normalizeList(getValue(3, [])));

    const firstError = results.find((result) => result.status === 'rejected');
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error('Freelancer dashboard: failed to load', sources[idx], result.reason);
      }
    });

    if (firstError) {
      const status = firstError.reason?.response?.status;
      setDashboardError({
        severity: status === 401 ? 'error' : 'warning',
        message:
          status === 401
            ? 'Session expired. Please sign in again to refresh your dashboard.'
            : 'Some freelancer dashboard data could not be loaded. Showing the data available.',
      });
    } else {
      setDashboardError(null);
    }
  }, []);

  useEffect(() => {
    if (welcome) {
      return;
    }
    try {
      const pendingRaw = localStorage.getItem('pending_welcome');
      if (pendingRaw) {
        localStorage.removeItem('pending_welcome');
        let pendingData = {};
        try {
          pendingData = JSON.parse(pendingRaw) || {};
        } catch (parseError) {
          pendingData = {};
        }

        const displayName = (user?.name || localStorage.getItem('user_name') || '').trim();
        const variant = pendingData.variant || null;
        const message = variant === 'new'
          ? null
          : pendingData.message || (displayName ? `Welcome back, ${displayName}!` : 'Welcome back!');

        setWelcome({ title: 'Welcome to TalentLink', message: message || undefined });
        setWelcomeOpen(true);
        return;
      }

      const displayName = (user?.name || localStorage.getItem('user_name') || '').trim();
      if (displayName) {
        setWelcome({ title: 'Welcome to TalentLink ' });
        setWelcomeOpen(true);
        return;
      }

      const existing = JSON.parse(localStorage.getItem('local_notifications') || '[]');
      const firstUnread = existing.find((n) => !n.read);
      if (firstUnread) {
        setWelcome({ title: firstUnread.title, message: firstUnread.message });
        setWelcomeOpen(true);
      }
    } catch (e) {
      // ignore
    }
  }, [user?.name, welcome]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const { results, sources } = await loadDashboard();
        if (!active) return;
        applyDashboardResults(results, sources);
      } catch (error) {
        if (!active) return;
        console.error('Freelancer dashboard: unexpected error', error);
        setOverview(null);
        setTransactionsData([]);
        setProposalsData([]);
        setContractsData([]);
        setDashboardError({
          severity: 'error',
          message: 'Unable to load dashboard data right now. Please try refreshing.',
        });
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [loadDashboard, applyDashboardResults]);

  const refreshDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const { results, sources } = await loadDashboard();
      applyDashboardResults(results, sources);
    } catch (error) {
      console.error('Freelancer dashboard: refresh error', error);
      setDashboardError({
        severity: 'error',
        message: 'Refresh failed. Please try again in a moment.',
      });
    } finally {
      setDashboardLoading(false);
    }
  }, [loadDashboard, applyDashboardResults]);

  const handleWelcomeClose = () => {
    setWelcomeOpen(false);
    try {
      localStorage.removeItem('pending_welcome');
    } catch (e) {}
  };

  const stats = useMemo(
    () => deriveStatsData(overview, transactionsData, contractsData, proposalsData),
    [overview, transactionsData, contractsData, proposalsData]
  );

  const dailySeries = useMemo(() => computeSeries(transactionsData, 'Daily'), [transactionsData]);
  const weeklySeries = useMemo(() => computeSeries(transactionsData, 'Weekly'), [transactionsData]);
  const monthlySeries = useMemo(() => computeSeries(transactionsData, 'Monthly'), [transactionsData]);

  const chartSeries = useMemo(() => {
    switch (timeRange) {
      case 'Weekly':
        return weeklySeries;
      case 'Monthly':
        return monthlySeries;
      case 'Daily':
      default:
        return dailySeries;
    }
  }, [timeRange, dailySeries, weeklySeries, monthlySeries]);

  const activeProjects = useMemo(() => deriveActiveContracts(contractsData, proposalsData), [contractsData, proposalsData]);
  const latestClients = useMemo(() => deriveLatestClients(transactionsData), [transactionsData]);
  const recentTransactions = useMemo(() => deriveRecentTransactions(transactionsData), [transactionsData]);

  const handleMessagesClick = useCallback(
    (client) => {
      const clientHint = client?.clientId || client?.email || client?.id;
      navigate('/freelancer/messages', clientHint ? { state: { clientHint } } : undefined);
    },
    [navigate]
  );

  const handleFindWork = useCallback(() => {
    navigate('/freelancer/projects');
  }, [navigate]);
  const hasChartData = chartSeries.length > 0;
  const primaryCardHeight = { xs: 'auto', md: 420, xl: 500 };
  const secondaryCardHeight = { xs: 'auto', md: 360, xl: 420 };

  // Helper style for active/inactive buttons
  const getButtonStyle = (range) => ({
    bgcolor: timeRange === range ? "white" : "transparent",
    boxShadow: timeRange === range ? 1 : 0,
    color: timeRange === range ? "text.primary" : "text.secondary",
    "&:hover": { bgcolor: timeRange === range ? "white" : "rgba(0,0,0,0.04)" }
  });

  return (
    <Box
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        px: { xs: 1.5, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: 'calc(100vh - 96px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
      }}
    >
      <Box sx={{ maxWidth: '100%', width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column' }}>
      {welcome && welcomeOpen && (
        <Alert severity="success" onClose={handleWelcomeClose} sx={{ mb: 2 }}>
          <strong>{welcome.title || 'Welcome to TalentLink'}</strong>
          {welcome.message ? `: ${welcome.message}` : null}
        </Alert>
      )}
      {dashboardError && (
        <Alert severity={dashboardError.severity} sx={{ mb: 2 }}>
          {dashboardError.message}
        </Alert>
      )}
      {dashboardLoading && <LinearProgress sx={{ mb: 2 }} />}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{`Welcome${user?.name ? '' : ' Back'}, ${user?.name || 'User'}`}</Typography>
          <Typography variant="body1" color="text.secondary">Manage your proposals, contracts, and earnings in one place.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={refreshDashboard} disabled={dashboardLoading}>
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFindWork}
          >
            Find Work
          </Button>
        </Box>
      </Box>
      {/* --- Top Stats Row --- */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }} alignItems="stretch">
        {stats.length > 0 ? stats.map((stat) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={stat.key} sx={{ display: 'flex' }}>
            <Card
              sx={{
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: 'column',
                justifyContent: "space-between",
                minHeight: { xs: 'auto', md: 170 },
                height: '100%',
                width: '100%',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                border: '1px solid #e2e8f0',
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <Avatar sx={{ bgcolor: stat.bgColor, color: stat.iconColor, width: 56, height: 56 }}>
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.title}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: stat.isPositive ? 'success.main' : 'error.main' }}>
                  {stat.isPositive ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  <Typography variant="caption" fontWeight="bold">{stat.change}</Typography>
              </Box>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {dashboardLoading ? 'Loading earnings summary…' : 'No financial activity to summarize yet.'}
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
 
      {/* --- AI-POWERED PROJECTS FOR YOU --- */}
      <Box sx={{ mt: 3, mb: 1 }}>
        <RecommendedProjectsCard />
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch" sx={{ flex: 1 }}>
        
        {/* --- ROW 2: Earnings Trend & Active Projects --- */}

        {/* Task Progress Chart */}
        <Grid item xs={12} md={7} lg={7} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, height: "100%", minHeight: primaryCardHeight, display: 'flex', flexDirection: 'column', width: '100%', boxShadow: '0 14px 40px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6">Earnings Trend</Typography>
              
              {/* 4. Functional Buttons */}
              <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 2, p: 0.5 }}>
                <Button size="small" onClick={() => setTimeRange("Daily")} sx={getButtonStyle("Daily")}>Daily</Button>
                <Button size="small" onClick={() => setTimeRange("Weekly")} sx={getButtonStyle("Weekly")}>Weekly</Button>
                <Button size="small" onClick={() => setTimeRange("Monthly")} sx={getButtonStyle("Monthly")}>Monthly</Button>
              </Box>
            </Box>

            {hasChartData ? (
              <Box sx={{ flexGrow: 1, minHeight: 320, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(value) => formatCurrencyINR(value)}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0px 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [formatCurrencyINR(value), 'Earnings']}
                    />
                    <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, minHeight: 260 }}>
                <Typography variant="body2" color="text.secondary">
                  {dashboardLoading ? 'Loading earnings trend…' : 'No earnings recorded for the selected range.'}
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Active Projects List */}
        <Grid item xs={12} md={5} lg={5} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, height: "100%", minHeight: primaryCardHeight, display: 'flex', flexDirection: 'column', width: '100%', boxShadow: '0 14px 40px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Active Projects</Typography>
              <Button size="small" color="secondary" disabled={activeProjects.length === 0}>See All</Button>
            </Box>
            <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              {activeProjects.length > 0 ? (
                activeProjects.map((project, index) => (
                  <React.Fragment key={project.id}>
                    <ListItem alignItems="flex-start" disableGutters sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${project.color}20`, color: project.color, width: 36, height: 36 }}>
                          <Box sx={{ width: 10, height: 10, bgcolor: 'currentColor', borderRadius: '50%' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{project.title}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{project.subtitle}</Typography>}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                        <Typography variant="caption">{project.time}</Typography>
                      </Box>
                    </ListItem>
                    {index < activeProjects.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem disableGutters sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={<Typography variant="body2" color="text.secondary">{dashboardLoading ? 'Loading active contracts…' : 'No active contracts yet.'}</Typography>}
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>

        {/* --- ROW 3: Recent Transactions & Latest Clients --- */}

        {/* Recent Transactions */}
        <Grid item xs={12} md={7} lg={7} sx={{ display: 'flex' }}>
          <Card sx={{ p: { xs: 2, md: 3 }, height: "100%", display: 'flex', flexDirection: 'column', minHeight: secondaryCardHeight, width: '100%', boxShadow: '0 14px 40px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongIcon color="action" /> Recent Transactions
              </Typography>
            </Box>
            
            <TableContainer sx={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto' }}>
              <Table sx={{ minWidth: { xs: '100%', sm: 480 } }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Invoice ID</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Client</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.length > 0 ? recentTransactions.map((row) => (
                    <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                        {row.id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.client}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.date}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.amount}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={row.status.replace(/\b\w/g, (char) => char.toUpperCase())}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 1,
                            bgcolor: row.chip.bg || '#f1f5f9',
                            color: row.chip.color || '#475569'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {dashboardLoading ? 'Loading recent transactions…' : 'No transactions recorded yet.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Latest Clients List */}
          <Grid item xs={12} md={5} lg={5} sx={{ display: 'flex' }}>
            <Card sx={{ p: { xs: 2, md: 3 }, height: "100%", display: 'flex', flexDirection: 'column', minHeight: secondaryCardHeight, width: '100%', boxShadow: '0 14px 40px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Latest Clients</Typography>
              <IconButton size="small"><MoreHorizIcon /></IconButton>
            </Box>
            <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              {latestClients.length > 0 ? latestClients.map((client) => (
                <ListItem key={client.id} disableGutters sx={{ py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${client.avatarColor}33`, color: client.avatarColor }}>
                      {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{client.name}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{client.project}</Typography>}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                    <Chip label={client.status} color={client.statusColor} size="small" sx={{ fontWeight: 500, fontSize: 11, height: 24 }} />
                    <Typography variant="caption" color="text.secondary">{formatRelativeTime(client.createdAt)}</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ py: 0.5, px: 2, fontSize: 11, borderColor: 'divider', color: 'text.secondary', width: { xs: '100%', sm: 'auto' } }}
                      onClick={() => handleMessagesClick(client)}
                    >
                      Message
                    </Button>
                  </Box>
                </ListItem>
              )) : (
                <ListItem disableGutters sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={<Typography variant="body2" color="text.secondary">{dashboardLoading ? 'Loading client activity…' : 'No recent client activity yet.'}</Typography>}
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  </Box>
  );
}




