exports.tryCatch = (method) => async (req, res, next) => {
  try {
    await method(req, res, next);
  } catch (error) {
    return next(error);
  }
};
