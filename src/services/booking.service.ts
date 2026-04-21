import { nanoid } from "nanoid";
import { getPool, camelizeKeys } from "../config/index.js";
import { env } from "../config/env.js";
import {
  createBooking,
  getBookingById,
  getBookingWithHost,
  getBookingsByCallerWallet,
  countBookingsByCallerWallet,
  getBookingsByHostId,
  getBookingsByHostIdAndStatus,
  countBookingsByHostId,
  countBookingsByHostIdAndStatus,
  checkSlotConflict,
  confirmBookingPayment,
  completeBooking,
  refundBooking,
  markNoShow,
  expireUnpaidBookings,
  getNoShowBookings,
  recordCallerJoined,
  recordHostJoined,
} from "../queries/booking.queries.js";
import type { booking_status } from "../queries/booking.queries.js";
import { getHostBySlug } from "../queries/hosts.queries.js";
import {
  initializeEscrow,
  buildDepositInstruction,
  distributeWithFee,
  refundEscrow,
  verifyDeposit,
} from "./escrow.service.js";
import {
  createVidbloqRoom,
  createVidbloqToken,
  endVidbloqRoom,
} from "./vidbloq.service.js";
import type {
  CreateBookingRequest,
  SerializedInstruction,
} from "../types/index.js";

// ============================================
// Create a booking
// ============================================

export async function createBookingRecord(
  data: CreateBookingRequest
): Promise<{
  booking: any;
  depositInstruction: SerializedInstruction;
  accounts: { streamPDA: string; streamATA: string; donorPDA: string };
  paymentExpiresAt: string;
}> {
  const pool = getPool();

  const hostsRaw = await getHostBySlug.run({ slug: data.hostSlug }, pool);
  const host: any = hostsRaw[0] ? camelizeKeys(hostsRaw[0]) : null;
  if (!host) throw new Error("Host not found");
  if (!host.isActive) throw new Error("Host is not accepting bookings");

  const scheduledAt = new Date(data.scheduledAt);
  if (scheduledAt.getTime() < Date.now()) {
    throw new Error("Cannot book a slot in the past");
  }

  const conflicts = await checkSlotConflict.run(
    { hostId: host.id, scheduledAt: scheduledAt.toISOString() },
    pool
  );
  if (conflicts.length > 0) {
    throw new Error("This time slot is no longer available");
  }

  const bufferMinutes = parseInt(env().UNLOCK_BUFFER_MINUTES);
  const unlockTime = Math.floor(
    (scheduledAt.getTime() +
      (host.durationMinutes + bufferMinutes) * 60 * 1000) /
      1000
  );

  const streamName = `cal-${nanoid(10)}`;
  const amount = Number(host.rate);

  const escrowResult = await initializeEscrow({
    streamName,
    unlockTime,
    minAmount: amount,
  });

  const depositResult = await buildDepositInstruction({
    streamName,
    callerWallet: data.callerWallet,
    amount,
  });

  const expiryMinutes = parseInt(env().PAYMENT_EXPIRY_MINUTES);
  const paymentExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const bookings = await createBooking.run(
    {
      hostId: host.id,
      callerWallet: data.callerWallet,
      callerName: data.callerName,
      callerEmail: data.callerEmail,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: host.durationMinutes,
      timezone: host.timezone,
      amount,
      streamName,
      streamPda: escrowResult.streamPDA,
      streamAta: escrowResult.streamATA,
      donorPda: depositResult.donorPDA,
      paymentExpiresAt: paymentExpiresAt.toISOString(),
    },
    pool
  );

  // Re-fetch with host info (INSERT RETURNING * can't JOIN)
  const fullBooking = await getBookingById.run(
    { id: bookings[0].id },
    pool
  );

  return {
    booking: camelizeKeys(fullBooking[0]),
    depositInstruction: depositResult.instruction,
    accounts: {
      streamPDA: escrowResult.streamPDA,
      streamATA: escrowResult.streamATA,
      donorPDA: depositResult.donorPDA,
    },
    paymentExpiresAt: paymentExpiresAt.toISOString(),
  };
}

// ============================================
// Confirm payment + create Vidbloq room
// ============================================

