const { Queue } = require("bullmq");
const { getRedisConnection } = require("./redis");

const connection = getRedisConnection();

const moviesQueue = new Queue("movies", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 200
  }
});

module.exports = { moviesQueue };
