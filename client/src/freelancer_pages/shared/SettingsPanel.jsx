import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import userService from "../../services/userService";
import profileService from "../../services/profileService";
import { resolveProfileImage } from "../../utils/profileImage";

const Icons = {
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
};

const notificationDefaults = {
  productUpdates: true,
  jobReminders: true,
  marketingEmails: false,
};

const profileAdapters = {
  client: profileService.client,
  freelancer: profileService.freelancer,
};

const buildInitialForm = (role) => ({
  firstName: "",
  lastName: "",
  email: "",
  companyName: role === "client" ? "" : undefined,
  companyDescription: role === "client" ? "" : undefined,
  location: role === "client" ? "" : undefined,
  projects: role === "client" ? "" : undefined,
  portfolio: role === "freelancer" ? "" : undefined,
  skills: "",
  works: "",
});

const mapProfileForm = (role, user, profile) => {
  const base = buildInitialForm(role);
  return {
    ...base,
    firstName: profile?.first_name ?? user?.first_name ?? "",
    lastName: profile?.last_name ?? user?.last_name ?? "",
    email: user?.email ?? profile?.email ?? "",
    companyName: role === "client" ? profile?.company_name ?? "" : undefined,
    companyDescription: role === "client" ? profile?.company_description ?? "" : undefined,
    location: role === "client" ? profile?.location ?? "" : undefined,
    projects: role === "client" ? profile?.projects ?? "" : undefined,
    portfolio: role === "freelancer" ? profile?.portfolio ?? "" : undefined,
    skills: profile?.skills ?? "",
    works: profile?.works ?? "",
  };
};

const buildPayload = (role, formState) => {
  const payload = {
    first_name: formState.firstName,
    last_name: formState.lastName,
    skills: formState.skills,
    works: formState.works,
  };

  if (role === "client") {
    payload.company_name = formState.companyName;
    payload.company_description = formState.companyDescription;
    payload.location = formState.location;
    payload.projects = formState.projects;
  } else {
    payload.portfolio = formState.portfolio;
  }

  return payload;
};

