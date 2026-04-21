CREATE TABLE hosts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    bio             TEXT,
    avatar_url      TEXT,
    slug            TEXT NOT NULL UNIQUE,
    rate            BIGINT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    timezone        TEXT NOT NULL DEFAULT 'UTC',
    fee_percentage  INTEGER NOT NULL DEFAULT 500,  -- platform-controlled, basis points (500 = 5%)
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE availability_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    UNIQUE(host_id, day_of_week, start_time)
);

CREATE TABLE date_overrides (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id     UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    is_blocked  BOOLEAN NOT NULL DEFAULT false,
    start_time  TIME,
    end_time    TIME,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(host_id, date)
);

CREATE TYPE booking_status AS ENUM (
    'pending_payment',
    'paid',
    'active',
    'completed',
    'refunded',
    'expired',
    'no_show'
);

CREATE TABLE bookings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id                 UUID NOT NULL REFERENCES hosts(id),
    caller_wallet           TEXT NOT NULL,
    caller_name             TEXT,
    caller_email            TEXT,

    scheduled_at            TIMESTAMPTZ NOT NULL,
    duration_minutes        INTEGER NOT NULL,
    timezone                TEXT NOT NULL,

    amount                  BIGINT NOT NULL,
    status                  booking_status NOT NULL DEFAULT 'pending_payment',

    stream_name             TEXT NOT NULL UNIQUE,
    stream_pda              TEXT,
    stream_ata              TEXT,
    donor_pda               TEXT,
    deposit_signature       TEXT,
    distribute_signature    TEXT,
    refund_signature        TEXT,

    vidbloq_room            TEXT,

    call_started_at         TIMESTAMPTZ,
    call_ended_at           TIMESTAMPTZ,
    caller_joined_at        TIMESTAMPTZ,
    host_joined_at          TIMESTAMPTZ,

    refund_reason           TEXT,
    payment_expires_at      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Hosts
CREATE INDEX idx_hosts_slug ON hosts(slug);
CREATE INDEX idx_hosts_wallet ON hosts(wallet_address);

-- availability_rules
CREATE INDEX idx_availability_host ON availability_rules(host_id);

-- date_overrides
CREATE INDEX idx_overrides_host_date ON date_overrides(host_id, date);

-- Bookings
CREATE INDEX idx_bookings_host ON bookings(host_id);
CREATE INDEX idx_bookings_caller ON bookings(caller_wallet);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX idx_bookings_stream ON bookings(stream_name);

CREATE UNIQUE INDEX idx_bookings_no_double_book
    ON bookings(host_id, scheduled_at)
    WHERE status IN ('pending_payment', 'paid', 'active');