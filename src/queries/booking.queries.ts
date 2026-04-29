/** Types generated for queries found in "src/queries/booking.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type booking_status = 'active' | 'completed' | 'expired' | 'no_show' | 'paid' | 'pending_payment' | 'refunded';

export type DateOrString = Date | string;

export type NumberOrString = number | string;

/** 'CreateBooking' parameters type */
export interface ICreateBookingParams {
  amount?: NumberOrString | null | void;
  callerEmail?: string | null | void;
  callerName?: string | null | void;
  callerWallet?: string | null | void;
  donorPda?: string | null | void;
  durationMinutes?: number | null | void;
  hostId?: string | null | void;
  paymentExpiresAt?: DateOrString | null | void;
  scheduledAt?: DateOrString | null | void;
  sessionId?: string | null | void;
  streamAta?: string | null | void;
  streamName?: string | null | void;
  streamPda?: string | null | void;
  timezone?: string | null | void;
}

/** 'CreateBooking' return type */
export interface ICreateBookingResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'CreateBooking' query type */
export interface ICreateBookingQuery {
  params: ICreateBookingParams;
  result: ICreateBookingResult;
}

const createBookingIR: any = {"usedParamSet":{"hostId":true,"callerWallet":true,"callerName":true,"callerEmail":true,"scheduledAt":true,"durationMinutes":true,"timezone":true,"amount":true,"streamName":true,"streamPda":true,"streamAta":true,"donorPda":true,"paymentExpiresAt":true,"sessionId":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":242,"b":248}]},{"name":"callerWallet","required":false,"transform":{"type":"scalar"},"locs":[{"a":251,"b":263}]},{"name":"callerName","required":false,"transform":{"type":"scalar"},"locs":[{"a":266,"b":276}]},{"name":"callerEmail","required":false,"transform":{"type":"scalar"},"locs":[{"a":279,"b":290}]},{"name":"scheduledAt","required":false,"transform":{"type":"scalar"},"locs":[{"a":297,"b":308}]},{"name":"durationMinutes","required":false,"transform":{"type":"scalar"},"locs":[{"a":311,"b":326}]},{"name":"timezone","required":false,"transform":{"type":"scalar"},"locs":[{"a":329,"b":337}]},{"name":"amount","required":false,"transform":{"type":"scalar"},"locs":[{"a":340,"b":346}]},{"name":"streamName","required":false,"transform":{"type":"scalar"},"locs":[{"a":372,"b":382}]},{"name":"streamPda","required":false,"transform":{"type":"scalar"},"locs":[{"a":385,"b":394}]},{"name":"streamAta","required":false,"transform":{"type":"scalar"},"locs":[{"a":397,"b":406}]},{"name":"donorPda","required":false,"transform":{"type":"scalar"},"locs":[{"a":409,"b":417}]},{"name":"paymentExpiresAt","required":false,"transform":{"type":"scalar"},"locs":[{"a":424,"b":440}]},{"name":"sessionId","required":false,"transform":{"type":"scalar"},"locs":[{"a":443,"b":452}]}],"statement":"INSERT INTO bookings (\n    host_id, caller_wallet, caller_name, caller_email,\n    scheduled_at, duration_minutes, timezone, amount, status,\n    stream_name, stream_pda, stream_ata, donor_pda,\n    payment_expires_at, session_id\n) VALUES (\n    :hostId, :callerWallet, :callerName, :callerEmail,\n    :scheduledAt, :durationMinutes, :timezone, :amount, 'pending_payment',\n    :streamName, :streamPda, :streamAta, :donorPda,\n    :paymentExpiresAt, :sessionId\n)\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO bookings (
 *     host_id, caller_wallet, caller_name, caller_email,
 *     scheduled_at, duration_minutes, timezone, amount, status,
 *     stream_name, stream_pda, stream_ata, donor_pda,
 *     payment_expires_at, session_id
 * ) VALUES (
 *     :hostId, :callerWallet, :callerName, :callerEmail,
 *     :scheduledAt, :durationMinutes, :timezone, :amount, 'pending_payment',
 *     :streamName, :streamPda, :streamAta, :donorPda,
 *     :paymentExpiresAt, :sessionId
 * )
 * RETURNING *
 * ```
 */
export const createBooking = new PreparedQuery<ICreateBookingParams,ICreateBookingResult>(createBookingIR);


/** 'GetBookingById' parameters type */
export interface IGetBookingByIdParams {
  id?: string | null | void;
}

/** 'GetBookingById' return type */
export interface IGetBookingByIdResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetBookingById' query type */
export interface IGetBookingByIdQuery {
  params: IGetBookingByIdParams;
  result: IGetBookingByIdResult;
}

const getBookingByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":115,"b":117}]}],"statement":"SELECT b.*, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.id = :id
 * ```
 */
export const getBookingById = new PreparedQuery<IGetBookingByIdParams,IGetBookingByIdResult>(getBookingByIdIR);


/** 'GetBookingWithHost' parameters type */
export interface IGetBookingWithHostParams {
  id?: string | null | void;
}

/** 'GetBookingWithHost' return type */
export interface IGetBookingWithHostResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  feePercentage: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  hostWallet: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetBookingWithHost' query type */
export interface IGetBookingWithHostQuery {
  params: IGetBookingWithHostParams;
  result: IGetBookingWithHostResult;
}

const getBookingWithHostIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":166,"b":168}]}],"statement":"SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.id = :id
 * ```
 */
export const getBookingWithHost = new PreparedQuery<IGetBookingWithHostParams,IGetBookingWithHostResult>(getBookingWithHostIR);


/** 'GetBookingsByCallerWallet' parameters type */
export interface IGetBookingsByCallerWalletParams {
  callerWallet?: string | null | void;
  limit?: NumberOrString | null | void;
  offset?: NumberOrString | null | void;
}

/** 'GetBookingsByCallerWallet' return type */
export interface IGetBookingsByCallerWalletResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetBookingsByCallerWallet' query type */
export interface IGetBookingsByCallerWalletQuery {
  params: IGetBookingsByCallerWalletParams;
  result: IGetBookingsByCallerWalletResult;
}

const getBookingsByCallerWalletIR: any = {"usedParamSet":{"callerWallet":true,"limit":true,"offset":true},"params":[{"name":"callerWallet","required":false,"transform":{"type":"scalar"},"locs":[{"a":126,"b":138}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":175,"b":180}]},{"name":"offset","required":false,"transform":{"type":"scalar"},"locs":[{"a":189,"b":195}]}],"statement":"SELECT b.*, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.caller_wallet = :callerWallet\nORDER BY b.scheduled_at DESC\nLIMIT :limit OFFSET :offset"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.caller_wallet = :callerWallet
 * ORDER BY b.scheduled_at DESC
 * LIMIT :limit OFFSET :offset
 * ```
 */
export const getBookingsByCallerWallet = new PreparedQuery<IGetBookingsByCallerWalletParams,IGetBookingsByCallerWalletResult>(getBookingsByCallerWalletIR);


/** 'CountBookingsByCallerWallet' parameters type */
export interface ICountBookingsByCallerWalletParams {
  callerWallet?: string | null | void;
}

/** 'CountBookingsByCallerWallet' return type */
export interface ICountBookingsByCallerWalletResult {
  count: number | null;
}

/** 'CountBookingsByCallerWallet' query type */
export interface ICountBookingsByCallerWalletQuery {
  params: ICountBookingsByCallerWalletParams;
  result: ICountBookingsByCallerWalletResult;
}

const countBookingsByCallerWalletIR: any = {"usedParamSet":{"callerWallet":true},"params":[{"name":"callerWallet","required":false,"transform":{"type":"scalar"},"locs":[{"a":66,"b":78}]}],"statement":"SELECT COUNT(*)::int as count FROM bookings\nWHERE caller_wallet = :callerWallet"};

/**
 * Query generated from SQL:
 * ```
 * SELECT COUNT(*)::int as count FROM bookings
 * WHERE caller_wallet = :callerWallet
 * ```
 */
export const countBookingsByCallerWallet = new PreparedQuery<ICountBookingsByCallerWalletParams,ICountBookingsByCallerWalletResult>(countBookingsByCallerWalletIR);


/** 'GetBookingsByHostId' parameters type */
export interface IGetBookingsByHostIdParams {
  hostId?: string | null | void;
  limit?: NumberOrString | null | void;
  offset?: NumberOrString | null | void;
}

/** 'GetBookingsByHostId' return type */
export interface IGetBookingsByHostIdResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetBookingsByHostId' query type */
export interface IGetBookingsByHostIdQuery {
  params: IGetBookingsByHostIdParams;
  result: IGetBookingsByHostIdResult;
}

const getBookingsByHostIdIR: any = {"usedParamSet":{"hostId":true,"limit":true,"offset":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":126}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":163,"b":168}]},{"name":"offset","required":false,"transform":{"type":"scalar"},"locs":[{"a":177,"b":183}]}],"statement":"SELECT b.*, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.host_id = :hostId\nORDER BY b.scheduled_at DESC\nLIMIT :limit OFFSET :offset"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.host_id = :hostId
 * ORDER BY b.scheduled_at DESC
 * LIMIT :limit OFFSET :offset
 * ```
 */
export const getBookingsByHostId = new PreparedQuery<IGetBookingsByHostIdParams,IGetBookingsByHostIdResult>(getBookingsByHostIdIR);


/** 'GetBookingsByHostIdAndStatus' parameters type */
export interface IGetBookingsByHostIdAndStatusParams {
  hostId?: string | null | void;
  limit?: NumberOrString | null | void;
  offset?: NumberOrString | null | void;
  status?: booking_status | null | void;
}

/** 'GetBookingsByHostIdAndStatus' return type */
export interface IGetBookingsByHostIdAndStatusResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetBookingsByHostIdAndStatus' query type */
export interface IGetBookingsByHostIdAndStatusQuery {
  params: IGetBookingsByHostIdAndStatusParams;
  result: IGetBookingsByHostIdAndStatusResult;
}

const getBookingsByHostIdAndStatusIR: any = {"usedParamSet":{"hostId":true,"status":true,"limit":true,"offset":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":126}]},{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":143,"b":149}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":186,"b":191}]},{"name":"offset","required":false,"transform":{"type":"scalar"},"locs":[{"a":200,"b":206}]}],"statement":"SELECT b.*, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.host_id = :hostId AND b.status = :status\nORDER BY b.scheduled_at DESC\nLIMIT :limit OFFSET :offset"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.host_id = :hostId AND b.status = :status
 * ORDER BY b.scheduled_at DESC
 * LIMIT :limit OFFSET :offset
 * ```
 */
