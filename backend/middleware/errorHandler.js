const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  const response = {
    message: err.message
  };
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  res.json(response);
};

module.exports = errorHandler;
