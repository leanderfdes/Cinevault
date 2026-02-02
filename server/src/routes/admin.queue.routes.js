const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { moviesQueue } = require("../queue/movies.queue");

const router = express.Router();

router.get("/queue-status", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const counts = await moviesQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    res.json({ counts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
