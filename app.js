import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

import transactionsRoute from "./routes/transactionsRoute.js";
import authRoute from "./routes/authRoute.js";
import adminRoute from "./routes/adminRoute.js";
import paymentWalletsRoute from "./routes/paymentWalletsRoute.js";
import { requireAuth } from "./middleware/auth.js";
import { me, updateMe } from "./controllers/authController.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();

// Avoid starting cron on serverless platform
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  job.start();
}

// middleware
app.use(rateLimiter);

// Robust CORS configuration
const envOrigins = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
const allowAll = envOrigins.length === 0; // allow any origin unless CORS_ORIGINS is set

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser or same-origin
    if (allowAll) return callback(null, true);
    const allowed = envOrigins.some((o) => {
      if (!o) return false;
      if (o === origin) return true;
      // Support leading wildcard subdomains like *.vercel.app
      if (o.startsWith("*")) {
        const suffix = o.slice(1);
        return origin.endsWith(suffix);
      }
      return false;
    });
    return allowed ? callback(null, true) : callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept"],
  optionsSuccessStatus: 204,
  maxAge: 600,
};

// Allow Chrome PNA preflight header when present
app.use((req, res, next) => {
  if (req.method === "OPTIONS" && req.headers["access-control-request-private-network"] === "true") {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Respond on root with a friendly hint (useful when running standalone server)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "backend", hint: "Use /api/* endpoints" });
});

// Base API root for quick health checks
app.get("/api", (req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoute);
app.use("/api/transactions", transactionsRoute);
app.use("/api/admin", adminRoute);
app.use("/api", paymentWalletsRoute);

// Also expose /api/me to match app client paths
app.get("/api/me", requireAuth, me);
app.patch("/api/me", requireAuth, updateMe);


export const ready = process.env.DATABASE_URL ? initDB() : Promise.resolve();

// Fallback 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

export { PORT };
export default app;
