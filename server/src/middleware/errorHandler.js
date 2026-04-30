export default function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    error: error.error || (process.env.NODE_ENV === "development" ? error.stack : undefined),
    code: error.code,
    data: error.data,
    statusCode,
  });
}
