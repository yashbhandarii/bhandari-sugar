export const GST_RATES = {
    SGST: 2.5,
    CGST: 2.5,
    TOTAL: 5.0,
} as const;

export const DEFAULT_BAG_WEIGHT = 50; // kg

export const PAYMENT_MODES = ['UPI', 'CASH', 'CHEQUE', 'BANK_TRANSFER'] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

export const EXPENSE_TYPES = ['LABOUR', 'TRANSPORT', 'MISC'] as const;
export type ExpenseType = typeof EXPENSE_TYPES[number];

export const TRANSACTION_TYPES = ['IN', 'OUT'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

export const REFERENCE_TYPES = ['INVOICE', 'ADJUSTMENT'] as const;
export type ReferenceType = typeof REFERENCE_TYPES[number];
