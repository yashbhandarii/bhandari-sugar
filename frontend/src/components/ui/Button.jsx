import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    onClick
}) => {
    const baseStyles = "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-95";

    const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 focus:ring-primary",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-300",
        outline: "border-2 border-primary/10 bg-white hover:bg-primary/5 text-primary focus:ring-primary",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 focus:ring-red-500",
        success: "bg-primary-light hover:bg-primary text-white shadow-lg shadow-primary-light/20 focus:ring-primary-light",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        full: "w-full py-4 text-lg", // For driver interface
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
