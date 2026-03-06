import React from 'react';

const handleEnterKey = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const form = e.currentTarget.closest('form') || document;
        const focusable = Array.from(
            form.querySelectorAll(
                'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
            )
        ).filter(el => el.tabIndex !== -1);
        const index = focusable.indexOf(e.currentTarget);
        if (index >= 0 && index < focusable.length - 1) {
            focusable[index + 1].focus();
        }
    }
};

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    disabled = false,
    className = '',
    name,
    id,
    min,
    max,
    step,
    error,
    onKeyDown,
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                id={id}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                onWheel={type === 'number' ? (e) => e.target.blur() : undefined}
                onKeyDown={(e) => {
                    handleEnterKey(e);
                    if (onKeyDown) onKeyDown(e);
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'
                    } ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Input;
