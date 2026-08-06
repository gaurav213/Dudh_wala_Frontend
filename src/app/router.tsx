import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { SessionExpiredPage, UnauthorizedPage } from '../features/auth/pages/SessionPages'
import { AuditListPage } from '../features/audit/pages/AuditListPage'
import { BillDetailPage } from '../features/billing/pages/BillDetailPage'
import { BillsListPage } from '../features/billing/pages/BillsListPage'
import { OutstandingReportPage } from '../features/billing/pages/OutstandingReportPage'
import { CustomerDetailPage } from '../features/customers/pages/CustomerDetailPage'
import { CustomersListPage } from '../features/customers/pages/CustomersListPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { DeliveriesReportPage } from '../features/deliveries/pages/DeliveriesReportPage'
import { PaymentsListPage } from '../features/payments/pages/PaymentsListPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { SupplierDetailPage } from '../features/suppliers/pages/SupplierDetailPage'
import { SuppliersListPage } from '../features/suppliers/pages/SuppliersListPage'
import { AuthProvider } from '../lib/auth/AuthContext'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="suppliers" element={<SuppliersListPage />} />
              <Route path="suppliers/:id" element={<SupplierDetailPage />} />
              <Route path="customers" element={<CustomersListPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="deliveries" element={<DeliveriesReportPage />} />
              <Route path="billing" element={<BillsListPage />} />
              <Route path="billing/:id" element={<BillDetailPage />} />
              <Route path="payments" element={<PaymentsListPage />} />
              <Route path="reports/outstanding" element={<OutstandingReportPage />} />
              <Route path="audit" element={<AuditListPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
