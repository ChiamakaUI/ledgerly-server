import dotenv from "dotenv";
dotenv.config();

import express from "express";
// import cors from "cors";
import { loadEnv, env } from "./config/env.js";
import {
  hostRoutes,
  bookingRoutes,
  webhookRoutes,
  bookingSessionRoutes,
  // flipcashRoutes
} from "./routes/index.js";
import { startCronJobs } from "./services/index.js";

loadEnv();

const app = express();

// app.use(cors({
//   origin: process.env.NODE_ENV === "production"
//     ? ["https://ledgerl.netlify.app"]
//     : ["http://localhost:3000"],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "x-wallet-address", "Authorization"],
// }));

app.use((req, res, next) => {
  const allowedOrigins = [env().FRONTEND_URL, "http://localhost:3000", "https://ledgerl.netlify.app"];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-wallet-address",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Capture raw body for webhook signature verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/hosts", hostRoutes.default);
app.use("/api/bookings", bookingRoutes.default);
app.use("/api/webhooks", webhookRoutes.default);
app.use("/api/sessions", bookingSessionRoutes.default);
// app.use("/api/flipcash", flipcashRoutes.default);

const PORT = parseInt(env().PORT);

app.listen(PORT, () => {
  console.log(`\n🚀 Paid Calendly API running on port ${PORT}`);
  console.log(`   Environment: ${env().NODE_ENV}`);
  console.log(`   RPC:         ${env().SOLANA_RPC_URL}`);
  console.log(`   USDC Mint:   ${env().USDC_MINT}\n`);

  startCronJobs();
});

export default app;
