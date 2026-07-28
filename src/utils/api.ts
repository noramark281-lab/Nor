export const CLOUD_BACKEND_URL = 'https://ais-dev-qebjzwuwu77wdhxro4kz36-479887991863.europe-west3.run.app';

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;

  const isMobileOrStandalone =
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.origin.includes('capacitor') ||
    !!(window as any).Capacitor?.isNativePlatform?.();

  if (isMobileOrStandalone) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${CLOUD_BACKEND_URL}${cleanPath}`;
  }

  return path;
}
