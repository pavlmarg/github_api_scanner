CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monitored_sites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    scan_frequency_minutes INT NOT NULL,
    baseline_screenshot_path TEXT,
    CONSTRAINT fk_site_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_site_user ON monitored_sites(user_id);

CREATE TABLE qa_logs (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    actual_load_time_ms INT NOT NULL,
    visual_difference_score DOUBLE PRECISION NOT NULL,
    screenshot_path TEXT,
    CONSTRAINT fk_log_site FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE
);
CREATE INDEX idx_qa_log_site_date ON qa_logs(site_id, executed_at DESC);