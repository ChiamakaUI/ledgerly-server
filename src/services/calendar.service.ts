/**
 * ICS Calendar Invite Generator
 *
 * Generates .ics files that work with Google Calendar, Apple Calendar,
 * Outlook, and any RFC 5545 compliant calendar app.
 *
 * Includes built-in VALARM reminders so users get notified
 * without us running any reminder infrastructure.
 */

interface ICSParams {
  uid: string; // unique ID — use booking ID for updates/cancellations
  title: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
  hostName: string;
  hostEmail?: string;
  attendeeName: string;
  attendeeEmail: string;
  joinUrl: string;
  location?: string;
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateBookingInvite(params: ICSParams): string {
  const endTime = new Date(
    params.startTime.getTime() + params.durationMinutes * 60 * 1000
  );

  const description = escapeICSText(
    `${params.description}\n\nJoin your call: ${params.joinUrl}`
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ledgerly//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}@ledgerly.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(params.startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${escapeICSText(params.title)}`,
    `DESCRIPTION:${description}`,
    `URL:${params.joinUrl}`,
    params.location ? `LOCATION:${escapeICSText(params.location)}` : "",
    `ORGANIZER;CN=${escapeICSText(params.hostName)}:mailto:${params.hostEmail || "noreply@ledgerly.com"}`,
    `ATTENDEE;CN=${escapeICSText(params.attendeeName)};RSVP=TRUE;PARTSTAT=ACCEPTED:mailto:${params.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your call starts in 30 minutes",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your call starts in 10 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function generateCancellationInvite(params: {
  uid: string;
  title: string;
  startTime: Date;
  durationMinutes: number;
  hostName: string;
  hostEmail?: string;
  attendeeName: string;
  attendeeEmail: string;
}): string {
  const endTime = new Date(
    params.startTime.getTime() + params.durationMinutes * 60 * 1000
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ledgerly//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${params.uid}@ledgerly.com`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(params.startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:CANCELLED: ${escapeICSText(params.title)}`,
    `ORGANIZER;CN=${escapeICSText(params.hostName)}:mailto:${params.hostEmail || "noreply@ledgerly.com"}`,
    `ATTENDEE;CN=${escapeICSText(params.attendeeName)}:mailto:${params.attendeeEmail}`,
    "STATUS:CANCELLED",
    "SEQUENCE:1",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}