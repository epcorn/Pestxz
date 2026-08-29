export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  if (req.originalUrl.startsWith("/api/real-route-prefix")) {
    console.warn(`Genuine 404: ${req.originalUrl}`);
  }
  
  return res.status(404).json({ success: false, msg: error });
  // next(error);
};
