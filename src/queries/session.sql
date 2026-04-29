/* @name CreateSession */
INSERT INTO sessions (host_id, title, description, scheduled_at, duration_minutes, rate, max_participants, session_type)
VALUES (:hostId, :title, :description, :scheduledAt, :durationMinutes, :rate, :maxParticipants, :sessionType)
RETURNING *;

/* @name GetSessionById */
SELECT s.*, h.name as host_name, h.slug as host_slug, h.wallet_address as host_wallet, h.fee_percentage
FROM sessions s
JOIN hosts h ON s.host_id = h.id
WHERE s.id = :id;

/* @name GetSessionsByHostId */
SELECT s.*, h.name as host_name, h.slug as host_slug
FROM sessions s
JOIN hosts h ON s.host_id = h.id
WHERE s.host_id = :hostId
ORDER BY s.scheduled_at DESC
LIMIT :limit OFFSET :offset;

/* @name GetUpcomingSessionsByHostId */
SELECT s.*, h.name as host_name, h.slug as host_slug
FROM sessions s
JOIN hosts h ON s.host_id = h.id
WHERE s.host_id = :hostId
AND s.status IN ('open', 'full')
AND s.scheduled_at > now()
ORDER BY s.scheduled_at ASC
LIMIT :limit OFFSET :offset;

/* @name GetOpenSessionsBySlug */
SELECT s.*, h.name as host_name, h.slug as host_slug
FROM sessions s
JOIN hosts h ON s.host_id = h.id
WHERE h.slug = :slug
AND s.status = 'open'
AND s.scheduled_at > now()
ORDER BY s.scheduled_at ASC
LIMIT :limit OFFSET :offset;

/* @name GetSessionBookingCount */
SELECT COUNT(*)::int as count FROM bookings
WHERE session_id = :sessionId
AND status IN ('pending_payment', 'paid', 'active');

/* @name GetSessionPaidBookings */
SELECT b.*, h.name as host_name, h.slug as host_slug
FROM bookings b
JOIN hosts h ON b.host_id = h.id
WHERE b.session_id = :sessionId
AND b.status IN ('paid', 'active')
ORDER BY b.created_at ASC;

/* @name UpdateSessionStatus */
UPDATE sessions SET status = :status, updated_at = now()
WHERE id = :id
RETURNING *;

/* @name UpdateSessionRoom */
UPDATE sessions SET vidbloq_room = :vidbloqRoom, updated_at = now()
WHERE id = :id
RETURNING *;

/* @name UpdateSessionStatusToFull */
UPDATE sessions SET status = 'full', updated_at = now()
WHERE id = :id AND status = 'open'
RETURNING *;

/* @name CancelSession */
UPDATE sessions SET status = 'cancelled', updated_at = now()
WHERE id = :id
RETURNING *;