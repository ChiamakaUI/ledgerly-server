import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { loadEnv, env } from "./config/env.js";
import { hostRoutes, bookingRoutes } from "./routes/index.js";
import { startCronJobs } from "./services/index.js";


loadEnv();

const app = express();


app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://your-frontend.vercel.app"]
    : ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-wallet-address", "Authorization"],
}));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/hosts", hostRoutes.default);
app.use("/api/bookings", bookingRoutes.default);

const PORT = parseInt(env().PORT);

app.listen(PORT, () => {
  console.log(`\n🚀 Paid Calendly API running on port ${PORT}`);
  console.log(`   Environment: ${env().NODE_ENV}`);
  console.log(`   RPC:         ${env().SOLANA_RPC_URL}`);
  console.log(`   USDC Mint:   ${env().USDC_MINT}\n`);

  startCronJobs();
});

export default app;
