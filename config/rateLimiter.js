const rateLimit = require('express-rate-limit');

// Apply rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50000, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

module.exports = { limiter };