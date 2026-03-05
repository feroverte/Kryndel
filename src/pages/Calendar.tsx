import { useEffect, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTaskStore } from '../stores/taskStore';
import { usePaymentStore } from '../stores/paymentStore';
import { useSettingsStore } from '../stores/settingsStore';
import Modal from '../components/Modal';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { CATEGORIES, PRIORITY_LABELS } from '../types';

export default function Calendar() {
    const { tasks, fetchTasks, addTask } = useTaskStore();
    const { getOccurrences, addPayment } = usePaymentStore();
    const { getCurrencySymbol } = useSettingsStore();
    const currency = getCurrencySymbol();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [paymentEvents, setPaymentEvents] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [addType, setAddType] = useState<'task' | 'payment' | 'note'>('task');

    // Task form
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState(3);

    // Payment form
    const [paymentName, setPaymentName] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentCategory, setPaymentCategory] = useState('Other');

    useEffect(() => {
        const filter = undefined; // get all pending tasks
        fetchTasks();
    }, []);

    useEffect(() => {
        loadPaymentEvents();
    }, [currentDate]);

    const loadPaymentEvents = async () => {
        const start = format(subMonths(startOfMonth(currentDate), 1), 'yyyy-MM-dd');
        const end = format(addMonths(endOfMonth(currentDate), 1), 'yyyy-MM-dd');
        const occurrences = await getOccurrences(start, end);
        setPaymentEvents(occurrences);
    };

    const calendarEvents = useMemo(() => {
        const events: any[] = [];

        // Tasks as events
        tasks.forEach((task) => {
            if (task.due_date && task.status === 'pending') {
                events.push({
                    id: `task-${task.id}`,
                    title: `📋 ${task.title}`,
                    date: task.due_date,
                    backgroundColor: 'rgba(139, 92, 246, 0.25)',
                    borderColor: 'rgba(139, 92, 246, 0.5)',
                    textColor: '#A78BFA',
                    extendedProps: { type: 'task' },
                });
            }
        });

        // Payment occurrences as events
        paymentEvents.forEach((occ, idx) => {
            events.push({
                id: `payment-${occ.payment_id}-${idx}`,
                title: `💰 ${occ.payment_name} · ${currency}${occ.amount}`,
                date: occ.date,
                backgroundColor: 'rgba(20, 184, 166, 0.25)',
                borderColor: 'rgba(20, 184, 166, 0.5)',
                textColor: '#2DD4BF',
                extendedProps: { type: 'payment' },
            });
        });

        return events;
    }, [tasks, paymentEvents, currency]);

    const handleDateClick = (info: any) => {
        setSelectedDate(info.dateStr);
        setTaskTitle('');
        setTaskPriority(3);
        setPaymentName('');
        setPaymentAmount('');
        setPaymentCategory('Other');
        setAddType('task');
        setShowAddModal(true);
    };

    const handleDatesSet = (info: any) => {
        const mid = new Date((new Date(info.start).getTime() + new Date(info.end).getTime()) / 2);
        setCurrentDate(mid);
    };

    const handleSave = async () => {
        if (addType === 'task') {
            if (!taskTitle.trim()) return;
            await addTask({ title: taskTitle, due_date: selectedDate, priority: taskPriority });
            await fetchTasks();
        } else if (addType === 'payment') {
            if (!paymentName.trim()) return;
            await addPayment({
                name: paymentName,
                amount: parseFloat(paymentAmount) || 0,
                category: paymentCategory,
                frequency: 'monthly',
                start_date: selectedDate,
                payment_type: 'fixed',
            });
            await loadPaymentEvents();
        }
        setShowAddModal(false);
    };

    return (
        <div className="space-y-6 animate-fade-in h-full">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
                <p className="text-sm text-text-secondary mt-1">View tasks and payments at a glance</p>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4" style={{ height: 'calc(100vh - 200px)' }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    datesSet={handleDatesSet}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: '',
                    }}
                    height="100%"
                    dayMaxEvents={3}
                    fixedWeekCount={false}
                />
            </div>

            {/* Add Item Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Add to ${selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy') : ''}`}>
                <div className="space-y-4">
                    {/* Type selector */}
                    <div className="flex gap-1 p-1 bg-bg-tertiary rounded-xl">
                        <button onClick={() => setAddType('task')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${addType === 'task' ? 'bg-accent-violet/20 text-accent-violet-light' : 'text-text-secondary hover:text-text-primary'}`}>
                            Task
                        </button>
                        <button onClick={() => setAddType('payment')}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${addType === 'payment' ? 'bg-accent-teal/20 text-accent-teal' : 'text-text-secondary hover:text-text-primary'}`}>
                            Payment
                        </button>
                    </div>

                    {addType === 'task' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Task Title</label>
                                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="What needs to be done?"
                                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
                                <select value={taskPriority} onChange={(e) => setTaskPriority(parseInt(e.target.value))}
                                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50">
                                    {Object.entries(PRIORITY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {addType === 'payment' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Payment Name</label>
                                <input type="text" value={paymentName} onChange={(e) => setPaymentName(e.target.value)} placeholder="Payment name..."
                                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
                                    <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" step="0.01"
                                        className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                                    <select value={paymentCategory} onChange={(e) => setPaymentCategory(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-teal/50">
                                        {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors">Cancel</button>
                        <button onClick={handleSave}
                            className={`px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors ${addType === 'task' ? 'bg-accent-violet hover:bg-accent-violet/80' : 'bg-accent-teal hover:bg-accent-teal/80'}`}>
                            Add
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
