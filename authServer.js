import express from "express";
import * as db from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();


const app = express();
app.use(express.json());
const hash = t => crypto.createHash('sha256').update(t).digest('hex');
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());

const ACCESS_TOKEN_MAX_AGE = 30 * 60 * 1000;           // 30 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const cookieBase = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
};

async function issueTokens(res, user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
    await db.pushRefreshToken(user.id, hash(refreshToken), expiresAt);
 
    res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookie('refreshToken', refreshToken, {
        ...cookieBase,
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: '/token' // only sent to the refresh endpoint
    });
};

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).send("Username and password are required");
    }

    const user = await db.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
        await issueTokens(res, user);
        res.json({ success: true });
    } else {
        return res.status(401).send("Invalid username or password");
    }
});

app.post("/token/logout", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await db.deleteRefreshToken(hash(refreshToken));
    }
    res.clearCookie('accessToken', cookieBase);
    res.clearCookie('refreshToken', { ...cookieBase, path: '/token' });
    res.json({ success: true });
})

app.post("/token", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.sendStatus(401);
    }
    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        return res.sendStatus(403);
    }

    const tokenHash = hash(refreshToken);
    const stored = await db.getRefreshToken(tokenHash);
    if (!stored) {
        return res.sendStatus(403);
    }

    await db.deleteRefreshToken(tokenHash);
    await issueTokens(res, payload);
    res.json({ success: true });
});

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
            process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d', jwtid: crypto.randomUUID() }
        );
};

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})