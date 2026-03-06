import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
    // variant can be 'rectangular', 'circular', or 'text'
    const baseClasses = 'animate-pulse bg-gray-200';
    let roundedClass = 'rounded-md';

    if (variant === 'circular') {
        roundedClass = 'rounded-full';
    } else if (variant === 'text') {
        roundedClass = 'rounded-sm';
    }

    return (
        <div
            className={`${baseClasses} ${roundedClass} ${className}`}
            {...props}
        />
    );
};

export default Skeleton;
