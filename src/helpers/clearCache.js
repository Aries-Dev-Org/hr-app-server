const NodeCache = require('node-cache');

const cache = new NodeCache();

const clearCache = (key) => cache.del(key);

module.exports = clearCache;
