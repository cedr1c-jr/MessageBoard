-- migrate:up
 
-- Baseline migration. Uses IF NOT EXISTS so it can also be applied to a
-- database that already has these tables (see the setup notes).
 
CREATE TABLE IF NOT EXISTS users (
    id int AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE IF NOT EXISTS messages_table (
    id int AUTO_INCREMENT PRIMARY KEY,
    user_id int NOT NULL,
    username VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
 
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id int AUTO_INCREMENT PRIMARY KEY,
    user_id int NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
 
-- migrate:down
 
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS messages_table;
DROP TABLE IF EXISTS users;