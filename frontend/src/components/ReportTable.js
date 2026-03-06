import React from 'react';
import Table, { TableRow, TableCell } from './ui/Table';

const ReportTable = ({ data, totalSale, totalPaid, totalPending }) => {
    return (
        <div className="responsive-table">
            <Table headers={['Customer', 'Sale', 'Paid', 'Pending']}>
                {data.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell data-label="Customer" className="font-medium text-gray-900">{item.name}</TableCell>
                        <TableCell data-label="Sale">{item.total_sale.toFixed(2)}</TableCell>
                        <TableCell data-label="Paid">{item.total_paid.toFixed(2)}</TableCell>
                        <TableCell data-label="Pending" className={item.pending_amount > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                            {item.pending_amount.toFixed(2)}
                        </TableCell>
                    </TableRow>
                ))}
                {/* Total Row */}
                {data.length > 0 && (
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 sm:table-row flex flex-col p-4 mb-4 rounded-lg shadow-sm">
                        <td className="px-6 py-4 sm:table-cell flex justify-between items-center"><span className="sm:hidden text-xs uppercase tracking-widest text-gray-500">Label</span>TOTAL</td>
                        <td className="px-6 py-4 sm:table-cell flex justify-between items-center"><span className="sm:hidden text-xs uppercase tracking-widest text-gray-500">Sale</span>{totalSale.toFixed(2)}</td>
                        <td className="px-6 py-4 sm:table-cell flex justify-between items-center"><span className="sm:hidden text-xs uppercase tracking-widest text-gray-500">Paid</span>{totalPaid.toFixed(2)}</td>
                        <td className="px-6 py-4 sm:table-cell flex justify-between items-center"><span className="sm:hidden text-xs uppercase tracking-widest text-gray-500">Pending</span>{totalPending.toFixed(2)}</td>
                    </tr>
                )}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No data available for the selected period.
                        </TableCell>
                    </TableRow>
                )}
            </Table>
        </div>
    );
};

export default ReportTable;
