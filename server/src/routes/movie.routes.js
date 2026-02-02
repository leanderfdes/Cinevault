const express = require("express");
const { z } = require("zod");
const { validate } = require("../utils/validate");
const { authRequired, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/movie.controller");

const router = express.Router();

// Public
router.get("/", ctrl.listMovies);
router.get("/search", ctrl.searchMovies);
router.get("/sorted", ctrl.sortedMovies);

// Admin schemas
const movieBodySchema = z.object({
  imdbId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  rating: z.number().min(0).max(10).nullable().optional(),
  releaseDate: z.string().datetime().nullable().optional(),
  durationMins: z.number().int().positive().nullable().optional(),
  posterUrl: z.string().url().optional()
});

const createSchema = z.object({
  body: movieBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const updateSchema = z.object({
  body: movieBodySchema.partial(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional()
});

const deleteSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional()
});

// Admin
router.post("/", authRequired, requireRole("admin"), validate(createSchema), ctrl.createMovie);
router.put("/:id", authRequired, requireRole("admin"), validate(updateSchema), ctrl.updateMovie);
router.delete("/:id", authRequired, requireRole("admin"), validate(deleteSchema), ctrl.deleteMovie);

module.exports = router;
