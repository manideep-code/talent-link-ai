// import React from "react";
// import "./NotificationItem.css";

// export default function NotificationItem({
//   item,
//   onToggleRead,
//   onAvatarClick,
// }) {
//   return (
//     <div className={`notif-row ${item.read ? "read" : "unread"}`}>
//       {/* LEFT SIDE */}
//       <div className="notif-left">
//         <img
//           className="notif-avatar"
//           src={item.avatar}
//           alt=""
//           onClick={onAvatarClick}
//           style={{ cursor: "pointer" }}
//         />

//         <div className="notif-main">
//           <div className="notif-title">{item.title}</div>
//           <div className="notif-message">{item.message}</div>
//         </div>
//       </div>

//       {/* RIGHT SIDE (time ABOVE relative time) */}
//       <div className="notif-right">
//         <div className="notif-time-right">{item.time}</div>
//         <div className="notif-relative">{item.relative}</div>

//         <div
//           onClick={() => onToggleRead(item.id)}
//           className={`notif-dot ${item.read ? "dot-read" : "dot-unread"}`}
//         />
//       </div>
//     </div>
//   );
// }





// import React from "react";
// import { FaTrash } from "react-icons/fa"; // Import Trash Icon
// import "./NotificationItem.css";

// export default function NotificationItem({
//   item,
//   onToggleRead,
//   onAvatarClick,
//   onDelete, // New prop
// }) {
//   return (
//     <div className={`notif-row ${item.read ? "read" : "unread"}`}>
//       {/* LEFT SIDE */}
//       <div className="notif-left">
//         <img
//           className="notif-avatar"
//           src={item.avatar}
//           alt=""
//           onClick={onAvatarClick}
//           style={{ cursor: "pointer" }}
//         />

//         <div className="notif-main">
//           <div className="notif-title">{item.title}</div>
//           <div className="notif-message">{item.message}</div>
//         </div>
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="notif-right">
//         <div className="notif-time-right">{item.time}</div>
//         <div className="notif-relative">{item.relative}</div>

//         <div className="notif-actions">
//            {/* Read/Unread Dot */}
//            <div
//             onClick={(e) => { e.stopPropagation(); onToggleRead(item.id); }}
//             className={`notif-dot ${item.read ? "dot-read" : "dot-unread"}`}
//             title={item.read ? "Mark as unread" : "Mark as read"}
//           />
          
//           {/* DELETE SYMBOL */}
//           <FaTrash 
//             className="delete-icon" 
//             onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
//             title="Delete notification"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }



import React from "react";
import { FaTrash, FaStar, FaRegStar } from "react-icons/fa"; // Import Star Icons
import "./NotificationItem.css";

export default function NotificationItem({
  item,
  onToggleRead = () => {},
  onAvatarClick = () => {},
  onDelete = () => {},
  onToggleFavourite = () => {}, // New prop with safe default
}) {
  return (
    <div className={`notif-row ${item.read ? "read" : "unread"}`}>
      {/* LEFT SIDE */}
      <div className="notif-left">
        <img
          className="notif-avatar"
          src={item.avatar}
          alt=""
          onClick={onAvatarClick}
          style={{ cursor: "pointer" }}
        />

        <div className="notif-main">
          <div className="notif-title">{item.title}</div>
          <div className="notif-message">{item.message}</div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="notif-right">
        <div className="notif-time-right">{item.time}</div>
        <div className="notif-relative">{item.relative}</div>

        <div className="notif-actions">
           {/* 1. FAVOURITE STAR */}
           <div 
             className="action-icon star-icon"
             onClick={(e) => { e.stopPropagation(); onToggleFavourite(item.id); }}
             title={item.category === 'favourites' ? "Remove from favourites" : "Add to favourites"}
           >
             {item.category === 'favourites' ? <FaStar /> : <FaRegStar />}
           </div>

           {/* 2. READ/UNREAD DOT */}
           <div
            onClick={(e) => { e.stopPropagation(); onToggleRead(item.id); }}
            className={`notif-dot ${item.read ? "dot-read" : "dot-unread"}`}
            title={item.read ? "Mark as unread" : "Mark as read"}
          />
          
          {/* 3. DELETE ICON */}
          <FaTrash 
            className="action-icon delete-icon" 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
            title="Delete notification"
          />
        </div>
      </div>
    </div>
  );
}