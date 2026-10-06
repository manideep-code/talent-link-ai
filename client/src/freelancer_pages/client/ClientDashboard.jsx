import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom'; 
import { useUser } from '../../context/UserContext';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
// 1. Import useTheme to access dynamic colors
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import financeService from '../../services/financeService';
import { contractService } from '../../services/contractService';
import axiosInstance from '../../utils/axiosInstance';

// --- SVG ICONS ---
const Icons = {
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-8h-4z"></path></svg>
  ),
  Briefcase: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  Invoice: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
  )
};

// --- DATA HELPERS ---
const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '');
    const num = Number.parseFloat(normalized);
    return Number.isFinite(num) ? num : 0;
  }
  if (typeof value === 'object' && typeof value.valueOf === 'function') {
    const num = Number(value.valueOf());
    return Number.isFinite(num) ? num : 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrencyINR = (value) =>
  new Intl.NumberFormat('en-IN', {
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
  if (diffMs < 0) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const CLIENT_FIRST_VISIT_BASE_KEY = 'client_dashboard_seen';

const computeSpendingSeries = (transactions = []) => {
  const buckets = new Map();
  transactions.forEach((tx) => {
    const createdAt = tx?.created_at ? new Date(tx.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return;
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
    const label = createdAt.toLocaleString(undefined, { month: 'short' });
    const paidAmount =
      toNumber(tx?.paid_amount) ||
      (['paid', 'completed'].includes((tx?.status || '').toLowerCase()) ? toNumber(tx?.amount) : 0);
    const existing =
      buckets.get(key) ||
      { name: label, value: 0, order: createdAt.getFullYear() * 12 + createdAt.getMonth() };
    existing.value += paidAmount;
    existing.name = label;
    buckets.set(key, existing);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .slice(-6)
    .map(({ name, value }) => ({ name, value: Number(value.toFixed(2)) }));
};

const PROPOSAL_STATUS_META = {
  submitted: { label: 'New Proposal', color: '#f59e0b' },
  considering: { label: 'In Review', color: '#6366f1' },
  accepted: { label: 'Accepted', color: '#10b981' },
  rejected: { label: 'Rejected', color: '#ef4444' },
  default: { label: 'Update', color: '#3b82f6' },
};

const TRANSACTION_STATUS_META = {
  pending: { label: 'Invoice Pending', color: '#ef4444' },
  partial: { label: 'Partial Payment', color: '#f97316' },
  on_hold: { label: 'On Hold', color: '#eab308' },
  overdue: { label: 'Overdue', color: '#dc2626' },
  default: { label: 'Invoice', color: '#94a3b8' },
};

const JOB_PROGRESS_WIDTH = {
  open: '35%',
  pending: '25%',
  active: '80%',
  completed: '100%',
  cancelled: '15%',
};

const JOB_PROGRESS_COLOR = {
  active: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const getProposalStatusMeta = (status) =>
  PROPOSAL_STATUS_META[(status || '').toLowerCase()] || PROPOSAL_STATUS_META.default;

const deriveActionItems = (proposals = [], transactions = []) => {
  const items = [];

  const proposalItems = proposals
    .filter((proposal) => ['submitted', 'considering'].includes((proposal?.status || '').toLowerCase()))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 4);

  proposalItems.forEach((proposal) => {
    const meta = getProposalStatusMeta(proposal.status);
    items.push({
      id: `proposal-${proposal.id}`,
      title: proposal.project_title ? `Review "${proposal.project_title}"` : 'Review proposal',
      date: formatRelativeTime(proposal.created_at),
      tag: meta.label,
      color: meta.color,
    });
  });

  if (items.length < 4) {
    const transactionItems = transactions
      .filter((tx) => ['pending', 'partial', 'on_hold', 'overdue'].includes((tx?.status || '').toLowerCase()))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(0, 4 - items.length);

    transactionItems.forEach((tx) => {
      const meta = TRANSACTION_STATUS_META[(tx?.status || '').toLowerCase()] || TRANSACTION_STATUS_META.default;
      items.push({
        id: `transaction-${tx.id || tx.invoice_id}`,
        title: `Invoice ${tx.invoice_id || tx.id}`,
        date: formatRelativeTime(tx.created_at),
        tag: meta.label,
        color: meta.color,
      });
    });
  }

  return items;
};

const deriveActiveJobs = (projects = [], proposals = []) => {
  const proposalCounts = proposals.reduce((map, proposal) => {
    if (!proposal?.project_id) return map;
    const entry = map.get(proposal.project_id) || { total: 0 };
    entry.total += 1;
    map.set(proposal.project_id, entry);
    return map;
  }, new Map());

  return projects
    .filter((project) => ['open', 'pending', 'active'].includes((project?.status || '').toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)
    .map((project) => {
      const entry = proposalCounts.get(project.id) || {};
      const applicants = Number(entry.total || project.proposals_count || 0);
      return {
        id: project.id,
        title: project.title || 'Untitled project',
        applicants,
        status: project.status || 'Open',
      };
    });
};

const ACTIVITY_META = {
  proposal_submitted: { Icon: Icons.FileText, color: '#3b82f6' },
  contract_created: { Icon: Icons.Briefcase, color: '#10b981' },
  contract_updated: { Icon: Icons.Briefcase, color: '#f59e0b' },
  project_posted: { Icon: Icons.Briefcase, color: '#6366f1' },
  message_received: { Icon: Icons.Users, color: '#0ea5e9' },
  default: { Icon: Icons.Invoice, color: '#94a3b8' },
};

const getActivityMeta = (verb) => ACTIVITY_META[(verb || '').toLowerCase()] || ACTIVITY_META.default;

const deriveActivityFeed = (notifications = [], transactions = [], proposals = []) => {
  const items = [];

  notifications.slice(0, 6).forEach((notification) => {
    const { Icon, color } = getActivityMeta(notification?.verb);
    items.push({
      id: `notification-${notification.id}`,
      Icon,
      color,
      text: notification.title || notification.body || 'Notification',
      time: formatRelativeTime(notification.created_at),
    });
  });

  if (items.length < 6) {
    const transactionItems = [...transactions]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6 - items.length);

    transactionItems.forEach((tx) => {
      const statusKey = (tx?.status || '').toLowerCase();
      const color = statusKey === 'paid' ? '#10b981' : '#f97316';
      items.push({
        id: `transaction-${tx.id || tx.invoice_id}`,
        Icon: Icons.Invoice,
        color,
        text: `Invoice ${tx.invoice_id || tx.id} ${statusKey === 'paid' ? 'was paid' : 'requires attention'}`,
        time: formatRelativeTime(tx.created_at),
      });
    });
  }

  if (items.length < 6) {
    const proposalItems = proposals
      .filter((proposal) => ['submitted', 'considering', 'accepted'].includes((proposal?.status || '').toLowerCase()))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6 - items.length);

    proposalItems.forEach((proposal) => {
      const meta = getProposalStatusMeta(proposal.status);
      items.push({
        id: `proposal-${proposal.id}`,
        Icon: Icons.FileText,
        color: meta.color,
        text: proposal.project_title
          ? `Proposal for "${proposal.project_title}" is ${meta.label.toLowerCase()}`
          : `Proposal #${proposal.id} is ${meta.label.toLowerCase()}`,
        time: formatRelativeTime(proposal.created_at),
      });
    });
  }

  return items;
};

const ClientDashboard = () => {
  const navigate = useNavigate(); 
  const { user } = useUser();
  const [welcome, setWelcome] = useState(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [firstVisitKey, setFirstVisitKey] = useState(null);

  useEffect(() => {
    if (!user) return;

    const identifier = user.id ?? user.email ?? user.username ?? 'anon';
    const key = `${CLIENT_FIRST_VISIT_BASE_KEY}:${identifier}`;
    setFirstVisitKey(key);

    try {
      const stored = localStorage.getItem(key);
      setIsFirstVisit(stored !== '1');
    } catch (e) {
      setIsFirstVisit(true);
    }
  }, [user]);

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

        if (variant === 'new') {
          setIsFirstVisit(true);
        } else if (variant) {
          setIsFirstVisit(false);
        }

        setWelcome({ title: 'Welcome to TalentLink', message: message || undefined });
        setWelcomeOpen(true);
        return;
      }

      const displayName = (user?.name || localStorage.getItem('user_name') || '').trim();
      if (displayName) {
        setWelcome({ title: 'Welcome to TalentLink'});
        setWelcomeOpen(true);
        return;
      }

      const existing = JSON.parse(localStorage.getItem('local_notifications') || '[]');
      const firstUnread = existing.find(n => !n.read);
      if (firstUnread) {
        setWelcome({ title: firstUnread.title, message: firstUnread.message });
        setWelcomeOpen(true);
        setIsFirstVisit(false);
      }
    } catch (e) {
      // ignore
    }
  }, [user?.name, welcome]);

  useEffect(() => {
    if (!firstVisitKey || !isFirstVisit) return;
    try {
      localStorage.setItem(firstVisitKey, '1');
    } catch (e) {}
  }, [firstVisitKey, isFirstVisit]);

  const loadDashboard = useCallback(async () => {
    const requests = [
      financeService.getClientOverview(),
      financeService.getClientTransactions(),
      axiosInstance.get('projects/').then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return data ? [data] : [];
      }),
      axiosInstance.get('proposals/received/').then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return data ? [data] : [];
      }),
      contractService.getContracts(),
      axiosInstance.get('notifications/').then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return data ? [data] : [];
      }),
    ];

    const sources = [
      'finance overview',
      'transactions',
      'projects',
      'proposals',
      'contracts',
      'notifications',
    ];

    const results = await Promise.allSettled(requests);
    return { results, sources };
  }, []);

  const applyDashboardResults = useCallback((results, sources) => {
    const getValue = (idx, fallback) =>
      results[idx]?.status === 'fulfilled' ? results[idx].value ?? fallback : fallback;

    setOverview(getValue(0, null));
    setTransactions(Array.isArray(getValue(1, [])) ? getValue(1, []) : []);
    setProjects(Array.isArray(getValue(2, [])) ? getValue(2, []) : []);
    setProposals(Array.isArray(getValue(3, [])) ? getValue(3, []) : []);
    setContracts(Array.isArray(getValue(4, [])) ? getValue(4, []) : []);
    setNotifications(Array.isArray(getValue(5, [])) ? getValue(5, []) : []);

    const firstError = results.find((result) => result.status === 'rejected');
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`Client dashboard: failed to load ${sources[idx]}`, result.reason);
      }
    });

    if (firstError) {
      const status = firstError.reason?.response?.status;
      setDashboardError({
        severity: status === 401 ? 'error' : 'warning',
        message:
          status === 401
            ? 'Session expired. Please sign back in to load your dashboard data.'
            : 'Some dashboard widgets failed to load. Showing the data we could retrieve.',
      });
    } else {
      setDashboardError(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const { results, sources } = await loadDashboard();
        if (!active) return;
        applyDashboardResults(results, sources);
      } catch (err) {
        if (!active) return;
        console.error('Client dashboard: unexpected error', err);
        setOverview(null);
        setTransactions([]);
        setProjects([]);
        setProposals([]);
        setContracts([]);
        setNotifications([]);
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
    } catch (err) {
      console.error('Client dashboard: refresh error', err);
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
    try { localStorage.removeItem('pending_welcome'); } catch (e) {}
  };
  
  // 2. Get the current theme
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const pageContainerStyle = useMemo(() => ({
    ...styles.pageContainer,
    padding: isMobile ? '16px 14px' : '24px',
  }), [isMobile]);

  const headerStyle = useMemo(() => ({
    ...styles.header,
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? '12px' : '16px',
  }), [isMobile]);

  const headerActionsStyle = useMemo(() => ({
    ...styles.headerActions,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    width: isMobile ? '100%' : 'auto',
    justifyContent: isMobile ? 'flex-start' : 'flex-end',
  }), [isMobile]);

  const statsGridStyle = useMemo(() => ({
    ...styles.statsGrid,
    gap: isMobile ? '16px' : '20px',
    alignItems: 'stretch',
  }), [isMobile]);

  const statCardStyle = useMemo(() => ({
    ...styles.statCard,
    padding: isMobile ? '16px' : '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '12px',
  }), [isMobile]);

  const gridStyle = useMemo(() => ({
    ...styles.grid,
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '16px' : '25px',
    alignItems: 'stretch',
  }), [isMobile]);

  const columnStyle = useMemo(() => ({
    ...styles.column,
    width: '100%',
    gap: isMobile ? '16px' : '20px',
  }), [isMobile]);

  const cardHeaderStyle = useMemo(() => ({
    ...styles.cardHeader,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'flex-start',
    gap: isMobile ? '12px' : '0',
  }), [isMobile]);

  const handlePostJob = () => {
    navigate('/client/projects'); 
  };

  // 3. Create Dynamic Styles based on theme
  const themeStyles = useMemo(() => ({
    card: {
        ...styles.card,
        padding: isMobile ? '16px' : '25px',
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        color: theme.palette.text.primary,
    },
    textPrimary: { color: theme.palette.text.primary },
    textSecondary: { color: theme.palette.text.secondary },
    chartGrid: theme.palette.mode === 'dark' ? "#334155" : "#f1f5f9",
    chartText: theme.palette.mode === 'dark' ? "#94a3b8" : "#94a3b8",
    select: {
        ...styles.select,
        padding: isMobile ? '6px 8px' : '6px 10px',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderColor: theme.palette.divider
    }
  }), [isMobile, theme]);

  const spendingSeries = useMemo(() => computeSpendingSeries(transactions), [transactions]);
  const actionItems = useMemo(() => deriveActionItems(proposals, transactions), [proposals, transactions]);
  const jobsList = useMemo(() => deriveActiveJobs(projects, proposals), [projects, proposals]);
  const activityList = useMemo(
    () => deriveActivityFeed(notifications, transactions, proposals),
    [notifications, transactions, proposals]
  );

  const statsData = useMemo(() => {
    const openJobCount = projects.filter((project) => (project?.status || '').toLowerCase() === 'open').length;
    const activeJobCount = projects.filter((project) => (project?.status || '').toLowerCase() === 'active').length;
    const pendingJobCount = projects.filter((project) => (project?.status || '').toLowerCase() === 'pending').length;
    const newProposalsCount = proposals.filter((proposal) => (proposal?.status || '').toLowerCase() === 'submitted').length;
    const reviewProposalsCount = proposals.filter((proposal) =>
      ['submitted', 'considering'].includes((proposal?.status || '').toLowerCase())
    ).length;
    const uniqueFreelancers = new Set(
      (contracts || [])
        .map((contract) => contract?.freelancer)
        .filter(Boolean)
    ).size;
    const activeContractsCount = contracts.filter(
      (contract) => (contract?.status || '').toLowerCase() === 'active'
    ).length;

    const totalSpent = overview ? formatCurrencyINR(overview.total_spent) : formatCurrencyINR(0);
    const pendingAmount = overview ? formatCurrencyINR(overview.pending) : formatCurrencyINR(0);

    return [
      {
        key: 'spent',
        Icon: Icons.Wallet,
        title: 'Total Spent',
        value: totalSpent,
        change: overview ? `Pending ${pendingAmount}` : 'No pending invoices',
        color: '#3b82f6',
      },
      {
        key: 'jobs',
        Icon: Icons.Briefcase,
        title: 'Open Job Posts',
        value: openJobCount.toString(),
        change: `${activeJobCount} active · ${pendingJobCount} pending`,
        color: '#8b5cf6',
      },
      {
        key: 'proposals',
        Icon: Icons.FileText,
        title: 'New Proposals',
        value: newProposalsCount.toString(),
        change: `${reviewProposalsCount} awaiting review`,
        color: '#10b981',
      },
      {
        key: 'talent',
        Icon: Icons.Users,
        title: 'Hired Talent',
        value: uniqueFreelancers.toString(),
        change: `${activeContractsCount} active contracts`,
        color: '#ec4899',
      },
    ];
  }, [overview, projects, proposals, contracts]);

  return (
    <div style={pageContainerStyle}>
      {/* --- Welcome Alert (one-time) --- */}
      {welcome && welcomeOpen && (
        <div style={{ marginBottom: 12 }}>
          <Alert severity="success" onClose={handleWelcomeClose}>
            <strong>{welcome.title || 'Welcome to TalentLink'}</strong>
            {welcome.message ? `: ${welcome.message}` : null}
          </Alert>
        </div>
      )}

      {dashboardError && (
        <div style={{ marginBottom: 12 }}>
          <Alert severity={dashboardError.severity}>{dashboardError.message}</Alert>
        </div>
      )}

      {dashboardLoading && (
        <div style={styles.loadingBar}>
          <LinearProgress />
        </div>
      )}

      {/* --- Header --- */}
      <div style={headerStyle}>
        <div>
          <h1 style={{...styles.title, color: theme.palette.text.primary }}>{`${isFirstVisit ? 'Welcome' : 'Welcome Back'}, ${user?.name || user?.email || 'User'}`}</h1>
          <p style={{...styles.subtitle, color: theme.palette.text.secondary }}>Manage your job postings, proposals, and hired talent.</p>
        </div>
        <div style={headerActionsStyle}>
          <button
            style={{
              ...styles.secondaryBtn,
              opacity: dashboardLoading ? 0.7 : 1,
              cursor: dashboardLoading ? 'wait' : 'pointer',
            }}
            onClick={refreshDashboard}
            disabled={dashboardLoading}
          >
            Refresh
          </button>
          <button style={styles.btn} onClick={handlePostJob}>
            <span style={{ marginRight: '8px', display: 'flex' }}><Icons.Plus /></span> Post a Job
          </button>
        </div>
      </div>

      {/* --- Top Stats Row --- */}
      <div style={statsGridStyle}>
        {statsData.length > 0 ? (
          statsData.map(({ key, Icon, title, value, change, color }) => (
            <StatCard
              key={key}
              icon={<Icon />}
              title={title}
              value={value}
              change={change}
              color={color}
              theme={theme}
              cardStyle={statCardStyle}
            />
          ))
        ) : (
          <div style={styles.emptyState}>
            {dashboardLoading ? 'Loading dashboard stats…' : 'No dashboard stats available yet.'}
          </div>
        )}
      </div>

      {/* --- Middle Section: Chart & Deadlines --- */}
      <div style={gridStyle}>
        
        {/* Main Chart */}
        <div style={{...themeStyles.card, flex: isMobile ? '1 1 100%' : 2}}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={{...styles.cardTitle, ...themeStyles.textPrimary}}>Spending History</h2>
              <div style={{...styles.subTitle, ...themeStyles.textSecondary}}>Payments to freelancers over last 6 months</div>
            </div>
            <select style={themeStyles.select}><option>This Year</option></select>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {spendingSeries.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={spendingSeries}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeStyles.chartGrid} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: themeStyles.chartText, fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: themeStyles.chartText, fontSize: 12 }}
                    tickFormatter={(value) => formatCurrencyINR(value)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [formatCurrencyINR(value), 'Spent']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyState}>
                {dashboardLoading ? 'Loading spending data…' : 'No spending activity yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Deadlines & Hiring Status */}
        <div style={{...columnStyle, flex: isMobile ? '1 1 100%' : 1}}>
          
          {/* Deadlines Widget */}
          <div style={{...themeStyles.card, marginBottom: isMobile ? '16px' : '20px'}}>
            <h2 style={{...styles.cardTitle, ...themeStyles.textPrimary}}>Actions Required</h2>
            <div style={styles.list}>
              {actionItems.length > 0 ? (
                actionItems.map((item) => (
                  <div key={item.id} style={{...styles.deadlineItem, borderBottom: `1px solid ${theme.palette.divider}`}}>
                    <div style={styles.deadlineInfo}>
                      <span style={{color: item.color, marginRight:'10px', display:'flex'}}><Icons.Clock /></span>
                      <div>
                        <div style={{...styles.itemTitle, ...themeStyles.textPrimary}}>{item.title}</div>
                        <div style={{...styles.itemSub, ...themeStyles.textSecondary}}>{item.date}</div>
                      </div>
                    </div>
                    <span style={{...styles.tag, color: item.color, backgroundColor: `${item.color}20`}}>
                      {item.tag}
                    </span>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  {dashboardLoading ? 'Loading action items…' : 'No pending actions right now.'}
                </div>
              )}
            </div>
          </div>

          {/* Job Postings Status */}
          <div style={themeStyles.card}>
            <h2 style={{...styles.cardTitle, ...themeStyles.textPrimary}}>Job Postings</h2>
            <div style={styles.list}>
              {jobsList.length > 0 ? (
                jobsList.map((job) => {
                  const statusKey = (job.status || '').toLowerCase();
                  const width = JOB_PROGRESS_WIDTH[statusKey] || '25%';
                  const barColor = JOB_PROGRESS_COLOR[statusKey] || '#3b82f6';
                  return (
                    <div key={job.id || job.title} style={{marginBottom: '15px'}}>
                      <div style={styles.flexBetween}>
                        <span style={{...styles.itemTitle, ...themeStyles.textPrimary}}>{job.title}</span>
                        <span style={{...styles.itemSub, fontWeight: '600', color: '#3b82f6'}}>
                          {job.status || 'Open'}
                        </span>
                      </div>
                      <div style={{...styles.itemSub, ...themeStyles.textSecondary}}>
                        {job.applicants > 0 ? `${job.applicants} applicants` : 'No applicants yet'}
                      </div>
                      <div style={{...styles.progressBarBg, backgroundColor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'}}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width,
                            backgroundColor: barColor,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={styles.emptyState}>
                  {dashboardLoading ? 'Loading job postings…' : 'No active job postings yet.'}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- Bottom Section: Recent Activity --- */}
      <div style={themeStyles.card}>
        <h2 style={{...styles.cardTitle, ...themeStyles.textPrimary}}>Hiring & Payment Activity</h2>
        <div style={styles.activityList}>
          {activityList.length > 0 ? (
            activityList.map((item, index) => {
              const ActivityIcon = item.Icon || Icons.Invoice;
              return (
                <div key={item.id} style={styles.activityItem}>
                  <div style={{...styles.activityIcon, backgroundColor: `${item.color}20`, color: item.color}}>
                    <ActivityIcon />
                  </div>
                  <div style={styles.activityContent}>
                    <div style={{...styles.activityText, ...themeStyles.textPrimary}}>{item.text}</div>
                    <div style={{...styles.activityTime, ...themeStyles.textSecondary}}>{item.time}</div>
                  </div>
                  {index !== activityList.length - 1 && <div style={{...styles.connectorLine, backgroundColor: theme.palette.divider}}></div>}
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              {dashboardLoading ? 'Loading activity…' : 'No recent activity yet.'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// --- Helper Component: Stat Card ---
const StatCard = ({ icon, title, value, change, color, theme, cardStyle }) => (
  <div style={{
      ...(cardStyle || styles.statCard), 
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      boxShadow: theme.shadows[1]
  }}>
    <div style={styles.statHeader}>
      <div style={{...styles.statIcon, backgroundColor: `${color}20`, color: color}}>
        {icon}
      </div>
      <span style={{...styles.statChange, color: theme.palette.text.secondary}}>
        {change}
      </span>
    </div>
    <div style={{...styles.statValue, color: theme.palette.text.primary}}>{value}</div>
    <div style={{...styles.statTitle, color: theme.palette.text.secondary}}>{title}</div>
  </div>
);

// --- STYLES (Kept as base, colors overridden dynamically) ---
const styles = {
  pageContainer: {
    width: '100%',
    margin: 0,
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  greeting: {
    fontSize: '14px',
    margin: 0,
    marginBottom: '4px',
    fontWeight: '600',
  },
  title: {
    fontSize: '26px',
    fontWeight: 'bold',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    marginTop: '5px',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    transition: '0.2s',
  },
  btn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)',
    transition: '0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '25px',
    width: '100%',
  },
  statCard: {
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid', // Color handled dynamically
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChange: {
    fontSize: '12px',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: '13px',
    marginTop: '4px',
  },
  grid: {
    display: 'flex',
    gap: '25px',
    marginBottom: '25px',
    flexWrap: 'wrap',
    width: '100%',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  loadingBar: {
    marginBottom: '16px',
  },
  card: {
    padding: '25px',
    borderRadius: '16px',
    border: '1px solid', // Color handled dynamically
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
  },
  subTitle: {
    fontSize: '12px',
    marginTop: '4px',
  },
  select: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    outline: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px',
  },
  deadlineItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
  },
  deadlineInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
  },
  itemSub: {
    fontSize: '12px',
  },
  tag: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '12px',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  progressBarBg: {
    height: '6px',
    width: '100%',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  emptyState: {
    padding: '12px 0',
    fontSize: '13px',
    color: '#64748b',
  },
  activityList: {
    marginTop: '20px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '20px',
    position: 'relative',
  },
  activityIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
    zIndex: 2,
    flexShrink: 0,
    fontSize: '16px',
  },
  activityContent: {
    paddingTop: '4px',
  },
  activityText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: '12px',
    marginTop: '2px',
  },
  connectorLine: {
    position: 'absolute',
    left: '17px',
    top: '36px',
    bottom: '-25px',
    width: '2px',
    zIndex: 1,
  }
};

export default ClientDashboard;