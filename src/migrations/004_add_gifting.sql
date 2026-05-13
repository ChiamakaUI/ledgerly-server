-- Add gifting support: the person who pays may differ from the person who attends
-- participant_wallet: the wallet that joins the call (defaults to caller_wallet if null)
-- participant_name: display name for the attendee
-- participant_email: contact for the attendee (for reminders)
-- is_gift: flag for gift bookings (for analytics/display)

ALTER TABLE bookings ADD COLUMN participant_wallet TEXT;
ALTER TABLE bookings ADD COLUMN participant_name TEXT;
ALTER TABLE bookings ADD COLUMN participant_email TEXT;
ALTER TABLE bookings ADD COLUMN is_gift BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN gift_claim_code TEXT UNIQUE;
ALTER TABLE bookings ADD COLUMN gift_claimed_at TIMESTAMPTZ;

CREATE INDEX idx_bookings_participant ON bookings(participant_wallet);
CREATE INDEX idx_bookings_gift_claim ON bookings(gift_claim_code);