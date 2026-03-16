import { GST_RATES } from './constants';

export interface InvoiceItem {
    categoryId: number;
    categoryName: string;
    quantity: number;
    bagWeight: number;
    ratePerBag: number;
    amount: number;
}

export interface InvoiceExpense {
    expenseType: string;
    amount: number;
    description?: string;
}

export interface InvoiceCalculation {
    subtotal: number;
    sgst: number;
    cgst: number;
    totalExpenses: number;
    totalAmount: number;
}

export function calculateInvoiceTotal(
    items: InvoiceItem[],
    expenses: InvoiceExpense[] = []
): InvoiceCalculation {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const sgst = (subtotal * GST_RATES.SGST) / 100;
    const cgst = (subtotal * GST_RATES.CGST) / 100;

    const totalAmount = subtotal + sgst + cgst + totalExpenses;

    return {
        subtotal,
        sgst,
        cgst,
        totalExpenses,
        totalAmount,
    };
}

export function calculateItemAmount(
    quantity: number,
    ratePerBag: number
): number {
    return quantity * ratePerBag;
}

export function calculatePendingAmount(
    invoiceTotal: number,
    paidAmount: number
): number {
    return Math.max(0, invoiceTotal - paidAmount);
}
