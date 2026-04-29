import crypto from "crypto";
import { getPool, camelizeKeys, env } from "../config/index.js";
import { completeBooking } from "../queries/booking.queries.js";
import { distributeWithFee } from "./escrow.service.js";
import { distributeSession } from "./booking-session.service.js";

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
  console.log(
    `[WEBHOOK] Processing ${event.event} for room ${event.roomName}`
  );

  switch (event.event) {
    case "participant_joined":
      console.log(
        `[WEBHOOK] Participant joined room ${event.roomName}: ${event.participant?.identity}`
      );
      break;

    case "participant_left":
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
// Handle room_finished — auto-distribute
// Supports both 1:1 bookings and group sessions
// ============================================

async function handleRoomFinished(event: VidbloqWebhookEvent): Promise<void> {
  const pool = getPool();

  // First check if this room belongs to a session (group call)
  const sessionResult = await pool.query(
    `SELECT s.*, h.wallet_address as host_wallet, h.fee_percentage
     FROM sessions s
     JOIN hosts h ON s.host_id = h.id
     WHERE s.vidbloq_room = $1
     AND s.status IN ('open', 'full', 'active')
     LIMIT 1`,
    [event.roomName]
  );

  if (sessionResult.rows.length > 0) {
    // Group session — distribute all bookings
    await handleGroupSessionFinished(
      camelizeKeys<any>(sessionResult.rows[0]),
      event
    );
    return;
  }

  // Otherwise, check for a 1:1 booking
  const bookingResult = await pool.query(
    `SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name
     FROM bookings b
     JOIN hosts h ON b.host_id = h.id
     WHERE b.vidbloq_room = $1
     AND b.status IN ('paid', 'active')
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [event.roomName]
  );

  if (bookingResult.rows.length === 0) {
    console.log(
      `[WEBHOOK] No active booking or session found for room ${event.roomName}`
    );
    return;
  }

  const booking = camelizeKeys<any>(bookingResult.rows[0]);
  await handleOneOnOneFinished(booking, event);
}

// ============================================
// Handle 1:1 booking room_finished
// ============================================

async function handleOneOnOneFinished(
  booking: any,
  event: VidbloqWebhookEvent
): Promise<void> {
  const pool = getPool();

  console.log(
    `[WEBHOOK] Room finished for 1:1 booking ${booking.id} (status: ${booking.status})`
  );

  // Only auto-distribute if both parties joined
  if (!booking.callerJoinedAt || !booking.hostJoinedAt) {
    console.log(
      `[WEBHOOK] Skipping auto-distribute — not both parties joined. ` +
        `Caller: ${!!booking.callerJoinedAt}, Host: ${!!booking.hostJoinedAt}`
    );
    return;
  }

  // Check call duration meets minimum threshold
  const callStartTime = new Date(
    booking.callStartedAt || booking.hostJoinedAt
  ).getTime();
  const callDuration = (Date.now() - callStartTime) / 60000;
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

  await attemptDistribute(booking);
}

// ============================================
// Handle group session room_finished
// ============================================

async function handleGroupSessionFinished(
  session: any,
  event: VidbloqWebhookEvent
): Promise<void> {
  console.log(
    `[WEBHOOK] Room finished for group session ${session.id} ` +
      `(status: ${session.status}, max: ${session.maxParticipants})`
  );

  // For group sessions, check if the session has been active long enough
  const scheduledTime = new Date(session.scheduledAt).getTime();
  const minDurationPercent = parseInt(env().MIN_CALL_DURATION_PERCENT);
  const requiredMinutes =
    (session.durationMinutes * minDurationPercent) / 100;
  const elapsedMinutes = (Date.now() - scheduledTime) / 60000;

  if (elapsedMinutes < requiredMinutes) {
    console.log(
      `[WEBHOOK] Session too short for auto-distribute. ` +
        `Elapsed: ${elapsedMinutes.toFixed(1)}min, Required: ${requiredMinutes}min. ` +
        `Session ${session.id} left for manual review.`
    );
    return;
  }

  // Calculate unlock time
  const bufferMinutes = parseInt(env().UNLOCK_BUFFER_MINUTES);
  const unlockTime =
    scheduledTime +
    (session.durationMinutes + bufferMinutes) * 60 * 1000;

  if (Date.now() < unlockTime) {
    const waitMs = Math.max(unlockTime - Date.now() + 5000, 5000);

    console.log(
      `[WEBHOOK] Session ${session.id} escrows still locked. ` +
        `Retrying batch distribute in ${Math.ceil(waitMs / 1000)}s`
    );

    setTimeout(async () => {
      try {
        const result = await distributeSession(session.id);
        console.log(
          `[WEBHOOK] ✅ Retry batch distributed for session ${session.id}: ` +
            `${result.distributed} succeeded, ${result.failed} failed`
        );
      } catch (err) {
        console.error(
          `[WEBHOOK] ❌ Retry batch distribute failed for session ${session.id}:`,
          err
        );
      }
    }, waitMs);

    return;
  }

  // Escrows unlocked — distribute immediately
  try {
    const result = await distributeSession(session.id);
    console.log(
      `[WEBHOOK] ✅ Batch distributed for session ${session.id}: ` +
        `${result.distributed} succeeded, ${result.failed} failed`
    );
  } catch (err) {
    console.error(
      `[WEBHOOK] ❌ Batch distribute failed for session ${session.id}:`,
      err
    );
  }
}

// ============================================
// Attempt distribute with TimeLocked retry
// ============================================

async function attemptDistribute(booking: any): Promise<void> {
  const pool = getPool();

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
  } catch (err: any) {
    if (err.message?.includes("TimeLocked")) {
      // Calculate when it unlocks and retry
      const unlockTime =
        new Date(booking.scheduledAt).getTime() +
        (booking.durationMinutes + 15) * 60 * 1000;
      const waitMs = Math.max(unlockTime - Date.now() + 5000, 5000);

      console.log(
        `[WEBHOOK] Escrow still locked for booking ${booking.id}. ` +
          `Retrying in ${Math.ceil(waitMs / 1000)}s`
      );

      setTimeout(async () => {
        try {
          const retryResult = await distributeWithFee({
            streamName: booking.streamName,
            hostWallet: booking.hostWallet,
            totalAmount: Number(booking.amount),
            feeBps: booking.feePercentage,
          });

          await completeBooking.run(
            {
              id: booking.id,
              distributeSignature: retryResult.hostSignature,
            },
            pool
          );

          console.log(
            `[WEBHOOK] ✅ Retry auto-distributed for booking ${booking.id}. ` +
              `Host: ${retryResult.hostAmount}, Fee: ${retryResult.feeAmount}`
          );
        } catch (retryErr) {
          console.error(
            `[WEBHOOK] ❌ Retry auto-distribute failed for booking ${booking.id}:`,
            retryErr
          );
        }
      }, waitMs);
    } else {
      console.error(
        `[WEBHOOK] ❌ Auto-distribute failed for booking ${booking.id}:`,
        err
      );
    }
  }
}