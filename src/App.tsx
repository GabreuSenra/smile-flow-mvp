import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Appointments from "./pages/Appointments";
import AppointmentNew from "./pages/AppointmentNew";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import PatientsNew from "./pages/PatientNew";
import Reports from "./pages/Reports";
import Plans from "./pages/Plans";
import SetupClinic from "./pages/SetupClinic";
import NotFound from "./pages/NotFound";
import EditAppointment from "./pages/EditAppointment";
import WhatsAppSettingsPage from "./pages/WhatsAppSettings";
import Settings from "./pages/Settings";
import TreatmentTypes from "./pages/TreatmentTypes";
import PaymentSuccess from "./pages/PaymentSuccess";
import BookAppointment from "./pages/BookAppointment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/agendar-consulta/:id" element={<BookAppointment />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/new"
              element={
                <ProtectedRoute>
                  <PatientsNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <ProtectedRoute>
                  <AppointmentNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <Plans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup-clinic"
              element={
                <ProtectedRoute>
                  <SetupClinic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/:id/edit"
              element={
                <ProtectedRoute>
                  <EditAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/whats-settings"
              element={
                <ProtectedRoute>
                  <WhatsAppSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/treatment-types"
              element={
                <ProtectedRoute>
                  <TreatmentTypes/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
