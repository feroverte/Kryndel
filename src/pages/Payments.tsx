import { useEffect, useState } from 'react';
import { usePaymentStore } from '../stores/paymentStore';
import { useSettingsStore } from '../stores/settingsStore';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { Payment, CATEGORIES } from '../types';

export default function Payments() {
    const { payments, stats, loading, fetchPayments, fetchStats, addPayment, editPayment, removePayment, addHistoryEntry } = usePaymentStore();
    const { getCurrencySymbol } = useSettingsStore();
    const currency = getCurrencySymbol();

    const [showModal, setShowModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [recordPayment, setRecordPayment] = useState<Payment | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Other');
    const [paymentType, setPaymentType] = useState<'fixed' | 'variable'>('fixed');
    const [frequency, setFrequency] = useState('monthly');
    const [frequencyInterval, setFrequencyInterval] = useState(1);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [isVariable, setIsVariable] = useState(false);

    // Record payment form state
    const [recordAmount, setRecordAmount] = useState('');
    const [recordDate, setRecordDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [recordNotes, setRecordNotes] = useState('');

    useEffect(() => {
        fetchPayments();
        fetchStats();
    }, []);

    const openCreate = () => {
        setEditingPayment(null);
        setName('');
        setAmount('');
        setCategory('Other');
        setPaymentType('fixed');
        setFrequency('monthly');
        setFrequencyInterval(1);
        setStartDate(format(new Date(), 'yyyy-MM-dd'));
        setNotes('');
        setIsVariable(false);
        setShowModal(true);
    };

    const openEdit = (p: Payment) => {
        setEditingPayment(p);
        setName(p.name);
        setAmount(p.amount.toString());
        setCategory(p.category);
        setPaymentType(p.payment_type);
        setFrequency(p.frequency);
        setFrequencyInterval(p.frequency_interval);
        setStartDate(p.start_date);
        setNotes(p.notes);
        setIsVariable(!!p.is_variable);
        setShowModal(true);
    };

    const openRecord = (p: Payment) => {
        setRecordPayment(p);
        setRecordAmount(p.amount.toString());
        setRecordDate(format(new Date(), 'yyyy-MM-dd'));
        setRecordNotes('');
        setShowRecordModal(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        const data = {
            name,
            amount: parseFloat(amount) || 0,
            category,
            payment_type: paymentType,
            frequency: frequency as any,
            frequency_interval: frequencyInterval,
            start_date: startDate,
            notes,
            is_variable: isVariable ? 1 : 0,
        };
        if (editingPayment) {
            await editPayment(editingPayment.id, data);
        } else {
            await addPayment(data);
        }
        setShowModal(false);
    };

    const handleRecord = async () => {
        if (!recordPayment) return;
        await addHistoryEntry({
            payment_id: recordPayment.id,
            payment_name: recordPayment.name,
            amount: parseFloat(recordAmount) || recordPayment.amount,
            category: recordPayment.category,
            paid_date: recordDate,
            notes: recordNotes,
        });
        setShowRecordModal(false);
    };

    const getStatusBadge = (payment: Payment) => {
        if (payment.status === 'paused') return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-500/20 text-slate-400">Paused</span>;
        const nextDate = new Date(payment.next_payment_date);
        const today = new Date();
        const diff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 3) return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Due Soon</span>;
        return <span className="px-2 py-0.5 text-xs rounded-full bg-accent-green/20 text-accent-green">Active</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Monthly Payment Manager</h1>
                    <p className="text-sm text-text-secondary mt-1">{payments.length} payment{payments.length !== 1 ? 's' : ''} configured</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-xl hover:bg-accent-blue/80 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /></svg>
                    Add Payment
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="gradient-border bg-bg-card rounded-2xl p-5">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Total Expected</p>
                    <p className="text-2xl font-bold text-text-primary">{currency}{(stats?.totalMonthly || 0).toLocaleString()} <span className="text-sm font-normal text-text-muted">/ month</span></p>
                </div>
                <div className="gradient-border bg-bg-card rounded-2xl p-5">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Upcoming Payments</p>
                    <p className="text-2xl font-bold text-accent-blue">{stats?.upcomingCount || 0}</p>
                </div>
                <div className="gradient-border bg-bg-card rounded-2xl p-5">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Annual Costs</p>
                    <p className="text-2xl font-bold text-accent-teal">{currency}{(stats?.totalAnnual || 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Payment Table */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border bg-bg-secondary/50">
                                <th className="text-left px-5 py-3 font-medium">Payment Name</th>
                                <th className="text-left px-5 py-3 font-medium">Amount</th>
                                <th className="text-left px-5 py-3 font-medium">Type</th>
                                <th className="text-left px-5 py-3 font-medium">Frequency</th>
                                <th className="text-left px-5 py-3 font-medium">Next Payment</th>
                                <th className="text-left px-5 py-3 font-medium">Status</th>
                                <th className="text-right px-5 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-sm text-text-muted">
                                        No payments configured yet. Click "Add Payment" to get started.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-bg-hover/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="text-sm font-medium">{p.name}</div>
                                            <div className="text-[10px] text-text-muted">{p.category}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-medium">{currency}{p.amount.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary capitalize">{p.payment_type}</td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary capitalize">
                                            {p.frequency}{p.frequency === 'custom' ? ` (${p.frequency_interval}d)` : ''}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {p.next_payment_date ? format(new Date(p.next_payment_date), 'MMM d, yyyy') : '—'}
                                        </td>
                                        <td className="px-5 py-3.5">{getStatusBadge(p)}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openRecord(p)}
                                                    title="Record payment"
                                                    className="p-1.5 rounded-lg hover:bg-accent-green/10 transition-colors text-text-muted hover:text-accent-green"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => removePayment(p.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-text-muted hover:text-red-400"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Payment Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPayment ? 'Edit Payment' : 'Add Payment'} maxWidth="max-w-xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Internet Subscription"
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01"
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50">
                                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">Payment Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="fixed" checked={paymentType === 'fixed'} onChange={() => setPaymentType('fixed')} className="accent-accent-blue" />
                                <span className="text-sm text-text-secondary">Fixed Monthly</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="variable" checked={paymentType === 'variable'} onChange={() => setPaymentType('variable')} className="accent-accent-blue" />
                                <span className="text-sm text-text-secondary">Variable Amount</span>
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Frequency</label>
                            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50">
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="yearly">Yearly</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        {frequency === 'custom' && (
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Interval (days)</label>
                                <input type="number" value={frequencyInterval} onChange={(e) => setFrequencyInterval(parseInt(e.target.value) || 1)} min="1"
                                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter any notes..." rows={2}
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 resize-none" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsVariable(!isVariable)}
                            className={`w-10 h-5 rounded-full transition-colors ${isVariable ? 'bg-accent-blue' : 'bg-bg-tertiary border border-border'}`}>
                            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${isVariable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-sm text-text-secondary">Amount changes each month</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors">Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2 text-sm font-medium text-white bg-accent-blue rounded-xl hover:bg-accent-blue/80 transition-colors">Save</button>
                    </div>
                </div>
            </Modal>

            {/* Record Payment Modal */}
            <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title={`Record Payment: ${recordPayment?.name || ''}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount Paid</label>
                        <input type="number" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} step="0.01"
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-green/50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Date Paid</label>
                        <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-green/50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
                        <input type="text" value={recordNotes} onChange={(e) => setRecordNotes(e.target.value)} placeholder="Optional notes..."
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setShowRecordModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors">Cancel</button>
                        <button onClick={handleRecord} className="px-5 py-2 text-sm font-medium text-white bg-accent-green rounded-xl hover:bg-accent-green/80 transition-colors">Record</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
