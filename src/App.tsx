import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Footer from "@/components/Footer";

// Lazy-loaded route components for fast initial load
const Login = lazy(() => import("./pages/Login"));
const Index = lazy(() => import("./pages/Index"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetails = lazy(() => import("./pages/ClientDetails"));
const RegisterClient = lazy(() => import("./pages/RegisterClient"));
const Aftercare = lazy(() => import("./pages/Aftercare"));
const AddAftercareRecord = lazy(() => import("./pages/AddAftercareRecord"));
const ReintegrationPlans = lazy(() => import("./pages/ReintegrationPlans"));
const AddReintegrationPlan = lazy(() => import("./pages/AddReintegrationPlan"));
const ClientReintegrationPlans = lazy(() => import("./pages/ClientReintegrationPlans"));
const Education = lazy(() => import("./pages/Education"));
const Counselling = lazy(() => import("./pages/Counselling"));
const Empowerment = lazy(() => import("./pages/Empowerment"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const Alumni = lazy(() => import("./pages/Alumni"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CasePlans = lazy(() => import("./pages/CasePlans"));
const AddCasePlan = lazy(() => import("./pages/AddCasePlan"));
const CasePlanDetails = lazy(() => import("./pages/CasePlanDetails"));
const AdmissionForm = lazy(() => import("./pages/AdmissionForm"));
const SoapNotes = lazy(() => import("./pages/SoapNotes"));

const PageFallback = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15,    // 15 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full max-w-full">
                        <AppSidebar />
                        <main className="flex-1 w-full max-w-full min-w-0 flex flex-col">
                          <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                            <div className="flex h-14 items-center gap-4 px-4">
                              <SidebarTrigger className="-ml-1" />
                              <span className="font-semibold text-primary md:hidden">CMSNLMRC</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <Suspense fallback={<PageFallback />}>
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/clients" element={<Clients />} />
                                <Route path="/clients/:id" element={<ClientDetails />} />
                                <Route path="/register" element={<RegisterClient />} />
                                <Route path="/case-plans" element={<CasePlans />} />
                                <Route path="/case-plans/add" element={<AddCasePlan />} />
                                <Route path="/case-plans/:id" element={<CasePlanDetails />} />
                                <Route path="/aftercare" element={<Aftercare />} />
                                <Route path="/aftercare/add/:clientId" element={<AddAftercareRecord />} />
                                <Route path="/reintegration-plans/add" element={<AddReintegrationPlan />} />
                                <Route path="/reintegration-plans" element={<ReintegrationPlans />} />
                                <Route path="/reintegration-plans/client/:clientId" element={<ClientReintegrationPlans />} />
                                <Route path="/education" element={<Education />} />
                                <Route path="/counselling" element={<Counselling />} />
                                <Route path="/soap-notes" element={<SoapNotes />} />
                                <Route path="/empowerment" element={<Empowerment />} />
                                <Route path="/users" element={<ManageUsers />} />
                                <Route path="/alumni" element={<Alumni />} />
                                <Route path="/admission" element={<AdmissionForm />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Suspense>
                          </div>
                          <Footer />
                        </main>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
