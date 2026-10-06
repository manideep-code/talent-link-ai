import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaBriefcase, 
  FaFileInvoice, 
  FaFileAlt, 
  FaEnvelope, 
  FaCog, 
  FaQuestionCircle,
  FaSignOutAlt,
  FaFileContract,
  FaUserFriends,
  FaBars,   // Hamburger Icon
  FaTimes   // Close Icon
} from 'react-icons/fa';

// 1. IMPORT YOUR CSS TO GET THE .hide-scrollbar CLASS
// Adjust the path "../../App.css" if your folder structure is different
import '../../App.css'; 
import { performLogout } from '../../utils/logout';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';

const ClientSidebar = ({ isOpen = true, onToggle, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  // --- STATE FOR MOBILE MENU ---
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(isOpen);
    } else {
      setIsMobileOpen(false);
    }
  }, [isMobile, isOpen]);

  const toggleMobileMenu = () => {
    if (typeof onToggle === 'function') {
      onToggle();
    }
  };

  const closeMobileMenu = () => {
    if (isMobile && isMobileOpen && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleLogout = async () => {
    closeMobileMenu();
    await performLogout();
    navigate('/login');
  };

  // Shared menu configuration to avoid duplicated markup
  const menuItems = [
    { to: '/client/dashboard', icon: <FaHome />, label: 'Overview' },
    { to: '/client/projects', icon: <FaBriefcase />, label: 'My Projects' },
    { to: '/client/proposals', icon: <FaUserFriends />, label: 'Review Proposals' },
    { to: '/client/freelancers', icon: <FaUserFriends />, label: 'Freelancers' },
    { to: '/client/financials', icon: <FaFileInvoice />, label: 'Financials' },
    { to: '/client/contracts', icon: <FaFileContract />, label: 'Contracts' },
    { to: '/client/documents', icon: <FaFileAlt />, label: 'Documents' },
    { to: '/client/messages', icon: <FaEnvelope />, label: 'Messages' },
  ];

  return (
    <div>
      {/* --- EMBEDDED CSS FOR RESPONSIVENESS --- */}
      <style>{`
        /* Default: Hide mobile elements on Desktop */
        .mobile-menu-btn, .mobile-close-btn, .sidebar-overlay {
          display: none;
        }
        
        /* Scrollbar hiding utility */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* --- MOBILE MEDIA QUERY --- */
        @media (max-width: 768px) {
          /* Show Hamburger Button */
          .mobile-menu-btn {
            display: block;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1100;
            background: #0a1f44;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }

          /* Show Overlay */
          .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 998;
            backdrop-filter: blur(2px);
            pointer-events: auto; /* Ensure clicks are caught */
          }

          /* Force Sidebar specific styles for Mobile */
          .client-sidebar {
            position: fixed !important;
            top: 0;
            left: -280px; /* Hidden by default */
            width: 280px !important;
            height: 100vh !important;
            z-index: 1101;
            box-shadow: 4px 0 15px rgba(0,0,0,0.3);
            transition: left 0.3s ease-in-out !important;
          }

          /* Open State */
          .client-sidebar.mobile-open {
            left: 0 !important;
          }

          /* Show Close Button inside Sidebar */
          .mobile-close-btn {
            display: block;
            position: absolute;
            right: 15px;
            top: 30px;
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 20px;
            cursor: pointer;
          }
        }
      `}</style>

      {/* --- HAMBURGER BUTTON (Mobile Only) --- */}
      <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
        <FaBars />
      </button>

      {/* --- OVERLAY (Mobile Only) --- */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu} />
      )}

      {/* --- SIDEBAR CONTAINER --- */}
      <div 
        className={`client-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{ 
            ...styles.sidebar, 
            // On desktop, we respect the 'isOpen' prop. 
            // On mobile, the CSS '!important' overrides this width.
            width: isOpen ? '100%' : 0,
            overflow: 'hidden' // Prevents content spill when closed
        }}
      >
        
        {/* --- LOGO AREA --- */}
        <div style={styles.logoArea}>
          <div style={styles.logoLogo}>
            <span style={styles.logoInitials}>TL</span>
          </div>
          <div>
            <div style={styles.logoText}>Talent Link</div>
            <div style={styles.subText}>CLIENT PORTAL</div>
          </div>
          {/* Close Button (Mobile Only) */}
          <button className="mobile-close-btn" onClick={closeMobileMenu}>
            <FaTimes />
          </button>
        </div>

        {/* --- SCROLLABLE MENU --- */}
        <div style={styles.scrollableContent} className="hide-scrollbar">
          <div style={styles.sectionLabel}>MENU</div>
          
          {/* Menu Items (Clicking one closes menu on mobile) */}
          <div onClick={closeMobileMenu}>
            {menuItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to}
              />
            ))}
          </div>

          {/* --- SETTINGS SECTION --- */}
          <div style={{ ...styles.sectionLabel, marginTop: '20px' }}>PREFERENCES</div>
          
          <div onClick={closeMobileMenu}>
              <NavItem to="/client/settings" icon={<FaCog />} label="Settings" isActive={location.pathname === '/client/settings'} />
              <NavItem to="/client/help" icon={<FaQuestionCircle />} label="Help Center" isActive={location.pathname === '/client/help'} />
          </div>
        </div>

        {/* --- LOGOUT SECTION --- */}
        <div style={styles.logoutSection}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <FaSignOutAlt style={{ marginRight: '10px' }} /> Log Out
          </button>
        </div>
      </div>

      
    </div>
  );
};

// --- HELPER COMPONENT (Unchanged) ---
const NavItem = ({ to, icon, label, isActive }) => {
  const finalStyle = isActive ? { ...styles.link, ...styles.activeLink } : styles.link;
  
  return (
    <Link to={to} style={finalStyle}>
      <span style={styles.icon}>{icon}</span>
      {label}
    </Link>
  );
};

// --- INLINE STYLES (Unchanged) ---
const styles = {
  sidebar: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0a1f44', 
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    whiteSpace: 'nowrap',
  },
  logoArea: {
    padding: '30px 25px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '10px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    position: 'relative'
  },
  logoLogo: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(59,130,246,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#3b82f6',
    letterSpacing: '0.5px'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    marginBottom: '2px',
  },
  subText: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: '1px',
  },
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 15px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#64748b',
    padding: '0 15px 10px 15px',
    letterSpacing: '1px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    textDecoration: 'none',
    color: '#cbd5e1', 
    fontSize: '14px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    marginBottom: '5px',
  },
  activeLink: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
    color: '#ffffff',
    fontWeight: '600',
    borderLeft: '3px solid #3b82f6', 
  },
  icon: {
    marginRight: '15px',
    fontSize: '16px',
    minWidth: '20px',
  },
  logoutSection: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#cbd5e1',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: '0.2s',
  },
};

export default ClientSidebar;