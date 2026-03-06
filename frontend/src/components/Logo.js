import React from 'react';

const Logo = ({ className = 'h-10' }) => {
    return (
        <img
            src="/logo.png?v=2"
            alt="Bhandari Sugar"
            className={`object-contain ${className}`}
        />
    );
};

export default Logo;
