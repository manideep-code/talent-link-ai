import axiosInstance from '../utils/axiosInstance';

const financeService = {
  // Client
  getClientOverview: async () => {
    const res = await axiosInstance.get('finance/client/overview/');
    return res.data;
  },
  getClientTransactions: async () => {
    const res = await axiosInstance.get('finance/client/transactions/');
    return res.data;
  },
  submitTransactionProof: async (transactionId, file) => {
    const form = new FormData();
    form.append('transaction_id', transactionId);
    if (file) form.append('proof', file);
    const res = await axiosInstance.post('finance/client/transactions/upload-proof/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Freelancer
  getFreelancerOverview: async () => {
    const res = await axiosInstance.get('finance/freelancer/overview/');
    return res.data;
  },
  getFreelancerTransactions: async () => {
    const res = await axiosInstance.get('finance/freelancer/transactions/');
    return res.data;
  },
  getExpenses: async () => {
    const res = await axiosInstance.get('finance/expenses/');
    return res.data;
  },
  addExpense: async (payload) => {
    const form = new FormData();
    form.append('item', payload.item);
    form.append('date', payload.date);
    form.append('category', payload.category);
    form.append('amount', payload.amount);
    if (payload.client) form.append('client', payload.client);
    if (payload.receipt) form.append('receipt', payload.receipt);
    const res = await axiosInstance.post('finance/expenses/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  // Transactions: create by freelancer
  createFreelancerTransaction: async (payload) => {
    const res = await axiosInstance.post('finance/freelancer/transactions/', payload);
    return res.data;
  },
  // Client create transaction (advance/partial/full)
  createClientTransaction: async (payload) => {
    const res = await axiosInstance.post('finance/client/transactions/', payload);
    return res.data;
  },
  // Client actions on a transaction (pay/reject/hold)
  clientTransactionAction: async (invoiceId, actionPayload) => {
    const res = await axiosInstance.post(`finance/client/transactions/${invoiceId}/action/`, actionPayload);
    return res.data;
  },
  requestPayout: async (amount, method = 'bank') => {
    const res = await axiosInstance.post('finance/payout-requests/', { amount, method });
    return res.data;
  },
};

export default financeService;
