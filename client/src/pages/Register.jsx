import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";

function Field({ label, type = "text", value, onChange, placeholder, right, autoComplete }) {
  return (
    <label className="block">
      <div className="text-sm text-muted mb-2">{label}</div>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-border bg-white/5 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition"
          required
        />
        {right ? <div className="absolute inset-y-0 right-3 grid place-items-center">{right}</div> : null}
      </div>
    </label>
  );
}

function validateEmail(email) {
  // simple + good enough
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function passwordScore(pw) {
  const s = String(pw || "");
  let score = 0;
  if (s.length >= 8) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  return { ok: s.length >= 6, score };
}

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const pw = useMemo(() => passwordScore(password), [password]);
  const matches = confirm.length ? password === confirm : true;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const eTrim = email.trim();

    if (!validateEmail(eTrim)) return setErr("Please enter a valid email address.");
    if (!pw.ok) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      await http.post("/auth/register", { email: eTrim, password });

      // Auto-login
      const res = await http.post("/auth/login", { email: eTrim, password });
      const token = res?.data?.token;
      if (!token) throw new Error("Registered, but login token was not returned.");

      login(token);
      nav("/movies?list=top250", { replace: true });
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.message ||
        "Registration failed.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  const strengthLabel =
    pw.score <= 1 ? "Weak" : pw.score === 2 ? "Okay" : pw.score === 3 ? "Good" : "Strong";

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-border bg-card shadow-glow overflow-hidden"
      >
        <div className="p-8 md:p-10 grid md:grid-cols-2 gap-8">
          {/* copy */}
          <div>
            <div className="text-sm text-muted">CineVault</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Create your account.
            </h1>
            <p className="mt-3 text-muted leading-relaxed">
              Sign up to access admin tools (sync/enrich) and manage your library securely.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-white/5 p-4 text-sm text-muted">
              After signup, you’ll be automatically logged in.
            </div>

            <div className="mt-6 text-xs text-muted">
              Tip: Use a stronger password (8+ chars, numbers, symbols) for a better score.
            </div>
          </div>

          {/* form */}
          <div className="rounded-3xl border border-border bg-white/5 p-6 md:p-7">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold">Sign up</div>
                  <div className="text-sm text-muted mt-1">
                    Create an account to continue
                  </div>
                </div>
                <Link
                  to="/login"
                  className="text-sm text-muted hover:text-text transition"
                >
                  Already have an account →
                </Link>
              </div>

              <Field
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                label="Password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
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

              {/* strength row */}
              <div className="flex items-center justify-between text-xs">
                <div className="text-muted">
                  Strength: <span className="text-text/90">{strengthLabel}</span>
                </div>
                <div className="text-muted">
                  {pw.ok ? "✓ Minimum length OK" : "Min 6 characters"}
                </div>
              </div>

              <Field
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                right={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-xs text-muted hover:text-text transition"
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                }
              />

              {!matches ? (
                <div className="text-xs text-red-300">
                  Passwords don’t match.
                </div>
              ) : null}

              {err ? (
                <div className="rounded-2xl border border-border bg-black/20 p-4 text-sm text-red-300">
                  {err}
                </div>
              ) : null}

              <button
                disabled={loading}
                className="group relative w-full px-5 py-3 rounded-2xl bg-accent text-white font-medium transition overflow-hidden disabled:opacity-60"
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  {loading ? "Creating…" : "Create account"}
                  <span className="translate-x-0 group-hover:translate-x-0.5 transition">→</span>
                </span>
                <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                  <span className="absolute -inset-10 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-2xl" />
                </span>
              </button>

              <div className="text-xs text-muted leading-relaxed">
                By signing up, you agree to the Terms and Privacy Policy.
              </div>
            </form>
          </div>
        </div>

        <div className="h-20 border-t border-border bg-gradient-to-r from-white/5 via-accent/10 to-white/5" />
      </motion.div>
    </div>
  );
}
