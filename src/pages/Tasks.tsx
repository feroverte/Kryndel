import { useEffect, useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { Task, TaskFilter, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORIES } from '../types';

const filterTabs: { key: TaskFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'completed', label: 'Completed' },
];

export default function Tasks() {
    const { tasks, filter, loading, setFilter, fetchTasks, addTask, editTask, removeTask, toggleComplete } = useTaskStore();
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [priority, setPriority] = useState(3);
    const [tags, setTags] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const openCreate = () => {
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setDueDate(format(new Date(), 'yyyy-MM-dd'));
        setPriority(3);
        setTags('');
        setShowModal(true);
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description);
        setDueDate(task.due_date || format(new Date(), 'yyyy-MM-dd'));
        setPriority(task.priority);
        setTags(Array.isArray(task.tags) ? task.tags.join(', ') : '');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!title.trim()) return;
        const taskData = {
            title,
            description,
            due_date: dueDate,
            priority,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        };
        if (editingTask) {
            await editTask(editingTask.id, taskData);
        } else {
            await addTask(taskData);
        }
        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        await removeTask(id);
    };

    const getPriorityDot = (p: number) => {
        const colors: Record<number, string> = {
            1: 'bg-red-400',
            2: 'bg-orange-400',
            3: 'bg-blue-400',
            4: 'bg-slate-400',
        };
        return <span className={`w-2 h-2 rounded-full ${colors[p] || colors[3]}`} />;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
                    <p className="text-sm text-text-secondary mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent-violet text-white text-sm font-medium rounded-xl hover:bg-accent-violet/80 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /></svg>
                    Add Task
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-bg-card border border-border rounded-xl w-fit">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${filter === tab.key
                                ? 'bg-accent-violet/20 text-accent-violet-light'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-text-muted text-sm">Loading...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-text-muted mb-2">No tasks found</p>
                        <button onClick={openCreate} className="text-sm text-accent-violet hover:underline">Create your first task</button>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center gap-4 px-4 py-3.5 bg-bg-card border border-border rounded-xl hover:bg-bg-hover transition-all group"
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => toggleComplete(task.id)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.status === 'completed'
                                        ? 'bg-accent-green border-accent-green'
                                        : 'border-border-light hover:border-accent-violet'
                                    }`}
                            >
                                {task.status === 'completed' && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 4L3.5 6.5L9 1" />
                                    </svg>
                                )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {getPriorityDot(task.priority)}
                                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-text-muted' : ''}`}>
                                        {task.title}
                                    </p>
                                </div>
                                {task.description && (
                                    <p className="text-xs text-text-muted mt-0.5 truncate">{task.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5">
                                    {task.due_date && (
                                        <span className="text-[10px] text-text-muted">
                                            📅 {format(new Date(task.due_date), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                    <span className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>
                                        {PRIORITY_LABELS[task.priority]}
                                    </span>
                                    {Array.isArray(task.tags) && task.tags.map((tag: string) => (
                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-accent-violet/10 text-accent-violet-light rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEdit(task)}
                                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(task.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-text-muted hover:text-red-400"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Task Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTask ? 'Edit Task' : 'New Task'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(parseInt(e.target.value))}
                                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50"
                            >
                                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="work, personal, urgent..."
                            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors">Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2 text-sm font-medium text-white bg-accent-violet rounded-xl hover:bg-accent-violet/80 transition-colors">
                            {editingTask ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
