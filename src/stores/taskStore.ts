import { create } from 'zustand';
import { Task, TaskFilter } from '../types';

const api = window.electronAPI;

interface TaskStore {
    tasks: Task[];
    filter: TaskFilter;
    loading: boolean;
    setFilter: (filter: TaskFilter) => void;
    fetchTasks: () => Promise<void>;
    addTask: (task: Partial<Task>) => Promise<void>;
    editTask: (id: string, task: Partial<Task>) => Promise<void>;
    removeTask: (id: string) => Promise<void>;
    toggleComplete: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    filter: 'all',
    loading: false,

    setFilter: (filter) => {
        set({ filter });
        get().fetchTasks();
    },

    fetchTasks: async () => {
        if (!api) return;
        set({ loading: true });
        try {
            const filter = get().filter;
            const tasks = await api.getTasks(filter === 'all' ? undefined : filter);
            const parsed = tasks.map((t: any) => ({
                ...t,
                tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags || [],
            }));
            set({ tasks: parsed, loading: false });
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            set({ loading: false });
        }
    },

    addTask: async (task) => {
        if (!api) return;
        try {
            await api.createTask(task);
            get().fetchTasks();
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    },

    editTask: async (id, task) => {
        if (!api) return;
        try {
            await api.updateTask(id, task);
            get().fetchTasks();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    },

    removeTask: async (id) => {
        if (!api) return;
        try {
            await api.deleteTask(id);
            get().fetchTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    },

    toggleComplete: async (id) => {
        if (!api) return;
        try {
            await api.toggleTask(id);
            get().fetchTasks();
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    },
}));
