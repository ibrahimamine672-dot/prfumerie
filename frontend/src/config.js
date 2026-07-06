const API_URL = process.env.REACT_APP_API_URL
  // Docker / custom env override
  ? process.env.REACT_APP_API_URL
  // Production: relative path (nginx proxy handles /api/ -> backend)
  : process.env.NODE_ENV === 'production'
  ? '/api'
  // Local dev: direct backend access
  : 'http://localhost:5002/api';

export default API_URL;
