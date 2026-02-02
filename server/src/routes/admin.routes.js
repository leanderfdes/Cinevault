const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { moviesQueue } = require("../queue/movies.queue");

const router = express.Router();

// POST /admin/sync-imdb  (admin only)
router.post("/sync-imdb", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const job = await moviesQueue.add(
      "syncTop250",
      { source: "imdb_top_250" },
      { jobId: `syncTop250_${Date.now()}` }
    );

    res.status(202).json({
      message: "Sync job enqueued",
      jobId: job.id
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/enrich-posters (admin only)
router.post("/enrich-posters", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const job = await moviesQueue.add(
      "enrichPosters",
      { max: 250, concurrency: 3, delayMs: 120 },
      { jobId: `enrichPosters_${Date.now()}` }
    );

    res.status(202).json({
      message: "Poster enrichment job enqueued",
      jobId: job.id
    });
  } catch (err) {
    next(err);
  }
});

router.post("/sync-anime", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const job = await moviesQueue.add(
      "syncAnimeTop50",
      { source: "tmdb_anime_top50" },
      { jobId: `syncAnimeTop50_${Date.now()}` }
    );

    res.status(202).json({ message: "Anime sync job enqueued", jobId: job.id });
  } catch (err) {
    next(err);
  }
});

// POST /admin/enrich-descriptions (admin only)
router.post("/enrich-descriptions", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const job = await moviesQueue.add(
      "enrichDescriptions",
      { max: 250, concurrency: 3, delayMs: 120 },
      { jobId: `enrichDescriptions_${Date.now()}` }
    );

    res.status(202).json({ message: "Description enrichment job enqueued", jobId: job.id });
  } catch (err) {
    next(err);
  }
});



module.exports = router;
