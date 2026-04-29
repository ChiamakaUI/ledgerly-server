import { nanoid } from "nanoid";
import { getPool, camelizeKeys, env } from "../config/index.js";
import {} from "../config/env.js";
import {
  createSession,
  getSessionById,
  getSessionsByHostId,
  getUpcomingSessionsByHostId,
  getOpenSessionsBySlug,
  getSessionBookingCount,
  getSessionPaidBookings,
  updateSessionStatus,
  updateSessionStatusToFull,
  cancelSession,
} from "../queries/session.queries.js";
import {
  createBooking,
  getBookingById,
  getPaidBookingsBySessionId,
  completeBooking,
} from "../queries/booking.queries.js";
import { getHostBySlug } from "../queries/hosts.queries.js";
import {
  initializeEscrow,
  buildDepositInstruction,
  distributeWithFee,
  refundEscrow,
} from "./escrow.service.js";
import type {
  CreateSessionRequest,
  BookSessionRequest,
  SerializedInstruction,
} from "../types/index.js";

// ============================================
// Create a session (host action)
// ============================================

export async function createSessionRecord(data: CreateSessionRequest) {
  const pool = getPool();

  const hostsRaw = await getHostBySlug.run({ slug: data.hostSlug }, pool);
  const host: any = hostsRaw[0] ? camelizeKeys(hostsRaw[0]) : null;
  if (!host) throw new Error("Host not found");
  if (!host.isActive) throw new Error("Host is not accepting bookings");

  const scheduledAt = new Date(data.scheduledAt);
  if (scheduledAt.getTime() < Date.now()) {
    throw new Error("Cannot create a session in the past");
  }

  if (data.maxParticipants < 1) {
    throw new Error("maxParticipants must be at least 1");
  }

  const rate = data.rate || Number(host.rate);
  const durationMinutes = data.durationMinutes || host.durationMinutes;

  const sessions = await createSession.run(
    {
      hostId: host.id,
      title: data.title,
      description: data.description || null,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes,
      rate,
      maxParticipants: data.maxParticipants,
      sessionType: data.sessionType,
    },
    pool,
  );

  // Re-fetch with host info
  const full = await getSessionById.run({ id: sessions[0].id }, pool);
  return camelizeKeys(full[0]);
}

// ============================================
// Book into a session (caller action)
// ============================================

export async function bookSession(data: BookSessionRequest): Promise<{
  booking: any;
  depositInstruction: SerializedInstruction;
  accounts: { streamPDA: string; streamATA: string; donorPDA: string };
  paymentExpiresAt: string;
  session: any;
}> {
  const pool = getPool();

  // 1. Get session with host info
  const sessionsRaw = await getSessionById.run({ id: data.sessionId }, pool);
  const session: any = sessionsRaw[0] ? camelizeKeys(sessionsRaw[0]) : null;
  if (!session) throw new Error("Session not found");

  if (session.status !== "open") {
    throw new Error(
      session.status === "full"
        ? "This session is fully booked"
        : `Cannot book a session with status: ${session.status}`,
    );
  }

  if (new Date(session.scheduledAt).getTime() < Date.now()) {
    throw new Error("This session has already started");
  }

  // 2. Check capacity
  const countResult = await getSessionBookingCount.run(
    { sessionId: data.sessionId },
    pool,
  );
  const currentCount = countResult[0]?.count || 0;
  if (currentCount >= session.maxParticipants) {
    // Mark as full
    await updateSessionStatusToFull.run({ id: data.sessionId }, pool);
    throw new Error("This session is fully booked");
  }

  // 3. Initialize escrow
  const bufferMinutes = parseInt(env().UNLOCK_BUFFER_MINUTES);
  const unlockTime = Math.floor(
    (new Date(session.scheduledAt).getTime() +
      (session.durationMinutes + bufferMinutes) * 60 * 1000) /
      1000,
  );

  const streamName = `ses-${nanoid(10)}`;
  const amount = Number(session.rate);

  const escrowResult = await initializeEscrow({
    streamName,
    unlockTime,
    minAmount: amount,
  });

  // 4. Build deposit instruction
  const depositResult = await buildDepositInstruction({
    streamName,
    callerWallet: data.callerWallet,
    amount,
  });

  // 5. Payment expiry
  const expiryMinutes = parseInt(env().PAYMENT_EXPIRY_MINUTES);
  const paymentExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // 6. Create booking linked to session
  const bookings = await createBooking.run(
    {
      hostId: session.hostId,
      callerWallet: data.callerWallet,
      callerName: data.callerName,
      callerEmail: data.callerEmail,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      timezone: "UTC",
      amount,
      streamName,
      streamPda: escrowResult.streamPDA,
      streamAta: escrowResult.streamATA,
      donorPda: depositResult.donorPDA,
      paymentExpiresAt: paymentExpiresAt.toISOString(),
      sessionId: data.sessionId,
    },
    pool,
  );

  // 7. Check if session is now full
  if (currentCount + 1 >= session.maxParticipants) {
    await updateSessionStatusToFull.run({ id: data.sessionId }, pool);
  }

  // Re-fetch booking with host info
  const fullBooking = await getBookingById.run({ id: bookings[0].id }, pool);

  return {
    booking: camelizeKeys(fullBooking[0]),
    depositInstruction: depositResult.instruction,
    accounts: {
      streamPDA: escrowResult.streamPDA,
      streamATA: escrowResult.streamATA,
      donorPDA: depositResult.donorPDA,
    },
    paymentExpiresAt: paymentExpiresAt.toISOString(),
    session: camelizeKeys(session),
  };
}

