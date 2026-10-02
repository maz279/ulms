import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ulmsTheme } from './theme/ulmsTheme';
import './assets/css/tokens.css';
import './assets/css/app.css';

import { AppShell } from './shell/AppShell';

// API-backed feature pages (e2e-verified selectors preserved)
import { CustomerPage } from './features/customer/CustomerPage';
import { Customer360Page } from './features/customer/Customer360Page';
import { ApplyPage } from './features/origination/ApplyPage';
import { PipelinePage } from './features/origination/PipelinePage';
import { ClassificationBoardPage } from './features/compliance/ClassificationBoardPage';
import { RegconPage } from './features/compliance/RegconPage';
import { ReportViewerPage as ComplianceReportPage } from './features/compliance/ReportViewerPage';
import { LoanDetailPage } from './features/servicing/LoanDetailPage';
import { CollectionsPage } from './features/collections/CollectionsPage';
import { PortalPage } from './features/portal/PortalPage';

// Prototype-faithful pages (Front_end UX contract) — lazy chunks (audit R1:
// route-level code splitting keeps the MUI core bundle lean)
import { ErrorBoundary } from './app/ErrorBoundary';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
const HomePage = React.lazy(() => import('./features/proto/InsightPages').then(m => ({ default: m.HomePage })));
const AnalyticsPage = React.lazy(() => import('./features/proto/InsightPages').then(m => ({ default: m.AnalyticsPage })));
const WorkspacePage = React.lazy(() => import('./features/proto/WorkspacePages').then(m => ({ default: m.WorkspacePage })));
const FregPage = React.lazy(() => import('./features/proto/WorkspacePages').then(m => ({ default: m.FregPage })));
const ScreenPage = React.lazy(() => import('./features/proto/ScreenPages').then(m => ({ default: m.ScreenPage })));
const RecordPage = React.lazy(() => import('./features/proto/ScreenPages').then(m => ({ default: m.RecordPage })));
const FormHostPage = React.lazy(() => import('./features/proto/ScreenPages').then(m => ({ default: m.FormHostPage })));
const MissingPage = React.lazy(() => import('./features/proto/ScreenPages').then(m => ({ default: m.MissingPage })));
const CibPage = React.lazy(() => import('./features/proto/CibPage').then(m => ({ default: m.CibPage })));
const ApprovalsPage = React.lazy(() => import('./features/proto/OriginationPages').then(m => ({ default: m.ApprovalsPage })));
const DisbursePage = React.lazy(() => import('./features/proto/OriginationPages').then(m => ({ default: m.DisbursePage })));
const ReportsPage = React.lazy(() => import('./features/proto/ReportPages').then(m => ({ default: m.ReportsPage })));
const ReportViewerPage = React.lazy(() => import('./features/proto/ReportPages').then(m => ({ default: m.ReportViewerPage })));
const WriterPage = React.lazy(() => import('./features/proto/ReportPages').then(m => ({ default: m.WriterPage })));
const AuditPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.AuditPage })));
const SettingsPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.SettingsPage })));
const DesignPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.DesignPage })));
const CoveragePage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.CoveragePage })));
const DirectoryPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.DirectoryPage })));
const SearchPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.SearchPage })));
const ShortcutsPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.ShortcutsPage })));
const NotificationsPage = React.lazy(() => import('./features/proto/SystemPages').then(m => ({ default: m.NotificationsPage })));

// R3/R4/R5 live pages (lazy chunk)
const ProductsPage = React.lazy(() => import('./features/proto/R3R4Pages').then(m => ({ default: m.ProductsPage })));
const SanctionsPage = React.lazy(() => import('./features/proto/R3R4Pages').then(m => ({ default: m.SanctionsPage })));
const BoccPage = React.lazy(() => import('./features/proto/R3R4Pages').then(m => ({ default: m.BoccPage })));
const WriteOffPage = React.lazy(() => import('./features/proto/R3R4Pages').then(m => ({ default: m.WriteOffPage })));
const NotificationsAdminPage = React.lazy(() => import('./features/proto/R3R4Pages').then(m => ({ default: m.NotificationsPage })));
const OutboxPage = React.lazy(() => import('./features/proto/R3R4Pages').then(m => ({ default: m.OutboxPage })));

/** Route guard — staff routes need a session; /login and /portal (borrower)
 *  stay public. Renders inside AuthProvider so gating is session-aware. */
function StaffGate({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <ThemeProvider theme={ulmsTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<StaffGate><AppShell /></StaffGate>}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />

            {/* generic prototype engine */}
            <Route path="/workspace/:mid" element={<WorkspacePage />} />
            <Route path="/screen/:sid" element={<ScreenPage />} />
            <Route path="/record/:sid/:rid" element={<RecordPage />} />
            <Route path="/freg/:mid" element={<FregPage />} />
            <Route path="/form/:mid/:name" element={<FormHostPage />} />

            {/* origination (API-backed) */}
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />

            {/* customer (API-backed; prototype route aliases) */}
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/customer/:cif" element={<Customer360Page />} />
            <Route path="/cust/:cif" element={<Customer360Page />} />
            <Route path="/cib/:cif" element={<CibPage />} />

            {/* approval + disbursement */}
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/disburse" element={<DisbursePage />} />

            {/* servicing (API-backed; prototype alias /loan) */}
            <Route path="/loans/:id" element={<LoanDetailPage />} />
            <Route path="/loan/:id" element={<LoanDetailPage />} />

            {/* collections + monitoring (API-backed) */}
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/classification" element={<ClassificationBoardPage />} />
            <Route path="/compliance/board" element={<Navigate to="/classification" replace />} />

            {/* insight + compliance */}
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/regcon" element={<RegconPage />} />
            <Route path="/compliance/regcon" element={<Navigate to="/regcon" replace />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:mid" element={<ReportsPage />} />
            <Route path="/compliance/reports" element={<ComplianceReportPage />} />
            <Route path="/report/:mid/:idx" element={<ReportViewerPage />} />
            <Route path="/writer" element={<WriterPage />} />

            {/* platform + system */}
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/designsystem" element={<DesignPage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/shortcuts" element={<ShortcutsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* R3/R4/R5 live pages (lazy chunk) */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/sanctions" element={<SanctionsPage />} />
            <Route path="/bocc" element={<BoccPage />} />
            <Route path="/writeoffs" element={<WriteOffPage />} />
            <Route path="/notifications-admin" element={<NotificationsAdminPage />} />
            <Route path="/outbox" element={<OutboxPage />} />

            <Route path="*" element={<MissingPage />} />
          </Route>
          {/* borrower portal renders without the staff chrome */}
          <Route path="/portal" element={<PortalPage />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
