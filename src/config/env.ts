const rawApiOrigin = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiOrigin) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_URL. Set it in your environment before running the app."
  );
}

const normalizedInput = rawApiOrigin.trim().replace(/\/+$/, "");

if (!/^https?:\/\//i.test(normalizedInput)) {
  throw new Error(
    "Invalid NEXT_PUBLIC_API_URL. It must start with http:// or https://."
  );
}

if (
  process.env.NODE_ENV === "production" &&
  /localhost|127\.0\.0\.1/i.test(normalizedInput)
) {
  throw new Error(
    "Unsafe NEXT_PUBLIC_API_URL for production. Use a real public API host."
  );
}

const hasApiSuffix = /\/api$/i.test(normalizedInput);

// Supports either:
// 1) NEXT_PUBLIC_API_URL=http://localhost:5000
// 2) NEXT_PUBLIC_API_URL=http://localhost:5000/api
export const ASSET_BASE = hasApiSuffix
  ? normalizedInput.replace(/\/api$/i, "")
  : normalizedInput;

export const API_BASE = hasApiSuffix ? normalizedInput : `${normalizedInput}/api`;

export const apiPath = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

const rawSiteOrigin = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_ORIGIN = rawSiteOrigin
  ? rawSiteOrigin.trim().replace(/\/+$/, "")
  : "";
