
import React, { useState, useMemo, useEffect } from "react";
import { Box, CssBaseline, ThemeProvider, createTheme, Toolbar, useMediaQuery } from "@mui/material";
import { Outlet } from 'react-router-dom';
import FreelancerSidebar from "../freelancer_components/sidebar/FreelancerSidebar";
import FreelancerNavbar from "../freelancer_components/navbar/FreelancerNavbar";
import NotificationSidebar from "../notifications/features/notifications/components/NotificationSidebar";
import { getNotifications } from "../notifications/features/notifications/services/notificationService";
import { useUser } from "../context/UserContext"; 
import { useTheme } from "../context/ThemeContext";

const drawerWidth = 260; 

export default function FreelancerLayout({ children }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1200;
  });
  const { loading } = useUser();
  const { theme: currentMode } = useTheme(); 

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await getNotifications();
        const payload = res.data?.results || res.data || [];
        if (!mounted) return;
        setNotifications(payload);
      } catch (err) {
        console.error("Failed to load notifications for navbar", err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: currentMode,
      primary: { main: "#1b4332", light: "#2d6a4f" },
      secondary: { main: "#4ade80", contrastText: "#1b4332" },
      background: {
        default: currentMode === 'light' ? "#f3f4f6" : "#0f172a", 
        paper:   currentMode === 'light' ? "#ffffff" : "#1e293b", 
      },
      text: {
        primary: currentMode === 'light' ? "#1f2937" : "#f8fafc", 
        secondary: currentMode === 'light' ? "#6b7280" : "#94a3b8", 
      },
      success: { main: "#22c55e" }, 
      error: { main: "#ef4444" },   
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 500 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: currentMode === 'light' ? "rgba(255, 255, 255, 0.8)" : "rgba(30, 41, 59, 0.8)", 
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid",
            borderColor: currentMode === 'light' ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
            color: currentMode === 'light' ? "#1f2937" : "#f8fafc",
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: "16px", 
            boxShadow: currentMode === 'light' ? "0px 2px 4px rgba(0,0,0,0.05)" : "0px 4px 6px rgba(0,0,0,0.2)", 
            border: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: "8px", textTransform: "none", fontWeight: 600 },
        },
      },
    },
  }), [currentMode]);

  const isDesktop = useMediaQuery(muiTheme.breakpoints.up('lg'));

  useEffect(() => {
    setIsSidebarOpen((prev) => (prev === isDesktop ? prev : isDesktop));
  }, [isDesktop]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <span>Loading...</span>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default', overflow: 'hidden' }}>
        
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* Sidebar */}
        {isDesktop && (
          <Box
            className="hide-scrollbar"
            sx={{
              width: isSidebarOpen ? `${drawerWidth}px` : '0px',
              minWidth: isSidebarOpen ? `${drawerWidth}px` : '0px',
              transition: 'width 0.3s ease',
              height: '100%',
              overflowY: 'auto',
              borderRight: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
              bgcolor: 'background.paper'
            }}
          >
            {isSidebarOpen && (
              <FreelancerSidebar
                width={drawerWidth}
                open={isSidebarOpen}
                onClose={toggleSidebar}
              />
            )}
          </Box>
        )}

        {!isDesktop && (
          <FreelancerSidebar
            width={drawerWidth}
            open={isSidebarOpen}
            onClose={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            transition: 'margin 0.3s ease, width 0.3s ease',
          }}
        >
          <FreelancerNavbar 
            onNotificationClick={() => setIsNotifOpen(true)} 
            onSidebarToggle={toggleSidebar}
            sidebarOpen={isSidebarOpen}
            notifications={notifications}
            sidebarWidth={drawerWidth}
            isDesktop={isDesktop}
          />

          <Box 
            component="main" 
            className="hide-scrollbar"
            sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}
          >
            <Toolbar sx={{ mb: { xs: 2, md: 3 } }} />

            <Box
              sx={{
                width: '100%',
                mx: 0,
                px: { xs: 1.5, sm: 2, md: 3 },
                pb: { xs: 4, md: 6 },
                boxSizing: 'border-box',
                flex: 1,
                maxWidth: '100%',
              }}
            >
              <Outlet context={{ setNotifications }} />
            </Box>
          </Box>
        </Box>

        <NotificationSidebar isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} onItemsChange={setNotifications} />
      </Box>
    </ThemeProvider>
  );
}