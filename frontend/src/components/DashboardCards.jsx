import React from 'react';
import SummaryCard from './ui/SummaryCard';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon,
    WalletIcon
} from '@heroicons/react/24/outline';

const DashboardCards = ({ summary }) => {
    if (!summary) return null;

    const {
        total_sales,
        total_collections,
        total_pending,
        active_customers
    } = summary;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
                title="Total Sales"
                value={`₹${total_sales?.toLocaleString() || 0}`}
                icon={<ArrowTrendingUpIcon />}
                color="blue"
            />
            <SummaryCard
                title="Collections"
                value={`₹${total_collections?.toLocaleString() || 0}`}
                icon={<BanknotesIcon />}
                color="primary"
            />
            <SummaryCard
                title="Active Accounts"
                value={active_customers || 0}
                icon={<UserGroupIcon />}
                color="secondary"
            />
            <SummaryCard
                title="Total Outstanding"
                value={`₹${total_pending?.toLocaleString() || 0}`}
                icon={<WalletIcon />}
                color="red"
            />
        </div>
    );
};

export default DashboardCards;
