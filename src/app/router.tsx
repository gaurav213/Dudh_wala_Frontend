import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterCustomerPage } from '../features/auth/pages/RegisterCustomerPage'
import { RegisterFarmOwnerPage } from '../features/auth/pages/RegisterFarmOwnerPage'
import { SessionExpiredPage, UnauthorizedPage } from '../features/auth/pages/SessionPages'
import { AdminFarmDetailPage } from '../features/admin-farms/pages/AdminFarmDetailPage'
import { AdminFarmsPage } from '../features/admin-farms/pages/AdminFarmsPage'
import { AuditListPage } from '../features/audit/pages/AuditListPage'
import { BillDetailPage } from '../features/billing/pages/BillDetailPage'
import { BillsListPage } from '../features/billing/pages/BillsListPage'
import { OutstandingReportPage } from '../features/billing/pages/OutstandingReportPage'
import { CustomerLayout } from '../features/customer/layout/CustomerLayout'
import { CustomerAddressesPage } from '../features/customer/pages/CustomerAddressesPage'
import { CustomerBillingPage } from '../features/customer/pages/CustomerBillingPage'
import { CustomerDashboardPage } from '../features/customer/pages/CustomerDashboardPage'
import { CustomerFarmDetailPage } from '../features/customer/pages/CustomerFarmDetailPage'
import { CustomerFarmsPage } from '../features/customer/pages/CustomerFarmsPage'
import { CustomerProfilePage } from '../features/customer/pages/CustomerProfilePage'
import { CustomerServiceRequestsPage } from '../features/customer/pages/CustomerServiceRequestsPage'
import { CustomerDetailPage } from '../features/customers/pages/CustomerDetailPage'
import { CustomersListPage } from '../features/customers/pages/CustomersListPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { DeliveriesReportPage } from '../features/deliveries/pages/DeliveriesReportPage'
import { DeliveryLayout } from '../features/delivery/layout/DeliveryLayout'
import { DeliveryCustomersPage } from '../features/delivery/pages/DeliveryCustomersPage'
import { DeliveryDashboardPage } from '../features/delivery/pages/DeliveryDashboardPage'
import { DeliveryPendingCashPage } from '../features/delivery/pages/DeliveryPendingCashPage'
import { DeliveryProfilePage } from '../features/delivery/pages/DeliveryProfilePage'
import { DeliveryTodayPage } from '../features/delivery/pages/DeliveryTodayPage'
import { FarmConnectedCustomersPage } from '../features/farm/pages/FarmConnectedCustomersPage'
import { FarmCustomerInvitationsPage } from '../features/farm/pages/FarmCustomerInvitationsPage'
import { FarmDashboardPage } from '../features/farm/pages/FarmDashboardPage'
import { FarmProductsPage } from '../features/farm/pages/FarmProductsPage'
import { FarmProfilePage } from '../features/farm/pages/FarmProfilePage'
import { FarmServiceAreasPage } from '../features/farm/pages/FarmServiceAreasPage'
import { FarmServiceRequestsPage } from '../features/farm/pages/FarmServiceRequestsPage'
import { FarmCustomerDeliveryDetailPage } from '../features/farm/pages/FarmCustomerDeliveryDetailPage'
import { FarmStaffDetailPage } from '../features/farm/pages/FarmStaffDetailPage'
import { FarmStaffPage } from '../features/farm/pages/FarmStaffPage'
import { FarmTodayDeliveriesPage } from '../features/farm/pages/FarmTodayDeliveriesPage'
import { PaymentsListPage } from '../features/payments/pages/PaymentsListPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { SupplierDetailPage } from '../features/suppliers/pages/SupplierDetailPage'
import { SuppliersListPage } from '../features/suppliers/pages/SuppliersListPage'
import { AuthProvider } from '../lib/auth/AuthContext'
import { DELIVERY_STAFF_ENABLED } from '../config/featureFlags'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/farm-owner" element={<RegisterFarmOwnerPage />} />
          <Route path="/register/customer" element={<RegisterCustomerPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<CustomerDashboardPage />} />
              <Route path="farms" element={<CustomerFarmsPage />} />
              <Route path="farms/:farmId" element={<CustomerFarmDetailPage />} />
              <Route path="requests" element={<CustomerServiceRequestsPage />} />
              <Route
                path="invitations"
                element={<Navigate to="/customer/requests" replace />}
              />
              <Route path="billing" element={<CustomerBillingPage />} />
              <Route path="addresses" element={<CustomerAddressesPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* TEMP: delivery-staff disabled — restore next update */}
          {DELIVERY_STAFF_ENABLED ? (
            <Route element={<ProtectedRoute roles={['DELIVERY_STAFF']} />}>
              <Route path="/delivery" element={<DeliveryLayout />}>
                <Route index element={<DeliveryDashboardPage />} />
                <Route path="today" element={<DeliveryTodayPage />} />
                <Route path="pending-cash" element={<DeliveryPendingCashPage />} />
                <Route path="customers" element={<DeliveryCustomersPage />} />
                <Route path="profile" element={<DeliveryProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          ) : null}

          <Route element={<ProtectedRoute roles={['PLATFORM_OWNER', 'FARM_OWNER']} />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route element={<ProtectedRoute roles={['PLATFORM_OWNER']} />}>
                <Route path="admin/farms" element={<AdminFarmsPage />} />
                <Route path="admin/farms/:id" element={<AdminFarmDetailPage />} />
                <Route path="suppliers" element={<SuppliersListPage />} />
                <Route path="suppliers/:id" element={<SupplierDetailPage />} />
                <Route path="audit" element={<AuditListPage />} />
              </Route>
              <Route path="customers" element={<CustomersListPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="deliveries" element={<DeliveriesReportPage />} />
              <Route path="billing" element={<BillsListPage />} />
              <Route path="billing/:id" element={<BillDetailPage />} />
              <Route path="payments" element={<PaymentsListPage />} />
              <Route path="reports/outstanding" element={<OutstandingReportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="farm" element={<FarmDashboardPage />} />
              <Route path="farm/profile" element={<FarmProfilePage />} />
              <Route path="farm/service-areas" element={<FarmServiceAreasPage />} />
              <Route path="farm/products" element={<FarmProductsPage />} />
              {/* TEMP: delivery-staff disabled — restore next update */}
              {DELIVERY_STAFF_ENABLED ? (
                <>
                  <Route path="farm/staff" element={<FarmStaffPage />} />
                  <Route path="farm/staff/:staffUserId" element={<FarmStaffDetailPage />} />
                </>
              ) : null}
              <Route path="farm/requests" element={<FarmServiceRequestsPage />} />
              <Route path="farm/invitations" element={<FarmCustomerInvitationsPage />} />
              <Route path="farm/customers" element={<FarmConnectedCustomersPage />} />
              <Route path="farm/today" element={<FarmTodayDeliveriesPage />} />
              <Route path="farm/today/:customerId" element={<FarmCustomerDeliveryDetailPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
