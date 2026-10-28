CREATE TABLE users (
    id int AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id int AUTO_INCREMENT PRIMARY KEY,
    user_id int NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username) VALUES ('CJ');
INSERT INTO messages (user_id, message) VALUES (1, 'Hello, this is a test message.');