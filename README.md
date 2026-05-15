# Ledgerly

Paid video call booking platform on Solana. Hosts set availability and rates, callers book and pay USDC via on-chain escrow, both join video calls, and funds auto-distribute when the call ends.

## How it works

A host publishes a booking page with their rate and availability. Callers pick a time slot and deposit USDC into a Conditional escrow (Solana/Anchor). At the scheduled time, both parties join a video call. When the call ends, a webhook triggers automatic fund distribution — configurable fee split between host and platform.

Supports 1:1 calls, group sessions (multiple callers, shared room, individual escrows), and gift bookings (one person pays, another attends via claim link).

Hosts can link a [Flipcash](https://flipcash.me) currency to their profile. Callers holding the host's token get a discount, checked on-chain at booking time. Token purchases happen in-app against mainnet.

## Stack

- Node.js, TypeScript, Express
- PostgreSQL + [PgTyped](https://pgtyped.dev/) (typed SQL compiled to TypeScript)
- Solana/Anchor (USDC escrow via Conditional streams)
- [VidBloq](https://github.com/your-org/vidbloq) SDK for video calls
- Resend for transactional email + ICS calendar invites
- Railway (backend + Postgres), Vercel (frontend)

## Architecture

```
Routes → Services → PgTyped queries (.sql → .queries.ts)
                  → Escrow service (Solana/Anchor)
                  → VidBloq service (server-to-server video API)
                  → Flipcash service (mainnet token balance + instruction building)
                  → Email service (Resend + ICS generation)
                  → Webhook handler (auto-distribute on call end)
```

No ORM. Raw SQL with compile-time type generation. No controllers layer — routes call services directly.

## Key features

**Escrow payments.** Every booking creates a Conditional escrow on Solana. Funds are locked until the call window closes (configurable buffer), then distributed automatically via webhook. If the host no-shows, the caller is refunded. If the caller no-shows, the host gets paid.

**Group sessions.** A host creates a session with a max capacity. Each caller books individually with their own escrow. All callers share one video room. On call end, all escrows are batch-distributed.

**Gifting.** A caller books and pays on behalf of someone else. The recipient receives a claim link, connects their wallet, and joins the call. Refunds always go to the original payer.

**Flipcash token discounts.** Hosts link a Flipcash currency mint. The backend checks the caller's token balance on mainnet before each booking and applies a discount if they meet the threshold. Token purchases are built as serialized Solana instructions, signed by the user on the frontend.

**Email + calendar.** Booking confirmations include an ICS calendar invite with 30-minute and 10-minute reminders. No reminder infrastructure needed — the user's calendar app handles it.

## Setup

```bash
npm install
cp .env.example .env    # Fill in required values
npm run migrate          # Run database migrations
npm run typegen          # Generate PgTyped types (requires DATABASE_URL)
npm run dev              # Start dev server
```

## Deploy

```bash
# Build
npm run build    # tsup + copies IDL to dist/

# Production start (Railway)
npm run migrate && node dist/index.js
```

Migrations run on every deploy and are tracked in a `_migrations` table — safe to re-run.

## Environment

See [`.env.example`](.env.example) for all configuration options. Required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `SOLANA_RPC_URL` — Solana RPC endpoint
- `PLATFORM_KEYPAIR_PATH` — Platform wallet keypair (signs escrow operations)
- `USDC_MINT` — USDC token mint address
- `VIDBLOQ_API_URL`, `VIDBLOQ_API_KEY`, `VIDBLOQ_API_SECRET` — Video API credentials

Optional: `RESEND_API_KEY` (email), `FLIPCASH_RPC_URL` (mainnet token checks), `VIDBLOQ_WEBHOOK_SECRET` (auto-distribution).

## Related

- [Ledgerly Frontend](https://github.com/ChiamakaUI/ledgerly-ui) — Next.js 14, Tailwind, Privy auth
