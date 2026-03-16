import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Customers table
export const customers = sqliteTable('customers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    mobile: text('mobile'),
    address: text('address'),
    gstNumber: text('gst_number'),
    defaultPaymentMode: text('default_payment_mode'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Categories table
export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    defaultBagWeight: real('default_bag_weight').notNull().default(50),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Godowns table
export const godowns = sqliteTable('godowns', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    location: text('location'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Inventory stock table
export const inventoryStock = sqliteTable('inventory_stock', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    godownId: integer('godown_id').notNull().references(() => godowns.id),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    quantity: integer('quantity').notNull().default(0),
    lastUpdated: integer('last_updated', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Inventory transactions table
export const inventoryTransactions = sqliteTable('inventory_transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    godownId: integer('godown_id').notNull().references(() => godowns.id),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    quantity: integer('quantity').notNull(),
    type: text('type').notNull(), // 'IN' or 'OUT'
    referenceType: text('reference_type'), // 'INVOICE' or 'ADJUSTMENT'
    referenceId: integer('reference_id'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Invoices table
export const invoices = sqliteTable('invoices', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    invoiceNumber: text('invoice_number').notNull().unique(),
    customerId: integer('customer_id').notNull().references(() => customers.id),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    subtotal: real('subtotal').notNull(),
    sgst: real('sgst').notNull(),
    cgst: real('cgst').notNull(),
    totalAmount: real('total_amount').notNull(),
    godownId: integer('godown_id').references(() => godowns.id),
    notes: text('notes'),
    dueDate: integer('due_date', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Invoice items table
export const invoiceItems = sqliteTable('invoice_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    quantity: integer('quantity').notNull(),
    bagWeight: real('bag_weight').notNull(),
    ratePerBag: real('rate_per_bag').notNull(),
    amount: real('amount').notNull(),
});

// Invoice expenses table
export const invoiceExpenses = sqliteTable('invoice_expenses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    expenseType: text('expense_type').notNull(), // 'LABOUR', 'TRANSPORT', 'MISC'
    amount: real('amount').notNull(),
    description: text('description'),
});

// Payments table
export const payments = sqliteTable('payments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
    customerId: integer('customer_id').notNull().references(() => customers.id),
    amount: real('amount').notNull(),
    paymentMode: text('payment_mode').notNull(), // 'UPI', 'CASH', 'CHEQUE', 'BANK_TRANSFER'
    paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
    referenceNumber: text('reference_number'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Inventory purchases table
export const inventoryPurchases = sqliteTable('inventory_purchases', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    godownId: integer('godown_id').notNull().references(() => godowns.id),
    quantity: integer('quantity').notNull(), // number of bags
    ratePerQuintal: real('rate_per_quintal').notNull(), // rate for 100kg (2 bags)
    totalAmount: real('total_amount').notNull(), // calculated: (quantity/2) * ratePerQuintal
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Inventory distributions table
export const inventoryDistributions = sqliteTable('inventory_distributions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerId: integer('customer_id').notNull().references(() => customers.id),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    godownId: integer('godown_id').notNull().references(() => godowns.id),
    quantity: integer('quantity').notNull(), // number of bags distributed
    purchaseId: integer('purchase_id').references(() => inventoryPurchases.id), // track which batch
    invoiceId: integer('invoice_id').references(() => invoices.id), // track if billed
    ratePerQuintal: real('rate_per_quintal').notNull(), // copied from purchase
    distributionDate: integer('distribution_date', { mode: 'timestamp' }).notNull(),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Types
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Godown = typeof godowns.$inferSelect;
export type NewGodown = typeof godowns.$inferInsert;

export type InventoryStock = typeof inventoryStock.$inferSelect;
export type NewInventoryStock = typeof inventoryStock.$inferInsert;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type InvoiceExpense = typeof invoiceExpenses.$inferSelect;
export type NewInvoiceExpense = typeof invoiceExpenses.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type InventoryPurchase = typeof inventoryPurchases.$inferSelect;
export type NewInventoryPurchase = typeof inventoryPurchases.$inferInsert;

export type InventoryDistribution = typeof inventoryDistributions.$inferSelect;
export type NewInventoryDistribution = typeof inventoryDistributions.$inferInsert;

