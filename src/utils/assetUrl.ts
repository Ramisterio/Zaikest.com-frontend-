import { API_BASE, ASSET_BASE } from "../config/env";

const ABSOLUTE_URL_RE = /^(https?:)?\/\//i;
const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;
const HEX_RE = /^[0-9a-f]+$/i;

const detectHexImageMime = (hex: string) => {
  const lowered = hex.toLowerCase();
  if (lowered.startsWith("ffd8ff")) return "image/jpeg";
  if (lowered.startsWith("89504e47")) return "image/png";
  if (lowered.startsWith("47494638")) return "image/gif";
  if (lowered.startsWith("52494646") && lowered.includes("57454250")) {
    return "image/webp";
  }
  return "";
};

const hexToBase64 = (hex: string) => {
  const cleanHex = hex.length % 2 === 0 ? hex : `0${hex}`;
  const byteLength = cleanHex.length / 2;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i += 1) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  if (typeof btoa !== "function") return "";
  return btoa(binary);
};

const normalizeAssetPath = (rawPath?: string | null) => {
  if (!rawPath) return "";
  const trimmed = rawPath.trim();
  if (!trimmed) return "";
  if (
    ABSOLUTE_URL_RE.test(trimmed) ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const compactHex = trimmed.replace(/\s+/g, "");
  if (HEX_RE.test(compactHex) && compactHex.length > 100) {
    const mime = detectHexImageMime(compactHex);
    if (mime) {
      const base64 = hexToBase64(compactHex);
      if (base64) return `data:${mime};base64,${base64}`;
    }
  }

  const slashNormalized = trimmed.replace(/\\/g, "/");
  const uploadsIndex = slashNormalized.toLowerCase().indexOf("/uploads/");
  const cleanedPath =
    uploadsIndex >= 0
      ? slashNormalized.slice(uploadsIndex)
      : slashNormalized.replace(/^[a-zA-Z]:/, "");
  return cleanedPath.startsWith("/") ? cleanedPath : `/${cleanedPath}`;
};

export const resolveAssetUrl = (
  rawPath?: string | null,
  fallback = "/images/zaikest-logo.png"
) => {
  const normalized = normalizeAssetPath(rawPath);
  if (!normalized) return fallback;
  if (
    ABSOLUTE_URL_RE.test(normalized) ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }
  return `${ASSET_BASE}${normalized}`;
};

export const resolveApiAssetUrl = (
  rawPath?: string | null,
  fallback = "/images/zaikest-logo.png"
) => {
  const normalized = normalizeAssetPath(rawPath);
  if (!normalized) return fallback;
  if (
    ABSOLUTE_URL_RE.test(normalized) ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }
  if (normalized.startsWith("/api/")) {
    return `${ASSET_BASE}${normalized}`;
  }
  return `${API_BASE}${normalized}`;
};

export const normalizeRemoteUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();
  if (!ABSOLUTE_URL_RE.test(trimmed)) return trimmed;
  if (
    LOCALHOST_ORIGIN_RE.test(trimmed) &&
    !LOCALHOST_ORIGIN_RE.test(ASSET_BASE)
  ) {
    return trimmed.replace(LOCALHOST_ORIGIN_RE, ASSET_BASE);
  }
  return trimmed;
};