// ============================================
// Get session details (public)
// ============================================

export async function getSession(sessionId: string) {
  const pool = getPool();
  const result = await getSessionById.run({ id: sessionId }, pool);
  if (!result[0]) return null;

  const session = camelizeKeys<any>(result[0]);

  // Add booking count
  const countResult = await getSessionBookingCount.run({ sessionId }, pool);
  session.currentParticipants = countResult[0]?.count || 0;
  session.spotsRemaining =
    session.maxParticipants - session.currentParticipants;

  return session;
}

// ============================================
// List sessions for a host
// ============================================

export async function listHostSessions(
  hostId: string,
  upcoming = false,
  limit = 10,
  offset = 0,
) {
  const pool = getPool();

  const sessions = upcoming
    ? await getUpcomingSessionsByHostId.run({ hostId, limit, offset }, pool)
    : await getSessionsByHostId.run({ hostId, limit, offset }, pool);

  // Add participant counts to each session
  const enriched = [];
  for (const raw of sessions) {
    const session = camelizeKeys<any>(raw);
    const countResult = await getSessionBookingCount.run(
      { sessionId: session.id },
      pool,
    );
    session.currentParticipants = countResult[0]?.count || 0;
    session.spotsRemaining =
      session.maxParticipants - session.currentParticipants;
    enriched.push(session);
  }

  return enriched;
}

// ============================================
// List open sessions for a host's booking page
// ============================================

export async function listOpenSessions(slug: string, limit = 10, offset = 0) {
  const pool = getPool();
  const sessions = await getOpenSessionsBySlug.run(
    { slug, limit, offset },
    pool,
  );

  // Add spots remaining to each session
  const enriched = [];
  for (const raw of sessions) {
    const session = camelizeKeys<any>(raw);
    const countResult = await getSessionBookingCount.run(
      { sessionId: session.id },
      pool,
    );
    session.currentParticipants = countResult[0]?.count || 0;
    session.spotsRemaining =
      session.maxParticipants - session.currentParticipants;
    enriched.push(session);
  }

  return enriched;
}

// ============================================
// Batch distribute for a session (called by webhook)
// ============================================

export async function distributeSession(sessionId: string): Promise<{
  distributed: number;
  failed: number;
  results: Array<{
    bookingId: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const pool = getPool();

  const bookingsRaw = await getPaidBookingsBySessionId.run({ sessionId }, pool);
  const bookings: any[] = camelizeKeys(bookingsRaw);

  if (bookings.length === 0) {
    return { distributed: 0, failed: 0, results: [] };
  }

  const results: Array<{
    bookingId: string;
    success: boolean;
    error?: string;
  }> = [];
  let distributed = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const result = await distributeWithFee({
        streamName: booking.streamName,
        hostWallet: booking.hostWallet,
        totalAmount: Number(booking.amount),
        feeBps: booking.feePercentage,
      });

      await completeBooking.run(
        {
          id: booking.id,
          distributeSignature: result.hostSignature,
        },
        pool,
      );

      results.push({ bookingId: booking.id, success: true });
      distributed++;

      console.log(
        `[SESSION] Distributed booking ${booking.id}: ` +
          `host ${result.hostAmount}, fee ${result.feeAmount}`,
      );
    } catch (err: any) {
      results.push({
        bookingId: booking.id,
        success: false,
        error: err.message,
      });
      failed++;

      console.error(
        `[SESSION] Failed to distribute booking ${booking.id}:`,
        err.message,
      );
    }
  }

  // Update session status if all distributed
  if (failed === 0) {
    await updateSessionStatus.run({ id: sessionId, status: "completed" }, pool);
  }

  return { distributed, failed, results };
}

// ============================================
// Cancel a session (host action — refunds all paid bookings)
// ============================================

export async function cancelSessionRecord(
  sessionId: string,
  hostWallet: string,
): Promise<{ session: any; refunded: number; failed: number }> {
  const pool = getPool();

  const sessionsRaw = await getSessionById.run({ id: sessionId }, pool);
  const session: any = sessionsRaw[0] ? camelizeKeys(sessionsRaw[0]) : null;
  if (!session) throw new Error("Session not found");
  if (session.hostWallet !== hostWallet) {
    throw new Error("Only the host can cancel this session");
  }
  if (!["open", "full"].includes(session.status)) {
    throw new Error(`Cannot cancel session with status: ${session.status}`);
  }

  // Refund all paid bookings
  const bookingsRaw = await getSessionPaidBookings.run({ sessionId }, pool);
  const bookings: any[] = camelizeKeys(bookingsRaw);

  let refunded = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      await refundEscrow({
        streamName: booking.streamName,
        callerWallet: booking.callerWallet,
        amount: Number(booking.amount),
      });
      refunded++;
    } catch (err) {
      console.error(`Failed to refund booking ${booking.id}:`, err);
      failed++;
    }
  }

  await cancelSession.run({ id: sessionId }, pool);

  const updated = await getSessionById.run({ id: sessionId }, pool);
  return {
    session: camelizeKeys(updated[0]),
    refunded,
    failed,
  };
}
