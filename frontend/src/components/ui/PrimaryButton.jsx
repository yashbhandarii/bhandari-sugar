import React from 'react';

const PrimaryButton = ({ children, onClick, type = 'button', className = '', disabled = false }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                bg-primary hover:bg-primary-light text-white font-medium py-2 px-4 rounded-lg shadow-sm
                transition duration-150 ease-in-out transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                ${className}
            `}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;
