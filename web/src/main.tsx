import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { GuestRoute, ProtectedRoute } from '@/features/auth';
import { OverviewPage, QueuePage, MealReviewPage, ProfilePage } from '@/pages/coach';
import { LoginPage, ForgotPasswordPage } from '@/pages/auth';
import { HomePage } from '@/pages/marketing/HomePage';
import { FeaturesPage } from '@/pages/marketing/FeaturesPage';
import { ForCoachesPage } from '@/pages/marketing/ForCoachesPage';
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
          <Route path="legal" element={<LegalPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="medical-disclaimer" element={<MedicalDisclaimerPage />} />
          <Route path="cookie-policy" element={<CookiePolicyPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="delete-account" element={<DeleteAccountPage />} />
        </Route>

        {/* Coach auth (guest only) */}
        <Route
          path="coach/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="coach/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />

        {/* Coach dashboard (protected) */}
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
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/coach" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
