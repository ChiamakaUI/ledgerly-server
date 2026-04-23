import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database
  DATABASE_URL: z.string().url(),

  // Solana
  SOLANA_RPC_URL: z.string().url(),
  PLATFORM_KEYPAIR_PATH: z.string(), // path to keypair.json
  USDC_MINT: z.string().min(32),     // USDC mint address

  // Platform fee
  PLATFORM_FEE_WALLET: z.string().min(32),   // wallet that collects fees
  DEFAULT_FEE_BPS: z.string().default("500"), // 500 = 5% in basis points

  // Booking config
  PAYMENT_EXPIRY_MINUTES: z.string().default("15"),
  UNLOCK_BUFFER_MINUTES: z.string().default("15"),  // added to scheduled end time
  MIN_CALL_DURATION_PERCENT: z.string().default("80"), // % of scheduled duration for auto-distribute

  // Vidbloq API (server-to-server)
  VIDBLOQ_API_URL: z.string().url(),
  VIDBLOQ_API_KEY: z.string().min(1),
  VIDBLOQ_API_SECRET: z.string().min(1),
  VIDBLOQ_WEBHOOK_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env;

export function loadEnv(): Env {
  if (_env) return _env;

  _env = envSchema.parse(process.env);
  return _env;
}

export function env(): Env {
  if (!_env) {
    throw new Error("Environment not loaded. Call loadEnv() first.");
  }
  return _env;
}