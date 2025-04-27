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
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};

const clearPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) {
      await redisClient.del(keys);
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