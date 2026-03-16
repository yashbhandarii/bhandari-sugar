import { Router } from 'express';
import { db } from '../db/index.js';
import { invoices, payments, customers, categories, invoiceItems } from '../db/schema.js';
import { sql, eq, gte, lte, and } from 'drizzle-orm';

const router = Router();

// Daily report
router.get('/daily', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date as string) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const dailyInvoices = await db
            .select()
            .from(invoices)
            .where(
                and(
                    gte(invoices.date, startOfDay),
                    lte(invoices.date, endOfDay)
                )
            )
            .all();

        const dailyPayments = await db
            .select()
            .from(payments)
            .where(
                and(
                    gte(payments.paymentDate, startOfDay),
                    lte(payments.paymentDate, endOfDay)
                )
            )
            .all();

        const totalSales = dailyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalPayments = dailyPayments.reduce((sum, pay) => sum + pay.amount, 0);

        res.json({
            date: targetDate,
            totalInvoices: dailyInvoices.length,
            totalSales,
            totalPayments,
            invoices: dailyInvoices,
            payments: dailyPayments,
        });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ error: 'Failed to generate daily report' });
    }
});

// Monthly report
router.get('/monthly', async (req, res) => {
    try {
        const { year, month } = req.query;
        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();

        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        const monthlyInvoices = await db
            .select()
            .from(invoices)
            .where(
                and(
                    gte(invoices.date, startOfMonth),
                    lte(invoices.date, endOfMonth)
                )
            )
            .all();

        const monthlyPayments = await db
            .select()
            .from(payments)
            .where(
                and(
                    gte(payments.paymentDate, startOfMonth),
                    lte(payments.paymentDate, endOfMonth)
                )
            )
            .all();

        const totalSales = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalPayments = monthlyPayments.reduce((sum, pay) => sum + pay.amount, 0);

        res.json({
            year: targetYear,
            month: targetMonth + 1,
            totalInvoices: monthlyInvoices.length,
            totalSales,
            totalPayments,
            pending: totalSales - totalPayments,
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ error: 'Failed to generate monthly report' });
    }
});

// Customer outstanding report
router.get('/customer-outstanding', async (req, res) => {
    try {
        const result = await db
            .select({
                customerId: customers.id,
                customerName: customers.name,
                totalInvoiced: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)`,
                totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`,
            })
            .from(customers)
            .leftJoin(invoices, eq(customers.id, invoices.customerId))
            .leftJoin(payments, eq(customers.id, payments.customerId))
            .groupBy(customers.id)
            .all();

        const outstanding = result.map(r => ({
            ...r,
            pending: r.totalInvoiced - r.totalPaid,
        })).filter(r => r.pending > 0);

        res.json(outstanding);
    } catch (error) {
        console.error('Error generating customer outstanding report:', error);
        res.status(500).json({ error: 'Failed to generate customer outstanding report' });
    }
});

// Category-wise sales report
router.get('/category-sales', async (req, res) => {
    try {
        const categorySales = await db
            .select({
                categoryId: categories.id,
                categoryName: categories.name,
                totalQuantity: sql<number>`sum(${invoiceItems.quantity})`,
                totalAmount: sql<number>`sum(${invoiceItems.amount})`,
            })
            .from(invoiceItems)
            .leftJoin(categories, eq(invoiceItems.categoryId, categories.id))
            .groupBy(categories.id)
            .all();

        res.json(categorySales);
    } catch (error) {
        console.error('Error generating category sales report:', error);
        res.status(500).json({ error: 'Failed to generate category sales report' });
    }
});

export default router;
