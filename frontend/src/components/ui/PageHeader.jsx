import React from 'react';

const PageHeader = ({ title, action, subtitle }) => {
    return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
