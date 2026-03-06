import React from 'react';

const Badge = ({ status, className = '' }) => {
    const styles = {
        pending: "bg-red-50 text-red-600",
        unpaid: "bg-red-50 text-red-600",
        paid: "bg-primary-light/10 text-primary-light",
        partial: "bg-yellow-50 text-yellow-600",
        draft: "bg-gray-50 text-gray-600",
        submitted: "bg-blue-50 text-blue-600",
        billed: "bg-purple-50 text-purple-600",
        medium: "bg-primary-light text-white", // Stock category
        super_small: "bg-accent-dark text-white", // Stock category
    };

    const defaultStyle = "bg-gray-50 text-gray-500";
    const statusKey = status?.toLowerCase().replace(' ', '_');

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[statusKey] || defaultStyle} ${className}`}>
            {status}
        </span>
    );
};

export default Badge;
