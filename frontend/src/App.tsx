import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { StudentLayout } from "@/components/layout/student-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { RequireAdmin, RequireStudent } from "@/components/protected";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import StudentLoginPage from "@/pages/login";
import AdminLoginPage from "@/pages/admin-login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import DashboardPage from "@/pages/dashboard";
import VotePage from "@/pages/vote";
import ResultsPage from "@/pages/results";
import ProfilePage from "@/pages/profile";
import ApplyCandidatePage from "@/pages/apply-candidate";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminPollsPage from "@/pages/admin/polls";
import AdminCreatePollPage from "@/pages/admin/create-poll";
import AdminUsersPage from "@/pages/admin/users";
import AdminCandidatesPage from "@/pages/admin/candidates";
import AdminReportsPage from "@/pages/admin/reports";
import AdminAuditPage from "@/pages/admin/audit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function studentPage<T>(Page: React.ComponentType<T>) {
  return function Wrapped(props: T) {
    return (
      <StudentLayout>
        <RequireStudent>
          <Page {...(props as any)} />
        </RequireStudent>
      </StudentLayout>
    );
  };
}

function adminPage<T>(Page: React.ComponentType<T>) {
  return function Wrapped(props: T) {
    return (
      <AdminLayout>
        <RequireAdmin>
          <Page {...(props as any)} />
        </RequireAdmin>
      </AdminLayout>
    );
  };
}

const Dashboard = studentPage(DashboardPage);
const Vote = studentPage(VotePage);
const Results = studentPage(ResultsPage);
const Profile = studentPage(ProfilePage);
const Apply = studentPage(ApplyCandidatePage);

const AdminDash = adminPage(AdminDashboardPage);
const AdminPolls = adminPage(AdminPollsPage);
const AdminCreate = adminPage(AdminCreatePollPage);
const AdminUsers = adminPage(AdminUsersPage);
const AdminCandidates = adminPage(AdminCandidatesPage);
const AdminReports = adminPage(AdminReportsPage);
const AdminAudit = adminPage(AdminAuditPage);

function PublicHome() {
  return (
    <StudentLayout>
      <HomePage />
    </StudentLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicHome} />
      <Route path="/login" component={StudentLoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/admin/login" component={AdminLoginPage} />

      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vote/:pollId" component={Vote} />
      <Route path="/results/:pollId" component={Results} />
      <Route path="/profile" component={Profile} />
      <Route path="/candidates/apply" component={Apply} />

      <Route path="/admin/dashboard" component={AdminDash} />
      <Route path="/admin/polls" component={AdminPolls} />
      <Route path="/admin/create-poll" component={AdminCreate} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/candidates" component={AdminCandidates} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/audit" component={AdminAudit} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base="/">
            <Router />
          </WouterRouter>
          <ShadcnToaster />
          <SonnerToaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
