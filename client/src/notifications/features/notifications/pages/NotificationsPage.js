import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../../context/UserContext";
import NotificationItem from "../components/NotificationItem";
import { deleteNotification, getNotifications, markAllRead, markRead, toggleStar } from "../services/notificationService";
import { profileImageOrFallback } from "../../../../utils/profileImage";
import "../components/NotificationItem.css";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();
  const isFreelancer = role === "freelancer";
  const messagesPath = isFreelancer ? "/freelancer/messages" : "/client/messages";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const response = await getNotifications();
        const payload = response.data?.results || response.data || [];
        setItems(payload.map(mapFromApi));
      } catch (error) {
        console.error("Notifications fetch failed", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // If parent layout provides setNotifications via Outlet context, keep parent in sync
  const outletCtx = useOutletContext?.() || {};
  const parentSetNotifications = outletCtx.setNotifications || null;

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (tab === "all") return true;
      if (tab === "unread") return !i.read;
      if (tab === "favourites") return i.category === "favourites";
      return true;
    });
  }, [items, tab]);

  async function toggleRead(id) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)));
    try {
      await markRead(id);
    } catch (error) {
      console.error("Failed to mark read", error);
    }
    if (parentSetNotifications) {
      parentSetNotifications((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, read: true } : p)) : prev));
    }
  }

  // Toggle Favourite
  async function toggleFavourite(id) {
    let nextStar = false;
    setItems((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextStar = p.category !== "favourites";
          return { ...p, category: nextStar ? "favourites" : "all" };
        }
        return p;
      })
    );
    try {
      await toggleStar(id, nextStar);
    } catch (error) {
      console.error("Failed to toggle favourite", error);
      // Revert on failure
      setItems((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return { ...p, category: nextStar ? "all" : "favourites" };
          }
          return p;
        })
      );
      if (parentSetNotifications) {
        parentSetNotifications((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, category: nextStar ? "all" : "favourites" } : p)) : prev));
      }
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this notification?")) return;
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
    if (parentSetNotifications) {
      parentSetNotifications((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    }
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    try {
      await markAllRead();
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
    if (parentSetNotifications) {
      parentSetNotifications((prev) => (prev ? prev.map((p) => ({ ...p, read: true })) : prev));
    }
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.innerContainer}>
      <div style={styles.contentWrapper}>
        
        {/* HEADER */}
        <div style={styles.headerRow}>
          <div style={styles.titleGroup}>
            <h1 style={styles.pageTitle}>Notifications</h1>
          </div>
          <div style={styles.buttonGroup}>
            {/* --- FIX 1: Point to correct Client Messages route --- */}
            <button 
              onClick={() => navigate(messagesPath)} 
              style={styles.secondaryBtn}
            >
               Messages
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={styles.tabsRow}>
          <div style={styles.tabsLeft}>
            <button onClick={() => setTab("all")} style={{ ...styles.tabBtn, ...(tab === "all" ? styles.activeTab : {}) }}>All</button>
            <button onClick={() => setTab("unread")} style={{ ...styles.tabBtn, ...(tab === "unread" ? styles.activeTab : {}) }}>Unread</button>
            <button onClick={() => setTab("favourites")} style={{ ...styles.tabBtn, ...(tab === "favourites" ? styles.activeTab : {}) }}>Favourites</button>
          </div>
          <button onClick={handleMarkAllRead} style={styles.linkBtn}>Mark all as read</button>
        </div>

        {/* LIST */}
        <div style={styles.listContainer}>
          {visible.length > 0 ? (
            visible.map((n) => (
              <NotificationItem
                key={n.id}
                item={n}
                onToggleRead={toggleRead}
                onDelete={handleDelete}
                onToggleFavourite={toggleFavourite}
                onAvatarClick={() => navigate(resolveTargetRoute(n, messagesPath))}
              />
            ))
          ) : (
            <div style={styles.emptyState}>No notifications found.</div>
          )}
        </div>

      </div>
    </div>
  );
}

// Styles
const styles = {
  innerContainer: { width: "100%", fontFamily: "'Inter', sans-serif" },
  contentWrapper: { maxWidth: "850px", margin: "0 auto", paddingBottom: "40px" },
  loading: { padding: "40px", textAlign: "center", color: "#64748b", fontSize: "18px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px", paddingTop: "10px" },
  titleGroup: { display: "flex", alignItems: "center", gap: "12px" },
  pageTitle: { margin: 0, fontSize: "28px", fontWeight: "700", color: "#1e293b" },
  buttonGroup: { display: "flex", gap: "12px" },
  secondaryBtn: { background: "white", color: "#3b82f6", border: "1px solid #3b82f6", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "0.2s" },
  tabsRow: { display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "0px", marginBottom: "20px" },
  tabsLeft: { display: "flex", gap: "24px" },
  tabBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "500", color: "#64748b", padding: "10px 0", borderBottom: "2px solid transparent", transition: "all 0.2s" },
  activeTab: { color: "#3b82f6", fontWeight: "700", borderBottom: "2px solid #3b82f6" },
  linkBtn: { background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  listContainer: { display: "flex", flexDirection: "column", gap: "0px" },
  emptyState: { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "16px" }
};

function mapFromApi(item) {
  const created = item.created_at ? new Date(item.created_at) : null;
  const safeTitle = item.title || "Notification";
  const actorName = item.actor_name || item.metadata?.actor_name || item.metadata?.sender_name || safeTitle;
  const rawAvatar =
    item.metadata?.actor_profile_image ||
    item.metadata?.profile_image ||
    item.metadata?.actor_avatar ||
    item.metadata?.avatar ||
    item.actor_avatar ||
    item.actor_image;
  const avatarUrl = profileImageOrFallback(rawAvatar, actorName || safeTitle, { background: "3b82f6", color: "ffffff" });
  return {
    id: item.id,
    title: safeTitle,
    message: item.body || "",
    read: !!item.is_read,
    category: item.is_starred ? "favourites" : "all",
    time: created ? created.toLocaleTimeString() : "",
    relative: created ? formatRelative(created) : "",
    avatar: avatarUrl,
    raw: item,
  };
}

function formatRelative(dateObj) {
  const diffMs = Date.now() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function resolveTargetRoute(item, messagesPath = "/client/messages") {
  const targetType = item.raw?.target_type;
  const targetId = item.raw?.target_id;

  if (targetType === "project" && targetId) return `/projects/${targetId}`;
  if (targetType === "contract") return "/contracts";
  if (targetType === "conversation") return messagesPath;
  if (targetType === "message") return messagesPath;
  return messagesPath;
}