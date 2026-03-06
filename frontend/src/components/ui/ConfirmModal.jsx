import React, { useState, useEffect } from 'react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = true,
    requireInput = null // Text the user must type to enable the confirm button
}) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isConfirmDisabled = requireInput ? inputValue !== requireInput : false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-up border border-gray-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="px-6 pt-6 pb-4 flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'
                        }`}>
                        {isDestructive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center">{title}</h3>
                    <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                    {requireInput && (
                        <div className="mt-4 w-full">
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider text-center">
                                Type "{requireInput}" to confirm
                            </label>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={requireInput}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-bold"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3 sm:flex-row-reverse border-t border-gray-100">
                    <button
                        type="button"
                        disabled={isConfirmDisabled}
                        onClick={() => {
                            if (!isConfirmDisabled) {
                                onConfirm();
                                onClose();
                            }
                        }}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 duration-200 ${isConfirmDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : isDestructive
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 duration-200 shadow-sm"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
