const rawApiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "";
const normalizedInput = rawApiOrigin.trim().replace(/\/+$/, "");
const isAbsoluteUrl = /^https?:\/\//i.test(normalizedInput);
const hasApiSuffix = /\/api$/i.test(normalizedInput);

if (!normalizedInput) {
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Falling back to relative /api. Set NEXT_PUBLIC_API_URL in production."
  );
} else if (!isAbsoluteUrl) {
  console.warn(
    "NEXT_PUBLIC_API_URL should start with http:// or https://. Falling back to relative /api."
  );
} else if (
  process.env.NODE_ENV === "production" &&
  /localhost|127\.0\.0\.1/i.test(normalizedInput)
) {
  console.warn(
    "NEXT_PUBLIC_API_URL points to localhost in production. Use a public API host on VPS."
  );
}

// Supports either:
// 1) NEXT_PUBLIC_API_URL=https://api.example.com
// 2) NEXT_PUBLIC_API_URL=https://api.example.com/api
// Fallback when unset/invalid: relative /api
export const ASSET_BASE =
  isAbsoluteUrl && hasApiSuffix
    ? normalizedInput.replace(/\/api$/i, "")
    : isAbsoluteUrl
      ? normalizedInput
      : "";

export const API_BASE =
  isAbsoluteUrl
    ? hasApiSuffix
      ? normalizedInput
      : `${normalizedInput}/api`
    : "/api";

export const apiPath = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

const rawSiteOrigin = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_ORIGIN = rawSiteOrigin
  ? rawSiteOrigin.trim().replace(/\/+$/, "")
  : "";
