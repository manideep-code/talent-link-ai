// client/src/features/notifications/hooks/useNotifications.js

import { useEffect, useState } from "react";
import { getNotifications } from "../services/notificationService";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getNotifications();
        const payload = response.data?.results || response.data || [];
        setNotifications(payload);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { notifications, loading };
}
