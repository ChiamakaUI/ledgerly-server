/** Types generated for queries found in "src/queries/session.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type booking_status = 'active' | 'completed' | 'expired' | 'no_show' | 'paid' | 'pending_payment' | 'refunded';

export type session_type = 'group' | 'one_on_one';

export type DateOrString = Date | string;

export type NumberOrString = number | string;

/** 'CreateSession' parameters type */
export interface ICreateSessionParams {
  description?: string | null | void;
  durationMinutes?: number | null | void;
  hostId?: string | null | void;
  maxParticipants?: number | null | void;
  rate?: NumberOrString | null | void;
  scheduledAt?: DateOrString | null | void;
  sessionType?: session_type | null | void;
  title?: string | null | void;
}

/** 'CreateSession' return type */
export interface ICreateSessionResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'CreateSession' query type */
export interface ICreateSessionQuery {
  params: ICreateSessionParams;
  result: ICreateSessionResult;
}

const createSessionIR: any = {"usedParamSet":{"hostId":true,"title":true,"description":true,"scheduledAt":true,"durationMinutes":true,"rate":true,"maxParticipants":true,"sessionType":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":129,"b":135}]},{"name":"title","required":false,"transform":{"type":"scalar"},"locs":[{"a":138,"b":143}]},{"name":"description","required":false,"transform":{"type":"scalar"},"locs":[{"a":146,"b":157}]},{"name":"scheduledAt","required":false,"transform":{"type":"scalar"},"locs":[{"a":160,"b":171}]},{"name":"durationMinutes","required":false,"transform":{"type":"scalar"},"locs":[{"a":174,"b":189}]},{"name":"rate","required":false,"transform":{"type":"scalar"},"locs":[{"a":192,"b":196}]},{"name":"maxParticipants","required":false,"transform":{"type":"scalar"},"locs":[{"a":199,"b":214}]},{"name":"sessionType","required":false,"transform":{"type":"scalar"},"locs":[{"a":217,"b":228}]}],"statement":"INSERT INTO sessions (host_id, title, description, scheduled_at, duration_minutes, rate, max_participants, session_type)\nVALUES (:hostId, :title, :description, :scheduledAt, :durationMinutes, :rate, :maxParticipants, :sessionType)\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO sessions (host_id, title, description, scheduled_at, duration_minutes, rate, max_participants, session_type)
 * VALUES (:hostId, :title, :description, :scheduledAt, :durationMinutes, :rate, :maxParticipants, :sessionType)
 * RETURNING *
 * ```
 */
export const createSession = new PreparedQuery<ICreateSessionParams,ICreateSessionResult>(createSessionIR);


/** 'GetSessionById' parameters type */
export interface IGetSessionByIdParams {
  id?: string | null | void;
}

/** 'GetSessionById' return type */
export interface IGetSessionByIdResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  feePercentage: number;
  hostId: string;
  hostName: string;
  hostSlug: string;
  hostWallet: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetSessionById' query type */
export interface IGetSessionByIdQuery {
  params: IGetSessionByIdParams;
  result: IGetSessionByIdResult;
}

const getSessionByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":166,"b":168}]}],"statement":"SELECT s.*, h.name as host_name, h.slug as host_slug, h.wallet_address as host_wallet, h.fee_percentage\nFROM sessions s\nJOIN hosts h ON s.host_id = h.id\nWHERE s.id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT s.*, h.name as host_name, h.slug as host_slug, h.wallet_address as host_wallet, h.fee_percentage
 * FROM sessions s
 * JOIN hosts h ON s.host_id = h.id
 * WHERE s.id = :id
 * ```
 */
export const getSessionById = new PreparedQuery<IGetSessionByIdParams,IGetSessionByIdResult>(getSessionByIdIR);


/** 'GetSessionsByHostId' parameters type */
export interface IGetSessionsByHostIdParams {
  hostId?: string | null | void;
  limit?: NumberOrString | null | void;
  offset?: NumberOrString | null | void;
}

/** 'GetSessionsByHostId' return type */
export interface IGetSessionsByHostIdResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostSlug: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetSessionsByHostId' query type */
export interface IGetSessionsByHostIdQuery {
  params: IGetSessionsByHostIdParams;
  result: IGetSessionsByHostIdResult;
}

const getSessionsByHostIdIR: any = {"usedParamSet":{"hostId":true,"limit":true,"offset":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":126}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":163,"b":168}]},{"name":"offset","required":false,"transform":{"type":"scalar"},"locs":[{"a":177,"b":183}]}],"statement":"SELECT s.*, h.name as host_name, h.slug as host_slug\nFROM sessions s\nJOIN hosts h ON s.host_id = h.id\nWHERE s.host_id = :hostId\nORDER BY s.scheduled_at DESC\nLIMIT :limit OFFSET :offset"};

