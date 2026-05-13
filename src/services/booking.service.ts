import { nanoid } from "nanoid";
import { getPool, camelizeKeys, env } from "../config/index.js";
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
  getBookingByClaimCode,
  claimGiftBooking,
  setGiftClaimCode,
  type booking_status
} from "../queries/booking.queries.js";
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
import {
  sendBookingConfirmationToCaller,
  sendBookingNotificationToHost,
  sendGiftNotification,
  sendCancellationToCaller,
  sendCancellationToHost,
  sendSessionBookingConfirmation,
} from "./email.service.js";
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

  // Determine if this is a gift booking
  const isGift = data.isGift || !!(data.participantWallet && data.participantWallet !== data.callerWallet);

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
      sessionId: data.sessionId || null,
      participantWallet: data.participantWallet || null,
      participantName: data.participantName || null,
      participantEmail: data.participantEmail || null,
      isGift,
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

  // Create Vidbloq room — for session bookings, create once on the session
  let vidbloqRoom: string | null = null;

  if (booking.sessionId) {
    // Group session — check if session already has a room
    const { getSessionById, updateSessionRoom } = await import(
      "../queries/session.queries.js"
    );
    const sessionRows = await getSessionById.run(
      { id: booking.sessionId },
      pool
    );
    const session: any = sessionRows[0]
      ? camelizeKeys(sessionRows[0])
      : null;

    if (session?.vidbloqRoom) {
      // Room already exists — reuse it
      vidbloqRoom = session.vidbloqRoom;
    } else {
      // First paid booking in this session — create the room
      try {
        const room = await createVidbloqRoom({
          hostWallet: bookingWithHost.hostWallet,
          title: session?.title || `Session: ${booking.streamName}`,
          callType: "Video",
          scheduledFor: booking.scheduledAt,
        });
        vidbloqRoom = room.name;

        // Store room on the session
        await updateSessionRoom.run(
          { id: booking.sessionId, vidbloqRoom },
          pool
        );

        console.log(
          `[VIDBLOQ] Room created for session ${booking.sessionId}: ${vidbloqRoom}`
        );
      } catch (err) {
        console.error("[VIDBLOQ] Failed to create session room:", err);
      }
    }
  } else {
    // 1:1 booking — create room per booking (existing behavior)
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
      console.error("[VIDBLOQ] Failed to create room:", err);
    }
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
  const confirmedBooking: any = camelizeKeys(fullBooking[0]);

  // Send confirmation emails (fire and forget — don't block the response)
  if (confirmedBooking.callerEmail) {
    // Get host email for calendar invite
    const hostEmailResult = await pool.query(
      `SELECT email FROM hosts WHERE id = $1`,
      [confirmedBooking.hostId]
    );
    const hostEmail = hostEmailResult.rows[0]?.email;

    if (confirmedBooking.sessionId) {
      // Session booking confirmation
      const { getSessionById } = await import("../queries/session.queries.js");
      const sessionRows = await getSessionById.run(
        { id: confirmedBooking.sessionId },
        pool
      );
      const session: any = sessionRows[0] ? camelizeKeys(sessionRows[0]) : null;

      sendSessionBookingConfirmation({
        bookingId: confirmedBooking.id,
        callerName: confirmedBooking.callerName,
        callerEmail: confirmedBooking.callerEmail,
        hostName: confirmedBooking.hostName,
        hostEmail,
        sessionTitle: session?.title || `Session with ${confirmedBooking.hostName}`,
        scheduledAt: confirmedBooking.scheduledAt,
        durationMinutes: confirmedBooking.durationMinutes,
        amount: confirmedBooking.amount,
        sessionId: confirmedBooking.sessionId,
      }).catch((err) => console.error("[EMAIL] Session confirmation failed:", err));
    } else {
      // 1:1 booking confirmation to caller
      sendBookingConfirmationToCaller({
        id: confirmedBooking.id,
        callerName: confirmedBooking.callerName,
        callerEmail: confirmedBooking.callerEmail,
        hostName: confirmedBooking.hostName,
        hostEmail,
        scheduledAt: confirmedBooking.scheduledAt,
        durationMinutes: confirmedBooking.durationMinutes,
        amount: confirmedBooking.amount,
        hostSlug: confirmedBooking.hostSlug,
      }).catch((err) => console.error("[EMAIL] Caller confirmation failed:", err));
    }

    // Notify host
    if (hostEmail) {
      sendBookingNotificationToHost({
        id: confirmedBooking.id,
        callerName: confirmedBooking.callerName,
        callerEmail: confirmedBooking.callerEmail,
        hostName: confirmedBooking.hostName,
        hostEmail,
        scheduledAt: confirmedBooking.scheduledAt,
        durationMinutes: confirmedBooking.durationMinutes,
        amount: confirmedBooking.amount,
        isGift: confirmedBooking.isGift,
        participantName: confirmedBooking.participantName,
      }).catch((err) => console.error("[EMAIL] Host notification failed:", err));
    }

    // Gift notification to recipient
    if (confirmedBooking.isGift && confirmedBooking.participantEmail) {
      // Generate a claim code for the gift recipient
      const claimCode = nanoid(16);
      await setGiftClaimCode.run(
        { id: confirmedBooking.id, claimCode },
        pool
      );

      const frontendUrl = env().FRONTEND_URL;
      sendGiftNotification({
        recipientEmail: confirmedBooking.participantEmail,
        recipientName: confirmedBooking.participantName || "there",
        senderName: confirmedBooking.callerName,
        hostName: confirmedBooking.hostName,
        hostSlug: confirmedBooking.hostSlug,
        scheduledAt: confirmedBooking.scheduledAt,
        durationMinutes: confirmedBooking.durationMinutes,
        claimUrl: `${frontendUrl}/gift/claim/${claimCode}`,
      }).catch((err) => console.error("[EMAIL] Gift notification failed:", err));
    }
  }

  return confirmedBooking;
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
  const isParticipant = booking.participantWallet === wallet;
  const isHost = booking.hostWallet === wallet;
  if (!isCaller && !isParticipant && !isHost) {
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
    || (isParticipant ? booking.participantName : null)
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

  // Record join time — gift participant counts as the "caller" joining
  if (isCaller || isParticipant) {
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

  // Check minimum call duration before distributing
  if (booking.callStartedAt) {
    const callDuration =
      (Date.now() - new Date(booking.callStartedAt).getTime()) / 60000;
    const minDurationPercent = parseInt(env().MIN_CALL_DURATION_PERCENT);
    const requiredMinutes =
      (booking.durationMinutes * minDurationPercent) / 100;

    if (callDuration < requiredMinutes) {
      throw new Error(
        `Call duration too short. Minimum ${requiredMinutes} minutes required, ` +
          `call lasted ${callDuration.toFixed(1)} minutes`
      );
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
  const cancelledBooking: any = camelizeKeys(fullBooking[0]);

  // Send cancellation emails (fire and forget)
  const cancelledBy = isHost ? "host" as const : "caller" as const;

  // Get host email
  const hostEmailResult = await pool.query(
    `SELECT email FROM hosts WHERE id = $1`,
    [cancelledBooking.hostId]
  );
  const hostEmail = hostEmailResult.rows[0]?.email;

  if (cancelledBooking.callerEmail) {
    sendCancellationToCaller({
      id: cancelledBooking.id,
      callerName: cancelledBooking.callerName,
      callerEmail: cancelledBooking.callerEmail,
      hostName: cancelledBooking.hostName,
      hostEmail,
      scheduledAt: cancelledBooking.scheduledAt,
      durationMinutes: cancelledBooking.durationMinutes,
      amount: cancelledBooking.amount,
      cancelledBy,
    }).catch((err) => console.error("[EMAIL] Caller cancellation failed:", err));
  }

  if (hostEmail) {
    sendCancellationToHost({
      id: cancelledBooking.id,
      callerName: cancelledBooking.callerName,
      hostName: cancelledBooking.hostName,
      hostEmail,
      scheduledAt: cancelledBooking.scheduledAt,
      durationMinutes: cancelledBooking.durationMinutes,
      cancelledBy,
    }).catch((err) => console.error("[EMAIL] Host cancellation failed:", err));
  }

  return cancelledBooking;
}

// ============================================
// Get / List bookings
// ============================================

export async function getBooking(bookingId: string) {
  const pool = getPool();
  const result = await getBookingById.run({ id: bookingId }, pool);
  return result[0] ? camelizeKeys(result[0]) : null;
}

// ============================================
// Gift claim flow
// ============================================

/**
 * Look up a gift booking by claim code (public — no auth required).
 * Returns booking details without sensitive info for the claim page.
 */
export async function getGiftByClaimCode(claimCode: string) {
  const pool = getPool();
  const result = await getBookingByClaimCode.run({ claimCode }, pool);
  if (!result[0]) return null;

  const booking: any = camelizeKeys(result[0]);

  // Return only what the recipient needs to see
  return {
    id: booking.id,
    hostName: booking.hostName,
    hostSlug: booking.hostSlug,
    scheduledAt: booking.scheduledAt,
    durationMinutes: booking.durationMinutes,
    callerName: booking.callerName, // who gifted it
    participantName: booking.participantName,
    isGift: booking.isGift,
    giftClaimedAt: booking.giftClaimedAt,
    status: booking.status,
    sessionId: booking.sessionId,
  };
}

/**
 * Claim a gift booking — recipient connects their wallet.
 * Sets participant_wallet and gift_claimed_at.
 * After claiming, the recipient can join the call via /join.
 */
export async function claimGift(
  claimCode: string,
  participantWallet: string
): Promise<any> {
  const pool = getPool();

  // Look up the booking
  const rows = await getBookingByClaimCode.run({ claimCode }, pool);
  if (!rows[0]) throw new Error("Gift not found");

  const booking: any = camelizeKeys(rows[0]);

  if (!booking.isGift) {
    throw new Error("This booking is not a gift");
  }

  if (booking.giftClaimedAt) {
    throw new Error("This gift has already been claimed");
  }

  if (!["paid", "active"].includes(booking.status)) {
    throw new Error(
      booking.status === "refunded" || booking.status === "cancelled"
        ? "This gift has been cancelled"
        : `Cannot claim gift with booking status: ${booking.status}`
    );
  }

  // Check if the call hasn't already passed
  const scheduledEnd = new Date(booking.scheduledAt).getTime() +
    booking.durationMinutes * 60 * 1000;
  if (Date.now() > scheduledEnd) {
    throw new Error("This session has already ended");
  }

  // Claim it — set the participant's wallet
  const updated = await claimGiftBooking.run(
    { claimCode, participantWallet },
    pool
  );

  if (!updated || updated.length === 0) {
    throw new Error("Failed to claim gift — it may have already been claimed");
  }

  // Re-fetch with host info
  const fullBooking = await getBookingById.run(
    { id: booking.id },
    pool
  );

  return camelizeKeys(fullBooking[0]);
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

  let processed = 0;

  for (const booking of noShows) {
    try {
      if (booking.hostJoinedAt && !booking.callerJoinedAt) {
        // Host showed up, caller/participant didn't → host gets paid
        // The host delivered their time. Caller forfeited.
        console.log(
          `[CRON] No-show caller for booking ${booking.id}. Distributing to host.`
        );

        try {
          const result = await distributeWithFee({
            streamName: booking.streamName,
            hostWallet: booking.hostWallet,
            totalAmount: Number(booking.amount),
            feeBps: booking.feePercentage,
          });

          await completeBooking.run(
            { id: booking.id, distributeSignature: result.hostSignature },
            pool
          );

          console.log(
            `[CRON] ✅ Distributed no-show booking ${booking.id} to host`
          );
        } catch (distErr: any) {
          if (distErr.message?.includes("TimeLocked")) {
            console.log(
              `[CRON] Escrow still locked for booking ${booking.id}. Will retry next cycle.`
            );
            continue; // Skip this one, try again next cron run
          }
          throw distErr;
        }
      } else {
        // Host didn't join (regardless of caller) → refund to payer
        // Also covers: neither joined → refund
        console.log(
          `[CRON] No-show host for booking ${booking.id}. Refunding to caller.`
        );

        const refundResult = await refundEscrow({
          streamName: booking.streamName,
          callerWallet: booking.callerWallet, // always refund to payer, not participant
          amount: Number(booking.amount),
        });

        await markNoShow.run(
          { id: booking.id, refundSignature: refundResult.signature },
          pool
        );

        console.log(
          `[CRON] ✅ Refunded no-show booking ${booking.id} to caller`
        );
      }

      processed++;
    } catch (err) {
      console.error(
        `[CRON] Failed to process no-show booking ${booking.id}:`,
        err
      );
    }
  }

  return processed;
}