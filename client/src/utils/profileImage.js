const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

const trimToValidString = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "undefined") return "";
  return trimmed;
};

const extractImagePath = (image) => {
  if (!image) return "";
  if (typeof image === "string") return trimToValidString(image);
  if (typeof image === "object") {
    if (typeof image.url === "string") return image.url;
    if (typeof image.path === "string") return image.path;
  }
  return "";
};

const isAbsoluteSource = (source) => /^(https?:|data:|blob:)/i.test(source);

const buildAbsoluteUrl = (source) => {
  const root = API_BASE_URL.replace(/\/$/, "");
  const normalized = source.startsWith("/") ? source : `/${source}`;
  return `${root}${normalized}`;
};

export const resolveProfileImage = (image) => {
  const source = extractImagePath(image);
  if (!source) return null;
  if (isAbsoluteSource(source)) {
    return source;
  }
  return buildAbsoluteUrl(source);
};

export const avatarFallback = (name = "User", background = "1d4ed8", color = "ffffff") => {
  const safeName = name?.trim() || "User";
  return `https://ui-avatars.com/api/?background=${background}&color=${color}&name=${encodeURIComponent(safeName)}`;
};

export const selectProfileImage = (candidates, name, options = {}) => {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const candidate of list) {
    const resolved = resolveProfileImage(candidate);
    if (resolved) {
      return resolved;
    }
  }
  return avatarFallback(name, options.background, options.color);
};

export const profileImageOrFallback = (image, name, options = {}) => {
  return selectProfileImage(image, name, options);
};

export default resolveProfileImage;
