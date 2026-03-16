import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
    LayoutDashboard,
    FileText,
    Users,
    Warehouse,
    BarChart3,
    Package,
    Menu,
    X
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [location] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Invoices', href: '/invoices', icon: FileText },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Godowns', href: '/godowns', icon: Warehouse },
        { name: 'Purchase Entry', href: '/purchase-entry', icon: Package },
        { name: 'Distribution', href: '/inventory-distribution', icon: Users },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                Bhandari Sugar
                            </h1>
                            <span className="ml-3 text-sm text-gray-500">Lalchand Traders</span>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Desktop navigation */}
                        <nav className="hidden md:flex space-x-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.name} href={item.href}>
                                        <a
                                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon size={18} className="mr-2" />
                                            {item.name}
                                        </a>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Mobile navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <nav className="px-4 py-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.name} href={item.href}>
                                        <a
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon size={18} className="mr-3" />
                                            {item.name}
                                        </a>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-gray-500">
                        © 2026 Bhandari Sugar - Lalchand Traders. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