export async function confirmPayment(bookingId: string, signature: string) {
  const pool = getPool();

  const bookingsRaw = await getBookingById.run({ id: bookingId }, pool);
  const booking: any = bookingsRaw[0] ? camelizeKeys(bookingsRaw[0]) : null;
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "pending_payment") {
    throw new Error(
      `Cannot confirm payment for booking with status: ${booking.status}`
    );
  }

  if (
    booking.paymentExpiresAt &&
    new Date(booking.paymentExpiresAt) < new Date()
  ) {
    await expireUnpaidBookings.run(undefined, pool);
    throw new Error("Payment window has expired");
  }

  const verification = await verifyDeposit({
    signature,
    streamName: booking.streamName,
    expectedAmount: Number(booking.amount),
  });

  if (!verification.confirmed) {
    throw new Error(`Deposit verification failed: ${verification.error}`);
  }

  // Get host wallet for room creation
  const hostRows = await getBookingWithHost.run({ id: bookingId }, pool);
  const bookingWithHost: any = hostRows[0]
    ? camelizeKeys(hostRows[0])
    : null;

  // Create Vidbloq room for the call
  let vidbloqRoom: string | null = null;
  try {
    const room = await createVidbloqRoom({
      hostWallet: bookingWithHost.hostWallet,
      title: `Call: ${booking.streamName}`,
      callType: "Video",
      scheduledFor: booking.scheduledAt,
    });
    vidbloqRoom = room.name;
    console.log(`[VIDBLOQ] Room created: ${vidbloqRoom}`);
  } catch (err) {
    // Room creation failure shouldn't block payment confirmation
    // The room can be created lazily on join
    console.error("[VIDBLOQ] Failed to create room:", err);
  }

  await confirmBookingPayment.run(
    {
      id: bookingId,
      depositSignature: signature,
      vidbloqRoom,
    },
    pool
  );

  // Re-fetch with host info
  const fullBooking = await getBookingById.run({ id: bookingId }, pool);
  return camelizeKeys(fullBooking[0]);
}

// ============================================
// Join call — validate booking + get Vidbloq token
// ============================================

export async function joinCall(
  bookingId: string,
  wallet: string,
  userName?: string
): Promise<{
  token: string;
  roomName: string;
  userType: "host" | "co-host" | "guest";
}> {
  const pool = getPool();

  const rows = await getBookingWithHost.run({ id: bookingId }, pool);
  const booking: any = rows[0] ? camelizeKeys(rows[0]) : null;
  if (!booking) throw new Error("Booking not found");

  const isCaller = booking.callerWallet === wallet;
  const isHost = booking.hostWallet === wallet;
  if (!isCaller && !isHost) {
    throw new Error("You are not a participant in this booking");
  }

  if (!["paid", "active"].includes(booking.status)) {
    throw new Error(`Cannot join call with booking status: ${booking.status}`);
  }

  // Check time window — allow joining 5 minutes early
  const now = Date.now();
  const scheduledTime = new Date(booking.scheduledAt).getTime();
  const earlyJoinBuffer = 5 * 60 * 1000;
  const lateJoinBuffer =
    (booking.durationMinutes + parseInt(env().UNLOCK_BUFFER_MINUTES)) *
    60 *
    1000;

  if (now < scheduledTime - earlyJoinBuffer) {
    const minutesUntil = Math.ceil(
      (scheduledTime - earlyJoinBuffer - now) / 60000
    );
    throw new Error(
      `Call hasn't started yet. You can join in ${minutesUntil} minutes`
    );
  }

  if (now > scheduledTime + lateJoinBuffer) {
    throw new Error("Call window has passed");
  }

  // Create room if it doesn't exist yet (fallback for failed creation during payment)
  let roomName = booking.vidbloqRoom;
  if (!roomName) {
    try {
      const room = await createVidbloqRoom({
        hostWallet: booking.hostWallet,
        title: `Call: ${booking.streamName}`,
        callType: "Video",
      });
      roomName = room.name;

      await confirmBookingPayment.run(
        {
          id: bookingId,
          depositSignature: booking.depositSignature,
          vidbloqRoom: roomName,
        },
        pool
      );
    } catch (err) {
      throw new Error("Failed to create call room. Please try again.");
    }
  }

  // Get participant token from Vidbloq
  // Use provided name, fall back to booking data
  const displayName = userName
    || (isCaller ? booking.callerName : null)
    || (isHost ? booking.hostName : null)
    || null;

  if (!displayName) {
    throw new Error("Display name is required to join the call");
  }

  const { token, userType } = await createVidbloqToken({
    roomName,
    userName: displayName,
    wallet,
  });

  // Record join time
  if (isCaller) {
    await recordCallerJoined.run({ id: bookingId }, pool);
  } else if (isHost) {
    await recordHostJoined.run({ id: bookingId }, pool);
  }

  return {
    token,
    roomName,
    userType,
  };
}

// ============================================
// Confirm call completed (Phase 1 — manual)
// ============================================

