require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const { notFound, errorHandler } = require("./middleware/error");
const authRoutes = require("./routes/auth.routes");
const movieRoutes = require("./routes/movie.routes");
const adminRoutes = require("./routes/admin.routes");
const adminQueueRoutes = require("./routes/admin.queue.routes");

const app = express();

// --- Middleware (Order Matters) ---
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 1. FIX: Move CORS to the top, before ANY routes
app.use(cors({
  origin: (origin, cb) => {
    // 1. Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return cb(null, true);

    // 2. Allow if explicitly listed in .env (localhost, production domain)
    if (origins.includes(origin)) return cb(null, true);

    // 3. SMART FIX: Allow ANY Vercel preview deployment automatically
    if (origin.endsWith(".vercel.app")) return cb(null, true);

    // Otherwise, block
    return cb(new Error("Not allowed by CORS"));
  }
}));

// 2. FIX: Add a root route to stop the 404 errors in logs
app.get("/", (_req, res) => {
  res.status(200).json({ 
    message: "CineVault API is running 🚀", 
    docs: "https://github.com/leanderfdes/Cinevault" 
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Routes ---
app.use("/admin", adminRoutes);
app.use("/admin", adminQueueRoutes);
app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;