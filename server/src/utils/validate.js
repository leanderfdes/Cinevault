function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    if (!result.success) {
      const err = new Error(result.error.issues.map(i => i.message).join(", "));
      err.statusCode = 400;
      return next(err);
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { validate };
