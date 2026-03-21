import React from 'react';

const PrintInstructionsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pb-4 pt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h10.5m-10.5 4.5h10.5m-10.5 4.5h6.75M6 19.5h12a1.5 1.5 0 001.5-1.5V6A1.5 1.5 0 0018 4.5H6A1.5 1.5 0 004.5 6v12A1.5 1.5 0 006 19.5z" />
                            </svg>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Thermal Printer Setup</h3>
                    <p className="mt-1 text-sm text-gray-500">How to print the 58mm invoice from your phone or browser.</p>
                </div>

                <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            1
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Install a print service app</h4>
                            <p className="mt-1 text-sm text-gray-600">
                                Use an ESC/POS compatible Android print service if your printer is paired by Bluetooth.
                            </p>
                            <ul className="mt-2 space-y-1 text-sm text-gray-500">
                                <li>PrinterShare</li>
                                <li>Bluetooth Print Service</li>
                                <li>Any ESC/POS print service supported by your printer</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            2
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Pair the printer</h4>
                            <p className="mt-1 text-sm text-gray-600">
                                Pair your 58mm printer in the device Bluetooth settings first, then open the print service app and select that printer.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            3
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Use Share to Print</h4>
                            <p className="mt-1 text-sm text-gray-600">
                                Tap Share to Print, choose your ESC/POS or receipt app from the Android share sheet, and print from that app.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                        <p className="text-sm text-amber-800">
                            On mobile, Share to Print is usually the easiest path. Direct Bluetooth printing only works in some browsers.
                        </p>
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <p className="text-sm text-blue-800">
                            Paper spec: 57.5mm roll, about 48mm printable width, 203 DPI, ESC/POS compatible.
                        </p>
                    </div>

                    <details className="text-sm">
                        <summary className="cursor-pointer font-semibold text-gray-700">Troubleshooting</summary>
                        <div className="mt-2 space-y-2 pl-4 text-gray-600">
                            <p><strong>Printer not appearing?</strong> Confirm Bluetooth is on and the printer is already paired.</p>
                            <p><strong>Print is cut off?</strong> Check that the printer profile is set to 58mm paper in the print service app.</p>
                            <p><strong>Direct ESC/POS print fails?</strong> Use Share to Print instead. It is more reliable across Android devices.</p>
                            <p><strong>Using iPhone or Safari?</strong> Share support depends on the printer app. Direct Web Bluetooth is commonly unavailable there.</p>
                        </div>
                    </details>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary-dark"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintInstructionsModal;
