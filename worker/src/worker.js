require("dotenv").config();

const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");
const readline = require("readline");

const pLimitPkg = require("p-limit");
const pLimit = pLimitPkg.default || pLimitPkg;

const mongoose = require("mongoose");
const IORedis = require("ioredis");
const { Worker } = require("bullmq");

// --------------------
// Mongo model
// --------------------
const MovieSchema = new mongoose.Schema(
  {
    imdbId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    lists: { type: [String], default: [], index: true },
    description: { type: String, default: "" },
    rating: { type: Number, default: null, index: true },
    releaseDate: { type: Date, default: null, index: true },
    durationMins: { type: Number, default: null, index: true },
    posterUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

MovieSchema.index({ title: "text", description: "text" });

const Movie = mongoose.model("Movie", MovieSchema);

async function connectMongo() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing in worker/.env");
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[worker] MongoDB connected");
}

// --------------------
// Redis
// --------------------
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

// --------------------
// Helpers
// --------------------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const tmpPath = destPath + ".tmp";
    const file = fs.createWriteStream(tmpPath);

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed ${url} (${res.statusCode})`));
          res.resume();
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            fs.renameSync(tmpPath, destPath);
            resolve();
          });
        });
      })
      .on("error", (err) => {
        try {
          fs.unlinkSync(tmpPath);
        } catch {}
        reject(err);
      });
  });
}

function parseYearToDate(yearStr) {
  const y = Number(yearStr);
  if (!Number.isFinite(y) || y < 1800 || y > 2100) return null;
  return new Date(Date.UTC(y, 0, 1));
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// --------------------
// IMDb datasets (Top250 build)
// --------------------
const DATA_DIR = process.env.IMDB_DATA_DIR || path.join(__dirname, "..", "data");
const RATINGS_GZ = path.join(DATA_DIR, "title.ratings.tsv.gz");
const BASICS_GZ = path.join(DATA_DIR, "title.basics.tsv.gz");

const RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz";
const BASICS_URL = "https://datasets.imdbws.com/title.basics.tsv.gz";

const MIN_VOTES = Number(process.env.TOP250_MIN_VOTES || 25000);

async function ensureDatasets() {
  ensureDir(DATA_DIR);

  if (!fs.existsSync(RATINGS_GZ)) {
    console.log("[worker] Downloading IMDb ratings dataset...");
    await downloadFile(RATINGS_URL, RATINGS_GZ);
    console.log("[worker] Downloaded:", RATINGS_GZ);
  } else {
    console.log("[worker] Ratings dataset exists:", RATINGS_GZ);
  }

  if (!fs.existsSync(BASICS_GZ)) {
    console.log("[worker] Downloading IMDb basics dataset...");
    await downloadFile(BASICS_URL, BASICS_GZ);
    console.log("[worker] Downloaded:", BASICS_GZ);
  } else {
    console.log("[worker] Basics dataset exists:", BASICS_GZ);
  }
}

function compareCandidate(a, b) {
  if (b.rating !== a.rating) return b.rating - a.rating;
  return b.votes - a.votes;
}

function trimCandidates(list, maxSize) {
  if (list.length <= maxSize) return list;
  list.sort(compareCandidate);
  return list.slice(0, maxSize);
}

async function buildTop250FromDatasets() {
  await ensureDatasets();

  console.log(`[worker] Building Top250 from datasets (minVotes=${MIN_VOTES})...`);

  // 1) ratings scan
  const candidates = []; // { imdbId, rating, votes }
  const ratingsStream = fs.createReadStream(RATINGS_GZ).pipe(zlib.createGunzip());
  const rlRatings = readline.createInterface({ input: ratingsStream, crlfDelay: Infinity });

  let isFirst = true;
  let rows = 0;

  for await (const line of rlRatings) {
    if (isFirst) {
      isFirst = false;
      continue; // header
    }
    rows++;
    const [tconst, avgStr, votesStr] = line.split("\t");
    const rating = Number(avgStr);
    const votes = Number(votesStr);

    if (!tconst || !Number.isFinite(rating) || !Number.isFinite(votes)) continue;
    if (votes < MIN_VOTES) continue;

    candidates.push({ imdbId: tconst, rating, votes });

    if (candidates.length > 6000 && rows % 50000 === 0) {
      const trimmed = trimCandidates(candidates, 4000);
      candidates.length = 0;
      candidates.push(...trimmed);
      console.log(`[worker] ratings scanned=${rows} candidates≈${candidates.length}`);
    }
  }

  const trimmedFinal = trimCandidates(candidates, 4000);
  const candidateIds = new Set(trimmedFinal.map((c) => c.imdbId));
  const ratingMap = new Map(trimmedFinal.map((c) => [c.imdbId, c]));

  console.log(`[worker] Ratings pass done. candidates=${candidateIds.size}`);

  // 2) basics scan
  const basicsStream = fs.createReadStream(BASICS_GZ).pipe(zlib.createGunzip());
  const rlBasics = readline.createInterface({ input: basicsStream, crlfDelay: Infinity });

  let basicsFirst = true;
  let basicsRows = 0;

  const enriched = [];

  for await (const line of rlBasics) {
    if (basicsFirst) {
      basicsFirst = false;
      continue;
    }
    basicsRows++;

    const parts = line.split("\t");
    const tconst = parts[0];
    if (!candidateIds.has(tconst)) continue;

    const titleType = parts[1];
    if (titleType !== "movie") continue;

    const primaryTitle = parts[2] && parts[2] !== "\\N" ? parts[2] : "";
    const startYear = parts[5] && parts[5] !== "\\N" ? parts[5] : null;
    const runtimeMinutes = parts[7] && parts[7] !== "\\N" ? parts[7] : null;

    const r = ratingMap.get(tconst);
    if (!r) continue;

    // IMPORTANT: do NOT set empty description/posterUrl here,
    // so we don't wipe enriched values later.
    enriched.push({
      imdbId: tconst,
      title: primaryTitle || tconst,
      rating: r.rating,
      votes: r.votes,
      releaseDate: startYear ? parseYearToDate(startYear) : null,
      durationMins: runtimeMinutes ? toInt(runtimeMinutes) : null
    });

    if (basicsRows % 500000 === 0) {
      console.log(`[worker] basics scanned=${basicsRows} enriched=${enriched.length}`);
    }
  }

  // 3) take top 250
  enriched.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return (b.votes || 0) - (a.votes || 0);
  });

  const top250 = enriched.slice(0, 250).map(({ votes, ...rest }) => rest);

  if (top250.length < 50) {
    throw new Error(`[worker] Dataset build produced too few movies (${top250.length}). Check dataset downloads.`);
  }

  console.log(`[worker] Built Top250: ${top250.length}`);
  return top250;
}

// --------------------
// DB upsert helper (supports list tagging)
// --------------------
async function upsertMovies(movies, listName) {
  if (!movies.length) return 0;

  const ops = movies.map((m) => {
    const $set = {
      title: m.title,
      rating: m.rating ?? null,
      releaseDate: m.releaseDate ?? null,
      durationMins: m.durationMins ?? null,
      ...(m.posterUrl ? { posterUrl: m.posterUrl } : {}),
      ...(m.description ? { description: m.description } : {})
    };

    const update = {
      $set,
      $setOnInsert: { imdbId: m.imdbId },
      ...(listName ? { $addToSet: { lists: listName } } : {})
    };

    return {
      updateOne: {
        filter: { imdbId: m.imdbId },
        update,
        upsert: true
      }
    };
  });

  const result = await Movie.bulkWrite(ops, { ordered: false });
  return (result.upsertedCount || 0) + (result.modifiedCount || 0);
}

// --------------------
// Jobs: Top250
// --------------------
async function syncTop250() {
  const movies = await buildTop250FromDatasets();

  let affected = 0;
  const chunkSize = 50;
  for (let i = 0; i < movies.length; i += chunkSize) {
    const chunk = movies.slice(i, i + chunkSize);
    affected += await upsertMovies(chunk, "top250"); // ✅ long-term tag
    console.log(`[worker] Upserted chunk ${i / chunkSize + 1}/${Math.ceil(movies.length / chunkSize)}`);
  }

  console.log(`[worker] Sync complete. Movies: ${movies.length}, affected ~${affected}`);
  return { count: movies.length, affected };
}

// --------------------
// TMDB helpers
// --------------------
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_SIZE = process.env.TMDB_IMAGE_SIZE || "w500";

async function tmdbGetJson(url) {
  if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY missing in worker/.env");
  const sep = url.includes("?") ? "&" : "?";
  const full = `${url}${sep}api_key=${encodeURIComponent(TMDB_API_KEY)}`;

  const res = await fetch(full, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status}: ${text.slice(0, 120)}`);
  }
  return await res.json();
}

