const Movie = require("../models/Movie");

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "12", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function normalizeSort(by, order) {
  const ord = order === "asc" ? 1 : -1;

  const map = {
    rating: { rating: ord, title: 1 },
    releaseDate: { releaseDate: ord, title: 1 },
    duration: { durationMins: ord, title: 1 },
    name: { title: ord }
  };

  return map[by] || { createdAt: -1 };
}

function buildListFilter(list) {
  const v = (list || "").toString().trim();
  if (!v) return {};
  // movies tagged by worker: lists: ["top250", "animeTop50"]
  return { lists: v };
}

// Public
async function listMovies(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildListFilter(req.query.list);

  const [data, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Movie.countDocuments(filter)
  ]);

  res.json({ data, page, limit, total, list: req.query.list || null });
}

async function searchMovies(req, res) {
  const { q = "" } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const listFilter = buildListFilter(req.query.list);

  const hasQ = Boolean(q.trim());
  const query = hasQ
    ? { ...listFilter, $text: { $search: q.trim() } }
    : { ...listFilter };

  const projection = hasQ ? { score: { $meta: "textScore" } } : {};
  const sort = hasQ
    ? { score: { $meta: "textScore" }, rating: -1 }
    : { createdAt: -1 };

  const [data, total] = await Promise.all([
    Movie.find(query, projection).sort(sort).skip(skip).limit(limit),
    Movie.countDocuments(query)
  ]);

  res.json({ data, page, limit, total, list: req.query.list || null, q: q || "" });
}

async function sortedMovies(req, res) {
  const { by = "rating", order = "desc", list } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const sort = normalizeSort(by, order);

  // ✅ optional list filter
  const filter = {};
  if (list && typeof list === "string") {
    filter.lists = list; // matches docs where lists contains "top250" or "animeTop50"
  }

  const [data, total] = await Promise.all([
    Movie.find(filter).sort(sort).skip(skip).limit(limit),
    Movie.countDocuments(filter)
  ]);

  res.json({ data, page, limit, total, sortBy: by, sortOrder: order, list: list || null });
}


// Admin CRUD
async function createMovie(req, res) {
  const payload = req.validated.body;
  const created = await Movie.create(payload);
  res.status(201).json({ data: created });
}

async function updateMovie(req, res) {
  const { id } = req.validated.params;
  const payload = req.validated.body;

  const updated = await Movie.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) return res.status(404).json({ message: "Movie not found" });

  res.json({ data: updated });
}

async function deleteMovie(req, res) {
  const { id } = req.validated.params;
  const deleted = await Movie.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Movie not found" });
  res.json({ ok: true });
}

module.exports = {
  listMovies,
  searchMovies,
  sortedMovies,
  createMovie,
  updateMovie,
  deleteMovie
};
