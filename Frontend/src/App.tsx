import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeController from "@/controllers/HomeController";
import NotFoundController from "@/controllers/NotFoundController";
import DomesticController from "@/controllers/DomesticController";
import GlobalController from "@/controllers/GlobalController";
import DashboardController from "@/controllers/DashboardController";
import SignInController from "@/controllers/SignInController";
import SignUpController from "@/controllers/SignUpController";
import ForgotPasswordController from "@/controllers/ForgotPasswordController";
import ResetPasswordController from "@/controllers/ResetPasswordController";
import ProtectedRoute from "@/controllers/ProtectedRoute";
import { AuthProvider } from "@/controllers/AuthContext";
import MarketsView from "@/views/MarketsView";
import EducationView from "@/views/EducationView";
import TeamView from "@/views/TeamView";
import BlogsView from "@/views/BlogsView";
import BlogDetailView from "./views/BlogDetailView";
import ScrollToTop from "@/controllers/ScrollToTop";
import PaymentSuccess from "./components/PaymentSuccess";
import GlobalToastListener from "./components/GlobalToastListener";
import TermsOfService from "./views/Termsofservice";
import HelpCenter from "./views/Helpcenter";
import PrivacyPolicy from "./views/Privacypolicy";
import ChartPage from "./components/Chartpage";
import IPOSection from "./views/Iposection";
import IPOPage from "./views/Ipopage";
import { ThemeProvider } from "@/controllers/Themecontext";
import PricingPlan from "./views/Pricingplan";
import CurrencyView from "./views/Currencyview";
import DecodeMarketsPage from "./components/DecodeMarketsPage";

// ── Commodities & ETFs ────────────────────────────────────────────────────────
import CommoditiesView from "@/views/Commoditiesview";
import AdminDashboard from "./components/Admindashboard";
import CheckoutPage from "./components/Checkoutpage";
import EventsView from "./views/Eventsview";

// ── Education sub-pages (NEW) ─────────────────────────────────────────────────
import EducationDetailView from "@/views/Educationdetailview";


const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalToastListener />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<HomeController />} />
              <Route path="/domestic" element={<DomesticController />} />
              <Route path="/global" element={<GlobalController />} />

              {/* /markets → Full Commodities & ETFs view */}
              <Route path="/markets" element={<CommoditiesView />} />
              <Route path="/markets-old" element={<MarketsView />} />

              <Route path="/currency" element={<CurrencyView />} />
              <Route path="/pricing" element={<PricingPlan />} />
              <Route path="/chart/:symbol" element={<ChartPage />} />

              {/* ── Education routes ─────────────────────────────────── */}
              <Route path="/education" element={<EducationView />} />
              
              {/* "Start Learning" detail page */}
              <Route path="/education/:categoryId" element={<EducationDetailView />} />

              <Route path="/team" element={<TeamView />} />
              <Route path="/blogs" element={<BlogsView />} />
              <Route path="/blogs/:id" element={<BlogDetailView />} />
              <Route path="/paymentsuccess" element={<PaymentSuccess />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/ipo-section" element={<IPOSection />} />
              <Route path="/ipos" element={<IPOPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordController />} />
              <Route path="/reset-password" element={<ResetPasswordController />} />
              <Route path="/insights/:tab" element={<DecodeMarketsPage />} />
              <Route path="/events" element={<EventsView />} />
              <Route path="/plans/:planId/checkout" element={<CheckoutPage />} />
              <Route path={import.meta.env.VITE_ADMIN_ROUTE || "/x7-panel"} element={<AdminDashboard />} />
              <Route path="/signin" element={<SignInController />} />
              <Route path="/signup" element={<SignUpController />} />
              <Route path="*" element={<NotFoundController />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;