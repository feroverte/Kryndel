import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    subMonths,
} from 'date-fns';

let db: Database.Database;

export function getDbPath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'taskmanager.db');
}

export function initDatabase(): void {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    createTables();
    seedDefaults();
}

function createTables(): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT,
      priority INTEGER DEFAULT 3,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      tags TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      amount REAL DEFAULT 0,
      payment_type TEXT DEFAULT 'fixed' CHECK(payment_type IN ('fixed', 'variable')),
      frequency TEXT DEFAULT 'monthly' CHECK(frequency IN ('monthly', 'weekly', 'yearly', 'custom')),
      frequency_interval INTEGER DEFAULT 1,
      start_date TEXT NOT NULL,
      next_payment_date TEXT,
      notes TEXT DEFAULT '',
      is_variable INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_history (
      id TEXT PRIMARY KEY,
      payment_id TEXT,
      payment_name TEXT DEFAULT '',
      amount REAL NOT NULL,
      category TEXT DEFAULT 'Other',
      paid_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function seedDefaults(): void {
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('currency', 'USD');
    stmt.run('theme', 'dark');
    stmt.run('date_format', 'MM/dd/yyyy');
}

// ── Task operations ──

export function getAllTasks(filter?: string): any[] {
    let query = 'SELECT * FROM tasks';
    const today = format(new Date(), 'yyyy-MM-dd');

    switch (filter) {
        case 'today':
            query += ` WHERE due_date = '${today}' AND status = 'pending'`;
            break;
        case 'week': {
            const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd');
            query += ` WHERE due_date BETWEEN '${today}' AND '${weekEnd}' AND status = 'pending'`;
            break;
        }
        case 'month': {
            const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            query += ` WHERE due_date BETWEEN '${monthStart}' AND '${monthEnd}' AND status = 'pending'`;
            break;
        }
        case 'completed':
            query += ` WHERE status = 'completed'`;
            break;
        default:
            query += ` WHERE status = 'pending'`;
    }

    query += ' ORDER BY priority ASC, due_date ASC, sort_order ASC';
    return db.prepare(query).all();
}

export function getTask(id: string): any {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function createTask(task: any): any {
    const id = uuidv4();
    const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, due_date, priority, status, tags, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(
        id,
        task.title,
        task.description || '',
        task.due_date || null,
        task.priority || 3,
        'pending',
        JSON.stringify(task.tags || []),
        task.sort_order || 0
    );
    return getTask(id);
}

export function updateTask(id: string, task: any): any {
    const fields: string[] = [];
    const values: any[] = [];

    if (task.title !== undefined) { fields.push('title = ?'); values.push(task.title); }
    if (task.description !== undefined) { fields.push('description = ?'); values.push(task.description); }
    if (task.due_date !== undefined) { fields.push('due_date = ?'); values.push(task.due_date); }
    if (task.priority !== undefined) { fields.push('priority = ?'); values.push(task.priority); }
    if (task.status !== undefined) { fields.push('status = ?'); values.push(task.status); }
    if (task.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(task.tags)); }
    if (task.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(task.sort_order); }

    if (fields.length === 0) return getTask(id);

    values.push(id);
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getTask(id);
}

export function deleteTask(id: string): void {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function toggleTask(id: string): any {
    const task = getTask(id);
    if (!task) return null;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(newStatus, id);
    return getTask(id);
}

// ── Payment operations ──

export function getAllPayments(): any[] {
    return db.prepare('SELECT * FROM payments ORDER BY next_payment_date ASC, name ASC').all();
}

export function getPayment(id: string): any {
    return db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
}

export function createPayment(payment: any): any {
    const id = uuidv4();
    const nextDate = calculateNextPaymentDate(
        payment.start_date,
        payment.frequency || 'monthly',
        payment.frequency_interval || 1
    );

    const stmt = db.prepare(`
    INSERT INTO payments (id, name, category, amount, payment_type, frequency, frequency_interval, start_date, next_payment_date, notes, is_variable, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(
        id,
        payment.name,
        payment.category || 'Other',
        payment.amount || 0,
        payment.payment_type || 'fixed',
        payment.frequency || 'monthly',
        payment.frequency_interval || 1,
        payment.start_date,
        nextDate,
        payment.notes || '',
        payment.is_variable ? 1 : 0,
        payment.status || 'active'
    );
    return getPayment(id);
}

export function updatePayment(id: string, payment: any): any {
    const fields: string[] = [];
    const values: any[] = [];

    if (payment.name !== undefined) { fields.push('name = ?'); values.push(payment.name); }
    if (payment.category !== undefined) { fields.push('category = ?'); values.push(payment.category); }
    if (payment.amount !== undefined) { fields.push('amount = ?'); values.push(payment.amount); }
    if (payment.payment_type !== undefined) { fields.push('payment_type = ?'); values.push(payment.payment_type); }
    if (payment.frequency !== undefined) { fields.push('frequency = ?'); values.push(payment.frequency); }
    if (payment.frequency_interval !== undefined) { fields.push('frequency_interval = ?'); values.push(payment.frequency_interval); }
    if (payment.start_date !== undefined) { fields.push('start_date = ?'); values.push(payment.start_date); }
    if (payment.notes !== undefined) { fields.push('notes = ?'); values.push(payment.notes); }
    if (payment.is_variable !== undefined) { fields.push('is_variable = ?'); values.push(payment.is_variable ? 1 : 0); }
    if (payment.status !== undefined) { fields.push('status = ?'); values.push(payment.status); }

    // Recalculate next_payment_date if frequency or start_date changed
    if (payment.start_date || payment.frequency || payment.frequency_interval) {
        const existing = getPayment(id);
        const startDate = payment.start_date || existing.start_date;
        const freq = payment.frequency || existing.frequency;
        const interval = payment.frequency_interval || existing.frequency_interval;
        const nextDate = calculateNextPaymentDate(startDate, freq, interval);
        fields.push('next_payment_date = ?');
        values.push(nextDate);
    }

    if (fields.length === 0) return getPayment(id);

    values.push(id);
    db.prepare(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getPayment(id);
}

export function deletePayment(id: string): void {
    db.prepare('DELETE FROM payments WHERE id = ?').run(id);
}

// ── Recurring Payment Engine ──

function calculateNextPaymentDate(startDate: string, frequency: string, interval: number): string {
    const start = parseISO(startDate);
    const now = new Date();
    let current = start;

    while (current <= now) {
        current = advanceDate(current, frequency, interval);
    }

    return format(current, 'yyyy-MM-dd');
}

function advanceDate(date: Date, frequency: string, interval: number): Date {
    switch (frequency) {
        case 'weekly':
            return addWeeks(date, interval);
        case 'monthly':
            return addMonths(date, interval);
        case 'yearly':
            return addYears(date, interval);
        case 'custom':
            return addDays(date, interval);
        default:
            return addMonths(date, 1);
    }
}

export function getPaymentOccurrences(startDateStr: string, endDateStr: string): any[] {
    const payments = db.prepare("SELECT * FROM payments WHERE status = 'active'").all() as any[];
    const rangeStart = parseISO(startDateStr);
    const rangeEnd = parseISO(endDateStr);
    const occurrences: any[] = [];

    for (const payment of payments) {
        const start = parseISO(payment.start_date);
        let current = start;

        // Advance to near the range start
        while (current < rangeStart) {
            const next = advanceDate(current, payment.frequency, payment.frequency_interval || 1);
            if (next > rangeStart) break;
            current = next;
        }

        // Collect occurrences within range
        while (current <= rangeEnd) {
            if (current >= rangeStart) {
                occurrences.push({
                    payment_id: payment.id,
                    payment_name: payment.name,
                    category: payment.category,
                    amount: payment.amount,
                    date: format(current, 'yyyy-MM-dd'),
                    is_variable: payment.is_variable,
                    payment_type: payment.payment_type,
                });
            }
            current = advanceDate(current, payment.frequency, payment.frequency_interval || 1);
        }
    }

    return occurrences;
}

export function getPaymentStats(): any {
    const payments = db.prepare("SELECT * FROM payments WHERE status = 'active'").all() as any[];
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const monthlyOccurrences = getPaymentOccurrences(monthStart, monthEnd);
    const totalMonthly = monthlyOccurrences.reduce((sum: number, o: any) => sum + o.amount, 0);

    // Calculate annual costs
    const yearStart = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
    const yearEnd = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd');
    const yearOccurrences = getPaymentOccurrences(yearStart, yearEnd);
    const totalAnnual = yearOccurrences.reduce((sum: number, o: any) => sum + o.amount, 0);

    // Upcoming payments (next 30 days)
    const futureEnd = format(addDays(now, 30), 'yyyy-MM-dd');
    const upcoming = getPaymentOccurrences(format(now, 'yyyy-MM-dd'), futureEnd);

    return {
        totalMonthly,
        totalAnnual,
        upcomingCount: upcoming.length,
        activeCount: payments.length,
    };
}

// ── Payment History ──

export function getAllPaymentHistory(paymentId?: string): any[] {
    if (paymentId) {
        return db.prepare('SELECT * FROM payment_history WHERE payment_id = ? ORDER BY paid_date DESC').all(paymentId);
    }
    return db.prepare('SELECT * FROM payment_history ORDER BY paid_date DESC').all();
}

export function addPaymentHistory(entry: any): any {
    const id = uuidv4();
    db.prepare(`
    INSERT INTO payment_history (id, payment_id, payment_name, amount, category, paid_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        entry.payment_id || null,
        entry.payment_name || '',
        entry.amount,
        entry.category || 'Other',
        entry.paid_date,
        entry.notes || ''
    );
    return db.prepare('SELECT * FROM payment_history WHERE id = ?').get(id);
}

export function getMonthlySpending(months: number = 12): any[] {
    const results: any[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStr = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM yyyy');

        const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payment_history
      WHERE strftime('%Y-%m', paid_date) = ?
    `).get(monthStr) as any;

        results.push({
            month: monthLabel,
            monthKey: monthStr,
            total: row?.total || 0,
        });
    }

    return results;
}

export function getCategoryBreakdown(): any[] {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    return db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM payment_history
    WHERE paid_date BETWEEN ? AND ?
    GROUP BY category
    ORDER BY total DESC
  `).all(monthStart, monthEnd) as any[];
}

// ── Notes ──

export function getAllNotes(date?: string): any[] {
    if (date) {
        return db.prepare('SELECT * FROM notes WHERE date = ? ORDER BY created_at DESC').all(date);
    }
    return db.prepare('SELECT * FROM notes ORDER BY date DESC, created_at DESC').all();
}

export function createNote(note: any): any {
    const id = uuidv4();
    db.prepare('INSERT INTO notes (id, content, date) VALUES (?, ?, ?)').run(
        id, note.content, note.date
    );
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
}

export function updateNote(id: string, note: any): any {
    const fields: string[] = [];
    const values: any[] = [];
    if (note.content !== undefined) { fields.push('content = ?'); values.push(note.content); }
    if (note.date !== undefined) { fields.push('date = ?'); values.push(note.date); }
    if (fields.length === 0) return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    values.push(id);
    db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
}

export function deleteNote(id: string): void {
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
}

// ── Settings ──

export function getAllSettings(): any {
    const rows = db.prepare('SELECT * FROM settings').all() as any[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    return settings;
}

export function updateSetting(key: string, value: string): void {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

// ── Export/Import ──

export function exportAllData(): any {
    return {
        tasks: db.prepare('SELECT * FROM tasks').all(),
        payments: db.prepare('SELECT * FROM payments').all(),
        payment_history: db.prepare('SELECT * FROM payment_history').all(),
        notes: db.prepare('SELECT * FROM notes').all(),
        settings: db.prepare('SELECT * FROM settings').all(),
        exported_at: new Date().toISOString(),
    };
}

export function importAllData(data: any): void {
    const transaction = db.transaction(() => {
        // Clear existing data
        db.exec('DELETE FROM payment_history');
        db.exec('DELETE FROM tasks');
        db.exec('DELETE FROM payments');
        db.exec('DELETE FROM notes');
        db.exec('DELETE FROM settings');

        // Import tasks
        const taskStmt = db.prepare(`
      INSERT INTO tasks (id, title, description, due_date, priority, status, tags, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const t of data.tasks || []) {
            taskStmt.run(t.id, t.title, t.description, t.due_date, t.priority, t.status, t.tags, t.sort_order, t.created_at);
        }

        // Import payments
        const paymentStmt = db.prepare(`
      INSERT INTO payments (id, name, category, amount, payment_type, frequency, frequency_interval, start_date, next_payment_date, notes, is_variable, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const p of data.payments || []) {
            paymentStmt.run(p.id, p.name, p.category, p.amount, p.payment_type, p.frequency, p.frequency_interval, p.start_date, p.next_payment_date, p.notes, p.is_variable, p.status, p.created_at);
        }

        // Import payment history
        const historyStmt = db.prepare(`
      INSERT INTO payment_history (id, payment_id, payment_name, amount, category, paid_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const h of data.payment_history || []) {
            historyStmt.run(h.id, h.payment_id, h.payment_name, h.amount, h.category, h.paid_date, h.notes, h.created_at);
        }

        // Import notes
        const noteStmt = db.prepare('INSERT INTO notes (id, content, date, created_at) VALUES (?, ?, ?, ?)');
        for (const n of data.notes || []) {
            noteStmt.run(n.id, n.content, n.date, n.created_at);
        }

        // Import settings
        const settingStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        for (const s of data.settings || []) {
            settingStmt.run(s.key, s.value);
        }
    });

    transaction();
}
