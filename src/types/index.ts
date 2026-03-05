export interface Task {
    id: string;
    title: string;
    description: string;
    due_date: string | null;
    priority: number;
    status: 'pending' | 'completed';
    tags: string[];
    sort_order: number;
    created_at: string;
}

export interface Payment {
    id: string;
    name: string;
    category: string;
    amount: number;
    payment_type: 'fixed' | 'variable';
    frequency: 'monthly' | 'weekly' | 'yearly' | 'custom';
    frequency_interval: number;
    start_date: string;
    next_payment_date: string;
    notes: string;
    is_variable: number;
    status: 'active' | 'paused';
    created_at: string;
}

export interface PaymentOccurrence {
    payment_id: string;
    payment_name: string;
    category: string;
    amount: number;
    date: string;
    is_variable: number;
    payment_type: string;
}

export interface PaymentHistory {
    id: string;
    payment_id: string | null;
    payment_name: string;
    amount: number;
    category: string;
    paid_date: string;
    notes: string;
    created_at: string;
}

export interface Note {
    id: string;
    content: string;
    date: string;
    created_at: string;
}

export interface PaymentStats {
    totalMonthly: number;
    totalAnnual: number;
    upcomingCount: number;
    activeCount: number;
}

export interface MonthlySpending {
    month: string;
    monthKey: string;
    total: number;
}

export interface CategoryBreakdown {
    category: string;
    total: number;
    count: number;
}

export interface Settings {
    currency: string;
    theme: string;
    date_format: string;
    [key: string]: string;
}

export type TaskFilter = 'all' | 'today' | 'week' | 'month' | 'completed';

export const CATEGORIES = [
    'Housing',
    'Utilities',
    'Transportation',
    'Food',
    'Entertainment',
    'Subscriptions',
    'Insurance',
    'Healthcare',
    'Education',
    'Shopping',
    'Personal',
    'Other',
] as const;

export const PRIORITY_LABELS: Record<number, string> = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
};

export const PRIORITY_COLORS: Record<number, string> = {
    1: 'text-red-400',
    2: 'text-orange-400',
    3: 'text-blue-400',
    4: 'text-slate-400',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    TRY: '₺',
    AZN: '₼',
    RUB: '₽',
};

// Electron API type declaration
declare global {
    interface Window {
        electronAPI: {
            minimize: () => Promise<void>;
            maximize: () => Promise<void>;
            close: () => Promise<void>;

            getTasks: (filter?: string) => Promise<Task[]>;
            getTask: (id: string) => Promise<Task>;
            createTask: (task: Partial<Task>) => Promise<Task>;
            updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
            deleteTask: (id: string) => Promise<void>;
            toggleTask: (id: string) => Promise<Task>;

            getPayments: () => Promise<Payment[]>;
            getPayment: (id: string) => Promise<Payment>;
            createPayment: (payment: Partial<Payment>) => Promise<Payment>;
            updatePayment: (id: string, payment: Partial<Payment>) => Promise<Payment>;
            deletePayment: (id: string) => Promise<void>;
            getPaymentOccurrences: (startDate: string, endDate: string) => Promise<PaymentOccurrence[]>;
            getPaymentStats: () => Promise<PaymentStats>;

            getPaymentHistory: (paymentId?: string) => Promise<PaymentHistory[]>;
            addPaymentHistory: (entry: Partial<PaymentHistory>) => Promise<PaymentHistory>;
            getMonthlySpending: (months?: number) => Promise<MonthlySpending[]>;
            getCategoryBreakdown: () => Promise<CategoryBreakdown[]>;

            getNotes: (date?: string) => Promise<Note[]>;
            createNote: (note: Partial<Note>) => Promise<Note>;
            updateNote: (id: string, note: Partial<Note>) => Promise<Note>;
            deleteNote: (id: string) => Promise<void>;

            getSettings: () => Promise<Settings>;
            updateSetting: (key: string, value: string) => Promise<void>;

            exportData: () => Promise<any>;
            importData: (data: any) => Promise<void>;
        };
    }
}
