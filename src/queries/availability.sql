/* @name GetAvailabilityRules */
SELECT * FROM availability_rules
WHERE host_id = :hostId AND is_active = true
ORDER BY day_of_week, start_time;

/* @name DeleteAvailabilityRules */
DELETE FROM availability_rules WHERE host_id = :hostId;

/* @name InsertAvailabilityRule */
INSERT INTO availability_rules (host_id, day_of_week, start_time, end_time)
VALUES (:hostId, :dayOfWeek, :startTime, :endTime)
RETURNING *;

/* @name GetDateOverrides */
SELECT * FROM date_overrides
WHERE host_id = :hostId
ORDER BY date;

/* @name GetDateOverridesForRange */
SELECT * FROM date_overrides
WHERE host_id = :hostId AND date >= :fromDate::date AND date <= :toDate::date
ORDER BY date;

/* @name GetDateOverrideForDate */
SELECT * FROM date_overrides
WHERE host_id = :hostId AND date = :targetDate::date;

/* @name UpsertDateOverride */
INSERT INTO date_overrides (host_id, date, is_blocked, start_time, end_time)
VALUES (:hostId, :targetDate::date, :isBlocked, :startTime, :endTime)
ON CONFLICT (host_id, date) DO UPDATE SET
    is_blocked = EXCLUDED.is_blocked,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time
RETURNING *;