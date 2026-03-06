import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { AuthContext } from '../context/AuthContext';

const MainLayout = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleSyncSuccess = (e) => {
            const count = e.detail?.count;
            if (count > 0) {
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.success(`Successfully synced ${count} offline delivery sheet(s)!`);
                });
            }
        };
        window.addEventListener('offline-sync-success', handleSyncSuccess);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('offline-sync-success', handleSyncSuccess);
        };
    }, []);

    const isDriver = user?.role === 'driver';

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {isOffline ? (
                <div className="bg-red-500 text-white text-center py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    Offline Mode Active
                </div>
            ) : null}
            <Navbar
                onMenuClick={() => setSidebarOpen(true)}
                showMenuButton={!isDriver}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar enabled only for non-drivers */}
                {!isDriver && (
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                )}

                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 flex flex-col">
                    <div className="max-w-7xl mx-auto w-full flex-grow">
                        {children}
                    </div>
                    <footer className="mt-auto py-4 text-center text-xs text-gray-500 border-t border-gray-200">
                        &copy; 2026 Lalchand Traders – Bhandari Sugar
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
