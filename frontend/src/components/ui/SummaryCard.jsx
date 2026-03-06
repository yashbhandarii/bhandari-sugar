import React, { cloneElement } from 'react';

const SummaryCard = ({ title, value, icon, color = 'primary' }) => {
    const variants = {
        primary: { bg: 'bg-primary/10', text: 'text-primary', shadow: 'shadow-primary/5' },
        red: { bg: 'bg-red-50', text: 'text-red-600', shadow: 'shadow-red-500/5' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-500/5' },
        secondary: { bg: 'bg-secondary/10', text: 'text-secondary-dark', shadow: 'shadow-secondary/5' },
        accent: { bg: 'bg-accent/10', text: 'text-accent-dark', shadow: 'shadow-accent/5' },
    };

    const variant = variants[color] || variants.primary;

    return (
        <div className={`bg-white rounded-2xl shadow-premium p-6 border border-gray-100/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${variant.shadow}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
                    <div className="mt-3 flex items-baseline">
                        <span className="text-2xl font-black text-gray-900 tracking-tight">{value}</span>
                    </div>
                </div>
                {icon && (
                    <div className={`p-4 rounded-2xl ${variant.bg} ${variant.text}`}>
                        {cloneElement(icon, { className: "w-7 h-7" })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummaryCard;
