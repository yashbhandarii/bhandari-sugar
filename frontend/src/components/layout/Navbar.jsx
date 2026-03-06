import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const Navbar = ({ onMenuClick, showMenuButton }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-premium h-14 sm:h-16 flex items-center px-3 sm:px-6 justify-between sticky top-0 z-20">
            <div className="flex items-center">
                {showMenuButton && (
                    <button
                        onClick={onMenuClick}
                        className="mr-2 sm:mr-4 lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-primary">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <Logo className="h-8 sm:h-11 w-auto transition-all duration-300 hover:scale-110 drop-shadow-sm" />
                    <span className="hidden sm:block text-xl font-black text-primary tracking-tight">Bhandari Sugar</span>
                </div>
                {isOffline && (
                    <div className="ml-2 sm:ml-4 flex items-center bg-orange-50 text-orange-700 px-2 py-1 rounded-lg border border-orange-100 animate-pulse">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-1.5"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden xs:block">Offline</span>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-6">
                {/* User info — full on md+, compact on mobile */}
                <div className="hidden sm:flex flex-col items-end border-r border-gray-100 pr-4 sm:pr-6">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name || 'User'}</p>
                    <p className="text-[10px] font-black text-primary-light uppercase tracking-widest">{user?.role || 'Guest'}</p>
                </div>
                {/* Mobile: only role badge */}
                <div className="flex sm:hidden items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">
                        {user?.role || 'Guest'}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-primary hover:bg-primary-dark text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 duration-200"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
