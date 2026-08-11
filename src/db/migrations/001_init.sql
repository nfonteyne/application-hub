-- Users, keyed by Authentik OIDC "sub" claim
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    authentik_sub TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    username      TEXT,
    email         TEXT,
    avatar_url    TEXT,
    groups        TEXT[] NOT NULL DEFAULT '{}',
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications listed on the hub
CREATE TABLE apps (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    url             TEXT NOT NULL,
    icon            TEXT,
    -- NULL = visible to every authenticated user; otherwise the Authentik
    -- group a user must belong to (per the "groups" claim) to see the tile.
    required_group  TEXT,
    position        INTEGER NOT NULL DEFAULT 0,
    created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_apps_position ON apps(position);
