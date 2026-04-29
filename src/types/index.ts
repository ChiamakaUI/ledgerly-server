// ============================================
// API request types
// ============================================

export interface CreateHostRequest {
  walletAddress: string;
  name: string;
  slug: string;
  rate: number;
  durationMinutes?: number;
  bio?: string;
  timezone?: string;
  email?: string;
}

export interface UpdateHostRequest {
  name?: string;
  bio?: string;
  rate?: number;
  durationMinutes?: number;
  isActive?: boolean;
  timezone?: string;
  email?: string;
}

export interface SetAvailabilityRequest {
  rules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

export interface SetOverridesRequest {
  overrides: Array<{
    date: string;
    isBlocked: boolean;
    startTime?: string;
    endTime?: string;
  }>;
}

export interface CreateBookingRequest {
  hostSlug: string;
  scheduledAt: string;
  callerWallet: string;
  callerName: string;
  callerEmail: string;
  sessionId?: string; // if booking into an existing group session
}

export interface CreateSessionRequest {
  hostSlug: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  rate?: number;        // override host default rate
  maxParticipants: number;
  sessionType: "one_on_one" | "group";
}

export interface BookSessionRequest {
  sessionId: string;
  callerWallet: string;
  callerName: string;
  callerEmail: string;
}

export interface ConfirmPaymentRequest {
  signature: string;
}

export interface CancelBookingRequest {
  callerWallet: string;
  reason?: string;
}

export interface ConfirmCallRequest {
  hostWallet: string;
}

// ============================================
// Solana instruction (serialized for client)
// ============================================

export interface SerializedInstruction {
  keys: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  programId: string;
  data: string;
}

// ============================================
// Slot calculation
// ============================================

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}