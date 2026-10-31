import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}).promise();

export async function getMessages() {
    const [rows] = await db.query("SELECT * FROM messages_table");
    return rows;
};

export async function getMessageById(id) {
    const [rows] = await db.query("SELECT * FROM messages_table WHERE id = ?", [id]);
    return rows[0];
};

export async function createMessage(user_id, message, username) {
    const [result] = await db.query("INSERT INTO messages_table (user_id, message, username) VALUES (?, ?, ?)", [user_id, message, username]);
    return result.id;
};

export async function deleteMessage(id) {
    const [result] = await db.query("DELETE FROM messages_table WHERE id = ?", [id]);
    return result.affectedRows > 0;
};

export async function getUserByUsername(username) {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0];
};

export async function createUser(username, password) {
    const [result] = await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
    return result.username;
};

export async function getUsers() {
    const [result] = await db.query("SELECT * FROM users")
    return result;
};

export async function updatePassword(username, password) {
    const [result] = await db.query("UPDATE users SET password = ? WHERE username = ?", [password, username]);
    return;
}