/**
 * Query generated from SQL:
 * ```
 * SELECT s.*, h.name as host_name, h.slug as host_slug
 * FROM sessions s
 * JOIN hosts h ON s.host_id = h.id
 * WHERE s.host_id = :hostId
 * ORDER BY s.scheduled_at DESC
 * LIMIT :limit OFFSET :offset
 * ```
 */
export const getSessionsByHostId = new PreparedQuery<IGetSessionsByHostIdParams,IGetSessionsByHostIdResult>(getSessionsByHostIdIR);


/** 'GetUpcomingSessionsByHostId' parameters type */
export interface IGetUpcomingSessionsByHostIdParams {
  hostId?: string | null | void;
  limit?: NumberOrString | null | void;
  offset?: NumberOrString | null | void;
}

/** 'GetUpcomingSessionsByHostId' return type */
export interface IGetUpcomingSessionsByHostIdResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostSlug: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetUpcomingSessionsByHostId' query type */
export interface IGetUpcomingSessionsByHostIdQuery {
  params: IGetUpcomingSessionsByHostIdParams;
  result: IGetUpcomingSessionsByHostIdResult;
}

const getUpcomingSessionsByHostIdIR: any = {"usedParamSet":{"hostId":true,"limit":true,"offset":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":120,"b":126}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":222,"b":227}]},{"name":"offset","required":false,"transform":{"type":"scalar"},"locs":[{"a":236,"b":242}]}],"statement":"SELECT s.*, h.name as host_name, h.slug as host_slug\nFROM sessions s\nJOIN hosts h ON s.host_id = h.id\nWHERE s.host_id = :hostId\nAND s.status IN ('open', 'full')\nAND s.scheduled_at > now()\nORDER BY s.scheduled_at ASC\nLIMIT :limit OFFSET :offset"};

/**
 * Query generated from SQL:
 * ```
 * SELECT s.*, h.name as host_name, h.slug as host_slug
 * FROM sessions s
 * JOIN hosts h ON s.host_id = h.id
 * WHERE s.host_id = :hostId
 * AND s.status IN ('open', 'full')
 * AND s.scheduled_at > now()
 * ORDER BY s.scheduled_at ASC
 * LIMIT :limit OFFSET :offset
 * ```
 */
export const getUpcomingSessionsByHostId = new PreparedQuery<IGetUpcomingSessionsByHostIdParams,IGetUpcomingSessionsByHostIdResult>(getUpcomingSessionsByHostIdIR);


/** 'GetOpenSessionsBySlug' parameters type */
export interface IGetOpenSessionsBySlugParams {
  limit?: NumberOrString | null | void;
  offset?: NumberOrString | null | void;
  slug?: string | null | void;
}

/** 'GetOpenSessionsBySlug' return type */
export interface IGetOpenSessionsBySlugResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostSlug: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'GetOpenSessionsBySlug' query type */
export interface IGetOpenSessionsBySlugQuery {
  params: IGetOpenSessionsBySlugParams;
  result: IGetOpenSessionsBySlugResult;
}

