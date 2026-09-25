// Backend URL. In development the React dev server (port 3000) talks to the API on port 8000;
// in production the backend serves this app itself, so API calls are same-origin.
// Override by setting REACT_APP_API_URL in a .env file.
export const API_URL =
  process.env.REACT_APP_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');
