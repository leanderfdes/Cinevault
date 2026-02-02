import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";

function Field({ label, type = "text", value, onChange, placeholder, right }) {
  return (
    <label className="block">
      <div className="text-sm text-muted mb-2">{label}</div>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-border bg-white/5 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition"
          required
        />
        {right ? <div className="absolute inset-y-0 right-3 grid place-items-center">{right}</div> : null}
      </div>
    </label>
  );
}

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = useMemo(
    () => location.state?.from || "/",
    [location.state]
  );

  // ✅ production: start empty
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function fillDemo() {
    setEmail("admin@test.com");
    setPassword("secret123");
    setErr("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await http.post("/auth/login", { email, password });
      const token = res?.data?.token;
      if (!token) throw new Error("Token not found in response.");

      login(token);
      nav(from, { replace: true });
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.message ||
        "Login failed. Please check credentials.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left: Brand / pitch */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border bg-card shadow-glow overflow-hidden"
        >
          <div className="p-8">
            <div className="text-sm text-muted">CineVault</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Welcome back.
            </h1>
            <p className="mt-3 text-muted leading-relaxed">
              Sign in to access admin tools (sync/enrich) and manage your library.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-white/5 p-4 text-sm text-muted">
              Tip: If posters are still enriching, give it a minute and refresh —
              the worker updates Mongo in batches.
            </div>
          </div>

          <div className="h-24 border-t border-border bg-gradient-to-r from-white/5 via-accent/10 to-white/5" />
        </motion.div>

        {/* Right: Form */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border bg-card shadow-glow p-8"
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">Login</div>
                <div className="text-sm text-muted mt-1">
                  Use your account to continue
                </div>
              </div>
              <Link
                to="/register"
                className="text-sm text-muted hover:text-text transition"
              >
                Create account →
              </Link>
            </div>

            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Field
              label="Password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-xs text-muted hover:text-text transition"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              }
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={fillDemo}
                className="text-sm text-muted hover:text-text transition"
              >
                Use demo admin
              </button>

              <Link
                to="/"
                className="text-sm text-muted hover:text-text transition"
              >
                Back to Home
              </Link>
            </div>

            {err ? (
              <div className="rounded-2xl border border-border bg-white/5 p-4 text-sm text-red-300">
                {err}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="group relative w-full px-5 py-3 rounded-2xl bg-accent text-white font-medium transition overflow-hidden disabled:opacity-60"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {loading ? "Signing in…" : "Sign in"}
                <span className="translate-x-0 group-hover:translate-x-0.5 transition">
                  →
                </span>
              </span>

              <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                <span className="absolute -inset-10 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-2xl" />
              </span>
            </button>

            <div className="text-sm text-muted">
              By continuing, you agree to your project’s terms & privacy policy.
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
