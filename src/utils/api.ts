/**
 * API URL helper
 *
 * Priority:
 * 1. VITE_API_URL (if defined)
 * 2. Native mobile backend
 * 3. Current server (relative path)
 */

const ENV_API_URL =
  (import.meta as any)?.env?.VITE_API_URL?.trim?.() || "";

const DEFAULT_NATIVE_BACKEND =
  "https://ais-dev-qebjzwuwu77wdhxro4kz36-479887991863.europe-west3.run.app";

function normalize(base: string): string {
  return base.replace(/\/+$/, "");
}

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.location.protocol === "file:" ||
    window.location.origin.includes("capacitor") ||
    !!(window as any)?.Capacitor?.isNativePlatform?.()
  );
}

export function getBackendBaseUrl(): string {
  if (ENV_API_URL.length > 0) {
    return normalize(ENV_API_URL);
  }

  if (isNativePlatform()) {
    return normalize(DEFAULT_NATIVE_BACKEND);
  }

  return "";
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const base = getBackendBaseUrl();

  if (!base) {
    return cleanPath;
  }

  return `${base}${cleanPath}`;
}
