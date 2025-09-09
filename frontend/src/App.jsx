import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerPortal from './pages/CustomerPortal';
import ProtectedRoute from './components/ProtectedRoute';
// Novas páginas
import VehiclesPage from './pages/VehiclesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FAQPage from './pages/FAQPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CancelPolicyPage from './pages/CancelPolicyPage';
import LocationsPage from './pages/LocationsPage';
import OffersPage from './pages/OffersPage';
import MaintenancePage from './pages/MaintenancePage';
import UserReservationsPage from './pages/UserReservationsPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';
import PaymentsHistoryPage from './pages/PaymentsHistoryPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import GroupsPage from './pages/GroupsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import NotFoundPage from './pages/NotFoundPage';
import PlansPage from './pages/PlansPage';
import ServerErrorPage from './pages/ServerErrorPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PricingPage from './pages/PricingPage';
import ProtectionsPage from './pages/ProtectionsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import BusinessPage from './pages/BusinessPage';
import MonthlyRentalsPage from './pages/MonthlyRentalsPage';
import NewsPage from './pages/NewsPage';
import AccountPage from './pages/AccountPage';
import HistoryPage from './pages/HistoryPage';
import RefundsPage from './pages/RefundsPage';
import LoyaltyPortalPage from './pages/LoyaltyPortalPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="buscar" element={<SearchResultsPage />} />
          <Route path="como-funciona" element={<HowItWorksPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="cancelamento" element={<CancelPolicyPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="groups" element={<GroupsPage />} />
          {/* Alias em pt-br para a página de grupos */}
          <Route path="grupos-de-carros" element={<GroupsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="500" element={<ServerErrorPage />} />
          <Route
            path="portal"
            element={
              <ProtectedRoute>
                <CustomerPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="portal/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="portal/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="portal/refunds"
            element={
              <ProtectedRoute>
                <RefundsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="portal/loyalty"
            element={
              <ProtectedRoute>
                <LoyaltyPortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reservation/:id"
            element={
              <ProtectedRoute>
                <ReservationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reservations"
            element={
              <ProtectedRoute>
                <UserReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payments"
            element={
              <ProtectedRoute>
                <PaymentsHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          {/* novas rotas */}
          <Route path="assinatura" element={<SubscriptionPage />} />
          <Route path="quanto-custa" element={<PricingPage />} />
          <Route path="protecoes" element={<ProtectionsPage />} />
          <Route path="fidelidade" element={<LoyaltyPage />} />
          <Route path="empresas" element={<BusinessPage />} />
          <Route path="aluguel-mensal" element={<MonthlyRentalsPage />} />
          <Route path="news" element={<NewsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
