import { useEffect } from 'react';
import { usePaymentStore } from '../stores/paymentStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar,
} from 'recharts';

const PIE_COLORS = ['#8B5CF6', '#3B82F6', '#14B8A6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#06B6D4', '#84CC16'];

export default function Analytics() {
    const { payments, monthlySpending, categoryBreakdown, stats, fetchPayments, fetchStats, fetchMonthlySpending, fetchCategoryBreakdown } = usePaymentStore();
    const { getCurrencySymbol } = useSettingsStore();
    const currency = getCurrencySymbol();

    useEffect(() => {
        fetchPayments();
        fetchStats();
        fetchMonthlySpending(12);
        fetchCategoryBreakdown();
    }, []);

    const avgMonthly = monthlySpending.length > 0
        ? monthlySpending.reduce((sum, m) => sum + m.total, 0) / monthlySpending.filter(m => m.total > 0).length || 0
        : 0;

    // Recurring payment breakdown for bar chart
    const recurringData = payments
        .filter(p => p.status === 'active')
        .map(p => ({
            name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
            amount: p.amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-secondary border border-border rounded-xl px-3 py-2 shadow-lg">
                    <p className="text-xs text-text-secondary">{label}</p>
                    <p className="text-sm font-semibold text-text-primary">{currency}{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-secondary border border-border rounded-xl px-3 py-2 shadow-lg">
                    <p className="text-xs text-text-secondary">{payload[0].name}</p>
                    <p className="text-sm font-semibold text-text-primary">{currency}{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
                <p className="text-sm text-text-secondary mt-1">Financial insights and spending patterns</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Expected</p>
                    <p className="text-xl font-bold text-accent-violet">{currency}{(stats?.totalMonthly || 0).toLocaleString()}</p>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Annual Costs</p>
                    <p className="text-xl font-bold text-accent-blue">{currency}{(stats?.totalAnnual || 0).toLocaleString()}</p>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Avg Monthly Spend</p>
                    <p className="text-xl font-bold text-accent-teal">{currency}{avgMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Active Payments</p>
                    <p className="text-xl font-bold text-accent-green">{stats?.activeCount || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Spending History */}
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-4">Monthly Spending History</h3>
                    <div className="h-64">
                        {monthlySpending.length > 0 && monthlySpending.some(m => m.total > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlySpending}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#A78BFA' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                                <p>Record payments to see spending history</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
                    <div className="h-64">
                        {categoryBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="total" nameKey="category" paddingAngle={3}>
                                        {categoryBreakdown.map((_: any, i: number) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                                <p>Record payments to see category breakdown</p>
                            </div>
                        )}
                    </div>
                    {categoryBreakdown.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-3">
                            {categoryBreakdown.map((cat: any, i: number) => (
                                <div key={cat.category} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-[10px] text-text-secondary">{cat.category}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recurring Payment Overview */}
                <div className="bg-bg-card border border-border rounded-2xl p-5 lg:col-span-2">
                    <h3 className="text-sm font-semibold mb-4">Recurring Payment Overview</h3>
                    <div className="h-64">
                        {recurringData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={recurringData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} tickLine={false} />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={{ stroke: '#1E293B' }} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                                        {recurringData.map((_: any, i: number) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                                <p>Add payments to see recurring payment overview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
