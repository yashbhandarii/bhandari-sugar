# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bhandari Sugar is a business management system for Lalchand Traders to manage sugar distribution, inventory, billing, receivables, and reports. It's a full-stack application with a React frontend and Express backend connected to PostgreSQL.

## Development Commands

### Backend (from `/backend`)
```bash
npm install          # Install dependencies
npm run dev          # Start development server with nodemon (port 5000)
npm start            # Start production server
```

### Frontend (from `/frontend`)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Build for production (outputs to /build)
npm run preview      # Preview production build
```

### Database
- PostgreSQL database configured via `DATABASE_URL` or individual DB_* variables
- Schema located at `database/schema.sql`
- Backend includes automated daily backups at 11:59 PM via node-cron

## Architecture

### Backend Structure
```
backend/
├── server.js           # Entry point, Express app setup, routes
├── db.js               # PostgreSQL connection pool (pg library)
├── routes/             # Express route definitions (*.routes.js)
├── controllers/        # Request handlers (*.controller.js)
├── services/           # Business logic layer (*.service.js)
├── middleware/         # Auth, validation, rate limiting, error handling
├── utils/              # Logger, backup utilities
└── cron/               # Scheduled tasks (database backups)
```

### Frontend Structure
```
frontend/src/
├── App.jsx             # Route definitions with role-based access control
├── context/AuthContext.jsx  # Auth state management (JWT-based)
├── services/api.jsx    # Axios instance with auth interceptor
├── services/db.jsx     # Dexie IndexedDB for offline storage
├── pwa/                # Service worker for offline capability
├── pages/              # Route components (lazy-loaded)
├── components/         # Reusable UI components
├── layouts/            # MainLayout with Navbar/Sidebar
└── utils/              # Helper functions
```

### Key Architectural Patterns

1. **Three-tier backend architecture**: Routes → Controllers → Services
2. **Role-based access control**: Three roles - `driver`, `manager`, `owner`
3. **JWT authentication**: Tokens stored in localStorage, attached via Axios interceptors
4. **Offline-first PWA**: Service worker + Dexie IndexedDB for delivery sheet offline storage
5. **PostgreSQL**: Connection pooling via pg library with SSL support for Supabase

## Environment Variables

### Backend (`backend/.env`)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string (Supabase/Render)
- `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` - Individual DB config
- `JWT_SECRET` - Required for authentication
- `FRONTEND_URL` - CORS allowed origin
- `NODE_ENV` - development/production

### Frontend
- `VITE_API_URL` - Backend API URL (defaults to `http://localhost:5000/api`)

## User Roles & Routes

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| Driver | `/driver/dashboard` | Create delivery sheets, view history |
| Manager | `/manager/dashboard` | Billing, payments, customer management, reports |
| Owner | `/owner/dashboard` | Full access including audit logs |

## API Endpoints (Key Routes)

- `/api/auth` - Authentication (login)
- `/api/customers` - Customer CRUD
- `/api/delivery-sheets` - Delivery sheet management
- `/api/billing` - Invoice generation from delivery sheets
- `/api/payments` - Payment tracking
- `/api/reports` - Daily, monthly, aging reports
- `/api/godown` - Godown/inventory operations
- `/api/inventory` - Stock movements
- `/api/admin` - Admin operations
- `/api/financial-years` - Financial year management

## Database Schema Highlights

- **Users**: Role-based (driver/manager/owner) with mobile login
- **Delivery Sheets**: Truck-based delivery tracking with draft/submitted/billed statuses
- **Invoices**: Generated from delivery sheets with GST (5% total - 2.5% SGST + 2.5% CGST)
- **Payments**: Multiple payment methods (cash/upi/cheque/bank) with adjustment tracking
- **Stock Movements**: Inventory tracking (factory_in, delivery_out, godown_in)
- **Financial Years**: Year-locking for accounting periods

## Business Rules

- GST: Fixed at 5% (2.5% SGST + 2.5% CGST)
- Invoice numbers: Auto-generated (INV-000001, etc.)
- Stock validation: Prevents invoices if insufficient stock
- Payment validation: Prevents overpayment

## Deployment

- Frontend: Vercel (SPA rewrites configured in `vercel.json`)
- Backend: Railway/Render/Fly.io (Dockerfile provided)
- Database: Supabase PostgreSQL (connection pooling enabled)