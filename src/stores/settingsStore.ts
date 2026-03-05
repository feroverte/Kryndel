import { create } from 'zustand';
import { Settings, CURRENCY_SYMBOLS } from '../types';

const api = window.electronAPI;

interface SettingsStore {
    settings: Settings;
    loading: boolean;
    fetchSettings: () => Promise<void>;
    updateSetting: (key: string, value: string) => Promise<void>;
    getCurrencySymbol: () => string;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: {
        currency: 'USD',
        theme: 'dark',
        date_format: 'MM/dd/yyyy',
    },
    loading: false,

    fetchSettings: async () => {
        if (!api) return;
        set({ loading: true });
        try {
            const settings = await api.getSettings();
            set({ settings: settings as Settings, loading: false });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            set({ loading: false });
        }
    },

    updateSetting: async (key, value) => {
        if (!api) return;
        try {
            await api.updateSetting(key, value);
            set((state) => ({
                settings: { ...state.settings, [key]: value },
            }));
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    },

    getCurrencySymbol: () => {
        const { settings } = get();
        return CURRENCY_SYMBOLS[settings.currency] || '$';
    },
}));
