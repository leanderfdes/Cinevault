import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { useEffect } from "react";

const GITHUB_URL = "https://github.com/leanderfdes";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent/80" />
      {children}
    </span>
  );
}

function FeatureCard({ title, desc, to, cta }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group rounded-3xl border border-border bg-card p-5 hover:bg-white/5 hover:shadow-glow transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-muted leading-relaxed">{desc}</div>
        </div>

        <div className="shrink-0 h-10 w-10 rounded-2xl border border-border bg-white/5 grid place-items-center">
          <div className="h-2 w-2 rounded-full bg-accent/80" />
        </div>
      </div>

      <div className="mt-4">
        <Link
          to={to}
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
        >
          {cta}
          <span className="inline-block translate-x-0 group-hover:translate-x-0.5 transition">
            →
          </span>
        </Link>
      </div>

      <div className="pointer-events-none mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  // Gentle parallax (no hover gating)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.2 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.2 });

  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-8, 8]);

  useEffect(() => {
    if (reduceMotion) return;

    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mx.set(e.clientX / w - 0.5);
      my.set(e.clientY / h - 0.5);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduceMotion]);

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <motion.div
        style={
          reduceMotion
            ? undefined
            : { rotateX, rotateY, transformStyle: "preserve-3d" }
        }
        className="relative rounded-[2rem] border border-border bg-card shadow-glow overflow-hidden"
      >
        {/* Premium background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <motion.div
            className="absolute inset-0 opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.8 }}
            style={{
              background:
                "radial-gradient(1200px 500px at 20% 10%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(900px 500px at 80% 40%, rgba(120,120,255,0.08), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(255,255,255,0.06), transparent 55%)",
            }}
          />

          {/* Soft grain */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="relative p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Pill>Curated lists</Pill>
              <Pill>Posters + details</Pill>
              <Pill>Fast + fluid</Pill>
            </div>

            <div className="mt-6">
              <div className="text-sm text-muted">CineVault</div>
              <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight">
                Discover cinema worth{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-accent/90">
                  your time
                </span>
                .
              </h1>

              <p className="mt-4 text-muted max-w-2xl leading-relaxed">
                Browse premium collections like the Top 250 and Japanese Anime
                Top 50,designed for smooth exploration, rich metadata, and
                poster-first browsing.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/movies"
                className="group relative px-5 py-3 rounded-2xl bg-accent text-white font-medium transition overflow-hidden"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  Explore Movies
                  <span className="translate-x-0 group-hover:translate-x-0.5 transition">
                    →
                  </span>
                </span>

                <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                  <span className="absolute -inset-10 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-2xl" />
                </span>
              </Link>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl border border-border text-text/90 hover:bg-white/5 transition"
              >
                GitHub
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="Top 250"
                desc="High-rated classics and modern giants — sorted, searchable, and poster-ready."
                to="/movies"
                cta="Open list"
              />
              <FeatureCard
                title="Anime Top 50 (Japanese)"
                desc="Japanese-language animation picks — curated and enriched with posters and overviews."
                to="/movies"
                cta="Open list"
              />
            </div>

            <div className="mt-8 text-xs text-muted">
              Built for speed, designed for delight.{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-text/80 hover:text-text underline underline-offset-4 transition"
              >
                View source
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bottom animated rail */}
        <motion.div
          className="relative h-20 md:h-24 border-t border-border bg-gradient-to-r from-white/5 via-accent/10 to-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {!reduceMotion && (
            <motion.div
              className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl"
              animate={{ x: ["-30%", "130%"] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
