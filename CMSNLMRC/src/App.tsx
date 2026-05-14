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
import Login from "./pages/Login";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import RegisterClient from "./pages/RegisterClient";
import Aftercare from "./pages/Aftercare";
import AddAftercareRecord from "./pages/AddAftercareRecord";
import HomeVisits from "./pages/HomeVisits";
import AddHomeVisit from "./pages/AddHomeVisit";
import ClientHomeVisits from "./pages/ClientHomeVisits";
import Education from "./pages/Education";
import Counselling from "./pages/Counselling";
import Empowerment from "./pages/Empowerment";
import ManageUsers from "./pages/ManageUsers";
import Alumni from "./pages/Alumni";
import HouseKeeping from "./pages/HouseKeeping";
import Finance from "./pages/Finance";
import Agriculture from "./pages/Agriculture";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
                      <AppSidebar />
                      <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
                        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                          <div className="flex h-14 items-center px-4">
                            <SidebarTrigger className="-ml-1" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/clients/:id" element={<ClientDetails />} />
                            <Route path="/register" element={<RegisterClient />} />
                            <Route path="/aftercare" element={<Aftercare />} />
                            <Route path="/aftercare/add/:clientId" element={<AddAftercareRecord />} />
                            <Route path="/home-visits" element={<HomeVisits />} />
                            <Route path="/home-visits/add" element={<AddHomeVisit />} />
                            <Route path="/home-visits/client/:clientId" element={<ClientHomeVisits />} />
                            <Route path="/education" element={<Education />} />
                            <Route path="/counselling" element={<Counselling />} />
                            <Route path="/empowerment" element={<Empowerment />} />
                            <Route path="/housekeeping" element={<HouseKeeping />} />
                            <Route path="/finance" element={<Finance />} />
                            <Route path="/agriculture" element={<Agriculture />} />
                            <Route path="/users" element={<ManageUsers />} />
                            <Route path="/alumni" element={<Alumni />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                        <Footer />
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
