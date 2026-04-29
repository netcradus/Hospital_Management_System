import api from "./api";

function unwrapResponse(response) {
  return response.data.data;
}

const responseCache = new Map();
const inflightRequests = new Map();
const DEFAULT_TTL = 2 * 60 * 1000;

function buildCacheKey(resource, method, suffix = "") {
  return `${method}:${resource}:${suffix}`;
}

function normalizeParams(params = {}) {
  return Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
}

function readCache(key) {
  const cachedEntry = responseCache.get(key);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }

  return cachedEntry.value;
}

function writeCache(key, value, ttl = DEFAULT_TTL) {
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

function invalidateResource(resource) {
  for (const key of responseCache.keys()) {
    if (key.includes(`:${resource}:`)) {
      responseCache.delete(key);
    }
  }
}

async function dedupeRequest(key, requestFactory) {
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const request = requestFactory().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, request);
  return request;
}

export function createEntityService(resource) {
  return {
    async list(params = {}, options = {}) {
      const queryKey = normalizeParams(params);
      const cacheKey = buildCacheKey(resource, "list", queryKey);
      const cachedValue = options.force ? null : readCache(cacheKey);

      if (cachedValue) {
        return cachedValue;
      }

      try {
        const data = await dedupeRequest(cacheKey, async () => {
          const response = await api.get(`/${resource}`, { params });
          const unwrapped = unwrapResponse(response);
          writeCache(cacheKey, unwrapped, options.ttl ?? DEFAULT_TTL);
          return unwrapped;
        });

        return data;
      } catch (error) {
        const staleValue = responseCache.get(cacheKey)?.value;
        if (error.response?.status === 429 && staleValue) {
          return staleValue;
        }

        throw error;
      }
    },
    async getById(id, options = {}) {
      const cacheKey = buildCacheKey(resource, "get", String(id));
      const cachedValue = options.force ? null : readCache(cacheKey);

      if (cachedValue) {
        return cachedValue;
      }

      const data = await dedupeRequest(cacheKey, async () => {
        const response = await api.get(`/${resource}/${id}`);
        const unwrapped = unwrapResponse(response);
        writeCache(cacheKey, unwrapped, options.ttl ?? DEFAULT_TTL);
        return unwrapped;
      });

      return data;
    },
    async create(payload) {
      const response = await api.post(`/${resource}`, payload);
      invalidateResource(resource);
      return unwrapResponse(response);
    },
    async update(id, payload) {
      const response = await api.put(`/${resource}/${id}`, payload);
      invalidateResource(resource);
      return unwrapResponse(response);
    },
    async remove(id) {
      const response = await api.delete(`/${resource}/${id}`);
      invalidateResource(resource);
      return unwrapResponse(response);
    },
  };
}