const SettingsPanel = ({ role }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [formState, setFormState] = useState(() => buildInitialForm(role));
  const [notifications, setNotifications] = useState(() => ({ ...notificationDefaults }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: null, text: "" });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  useEffect(() => {
    setFormState(buildInitialForm(role));
    setNotifications({ ...notificationDefaults });
    setProfileImageFile(null);
    setProfileImagePreview(null);
  }, [role]);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const adapter = profileAdapters[role];
        if (!adapter) {
          throw new Error("Unsupported role");
        }
        const [user, profile] = await Promise.all([
          userService.getProfile().catch(() => null),
          adapter.getProfile(),
        ]);
        if (!isMounted) return;
        setFormState(mapProfileForm(role, user, profile));
        const existingImage = resolveProfileImage(profile?.profile_image);
        setProfileImagePreview(existingImage);
        setProfileImageFile(null);
        setBanner({ type: null, text: "" });
      } catch (error) {
        if (!isMounted) return;
        console.error("Settings load error", error);
        setBanner({ type: "error", text: "Unable to load settings. Please refresh." });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [role]);

  const styles = useMemo(() => getStyles(theme), [theme]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleNotification = (field) => () => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setBanner({ type: null, text: "" });
    try {
      const adapter = profileAdapters[role];
      const payload = buildPayload(role, formState);
      if (profileImageFile) {
        payload.profile_image = profileImageFile;
      }
      await adapter.updateProfile(payload);
      setBanner({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      console.error("Settings save error", error);
      const detail = error?.response?.data || "Unable to save profile.";
      const message = typeof detail === "string" ? detail : "Unable to save profile.";
      setBanner({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div>
      <h2 style={styles.sectionTitle}>{role === "client" ? "Client Profile" : "Freelancer Profile"}</h2>
      <div style={styles.avatarSection}>
        <div style={styles.avatarWrapper}>
          {profileImagePreview ? (
            <img src={profileImagePreview} alt="Profile" style={styles.avatarImage} />
          ) : (
            <div style={styles.avatarPlaceholder}>Upload Photo</div>
          )}
        </div>
        <label style={styles.uploadButton}>
          Change Photo
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImageChange} />
        </label>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>First Name</label>
        <input type="text" value={formState.firstName || ""} onChange={handleInputChange("firstName")} style={styles.input} />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Last Name</label>
        <input type="text" value={formState.lastName || ""} onChange={handleInputChange("lastName")} style={styles.input} />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Email Address</label>
        <input type="email" value={formState.email || ""} disabled style={{ ...styles.input, backgroundColor: styles.readOnlyBg, cursor: "not-allowed" }} />
      </div>

      {role === "client" && (
        <>
          <div style={styles.formGroup}>
            <label style={styles.label}>Company Name</label>
            <input type="text" value={formState.companyName || ""} onChange={handleInputChange("companyName")} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Company Description</label>
            <textarea value={formState.companyDescription || ""} onChange={handleInputChange("companyDescription")} rows={4} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <input type="text" value={formState.location || ""} onChange={handleInputChange("location")} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Active Projects / Hiring Focus</label>
            <textarea value={formState.projects || ""} onChange={handleInputChange("projects")} rows={3} style={styles.input} />
          </div>
        </>
      )}

      {role === "freelancer" && (
        <>
          <div style={styles.formGroup}>
            <label style={styles.label}>Portfolio URL / Description</label>
            <textarea value={formState.portfolio || ""} onChange={handleInputChange("portfolio")} rows={3} style={styles.input} />
          </div>
        </>
      )}

      <div style={styles.formGroup}>
        <label style={styles.label}>{role === "client" ? "Skills Required" : "Skills (comma separated)"}</label>
        <textarea value={formState.skills || ""} onChange={handleInputChange("skills")} rows={3} style={styles.input} placeholder={role === "client" ? "e.g. React, Python, Design" : "React, Python, Django"} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>{role === "client" ? "Work Culture" : "Work Experience"}</label>
        <textarea value={formState.works || ""} onChange={handleInputChange("works")} rows={4} style={styles.input} placeholder="Share relevant details" />
      </div>

      <button style={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
        <span style={{ marginRight: "8px", display: "flex" }}><Icons.Save /></span>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  const renderSecurityTab = () => (
    <div>
      <h2 style={styles.sectionTitle}>Security</h2>
      <p style={styles.mutedText}>Use the Forgot Password flow to reset credentials securely. We will surface direct password changes once the API exposes it.</p>
      <a href="/forgot-password" style={styles.linkBtn}>Go to password reset</a>
    </div>
  );

  const renderNotificationsTab = () => (
    <div>
      <h2 style={styles.sectionTitle}>Notifications</h2>
      <p style={styles.mutedText}>Notification preferences are stored locally until the backend exposes persistent fields.</p>
      {Object.entries(notifications).map(([key, value]) => (
        <label key={key} style={styles.toggleRow}>
          <input type="checkbox" checked={value} onChange={handleToggleNotification(key)} />
          <span style={{ marginLeft: "10px" }}>{labelForNotification(key)}</span>
        </label>
      ))}
    </div>
  );

  const renderBillingTab = () => (
    <div>
      <h2 style={styles.sectionTitle}>Billing Methods</h2>
      <p style={styles.mutedText}>Billing management is handled during contract creation. Reach out to support if you need to update payment details.</p>
    </div>
  );

  const renderAppearanceTab = () => (
    <div>
      <h2 style={styles.sectionTitle}>Appearance</h2>
      <div style={styles.themeToggleContainer}>
        <div>
          <div style={{ fontWeight: 600 }}>Current Mode</div>
          <div style={{ textTransform: "capitalize", color: "#3b82f6" }}>{theme}</div>
        </div>
        <button style={styles.saveBtn} onClick={toggleTheme}>
          <span style={{ marginRight: "8px", display: "flex" }}>
            {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
          </span>
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div style={styles.loader}>Loading settings...</div>;
    }

    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "security":
        return renderSecurityTab();
      case "notifications":
        return renderNotificationsTab();
      case "billing":
        return renderBillingTab();
      case "appearance":
        return renderAppearanceTab();
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Account Settings</h1>
      {banner.text && (
        <div style={{ ...styles.banner, ...(banner.type === "error" ? styles.bannerError : styles.bannerSuccess) }}>
          {banner.text}
        </div>
      )}
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <TabButton icon={<Icons.User />} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} theme={theme} />
          <TabButton icon={<Icons.Lock />} label="Security" active={activeTab === "security"} onClick={() => setActiveTab("security")} theme={theme} />
          <TabButton icon={<Icons.Bell />} label="Notifications" active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} theme={theme} />
          <TabButton icon={<Icons.CreditCard />} label="Billing" active={activeTab === "billing"} onClick={() => setActiveTab("billing")} theme={theme} />
          <TabButton icon={theme === "dark" ? <Icons.Sun /> : <Icons.Moon />} label="Appearance" active={activeTab === "appearance"} onClick={() => setActiveTab("appearance")} theme={theme} />
        </div>
        <div style={styles.content}>{renderContent()}</div>
      </div>
    </div>
  );
};

const labelForNotification = (field) => {
  switch (field) {
    case "productUpdates":
      return "Product and feature updates";
    case "jobReminders":
      return "Job reminders and deadlines";
    case "marketingEmails":
      return "Helpful resources and tips";
    default:
      return field;
  }
};

const TabButton = ({ icon, label, active, onClick, theme }) => {
  const styles = getStyles(theme);
  return (
    <button style={active ? styles.activeTab : styles.tab} onClick={onClick}>
      <span style={{ marginRight: "12px", fontSize: "16px", display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
};

TabButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  theme: PropTypes.string.isRequired,
};

SettingsPanel.propTypes = {
  role: PropTypes.oneOf(["client", "freelancer"]).isRequired,
};

const getStyles = (theme) => {
  const isDark = theme === "dark";
  return {
    container: {
      width: "100%",
      maxWidth: "none",
      padding: "12px 16px",
      margin: 0,
      color: isDark ? "#ffffff" : "#1e293b",
    },
    pageTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "30px",
      color: isDark ? "#ffffff" : "#1e293b",
    },
    layout: {
      display: "flex",
      gap: "16px",
      flexDirection: "row",
      alignItems: "flex-start",
      flexWrap: "wrap",
    },
    sidebar: {
      width: "260px",
      display: "flex",
      flexDirection: "column",
      gap: "5px",
      flexShrink: 0,
    },
    content: {
      flex: 1,
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: isDark ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)" : "0 1px 3px rgba(0,0,0,0.05)",
      border: isDark ? "1px solid #334155" : "none",
      minHeight: "360px",
    },
    tab: {
      display: "flex",
      alignItems: "center",
      padding: "12px 15px",
      border: "none",
      background: "transparent",
      color: isDark ? "#94a3b8" : "#64748b",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      borderRadius: "8px",
      textAlign: "left",
      transition: "0.2s",
    },
    activeTab: {
      display: "flex",
      alignItems: "center",
      padding: "12px 15px",
      border: "none",
      background: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
      color: "#3b82f6",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      borderRadius: "8px",
      textAlign: "left",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      color: isDark ? "#ffffff" : "#1e293b",
      marginBottom: "20px",
      borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
      paddingBottom: "10px",
    },
    formGroup: {
      marginBottom: "20px",
    },
    avatarSection: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap",
      marginBottom: "24px",
    },
    avatarWrapper: {
      width: "96px",
      height: "96px",
      borderRadius: "50%",
      overflow: "hidden",
      border: isDark ? "2px solid #334155" : "2px solid #e2e8f0",
      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    avatarPlaceholder: {
      color: isDark ? "#94a3b8" : "#94a3b8",
      fontSize: "12px",
      textAlign: "center",
      padding: "0 8px",
    },
    uploadButton: {
      border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
      backgroundColor: "transparent",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600,
      color: isDark ? "#cbd5e1" : "#1e293b",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontSize: "13px",
      fontWeight: 600,
      color: isDark ? "#cbd5e1" : "#475569",
    },
    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "6px",
      border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
      backgroundColor: isDark ? "#334155" : "#ffffff",
      color: isDark ? "#ffffff" : "#1e293b",
      fontSize: "14px",
      outline: "none",
      resize: "vertical",
    },
    saveBtn: {
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
    },
    mutedText: {
      color: isDark ? "#cbd5e1" : "#64748b",
      marginBottom: "16px",
    },
    linkBtn: {
      display: "inline-block",
      color: "#3b82f6",
      textDecoration: "none",
      fontWeight: 600,
    },
    toggleRow: {
      display: "flex",
      alignItems: "center",
      marginBottom: "12px",
      fontSize: "14px",
    },
    themeToggleContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px",
      borderRadius: "8px",
      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
    },
    loader: {
      color: isDark ? "#cbd5e1" : "#475569",
    },
    banner: {
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "14px",
    },
    bannerError: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    bannerSuccess: {
      backgroundColor: "#dcfce7",
      color: "#14532d",
    },
    readOnlyBg: isDark ? "#1f2937" : "#f1f5f9",
  };
};

export default SettingsPanel;
