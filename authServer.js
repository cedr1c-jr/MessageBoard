import express from "express";
import * as db from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
app.use(express.json());
const hash = t => crypto.createHash('sha256').update(t).digest('hex');

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).send("Username and password are required");
    }

    const user = await db.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const token_id = await db.pushRefreshToken(user.id, hash(refreshToken), '7d');
        res.json({ accessToken: accessToken, refreshToken: refreshToken })
    } else {
        return res.status(401).send("Invalid username or password");
    }
});

app.post("/token", async (req, res) => {

})

function generateAccessToken(user) {
    return jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30m'}
        );
};

function generateRefreshToken(user) {
    return jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.REFRESH_TOKEN_SECRET
        );
};

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})