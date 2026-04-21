/** Types generated for queries found in "src/queries/hosts.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CreateHost' parameters type */
export interface ICreateHostParams {
  bio?: string | null | void;
  durationMinutes?: number | null | void;
  email?: string | null | void;
  name?: string | null | void;
  rate?: NumberOrString | null | void;
  slug?: string | null | void;
  timezone?: string | null | void;
  walletAddress?: string | null | void;
}

/** 'CreateHost' return type */
export interface ICreateHostResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'CreateHost' query type */
export interface ICreateHostQuery {
  params: ICreateHostParams;
  result: ICreateHostResult;
}

const createHostIR: any = {"usedParamSet":{"walletAddress":true,"name":true,"slug":true,"rate":true,"durationMinutes":true,"bio":true,"timezone":true,"email":true},"params":[{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":101,"b":114}]},{"name":"name","required":false,"transform":{"type":"scalar"},"locs":[{"a":117,"b":121}]},{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":124,"b":128}]},{"name":"rate","required":false,"transform":{"type":"scalar"},"locs":[{"a":131,"b":135}]},{"name":"durationMinutes","required":false,"transform":{"type":"scalar"},"locs":[{"a":138,"b":153}]},{"name":"bio","required":false,"transform":{"type":"scalar"},"locs":[{"a":156,"b":159}]},{"name":"timezone","required":false,"transform":{"type":"scalar"},"locs":[{"a":162,"b":170}]},{"name":"email","required":false,"transform":{"type":"scalar"},"locs":[{"a":173,"b":178}]}],"statement":"INSERT INTO hosts (wallet_address, name, slug, rate, duration_minutes, bio, timezone, email)\nVALUES (:walletAddress, :name, :slug, :rate, :durationMinutes, :bio, :timezone, :email)\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO hosts (wallet_address, name, slug, rate, duration_minutes, bio, timezone, email)
 * VALUES (:walletAddress, :name, :slug, :rate, :durationMinutes, :bio, :timezone, :email)
 * RETURNING *
 * ```
 */
export const createHost = new PreparedQuery<ICreateHostParams,ICreateHostResult>(createHostIR);


/** 'GetHostBySlug' parameters type */
export interface IGetHostBySlugParams {
  slug?: string | null | void;
}

/** 'GetHostBySlug' return type */
export interface IGetHostBySlugResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'GetHostBySlug' query type */
export interface IGetHostBySlugQuery {
  params: IGetHostBySlugParams;
  result: IGetHostBySlugResult;
}

const getHostBySlugIR: any = {"usedParamSet":{"slug":true},"params":[{"name":"slug","required":false,"transform":{"type":"scalar"},"locs":[{"a":33,"b":37}]}],"statement":"SELECT * FROM hosts WHERE slug = :slug AND is_active = true"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM hosts WHERE slug = :slug AND is_active = true
 * ```
 */
export const getHostBySlug = new PreparedQuery<IGetHostBySlugParams,IGetHostBySlugResult>(getHostBySlugIR);


/** 'GetHostById' parameters type */
export interface IGetHostByIdParams {
  id?: string | null | void;
}

/** 'GetHostById' return type */
export interface IGetHostByIdResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'GetHostById' query type */
export interface IGetHostByIdQuery {
  params: IGetHostByIdParams;
  result: IGetHostByIdResult;
}

const getHostByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":31,"b":33}]}],"statement":"SELECT * FROM hosts WHERE id = :id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM hosts WHERE id = :id
 * ```
 */
export const getHostById = new PreparedQuery<IGetHostByIdParams,IGetHostByIdResult>(getHostByIdIR);


/** 'GetHostByWallet' parameters type */
export interface IGetHostByWalletParams {
  walletAddress?: string | null | void;
}

/** 'GetHostByWallet' return type */
export interface IGetHostByWalletResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'GetHostByWallet' query type */
export interface IGetHostByWalletQuery {
  params: IGetHostByWalletParams;
  result: IGetHostByWalletResult;
}

const getHostByWalletIR: any = {"usedParamSet":{"walletAddress":true},"params":[{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":43,"b":56}]}],"statement":"SELECT * FROM hosts WHERE wallet_address = :walletAddress"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM hosts WHERE wallet_address = :walletAddress
 * ```
 */
export const getHostByWallet = new PreparedQuery<IGetHostByWalletParams,IGetHostByWalletResult>(getHostByWalletIR);


