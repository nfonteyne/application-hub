-- Display categories for grouping app tiles on the hub (independent of
-- required_group, which controls Authentik-group-based visibility).
CREATE TABLE app_categories (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE apps ADD COLUMN category_id INTEGER REFERENCES app_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_apps_category_id ON apps(category_id);

-- Object key of an uploaded logo image stored in Garage (S3-compatible),
-- e.g. "logos/12-a1b2c3d4.png". NULL when no image was uploaded, in which
-- case the "icon" column (emoji or external image URL) is used instead.
ALTER TABLE apps ADD COLUMN logo_object_key TEXT;