const getOpenSessionsBySlugIR: any = {"usedParamSet":{"slug":true,"limit":true,"offset":true},"params":[{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":117,"b":121}]},{"name":"limit","required":false,"transform":{"type":"scalar"},"locs":[{"a":206,"b":211}]},{"name":"offset","required":false,"transform":{"type":"scalar"},"locs":[{"a":220,"b":226}]}],"statement":"SELECT s.*, h.name as host_name, h.slug as host_slug\nFROM sessions s\nJOIN hosts h ON s.host_id = h.id\nWHERE h.slug = :slug\nAND s.status = 'open'\nAND s.scheduled_at > now()\nORDER BY s.scheduled_at ASC\nLIMIT :limit OFFSET :offset"};

/**
 * Query generated from SQL:
 * ```
 * SELECT s.*, h.name as host_name, h.slug as host_slug
 * FROM sessions s
 * JOIN hosts h ON s.host_id = h.id
 * WHERE h.slug = :slug
 * AND s.status = 'open'
 * AND s.scheduled_at > now()
 * ORDER BY s.scheduled_at ASC
 * LIMIT :limit OFFSET :offset
 * ```
 */
export const getOpenSessionsBySlug = new PreparedQuery<IGetOpenSessionsBySlugParams,IGetOpenSessionsBySlugResult>(getOpenSessionsBySlugIR);


/** 'GetSessionBookingCount' parameters type */
export interface IGetSessionBookingCountParams {
  sessionId?: string | null | void;
}

/** 'GetSessionBookingCount' return type */
export interface IGetSessionBookingCountResult {
  count: number | null;
}

/** 'GetSessionBookingCount' query type */
export interface IGetSessionBookingCountQuery {
  params: IGetSessionBookingCountParams;
  result: IGetSessionBookingCountResult;
}

const getSessionBookingCountIR: any = {"usedParamSet":{"sessionId":true},"params":[{"name":"sessionId","required":false,"transform":{"type":"scalar"},"locs":[{"a":63,"b":72}]}],"statement":"SELECT COUNT(*)::int as count FROM bookings\nWHERE session_id = :sessionId\nAND status IN ('pending_payment', 'paid', 'active')"};

/**
 * Query generated from SQL:
 * ```
 * SELECT COUNT(*)::int as count FROM bookings
 * WHERE session_id = :sessionId
 * AND status IN ('pending_payment', 'paid', 'active')
 * ```
 */
export const getSessionBookingCount = new PreparedQuery<IGetSessionBookingCountParams,IGetSessionBookingCountResult>(getSessionBookingCountIR);


/** 'GetSessionPaidBookings' parameters type */
export interface IGetSessionPaidBookingsParams {
  sessionId?: string | null | void;
}

/** 'GetSessionPaidBookings' return type */
export interface IGetSessionPaidBookingsResult {
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

/** 'GetSessionPaidBookings' query type */
export interface IGetSessionPaidBookingsQuery {
  params: IGetSessionPaidBookingsParams;
  result: IGetSessionPaidBookingsResult;
}

const getSessionPaidBookingsIR: any = {"usedParamSet":{"sessionId":true},"params":[{"name":"sessionId","required":false,"transform":{"type":"scalar"},"locs":[{"a":123,"b":132}]}],"statement":"SELECT b.*, h.name as host_name, h.slug as host_slug\nFROM bookings b\nJOIN hosts h ON b.host_id = h.id\nWHERE b.session_id = :sessionId\nAND b.status IN ('paid', 'active')\nORDER BY b.created_at ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT b.*, h.name as host_name, h.slug as host_slug
 * FROM bookings b
 * JOIN hosts h ON b.host_id = h.id
 * WHERE b.session_id = :sessionId
 * AND b.status IN ('paid', 'active')
 * ORDER BY b.created_at ASC
 * ```
 */
export const getSessionPaidBookings = new PreparedQuery<IGetSessionPaidBookingsParams,IGetSessionPaidBookingsResult>(getSessionPaidBookingsIR);


/** 'UpdateSessionStatus' parameters type */
export interface IUpdateSessionStatusParams {
  id?: string | null | void;
  status?: string | null | void;
}

/** 'UpdateSessionStatus' return type */
export interface IUpdateSessionStatusResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'UpdateSessionStatus' query type */
export interface IUpdateSessionStatusQuery {
  params: IUpdateSessionStatusParams;
  result: IUpdateSessionStatusResult;
}

const updateSessionStatusIR: any = {"usedParamSet":{"status":true,"id":true},"params":[{"name":"status","required":false,"transform":{"type":"scalar"},"locs":[{"a":29,"b":35}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":68,"b":70}]}],"statement":"UPDATE sessions SET status = :status, updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE sessions SET status = :status, updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const updateSessionStatus = new PreparedQuery<IUpdateSessionStatusParams,IUpdateSessionStatusResult>(updateSessionStatusIR);


/** 'UpdateSessionRoom' parameters type */
export interface IUpdateSessionRoomParams {
  id?: string | null | void;
  vidbloqRoom?: string | null | void;
}

/** 'UpdateSessionRoom' return type */
export interface IUpdateSessionRoomResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'UpdateSessionRoom' query type */
export interface IUpdateSessionRoomQuery {
  params: IUpdateSessionRoomParams;
  result: IUpdateSessionRoomResult;
}

const updateSessionRoomIR: any = {"usedParamSet":{"vidbloqRoom":true,"id":true},"params":[{"name":"vidbloqRoom","required":false,"transform":{"type":"scalar"},"locs":[{"a":35,"b":46}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":79,"b":81}]}],"statement":"UPDATE sessions SET vidbloq_room = :vidbloqRoom, updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE sessions SET vidbloq_room = :vidbloqRoom, updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const updateSessionRoom = new PreparedQuery<IUpdateSessionRoomParams,IUpdateSessionRoomResult>(updateSessionRoomIR);


/** 'UpdateSessionStatusToFull' parameters type */
export interface IUpdateSessionStatusToFullParams {
  id?: string | null | void;
}

/** 'UpdateSessionStatusToFull' return type */
export interface IUpdateSessionStatusToFullResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'UpdateSessionStatusToFull' query type */
export interface IUpdateSessionStatusToFullQuery {
  params: IUpdateSessionStatusToFullParams;
  result: IUpdateSessionStatusToFullResult;
}

const updateSessionStatusToFullIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":67,"b":69}]}],"statement":"UPDATE sessions SET status = 'full', updated_at = now()\nWHERE id = :id AND status = 'open'\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE sessions SET status = 'full', updated_at = now()
 * WHERE id = :id AND status = 'open'
 * RETURNING *
 * ```
 */
export const updateSessionStatusToFull = new PreparedQuery<IUpdateSessionStatusToFullParams,IUpdateSessionStatusToFullResult>(updateSessionStatusToFullIR);


/** 'CancelSession' parameters type */
export interface ICancelSessionParams {
  id?: string | null | void;
}

/** 'CancelSession' return type */
export interface ICancelSessionResult {
  createdAt: Date;
  description: string | null;
  durationMinutes: number;
  hostId: string;
  id: string;
  maxParticipants: number;
  rate: string;
  scheduledAt: Date;
  sessionType: session_type;
  status: string;
  title: string | null;
  updatedAt: Date;
  vidbloqRoom: string | null;
}

/** 'CancelSession' query type */
export interface ICancelSessionQuery {
  params: ICancelSessionParams;
  result: ICancelSessionResult;
}

const cancelSessionIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":72,"b":74}]}],"statement":"UPDATE sessions SET status = 'cancelled', updated_at = now()\nWHERE id = :id\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE sessions SET status = 'cancelled', updated_at = now()
 * WHERE id = :id
 * RETURNING *
 * ```
 */
export const cancelSession = new PreparedQuery<ICancelSessionParams,ICancelSessionResult>(cancelSessionIR);


