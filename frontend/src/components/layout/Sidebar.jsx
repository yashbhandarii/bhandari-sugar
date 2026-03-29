import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
    HomeIcon,
    TruckIcon,
    CurrencyRupeeIcon,
    ChartBarIcon,
    UsersIcon,
    DocumentTextIcon,
    ArchiveBoxIcon,
    DocumentDuplicateIcon,
    ChartPieIcon,
    XMarkIcon,
    PlusCircleIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Logo from '../Logo';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useContext(AuthContext);

    const navigation = [
        { name: 'Dashboard', href: `/${user?.role}/dashboard`, icon: HomeIcon, roles: ['manager', 'owner'] },
        { name: 'Delivery Sheets', href: '/manager/delivery-sheets', icon: TruckIcon, roles: ['manager', 'owner'] },
        { name: 'New Delivery Sheet', href: '/driver/delivery-sheet/new', icon: PlusCircleIcon, roles: ['owner'] },
        { name: 'Payments', href: '/manager/payments', icon: CurrencyRupeeIcon, roles: ['manager', 'owner'] },
        { name: 'Customers', href: '/manager/customers', icon: UsersIcon, roles: ['manager', 'owner'] },
        { name: 'Advanced Reports', href: '/reports', icon: DocumentTextIcon, roles: ['manager', 'owner'] },
        { name: 'Audit Log', href: '/owner/audit-log', icon: ClipboardDocumentListIcon, roles: ['owner'] },

        // Godown Section
        { type: 'header', name: 'Godown', roles: ['manager', 'owner'] },
        { name: 'Create GST Invoice', href: '/godown/invoice', icon: DocumentDuplicateIcon, roles: ['manager', 'owner'] },
        { name: 'Add Stock', href: '/godown/add-stock', icon: ArchiveBoxIcon, roles: ['manager', 'owner'] },
        { name: 'Godown Reports', href: '/godown/reports', icon: ChartPieIcon, roles: ['manager', 'owner'] },
    ];

    // Filter based on role
    const filteredNav = navigation.filter(item => item.roles.includes(user?.role));

    const sidebarClasses = `
    fixed inset-y-0 left-0 z-30 w-[80vw] max-w-sm sm:w-72 bg-white/95 backdrop-blur-sm border-r border-gray-100 shadow-premium transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-primary/20 backdrop-blur-[2px] z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={sidebarClasses}>
                {/* Header with Logo + Close button on mobile */}
                <div className="h-auto flex items-center justify-between border-b border-gray-50 bg-white px-4 py-3">
                    <Logo className="h-16 sm:h-20 w-auto transition-transform hover:scale-105 duration-300 drop-shadow-md" />
                    {/* Close button — only visible on mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-primary"
                        aria-label="Close menu"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                    {filteredNav.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`header-${index}`} className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    {item.name}
                                </div>
                            );
                        }
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => { if (window.innerWidth < 1024) onClose() }}
                                className={({ isActive }) => `
                                    flex items-center px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-primary text-white shadow-vibrant scale-[1.02]'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary hover:translate-x-1'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
                                        <span className="flex-1">{item.name}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
