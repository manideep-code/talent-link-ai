import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  AppBar, Toolbar, Box, Avatar, IconButton, Typography, InputBase, Badge, 
  Menu, MenuItem, ListItemIcon, Divider, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, TextField, Stack, Fade, Paper, useTheme as useMuiTheme
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Logout from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Settings from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
// 1. Import Icons for Theme Toggle
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun

import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { performLogout } from "../../utils/logout";
import { useTheme } from "../../context/ThemeContext";
import { resolveProfileImage } from "../../utils/profileImage";
import { useSearch } from "../../context/SearchContext";

export default function FreelancerNavbar({
  onNotificationClick,
  onSidebarToggle,
  // Notification action handlers (may be passed from parent)
  onDelete,
  onToggleFavourite,
  // Notifications list
  notifications = [],
  sidebarOpen = true,
  sidebarWidth = 240, // Match Layout width
  isDesktop = true,
}) {
  const { user } = useUser(); 
  const navigate = useNavigate();
  
  // 3. Get Theme Controls
  const { theme, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme(); // To access palette colors directly if needed
  const { searchTerm, setSearchTerm, getSuggestions } = useSearch();

  // --- State for Menu ---
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // --- State for Edit Profile Modal ---
  const [openModal, setOpenModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapperRef = useRef(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const suggestions = useMemo(() => getSuggestions('freelancer', 10), [getSuggestions]);
  const suggestionPaperSx = useMemo(() => ({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    borderRadius: 3,
    boxShadow: theme === 'dark' ? '0 20px 38px rgba(15, 23, 42, 0.45)' : '0 16px 32px rgba(15, 23, 42, 0.12)',
    border: `1px solid ${muiTheme.palette.divider}`,
    backgroundColor: muiTheme.palette.background.paper,
    zIndex: muiTheme.zIndex.modal,
    maxHeight: 320,
    overflowY: 'auto',
    padding: '8px 0'
  }), [muiTheme, theme]);
  const suggestionItemSx = (active) => ({
    px: 2,
    py: 1.2,
    cursor: 'pointer',
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
    bgcolor: active ? muiTheme.palette.action.hover : 'transparent',
    transition: 'background-color 0.15s ease',
    '&:hover': { bgcolor: muiTheme.palette.action.hover }
  });
  
  // --- SEPARATE PROFILE STATE (Presentation Hack) ---
  const [freelancerName, setFreelancerName] = useState(user?.name || "Freelancer Name");
  const [freelancerAvatar, setFreelancerAvatar] = useState(() => {
    try {
      return localStorage.getItem("freelancer_avatar") || user?.avatar || "";
    } catch (e) {
      return user?.avatar || "";
    }
  });
  const [tempName, setTempName] = useState("");
  const [preview, setPreview] = useState("");

  // Load "Freelancer Only" data on mount
  useEffect(() => {
    const savedName = localStorage.getItem("freelancer_name");
    const savedAvatar = localStorage.getItem("freelancer_avatar");

    if (savedName) {
      setFreelancerName(savedName);
    } else if (user?.name) {
      setFreelancerName(user.name);
    }

    if (savedAvatar) {
      setFreelancerAvatar(savedAvatar);
    } else if (user?.avatar) {
      setFreelancerAvatar(user.avatar);
    }
  }, [user?.name, user?.avatar]);

  useEffect(() => {
    if (!localStorage.getItem("freelancer_name") && user?.name) {
      setFreelancerName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (!localStorage.getItem("freelancer_avatar") && user?.avatar) {
      setFreelancerAvatar(user.avatar);
    }
  }, [user?.avatar]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
        setHighlightIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSuggestionsOpen) return;
    setHighlightIndex((prev) => {
      if (suggestions.length === 0) return -1;
      if (prev < 0) return prev;
      return Math.min(prev, suggestions.length - 1);
    });
  }, [suggestions.length, isSuggestionsOpen]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchTerm]);

  // --- Handlers ---
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await performLogout();
    navigate("/signup");
  };

  const handleEditProfile = () => {
    // Navigate to the full edit profile page instead of opening the modal
    handleMenuClose();
    navigate('/freelancer/profile/edit');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    if (!isSuggestionsOpen) {
      setIsSuggestionsOpen(true);
    }
  };

  const handleSearchFocus = () => {
    setIsSuggestionsOpen(true);
  };

  const handleSuggestionSelect = (item) => {
    if (!item || !item.path) return;
    navigate(item.path);
    setIsSuggestionsOpen(false);
    setHighlightIndex(-1);
    if (searchOpen) {
      setSearchOpen(false);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isSuggestionsOpen) {
        setIsSuggestionsOpen(true);
        return;
      }
      setHighlightIndex((prev) => {
        if (suggestions.length === 0) return -1;
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isSuggestionsOpen) {
        setIsSuggestionsOpen(true);
        return;
      }
      setHighlightIndex((prev) => {
        if (suggestions.length === 0) return -1;
        if (prev === -1) return suggestions.length - 1;
        const next = prev - 1;
        return next < 0 ? suggestions.length - 1 : next;
      });
    } else if (event.key === 'Enter') {
      if (isSuggestionsOpen && suggestions.length > 0 && highlightIndex >= 0) {
        event.preventDefault();
        handleSuggestionSelect(suggestions[highlightIndex]);
      }
    } else if (event.key === 'Escape') {
      if (isSuggestionsOpen) {
        event.preventDefault();
        setIsSuggestionsOpen(false);
        setHighlightIndex(-1);
      }
    }
  };

  const openMobileSearch = () => {
    setSearchOpen(true);
    setIsSuggestionsOpen(true);
  };

  const shouldShowSuggestions = isSuggestionsOpen && (suggestions.length > 0 || searchTerm.trim().length > 0);
  const emptyStateMessage = searchTerm.trim().length > 0
    ? `No suggestions match "${searchTerm.trim()}".`
    : 'Start typing to discover quick links.';

  const handleSave = () => {
    const nextName = tempName || freelancerName;
    setFreelancerName(nextName);

    if (preview) {
      setFreelancerAvatar(preview);
      localStorage.setItem("freelancer_avatar", preview);
      localStorage.setItem("avatar_uploaded", "1");
    }

    localStorage.setItem("freelancer_name", nextName);
    setOpenModal(false);
    setPreview("");
  };

  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (!user) return null; 

  const computedOffset = isDesktop && sidebarOpen ? `${sidebarWidth}px` : 0;
  const appBarWidth = isDesktop && sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%';

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          // Background handled by Layout Theme Provider now, but we keep this for glass effect
          bgcolor: muiTheme.components?.MuiAppBar?.styleOverrides?.root?.backgroundColor || "background.paper",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          left: computedOffset,
          width: appBarWidth,
          right: 0,
          transition: "all 0.3s ease"
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", alignItems: 'center', gap: 2, height: 70 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onSidebarToggle && (
              <IconButton
                onClick={onSidebarToggle}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            )}
            {/* Search Bar: hidden on xs, show icon that opens dialog */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', width: '100%', maxWidth: 400 }}>
              <Box
                ref={searchWrapperRef}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: theme === 'dark' ? "rgba(255,255,255,0.05)" : "grey.100",
                  borderRadius: '50px',
                  px: 2.5,
                  py: 0.8,
                  width: '100%',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary', mr: 1.5 }} />
                <InputBase
                  placeholder="Search projects..."
                  fullWidth
                  sx={{ fontSize: '0.95rem', fontWeight: 500 }}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onKeyDown={handleSearchKeyDown}
                />
                {shouldShowSuggestions && (
                  <Paper sx={suggestionPaperSx}>
                    {suggestions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
                        {emptyStateMessage}
                      </Typography>
                    ) : (
                      suggestions.map((item, index) => (
                        <Box
                          key={item.id}
                          sx={suggestionItemSx(index === highlightIndex)}
                          onMouseEnter={() => setHighlightIndex(index)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSuggestionSelect(item);
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary">
                              {item.description}
                            </Typography>
                          )}
                        </Box>
                      ))
                    )}
                  </Paper>
                )}
              </Box>
            </Box>
            <IconButton sx={{ display: { xs: 'inline-flex', sm: 'none' } }} onClick={openMobileSearch}>
              <SearchIcon />
            </IconButton>
          </Box>

          {/* Right Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            
            {/* 4. THEME TOGGLE BUTTON */}
            <IconButton onClick={toggleTheme} color="inherit">
              {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon sx={{ color: 'text.secondary' }} />}
            </IconButton>

            {/* Notifications Trigger */}
            {(() => {
              const unread = (notifications || []).filter(n => !(n.read === true || n.is_read === true)).length;
              return (
                <IconButton
                  onClick={onNotificationClick}
                  sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
                  aria-label="Notifications"
                >
                  {unread > 0 ? (
                    <Badge badgeContent={unread} color="error">
                      <NotificationsNoneIcon sx={{ color: 'text.primary' }} />
                    </Badge>
                  ) : (
                    <NotificationsNoneIcon sx={{ color: 'text.primary' }} />
                  )}
                </IconButton>
              );
            })()}

            {/* Profile Dropdown Trigger */}
            <Box 
              onClick={handleMenuClick}
              sx={{ 
                display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer",
                p: 0.8, pr: 1.5, borderRadius: "50px", 
                transition: "0.2s",
                "&:hover": { bgcolor: "action.hover" } 
              }}
            >
              {/* USE SEPARATE STATE HERE */}
              {(() => {
                const displayName = freelancerName || user?.name || user?.email || "Freelancer";
                const storedAvatar = localStorage.getItem("freelancer_avatar");
                const candidates = [
                  preview,
                  freelancerAvatar,
                  storedAvatar,
                  user?.avatar
                ];
                const src = candidates
                  .map((candidate) => resolveProfileImage(candidate))
                  .find(Boolean);
                const hasSrc = Boolean(src);
                return (
                  <Avatar
                    src={hasSrc ? src : undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid',
                      borderColor: 'divider',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      bgcolor: hasSrc ? 'transparent' : 'primary.main',
                      color: hasSrc ? 'inherit' : 'common.white'
                    }}
                  >
                    {getInitials(displayName)}
                  </Avatar>
                );
              })()}
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Typography variant="subtitle2" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                  {freelancerName || user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  FREELANCER
                </Typography>
              </Box>
              <KeyboardArrowDownIcon fontSize="small" color="action" />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              TransitionComponent={Fade}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.1))',
                  mt: 2, 
                  borderRadius: 3, 
                  minWidth: 220,
                  '&:before': { 
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 24,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">Account</Typography>
              </Box>
              
              <MenuItem onClick={handleEditProfile} sx={{ py: 1.5 }}>
                <ListItemIcon><PersonIcon fontSize="small" sx={{ color: 'primary.main' }}/></ListItemIcon>
                <Typography variant="body2" fontWeight={500}>Edit Profile</Typography>
              </MenuItem>
              
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon><Settings fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
                <Typography variant="body2" fontWeight={500}>Settings</Typography>
              </MenuItem>
              
              <Divider sx={{ my: 1 }} />
              
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                <Typography variant="body2" fontWeight={600}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Search Dialog */}
      <Dialog open={searchOpen} onClose={() => { setSearchOpen(false); setIsSuggestionsOpen(false); }} fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon sx={{ color: 'text.secondary' }} />
              <InputBase
                autoFocus
                placeholder="Search projects..."
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </Box>

            {suggestions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                {emptyStateMessage}
              </Typography>
            ) : (
              suggestions.map((item, index) => (
                <Box
                  key={`${item.id}-mobile-${index}`}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    px: 2,
                    py: 1.2,
                    cursor: 'pointer'
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionSelect(item);
                  }}
                  onTouchStart={(event) => {
                    event.preventDefault();
                    handleSuggestionSelect(item);
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                  {item.description && (
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  )}
                </Box>
              ))
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSearchOpen(false); setIsSuggestionsOpen(false); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>Update Profile Details</DialogTitle>
        <DialogContent>
          <Stack spacing={4} alignItems="center" sx={{ mt: 2 }}>
            <Box sx={{ position: "relative" }}>
              <Avatar src={preview} sx={{ width: 120, height: 120, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <IconButton 
                component="label" 
                sx={{ 
                  position: "absolute", bottom: 5, right: 5, 
                  bgcolor: "primary.main", color: "white",
                  boxShadow: 2,
                  "&:hover": { bgcolor: "primary.dark" } 
                }}
              >
                <CloudUploadIcon fontSize="small" />
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </IconButton>
            </Box>
            
            <TextField 
              label="Freelancer Name" 
              fullWidth 
              variant="outlined" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disableElevation sx={{ borderRadius: 2, px: 4 }}>
            Save Changes (Freelancer Only)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}