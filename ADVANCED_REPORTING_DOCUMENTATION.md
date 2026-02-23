# Advanced Reporting Module - Implementation Guide

## Overview

The Advanced Reporting Module provides comprehensive financial analytics and business insights for the Bhandari Sugar system. All calculations are backend-driven using optimized SQL aggregation, with no financial computations in the frontend.

---

## 📋 Reports Implemented

### 1. TODAY'S CASH COLLECTION

**Endpoint:** `GET /api/reports/today-cash`

**Purpose:** Track cash payments received today by customer

**Response Structure:**

```json
{
  "date": "2026-02-20",
  "total_cash_collected": 50000.0,
  "count": 5,
  "data": [
    {
      "customer_name": "Customer A",
      "invoice_id": 123,
      "payment_amount": 10000.0,
      "remaining_pending": 2000.0,
      "last_invoice_date": "2026-02-15"
    }
  ]
}
```

**Frontend Route:** `/reports/today-cash`

---

### 2. CUSTOMER SUMMARY

**Endpoint:** `GET /api/reports/customer-summary?type=day|week|month&date=YYYY-MM-DD`

**Purpose:** View sales, payments, and pending by customer

**Parameters:**

- `type` (required): `day`, `week`, or `month`
- `date` (optional): Used only when `type=day`

**Response Structure:**

```json
{
  "title": "Month: February 2026",
  "start_date": "2026-02-01",
  "end_date": "2026-02-28",
  "totals": {
    "total_sales": 500000.0,
    "total_paid": 400000.0,
    "total_pending": 100000.0
  },
  "count": 50,
  "data": [
    {
      "customer_name": "Customer A",
      "total_sales": 50000.0,
      "total_paid": 40000.0,
      "total_pending": 10000.0
    }
  ]
}
```

**Frontend Route:** `/reports/customer-summary`

---

### 3. AGING REPORT (HIGH PRIORITY)

**Endpoint:** `GET /api/reports/aging`

**Purpose:** Track overdue invoices grouped by age with risk indicators

**Age Buckets:**

- **0-7 days** (CURRENT) - Green
- **8-15 days** (WATCH_LIST) - Yellow
- **16-30 days** (MEDIUM_RISK) - Orange
- **30+ days** (HIGH_RISK) - Red

**Response Structure:**

```json
{
  "generated_at": "2026-02-20T10:30:00.000Z",
  "total_pending": 1500000.00,
  "high_risk_count": 12,
  "by_bucket": {
    "0-7 days": {
      "count": 25,
      "total": 300000.00,
      "data": [
        {
          "customer_name": "Customer A",
          "pending_amount": 10000.00,
          "days_pending": 5,
          "age_bucket": "0-7 days",
          "risk_level": "CURRENT"
        }
      ]
    },
    "30+ days": {
      "count": 12,
      "total": 450000.00,
      "data": [...]
    }
  }
}
```

**Key Features:**

- Automatically categorizes customers by aging
- Highlights HIGH_RISK (30+ days) customers
- Used to track overdue collections

**Frontend Route:** `/reports/aging`

---

### 4. DISCOUNT IMPACT REPORT

**Endpoint:** `GET /api/reports/discount-impact?type=day|week|month&date=YYYY-MM-DD`

**Purpose:** Analyze discount trends and revenue impact

**Parameters:**

- `type` (required): `day`, `week`, or `month`
- `date` (optional): Used only when `type=day`

**Response Structure:**

```json
{
  "title": "Discount Impact Report",
  "start_date": "2026-02-01",
  "end_date": "2026-02-28",
  "totals": {
    "overall_gross_sales": 550000.0,
    "overall_discount_total": 15000.0,
    "overall_net_revenue": 535000.0,
    "overall_discount_percentage": 2.73
  },
  "count": 50,
  "data": [
    {
      "customer_name": "Customer A",
      "total_gross_sales": 50000.0,
      "total_discount_given": 2000.0,
      "net_sales": 48000.0,
      "discount_percentage": 4.0
    }
  ]
}
```

**Calculation:**

