const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // 100 requests per window
  message: { message: "Too many requests from this IP, please try again later." }
});

module.exports = apiLimiter;