export const getBookingsByHostIdAndStatus = new PreparedQuery<IGetBookingsByHostIdAndStatusParams,IGetBookingsByHostIdAndStatusResult>(getBookingsByHostIdAndStatusIR);


/** 'CountBookingsByHostId' parameters type */
export interface ICountBookingsByHostIdParams {
  hostId?: string | null | void;
}

/** 'CountBookingsByHostId' return type */
export interface ICountBookingsByHostIdResult {
  count: number | null;
}

/** 'CountBookingsByHostId' query type */
export interface ICountBookingsByHostIdQuery {
  params: ICountBookingsByHostIdParams;
  result: ICountBookingsByHostIdResult;
}

const countBookingsByHostIdIR: any = {"usedParamSet":{"hostId":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":60,"b":66}]}],"statement":"SELECT COUNT(*)::int as count FROM bookings\nWHERE host_id = :hostId"};

/**
 * Query generated from SQL:
 * ```
 * SELECT COUNT(*)::int as count FROM bookings
 * WHERE host_id = :hostId
 * ```
 */
export const countBookingsByHostId = new PreparedQuery<ICountBookingsByHostIdParams,ICountBookingsByHostIdResult>(countBookingsByHostIdIR);


/** 'CountBookingsByHostIdAndStatus' parameters type */
export interface ICountBookingsByHostIdAndStatusParams {
  hostId?: string | null | void;
  status?: booking_status | null | void;
}

/** 'CountBookingsByHostIdAndStatus' return type */
export interface ICountBookingsByHostIdAndStatusResult {
  count: number | null;
}

/** 'CountBookingsByHostIdAndStatus' query type */
export interface ICountBookingsByHostIdAndStatusQuery {
  params: ICountBookingsByHostIdAndStatusParams;
  result: ICountBookingsByHostIdAndStatusResult;
}

const countBookingsByHostIdAndStatusIR: any = {"usedParamSet":{"hostId":true,"status":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":60,"b":66}]},{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":81,"b":87}]}],"statement":"SELECT COUNT(*)::int as count FROM bookings\nWHERE host_id = :hostId AND status = :status"};

