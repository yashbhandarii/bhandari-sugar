import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardCards from '../components/DashboardCards';
import StockSummaryCard from '../components/StockSummaryCard';
import PaymentMethodChart from '../components/PaymentMethodChart';
import WeeklySalesChart from '../components/WeeklySalesChart';
import RiskCustomersTable from '../components/RiskCustomersTable';
import FinancialYearManager from '../components/FinancialYearManager';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import PageHeader from '../components/ui/PageHeader';
import CardSkeleton from '../components/ui/CardSkeleton';

const OwnerDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState(null);
    const [weeklySales, setWeeklySales] = useState(null);
    const [riskyCustomers, setRiskyCustomers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, paymentRes, weeklyRes, riskRes] = await Promise.all([
                api.get('/dashboard/summary'),
                api.get('/reports/payment-method-summary'),
                api.get('/reports/weekly-sales'),
                api.get('/reports/risky-customers')
            ]);

            setSummary(summaryRes.data);
            setPaymentMethods(paymentRes.data);
            setWeeklySales(weeklyRes.data);
            setRiskyCustomers(riskRes.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching owner dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Auto refresh every 60s
        return () => clearInterval(interval);
    }, []);

    if (loading && !summary) {
        return (
            <div className="space-y-6">
                <PageHeader title="Owner Dashboard" subtitle="Real-time Business Overview" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Business Performance"
                subtitle="Real-time monitoring and analytics"
                action={
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                            Last sync: {lastUpdated.toLocaleTimeString()}
                        </p>
                        <button
                            onClick={fetchData}
                            className={`p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-premium text-primary active:scale-90 ${loading ? 'opacity-50' : ''}`}
                            title="Refresh Data"
                            disabled={loading}
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                }
            />

            {/* Row 1: Summary Cards */}
            <DashboardCards summary={summary} />

            {/* Financial Year Management block */}
            <FinancialYearManager />

            {/* Row 2: Stock & Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-auto lg:h-96">
                <StockSummaryCard stock={summary} />
                <PaymentMethodChart data={paymentMethods} />
            </div>

            {/* Row 3: Weekly Sales */}
            <WeeklySalesChart data={weeklySales} />

            {/* Row 4: Risk Analysis */}
            <RiskCustomersTable customers={riskyCustomers} />
        </div>
    );
};

export default OwnerDashboard;
