const DEFAULT_FALLBACK_PATH = "/";

const toSingleSlashes = (value: string) => value.replace(/\/{2,}/g, "/");

const stripTrailingSlash = (value: string) =>
  value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;

export const normalizeMainRoutePath = (rawPath: string) => {
  const withLeadingSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const compact = stripTrailingSlash(toSingleSlashes(withLeadingSlash));
  const segments = compact.split("/").filter(Boolean);

  if (segments.length === 0) return DEFAULT_FALLBACK_PATH;

  segments[0] = segments[0].toLowerCase();
  if (segments[0] === "admin" && segments[1]) {
    segments[1] = segments[1].toLowerCase();
  }

  return `/${segments.join("/")}`;
};

export const sanitizeInternalRedirect = (input?: string | null, fallback = DEFAULT_FALLBACK_PATH) => {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//")) return fallback;
  return normalizeMainRoutePath(input);
};
