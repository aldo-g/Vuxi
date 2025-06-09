const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Log every request that comes through this middleware
  console.log(`[Auth Middleware] Checking route: ${req.originalUrl}`);

  const authHeader = req.header('Authorization');

  // Check if the Authorization header exists at all
  if (!authHeader) {
    console.log('[Auth Middleware] FAILED: No Authorization header found.');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if the token is in the correct 'Bearer <token>' format
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    console.log('[Auth Middleware] FAILED: Authorization header is malformed.');
    return res.status(401).json({ error: 'Token is malformed.' });
  }
  
  const token = tokenParts[1];
  if (!token || token === 'null' || token === 'undefined') {
      console.log('[Auth Middleware] FAILED: Token is null or undefined after split.');
      return res.status(401).json({ msg: 'No token provided.' });
  }

  // Try to verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Success! Log the user ID from the token
    console.log(`[Auth Middleware] SUCCESS: Token verified for user ID: ${decoded.user.id}`);
    
    req.user = decoded.user;
    next();
  } catch (err) {
    // Failure! Log the specific error message from the JWT library
    console.log(`[Auth Middleware] FAILED: Token verification error: ${err.message}`);
    
    res.status(401).json({ msg: `Token is not valid (${err.message})` });
  }
};