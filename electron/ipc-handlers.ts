import { ipcMain } from 'electron';
import {
    getAllTasks, getTask, createTask, updateTask, deleteTask, toggleTask,
    getAllPayments, getPayment, createPayment, updatePayment, deletePayment,
    getPaymentOccurrences, getPaymentStats,
    getAllPaymentHistory, addPaymentHistory, getMonthlySpending, getCategoryBreakdown,
    getAllNotes, createNote, updateNote, deleteNote,
    getAllSettings, updateSetting,
    exportAllData, importAllData,
} from './database';

export function registerIpcHandlers(): void {
    // Tasks
    ipcMain.handle('tasks:getAll', (_event, filter?: string) => getAllTasks(filter));
    ipcMain.handle('tasks:get', (_event, id: string) => getTask(id));
    ipcMain.handle('tasks:create', (_event, task: any) => createTask(task));
    ipcMain.handle('tasks:update', (_event, id: string, task: any) => updateTask(id, task));
    ipcMain.handle('tasks:delete', (_event, id: string) => deleteTask(id));
    ipcMain.handle('tasks:toggle', (_event, id: string) => toggleTask(id));

    // Payments
    ipcMain.handle('payments:getAll', () => getAllPayments());
    ipcMain.handle('payments:get', (_event, id: string) => getPayment(id));
    ipcMain.handle('payments:create', (_event, payment: any) => createPayment(payment));
    ipcMain.handle('payments:update', (_event, id: string, payment: any) => updatePayment(id, payment));
    ipcMain.handle('payments:delete', (_event, id: string) => deletePayment(id));
    ipcMain.handle('payments:getOccurrences', (_event, startDate: string, endDate: string) =>
        getPaymentOccurrences(startDate, endDate));
    ipcMain.handle('payments:getStats', () => getPaymentStats());

    // Payment History
    ipcMain.handle('paymentHistory:getAll', (_event, paymentId?: string) => getAllPaymentHistory(paymentId));
    ipcMain.handle('paymentHistory:add', (_event, entry: any) => addPaymentHistory(entry));
    ipcMain.handle('paymentHistory:monthlySpending', (_event, months?: number) => getMonthlySpending(months));
    ipcMain.handle('paymentHistory:categoryBreakdown', () => getCategoryBreakdown());

    // Notes
    ipcMain.handle('notes:getAll', (_event, date?: string) => getAllNotes(date));
    ipcMain.handle('notes:create', (_event, note: any) => createNote(note));
    ipcMain.handle('notes:update', (_event, id: string, note: any) => updateNote(id, note));
    ipcMain.handle('notes:delete', (_event, id: string) => deleteNote(id));

    // Settings
    ipcMain.handle('settings:getAll', () => getAllSettings());
    ipcMain.handle('settings:update', (_event, key: string, value: string) => updateSetting(key, value));

    // Data export/import
    ipcMain.handle('data:export', () => exportAllData());
    ipcMain.handle('data:import', (_event, data: any) => importAllData(data));
}
