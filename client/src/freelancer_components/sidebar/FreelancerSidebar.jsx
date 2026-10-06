


import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Badge,
  Button,
  useMediaQuery,
  useTheme
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, useLocation } from "react-router-dom"; 
import { performLogout } from "../../utils/logout";

// Icons
import DashboardIcon from "@mui/icons-material/DashboardRounded";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongRounded";
import WorkIcon from "@mui/icons-material/WorkRounded"; 
import DescriptionIcon from "@mui/icons-material/DescriptionRounded"; 
import PeopleIcon from "@mui/icons-material/PeopleRounded";
import SettingsIcon from "@mui/icons-material/SettingsRounded";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'; 
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/freelancer" },
  { text: "Projects", icon: <WorkIcon />, path: "/freelancer/projects" }, 
  { text: "Proposals", icon: <DriveFileRenameOutlineIcon />, path: "/freelancer/proposals" }, 
  { text: "Clients", icon: <PeopleIcon />, path: "/freelancer/clients" },
  { text: "Accounting", icon: <AccountBalanceWalletIcon />, path: "/freelancer/accounting" },
  { text: "Expenses", icon: <ReceiptLongIcon />, path: "/freelancer/expenses" },
  { text: "Contracts", icon: <DescriptionIcon />, path: "/freelancer/contracts" },
  { text: "Messages", icon: <ChatBubbleOutlineIcon />, path: "/freelancer/messages" },
];

const preferenceItems = [
  { text: "Settings", icon: <SettingsIcon />, path: "/freelancer/settings" },
  { text: "Help Center", icon: <HelpOutlineIcon />, path: "/freelancer/help" },
];

export default function FreelancerSidebar({ width = 260, open = true, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sidebarBg = '#0a1f44'; 
  const activeBg = "#3b82f6";   
  const activeText = "#ffffff"; 
  const inactiveText = "#94a3b8"; 

  const handleNavigate = (path) => {
    navigate(path);
    if (variant === 'temporary' && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleLogout = async () => {
    await performLogout();
    navigate('/login');
    if (variant === 'temporary' && typeof onClose === 'function') {
      onClose();
    }
  };

  // For mobile screens use a temporary Drawer so it overlays content and can be closed.
  const variant = isMobile ? 'temporary' : 'permanent';

  // If it's a permanent drawer and closed, don't render
  if (variant === 'permanent' && !open) return null;

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          bgcolor: sidebarBg,
          color: "white",
          borderRight: "none",
          // --- HIDE SCROLLBAR IN MUI DRAWER ---
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          // For temporary drawers on mobile, ensure high zIndex
          ...(isMobile && { zIndex: theme => theme.zIndex.drawer + 2 }),
        },
      }}
    >
      <Box sx={{ p: 3.5, pb: 3, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: "rgba(59,130,246,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: activeBg }}>
              TL
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Talent Link</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", letterSpacing: 0.3 }}>
              FREELANCER PORTAL
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 2, pt: 2 }}>
        <Typography variant="caption" sx={{ color: "#64748b", px: 2, letterSpacing: 1, fontWeight: 600 }}>
          MENU
        </Typography>
        <Box sx={{ mt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavigate(item.path)} 
              selected={isActive} 
              sx={{
                borderRadius: 2,
                mb: 1,
                transition: "all 0.2s ease-in-out",
                
                "&.Mui-selected": {
                  bgcolor: "rgba(59,130,246,0.15)",
                  color: activeText,
                  borderLeft: "4px solid #3b82f6",
                  pl: 1.5,
                  "&:hover": { bgcolor: "rgba(59,130,246,0.2)" },
                  "& .MuiListItemIcon-root": { color: activeText },
                  "& .MuiListItemText-primary": { fontWeight: 600 },
                },
                
                "&:not(.Mui-selected)": {
                  color: inactiveText,
                  "&:hover": { 
                    bgcolor: "rgba(255,255,255,0.05)", 
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "white" }
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              
              {item.badge && (
                <Badge 
                  badgeContent={item.badge} 
                  sx={{ 
                    "& .MuiBadge-badge": { 
                      bgcolor: isActive ? "white" : activeBg, 
                      color: isActive ? activeBg : "white",
                      fontWeight: "bold" 
                    } 
                  }} 
                />
              )}
            </ListItemButton>
          );
        })}
      </Box>

      <Typography variant="caption" sx={{ color: "#64748b", px: 2, letterSpacing: 1, fontWeight: 600, mt: 3 }}>
        PREFERENCES
      </Typography>
      <Box sx={{ mt: 1 }}>
        {preferenceItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavigate(item.path)}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 1,
                transition: "all 0.2s ease-in-out",

                "&.Mui-selected": {
                  bgcolor: "rgba(59,130,246,0.15)",
                  color: activeText,
                  borderLeft: "4px solid #3b82f6",
                  pl: 1.5,
                  "&:hover": { bgcolor: "rgba(59,130,246,0.2)" },
                  "& .MuiListItemIcon-root": { color: activeText },
                  "& .MuiListItemText-primary": { fontWeight: 600 },
                },

                "&:not(.Mui-selected)": {
                  color: inactiveText,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.05)",
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "white" }
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />

              {item.badge && (
                <Badge
                  badgeContent={item.badge}
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: isActive ? "white" : activeBg,
                      color: isActive ? activeBg : "white",
                      fontWeight: "bold"
                    }
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </Box>
      </List>

      <Box sx={{ px: 2, py: 2.5, mt: "auto", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Button
          fullWidth
          variant="text"
          startIcon={<LogoutIcon sx={{ color: '#cbd5e1', mr: 1 }} />}
          onClick={handleLogout}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#cbd5e1',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            justifyContent: 'center',
            gap: 1.5,
            py: 1.2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)'
            },
            border: 'none'
          }}
        >
          Log Out
        </Button>
      </Box>
    </Drawer>
  );
}