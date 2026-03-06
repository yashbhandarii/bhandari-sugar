import React from 'react';
import Logo from './Logo';

const BrandHeader = ({ showRole = false, role = '' }) => {
    return (
        <div className="flex items-center gap-6 border-b border-gray-100 pb-5 mb-8">
            <div className="bg-white/40 p-2 rounded-xl border border-gray-100/50">
                <Logo className="h-16 w-auto" />
            </div>
            <div className="flex-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter">
                    Bhandari <span className="text-primary">Sugar</span>
                </h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                    Lalchand Traders Management System
                </p>
            </div>
            {showRole && role && (
                <div className="px-3 py-1 bg-secondary-light/30 text-primary-dark rounded-full text-xs font-bold uppercase tracking-wide">
                    {role}
                </div>
            )}
        </div>
    );
};

export default BrandHeader;
