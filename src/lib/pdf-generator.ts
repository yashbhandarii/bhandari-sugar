import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';
import { GST_RATES } from '@shared/constants';

export function generateInvoicePDF(
    invoice: any,
    customer: any,
    items: any[],
    expenses: any[],
    calculation: any
) {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LALCHAND TRADERS', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Bhandari Sugar', 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Sugar Distribution & Trading', 105, 34, { align: 'center' });

    // Invoice Details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, 45, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 55);
    doc.text(`Date: ${formatDate(invoice.date)}`, 20, 61);

    // Customer Details
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 20, 78);
    if (customer.mobile) {
        doc.text(`Mobile: ${customer.mobile}`, 20, 84);
    }
    if (customer.address) {
        const addressLines = doc.splitTextToSize(customer.address, 80);
        doc.text(addressLines, 20, 90);
    }
    if (customer.gstNumber) {
        doc.text(`GST: ${customer.gstNumber}`, 20, 102);
    }

    // Items Table
    const tableData = items.map((item) => [
        item.categoryName,
        item.quantity.toString(),
        `${item.bagWeight} kg`,
        formatCurrency(item.ratePerBag),
        formatCurrency(item.amount),
    ]);

    autoTable(doc, {
        startY: 115,
        head: [['Category', 'Bags', 'Bag Weight', 'Rate/Bag', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [248, 172, 22], textColor: 255 },
        styles: { fontSize: 10 },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Expenses
    if (expenses.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Expenses:', 20, finalY);
        finalY += 6;

        doc.setFont('helvetica', 'normal');
        expenses.forEach((expense) => {
            const expenseText = `${expense.expenseType}: ${formatCurrency(expense.amount)}`;
            doc.text(expenseText, 25, finalY);
            if (expense.description) {
                doc.setFontSize(8);
                doc.text(`(${expense.description})`, 80, finalY);
                doc.setFontSize(10);
            }
            finalY += 5;
        });
        finalY += 5;
    }

    // Calculation Summary
    const summaryX = 120;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, finalY);
    doc.text(formatCurrency(calculation.subtotal), 180, finalY, { align: 'right' });

    finalY += 6;
    doc.text(`SGST (${GST_RATES.SGST}%):`, summaryX, finalY);
    doc.text(formatCurrency(calculation.sgst), 180, finalY, { align: 'right' });

    finalY += 6;
    doc.text(`CGST (${GST_RATES.CGST}%):`, summaryX, finalY);
    doc.text(formatCurrency(calculation.cgst), 180, finalY, { align: 'right' });

    if (calculation.totalExpenses > 0) {
        finalY += 6;
        doc.text('Expenses:', summaryX, finalY);
        doc.text(formatCurrency(calculation.totalExpenses), 180, finalY, { align: 'right' });
    }

    // Total
    finalY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', summaryX, finalY);
    doc.text(formatCurrency(calculation.totalAmount), 180, finalY, { align: 'right' });

    // Notes
    if (invoice.notes) {
        finalY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, finalY);
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(invoice.notes, 170);
        doc.text(notesLines, 20, finalY + 5);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    // Save PDF
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}