/** 'UpdateHostName' parameters type */
export interface IUpdateHostNameParams {
  name?: string | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostName' return type */
export interface IUpdateHostNameResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostName' query type */
export interface IUpdateHostNameQuery {
  params: IUpdateHostNameParams;
  result: IUpdateHostNameResult;
}

const updateHostNameIR: any = {"usedParamSet":{"name":true,"walletAddress":true},"params":[{"name":"name","required":false,"transform":{"type":"scalar"},"locs":[{"a":24,"b":28}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":73,"b":86}]}],"statement":"UPDATE hosts SET name = :name, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET name = :name, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostName = new PreparedQuery<IUpdateHostNameParams,IUpdateHostNameResult>(updateHostNameIR);


/** 'UpdateHostBio' parameters type */
export interface IUpdateHostBioParams {
  bio?: string | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostBio' return type */
export interface IUpdateHostBioResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostBio' query type */
export interface IUpdateHostBioQuery {
  params: IUpdateHostBioParams;
  result: IUpdateHostBioResult;
}

const updateHostBioIR: any = {"usedParamSet":{"bio":true,"walletAddress":true},"params":[{"name":"bio","required":false,"transform":{"type":"scalar"},"locs":[{"a":23,"b":26}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":71,"b":84}]}],"statement":"UPDATE hosts SET bio = :bio, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET bio = :bio, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostBio = new PreparedQuery<IUpdateHostBioParams,IUpdateHostBioResult>(updateHostBioIR);


/** 'UpdateHostRate' parameters type */
export interface IUpdateHostRateParams {
  rate?: NumberOrString | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostRate' return type */
export interface IUpdateHostRateResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostRate' query type */
export interface IUpdateHostRateQuery {
  params: IUpdateHostRateParams;
  result: IUpdateHostRateResult;
}

const updateHostRateIR: any = {"usedParamSet":{"rate":true,"walletAddress":true},"params":[{"name":"rate","required":false,"transform":{"type":"scalar"},"locs":[{"a":24,"b":28}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":73,"b":86}]}],"statement":"UPDATE hosts SET rate = :rate, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET rate = :rate, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostRate = new PreparedQuery<IUpdateHostRateParams,IUpdateHostRateResult>(updateHostRateIR);


/** 'UpdateHostDuration' parameters type */
export interface IUpdateHostDurationParams {
  durationMinutes?: number | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostDuration' return type */
export interface IUpdateHostDurationResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostDuration' query type */
export interface IUpdateHostDurationQuery {
  params: IUpdateHostDurationParams;
  result: IUpdateHostDurationResult;
}

const updateHostDurationIR: any = {"usedParamSet":{"durationMinutes":true,"walletAddress":true},"params":[{"name":"durationMinutes","required":false,"transform":{"type":"scalar"},"locs":[{"a":36,"b":51}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":96,"b":109}]}],"statement":"UPDATE hosts SET duration_minutes = :durationMinutes, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET duration_minutes = :durationMinutes, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostDuration = new PreparedQuery<IUpdateHostDurationParams,IUpdateHostDurationResult>(updateHostDurationIR);


/** 'UpdateHostTimezone' parameters type */
export interface IUpdateHostTimezoneParams {
  timezone?: string | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostTimezone' return type */
export interface IUpdateHostTimezoneResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostTimezone' query type */
export interface IUpdateHostTimezoneQuery {
  params: IUpdateHostTimezoneParams;
  result: IUpdateHostTimezoneResult;
}

const updateHostTimezoneIR: any = {"usedParamSet":{"timezone":true,"walletAddress":true},"params":[{"name":"timezone","required":false,"transform":{"type":"scalar"},"locs":[{"a":28,"b":36}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":81,"b":94}]}],"statement":"UPDATE hosts SET timezone = :timezone, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET timezone = :timezone, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostTimezone = new PreparedQuery<IUpdateHostTimezoneParams,IUpdateHostTimezoneResult>(updateHostTimezoneIR);


/** 'UpdateHostActive' parameters type */
export interface IUpdateHostActiveParams {
  isActive?: boolean | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostActive' return type */
export interface IUpdateHostActiveResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostActive' query type */
export interface IUpdateHostActiveQuery {
  params: IUpdateHostActiveParams;
  result: IUpdateHostActiveResult;
}

const updateHostActiveIR: any = {"usedParamSet":{"isActive":true,"walletAddress":true},"params":[{"name":"isActive","required":false,"transform":{"type":"scalar"},"locs":[{"a":29,"b":37}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":82,"b":95}]}],"statement":"UPDATE hosts SET is_active = :isActive, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET is_active = :isActive, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostActive = new PreparedQuery<IUpdateHostActiveParams,IUpdateHostActiveResult>(updateHostActiveIR);


/** 'UpdateHostEmail' parameters type */
export interface IUpdateHostEmailParams {
  email?: string | null | void;
  walletAddress?: string | null | void;
}

/** 'UpdateHostEmail' return type */
export interface IUpdateHostEmailResult {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  durationMinutes: number;
  email: string | null;
  feePercentage: number;
  id: string;
  isActive: boolean;
  name: string;
  rate: string;
  slug: string;
  timezone: string;
  updatedAt: Date;
  walletAddress: string;
}

/** 'UpdateHostEmail' query type */
export interface IUpdateHostEmailQuery {
  params: IUpdateHostEmailParams;
  result: IUpdateHostEmailResult;
}

const updateHostEmailIR: any = {"usedParamSet":{"email":true,"walletAddress":true},"params":[{"name":"email","required":false,"transform":{"type":"scalar"},"locs":[{"a":25,"b":30}]},{"name":"walletAddress","required":false,"transform":{"type":"scalar"},"locs":[{"a":75,"b":88}]}],"statement":"UPDATE hosts SET email = :email, updated_at = now()\nWHERE wallet_address = :walletAddress\nRETURNING *"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE hosts SET email = :email, updated_at = now()
 * WHERE wallet_address = :walletAddress
 * RETURNING *
 * ```
 */
export const updateHostEmail = new PreparedQuery<IUpdateHostEmailParams,IUpdateHostEmailResult>(updateHostEmailIR);


