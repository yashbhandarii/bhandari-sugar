import React from 'react';

const Table = ({ headers, children, className = '' }) => {
    return (
        <div className={`overflow-x-auto bg-white rounded-2xl shadow-premium border border-gray-100 ${className}`}>
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50 sticky top-0 z-10">
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export const TableRow = ({ children, className = '' }) => (
    <tr className={`hover:bg-primary/5 transition-all duration-200 group ${className}`}>
        {children}
    </tr>
);

export const TableCell = ({ children, className = '', colSpan }) => (
    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors ${className}`} colSpan={colSpan}>
        {children}
    </td>
);

export default Table;
