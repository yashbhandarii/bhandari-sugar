import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';

// Lazy Load Pages
// Lazy Load Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const DriverHistoryPage = lazy(() => import('./pages/DriverHistoryPage'));
const DeliverySheetPage = lazy(() => import('./pages/DeliverySheetPage'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));

// Manager Pages
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const DeliverySheetList = lazy(() => import('./pages/DeliverySheetList'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const PaymentCollectionPage = lazy(() => import('./pages/PaymentCollectionPage'));
const CustomerLedgerPage = lazy(() => import('./pages/CustomerLedgerPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// Advanced Reports Pages
const ReportsDashboard = lazy(() => import('./pages/ReportsDashboard'));
const AgingReportPage = lazy(() => import('./pages/AgingReportPage'));
const DiscountImpactPage = lazy(() => import('./pages/DiscountImpactPage'));
const CustomerSummaryPage = lazy(() => import('./pages/CustomerSummaryPage'));
const TodayCashPage = lazy(() => import('./pages/TodayCashPage'));

// Godown Pages
const GodownAddStockPage = lazy(() => import('./pages/GodownAddStockPage'));
const CreateGodownInvoicePage = lazy(() => import('./pages/CreateGodownInvoicePage'));
const GodownReportsPage = lazy(() => import('./pages/GodownReportsPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Unauthorized
  }

  return children;
};



const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes Wrapped in MainLayout */}
        <Route path="/*" element={
          <MainLayout>
            <Routes>
              {/* Driver Routes */}
              <Route path="/driver/dashboard" element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              <Route path="/driver/history" element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverHistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/driver/delivery-sheet/new" element={
                <ProtectedRoute allowedRoles={['driver', 'owner']}>
                  <DeliverySheetPage />
                </ProtectedRoute>
              } />
              <Route path="/driver/delivery-sheet/:id" element={
                <ProtectedRoute allowedRoles={['driver', 'owner']}>
                  <DeliverySheetPage />
                </ProtectedRoute>
              } />

              {/* Manager Routes */}
              <Route path="/manager/dashboard" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/manager/delivery-sheets" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <DeliverySheetList />
                </ProtectedRoute>
              } />
              <Route path="/manager/billing/:id" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <BillingPage />
                </ProtectedRoute>
              } />
              <Route path="/manager/payments" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <PaymentCollectionPage />
                </ProtectedRoute>
              } />
              <Route path="/manager/ledger/:customerId" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <CustomerLedgerPage />
                </ProtectedRoute>
              } />
              <Route path="/manager/customers" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <CustomersPage />
                </ProtectedRoute>
              } />
              <Route path="/manager/reports" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />

              {/* Advanced Reports Routes */}
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <ReportsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/reports/today-cash" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <TodayCashPage />
                </ProtectedRoute>
              } />
              <Route path="/reports/customer-summary" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <CustomerSummaryPage />
                </ProtectedRoute>
              } />
              <Route path="/reports/aging" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <AgingReportPage />
                </ProtectedRoute>
              } />
              <Route path="/reports/discount-impact" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <DiscountImpactPage />
                </ProtectedRoute>
              } />

              {/* Owner Routes */}
              <Route path="/owner/dashboard" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/owner/reports" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/owner/audit-log" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <AuditLogPage />
                </ProtectedRoute>
              } />

              {/* Godown Routes */}
              <Route path="/godown/add-stock" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <GodownAddStockPage />
                </ProtectedRoute>
              } />
              <Route path="/godown/invoice" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <CreateGodownInvoicePage />
                </ProtectedRoute>
              } />
              <Route path="/godown/reports" element={
                <ProtectedRoute allowedRoles={['manager', 'owner']}>
                  <GodownReportsPage />
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
