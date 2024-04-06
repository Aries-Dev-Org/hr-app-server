/* eslint-disable no-console */
const NodeCache = require('node-cache');

const cache = new NodeCache();

const withCache = (duration) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`Send cached response: ${key}`);
    res.send(cachedResponse);
  } else {
    res.originalSend = res.send;
    res.send = (body) => {
      res.originalSend(body);
      cache.set(key, body, duration);
    };
    console.log(`Caching response: ${key}`);
    next();
  }
};

module.exports = withCache;
