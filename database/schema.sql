CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    url_id INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT clicks_url_id_fkey
        FOREIGN KEY (url_id)
        REFERENCES urls(id)
        ON DELETE CASCADE
);