/**
 * Email Service — Resend
 *
 * Handles all transactional emails:
 * - Booking confirmations (caller + host)
 * - Gift notifications
 * - Cancellation notices
 * - Session booking confirmations
 *
 * Each email includes a .ics calendar invite as an attachment.
 * Calendar reminders (30min, 10min) are handled by the user's
 * calendar app — no cron job needed.
 */

import { Resend } from "resend";
import { env } from "../config/env.js";
import {
  generateBookingInvite,
  generateCancellationInvite,
} from "./calendar.service.js";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = env().RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY not set — emails disabled");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

const FROM_ADDRESS = "Ledgerly <noreply@ledgerly.vidbloq.com>";

// ============================================
// Shared helpers
// ============================================

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatUSDC(amount: string | number): string {
  const num = Number(amount) / 1_000_000;
  return `${num.toFixed(2)} USDC`;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    });
    console.log(`[EMAIL] Sent "${params.subject}" to ${params.to}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${params.to}:`, err);
    return false;
  }
}

// ============================================
// Booking confirmed — email to caller
// ============================================

export async function sendBookingConfirmationToCaller(booking: {
  id: string;
  callerName: string;
  callerEmail: string;
  hostName: string;
  hostEmail?: string;
  scheduledAt: string;
  durationMinutes: number;
  amount: string;
  hostSlug: string;
}): Promise<boolean> {
  const frontendUrl = env().FRONTEND_URL;
  const joinUrl = `${frontendUrl}/booking/${booking.id}`;

  const ics = generateBookingInvite({
    uid: booking.id,
    title: `Call with ${booking.hostName}`,
    description: `Your paid session with ${booking.hostName} on Ledgerly.`,
    startTime: new Date(booking.scheduledAt),
    durationMinutes: booking.durationMinutes,
    hostName: booking.hostName,
    hostEmail: booking.hostEmail,
    attendeeName: booking.callerName,
    attendeeEmail: booking.callerEmail,
    joinUrl,
  });

  return sendEmail({
    to: booking.callerEmail,
    subject: `Booking confirmed — ${booking.hostName} on ${formatDate(booking.scheduledAt)}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Booking Confirmed</h2>
        <p>Hi ${booking.callerName},</p>
        <p>Your session with <strong>${booking.hostName}</strong> is confirmed.</p>
        <div style="background: #f8f8fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(booking.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTime(booking.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${booking.durationMinutes} minutes</p>
          <p style="margin: 4px 0;"><strong>Amount:</strong> ${formatUSDC(booking.amount)}</p>
        </div>
        <a href="${joinUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">
          View Booking
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          A calendar invite is attached. Add it to your calendar to get reminders before the call.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: "booking.ics",
        content: ics,
        contentType: "text/calendar; method=REQUEST",
      },
    ],
  });
}

// ============================================
// Booking confirmed — email to host
// ============================================

export async function sendBookingNotificationToHost(booking: {
  id: string;
  callerName: string;
  callerEmail: string;
  hostName: string;
  hostEmail: string;
  scheduledAt: string;
  durationMinutes: number;
  amount: string;
  isGift?: boolean;
  participantName?: string;
}): Promise<boolean> {
  const frontendUrl = env().FRONTEND_URL;
  const dashboardUrl = `${frontendUrl}/dashboard`;

  const attendeeName = booking.isGift && booking.participantName
    ? `${booking.participantName} (gifted by ${booking.callerName})`
    : booking.callerName;

  const ics = generateBookingInvite({
    uid: booking.id,
    title: `Call with ${attendeeName}`,
    description: `Paid session booked on Ledgerly.`,
    startTime: new Date(booking.scheduledAt),
    durationMinutes: booking.durationMinutes,
    hostName: booking.hostName,
    hostEmail: booking.hostEmail,
    attendeeName,
    attendeeEmail: booking.callerEmail,
    joinUrl: dashboardUrl,
  });

  return sendEmail({
    to: booking.hostEmail,
    subject: `New booking — ${attendeeName} on ${formatDate(booking.scheduledAt)}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">New Booking</h2>
        <p>Hi ${booking.hostName},</p>
        <p>You have a new booking from <strong>${attendeeName}</strong>.</p>
        <div style="background: #f8f8fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>With:</strong> ${attendeeName}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(booking.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTime(booking.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${booking.durationMinutes} minutes</p>
          <p style="margin: 4px 0;"><strong>Amount:</strong> ${formatUSDC(booking.amount)}</p>
        </div>
        <a href="${dashboardUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">
          View Dashboard
        </a>
      </div>
    `,
    attachments: [
      {
        filename: "booking.ics",
        content: ics,
        contentType: "text/calendar; method=REQUEST",
      },
    ],
  });
}

// ============================================
// Gift notification — email to recipient
// ============================================

export async function sendGiftNotification(params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  hostName: string;
  hostSlug: string;
  scheduledAt: string;
  durationMinutes: number;
  claimUrl: string;
}): Promise<boolean> {
  return sendEmail({
    to: params.recipientEmail,
    subject: `${params.senderName} gifted you a session with ${params.hostName}!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">You've received a gift!</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.senderName}</strong> has gifted you a session with <strong>${params.hostName}</strong>.</p>
        <div style="background: #f8f8fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Host:</strong> ${params.hostName}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(params.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTime(params.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${params.durationMinutes} minutes</p>
        </div>
        <p>Click below to claim your session and connect your wallet:</p>
        <a href="${params.claimUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">
          Claim Your Gift
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          You'll need to connect a Solana wallet to join the call. No payment required — it's been taken care of!
        </p>
      </div>
    `,
  });
}

// ============================================
// Cancellation — email to caller
// ============================================

export async function sendCancellationToCaller(booking: {
  id: string;
  callerName: string;
  callerEmail: string;
  hostName: string;
  hostEmail?: string;
  scheduledAt: string;
  durationMinutes: number;
  amount: string;
  cancelledBy: "host" | "caller";
}): Promise<boolean> {
  const ics = generateCancellationInvite({
    uid: booking.id,
    title: `Call with ${booking.hostName}`,
    startTime: new Date(booking.scheduledAt),
    durationMinutes: booking.durationMinutes,
    hostName: booking.hostName,
    hostEmail: booking.hostEmail,
    attendeeName: booking.callerName,
    attendeeEmail: booking.callerEmail,
  });

  const cancelMessage =
    booking.cancelledBy === "host"
      ? `${booking.hostName} has cancelled this session.`
      : "Your booking has been cancelled.";

  return sendEmail({
    to: booking.callerEmail,
    subject: `Booking cancelled — ${booking.hostName} on ${formatDate(booking.scheduledAt)}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Booking Cancelled</h2>
        <p>Hi ${booking.callerName},</p>
        <p>${cancelMessage}</p>
        <div style="background: #f8f8fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Host:</strong> ${booking.hostName}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(booking.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTime(booking.scheduledAt)}</p>
        </div>
        <p>A refund of <strong>${formatUSDC(booking.amount)}</strong> has been issued to your wallet.</p>
      </div>
    `,
    attachments: [
      {
        filename: "cancellation.ics",
        content: ics,
        contentType: "text/calendar; method=CANCEL",
      },
    ],
  });
}

// ============================================
// Cancellation — email to host
// ============================================

export async function sendCancellationToHost(booking: {
  id: string;
  callerName: string;
  hostName: string;
  hostEmail: string;
  scheduledAt: string;
  durationMinutes: number;
  cancelledBy: "host" | "caller";
}): Promise<boolean> {
  if (booking.cancelledBy === "host") return true; // host already knows

  const ics = generateCancellationInvite({
    uid: booking.id,
    title: `Call with ${booking.callerName}`,
    startTime: new Date(booking.scheduledAt),
    durationMinutes: booking.durationMinutes,
    hostName: booking.hostName,
    hostEmail: booking.hostEmail,
    attendeeName: booking.callerName,
    attendeeEmail: "noreply@ledgerly.com",
  });

  return sendEmail({
    to: booking.hostEmail,
    subject: `Booking cancelled — ${booking.callerName} on ${formatDate(booking.scheduledAt)}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Booking Cancelled</h2>
        <p>Hi ${booking.hostName},</p>
        <p><strong>${booking.callerName}</strong> has cancelled their booking.</p>
        <div style="background: #f8f8fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(booking.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTime(booking.scheduledAt)}</p>
        </div>
        <p>This time slot is now available for new bookings.</p>
      </div>
    `,
    attachments: [
      {
        filename: "cancellation.ics",
        content: ics,
        contentType: "text/calendar; method=CANCEL",
      },
    ],
  });
}

// ============================================
// Session booking — email to participant
// ============================================

export async function sendSessionBookingConfirmation(params: {
  bookingId: string;
  callerName: string;
  callerEmail: string;
  hostName: string;
  hostEmail?: string;
  sessionTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  amount: string;
  sessionId: string;
}): Promise<boolean> {
  const frontendUrl = env().FRONTEND_URL;
  const joinUrl = `${frontendUrl}/session/${params.sessionId}`;

  const ics = generateBookingInvite({
    uid: params.bookingId,
    title: params.sessionTitle,
    description: `Group session hosted by ${params.hostName} on Ledgerly.`,
    startTime: new Date(params.scheduledAt),
    durationMinutes: params.durationMinutes,
    hostName: params.hostName,
    hostEmail: params.hostEmail,
    attendeeName: params.callerName,
    attendeeEmail: params.callerEmail,
    joinUrl,
  });

  return sendEmail({
    to: params.callerEmail,
    subject: `Spot confirmed — ${params.sessionTitle} on ${formatDate(params.scheduledAt)}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Spot Confirmed</h2>
        <p>Hi ${params.callerName},</p>
        <p>You're booked into <strong>${params.sessionTitle}</strong> with ${params.hostName}.</p>
        <div style="background: #f8f8fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Session:</strong> ${params.sessionTitle}</p>
          <p style="margin: 4px 0;"><strong>Host:</strong> ${params.hostName}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(params.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${formatTime(params.scheduledAt)}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> ${params.durationMinutes} minutes</p>
          <p style="margin: 4px 0;"><strong>Amount:</strong> ${formatUSDC(params.amount)}</p>
        </div>
        <a href="${joinUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">
          View Session
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          A calendar invite is attached with reminders before the session.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: "session.ics",
        content: ics,
        contentType: "text/calendar; method=REQUEST",
      },
    ],
  });
}