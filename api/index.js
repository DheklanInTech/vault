import app, { ready } from "../app.js";

export default async function handler(req, res) {
  await ready;
  // Ensure Express sees the same /api prefix used in app.js
  // This helps when the hosting platform strips the function mountpoint.
  if (!req.url.startsWith("/api")) {
    req.url = req.url === "/" ? "/api" : `/api${req.url}`;
  }
  return app(req, res);
}
