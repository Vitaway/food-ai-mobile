import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AppShell } from '@/components/layout/AppShell';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { GuestRoute, ProtectedRoute } from '@/features/auth';
import { AdminRoute } from '@/features/admin/components/AdminRoute';
import { AdminShell } from '@/features/admin/components/AdminShell';
import { OverviewPage, QueuePage, MealReviewPage, ProfilePage, ClientsPage, ClientDetailPage, TeamPage, PastReviewsPage, PastReviewDetailPage, MessagesPage, NutritionDbPage, ReportsPage } from '@/pages/coach';
import {
  AdminOverviewPage,
  AdminCoachesPage,
  AdminUsersPage,
  AdminSystemPage,
  AdminPaymentsPage,
  AdminReportsPage,
  AdminReferralsPage,
  AdminFoodDbPage,
} from '@/pages/admin';
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/auth';
import {
  ConsumerOverviewPage,
  ConsumerMealsPage,
  ConsumerMealDetailPage,
  ConsumerProfilePage,
} from '@/pages/consumer';
import { ConsumerRoute } from '@/features/consumer/components/ConsumerRoute';
import { ConsumerShell } from '@/features/consumer/components/ConsumerShell';
import { HomePage } from '@/pages/marketing/HomePage';
import { FeaturesPage } from '@/pages/marketing/FeaturesPage';
import { ForCoachesPage } from '@/pages/marketing/ForCoachesPage';
import { ForPatientsPage } from '@/pages/marketing/ForPatientsPage';
import { ForClinicsPage } from '@/pages/marketing/ForClinicsPage';
import { ClinicalEvidencePage } from '@/pages/marketing/ClinicalEvidencePage';
import { PrivacyPage } from '@/pages/marketing/PrivacyPage';
import { TermsPage } from '@/pages/marketing/TermsPage';
import { SupportPage } from '@/pages/marketing/SupportPage';
import { DeleteAccountPage } from '@/pages/marketing/DeleteAccountPage';
import { DownloadPage } from '@/pages/marketing/DownloadPage';
import { LegalPage } from '@/pages/marketing/LegalPage';
import { CookiePolicyPage } from '@/pages/marketing/CookiePolicyPage';
import { MedicalDisclaimerPage } from '@/pages/marketing/MedicalDisclaimerPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public marketing site */}
        <Route element={<MarketingShell />}>
          <Route index element={<HomePage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="download" element={<DownloadPage />} />
          <Route path="for-coaches" element={<ForCoachesPage />} />
          <Route path="for-patients" element={<ForPatientsPage />} />
          <Route path="for-clinics" element={<ForClinicsPage />} />
          <Route path="clinical-evidence" element={<ClinicalEvidencePage />} />
          <Route path="legal" element={<LegalPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="medical-disclaimer" element={<MedicalDisclaimerPage />} />
          <Route path="cookie-policy" element={<CookiePolicyPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="delete-account" element={<DeleteAccountPage />} />
        </Route>

        {/* Unified sign-in */}
        <Route
          path="login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="coach/login" element={<Navigate to="/login" replace />} />
        <Route path="admin/login" element={<Navigate to="/login" replace />} />
        <Route path="coach/forgot-password" element={<Navigate to="/forgot-password" replace />} />

        {/* Coach dashboard */}
        <Route
          path="coach"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
          <Route index element={<OverviewPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="queue/:id" element={<MealReviewPage />} />
          <Route path="history" element={<PastReviewsPage />} />
          <Route path="history/:id" element={<PastReviewDetailPage />} />
          <Route path="reviews" element={<Navigate to="/coach/history" replace />} />
          <Route path="reviews/:id" element={<PastReviewDetailPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:id" element={<MessagesPage />} />
          <Route path="nutrition-db" element={<NutritionDbPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/coach" replace />} />
        </Route>

        {/* Platform admin */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminShell />
            </AdminRoute>
          }>
          <Route index element={<AdminOverviewPage />} />
          <Route path="coaches" element={<AdminCoachesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="food-db" element={<AdminFoodDbPage />} />
          <Route path="referrals" element={<AdminReferralsPage />} />
          <Route path="system" element={<AdminSystemPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Consumer app */}
        <Route
          path="app"
          element={
            <ConsumerRoute>
              <ConsumerShell />
            </ConsumerRoute>
          }>
          <Route index element={<ConsumerOverviewPage />} />
          <Route path="meals" element={<ConsumerMealsPage />} />
          <Route path="meals/:id" element={<ConsumerMealDetailPage />} />
          <Route path="profile" element={<ConsumerProfilePage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
