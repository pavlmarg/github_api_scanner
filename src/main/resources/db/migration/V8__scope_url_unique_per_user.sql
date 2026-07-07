ALTER TABLE monitored_sites DROP CONSTRAINT IF EXISTS monitored_sites_url_key;

ALTER TABLE monitored_sites ADD CONSTRAINT uq_site_user_url UNIQUE (user_id, url);