```
Gross Sales = subtotal + sgst + cgst
Discount % = (total_discount_given / total_gross_sales) × 100
Net Sales = total_amount (after discount)
```

**Frontend Route:** `/reports/discount-impact`

---

### 5. PAYMENT DELAY REPORT

**Endpoint:** `GET /api/reports/payment-delay`

**Purpose:** Track customers with pending payments and delays

**Response Structure:**

```json
{
  "generated_at": "2026-02-20T10:30:00.000Z",
  "total_customers_with_pending": 35,
  "data": [
    {
      "customer_name": "Customer A",
      "pending_amount": 50000.0,
      "last_payment_date": "2026-01-15",
      "days_since_last_payment": 36
    }
  ]
}
```

**Notes:**

- Sorted by `days_since_last_payment` (descending)
- Identifies customers with longest payment gaps
- Useful for collections strategy

**Frontend Route:** `/reports/payment-delay` (Not explicitly listed but available)

---

### 6. ENHANCED DASHBOARD SUMMARY

**Endpoint:** `GET /api/reports/dashboard-summary-advanced`

**Purpose:** Comprehensive KPI dashboard with all key metrics

**Response Structure:**

```json
{
  "date": "2026-02-20",
  "today": {
    "cash_collected": 50000.0,
    "upi_collected": 30000.0,
    "bank_collected": 20000.0,
    "cheque_collected": 5000.0,
    "total_today": 105000.0
  },
  "pending": {
    "total_pending": 1500000.0
  },
  "sales": {
    "week_sales": 600000.0,
    "month_sales": 2500000.0,
    "month_discount": 75000.0
  },
  "risk": {
    "aging_high_risk_count": 12
  }
}
```

**Frontend Route:** `/reports` (Dashboard)

---

## 🎯 Frontend Routes

All advanced reports are accessible through the following frontend routes:

| Route                       | Component                | Purpose                         |
| --------------------------- | ------------------------ | ------------------------------- |
| `/reports`                  | `ReportsDashboard.js`    | Main reports hub with KPI cards |
| `/reports/today-cash`       | `TodayCashPage.js`       | Today's cash collection details |
| `/reports/customer-summary` | `CustomerSummaryPage.js` | Customer-wise sales and pending |
| `/reports/aging`            | `AgingReportPage.js`     | Aging analysis by bucket        |
| `/reports/discount-impact`  | `DiscountImpactPage.js`  | Discount trends analysis        |

---

## 📥 PDF Download Support

All reports support PDF download via:

**Endpoint:** `GET /api/reports/download?type=<report_type>`

**Report Types:**

- `today-cash` - Today's Cash Collection
- `customer-summary` - Customer Summary
- `aging` - Aging Report
- `discount` - Discount Impact
- `summary` - Dashboard Summary
- `payment-delay` - Payment Delay (if needed)

**Example:**

```javascript
// Download Aging Report PDF
GET /api/reports/download?type=aging

// Download Discount Impact for specific day
GET /api/reports/download?type=discount&date=2026-02-20
```

**Features:**

- Professional formatting with company header
- Grouped data by category (e.g., aging buckets)
- Automatic pagination
- Generated date and date range
- Grand totals on each section

---

## 🗄️ Database Optimization

### Indices Added

The following indices have been created for optimal performance:

```sql
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_customer_created_at ON invoices(customer_id, created_at);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_customer_payment_date ON payments(customer_id, payment_date);
```

### Benefits:

- **O(log n)** lookup for date-based queries
- **Composite indices** for multi-column WHERE clauses
- Eliminates N+1 query problems
- All aggregations use GROUP BY with indexed columns

---

## 🧪 Testing

### Test Suite Location

`backend/services/advanced-report.test.js`

### Running Tests

```bash
node backend/services/advanced-report.test.js
```

### Test Scenarios Covered

1. **Aging Bucket 8-15 days**: Verifies correct categorization
2. **Aging Bucket 30+ days**: Verifies high-risk identification
3. **Discount Reporting**: Validates discount calculations
4. **PDF Consistency**: Ensures table totals match when downloaded
5. **Today's Cash Filtering**: Validates payment method filtering
6. **Customer Pending Logic**: Verifies `pending = sales - paid` calculation
7. **Database Indices**: Confirms performance indices exist
8. **Payment Delay Tracking**: Validates last payment date tracking

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║   Advanced Reporting System - Comprehensive Test Suite      ║
╚════════════════════════════════════════════════════════════╝

