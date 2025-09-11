
import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import ReservationsPage from './pages/ReservationsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerEditPage from './pages/CustomerEditPage';
import LoginPage from './pages/LoginPage';
import PaymentsPage from './pages/PaymentsPage';
import BannersPage from './pages/BannersPage';
import ContactAdminPage from './pages/ContactAdminPage';
import LocationsAdminPage from './pages/LocationsAdminPage';
import CouponsAdminPage from './pages/CouponsAdminPage';
import DocumentsAdminPage from './pages/DocumentsAdminPage';
import GroupsAdminPage from './pages/GroupsAdminPage';
import LeadsAdminPage from './pages/LeadsAdminPage';
import ReportsPage from './pages/ReportsPage';
import SettingsAdminPage from './pages/SettingsAdminPage';
import RefundsAdminPage from './pages/RefundsAdminPage';
import PriceRulesAdminPage from './pages/PriceRulesAdminPage';
import UtilizationReportPage from './pages/UtilizationReportPage';

// ErrorBoundary para exibir erros de renderização
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 24 }}>
          <h2>Ocorreu um erro na aplicação Admin</h2>
          <pre>{String(this.state.error)}</pre>
          {this.state.errorInfo && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}


function App() {
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const Protected = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <ErrorBoundary>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Protected><AdminLayout /></Protected>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerEditPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="refunds" element={<RefundsAdminPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="contact" element={<ContactAdminPage />} />
            <Route path="locations" element={<LocationsAdminPage />} />
            <Route path="coupons" element={<CouponsAdminPage />} />
            <Route path="documents" element={<DocumentsAdminPage />} />
            <Route path="groups" element={<GroupsAdminPage />} />
            <Route path="leads" element={<LeadsAdminPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/utilization" element={<UtilizationReportPage />} />
            <Route path="settings" element={<SettingsAdminPage />} />
            <Route path="price-rules" element={<PriceRulesAdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
