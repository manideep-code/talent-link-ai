

import React from "react";
import "./App.css";
import "./assets/global.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* ===== Context Providers ===== */
import { UserProvider } from "./context/UserContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SearchProvider } from "./context/SearchContext";

/* ===== AuthFlow UI Pages ===== */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* ===== Client Dashboard Pages & Layout ===== */
import ClientLayout from "./freelancer_layouts/ClientLayout";
import ClientDashboard from "./freelancer_pages/client/ClientDashboard";
import ClientProjects from "./freelancer_pages/client/ClientProjects";
import ClientFinancials from "./freelancer_pages/client/ClientFinancials";
import ClientContracts from './freelancer_pages/client/ClientContracts';
import JobProposals from "./freelancer_pages/client/JobProposals";
import ClientDocuments from "./freelancer_pages/client/ClientDocuments";
import ClientMessages from "./freelancer_pages/client/ClientMessages";
import ClientSettings from "./freelancer_pages/client/ClientSettings";
import ClientHelp from "./freelancer_pages/client/ClientHelp";
import ClientProfile from "./freelancer_pages/client/ClientProfile";
import EditClientProfile from "./freelancer_pages/client/EditClientProfile";
import Freelancers from "./freelancer_pages/client/Freelancers";

/* ===== Freelancer Dashboard Pages ===== */
import FreelancerDashboard from "./freelancer_pages/freelancer/FreelancerDashboard";
import Projects from "./freelancer_pages/freelancer/Projects";
import ProjectProposal from "./freelancer_pages/freelancer/ProjectProposal";
import FreelancerProposals from "./freelancer_pages/freelancer/FreelancerProposals";
import Accounting from "./freelancer_pages/freelancer/Accounting";
import Expenses from "./freelancer_pages/freelancer/Expenses";
import Inquiry from "./freelancer_pages/freelancer/Inquiry";
import Contracts from "./freelancer_pages/freelancer/FreelancerContracts";
import CalendarPage from "./freelancer_pages/freelancer/CalendarPage";
import Clients from "./freelancer_pages/freelancer/Clients";
import Reports from "./freelancer_pages/freelancer/Reports";
import Settings from "./freelancer_pages/freelancer/FreelancerSettings";
import Profile from "./freelancer_pages/freelancer/Profile";
import EditProfile from "./freelancer_pages/freelancer/EditProfile";
import FreelancerMessages from "./freelancer_pages/freelancer/FreelancerMessages";
import FreelancerLayout from "./freelancer_layouts/FreelancerLayout";
import FreelancerHelp from "./freelancer_pages/freelancer/FreelancerHelp";

/* ===== Notifications ===== */
import NotificationHome from "./notifications/features/notifications/pages/NotificationsPage";
import NotificationItem from "./notifications/features/notifications/components/NotificationItem";

/* ===== Optional 404 Page ===== */
import NotFound from "./freelancer_pages/NotFound";

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ProjectProvider>
          <SearchProvider>
            <Router>
            <Routes>
              {/* ===================== */}
              {/* PUBLIC AUTHFLOW ROUTES */}
              {/* ===================== */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ===================== */}
              {/* CLIENT PORTAL ROUTES */}
              {/* ===================== */}
              {/* Anything inside here gets the Sidebar + Navbar */}
              <Route path="/client" element={<ClientLayout />}>
                <Route index element={<ClientDashboard />} />

                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="projects" element={<ClientProjects />} />
                <Route path="financials" element={<ClientFinancials />} />
                <Route path="contracts" element={<ClientContracts />} />
                <Route path="proposals" element={<JobProposals />} />
                <Route path="freelancers" element={<Freelancers />} />
                <Route path="documents" element={<ClientDocuments />} />
                <Route path="messages" element={<ClientMessages />} />
                <Route path="settings" element={<ClientSettings />} />
                <Route path="help" element={<ClientHelp />} />

                {/* --- MOVED HERE: Now it will have Sidebar & Navbar --- */}
                <Route path="notifications" element={<NotificationHome />} />

                <Route path="profile" element={<ClientProfile />} />
                <Route path="profile/edit" element={<EditClientProfile />} />
              </Route>

              {/* ===================== */}
              {/* FREELANCER ROUTES */}
              {/* ===================== */}
              <Route path="/freelancer" element={<FreelancerLayout />}>
                <Route index element={<FreelancerDashboard />} />
                <Route path="dashboard" element={<FreelancerDashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectProposal />} />
                <Route path="proposals" element={<FreelancerProposals />} />
                <Route path="accounting" element={<Accounting />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="inquiry" element={<Inquiry />} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="clients" element={<Clients />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="messages" element={<FreelancerMessages />} />
                <Route path="notifications" element={<NotificationHome />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                <Route path="help" element={<FreelancerHelp />} />
              </Route>

              {/* ===================== */}
              {/* 404 & Fallbacks */}
              {/* ===================== */}
              {/* Note: I commented out the standalone /notifications since we moved it into /client */}
              {/* <Route path="/notifications" element={<NotificationHome />} /> */}

              <Route path="/notifications/:id" element={<NotificationItem />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" />} />

            </Routes>
            </Router>
          </SearchProvider>
        </ProjectProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;