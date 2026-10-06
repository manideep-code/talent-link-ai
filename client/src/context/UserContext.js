import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { profileImageOrFallback, resolveProfileImage } from "../utils/profileImage";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const storedName = localStorage.getItem("user_name");
  const storedEmail = localStorage.getItem("user_email");
  const storedRole = localStorage.getItem("role");

  const [user, setUser] = useState({
    name: storedName || "User",
    email: storedEmail || "",
    role: storedRole || "User",
    avatar: profileImageOrFallback(null, storedName || storedEmail || "User"),
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage
    setUser((prev) => ({
      ...prev,
      name: storedName || prev.name,
      email: storedEmail || prev.email,
      role: storedRole || prev.role,
    }));

    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    axiosInstance
      .get("profiles/me/")
      .then((res) => {
        const profile = res.data || {};

        const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

        const nameFromProfile =
          profile.first_name ||
          profile.name ||
          fullName ||
          storedName ||
          "User";

        const emailFromProfile = profile.email || storedEmail || "";
        const roleFromProfile = profile.role || storedRole || "User";

        // Handle Avatar
        const resolvedAvatar = resolveProfileImage(profile.profile_image);
        const avatarUrl = resolvedAvatar || profileImageOrFallback(null, nameFromProfile || emailFromProfile || "User");

        setUser((prev) => ({
          ...prev,
          name: nameFromProfile,
          email: emailFromProfile,
          role: roleFromProfile,
          avatar: avatarUrl,
        }));

        // Persist latest data
        localStorage.setItem("user_name", nameFromProfile);
        localStorage.setItem("user_email", emailFromProfile);
        localStorage.setItem("role", roleFromProfile);
      })
      .catch(() => {
        // Keep stored values if API fails
      })
      .finally(() => {
        setLoading(false);
      });
  }, [storedName, storedEmail, storedRole]);

  const login = (authPayload = {}) => {
    const rawName = authPayload.name || `${authPayload.first_name || ""} ${authPayload.last_name || ""}`.trim();
    const resolvedName = rawName || storedName || authPayload.email || storedEmail || "User";
    const resolvedEmail = authPayload.email || storedEmail || "";
    const resolvedRole = authPayload.role || storedRole || "User";
    const avatarCandidate = authPayload.avatar || null;
    const resolvedAvatar = resolveProfileImage(avatarCandidate) || profileImageOrFallback(null, resolvedName || resolvedEmail || "User");

    setUser({
      name: resolvedName,
      email: resolvedEmail,
      role: resolvedRole,
      avatar: resolvedAvatar,
    });

    localStorage.setItem("user_name", resolvedName);
    localStorage.setItem("user_email", resolvedEmail);
    localStorage.setItem("role", resolvedRole);
  };

  const updateProfile = (name, avatarFile) => {
    setUser((prev) => ({
      ...prev,
      name: name || prev.name,
      avatar: avatarFile ? URL.createObjectURL(avatarFile) : prev.avatar,
    }));

    if (name) localStorage.setItem("user_name", name);
  };

  return (
    <UserContext.Provider value={{ user, updateProfile, loading, login }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
