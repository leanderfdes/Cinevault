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

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/admin", adminRoutes);
app.use("/admin", adminQueueRoutes);

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / tools like curl/postman (no origin header)
    if (!origin) return cb(null, true);
    if (origins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  }
}));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
