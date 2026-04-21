/** Types generated for queries found in "src/queries/availability.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

/** 'GetAvailabilityRules' parameters type */
export interface IGetAvailabilityRulesParams {
  hostId?: string | null | void;
}

/** 'GetAvailabilityRules' return type */
export interface IGetAvailabilityRulesResult {
  createdAt: Date;
  dayOfWeek: number;
  endTime: Date;
  hostId: string;
  id: string;
  isActive: boolean;
  startTime: Date;
}

/** 'GetAvailabilityRules' query type */
export interface IGetAvailabilityRulesQuery {
  params: IGetAvailabilityRulesParams;
  result: IGetAvailabilityRulesResult;
}

const getAvailabilityRulesIR: any = {"usedParamSet":{"hostId":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":49,"b":55}]}],"statement":"SELECT * FROM availability_rules\nWHERE host_id = :hostId AND is_active = true\nORDER BY day_of_week, start_time"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM availability_rules
 * WHERE host_id = :hostId AND is_active = true
 * ORDER BY day_of_week, start_time
 * ```
 */
export const getAvailabilityRules = new PreparedQuery<IGetAvailabilityRulesParams,IGetAvailabilityRulesResult>(getAvailabilityRulesIR);


/** 'DeleteAvailabilityRules' parameters type */
export interface IDeleteAvailabilityRulesParams {
  hostId?: string | null | void;
}

/** 'DeleteAvailabilityRules' return type */
export type IDeleteAvailabilityRulesResult = void;

/** 'DeleteAvailabilityRules' query type */
export interface IDeleteAvailabilityRulesQuery {
  params: IDeleteAvailabilityRulesParams;
  result: IDeleteAvailabilityRulesResult;
}

const deleteAvailabilityRulesIR: any = {"usedParamSet":{"hostId":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":47,"b":53}]}],"statement":"DELETE FROM availability_rules WHERE host_id = :hostId"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM availability_rules WHERE host_id = :hostId
 * ```
 */
export const deleteAvailabilityRules = new PreparedQuery<IDeleteAvailabilityRulesParams,IDeleteAvailabilityRulesResult>(deleteAvailabilityRulesIR);


/** 'InsertAvailabilityRule' parameters type */
export interface IInsertAvailabilityRuleParams {
  dayOfWeek?: number | null | void;
  endTime?: DateOrString | null | void;
  hostId?: string | null | void;
  startTime?: DateOrString | null | void;
}

/** 'InsertAvailabilityRule' return type */
export interface IInsertAvailabilityRuleResult {
  createdAt: Date;
  dayOfWeek: number;
  endTime: Date;
  hostId: string;
  id: string;
  isActive: boolean;
  startTime: Date;
}

/** 'InsertAvailabilityRule' query type */
export interface IInsertAvailabilityRuleQuery {
  params: IInsertAvailabilityRuleParams;
  result: IInsertAvailabilityRuleResult;
}

const insertAvailabilityRuleIR: any = {"usedParamSet":{"hostId":true,"dayOfWeek":true,"startTime":true,"endTime":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":84,"b":90}]},{"name":"dayOfWeek","required":false,"transform":{"type":"scalar"},"locs":[{"a":93,"b":102}]},{"name":"startTime","required":false,"transform":{"type":"scalar"},"locs":[{"a":105,"b":114}]},{"name":"endTime","required":false,"transform":{"type":"scalar"},"locs":[{"a":117,"b":124}]}],"statement":"INSERT INTO availability_rules (host_id, day_of_week, start_time, end_time)\nVALUES (:hostId, :dayOfWeek, :startTime, :endTime)\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO availability_rules (host_id, day_of_week, start_time, end_time)
 * VALUES (:hostId, :dayOfWeek, :startTime, :endTime)
 * RETURNING *
 * ```
 */
export const insertAvailabilityRule = new PreparedQuery<IInsertAvailabilityRuleParams,IInsertAvailabilityRuleResult>(insertAvailabilityRuleIR);


/** 'GetDateOverrides' parameters type */
export interface IGetDateOverridesParams {
  hostId?: string | null | void;
}

/** 'GetDateOverrides' return type */
export interface IGetDateOverridesResult {
  createdAt: Date;
  date: Date;
  endTime: Date | null;
  hostId: string;
  id: string;
  isBlocked: boolean;
  startTime: Date | null;
}

/** 'GetDateOverrides' query type */
export interface IGetDateOverridesQuery {
  params: IGetDateOverridesParams;
  result: IGetDateOverridesResult;
}

const getDateOverridesIR: any = {"usedParamSet":{"hostId":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":45,"b":51}]}],"statement":"SELECT * FROM date_overrides\nWHERE host_id = :hostId\nORDER BY date"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM date_overrides
 * WHERE host_id = :hostId
 * ORDER BY date
 * ```
 */
export const getDateOverrides = new PreparedQuery<IGetDateOverridesParams,IGetDateOverridesResult>(getDateOverridesIR);


/** 'GetDateOverridesForRange' parameters type */
export interface IGetDateOverridesForRangeParams {
  fromDate?: DateOrString | null | void;
  hostId?: string | null | void;
  toDate?: DateOrString | null | void;
}

/** 'GetDateOverridesForRange' return type */
export interface IGetDateOverridesForRangeResult {
  createdAt: Date;
  date: Date;
  endTime: Date | null;
  hostId: string;
  id: string;
  isBlocked: boolean;
  startTime: Date | null;
}

/** 'GetDateOverridesForRange' query type */
export interface IGetDateOverridesForRangeQuery {
  params: IGetDateOverridesForRangeParams;
  result: IGetDateOverridesForRangeResult;
}

const getDateOverridesForRangeIR: any = {"usedParamSet":{"hostId":true,"fromDate":true,"toDate":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":45,"b":51}]},{"name":"fromDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":65,"b":73}]},{"name":"toDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":93,"b":99}]}],"statement":"SELECT * FROM date_overrides\nWHERE host_id = :hostId AND date >= :fromDate::date AND date <= :toDate::date\nORDER BY date"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM date_overrides
 * WHERE host_id = :hostId AND date >= :fromDate::date AND date <= :toDate::date
 * ORDER BY date
 * ```
 */
export const getDateOverridesForRange = new PreparedQuery<IGetDateOverridesForRangeParams,IGetDateOverridesForRangeResult>(getDateOverridesForRangeIR);


/** 'GetDateOverrideForDate' parameters type */
export interface IGetDateOverrideForDateParams {
  hostId?: string | null | void;
  targetDate?: DateOrString | null | void;
}

/** 'GetDateOverrideForDate' return type */
export interface IGetDateOverrideForDateResult {
  createdAt: Date;
  date: Date;
  endTime: Date | null;
  hostId: string;
  id: string;
  isBlocked: boolean;
  startTime: Date | null;
}

/** 'GetDateOverrideForDate' query type */
export interface IGetDateOverrideForDateQuery {
  params: IGetDateOverrideForDateParams;
  result: IGetDateOverrideForDateResult;
}

const getDateOverrideForDateIR: any = {"usedParamSet":{"hostId":true,"targetDate":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":45,"b":51}]},{"name":"targetDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":64,"b":74}]}],"statement":"SELECT * FROM date_overrides\nWHERE host_id = :hostId AND date = :targetDate::date"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM date_overrides
 * WHERE host_id = :hostId AND date = :targetDate::date
 * ```
 */
export const getDateOverrideForDate = new PreparedQuery<IGetDateOverrideForDateParams,IGetDateOverrideForDateResult>(getDateOverrideForDateIR);


/** 'UpsertDateOverride' parameters type */
export interface IUpsertDateOverrideParams {
  endTime?: DateOrString | null | void;
  hostId?: string | null | void;
  isBlocked?: boolean | null | void;
  startTime?: DateOrString | null | void;
  targetDate?: DateOrString | null | void;
}

/** 'UpsertDateOverride' return type */
export interface IUpsertDateOverrideResult {
  createdAt: Date;
  date: Date;
  endTime: Date | null;
  hostId: string;
  id: string;
  isBlocked: boolean;
  startTime: Date | null;
}

/** 'UpsertDateOverride' query type */
export interface IUpsertDateOverrideQuery {
  params: IUpsertDateOverrideParams;
  result: IUpsertDateOverrideResult;
}

const upsertDateOverrideIR: any = {"usedParamSet":{"hostId":true,"targetDate":true,"isBlocked":true,"startTime":true,"endTime":true},"params":[{"name":"hostId","required":false,"transform":{"type":"scalar"},"locs":[{"a":85,"b":91}]},{"name":"targetDate","required":false,"transform":{"type":"scalar"},"locs":[{"a":94,"b":104}]},{"name":"isBlocked","required":false,"transform":{"type":"scalar"},"locs":[{"a":113,"b":122}]},{"name":"startTime","required":false,"transform":{"type":"scalar"},"locs":[{"a":125,"b":134}]},{"name":"endTime","required":false,"transform":{"type":"scalar"},"locs":[{"a":137,"b":144}]}],"statement":"INSERT INTO date_overrides (host_id, date, is_blocked, start_time, end_time)\nVALUES (:hostId, :targetDate::date, :isBlocked, :startTime, :endTime)\nON CONFLICT (host_id, date) DO UPDATE SET\n    is_blocked = EXCLUDED.is_blocked,\n    start_time = EXCLUDED.start_time,\n    end_time = EXCLUDED.end_time\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO date_overrides (host_id, date, is_blocked, start_time, end_time)
 * VALUES (:hostId, :targetDate::date, :isBlocked, :startTime, :endTime)
 * ON CONFLICT (host_id, date) DO UPDATE SET
 *     is_blocked = EXCLUDED.is_blocked,
 *     start_time = EXCLUDED.start_time,
 *     end_time = EXCLUDED.end_time
 * RETURNING *
 * ```
 */
export const upsertDateOverride = new PreparedQuery<IUpsertDateOverrideParams,IUpsertDateOverrideResult>(upsertDateOverrideIR);


