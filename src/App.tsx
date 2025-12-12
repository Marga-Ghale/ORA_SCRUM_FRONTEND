import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";


import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Calendar from "./pages/Calendar";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import setupLocatorUI from "@locator/runtime";

// Project Management Pages
import ProjectDashboard from "./pages/Dashboard/ProjectDashboard";
import ProjectBoard from "./pages/Board/ProjectBoard";
import Backlog from "./pages/Board/Backlog";
import MyTasks from "./pages/MyTasks/MyTasks";
import Team from "./pages/Team/Team";
import Settings from "./pages/Settings/Settings";
import UserProfiles from "./pages/UserProfiles";
import { AuthProvider } from "./components/UserProfile/AuthContext";
import ProtectedRoute from "./components/Protected/ProtectedRoute";
import GuestRoute from "./components/Protected/GuestRoute";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Protected Routes with Dashboard Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Main Pages */}
              <Route index path="/" element={<ProjectDashboard />} />
              <Route path="/dashboard" element={<ProjectDashboard />} />
              <Route path="/my-tasks" element={<MyTasks />} />

              {/* Project Board Views */}
              <Route path="/project/:projectId/board" element={<ProjectBoard />} />
              <Route path="/board" element={<ProjectBoard />} />
              <Route path="/backlog" element={<Backlog />} />

              {/* Calendar */}
              <Route path="/calendar" element={<Calendar />} />

              {/* Team & Settings */}
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />

              {/* User Profile */}
              <Route path="/profile" element={<UserProfiles />} />
            </Route>

            {/* Guest Only Routes (redirect to dashboard if logged in) */}
            <Route
              path="/signin"
              element={
                <GuestRoute>
                  <SignIn />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <SignUp />
                </GuestRoute>
              }
            />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}