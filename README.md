# Bhandari Sugar - Business Management System

A comprehensive business management application for **Lalchand Traders** to manage sugar distribution, inventory, billing, receivables, and reports.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize database:**
   ```bash
   npm run db:push
   ```

3. **Start the backend server:**
   ```bash
   npm run dev:server
   ```
   Server will run on `http://localhost:3000`

4. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```
   App will run on `http://localhost:5173`

5. **Open in browser:**
   Navigate to `http://localhost:5173`

## ✨ Features

### 📊 Dashboard
- Real-time business statistics
- Total sales, pending, and paid amounts
- Category-wise sales breakdown
- Outstanding customer alerts

### 🧾 Invoice Management
- **Fast invoice creation** optimized for repetitive customers
- Customer autocomplete search
- Dynamic item rows with automatic calculations
- GST calculation (2.5% SGST + 2.5% CGST)
- Optional expenses (Labour, Transport, Misc)
- **PDF generation** with professional layout
- Automatic inventory deduction

### 👥 Customer Management
- Add/Edit/Delete customers
- Track total pending and paid amounts
- Customer ledger view
- Payment history
- GST number tracking

### 🏭 Inventory Management
- Multiple godown (warehouse) support
- Real-time stock tracking per category
- Automatic stock deduction on invoice creation
- Manual stock adjustments
- Complete transaction history

### 💰 Payment Tracking
- Multiple payment modes (UPI, Cash, Cheque, Bank Transfer)
- Partial and full payment support
- Overpayment prevention
- Payment date tracking
- Reference number for cheques/bank transfers

### 📈 Reports & Analytics
- **Daily Report** - Sales and payments for selected date
- **Monthly Report** - Current month summary
- **Outstanding Report** - Customer-wise pending amounts
- **Category-wise Sales** - Product performance analysis

## 🎨 UI Features

- ✅ Modern, clean design with gradient backgrounds
- ✅ Fully responsive (mobile + desktop)
- ✅ Mobile-friendly hamburger menu
- ✅ Professional invoice PDFs
- ✅ Real-time calculations
- ✅ Color-coded stats and alerts

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Express, TypeScript
- **Database:** SQLite with Drizzle ORM
- **State Management:** React Query, Zustand
- **PDF Generation:** jsPDF
- **Routing:** Wouter
- **Build Tool:** Vite 7

## 📁 Project Structure

```
bhandari-sugar/
├── src/                    # Frontend React app
│   ├── components/         # Reusable components
│   ├── pages/             # Main pages
│   ├── lib/               # Utilities
│   └── App.tsx            # Main app
├── server/                # Backend Express server
│   ├── db/                # Database schema
│   ├── routes/            # API endpoints
│   └── index.ts           # Server entry
├── shared/                # Shared types & constants
└── bhandari-sugar.db      # SQLite database
```

## 📝 Available Scripts

- `npm run dev` - Start frontend dev server
- `npm run dev:server` - Start backend server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes

## 🎯 Core Business Logic

### Invoice Creation Flow
1. Select customer (with autocomplete)
2. Choose godown
3. Add items (category, quantity, rate)
4. Add optional expenses
5. System auto-calculates GST and total
6. Save → Generates PDF + Deducts inventory

### Inventory Management
- Stock tracked per godown and category
- Automatic deduction on invoice creation
- Restoration on invoice deletion
- Complete audit trail

### Payment Tracking
- Record payments against invoices
- Validates against pending amount
- Supports partial payments
- Multiple payment modes

## 📊 Default Data

The application comes pre-configured with:
- **Categories:** Medium, Super Small (50kg bags)
- You need to add:
  - Godowns (warehouses)
  - Customers
  - Initial stock

## 🔐 Business Rules

- **GST:** Fixed at 2.5% SGST + 2.5% CGST (5% total)
- **Bag Weight:** Default 50kg (editable per invoice)
- **Invoice Numbers:** Auto-generated (INV-000001, INV-000002, etc.)
- **Stock Validation:** Prevents invoices if insufficient stock
- **Payment Validation:** Prevents overpayment

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create a `.env` file:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=./bhandari-sugar.db
```

## 📱 Mobile Support

The application is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones (iOS & Android)

## 🔮 Future Enhancements

- WhatsApp invoice sharing
- Low stock alerts
- Multi-language support (Marathi)
- Role-based access control
- Automatic payment reminders
- Advanced analytics with charts
- Barcode scanning

## 📄 License

Private - Built for Lalchand Traders

## 👨‍💻 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Lalchand Traders**
