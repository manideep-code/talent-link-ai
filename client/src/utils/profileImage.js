const getApiBaseUrl = () => {
  // Explicit environment variable takes priority.
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.replace(/\/+$/, "");
  }

  // GitHub Codespaces:
  // frontend -> <codespace>-3000.app.github.dev
  // backend  -> <codespace>-8000.app.github.dev
  if (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("-3000.app.github.dev")
  ) {
    return `${window.location.protocol}//${window.location.hostname.replace(
      "-3000.app.github.dev",
      "-8000.app.github.dev"
    )}`;
  }

  // Local development fallback.
  return "http://127.0.0.1:8000";
};

export const API_BASE_URL = getApiBaseUrl();

const trimToValidString = (value) => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "undefined") return "";

  return trimmed;
};

const extractImagePath = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return trimToValidString(image);
  }

  if (typeof image === "object") {
    if (typeof image.url === "string") {
      return trimToValidString(image.url);
    }

    if (typeof image.path === "string") {
      return trimToValidString(image.path);
    }
  }

  return "";
};

const isAbsoluteSource = (source) => {
  return /^(https?:|data:|blob:)/i.test(source);
};

const buildAbsoluteUrl = (source) => {
  const root = API_BASE_URL.replace(/\/+$/, "");
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

export const avatarFallback = (
  name = "User",
  background = "1d4ed8",
  color = "ffffff"
) => {
  const safeName = name?.trim() || "User";

  return `https://ui-avatars.com/api/?background=${background}&color=${color}&name=${encodeURIComponent(
    safeName
  )}`;
};

export const selectProfileImage = (
  candidates,
  name,
  options = {}
) => {
  const list = Array.isArray(candidates)
    ? candidates
    : [candidates];

  for (const candidate of list) {
    const resolved = resolveProfileImage(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return avatarFallback(
    name,
    options.background,
    options.color
  );
};

export const profileImageOrFallback = (
  image,
  name,
  options = {}
) => {
  return selectProfileImage(image, name, options);
};

export default resolveProfileImage;