export async function confirmCallCompleted(
  bookingId: string,
  hostWallet: string
) {
  const pool = getPool();

  const rows = await getBookingWithHost.run({ id: bookingId }, pool);
  const booking: any = rows[0] ? camelizeKeys(rows[0]) : null;
  if (!booking) throw new Error("Booking not found");
  if (booking.hostWallet !== hostWallet) {
    throw new Error("Only the host can confirm call completion");
  }
  if (booking.status !== "paid" && booking.status !== "active") {
    throw new Error(
      `Cannot confirm call for booking with status: ${booking.status}`
    );
  }

  // End the Vidbloq room if it exists
  if (booking.vidbloqRoom) {
    try {
      await endVidbloqRoom({
        roomName: booking.vidbloqRoom,
        hostWallet: booking.hostWallet,
      });
    } catch (err) {
      console.error("[VIDBLOQ] Failed to end room:", err);
    }
  }

  const result = await distributeWithFee({
    streamName: booking.streamName,
    hostWallet: booking.hostWallet,
    totalAmount: Number(booking.amount),
    feeBps: booking.feePercentage,
  });

  await completeBooking.run(
    { id: bookingId, distributeSignature: result.hostSignature },
    pool
  );

  // Re-fetch with host info
  const fullBooking = await getBookingById.run({ id: bookingId }, pool);
  return camelizeKeys(fullBooking[0]);
}

// ============================================
// Cancel booking
// ============================================

export async function cancelBooking(
  bookingId: string,
  initiatorWallet: string,
  reason?: string
) {
  const pool = getPool();

  const rows = await getBookingWithHost.run({ id: bookingId }, pool);
  const booking: any = rows[0] ? camelizeKeys(rows[0]) : null;
  if (!booking) throw new Error("Booking not found");

  const isCaller = booking.callerWallet === initiatorWallet;
  const isHost = booking.hostWallet === initiatorWallet;
  if (!isCaller && !isHost) {
    throw new Error("Only the caller or host can cancel a booking");
  }

  if (!["pending_payment", "paid"].includes(booking.status)) {
    throw new Error(`Cannot cancel booking with status: ${booking.status}`);
  }

  let refundSignature: string | null = null;
  if (booking.status === "paid") {
    const refundResult = await refundEscrow({
      streamName: booking.streamName,
      callerWallet: booking.callerWallet,
      amount: Number(booking.amount),
    });
    refundSignature = refundResult.signature;
  }

  const refundReason =
    reason || (isHost ? "Cancelled by host" : "Cancelled by caller");

  await refundBooking.run(
    { id: bookingId, refundSignature, refundReason },
    pool
  );

  // Re-fetch with host info
  const fullBooking = await getBookingById.run({ id: bookingId }, pool);
  return camelizeKeys(fullBooking[0]);
}

// ============================================
// Get / List bookings
// ============================================

export async function getBooking(bookingId: string) {
  const pool = getPool();
  const result = await getBookingById.run({ id: bookingId }, pool);
  return result[0] ? camelizeKeys(result[0]) : null;
}

export async function listCallerBookings(
  callerWallet: string,
  limit = 10,
  offset = 0
) {
  const pool = getPool();
  const [bookings, countResult] = await Promise.all([
    getBookingsByCallerWallet.run({ callerWallet, limit, offset }, pool),
    countBookingsByCallerWallet.run({ callerWallet }, pool),
  ]);

  return {
    bookings: camelizeKeys(bookings),
    total: countResult[0]?.count || 0,
  };
}

export async function listHostBookings(
  hostId: string,
  status?: booking_status,
  limit = 10,
  offset = 0
) {
  const pool = getPool();

  const [bookings, countResult] = await Promise.all([
    status
      ? getBookingsByHostIdAndStatus.run(
          { hostId, status, limit, offset },
          pool
        )
      : getBookingsByHostId.run({ hostId, limit, offset }, pool),
    status
      ? countBookingsByHostIdAndStatus.run({ hostId, status }, pool)
      : countBookingsByHostId.run({ hostId }, pool),
  ]);

  return {
    bookings: camelizeKeys(bookings),
    total: countResult[0]?.count || 0,
  };
}

// ============================================
// Cron: expire unpaid bookings
// ============================================

export async function expireUnpaid(): Promise<number> {
  const pool = getPool();
  const result = await expireUnpaidBookings.run(undefined, pool);
  return result.length;
}

// ============================================
// Cron: handle no-shows
// ============================================

export async function handleNoShows(): Promise<number> {
  const pool = getPool();
  const bufferMinutes = parseInt(env().UNLOCK_BUFFER_MINUTES) + 15;

  const noShowsRaw = await getNoShowBookings.run(
    { graceMinutes: bufferMinutes },
    pool
  );
  const noShows: any[] = camelizeKeys(noShowsRaw);

  let refunded = 0;

  for (const booking of noShows) {
    try {
      const refundResult = await refundEscrow({
        streamName: booking.streamName,
        callerWallet: booking.callerWallet,
        amount: Number(booking.amount),
      });

      await markNoShow.run(
        { id: booking.id, refundSignature: refundResult.signature },
        pool
      );

      refunded++;
    } catch (err) {
      console.error(`Failed to refund no-show booking ${booking.id}:`, err);
    }
  }

  return refunded;
}