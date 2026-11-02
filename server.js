import express from "express";
import * as db from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
dotenv.config();
const app = express();

app.use(express.json());

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", async (req, res) => {
    res.render("index.ejs");
});

app.get("/messages", async (req, res) => {
    const messages = await db.getMessages();
    res.render("messages.ejs", { messages });
});

app.get("/createMessage", requirePage, async (req, res) => {
    res.render("createMessage.ejs");
});

app.post("/messages", requireApi, async (req, res) => {
    const username = req.body.username?.trim() || "Anonymous";
    await db.createMessage(req.user.id, req.body.message, username);
    res.status(201).json({ success: true });
});

app.delete("/messages/:id", requireApi, async (req, res) => {
    const message = await db.getMessageById(+req.params.id);
    if (!message) {
        return res.status(404).send({ message: "Message not found" });
    }
    if (message.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).send({ message: "Forbidden" });
    }
    await db.deleteMessage(message.id);
    res.status(200).send({ message: "Message deleted successfully" });
});

app.get("/login", async (req, res) => {
    res.render('login.ejs');
});

app.get("/register", async (req, res) => {
    res.render('register.ejs');
});

app.get("/myposts", requireApi, async (req, res) => {
    const posts = await db.getMessages();
    res.json(posts.filter(post => post.user_id === req.user.id));
});

app.post("/updatePassword", requirePage, async (req, res) => {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.updatePassword(req.user.username, hashedPassword);
    res.redirect("/login");
});

app.post("/register", async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
        await db.createUser(username.trim(), hashedPassword);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Username already exists");
        }
        throw error;
    }
    res.redirect("/login");
    
});

app.get("/users", requireApi, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send("Forbidden");
    }
    const users = await db.getUsers();
    res.json(users.map(({ password, ...user }) => user));
});

function verifyAccess(req) {
    const token = req.cookies.accessToken;

    if (!token) {
        return null;
    }
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
        return null;
    }
}

function requirePage(req, res, next) {
    const user = verifyAccess(req);
    if (!user) {
        return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
    }
    req.user = user;
    next();
}

function requireApi(req, res, next) {
    const user = verifyAccess(req);
    if (!user) {
        return res.status(401).send("Unauthorized");
    }
    req.user = user;
    next();
}

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

app.use(express.static("public"));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});