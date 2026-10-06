import React, { useState, useEffect } from 'react';
import { contractService } from '../../services/contractService';
import profileService from '../../services/profileService';

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'on-hold', label: 'On Hold' },
];

const emptyFormState = {
    title: '',
    terms: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    status: 'active',
};

const ClientContracts = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [formData, setFormData] = useState(emptyFormState);
    const [saving, setSaving] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState({});
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            const data = await contractService.getClientContracts();
            // normalize list (API may return pagination or plain array)
            const items = data?.results || data || [];
            setContracts(items);

            // For contracts that do not include freelancer name object, fetch detail and merge
            const needDetail = items.filter((c) => {
                const name = c.freelancer_name || c.freelancer_full_name || (c.freelancer && typeof c.freelancer === 'object' && (c.freelancer.name || c.freelancer.first_name));
                return !name;
            });

            if (needDetail.length > 0) {
                await Promise.all(needDetail.map(async (c) => {
                    try {
                        const d = await contractService.getContract(c.id);
                        if (d) {
                            // If freelancer field is still a primitive id, try to resolve profile by user id
                            if (d.freelancer && (typeof d.freelancer === 'number' || typeof d.freelancer === 'string')) {
                                try {
                                    const pf = await profileService.freelancer.getProfileByUserId(d.freelancer);
                                    if (pf) d.freelancer = pf;
                                } catch (e) {
                                    // ignore
                                }
                            }
                            setContracts((prev) => prev.map((p) => p.id === d.id ? { ...p, ...d } : p));
                        }
                    } catch (e) {
                        console.debug('detail fetch failed for', c.id, e?.message||e);
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
            setFeedback({ type: 'error', message: 'Unable to load contracts right now.' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return Number.isNaN(d.getTime()) ? dateString : d.toLocaleDateString();
    };
    const resolveName = (entity, fallback) => {
        if (entity == null) return fallback || 'N/A';
        if (typeof entity === 'string') return entity;
        if (typeof entity === 'number') return `User #${entity}`;
        if (typeof entity === 'object') {
            if (entity.name) return entity.name;
            const first = entity.first_name || entity.firstName || '';
            const last = entity.last_name || entity.lastName || '';
            const full = `${first} ${last}`.trim();
            if (full) return full;
            if (entity.username) return entity.username;
            if (entity.email) return entity.email;
        }
        return fallback || 'N/A';
    };

    const getFreelancerName = (contract) => {
        if (!contract) return 'N/A';
        // Common fields
        if (contract.freelancer_name) return contract.freelancer_name;
        if (contract.freelancer_full_name) return contract.freelancer_full_name;
        // Nested object shapes
        const candidates = [contract.freelancer, contract.freelancer_user, contract.freelancer_profile, contract.freelancer_detail, contract.freelancerInfo, contract.user, contract.freelancer_data];
        for (const c of candidates) {
            if (!c) continue;
            const name = resolveName(c);
            if (name && name !== `User #${c}`) return name;
        }
        // As last resort, try numeric id fallback or email
        if (contract.freelancer && typeof contract.freelancer === 'number') return `User #${contract.freelancer}`;
        if (contract.freelancer && typeof contract.freelancer === 'string') return contract.freelancer;
        return 'N/A';
    };
    const formatCurrency = (amount) => {
        if (amount == null) return '₹0';
        const numberAmount = Number(amount);
        if (Number.isNaN(numberAmount)) return `₹${amount}`;
        return numberAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    };

    const formatStatusLabel = (value) => {
        const match = statusOptions.find((option) => option.value === value);
        return match ? match.label : (value || 'Active');
    };

    const badgeClass = (status) => {
        switch (status) {
            case 'completed':
                return 'badge completed';
            case 'on-hold':
                return 'badge on-hold';
            default:
                return 'badge active';
        }
    };

    const handleOpenModal = (contract) => {
        setEditingContract(contract);
        const amountValue = contract.total_amount;
        setFormData({
            title: contract.title || '',
            terms: contract.terms || '',
            total_amount:
                amountValue === null || amountValue === undefined
                    ? ''
                    : String(amountValue),
            start_date: contract.start_date || '',
            end_date: contract.end_date || '',
            status: contract.status || 'active',
        });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingContract(null);
        setFormData(emptyFormState);
        setSaving(false);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        if (!editingContract) {
            return;
        }

        if (!formData.title.trim()) {
            setFeedback({ type: 'error', message: 'Title is required.' });
            return;
        }

        if (!formData.start_date) {
            setFeedback({ type: 'error', message: 'Start date is required.' });
            return;
        }

        const payload = {
            title: formData.title.trim(),
            terms: formData.terms,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            status: formData.status,
        };

        if (formData.total_amount !== '') {
            const amount = parseFloat(formData.total_amount);
            if (Number.isNaN(amount)) {
                setFeedback({ type: 'error', message: 'Total amount must be a valid number.' });
                return;
            }
            payload.total_amount = amount;
        }

        setSaving(true);
        try {
            await contractService.updateContract(editingContract.id, payload);
            await fetchContracts();
            setFeedback({ type: 'success', message: 'Contract updated successfully.' });
            handleCloseModal();
        } catch (error) {
            console.error('Error updating contract:', error);
            const message = error?.response?.data?.error || 'Unable to update contract.';
            setFeedback({ type: 'error', message });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async (contract, nextStatus) => {
        if (contract.status === nextStatus) {
            return;
        }

        setStatusUpdating((prev) => ({ ...prev, [contract.id]: nextStatus }));
        try {
            await contractService.updateContract(contract.id, { status: nextStatus });
            await fetchContracts();
            setFeedback({ type: 'success', message: `Contract marked as ${formatStatusLabel(nextStatus)}.` });
        } catch (error) {
            console.error('Error updating status:', error);
            const message = error?.response?.data?.error || 'Unable to update status.';
            setFeedback({ type: 'error', message });
        } finally {
            setStatusUpdating((prev) => {
                const clone = { ...prev };
                delete clone[contract.id];
                return clone;
            });
        }
    };

    return (
        <div className="client-page-container">
            <style>{`
                .client-page-container { padding: 40px; background-color: #f8fafc; min-height: 100vh; }
                .page-header h1 { font-size: 26px; color: #1e293b; margin-bottom: 20px; font-weight: 700; }
                .contracts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
                .contract-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
                .contract-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
                .contract-meta { font-size: 13px; color: #64748b; margin-bottom: 15px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .label { color: #64748b; }
                .value { font-weight: 600; color: #334155; }
                .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                .badge.active { background: #dbeafe; color: #1e40af; }
                .badge.completed { background: #dcfce7; color: #166534; }
                .badge.on-hold { background: #fef3c7; color: #92400e; }
                .contract-actions { margin-top: 16px; display: flex; justify-content: flex-end; }
                .edit-btn { border: 1px solid #3b82f6; color: #1d4ed8; padding: 8px 16px; border-radius: 8px; background: white; font-weight: 600; cursor: pointer; }
                .edit-btn:hover { background: #eff6ff; }
                .status-toggle { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
                .status-chip { border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 14px; font-size: 13px; font-weight: 600; background: #f8fafc; color: #475569; cursor: pointer; transition: background 0.2s; }
                .status-chip.selected { background: #1d4ed8; color: white; border-color: #1d4ed8; }
                .status-chip:disabled { opacity: 0.6; cursor: not-allowed; }
                .feedback-banner { margin-bottom: 20px; padding: 12px 16px; border-radius: 10px; font-weight: 600; }
                .feedback-banner.success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
                .feedback-banner.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; }
                .modal-card { width: 100%; max-width: 520px; background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(15,23,42,0.25); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .modal-header h3 { margin: 0; font-size: 20px; color: #0f172a; }
                .close-btn { border: none; background: transparent; font-size: 20px; cursor: pointer; color: #94a3b8; }
                .form-grid { display: flex; flex-direction: column; gap: 14px; }
                .form-grid label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px; }
                .form-grid input, .form-grid textarea, .form-grid select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5f5; background: #f8fafc; font-size: 14px; }
                .form-grid textarea { min-height: 100px; resize: vertical; }
                .modal-actions { margin-top: 10px; display: flex; justify-content: flex-end; gap: 12px; }
                .secondary-btn { border: 1px solid #cbd5f5; padding: 10px 18px; border-radius: 10px; background: white; font-weight: 600; cursor: pointer; }
                .primary-btn { border: none; padding: 10px 18px; border-radius: 10px; background: #1d4ed8; color: white; font-weight: 600; cursor: pointer; }
                .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            <div className="page-header">
                <h1>My Contracts</h1>
            </div>

            {feedback && (
                <div className={`feedback-banner ${feedback.type}`}>
                    {feedback.message}
                </div>
            )}

            {loading ? (
                <p>Loading contracts...</p>
            ) : contracts.length === 0 ? (
                <p>No contracts found yet.</p>
            ) : (
                <div className="contracts-grid">
                    {contracts.map((contract) => (
                        <div key={contract.id} className="contract-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span className={badgeClass(contract.status)}>
                                    {formatStatusLabel(contract.status)}
                                </span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    ID: {contract.id}
                                </span>
                            </div>

                            <h3 className="contract-title">{contract.title}</h3>
                            <p className="contract-meta">
                                Freelancer: {getFreelancerName(contract)}
                            </p>

                            <div className="detail-row">
                                <span className="label">Amount:</span>
                                <span className="value" style={{ color: '#2563eb' }}>
                                    {formatCurrency(contract.total_amount)}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="label">Start Date:</span>
                                <span className="value">{formatDate(contract.start_date)}</span>
                            </div>

                            <div className="detail-row">
                                <span className="label">End Date:</span>
                                <span className="value">{formatDate(contract.end_date || contract.created_at)}</span>
                            </div>

                            <div className="status-toggle">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`status-chip ${contract.status === option.value ? 'selected' : ''}`}
                                        onClick={() => handleStatusUpdate(contract, option.value)}
                                        disabled={contract.status === option.value || statusUpdating[contract.id] === option.value}
                                    >
                                        {statusUpdating[contract.id] === option.value ? 'Saving...' : option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="contract-actions">
                                                        <button className="edit-btn" type="button" onClick={() => handleOpenModal(contract)}>
                                                            Edit Contract
                                                        </button>
                                                        {/* Cancel button for client to mark contract cancelled */}
                                                        {contract.status !== 'cancelled' && (
                                                            <button
                                                                className="edit-btn"
                                                                type="button"
                                                                onClick={() => handleStatusUpdate(contract, 'cancelled')}
                                                                disabled={statusUpdating[contract.id] === 'cancelled'}
                                                                style={{ marginLeft: 8, borderColor: '#ef4444', color: '#b91c1c' }}
                                                            >
                                                                {statusUpdating[contract.id] === 'cancelled' ? 'Cancelling...' : 'Cancel Contract'}
                                                            </button>
                                                        )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Edit Contract</h3>
                            <button className="close-btn" type="button" onClick={handleCloseModal}>×</button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="form-grid">
                            <div>
                                <label htmlFor="title">Title</label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="terms">Terms</label>
                                <textarea
                                    id="terms"
                                    name="terms"
                                    value={formData.terms}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="total_amount">Total Amount (INR)</label>
                                <input
                                    id="total_amount"
                                    name="total_amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.total_amount}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="start_date">Start Date</label>
                                <input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="end_date">End Date</label>
                                <input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    value={formData.end_date || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientContracts;