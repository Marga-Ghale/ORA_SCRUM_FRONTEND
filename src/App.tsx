// src/App.tsx - CORRECT FIX

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';

import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import NotFound from './pages/OtherPage/NotFound';
import Calendar from './pages/Calendar';
import AppLayout from './layout/AppLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import setupLocatorUI from '@locator/runtime';

// Project Management Pages
import ProjectBoard from './pages/Board/ProjectBoard';
import Backlog from './pages/Board/Backlog';
import MyTasks from './pages/MyTasks/MyTasks';
import Team from './pages/Team/Team';
import Settings from './pages/Settings/Settings';
import UserProfiles from './pages/UserProfiles';
import { AuthProvider } from './components/UserProfile/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/Protected/ProtectedRoute';
import GuestRoute from './components/Protected/GuestRoute';
import ToastProvider from './components/common/ToastProvider';
import ChatPage from './pages/Chat/ChatPage';
import NotificationPage from './pages/Notification/NotificationPage';
import HomeDashboard from './pages/Dashboard/HomeDashboard';
import MembersManagementPage from './pages/Member/MembersManagementPage';
import ProjectAccessGuard from './components/Protected/ProjectAccessGuard';

if (process.env.NODE_ENV === 'development') {
  setupLocatorUI();
}

// ✅ CORRECT: All providers wrap AppLayout
const ProtectedLayout = () => (
  <ProtectedRoute>
    <SidebarProvider>
      <ProjectProvider>
        <ToastProvider />
        <AppLayout />
      </ProjectProvider>
    </SidebarProvider>
  </ProtectedRoute>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Guest Routes */}
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

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route index element={<HomeDashboard />} />
              <Route path="/dashboard" element={<HomeDashboard />} />
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:channelId" element={<ChatPage />} />
              <Route
                path="/member-management/:entityType/:entityId"
                element={<MembersManagementPage />}
              />
              <Route path="/my-tasks" element={<MyTasks />} />
              <Route
                path="/project/:projectId/board"
                element={
                  <ProjectAccessGuard>
                    <ProjectBoard />
                  </ProjectAccessGuard>
                }
              />
              <Route path="/board" element={<ProjectBoard />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<UserProfiles />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
