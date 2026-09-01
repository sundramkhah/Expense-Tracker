const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const details = err.details || null;

  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  if (process.env.NODE_ENV === 'development') console.error(err);

  res.status(statusCode).json({ success: false, statusCode, message, details });
};

export default errorMiddleware;
