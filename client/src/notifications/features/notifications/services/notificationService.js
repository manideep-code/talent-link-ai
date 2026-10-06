import axiosInstance from "../../../../utils/axiosInstance";

export const getNotifications = () => axiosInstance.get("notifications/");

export const markRead = (id) => axiosInstance.post(`notifications/${id}/mark-read/`);

export const markAllRead = () => axiosInstance.post("notifications/mark-all-read/");

export const deleteNotification = (id) => axiosInstance.delete(`notifications/${id}/`);

export const toggleStar = (id, starred) =>
	axiosInstance.post(`notifications/${id}/toggle-star/`, starred === undefined ? {} : { starred });