/**
 * Query generated from SQL:
 * ```
 * SELECT COUNT(*)::int as count FROM bookings
 * WHERE host_id = :hostId AND status = :status
 * ```
 */
export const countBookingsByHostIdAndStatus = new PreparedQuery<ICountBookingsByHostIdAndStatusParams,ICountBookingsByHostIdAndStatusResult>(countBookingsByHostIdAndStatusIR);


/** 'CheckSlotConflict' parameters type */
export interface ICheckSlotConflictParams {
  hostId?: string | null | void;
  scheduledAt?: DateOrString | null | void;
}

/** 'CheckSlotConflict' return type */
export interface ICheckSlotConflictResult {
  id: string;
}

/** 'CheckSlotConflict' query type */
export interface ICheckSlotConflictQuery {
  params: ICheckSlotConflictParams;
  result: ICheckSlotConflictResult;
}

const checkSlotConflictIR: any = {"usedParamSet":{"hostId":true,"scheduledAt":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":40,"b":46}]},{"name":"scheduledAt","required":false,"transform":{"type":"scalar"},"locs":[{"a":67,"b":78}]}],"statement":"SELECT id FROM bookings\nWHERE host_id = :hostId AND scheduled_at = :scheduledAt\nAND status IN ('pending_payment', 'paid', 'active')"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id FROM bookings
 * WHERE host_id = :hostId AND scheduled_at = :scheduledAt
 * AND status IN ('pending_payment', 'paid', 'active')
 * ```
 */
export const checkSlotConflict = new PreparedQuery<ICheckSlotConflictParams,ICheckSlotConflictResult>(checkSlotConflictIR);


/** 'GetBookedSlotsForDate' parameters type */
export interface IGetBookedSlotsForDateParams {
  hostId?: string | null | void;
  targetDate?: DateOrString | null | void;
}

/** 'GetBookedSlotsForDate' return type */
export interface IGetBookedSlotsForDateResult {
  durationMinutes: number;
  scheduledAt: Date;
}

/** 'GetBookedSlotsForDate' query type */
export interface IGetBookedSlotsForDateQuery {
  params: IGetBookedSlotsForDateParams;
  result: IGetBookedSlotsForDateResult;
}

const getBookedSlotsForDateIR: any = {"usedParamSet":{"hostId":true,"targetDate":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":68,"b":74}]},{"name":"targetDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":101,"b":111}]}],"statement":"SELECT scheduled_at, duration_minutes FROM bookings\nWHERE host_id = :hostId\nAND scheduled_at::date = :targetDate::date\nAND status IN ('pending_payment', 'paid', 'active')\nORDER BY scheduled_at"};

/**
 * Query generated from SQL:
 * ```
 * SELECT scheduled_at, duration_minutes FROM bookings
 * WHERE host_id = :hostId
 * AND scheduled_at::date = :targetDate::date
 * AND status IN ('pending_payment', 'paid', 'active')
 * ORDER BY scheduled_at
 * ```
 */
export const getBookedSlotsForDate = new PreparedQuery<IGetBookedSlotsForDateParams,IGetBookedSlotsForDateResult>(getBookedSlotsForDateIR);


/** 'UpdateBookingStatus' parameters type */
export interface IUpdateBookingStatusParams {
  id?: string | null | void;
  status?: booking_status | null | void;
}

/** 'UpdateBookingStatus' return type */
export interface IUpdateBookingStatusResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'UpdateBookingStatus' query type */
export interface IUpdateBookingStatusQuery {
  params: IUpdateBookingStatusParams;
  result: IUpdateBookingStatusResult;
}

const updateBookingStatusIR: any = {"usedParamSet":{"status":true,"id":true},"params":[{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":29,"b":35}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":68,"b":70}]}],"statement":"UPDATE bookings\nSET status = :status, updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET status = :status, updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const updateBookingStatus = new PreparedQuery<IUpdateBookingStatusParams,IUpdateBookingStatusResult>(updateBookingStatusIR);


/** 'ConfirmBookingPayment' parameters type */
export interface IConfirmBookingPaymentParams {
  depositSignature?: string | null | void;
  id?: string | null | void;
  vidbloqRoom?: string | null | void;
}

/** 'ConfirmBookingPayment' return type */
export interface IConfirmBookingPaymentResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'ConfirmBookingPayment' query type */
export interface IConfirmBookingPaymentQuery {
  params: IConfirmBookingPaymentParams;
  result: IConfirmBookingPaymentResult;
}

const confirmBookingPaymentIR: any = {"usedParamSet":{"depositSignature":true,"vidbloqRoom":true,"id":true},"params":[{"name":"depositSignature","required":false,"transform":{"type":"scalar"},"locs":[{"a":61,"b":77}]},{"name":"vidbloqRoom","required":false,"transform":{"type":"scalar"},"locs":[{"a":99,"b":110}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":147,"b":149}]}],"statement":"UPDATE bookings\nSET status = 'paid',\n    deposit_signature = :depositSignature,\n    vidbloq_room = :vidbloqRoom,\n    updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET status = 'paid',
 *     deposit_signature = :depositSignature,
 *     vidbloq_room = :vidbloqRoom,
 *     updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const confirmBookingPayment = new PreparedQuery<IConfirmBookingPaymentParams,IConfirmBookingPaymentResult>(confirmBookingPaymentIR);


/** 'CompleteBooking' parameters type */
export interface ICompleteBookingParams {
  distributeSignature?: string | null | void;
  id?: string | null | void;
}

/** 'CompleteBooking' return type */
export interface ICompleteBookingResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'CompleteBooking' query type */
export interface ICompleteBookingQuery {
  params: ICompleteBookingParams;
  result: ICompleteBookingResult;
}

const completeBookingIR: any = {"usedParamSet":{"distributeSignature":true,"id":true},"params":[{"name":"distributeSignature","required":false,"transform":{"type":"scalar"},"locs":[{"a":69,"b":88}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":152,"b":154}]}],"statement":"UPDATE bookings\nSET status = 'completed',\n    distribute_signature = :distributeSignature,\n    call_ended_at = now(),\n    updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET status = 'completed',
 *     distribute_signature = :distributeSignature,
 *     call_ended_at = now(),
 *     updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const completeBooking = new PreparedQuery<ICompleteBookingParams,ICompleteBookingResult>(completeBookingIR);


/** 'RefundBooking' parameters type */
export interface IRefundBookingParams {
  id?: string | null | void;
  refundReason?: string | null | void;
  refundSignature?: string | null | void;
}

/** 'RefundBooking' return type */
export interface IRefundBookingResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'RefundBooking' query type */
export interface IRefundBookingQuery {
  params: IRefundBookingParams;
  result: IRefundBookingResult;
}

const refundBookingIR: any = {"usedParamSet":{"refundSignature":true,"refundReason":true,"id":true},"params":[{"name":"refundSignature","required":false,"transform":{"type":"scalar"},"locs":[{"a":64,"b":79}]},{"name":"refundReason","required":false,"transform":{"type":"scalar"},"locs":[{"a":102,"b":114}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":151,"b":153}]}],"statement":"UPDATE bookings\nSET status = 'refunded',\n    refund_signature = :refundSignature,\n    refund_reason = :refundReason,\n    updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET status = 'refunded',
 *     refund_signature = :refundSignature,
 *     refund_reason = :refundReason,
 *     updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const refundBooking = new PreparedQuery<IRefundBookingParams,IRefundBookingResult>(refundBookingIR);


/** 'MarkNoShow' parameters type */
export interface IMarkNoShowParams {
  id?: string | null | void;
  refundSignature?: string | null | void;
}

/** 'MarkNoShow' return type */
export interface IMarkNoShowResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'MarkNoShow' query type */
export interface IMarkNoShowQuery {
  params: IMarkNoShowParams;
  result: IMarkNoShowResult;
}

const markNoShowIR: any = {"usedParamSet":{"refundSignature":true,"id":true},"params":[{"name":"refundSignature","required":false,"transform":{"type":"scalar"},"locs":[{"a":63,"b":78}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":168,"b":170}]}],"statement":"UPDATE bookings\nSET status = 'no_show',\n    refund_signature = :refundSignature,\n    refund_reason = 'No-show: neither party joined',\n    updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET status = 'no_show',
 *     refund_signature = :refundSignature,
 *     refund_reason = 'No-show: neither party joined',
 *     updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const markNoShow = new PreparedQuery<IMarkNoShowParams,IMarkNoShowResult>(markNoShowIR);


/** 'ExpireUnpaidBookings' parameters type */
export type IExpireUnpaidBookingsParams = void;

/** 'ExpireUnpaidBookings' return type */
export type IExpireUnpaidBookingsResult = void;

/** 'ExpireUnpaidBookings' query type */
export interface IExpireUnpaidBookingsQuery {
  params: IExpireUnpaidBookingsParams;
  result: IExpireUnpaidBookingsResult;
}

const expireUnpaidBookingsIR: any = {"usedParamSet":{},"params":[],"statement":"UPDATE bookings\nSET status = 'expired', updated_at = now()\nWHERE status = 'pending_payment'\nAND payment_expires_at < now()"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET status = 'expired', updated_at = now()
 * WHERE status = 'pending_payment'
 * AND payment_expires_at < now()
 * ```
 */
export const expireUnpaidBookings = new PreparedQuery<IExpireUnpaidBookingsParams,IExpireUnpaidBookingsResult>(expireUnpaidBookingsIR);


/** 'GetNoShowBookings' parameters type */
export interface IGetNoShowBookingsParams {
  graceMinutes?: number | null | void;
}

/** 'GetNoShowBookings' return type */
export interface IGetNoShowBookingsResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetNoShowBookings' query type */
export interface IGetNoShowBookingsQuery {
  params: IGetNoShowBookingsParams;
  result: IGetNoShowBookingsResult;
}

const getNoShowBookingsIR: any = {"usedParamSet":{"graceMinutes":true},"params":[{"name":"graceMinutes","required":false,"transform":{"type":"scalar"},"locs":[{"a":85,"b":97}]}],"statement":"SELECT * FROM bookings\nWHERE status = 'paid'\nAND scheduled_at + ((duration_minutes + :graceMinutes) * interval '1 minute') < now()\nAND call_started_at IS NULL"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM bookings
 * WHERE status = 'paid'
 * AND scheduled_at + ((duration_minutes + :graceMinutes) * interval '1 minute') < now()
 * AND call_started_at IS NULL
 * ```
 */
export const getNoShowBookings = new PreparedQuery<IGetNoShowBookingsParams,IGetNoShowBookingsResult>(getNoShowBookingsIR);


/** 'GetIncompleteActiveBookings' parameters type */
export type IGetIncompleteActiveBookingsParams = void;

/** 'GetIncompleteActiveBookings' return type */
export interface IGetIncompleteActiveBookingsResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetIncompleteActiveBookings' query type */
export interface IGetIncompleteActiveBookingsQuery {
  params: IGetIncompleteActiveBookingsParams;
  result: IGetIncompleteActiveBookingsResult;
}

const getIncompleteActiveBookingsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM bookings\nWHERE status = 'active'\nAND call_ended_at IS NOT NULL\nAND distribute_signature IS NULL"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM bookings
 * WHERE status = 'active'
 * AND call_ended_at IS NOT NULL
 * AND distribute_signature IS NULL
 * ```
 */
export const getIncompleteActiveBookings = new PreparedQuery<IGetIncompleteActiveBookingsParams,IGetIncompleteActiveBookingsResult>(getIncompleteActiveBookingsIR);


/** 'RecordCallerJoined' parameters type */
export interface IRecordCallerJoinedParams {
  id?: string | null | void;
}

/** 'RecordCallerJoined' return type */
export interface IRecordCallerJoinedResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'RecordCallerJoined' query type */
export interface IRecordCallerJoinedQuery {
  params: IRecordCallerJoinedParams;
  result: IRecordCallerJoinedResult;
}

const recordCallerJoinedIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":76,"b":78}]}],"statement":"UPDATE bookings\nSET caller_joined_at = now(), updated_at = now()\nWHERE id = :id AND caller_joined_at IS NULL\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET caller_joined_at = now(), updated_at = now()
 * WHERE id = :id AND caller_joined_at IS NULL
 * RETURNING *
 * ```
 */
export const recordCallerJoined = new PreparedQuery<IRecordCallerJoinedParams,IRecordCallerJoinedResult>(recordCallerJoinedIR);


/** 'RecordHostJoined' parameters type */
export interface IRecordHostJoinedParams {
  id?: string | null | void;
}

/** 'RecordHostJoined' return type */
export interface IRecordHostJoinedResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  hostId: string;
  hostJoinedAt: Date | null;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'RecordHostJoined' query type */
export interface IRecordHostJoinedQuery {
  params: IRecordHostJoinedParams;
  result: IRecordHostJoinedResult;
}

const recordHostJoinedIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":130,"b":132}]}],"statement":"UPDATE bookings\nSET host_joined_at = now(),\n    status = 'active',\n    call_started_at = now(),\n    updated_at = now()\nWHERE id = :id AND host_joined_at IS NULL\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE bookings
 * SET host_joined_at = now(),
 *     status = 'active',
 *     call_started_at = now(),
 *     updated_at = now()
 * WHERE id = :id AND host_joined_at IS NULL
 * RETURNING *
 * ```
 */
export const recordHostJoined = new PreparedQuery<IRecordHostJoinedParams,IRecordHostJoinedResult>(recordHostJoinedIR);


/** 'GetPaidBookingsByRoom' parameters type */
export interface IGetPaidBookingsByRoomParams {
  vidbloqRoom?: string | null | void;
}

/** 'GetPaidBookingsByRoom' return type */
export interface IGetPaidBookingsByRoomResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  feePercentage: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  hostWallet: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetPaidBookingsByRoom' query type */
export interface IGetPaidBookingsByRoomQuery {
  params: IGetPaidBookingsByRoomParams;
  result: IGetPaidBookingsByRoomResult;
}

const getPaidBookingsByRoomIR: any = {"usedParamSet":{"vidbloqRoom":true},"params":[{"name":"vidbloqRoom","required":false,"transform":{"type":"scalar"},"locs":[{"a":176,"b":187}]}],"statement":"SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.vidbloq_room = :vidbloqRoom\nAND b.status IN ('paid', 'active')\nORDER BY b.created_at ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.vidbloq_room = :vidbloqRoom
 * AND b.status IN ('paid', 'active')
 * ORDER BY b.created_at ASC
 * ```
 */
export const getPaidBookingsByRoom = new PreparedQuery<IGetPaidBookingsByRoomParams,IGetPaidBookingsByRoomResult>(getPaidBookingsByRoomIR);


/** 'GetPaidBookingsBySessionId' parameters type */
export interface IGetPaidBookingsBySessionIdParams {
  sessionId?: string | null | void;
}

/** 'GetPaidBookingsBySessionId' return type */
export interface IGetPaidBookingsBySessionIdResult {
  amount: string;
  callEndedAt: Date | null;
  callerEmail: string | null;
  callerJoinedAt: Date | null;
  callerName: string | null;
  callerWallet: string;
  callStartedAt: Date | null;
  createdAt: Date;
  depositSignature: string | null;
  distributeSignature: string | null;
  donorPda: string | null;
  durationMinutes: number;
  feePercentage: number;
  hostId: string;
  hostJoinedAt: Date | null;
  hostName: string;
  hostSlug: string;
  hostWallet: string;
  id: string;
  paymentExpiresAt: Date | null;
  refundReason: string | null;
  refundSignature: string | null;
  scheduledAt: Date;
  sessionId: string | null;
  status: booking_status;
  streamAta: string | null;
  streamName: string;
  streamPda: string | null;
  timezone: string;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetPaidBookingsBySessionId' query type */
export interface IGetPaidBookingsBySessionIdQuery {
  params: IGetPaidBookingsBySessionIdParams;
  result: IGetPaidBookingsBySessionIdResult;
}

const getPaidBookingsBySessionIdIR: any = {"usedParamSet":{"sessionId":true},"params":[{"name":"sessionId","required":false,"transform":{"type":"scalar"},"locs":[{"a":174,"b":183}]}],"statement":"SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.session_id = :sessionId\nAND b.status IN ('paid', 'active')\nORDER BY b.created_at ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.wallet_address as host_wallet, h.fee_percentage, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.session_id = :sessionId
 * AND b.status IN ('paid', 'active')
 * ORDER BY b.created_at ASC
 * ```
 */
export const getPaidBookingsBySessionId = new PreparedQuery<IGetPaidBookingsBySessionIdParams,IGetPaidBookingsBySessionIdResult>(getPaidBookingsBySessionIdIR);


