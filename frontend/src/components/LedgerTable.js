import React from 'react';
import Table, { TableRow, TableCell } from './ui/Table';

const LedgerTable = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
        return <div className="text-gray-500 text-center py-4">No transactions found.</div>;
    }

    return (
        <Table headers={['Date', 'Type', 'Credit (In)', 'Debit (Out)', 'Balance']}>
            {transactions.map((txn, index) => (
                <TableRow key={index}>
                    <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <span className="capitalize font-medium block">{txn.type}</span>
                        {txn.subType && <span className="text-xs text-gray-500">{txn.subType}</span>}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                        {txn.type === 'payment' ? `₹${parseFloat(txn.amount).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                        {txn.type === 'invoice' ? `₹${parseFloat(txn.amount).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                        ₹{parseFloat(txn.balance).toLocaleString()}
                    </TableCell>
                </TableRow>
            ))}
        </Table>
    );
};

export default LedgerTable;
