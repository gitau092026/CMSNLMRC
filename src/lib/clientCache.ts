/**
 * Client caching & Avatar prefetching layer.
 * Enables 0ms instantaneous loading of Client Details and profile pictures.
 */

export interface CachedClient {
  id: string;
  name: string;
  client_id?: string | null;
  status?: string | null;
  profile_picture?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  contact?: string | null;
  address?: string | null;
  notes?: string | null;
  [key: string]: any;
}

const memoryCache = new Map<string, CachedClient>();
const prefetchedUrls = new Set<string>();

const CACHE_PREFIX = 'cms_client_cache_';

/**
 * Save client to memory and session storage
 */
export function setCachedClient(client: CachedClient): void {
  if (!client || !client.id) return;

  // Save to memory
  memoryCache.set(client.id, client);

  // Save to sessionStorage (capped to light fields)
  try {
    const lightClient = {
      id: client.id,
      name: client.name,
      client_id: client.client_id,
      status: client.status,
      profile_picture: client.profile_picture,
      date_of_birth: client.date_of_birth,
      age: client.age,
      gender: client.gender,
      contact: client.contact,
      address: client.address,
      notes: client.notes,
      _cachedAt: Date.now()
    };
    sessionStorage.setItem(CACHE_PREFIX + client.id, JSON.stringify(lightClient));
  } catch {
    // sessionStorage quota exceeded or unavailable, memoryCache is still active
  }

  // If profile_picture exists, prefetch it immediately
  if (client.profile_picture) {
    prefetchImage(client.profile_picture);
  }
}

/**
 * Retrieve client from memory or session storage
 */
export function getCachedClient(id: string): CachedClient | null {
  if (!id) return null;

  // Check memory cache first (0ms)
  if (memoryCache.has(id)) {
    return memoryCache.get(id)!;
  }

  // Check sessionStorage
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + id);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(id, parsed);
      return parsed;
    }
  } catch {
    // ignore parse error
  }

  return null;
}

/**
 * Prefetches an image into the browser's memory and HTTP cache.
 * When the image is later rendered in an <img> tag, it displays instantly.
 */
export function prefetchImage(url: string | null | undefined): void {
  if (!url || typeof url !== 'string' || prefetchedUrls.has(url)) return;

  prefetchedUrls.add(url);

  // Use browser Image object to pre-warm cache
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

/**
 * Batch prefetch a list of avatar URLs in the background during browser idle time.
 */
export function prefetchAvatars(urls: (string | null | undefined)[]): void {
  const validUrls = urls.filter((u): u is string => Boolean(u && typeof u === 'string'));
  if (validUrls.length === 0) return;

  const doPrefetch = () => {
    validUrls.slice(0, 30).forEach((url) => {
      prefetchImage(url);
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(doPrefetch, { timeout: 2000 });
  } else {
    setTimeout(doPrefetch, 100);
  }
}
