import { SITE_ORIGIN } from "../config/env";

const ABSOLUTE_URL_RE = /^https?:\/\//i;

export const getSiteOrigin = () => {
  if (SITE_ORIGIN) return SITE_ORIGIN;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

export const resolvePublicUrl = (path: string) => {
  if (!path) return "";
  if (ABSOLUTE_URL_RE.test(path)) return path;
  const origin = getSiteOrigin();
  if (!origin) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
};
