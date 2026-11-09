/**
 * Client caching & Avatar prefetching layer.
 * Enables 0ms instantaneous loading of Client Details, Client Lists, and profile pictures.
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
  intake_number?: string | null;
  admission_date?: string | null;
  admission_type?: string | null;
  nickname?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

const memoryCache = new Map<string, CachedClient>();
let memoryClientsList: CachedClient[] | null = null;
let memoryClientsListTime = 0;
const prefetchedUrls = new Set<string>();

const CACHE_PREFIX = 'cms_client_cache_';
const LIST_CACHE_KEY = 'cms_clients_list_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh

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
      intake_number: client.intake_number,
      admission_date: client.admission_date,
      admission_type: client.admission_type,
      nickname: client.nickname,
      created_at: client.created_at,
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

  // Update in memory list if present
  if (memoryClientsList) {
    const index = memoryClientsList.findIndex(c => c.id === client.id);
    if (index >= 0) {
      memoryClientsList[index] = { ...memoryClientsList[index], ...client };
    }
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
 * Cache full clients list for instantaneous 0ms page transitions
 */
export function setCachedClientsList(clients: CachedClient[]): void {
  if (!clients) return;

  memoryClientsList = [...clients];
  memoryClientsListTime = Date.now();

  // Populate individual client caches
  clients.forEach(c => {
    if (c && c.id) {
      memoryCache.set(c.id, c);
    }
  });

  // Prefetch avatars in background
  prefetchAvatars(clients.map(c => c.profile_picture));

  // Store in sessionStorage for cross-page persistence
  try {
    const payload = {
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        client_id: c.client_id,
        status: c.status,
        profile_picture: c.profile_picture,
        intake_number: c.intake_number,
        admission_date: c.admission_date,
        admission_type: c.admission_type,
        nickname: c.nickname,
        created_at: c.created_at,
        gender: c.gender,
        age: c.age,
        notes: c.notes,
      })),
      timestamp: Date.now()
    };
    sessionStorage.setItem(LIST_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // quota exceeded or private mode, memory cache remains active
  }
}

/**
 * Retrieve cached full clients list (0ms instant)
 */
export function getCachedClientsList(): CachedClient[] | null {
  // 1. In-memory cache is fastest (0ms)
  if (memoryClientsList && (Date.now() - memoryClientsListTime < CACHE_TTL_MS)) {
    return memoryClientsList;
  }

  // 2. SessionStorage cache
  try {
    const raw = sessionStorage.getItem(LIST_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.clients) && (Date.now() - parsed.timestamp < CACHE_TTL_MS)) {
        memoryClientsList = parsed.clients;
        memoryClientsListTime = parsed.timestamp;
        return parsed.clients;
      }
    }
  } catch {
    // ignore parse error
  }

  return memoryClientsList;
}

/**
 * Invalidate client list cache when clients are added, modified, or deleted
 */
export function invalidateClientsCache(): void {
  memoryClientsList = null;
  memoryClientsListTime = 0;
  try {
    sessionStorage.removeItem(LIST_CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Remove deleted client from all caches
 */
export function removeClientFromCache(id: string): void {
  memoryCache.delete(id);
  try {
    sessionStorage.removeItem(CACHE_PREFIX + id);
  } catch {
    // ignore
  }
  if (memoryClientsList) {
    memoryClientsList = memoryClientsList.filter(c => c.id !== id);
  }
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
