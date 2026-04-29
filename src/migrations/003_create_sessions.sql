-- Session type enum
CREATE TYPE session_type AS ENUM ('one_on_one', 'group');

-- Sessions table — a bookable time slot that can have 1 or many participants
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id             UUID NOT NULL REFERENCES hosts(id),
    title               TEXT,
    description         TEXT,
    scheduled_at        TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER NOT NULL,
    rate                BIGINT NOT NULL,
    max_participants    INTEGER NOT NULL DEFAULT 1,
    session_type        session_type NOT NULL DEFAULT 'one_on_one',
    vidbloq_room        TEXT,
    status              TEXT NOT NULL DEFAULT 'open',  -- open, full, active, completed, cancelled
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_host ON sessions(host_id);
CREATE INDEX idx_sessions_scheduled ON sessions(scheduled_at);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Link bookings to sessions
ALTER TABLE bookings ADD COLUMN session_id UUID REFERENCES sessions(id);
CREATE INDEX idx_bookings_session ON bookings(session_id);

-- Drop the old double-booking prevention index (was per host+time, blocks group bookings)
DROP INDEX IF EXISTS idx_bookings_no_double_book;

-- New double-booking prevention: per CALLER per session
-- A caller can't book the same session twice
CREATE UNIQUE INDEX idx_bookings_no_double_book_session
    ON bookings(session_id, caller_wallet)
    WHERE session_id IS NOT NULL
    AND status IN ('pending_payment', 'paid', 'active');

-- Keep 1:1 protection for bookings without sessions (legacy)
CREATE UNIQUE INDEX idx_bookings_no_double_book_legacy
    ON bookings(host_id, scheduled_at)
    WHERE session_id IS NULL
    AND status IN ('pending_payment', 'paid', 'active');