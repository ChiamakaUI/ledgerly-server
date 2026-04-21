/**
 * Vidbloq Service — server-to-server HTTP client
 *
 * Calls Vidbloq's existing REST API to create rooms and generate
 * participant tokens. Auth via tenant API key/secret headers.
 */

import { env } from "../config/env.js";

// ============================================
// Response types (matching Vidbloq's API shapes)
// ============================================

export interface VidbloqStream {
  id: string;
  name: string;
  title: string | null;
  callType: string;
  streamSessionType: string;
  creatorWallet: string;
  hasHost: boolean;
  isLive: boolean;
  isPublic: boolean;
  tenantId: string;
  createdAt: string;
}

export interface VidbloqTokenResponse {
  token: string;
  userType: "host" | "co-host" | "guest";
}

export interface VidbloqEndStreamResponse {
  message: string;
  streamId: string;
  streamName: string;
  duration: number | null;
}

// ============================================
// HTTP client
// ============================================

async function vidbloqRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { VIDBLOQ_API_URL, VIDBLOQ_API_KEY, VIDBLOQ_API_SECRET } = env();
  const url = `${VIDBLOQ_API_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": VIDBLOQ_API_KEY,
      "x-api-secret": VIDBLOQ_API_SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Vidbloq API ${method} ${path} failed (${res.status}): ${errorText}`
    );
  }

  return res.json() as Promise<T>;
}

// ============================================
// Public API
// ============================================

/**
 * Create a Vidbloq room for a booking.
 *
 * Uses the call host's wallet so they get the "host" userType
 * when they join. StreamSessionType is "Meeting" for 1:1 calls.
 */
export async function createVidbloqRoom(params: {
  hostWallet: string;
  title: string;
  callType?: "Video" | "Audio";
  scheduledFor?: string;
}): Promise<VidbloqStream> {
  return vidbloqRequest<VidbloqStream>("POST", "/stream", {
    wallet: params.hostWallet,
    callType: (params.callType || "Video").toLowerCase(),
    title: params.title,
    streamSessionType: "Meeting",
    fundingType: "Conditional",
    isPublic: false,
    scheduledFor: params.scheduledFor,
  });
}

/**
 * Generate a participant token for joining a room.
 *
 * Vidbloq determines the userType based on whether the wallet
 * matches the stream creator (host) or not (co-host for meetings).
 */
export async function createVidbloqToken(params: {
  roomName: string;
  userName: string;
  wallet: string;
  avatarUrl?: string;
}): Promise<VidbloqTokenResponse> {
  return vidbloqRequest<VidbloqTokenResponse>("POST", "/stream/token", {
    roomName: params.roomName,
    userName: params.userName,
    wallet: params.wallet,
    avatarUrl: params.avatarUrl || null,
  });
}

/**
 * End a room. Only the host wallet can do this.
 */
export async function endVidbloqRoom(params: {
  roomName: string;
  hostWallet: string;
}): Promise<VidbloqEndStreamResponse> {
  return vidbloqRequest<VidbloqEndStreamResponse>(
    "PUT",
    `/stream/${params.roomName}/end`,
    { wallet: params.hostWallet }
  );
}

/**
 * Get room details.
 */
export async function getVidbloqRoom(
  roomName: string
): Promise<VidbloqStream> {
  return vidbloqRequest<VidbloqStream>("GET", `/stream/${roomName}`);
}