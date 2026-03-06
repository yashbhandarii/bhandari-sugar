import React from 'react';

const SecondaryButton = ({ children, onClick, type = 'button', className = '', disabled = false }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg shadow-sm
                transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                ${className}
            `}
        >
            {children}
        </button>
    );
};

export default SecondaryButton;
