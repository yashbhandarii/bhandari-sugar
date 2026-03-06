import React from 'react';
import { Link } from 'react-router-dom';
import Table, { TableRow, TableCell } from './ui/Table';

const RiskCustomersTable = ({ customers }) => {
    if (!customers || customers.length === 0) return (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No risky customers found. Good job!
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-red-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <span>Priority Collection List</span>
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">High Risk</span>
                </h3>
                <span className="text-sm text-red-600 italic">Pending &gt; 7 Days</span>
            </div>

            <div className="responsive-table">
                <Table headers={['Customer Name', 'Status', 'Pending Amount', 'Days Pending', 'Action']}>
                    {customers.map((c, i) => {
                        const isRed = c.status === 'red'; // Pending > 14 days
                        const isOrange = c.status === 'orange'; // Pending > 7 days

                        const textClass = isRed ? 'text-red-700' : isOrange ? 'text-orange-700' : 'text-gray-700';

                        return (
                            <TableRow key={i} className={isRed ? 'bg-red-50 hover:bg-red-100' : isOrange ? 'bg-orange-50 hover:bg-orange-100' : ''}>
                                <TableCell data-label="Customer" className={`font-bold ${textClass}`}>{c.customer_name}</TableCell>
                                <TableCell data-label="Status" className="text-center">
                                    {isRed && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>}
                                    {isOrange && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Warning</span>}
                                </TableCell>
                                <TableCell data-label="Pending" className={`sm:text-right font-bold ${textClass}`}>₹{c.pending_amount.toLocaleString()}</TableCell>
                                <TableCell data-label="Delay" className="text-center font-medium text-gray-600">
                                    {c.days_pending} Days
                                </TableCell>
                                <TableCell data-label="Action" className="sm:text-right">
                                    <Link to={`/manager/ledger/${c.id}`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                                        View Ledger
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </Table>
            </div>
        </div>
    );
};

export default RiskCustomersTable;
