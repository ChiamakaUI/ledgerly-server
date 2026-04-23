import crypto from "crypto";
import { getPool, camelizeKeys } from "../config/index.js";
import { env } from "../config/env.js";
import { getBookingWithHost } from "../queries/booking.queries.js";
import {
  recordCallerJoined,
  recordHostJoined,
  completeBooking,
} from "../queries/booking.queries.js";
import { distributeWithFee } from "./escrow.service.js";

// ============================================
// Webhook signature verification
// ============================================

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ============================================
// Webhook event types
// ============================================

export interface VidbloqWebhookEvent {
  event: string;
  roomName: string;
  participant?: {
    identity: string;
    name?: string;
  };
  timestamp: number;
}

// ============================================
// Handle incoming webhook from Vidbloq
// ============================================

export async function handleVidbloqWebhook(
  event: VidbloqWebhookEvent
): Promise<void> {
  const pool = getPool();

  console.log(
    `[WEBHOOK] Processing ${event.event} for room ${event.roomName}`
  );

  switch (event.event) {
    case "participant_joined":
      await handleParticipantJoined(event);
      break;

    case "participant_left":
      // Log but don't act — we act on room_finished instead
      console.log(
        `[WEBHOOK] Participant left: ${event.participant?.identity} from ${event.roomName}`
      );
      break;

    case "room_finished":
      await handleRoomFinished(event);
      break;

    default:
      console.log(`[WEBHOOK] Unhandled event type: ${event.event}`);
  }
}

// ============================================
// Handle participant_joined
// ============================================

async function handleParticipantJoined(
  event: VidbloqWebhookEvent
): Promise<void> {
  const pool = getPool();

  if (!event.participant?.identity) return;

  // Find the booking by vidbloq_room
  // We need a query that looks up by vidbloq_room — use raw query
  // since we don't have a PgTyped query for this
  const result = await pool.query(
    `SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name
     FROM bookings b
     JOIN hosts h ON b.host_id = h.id
     WHERE b.vidbloq_room = $1
     AND b.status IN ('paid', 'active')
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [event.roomName]
  );

  if (result.rows.length === 0) {
    console.log(
      `[WEBHOOK] No active booking found for room ${event.roomName}`
    );
    return;
  }

  const booking = camelizeKeys<any>(result.rows[0]);
  const participantWallet = event.participant.identity;

  // Vidbloq participant identity is the participant DB id, not the wallet.
  // We need to check the participant metadata to get the wallet.
  // For now, we rely on the metadata name matching.
  // The robust solution: Vidbloq should include wallet in the webhook payload.

  // Record join based on participant identity
  // Since we can't reliably map participant ID to wallet from the webhook alone,
  // this is handled by the /join endpoint instead (which already records joins).
  console.log(
    `[WEBHOOK] Participant joined room ${event.roomName}: ${event.participant.identity}`
  );
}

// ============================================
// Handle room_finished — auto-distribute
// ============================================

async function handleRoomFinished(event: VidbloqWebhookEvent): Promise<void> {
  const pool = getPool();

  // Find the booking by vidbloq_room
  const result = await pool.query(
    `SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name
     FROM bookings b
     JOIN hosts h ON b.host_id = h.id
     WHERE b.vidbloq_room = $1
     AND b.status IN ('paid', 'active')
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [event.roomName]
  );

  if (result.rows.length === 0) {
    console.log(
      `[WEBHOOK] No active booking found for room ${event.roomName}`
    );
    return;
  }

  const booking = camelizeKeys<any>(result.rows[0]);

  console.log(
    `[WEBHOOK] Room finished for booking ${booking.id} (status: ${booking.status})`
  );

  // Only auto-distribute if both parties joined
  if (!booking.callerJoinedAt || !booking.hostJoinedAt) {
    console.log(
      `[WEBHOOK] Skipping auto-distribute — not both parties joined. ` +
        `Caller joined: ${!!booking.callerJoinedAt}, Host joined: ${!!booking.hostJoinedAt}`
    );
    return;
  }

  // Check call duration meets minimum threshold
  const callStartTime = new Date(
    booking.callStartedAt || booking.hostJoinedAt
  ).getTime();
  const callDuration = (Date.now() - callStartTime) / 60000; // minutes
  const minDurationPercent = parseInt(env().MIN_CALL_DURATION_PERCENT);
  const requiredMinutes =
    (booking.durationMinutes * minDurationPercent) / 100;

  if (callDuration < requiredMinutes) {
    console.log(
      `[WEBHOOK] Call too short for auto-distribute. ` +
        `Duration: ${callDuration.toFixed(1)}min, Required: ${requiredMinutes}min. ` +
        `Booking ${booking.id} left for manual review.`
    );
    return;
  }

  // Auto-distribute!
  try {
    console.log(
      `[WEBHOOK] Auto-distributing for booking ${booking.id}: ` +
        `${booking.amount} to ${booking.hostWallet} (fee: ${booking.feePercentage} bps)`
    );

    const distributeResult = await distributeWithFee({
      streamName: booking.streamName,
      hostWallet: booking.hostWallet,
      totalAmount: Number(booking.amount),
      feeBps: booking.feePercentage,
    });

    await completeBooking.run(
      {
        id: booking.id,
        distributeSignature: distributeResult.hostSignature,
      },
      pool
    );

    console.log(
      `[WEBHOOK] ✅ Auto-distributed for booking ${booking.id}. ` +
        `Host: ${distributeResult.hostAmount}, Fee: ${distributeResult.feeAmount}`
    );
  } catch (err) {
    console.error(
      `[WEBHOOK] ❌ Auto-distribute failed for booking ${booking.id}:`,
      err
    );
    // Don't throw — the webhook was received successfully.
    // The booking stays in 'active' status for manual resolution.
  }
}