✓ TEST 1: Aging Report - 8-15 days bucket
  ✓ Found 5 customers in 8-15 days bucket

✓ TEST 2: Aging Report - 30+ days bucket
  ✓ Found 12 customers in 30+ days bucket

[... more tests ...]

╔════════════════════════════════════════════════════════════╗
║   Test Results: 8 PASSED, 0 FAILED                         ║
╚════════════════════════════════════════════════════════════╝
```

---

## 💡 Key Features

### Backend Advantages

- ✅ **All calculations at DB level** - No frontend math
- ✅ **Parameterized queries** - SQL injection protection
- ✅ **Optimized aggregation** - GROUP BY on indexed columns
- ✅ **No N+1 queries** - Single queries with JOINs
- ✅ **Soft-delete aware** - Considers data integrity

### Frontend Benefits

- ✅ **Date filters** - Day/Week/Month selection
- ✅ **PDF downloads** - Professional reports
- ✅ **Responsive tables** - Mobile-friendly
- ✅ **Color-coded risk** - Visual risk indicators
- ✅ **Real-time refresh** - Auto-refresh every 2-5 minutes

---

## 📊 Usage Examples

### Manager Dashboard

```javascript
// On dashboard load
const res = await api.get("/reports/dashboard-summary-advanced");
// Shows: Today's collections, pending, week sales, high-risk count
```

### Collections Team

```javascript
// Check today's cash
const res = await api.get("/reports/today-cash");
// Lists all cash payments received today with remaining pending

// Check aging
const res = await api.get("/reports/aging");
// Prioritize followup on 30+ days bucket
```

### Finance Team

```javascript
// Analyze discounts
const res = await api.get("/reports/discount-impact?type=month");
// Track discount trends and impact on revenue

// Customer summary
const res = await api.get("/reports/customer-summary?type=month");
// Monitor customer liquidity and payment status
```

---

## ⚙️ Configuration

### Refresh Intervals

- **Today's Cash Page**: 2 minutes
- **Dashboard**: 5 minutes
- **Other Reports**: On-demand

### Date Formats

- API: `YYYY-MM-DD` (ISO 8601)
- Display: Locale-specific (browser)
- DB: PostgreSQL DATE type

### Tolerance

- **Invoice Integrity Check**: ±0.02 paise (due to GST split rounding)

---

## 🔒 Security

- **Authentication**: Required (verifyToken middleware)
- **Authorization**: Manager and Owner roles only
- **SQL Protection**: Parameterized queries
- **CORS**: Enabled for cross-origin requests

---

## 📝 Notes

1. **All pending calculations** exclude paid invoices
2. **Aging calculation** based on invoice creation date, not last payment
3. **Discount impact** includes GST in gross sales
4. **PDF generation** happens server-side for security
5. **High-risk** customers (30+ days) require immediate follow-up

---

## Troubleshooting

### Common Issues

**Issue**: Reports showing empty data

- **Cause**: No invoices or payments in date range
- **Solution**: Check date filters, create sample data

**Issue**: Slow performance

- **Cause**: Missing indices
- **Solution**: Run schema migration to add indices

**Issue**: PDF download fails

- **Cause**: pdfkit not installed
- **Solution**: `npm install pdfkit --save`

**Issue**: Pending calculation mismatch

- **Cause**: Invoice status not updated
- **Solution**: Verify invoices have correct total_amount and status

---

## Future Enhancements

- [ ] Custom date range picker
- [ ] Export to Excel (CSV)
- [ ] Email report scheduling
- [ ] Data visualization charts
- [ ] Drill-down customer details
- [ ] Collections workflow integration
- [ ] WhatsApp notifications for high-risk
- [ ] Multi-month trend analysis

---

**Version**: 1.0  
**Last Updated**: February 20, 2026  
**Status**: Production Ready ✅
