import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),

    // Tasks
    getTasks: (filter?: string) => ipcRenderer.invoke('tasks:getAll', filter),
    getTask: (id: string) => ipcRenderer.invoke('tasks:get', id),
    createTask: (task: any) => ipcRenderer.invoke('tasks:create', task),
    updateTask: (id: string, task: any) => ipcRenderer.invoke('tasks:update', id, task),
    deleteTask: (id: string) => ipcRenderer.invoke('tasks:delete', id),
    toggleTask: (id: string) => ipcRenderer.invoke('tasks:toggle', id),

    // Payments
    getPayments: () => ipcRenderer.invoke('payments:getAll'),
    getPayment: (id: string) => ipcRenderer.invoke('payments:get', id),
    createPayment: (payment: any) => ipcRenderer.invoke('payments:create', payment),
    updatePayment: (id: string, payment: any) => ipcRenderer.invoke('payments:update', id, payment),
    deletePayment: (id: string) => ipcRenderer.invoke('payments:delete', id),
    getPaymentOccurrences: (startDate: string, endDate: string) =>
        ipcRenderer.invoke('payments:getOccurrences', startDate, endDate),
    getPaymentStats: () => ipcRenderer.invoke('payments:getStats'),

    // Payment History
    getPaymentHistory: (paymentId?: string) => ipcRenderer.invoke('paymentHistory:getAll', paymentId),
    addPaymentHistory: (entry: any) => ipcRenderer.invoke('paymentHistory:add', entry),
    getMonthlySpending: (months?: number) => ipcRenderer.invoke('paymentHistory:monthlySpending', months),
    getCategoryBreakdown: () => ipcRenderer.invoke('paymentHistory:categoryBreakdown'),

    // Notes
    getNotes: (date?: string) => ipcRenderer.invoke('notes:getAll', date),
    createNote: (note: any) => ipcRenderer.invoke('notes:create', note),
    updateNote: (id: string, note: any) => ipcRenderer.invoke('notes:update', id, note),
    deleteNote: (id: string) => ipcRenderer.invoke('notes:delete', id),

    // Settings
    getSettings: () => ipcRenderer.invoke('settings:getAll'),
    updateSetting: (key: string, value: string) => ipcRenderer.invoke('settings:update', key, value),

    // Data
    exportData: () => ipcRenderer.invoke('data:export'),
    importData: (data: any) => ipcRenderer.invoke('data:import', data),
});
