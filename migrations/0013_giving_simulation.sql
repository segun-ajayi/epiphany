ALTER TABLE giving_settings
ADD COLUMN simulation_mode INTEGER NOT NULL DEFAULT 0 CHECK (simulation_mode IN (0, 1));
