import { lazy, Suspense } from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

import DashboardLayout from '../layouts/dashboard';
import ProtectedRoute from '../components/protected-route';
import PublicRoute from '../components/public-route';

const DashboardPage = lazy(() => import('../pages/dashboard'));
const InvoicesPage = lazy(() => import('../pages/invoices'));
const InvoiceDetailPage = lazy(() => import('../pages/invoice-detail'));
const BillsPage = lazy(() => import('../pages/bills'));
const BillDetailPage = lazy(() => import('../pages/bill-detail'));
const ContactsPage = lazy(() => import('../pages/contacts'));
const ContactDetailPage = lazy(() => import('../pages/contact-detail'));
const GeneralSettingsPage = lazy(() => import('../pages/settings/general'));
const ExchangeRatesPage = lazy(() => import('../pages/settings/exchange-rates'));
const DataImportPage = lazy(() => import('../pages/settings/data-import'));
const LoginPage = lazy(() => import('../pages/login'));
const SignupPage = lazy(() => import('../pages/signup'));
const VerifyEmailPage = lazy(() => import('../pages/verify-email'));
const AcceptInvitePage = lazy(() => import('../pages/accept-invite'));
const TeamSettingsPage = lazy(() => import('../pages/settings/team'));

function LoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  );
}

function Lazy({ page: Page }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Page />
    </Suspense>
  );
}

export default function Router() {
  return useRoutes([
    {
      path: '/login',
      element: <PublicRoute><Lazy page={LoginPage} /></PublicRoute>,
    },
    {
      path: '/signup',
      element: <PublicRoute><Lazy page={SignupPage} /></PublicRoute>,
    },
    {
      path: '/verify-email',
      element: <Lazy page={VerifyEmailPage} />,
    },
    {
      path: '/accept-invite/:token',
      element: <Lazy page={AcceptInvitePage} />,
    },
    {
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: '/', element: <Lazy page={DashboardPage} /> },
        { path: '/invoices', element: <Lazy page={InvoicesPage} /> },
        { path: '/invoices/:id', element: <Lazy page={InvoiceDetailPage} /> },
        { path: '/bills', element: <Lazy page={BillsPage} /> },
        { path: '/bills/:id', element: <Lazy page={BillDetailPage} /> },
        { path: '/contacts', element: <Lazy page={ContactsPage} /> },
        { path: '/contacts/:id', element: <Lazy page={ContactDetailPage} /> },
        { path: '/settings/general', element: <Lazy page={GeneralSettingsPage} /> },
        { path: '/settings/exchange-rates', element: <Lazy page={ExchangeRatesPage} /> },
        { path: '/settings/data-import', element: <Lazy page={DataImportPage} /> },
        { path: '/settings/team', element: <Lazy page={TeamSettingsPage} /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
}
