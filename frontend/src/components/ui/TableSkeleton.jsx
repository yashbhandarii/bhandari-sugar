import React from 'react';
import Skeleton from './Skeleton';
import Table, { TableRow, TableCell } from './Table';

const TableSkeleton = ({ columns = 4, rows = 5 }) => {
    // Generate an array of integers for the columns
    const headerItems = Array.from({ length: columns }, (_, i) => i);
    const rowItems = Array.from({ length: rows }, (_, i) => i);

    // Empty strings for headers so Table expects them
    const headers = headerItems.map(() => '');

    return (
        <Table headers={headers}>
            {rowItems.map(rowIdx => (
                <TableRow key={`row-${rowIdx}`}>
                    {headerItems.map(colIdx => (
                        <TableCell key={`cell-${rowIdx}-${colIdx}`}>
                            <Skeleton className="h-5 w-full" variant="text" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </Table>
    );
};

export default TableSkeleton;
