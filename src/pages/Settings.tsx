import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { CURRENCY_SYMBOLS } from '../types';

export default function Settings() {
    const { settings, fetchSettings, updateSetting } = useSettingsStore();
    const [exportStatus, setExportStatus] = useState('');
    const [importStatus, setImportStatus] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleExport = async () => {
        try {
            const data = await window.electronAPI.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `taskmanager-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportStatus('Data exported successfully!');
            setTimeout(() => setExportStatus(''), 3000);
        } catch (error) {
            setExportStatus('Export failed. Please try again.');
            setTimeout(() => setExportStatus(''), 3000);
        }
    };

    const handleImport = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const data = JSON.parse(text);
                await window.electronAPI.importData(data);
                setImportStatus('Data imported successfully! Reloading...');
                setTimeout(() => {
                    setImportStatus('');
                    window.location.reload();
                }, 2000);
            };
            input.click();
        } catch (error) {
            setImportStatus('Import failed. Please check the file format.');
            setTimeout(() => setImportStatus(''), 3000);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-sm text-text-secondary mt-1">Configure your TaskManager preferences</p>
            </div>

            {/* Currency */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold">General</h3>
                <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Default Currency</label>
                    <select
                        value={settings.currency || 'USD'}
                        onChange={(e) => updateSetting('currency', e.target.value)}
                        className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50"
                    >
                        {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                            <option key={code} value={code}>{code} ({symbol})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Date Format</label>
                    <select
                        value={settings.date_format || 'MM/dd/yyyy'}
                        onChange={(e) => updateSetting('date_format', e.target.value)}
                        className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-violet/50"
                    >
                        <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                        <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                        <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold">Data Management</h3>
                <p className="text-xs text-text-muted">Export your data as a JSON backup or import from a previous backup.</p>

                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-accent-violet/15 text-accent-violet-light text-sm font-medium rounded-xl hover:bg-accent-violet/25 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export Data
                    </button>
                    <button
                        onClick={handleImport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue/15 text-accent-blue-light text-sm font-medium rounded-xl hover:bg-accent-blue/25 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import Data
                    </button>
                </div>

                {exportStatus && (
                    <p className="text-xs text-accent-green animate-fade-in">{exportStatus}</p>
                )}
                {importStatus && (
                    <p className="text-xs text-accent-blue animate-fade-in">{importStatus}</p>
                )}
            </div>

            {/* About */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold">About</h3>
                <div className="space-y-2 text-xs text-text-muted">
                    <p><span className="text-text-secondary">Version:</span> 1.0.0</p>
                    <p><span className="text-text-secondary">Stack:</span> Electron + React + TypeScript + SQLite</p>
                    <p><span className="text-text-secondary">Data:</span> All data stored locally on your machine</p>
                    <p><span className="text-text-secondary">Privacy:</span> No internet connectivity required</p>
                </div>
            </div>
        </div>
    );
}
