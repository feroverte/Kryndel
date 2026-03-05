import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
            {/* Title bar */}
            <div className="titlebar-drag h-9 bg-bg-secondary border-b border-border flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2 titlebar-no-drag">
                    <div className="w-3 h-3 rounded-full bg-accent-violet"></div>
                    <span className="text-xs font-medium text-text-secondary">TaskManager</span>
                </div>
                <div className="flex items-center gap-1 titlebar-no-drag">
                    <button
                        onClick={() => window.electronAPI?.minimize()}
                        className="w-7 h-5 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
                    >
                        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor" className="text-text-secondary">
                            <rect width="10" height="1" />
                        </svg>
                    </button>
                    <button
                        onClick={() => window.electronAPI?.maximize()}
                        className="w-7 h-5 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
                    >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-text-secondary">
                            <rect x="0.5" y="0.5" width="8" height="8" rx="1" />
                        </svg>
                    </button>
                    <button
                        onClick={() => window.electronAPI?.close()}
                        className="w-7 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors group"
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-text-secondary group-hover:text-red-400">
                            <line x1="1" y1="1" x2="9" y2="9" />
                            <line x1="9" y1="1" x2="1" y2="9" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
