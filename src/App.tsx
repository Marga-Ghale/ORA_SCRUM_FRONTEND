import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
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

        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
