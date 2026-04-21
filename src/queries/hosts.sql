/* @name CreateHost */
INSERT INTO hosts (wallet_address, name, slug, rate, duration_minutes, bio, timezone, email)
VALUES (:walletAddress, :name, :slug, :rate, :durationMinutes, :bio, :timezone, :email)
RETURNING *;

/* @name GetHostBySlug */
SELECT * FROM hosts WHERE slug = :slug AND is_active = true;

/* @name GetHostById */
SELECT * FROM hosts WHERE id = :id;

/* @name GetHostByWallet */
SELECT * FROM hosts WHERE wallet_address = :walletAddress;

/* @name UpdateHostName */
UPDATE hosts SET name = :name, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;

/* @name UpdateHostBio */
UPDATE hosts SET bio = :bio, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;

/* @name UpdateHostRate */
UPDATE hosts SET rate = :rate, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;

/* @name UpdateHostDuration */
UPDATE hosts SET duration_minutes = :durationMinutes, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;

/* @name UpdateHostTimezone */
UPDATE hosts SET timezone = :timezone, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;

/* @name UpdateHostActive */
UPDATE hosts SET is_active = :isActive, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;

/* @name UpdateHostEmail */
UPDATE hosts SET email = :email, updated_at = now()
WHERE wallet_address = :walletAddress
RETURNING *;
