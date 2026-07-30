export const CLOUD_BACKEND_URL = 'https://ais-dev-qebjzwuwu77wdhxro4kz36-479887991863.europe-west3.run.app';

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;

  // Only use cloud backend URL when running as a native Android/Capacitor app
  const isNativeApp =
    window.location.protocol === 'file:' ||
    window.location.origin.includes('capacitor') ||
    !!(window as any).Capacitor?.isNativePlatform?.();

  if (isNativeApp) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${CLOUD_BACKEND_URL}${cleanPath}`;
  }

  // In all browser environments (including Replit preview, localhost dev),
  // use relative paths so requests hit the local Express server
  return path;
}
