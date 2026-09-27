-- Manual recovery only. SQLite cannot safely drop this column while preserving
-- compatibility with older runtimes; leave it in place and disable all demo data.
UPDATE giving_settings SET simulation_mode = 0 WHERE id = 1;