async function getTmdbSecureBaseUrl() {
  try {
    const cfg = await tmdbGetJson("https://api.themoviedb.org/3/configuration");
    return cfg?.images?.secure_base_url || "https://image.tmdb.org/t/p/";
  } catch {
    return "https://image.tmdb.org/t/p/";
  }
}

async function getImdbIdFromTmdbMovieId(tmdbId) {
  const data = await tmdbGetJson(
    `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}/external_ids`
  );
  return data?.imdb_id || "";
}

// --------------------
// Jobs: Anime Top 50 (TMDB)
// --------------------
async function fetchAnimeTop50FromTmdb() {
  console.log("[worker] Fetching Top 50 anime movies (ja + animation) from TMDB...");
  const secureBase = await getTmdbSecureBaseUrl();

  const collected = [];
  const seenImdb = new Set();

  const baseUrl =
    "https://api.themoviedb.org/3/discover/movie" +
    "?with_genres=16" +
    "&with_original_language=ja" +
    "&sort_by=vote_average.desc" +
    "&vote_count.gte=2000" +
    "&include_adult=false" +
    "&language=en-US";

  for (let page = 1; page <= 10 && collected.length < 50; page++) {
    const data = await tmdbGetJson(`${baseUrl}&page=${page}`);
    const results = data?.results || [];
    if (!results.length) break;

    const limit = pLimit(3);

    const mapped = await Promise.all(
      results.map((m, idx) =>
        limit(async () => {
          await sleep(80 * (idx % 3));

          const tmdbId = m.id;
          if (!tmdbId) return null;

          const imdbId = await getImdbIdFromTmdbMovieId(tmdbId);
          if (!imdbId) return null;

          if (seenImdb.has(imdbId)) return null;
          seenImdb.add(imdbId);

          const posterPath = m.poster_path || "";
          const posterUrl = posterPath ? `${secureBase}${TMDB_IMAGE_SIZE}${posterPath}` : "";

          return {
            imdbId,
            title: m.title || m.original_title || imdbId,
            description: m.overview || "",
            rating: Number.isFinite(Number(m.vote_average)) ? Number(m.vote_average) : null,
            releaseDate: m.release_date ? new Date(m.release_date) : null,
            durationMins: null,
            posterUrl
          };
        })
      )
    );

    for (const item of mapped) {
      if (!item) continue;
      collected.push(item);
      if (collected.length >= 50) break;
    }

    console.log(`[worker] Anime collection progress: ${collected.length}/50 (page ${page})`);
  }

  if (collected.length < 30) {
    console.warn(
      `[worker] Warning: only collected ${collected.length} anime movies with IMDb IDs. You can relax filters if needed.`
    );
  }

  return collected.slice(0, 50);
}

