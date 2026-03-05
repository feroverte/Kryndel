import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import { usePaymentStore } from '../stores/paymentStore';
import { useSettingsStore } from '../stores/settingsStore';
import Modal from '../components/Modal';
import { format, addDays } from 'date-fns';
import { CATEGORIES, PRIORITY_LABELS } from '../types';

export default function Dashboard() {
    const navigate = useNavigate();
    const { tasks, fetchTasks, addTask } = useTaskStore();
    const { payments, stats, fetchPayments, fetchStats, addPayment, getOccurrences } = usePaymentStore();
    const { settings, fetchSettings, getCurrencySymbol } = useSettingsStore();
    const [tasksDueToday, setTasksDueToday] = useState(0);
    const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Task form state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskDueDate, setTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [taskPriority, setTaskPriority] = useState(3);

    // Payment form state
    const [paymentName, setPaymentName] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentCategory, setPaymentCategory] = useState('Other');
    const [paymentFrequency, setPaymentFrequency] = useState('monthly');
    const [paymentStartDate, setPaymentStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentType, setPaymentType] = useState<'fixed' | 'variable'>('fixed');

    const currency = getCurrencySymbol();

    useEffect(() => {
        fetchTasks();
        fetchPayments();
        fetchStats();
        fetchSettings();
        loadUpcoming();
        loadTodayTasks();
    }, []);

    const loadUpcoming = async () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const futureDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        const occ = await getOccurrences(today, futureDate);
        setUpcomingPayments(occ.slice(0, 7));
    };

    const loadTodayTasks = async () => {
        try {
            const todayTasks = await window.electronAPI.getTasks('today');
            setTasksDueToday(todayTasks.length);
        } catch {
            setTasksDueToday(0);
        }
    };

    const handleAddTask = async () => {
        if (!taskTitle.trim()) return;
        await addTask({
            title: taskTitle,
            description: taskDesc,
            due_date: taskDueDate,
            priority: taskPriority,
        });
        setTaskTitle('');
        setTaskDesc('');
        setTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
        setTaskPriority(3);
        setShowTaskModal(false);
        loadTodayTasks();
    };

    const handleAddPayment = async () => {
        if (!paymentName.trim()) return;
        await addPayment({
            name: paymentName,
            amount: parseFloat(paymentAmount) || 0,
            category: paymentCategory,
            frequency: paymentFrequency as any,
            start_date: paymentStartDate,
            payment_type: paymentType,
            is_variable: paymentType === 'variable' ? 1 : 0,
        });
        setPaymentName('');
        setPaymentAmount('');
        setPaymentCategory('Other');
        setPaymentFrequency('monthly');
        setPaymentStartDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentType('fixed');
        setShowPaymentModal(false);
        loadUpcoming();
    };

    const getStatusBadge = (dateStr: string) => {
        const today = new Date();
        const date = new Date(dateStr);
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Due Soon</span>;
        return <span className="px-2 py-0.5 text-xs rounded-full bg-accent-teal/20 text-accent-teal">Upcoming</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-sm text-text-secondary mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monthly Overview */}
                <div className="gradient-border bg-bg-card rounded-2xl p-5 cursor-pointer hover:bg-bg-hover transition-all" onClick={() => navigate('/payments')}>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Monthly Overview</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-accent-violet to-accent-blue bg-clip-text text-transparent">
                        {currency}{(stats?.totalMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Estimated this month</p>
                </div>

                {/* Upcoming Payments */}
                <div className="gradient-border bg-bg-card rounded-2xl p-5 cursor-pointer hover:bg-bg-hover transition-all" onClick={() => navigate('/payments')}>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Upcoming Payments</p>
                    <p className="text-3xl font-bold text-accent-blue">{stats?.upcomingCount || 0}</p>
                    <p className="text-xs text-text-muted mt-1">Due in next 30 days</p>
                </div>

                {/* Tasks Due Today */}
                <div className="gradient-border bg-bg-card rounded-2xl p-5 cursor-pointer hover:bg-bg-hover transition-all" onClick={() => navigate('/tasks')}>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Tasks Due Today</p>
                    <p className="text-3xl font-bold text-accent-teal">{tasksDueToday}</p>
                    <p className="text-xs text-text-muted mt-1">Tasks to complete</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Payments Table */}
                <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-5">
                    <h2 className="text-base font-semibold mb-4">Upcoming Payments</h2>
                    {upcomingPayments.length === 0 ? (
                        <p className="text-sm text-text-muted py-8 text-center">No upcoming payments</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border">
                                        <th className="text-left pb-3 font-medium">Payment</th>
                                        <th className="text-left pb-3 font-medium">Amount</th>
                                        <th className="text-left pb-3 font-medium">Due Date</th>
                                        <th className="text-left pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcomingPayments.map((p, i) => (
                                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-bg-hover/50 transition-colors">
                                            <td className="py-3 text-sm font-medium">{p.payment_name}</td>
                                            <td className="py-3 text-sm text-text-secondary">{currency}{p.amount.toLocaleString()}</td>
                                            <td className="py-3 text-sm text-text-secondary">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                                            <td className="py-3">{getStatusBadge(p.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-bg-card border border-border rounded-xl hover:bg-bg-hover hover:border-accent-violet/30 transition-all group"
                    >
                        <span className="w-8 h-8 rounded-lg bg-accent-violet/15 flex items-center justify-center text-accent-violet group-hover:bg-accent-violet/25 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg>
                        </span>
                        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Add Task</span>
                    </button>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-bg-card border border-border rounded-xl hover:bg-bg-hover hover:border-accent-blue/30 transition-all group"
                    >
                        <span className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center text-accent-blue group-hover:bg-accent-blue/25 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg>
                        </span>
                        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Add Payment</span>
                    </button>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-bg-card border border-border rounded-xl hover:bg-bg-hover hover:border-accent-teal/30 transition-all group"
                    >
                        <span className="w-8 h-8 rounded-lg bg-accent-teal/15 flex items-center justify-center text-accent-teal group-hover:bg-accent-teal/25 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg>
                        </span>
                        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Add Recurring Payment</span>
                    </button>

                    {/* Annual costs mini card */}
                    <div className="bg-bg-card border border-border rounded-xl p-4 mt-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Annual Costs</p>
                        <p className="text-xl font-bold text-accent-violet">{currency}{(stats?.totalAnnual || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
                        <input
                            type="text"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Task title..."
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                        <textarea
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                            placeholder="Optional description..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Due Date</label>
                            <input
                                type="date"
                                value={taskDueDate}
                                onChange={(e) => setTaskDueDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
                            <select
                                value={taskPriority}
                                onChange={(e) => setTaskPriority(parseInt(e.target.value))}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50 transition-colors"
                            >
                                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setShowTaskModal(false)}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors"
                        >Cancel</button>
                        <button
                            onClick={handleAddTask}
                            className="px-5 py-2 text-sm font-medium text-white bg-accent-violet rounded-xl hover:bg-accent-violet/80 transition-colors"
                        >Save</button>
                    </div>
                </div>
            </Modal>

            {/* Add Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Add Payment">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
                        <input
                            type="text"
                            value={paymentName}
                            onChange={(e) => setPaymentName(e.target.value)}
                            placeholder="Payment name..."
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 transition-colors"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                            <select
                                value={paymentCategory}
                                onChange={(e) => setPaymentCategory(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-colors"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Frequency</label>
                            <select
                                value={paymentFrequency}
                                onChange={(e) => setPaymentFrequency(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-colors"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="yearly">Yearly</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={paymentStartDate}
                                onChange={(e) => setPaymentStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">Payment Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="fixed"
                                    checked={paymentType === 'fixed'}
                                    onChange={() => setPaymentType('fixed')}
                                    className="accent-accent-blue"
                                />
                                <span className="text-sm text-text-secondary">Fixed Monthly</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="variable"
                                    checked={paymentType === 'variable'}
                                    onChange={() => setPaymentType('variable')}
                                    className="accent-accent-blue"
                                />
                                <span className="text-sm text-text-secondary">Variable Amount</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors"
                        >Cancel</button>
                        <button
                            onClick={handleAddPayment}
                            className="px-5 py-2 text-sm font-medium text-white bg-accent-blue rounded-xl hover:bg-accent-blue/80 transition-colors"
                        >Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
