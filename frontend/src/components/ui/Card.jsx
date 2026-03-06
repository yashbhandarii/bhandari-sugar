import React from 'react';

const Card = ({ children, className = '', title, action }) => {
    return (
        <div className={`bg-white rounded-2xl shadow-premium border border-gray-100/50 p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
            {(title || action) && (
                <div className="flex justify-between items-center mb-6">
                    {title && <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
