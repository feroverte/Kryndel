import { create } from 'zustand';
import { Payment, PaymentStats, PaymentOccurrence, PaymentHistory, MonthlySpending, CategoryBreakdown } from '../types';

const api = window.electronAPI;

interface PaymentStore {
    payments: Payment[];
    stats: PaymentStats | null;
    history: PaymentHistory[];
    monthlySpending: MonthlySpending[];
    categoryBreakdown: CategoryBreakdown[];
    loading: boolean;
    fetchPayments: () => Promise<void>;
    fetchStats: () => Promise<void>;
    fetchHistory: (paymentId?: string) => Promise<void>;
    fetchMonthlySpending: (months?: number) => Promise<void>;
    fetchCategoryBreakdown: () => Promise<void>;
    addPayment: (payment: Partial<Payment>) => Promise<void>;
    editPayment: (id: string, payment: Partial<Payment>) => Promise<void>;
    removePayment: (id: string) => Promise<void>;
    addHistoryEntry: (entry: Partial<PaymentHistory>) => Promise<void>;
    getOccurrences: (startDate: string, endDate: string) => Promise<PaymentOccurrence[]>;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
    payments: [],
    stats: null,
    history: [],
    monthlySpending: [],
    categoryBreakdown: [],
    loading: false,

    fetchPayments: async () => {
        if (!api) return;
        set({ loading: true });
        try {
            const payments = await api.getPayments();
            set({ payments, loading: false });
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            set({ loading: false });
        }
    },

    fetchStats: async () => {
        if (!api) return;
        try {
            const stats = await api.getPaymentStats();
            set({ stats });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    fetchHistory: async (paymentId?) => {
        if (!api) return;
        try {
            const history = await api.getPaymentHistory(paymentId);
            set({ history });
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    },

    fetchMonthlySpending: async (months = 12) => {
        if (!api) return;
        try {
            const monthlySpending = await api.getMonthlySpending(months);
            set({ monthlySpending });
        } catch (error) {
            console.error('Failed to fetch monthly spending:', error);
        }
    },

    fetchCategoryBreakdown: async () => {
        if (!api) return;
        try {
            const categoryBreakdown = await api.getCategoryBreakdown();
            set({ categoryBreakdown });
        } catch (error) {
            console.error('Failed to fetch category breakdown:', error);
        }
    },

    addPayment: async (payment) => {
        if (!api) return;
        try {
            await api.createPayment(payment);
            await get().fetchPayments();
            await get().fetchStats();
        } catch (error) {
            console.error('Failed to create payment:', error);
        }
    },

    editPayment: async (id, payment) => {
        if (!api) return;
        try {
            await api.updatePayment(id, payment);
            await get().fetchPayments();
            await get().fetchStats();
        } catch (error) {
            console.error('Failed to update payment:', error);
        }
    },

    removePayment: async (id) => {
        if (!api) return;
        try {
            await api.deletePayment(id);
            await get().fetchPayments();
            await get().fetchStats();
        } catch (error) {
            console.error('Failed to delete payment:', error);
        }
    },

    addHistoryEntry: async (entry) => {
        if (!api) return;
        try {
            await api.addPaymentHistory(entry);
            await get().fetchHistory();
            await get().fetchMonthlySpending();
            await get().fetchCategoryBreakdown();
        } catch (error) {
            console.error('Failed to add history entry:', error);
        }
    },

    getOccurrences: async (startDate, endDate) => {
        if (!api) return [];
        try {
            return await api.getPaymentOccurrences(startDate, endDate);
        } catch (error) {
            console.error('Failed to get occurrences:', error);
            return [];
        }
    },
}));