async function syncAnimeTop50() {
  const movies = await fetchAnimeTop50FromTmdb();

  let affected = 0;
  const chunkSize = 50;

  for (let i = 0; i < movies.length; i += chunkSize) {
    const chunk = movies.slice(i, i + chunkSize);
    affected += await upsertMovies(chunk, "animeTop50"); // ✅ long-term tag
    console.log(`[worker] Anime upsert chunk ${i / chunkSize + 1}/${Math.ceil(movies.length / chunkSize)}`);
  }

  console.log(`[worker] Anime sync complete. Movies: ${movies.length}, affected ~${affected}`);
  return { count: movies.length, affected };
}

// --------------------
// Poster enrichment (TMDB by IMDb ID)
// --------------------
async function getPosterUrlFromImdbId(imdbId, secureBase) {
  const data = await tmdbGetJson(
    `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?external_source=imdb_id&language=en-US`
  );

  const movie = data?.movie_results?.[0];
  const posterPath = movie?.poster_path;
  if (!posterPath) return "";

  return `${secureBase}${TMDB_IMAGE_SIZE}${posterPath}`;
}

async function enrichMissingPosters({ max = 250, concurrency = 3, delayMs = 120 } = {}) {
  console.log("[worker] Enriching missing posters from TMDB...");

  const secureBase = await getTmdbSecureBaseUrl();

  const missing = await Movie.find(
    { $or: [{ posterUrl: "" }, { posterUrl: { $exists: false } }] },
    { imdbId: 1, title: 1 }
  )
    .limit(Number(max))
    .lean();

  console.log(`[worker] Missing posters found: ${missing.length} (processing up to ${max})`);
  if (!missing.length) return { processed: 0, updated: 0 };

  const limit = pLimit(Number(concurrency));

  const updates = await Promise.all(
    missing.map((m, idx) =>
      limit(async () => {
        if (delayMs) await sleep(Number(delayMs) * (idx % Number(concurrency)));

        try {
          const posterUrl = await getPosterUrlFromImdbId(m.imdbId, secureBase);
          return { imdbId: m.imdbId, posterUrl };
        } catch (e) {
          console.warn("[worker] TMDB poster fetch failed:", m.imdbId, e.message);
          return { imdbId: m.imdbId, posterUrl: "" };
        }
      })
    )
  );

  const ops = updates
    .filter((u) => u.posterUrl)
    .map((u) => ({
      updateOne: {
        filter: { imdbId: u.imdbId },
        update: { $set: { posterUrl: u.posterUrl } }
      }
    }));

  let updated = 0;
  const chunkSize = 50;

  for (let i = 0; i < ops.length; i += chunkSize) {
    const chunk = ops.slice(i, i + chunkSize);
    if (!chunk.length) continue;

    const r = await Movie.bulkWrite(chunk, { ordered: false });
    updated += (r.modifiedCount || 0) + (r.upsertedCount || 0);
    console.log(`[worker] Poster chunk ${i / chunkSize + 1}/${Math.ceil(ops.length / chunkSize)} done`);
  }

  console.log(`[worker] Poster enrichment complete. processed=${missing.length} updated~${updated}`);
  return { processed: missing.length, updated };
}

