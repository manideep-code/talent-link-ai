
import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Outlet } from 'react-router-dom';
import ClientSidebar from '../freelancer_components/sidebar/ClientSidebar';
import ClientNavbar from '../freelancer_components/navbar/ClientNavbar';
import NotificationSidebar from '../notifications/features/notifications/components/NotificationSidebar';
import { getNotifications } from '../notifications/features/notifications/services/notificationService';
import '../App.css';

// 1. Import Material UI & Theme Context
import { Box, CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const ClientLayout = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1200;
  });
  const sidebarWidth = 260;
  
  const { loading } = useUser();
  
  // 2. Get Current Theme Mode
  const { theme: currentMode } = useTheme();

  // 3. Create Dynamic Theme (Matches Freelancer Logic)
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: currentMode,
      primary: {
        main: "#1b4332", 
        light: "#2d6a4f",
      },
      secondary: {
        main: "#4ade80", 
        contrastText: "#1b4332",
      },
      // --- DYNAMIC COLORS ---
      background: {
        default: currentMode === 'light' ? "#f3f4f8" : "#0f172a", // Light Grey vs Dark Slate
        paper:   currentMode === 'light' ? "#ffffff" : "#1e293b", // White vs Slate 800
      },
      text: {
        primary: currentMode === 'light' ? "#1f2937" : "#f8fafc", 
        secondary: currentMode === 'light' ? "#6b7280" : "#94a3b8", 
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: currentMode === 'light' ? "rgba(255, 255, 255, 0.8)" : "rgba(30, 41, 59, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid",
            borderColor: "divider",
            color: "text.primary",
          }
        }
      }
    }
  }), [currentMode]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
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
        console.error('Failed to load notifications for navbar', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

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
    // 4. Wrap everything in ThemeProvider
    <ThemeProvider theme={muiTheme}>
      <CssBaseline /> {/* Resets CSS to match Dark/Light mode */}
      
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default', overflow: 'hidden' }}>
        
        {/* --- CSS TO HIDE SCROLLBAR --- */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* 1. Sidebar Wrapper */}
        {isDesktop && (
          <Box
            className="hide-scrollbar"
            sx={{
              width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
              minWidth: isSidebarOpen ? `${sidebarWidth}px` : '0px',
              transition: 'width 0.3s ease',
              height: '100%',
              overflowY: 'auto',
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            {isSidebarOpen && (
              <ClientSidebar
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                onClose={toggleSidebar}
              />
            )}
          </Box>
        )}

        {/* 2. Main Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            transition: 'margin 0.3s ease, width 0.3s ease',
          }}
        >
          <ClientNavbar
            onNotificationClick={() => setIsNotifOpen(true)}
            onSidebarToggle={toggleSidebar}
            sidebarOpen={isSidebarOpen}
            notifications={notifications}
            isDesktop={isDesktop}
          />
          
          {/* Content Area */}
          <Box 
            className="hide-scrollbar"
            sx={{
              flex: 1,
              overflowY: 'auto',
              padding: 0,
            }}
          >
              <Outlet context={{ setNotifications }} /> 
          </Box>
        </Box>

        <NotificationSidebar 
          isOpen={isNotifOpen} 
          onClose={() => setIsNotifOpen(false)} 
          onItemsChange={setNotifications}
        />
      </Box>

      {!isDesktop && (
        <ClientSidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          onClose={toggleSidebar}
        />
      )}
    </ThemeProvider>
  );
};

export default ClientLayout;