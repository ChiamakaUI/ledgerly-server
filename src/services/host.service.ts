import { getPool, getClient, camelizeKeys } from "../config/index.js";
import {
  createHost,
  getHostBySlug,
  getHostByWallet,
  updateHostName,
  updateHostBio,
  updateHostRate,
  updateHostDuration,
  updateHostTimezone,
  updateHostActive,
  updateHostEmail,
} from "../queries/hosts.queries.js";
import {
  getAvailabilityRules,
  deleteAvailabilityRules,
  insertAvailabilityRule,
  getDateOverrides,
  upsertDateOverride,
} from "../queries/availability.queries.js";
import type {
  CreateHostRequest,
  UpdateHostRequest,
  SetAvailabilityRequest,
  SetOverridesRequest,
} from "../types/index.js";

// ============================================
// Host CRUD
// ============================================

export async function createHostRecord(data: CreateHostRequest) {
  const pool = getPool();
  const result = await createHost.run(
    {
      walletAddress: data.walletAddress,
      name: data.name,
      slug: data.slug,
      rate: data.rate,
      durationMinutes: data.durationMinutes || 30,
      bio: data.bio || null,
      timezone: data.timezone || "UTC",
      email: data.email || null,
    },
    pool
  );
  return camelizeKeys(result[0]);
}

export async function getHostBySlugRecord(slug: string) {
  const pool = getPool();
  const result = await getHostBySlug.run({ slug }, pool);
  return result[0] ? camelizeKeys(result[0]) : null;
}

export async function getHostByWalletRecord(walletAddress: string) {
  const pool = getPool();
  const result = await getHostByWallet.run({ walletAddress }, pool);
  return result[0] ? camelizeKeys(result[0]) : null;
}

export async function updateHostRecord(
  walletAddress: string,
  data: UpdateHostRequest
) {
  const pool = getPool();
  let result;

  if (data.name !== undefined) {
    result = await updateHostName.run({ walletAddress, name: data.name }, pool);
  }
  if (data.bio !== undefined) {
    result = await updateHostBio.run({ walletAddress, bio: data.bio }, pool);
  }
  if (data.rate !== undefined) {
    result = await updateHostRate.run({ walletAddress, rate: data.rate }, pool);
  }
  if (data.durationMinutes !== undefined) {
    result = await updateHostDuration.run(
      { walletAddress, durationMinutes: data.durationMinutes },
      pool
    );
  }
  if (data.timezone !== undefined) {
    result = await updateHostTimezone.run(
      { walletAddress, timezone: data.timezone },
      pool
    );
  }
  if (data.isActive !== undefined) {
    result = await updateHostActive.run(
      { walletAddress, isActive: data.isActive },
      pool
    );
  }
  if (data.email !== undefined) {
    result = await updateHostEmail.run(
      { walletAddress, email: data.email },
      pool
    );
  }

  if (!result || result.length === 0) {
    return getHostByWalletRecord(walletAddress);
  }
  return camelizeKeys(result[0]);
}

// ============================================
// Availability rules
// ============================================

export async function getHostAvailabilityRules(hostId: string) {
  const pool = getPool();
  return getAvailabilityRules.run({ hostId }, pool);
}

export async function setHostAvailabilityRules(
  hostId: string,
  data: SetAvailabilityRequest
) {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    await deleteAvailabilityRules.run({ hostId }, client);

    const rules = [];
    for (const rule of data.rules) {
      const result = await insertAvailabilityRule.run(
        {
          hostId,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
        },
        client
      );
      rules.push(result[0]);
    }

    await client.query("COMMIT");
    return rules;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ============================================
// Date overrides
// ============================================

export async function getHostDateOverrides(hostId: string) {
  const pool = getPool();
  return getDateOverrides.run({ hostId }, pool);
}

export async function setHostDateOverrides(
  hostId: string,
  data: SetOverridesRequest
) {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const overrides = [];
    for (const override of data.overrides) {
      const result = await upsertDateOverride.run(
        {
          hostId,
          targetDate: override.date,
          isBlocked: override.isBlocked,
          startTime: override.startTime || null,
          endTime: override.endTime || null,
        },
        client
      );
      overrides.push(result[0]);
    }

    await client.query("COMMIT");
    return overrides;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}