// --------------------
// Description enrichment (TMDB by IMDb ID)
// --------------------
async function getOverviewFromImdbId(imdbId) {
  const data = await tmdbGetJson(
    `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?external_source=imdb_id&language=en-US`
  );
  const movie = data?.movie_results?.[0];
  return movie?.overview || "";
}

async function enrichMissingDescriptions({ max = 250, concurrency = 3, delayMs = 120 } = {}) {
  console.log("[worker] Enriching missing descriptions from TMDB...");

  const baseFilter = { $or: [{ description: "" }, { description: { $exists: false } }] };

  // Prefer enriching top250 first
  let missing = await Movie.find({ ...baseFilter, lists: "top250" }, { imdbId: 1 })
    .limit(Number(max))
    .lean();

  if (!missing.length) {
    missing = await Movie.find(baseFilter, { imdbId: 1 }).limit(Number(max)).lean();
  }

  console.log(`[worker] Missing descriptions found: ${missing.length} (processing up to ${max})`);
  if (!missing.length) return { processed: 0, updated: 0 };

  const limit = pLimit(Number(concurrency));

  const updates = await Promise.all(
    missing.map((m, idx) =>
      limit(async () => {
        if (delayMs) await sleep(Number(delayMs) * (idx % Number(concurrency)));

        try {
          const overview = await getOverviewFromImdbId(m.imdbId);
          return { imdbId: m.imdbId, description: overview };
        } catch (e) {
          console.warn("[worker] TMDB overview fetch failed:", m.imdbId, e.message);
          return { imdbId: m.imdbId, description: "" };
        }
      })
    )
  );

  const ops = updates
    .filter((u) => u.description && u.description.trim().length > 0)
    .map((u) => ({
      updateOne: {
        filter: { imdbId: u.imdbId },
        update: { $set: { description: u.description } }
      }
    }));

  let updated = 0;
  const chunkSize = 50;

  for (let i = 0; i < ops.length; i += chunkSize) {
    const chunk = ops.slice(i, i + chunkSize);
    if (!chunk.length) continue;

    const r = await Movie.bulkWrite(chunk, { ordered: false });
    updated += (r.modifiedCount || 0) + (r.upsertedCount || 0);
    console.log(`[worker] Description chunk ${i / chunkSize + 1}/${Math.ceil(ops.length / chunkSize)} done`);
  }

  console.log(`[worker] Description enrichment complete. processed=${missing.length} updated~${updated}`);
  return { processed: missing.length, updated };
}

// --------------------
// Worker bootstrap
// --------------------
(async () => {
  await connectMongo();

  const worker = new Worker(
    "movies",
    async (job) => {
      console.log(`[worker] Job started: ${job.name} (${job.id})`);

      switch (job.name) {
        case "syncTop250":
          return await syncTop250();

        case "syncAnimeTop50":
          return await syncAnimeTop50();

        case "enrichPosters":
          return await enrichMissingPosters(job.data || {});

        case "enrichDescriptions":
          return await enrichMissingDescriptions(job.data || {});

        default:
          return { ok: true };
      }
    },
    { connection, concurrency: 1 }
  );

  worker.on("active", (job) => console.log(`[worker] Job active: ${job.name} (${job.id})`));
  worker.on("completed", (job) => console.log(`[worker] Job completed: ${job.name} (${job.id})`));
  worker.on("failed", (job, err) => console.error(`[worker] Job failed: ${job?.name} (${job?.id})`, err));
  worker.on("error", (err) => console.error("[worker] Worker error:", err));

  console.log(`[worker] Listening for jobs on queue: movies (redis: ${redisUrl})`);
})();
