const IORedis = require("ioredis");

function getRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new IORedis(url, {
    maxRetriesPerRequest: null
  });
}

module.exports = { getRedisConnection };
