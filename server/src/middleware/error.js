function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Server error"
  });
}

module.exports = { notFound, errorHandler };
