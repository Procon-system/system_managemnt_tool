// redisUtils.js
const { redisClient } = require("./redisClient");

const getFromCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const setToCache = async (key, data, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
};

const deleteFromCache = async (key) => {
  try {
    console.log(`[Cache] Deleting key: ${key}`);
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};
const clearPattern = async (pattern) => {
  try {
    let cursor = '0';
    let totalDeleted = 0;

    do {
      const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      cursor = nextCursor;

      if (keys.length) {
        console.log(`[Cache] Deleting keys for pattern "${pattern}":`, keys);
        await redisClient.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== '0');

    if (totalDeleted === 0) {
      console.warn(`[Cache] No keys matched pattern "${pattern}"`);
    }
  } catch (error) {
    console.error('Redis clear pattern error:', error);
  }
};

// Add to redisUtils.js
const generateCacheKey = (prefix, orgId, additionalParams = {}) => {
    const paramsString = Object.entries(additionalParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    
    return `${prefix}:org:${orgId}${paramsString ? `:${paramsString}` : ''}`;
  };
  
const cachePaginatedResults = async (cacheKey, data, ttl = 300) => {
    if (!data || !data.results || data.results.length === 0) return;
    await setToCache(cacheKey, data, ttl);
  };
module.exports = { getFromCache, setToCache, deleteFromCache, clearPattern,generateCacheKey,cachePaginatedResults  };