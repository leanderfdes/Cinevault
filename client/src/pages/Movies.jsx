import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom"; // ✅ Added for Portal support
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { http } from "../api/http";

const LISTS = [
  { key: "top250", label: "Top 250" },
  { key: "animeTop50", label: "Anime Top 50" },
];

const VALID_LISTS = new Set(LISTS.map((l) => l.key));

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 animate-pulse">
      <div className="h-56 rounded-2xl bg-white/5" />
      <div className="mt-4 h-4 w-3/4 bg-white/5 rounded" />
      <div className="mt-2 h-3 w-1/2 bg-white/5 rounded" />
    </div>
  );
}

function MovieCard({ m, onOpen }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group rounded-3xl border border-border bg-card p-4 hover:bg-white/5 hover:shadow-glow transition outline-none"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="relative h-56 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-white/5 via-white/0 to-accent/15">
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
          <div className="absolute -inset-16 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl animate-[pulse_2.2s_ease-in-out_infinite]" />
        </div>

        {m.posterUrl && imgOk ? (
          <img
            src={m.posterUrl}
            alt={m.title}
            className="h-full w-full object-cover scale-[1.02] group-hover:scale-[1.07] transition duration-700"
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="h-full w-full p-4 flex flex-col justify-end">
            <div className="text-xs text-muted">{m.imdbId}</div>
            <div className="mt-1 font-semibold leading-tight line-clamp-2">
              {m.title}
            </div>
            <div className="mt-1 text-sm text-muted">
              ⭐ {m.rating ?? "—"} • {m.durationMins ? `${m.durationMins}m` : "—"}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/80 to-transparent" />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium leading-tight truncate">{m.title}</div>
          <div className="text-muted text-sm mt-1">
            ⭐ {m.rating ?? "—"} • {m.durationMins ? `${m.durationMins}m` : "—"}
          </div>
        </div>

        <div className="shrink-0 text-xs text-muted border border-border rounded-xl px-2 py-1 bg-white/5">
          {m.releaseDate ? new Date(m.releaseDate).getUTCFullYear() : "—"}
        </div>
      </div>
    </motion.div>
  );
}

// ✅ FIXED MOVIE MODAL (Uses Portal + Flex centering)
function MovieModal({ movie, onClose }) {
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Prevent background scroll when modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  if (!movie) return null;

  const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : "—";
  const runtime = movie.durationMins ? `${movie.durationMins}m` : "—";

  // Use Portal to attach to document.body (escapes parent transforms)
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] overflow-y-auto" // Enable scrolling for the modal itself
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative w-full max-w-4xl rounded-3xl border border-border bg-card shadow-glow overflow-hidden my-8"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="p-6 md:p-8 grid md:grid-cols-[260px_1fr] gap-6">
            <div className="relative h-80 md:h-[420px] rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-white/5 via-white/0 to-accent/15">
              {movie.posterUrl && imgOk ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <div className="h-full w-full p-4 flex flex-col justify-end">
                  <div className="text-xs text-muted">{movie.imdbId}</div>
                  <div className="mt-1 font-semibold leading-tight">{movie.title}</div>
                  <div className="mt-2 text-sm text-muted">Poster coming soon</div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/85 to-transparent" />
            </div>

            <div className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {movie.title}
                  </h3>
                  <div className="mt-2 text-muted">
                    ⭐ {movie.rating ?? "—"} • {runtime} • {year}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl border border-border hover:bg-white/5 transition"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white/5 p-4">
                  <div className="text-sm text-muted">IMDb ID</div>
                  <div className="mt-1 font-mono text-sm break-all">{movie.imdbId}</div>

                  <button
                    onClick={() => navigator.clipboard.writeText(movie.imdbId)}
                    className="mt-3 px-4 py-2 rounded-2xl bg-accent text-white hover:opacity-90 transition"
                  >
                    Copy ID
                  </button>
                </div>

                <div className="rounded-2xl border border-border bg-white/5 p-4">
                  <div className="text-sm text-muted">Quick stats</div>
                  <div className="mt-2 text-sm text-text/90">
                    <div>
                      Rating: <span className="text-text">{movie.rating ?? "—"}</span>
                    </div>
                    <div>
                      Runtime: <span className="text-text">{runtime}</span>
                    </div>
                    <div>
                      Year: <span className="text-text">{year}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-muted leading-relaxed">
                {movie.description?.trim() ? movie.description : "No description yet."}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body // Target container
  );
}

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlList = searchParams.get("list");
  const safeUrlList = VALID_LISTS.has(urlList) ? urlList : "top250";

  const [list, setList] = useState(safeUrlList);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const limit = 12;

  useEffect(() => {
    if (safeUrlList !== list) setList(safeUrlList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeUrlList]);

  useEffect(() => {
    setPage(1);
    setSelected(null);
    const next = new URLSearchParams(searchParams);
    next.set("list", list);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const queryKey = useMemo(() => ["movies", list, page, limit], [list, page, limit]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await http.get(
        `/movies/sorted?by=rating&order=desc&list=${list}&page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });

  const movies = data?.data || [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  const currentLabel = LISTS.find((l) => l.key === list)?.label || "Movies";

  useEffect(() => {
    setPage((p) => clamp(p, 1, pages));
  }, [pages]);

  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 select-none"
        >
          <div className="h-10 w-10 rounded-2xl border border-border bg-white/5 grid place-items-center overflow-hidden">
            <div className="h-2.5 w-2.5 rounded-full bg-accent/90 group-hover:scale-110 transition" />
          </div>

          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-lg">
              CineVault
            </div>
            <div className="text-xs text-muted -mt-0.5">
              Home
            </div>
          </div>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{currentLabel}</h2>
          <p className="text-muted mt-1">
            {isFetching ? "Updating…" : `${total} movies • sorted by rating`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <div className="inline-flex rounded-2xl border border-border bg-white/5 p-1">
            {LISTS.map((t) => {
              const active = t.key === list;
              return (
                <button
                  key={t.key}
                  onClick={() => setList(t.key)}
                  className={[
                    "px-4 py-2 rounded-2xl transition",
                    active ? "bg-white/10 shadow-glow" : "hover:bg-white/5 text-muted",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-2xl border border-border hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              Prev
            </button>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="px-4 py-2 rounded-2xl border border-border hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold">Failed to load movies</div>
          <div className="text-muted mt-2 text-sm">{error?.message || "Unknown error"}</div>
        </div>
      ) : null}

      {!isLoading && !isError && movies.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold">No movies found</div>
          <div className="text-muted mt-2 text-sm">
            This list is empty right now. Try syncing again, or switch lists.
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((m, i) => (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
              >
                <MovieCard m={m} onOpen={() => setSelected(m)} />
              </motion.div>
            ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-5 py-3 rounded-2xl border border-border bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition"
        >
          ← Prev
        </button>

        <div className="text-sm text-muted">
          Page <span className="text-text/90">{page}</span> of{" "}
          <span className="text-text/90">{pages}</span>
        </div>

        <button
          disabled={!canNext}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="px-5 py-3 rounded-2xl border border-border bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition"
        >
          Next →
        </button>
      </div>

      <AnimatePresence>
        {selected && <MovieModal movie={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}