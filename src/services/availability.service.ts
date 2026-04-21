import { getPool, camelizeKeys } from "../config/index.js";
import {
  getAvailabilityRules,
  getDateOverrideForDate,
} from "../queries/availability.queries.js";
import { getBookedSlotsForDate } from "../queries/booking.queries.js";
import type { TimeSlot } from "../types/index.js";

/**
 * Calculate available time slots for a host on a specific date.
 *
 * Logic:
 * 1. Get availability rules for the day of week
 * 2. Check for date overrides (blocked or custom hours)
 * 3. Subtract existing bookings (pending_payment, paid, active)
 * 4. Divide into duration-sized slots
 */
export async function getAvailableSlots(
  hostId: string,
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const pool = getPool();
  const dateObj = new Date(date + "T00:00:00Z");
  const dayOfWeek = dateObj.getUTCDay();

  const rulesRaw = await getAvailabilityRules.run({ hostId }, pool);
  const rules: any[] = camelizeKeys(rulesRaw);
  const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);

  const overridesRaw = await getDateOverrideForDate.run(
    { hostId, targetDate: date },
    pool
  );
  const overrides: any[] = camelizeKeys(overridesRaw);
  const override = overrides[0];

  if (override?.isBlocked) return [];

  let windows: Array<{ start: Date | string; end: Date | string }> = [];

  if (override?.startTime && override?.endTime) {
    windows = [{ start: override.startTime, end: override.endTime }];
  } else if (dayRules.length > 0) {
    windows = dayRules.map((r) => ({
      start: r.startTime,
      end: r.endTime,
    }));
  } else {
    return [];
  }

  const bookedRowsRaw = await getBookedSlotsForDate.run(
    { hostId, targetDate: date },
    pool
  );
  const bookedRows: any[] = camelizeKeys(bookedRowsRaw);
  const bookedSlots = bookedRows.map((b) => ({
    start: new Date(b.scheduledAt),
    end: new Date(
      new Date(b.scheduledAt).getTime() + b.durationMinutes * 60 * 1000
    ),
  }));

  const slots: TimeSlot[] = [];

  for (const window of windows) {
    const startStr =
      window.start instanceof Date
        ? `${window.start.getUTCHours()}:${window.start.getUTCMinutes()}`
        : window.start;
    const endStr =
      window.end instanceof Date
        ? `${window.end.getUTCHours()}:${window.end.getUTCMinutes()}`
        : window.end;

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);

    const windowStart = new Date(date + "T00:00:00Z");
    windowStart.setUTCHours(startH, startM, 0, 0);

    const windowEnd = new Date(date + "T00:00:00Z");
    windowEnd.setUTCHours(endH, endM, 0, 0);

    let slotStart = new Date(windowStart);

    while (
      slotStart.getTime() + durationMinutes * 60 * 1000 <=
      windowEnd.getTime()
    ) {
      const slotEnd = new Date(
        slotStart.getTime() + durationMinutes * 60 * 1000
      );

      const isBooked = bookedSlots.some(
        (booked) => slotStart < booked.end && slotEnd > booked.start
      );

      const isPast = slotStart.getTime() < Date.now();

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: !isBooked && !isPast,
      });

      slotStart = new Date(slotEnd);
    }
  }

  return slots;
}