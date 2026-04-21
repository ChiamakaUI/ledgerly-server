/* @name CreateBooking */
INSERT INTO bookings (
    host_id, caller_wallet, caller_name, caller_email,
    scheduled_at, duration_minutes, timezone, amount, status,
    stream_name, stream_pda, stream_ata, donor_pda,
    payment_expires_at
) VALUES (
    :hostId, :callerWallet, :callerName, :callerEmail,
    :scheduledAt, :durationMinutes, :timezone, :amount, 'pending_payment',
    :streamName, :streamPda, :streamAta, :donorPda,
    :paymentExpiresAt
)
RETURNING *;

/* @name GetBookingById */
SELECT b.*, h.name as host_name, h.slug as host_slug
FROM bookings b
JOIN hosts h ON b.host_id = h.id
WHERE b.id = :id;

/* @name GetBookingWithHost */
SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug
FROM bookings b
JOIN hosts h ON b.host_id = h.id
WHERE b.id = :id;

/* @name GetBookingsByCallerWallet */
SELECT b.*, h.name as host_name, h.slug as host_slug
FROM bookings b
JOIN hosts h ON b.host_id = h.id
WHERE b.caller_wallet = :callerWallet
ORDER BY b.scheduled_at DESC
LIMIT :limit OFFSET :offset;

/* @name CountBookingsByCallerWallet */
SELECT COUNT(*)::int as count FROM bookings
WHERE caller_wallet = :callerWallet;

/* @name GetBookingsByHostId */
SELECT b.*, h.name as host_name, h.slug as host_slug
FROM bookings b
JOIN hosts h ON b.host_id = h.id
WHERE b.host_id = :hostId
ORDER BY b.scheduled_at DESC
LIMIT :limit OFFSET :offset;

/* @name GetBookingsByHostIdAndStatus */
SELECT b.*, h.name as host_name, h.slug as host_slug
FROM bookings b
JOIN hosts h ON b.host_id = h.id
WHERE b.host_id = :hostId AND b.status = :status
ORDER BY b.scheduled_at DESC
LIMIT :limit OFFSET :offset;

/* @name CountBookingsByHostId */
SELECT COUNT(*)::int as count FROM bookings
WHERE host_id = :hostId;

/* @name CountBookingsByHostIdAndStatus */
SELECT COUNT(*)::int as count FROM bookings
WHERE host_id = :hostId AND status = :status;

/* @name CheckSlotConflict */
SELECT id FROM bookings
WHERE host_id = :hostId AND scheduled_at = :scheduledAt
AND status IN ('pending_payment', 'paid', 'active');

/* @name GetBookedSlotsForDate */
SELECT scheduled_at, duration_minutes FROM bookings
WHERE host_id = :hostId
AND scheduled_at::date = :targetDate::date
AND status IN ('pending_payment', 'paid', 'active')
ORDER BY scheduled_at;

/* @name UpdateBookingStatus */
UPDATE bookings
SET status = :status, updated_at = now()
WHERE id = :id
RETURNING *;

/* @name ConfirmBookingPayment */
UPDATE bookings
SET status = 'paid',
    deposit_signature = :depositSignature,
    vidbloq_room = :vidbloqRoom,
    updated_at = now()
WHERE id = :id
RETURNING *;

/* @name CompleteBooking */
UPDATE bookings
SET status = 'completed',
    distribute_signature = :distributeSignature,
    call_ended_at = now(),
    updated_at = now()
WHERE id = :id
RETURNING *;

/* @name RefundBooking */
UPDATE bookings
SET status = 'refunded',
    refund_signature = :refundSignature,
    refund_reason = :refundReason,
    updated_at = now()
WHERE id = :id
RETURNING *;

/* @name MarkNoShow */
UPDATE bookings
SET status = 'no_show',
    refund_signature = :refundSignature,
    refund_reason = 'No-show: neither party joined',
    updated_at = now()
WHERE id = :id
RETURNING *;

/* @name ExpireUnpaidBookings */
UPDATE bookings
SET status = 'expired', updated_at = now()
WHERE status = 'pending_payment'
AND payment_expires_at < now();

/* @name GetNoShowBookings */
SELECT * FROM bookings
WHERE status = 'paid'
AND scheduled_at + ((duration_minutes + :graceMinutes) * interval '1 minute') < now()
AND call_started_at IS NULL;

/* @name GetIncompleteActiveBookings */
SELECT * FROM bookings
WHERE status = 'active'
AND call_ended_at IS NOT NULL
AND distribute_signature IS NULL;

/* @name RecordCallerJoined */
UPDATE bookings
SET caller_joined_at = now(), updated_at = now()
WHERE id = :id AND caller_joined_at IS NULL
RETURNING *;

/* @name RecordHostJoined */
UPDATE bookings
SET host_joined_at = now(),
    status = 'active',
    call_started_at = now(),
    updated_at = now()
WHERE id = :id AND host_joined_at IS NULL
RETURNING *;