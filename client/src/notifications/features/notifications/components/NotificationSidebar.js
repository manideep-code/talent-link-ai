// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import NotificationItem from "./NotificationItem";
// import { getNotificationsMock } from "../services/notificationService"; 
// import "./NotificationSidebar.css";
// import "./NotificationItem.css"; // We need this for the item styles

// export default function NotificationSidebar({ isOpen, onClose }) {
//   const navigate = useNavigate();
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Load data when sidebar opens
//   useEffect(() => {
//     if (isOpen) {
//       async function load() {
//         try {
//           const data = await getNotificationsMock();
//           // Show only first 6 items in the sidebar
//           setItems(data.slice(0, 6)); 
//         } catch (error) {
//           console.error("Failed to load notifications", error);
//         } finally {
//           setLoading(false);
//         }
//       }
//       load();
//     }
//   }, [isOpen]);

//   const handleToggleRead = (id) => {
//     setItems((prev) =>
//       prev.map((p) => (p.id === id ? { ...p, read: !p.read } : p))
//     );
//   };

//   const handleViewAll = () => {
//     onClose(); 
//     navigate("/notifications");
//   };

//   if (!isOpen) return null;

//   return (
//     <>
//       {/* Dark Overlay - Click to close */}
//       <div className="notif-sidebar-overlay" onClick={onClose} />

//       {/* The Sliding Sidebar */}
//       <div className="notif-sidebar open">
        
//         {/* Header */}
//         <div className="notif-sidebar-header">
//           <h3>Notifications</h3>
//           <button className="close-btn" onClick={onClose}>&times;</button>
//         </div>

//         {/* List Content */}
//         <div className="notif-sidebar-content">
//           {loading ? (
//             <p className="loading-text">Loading...</p>
//           ) : items.length > 0 ? (
//             items.map((item) => (
//               <NotificationItem
//                 key={item.id}
//                 item={item}
//                 onToggleRead={handleToggleRead}
//                 onAvatarClick={() => {
//                    onClose();
//                    navigate(`/messages/${item.id}`);
//                 }}
//               />
//             ))
//           ) : (
//             <p className="empty-text">No new notifications</p>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="notif-sidebar-footer">
//           <button className="view-all-btn" onClick={handleViewAll}>
//             View All Notifications
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }


import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationItem from "./NotificationItem";
import { getNotifications, markRead, deleteNotification } from "../services/notificationService";
import { profileImageOrFallback } from "../../../../utils/profileImage";
import "./NotificationSidebar.css";
import "./NotificationItem.css"; 

export default function NotificationSidebar({ isOpen, onClose, onItemsChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      async function load() {
        try {
          const response = await getNotifications();
          const payload = response.data?.results || response.data || [];
          const mapped = payload.map(mapFromApi).slice(0, 6);
          setItems(mapped);
        } catch (error) {
          console.error("Failed to load notifications", error);
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [isOpen]);

  const handleToggleRead = async (id) => {
    let nextItems = [];
    setItems((prev) => {
      nextItems = prev.map((p) => (p.id === id ? { ...p, read: true } : p));
      return nextItems;
    });
    if (onItemsChange) onItemsChange(nextItems);
    try {
      await markRead(id);
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  // Toggle favourite (star) for a notification
  const handleToggleFavourite = async (id) => {
    let nextStar = false;
    let nextItems = [];
    setItems((prev) => {
      nextItems = prev.map((p) => {
        if (p.id === id) {
          nextStar = p.category !== "favourites";
          return { ...p, category: nextStar ? "favourites" : "all" };
        }
        return p;
      });
      return nextItems;
    });
    if (onItemsChange) onItemsChange(nextItems);
    try {
      // lazy import the service to avoid circular deps
      const { toggleStar } = await import("../services/notificationService");
      await toggleStar(id, nextStar);
    } catch (error) {
      console.error("Failed to toggle favourite", error);
      // revert on failure
      setItems((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return { ...p, category: nextStar ? "all" : "favourites" };
          }
          return p;
        })
      );
      if (onItemsChange) {
        setItems((prev) => {
          if (Array.isArray(prev)) onItemsChange(prev);
          return prev;
        });
      }
    }
  };

  async function handleDelete(id) {
    if (!window.confirm("Delete this notification?")) return;
    let nextItems = [];
    setItems((prev) => {
      nextItems = prev.filter((p) => p.id !== id);
      return nextItems;
    });
    if (onItemsChange) onItemsChange(nextItems);
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  }

  const handleViewAll = () => {
    onClose(); 
    // Choose appropriate notifications page depending on current layout path
    const path = location?.pathname || '';
    if (path.startsWith('/client')) return navigate('/client/notifications');
    if (path.startsWith('/freelancer')) return navigate('/freelancer/notifications');
    return navigate('/notifications');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark Overlay - Click to close */}
      <div className="notif-sidebar-overlay" onClick={onClose} />

      {/* The Sliding Sidebar */}
      <div className="notif-sidebar open">
        
        {/* Header */}
        <div className="notif-sidebar-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* List Content */}
        <div className="notif-sidebar-content">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : items.length > 0 ? (
            items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onToggleRead={handleToggleRead}
                onAvatarClick={() => {
                   onClose();
                   const path = location?.pathname || '';
                   if (path.startsWith('/client')) return navigate(`/client/messages/${item.id}`);
                   if (path.startsWith('/freelancer')) return navigate(`/freelancer/messages/${item.id}`);
                   return navigate(`/messages/${item.id}`);
                }}
                onToggleFavourite={handleToggleFavourite}
                onDelete={handleDelete}
              />
            ))
            ) : (
            <p className="empty-text">No new notifications</p>
          )}
        </div>

        {/* Footer */}
        <div className="notif-sidebar-footer">
          <button className="view-all-btn" onClick={handleViewAll}>
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
}

function mapFromApi(item) {
  const created = item.created_at ? new Date(item.created_at) : null;
  const safeTitle = item.title || "Notification";
  const actorName = item.actor_name || item.metadata?.actor_name || safeTitle;
  const rawAvatar = item.metadata?.actor_profile_image || item.metadata?.profile_image || item.metadata?.actor_avatar || item.metadata?.avatar;
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