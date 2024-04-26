
exports.responseCodes = {
  codeSwithching : 1002,             // 101 Switching Protocols
  codeSuccess : 1003,                //  success(Create, Get)
  codeUpdated : 1004,                // updated
  codeNoContentAvailable : 1006,   // No Content Available in the request
  codeBadRequest : 1007,            // Bad Request ( Incorrect Data Format, Missing Tags )
  codeUnauthorized : 1008,           // Unauthorized Access (Trying access which is not assigned to the person)
  codeForbiddenAccess : 1009,       // Forbidden Access
  codePageNotFound : 1010,         // Page Not Found
  codeMethodNotAllowed : 1011,     // Method Not Allowed
  codeUnprocessableEntity : 1012,   // Unprocessable Entity / invalid request
  codeInternalError : 1013,         // Internal Server Error,
  codeTokenExpired : 1014,          // Access token expired
  codeRefreshTokenExpired : 1015,   // Refresh Token expired
  codeDomainExists : 1016,   // Refresh Token expired
  codePlacementExists : 1017,  //
};

exports.httpCodes = {
  code100 : 100,  // 100 Informational
  code200 : 200,  // Successful request, often a GET
  code201 : 201,  // Successful request after a create, usually a POST
  code204 : 204,  // Successful request with no content returned, usually a PUT or PATCH
  code301 : 301,  // Permanently redirect to another endpoint
  code304 : 304,  // 304 Not Modified
  code400 : 400,  // Bad request (client should modify the request)
  code401 : 401,  // Unauthorized, credentials not recognized
  code403 : 403,  // Forbidden, credentials accepted but don’t have permission
  code404 : 404,  // Not found, the resource does not exist
  code422 : 422,  // Unprocessable Content
  code429 : 429,  // Too many requests, used for rate limiting and should include retry headers
  code405 : 405,  // 405 Method Not Allowed
  code500 : 500,  // Server error, generic and worth looking at other 500-level errors instead
  code503 : 503,   // Service unavailable, another where retry headers are useful
};

