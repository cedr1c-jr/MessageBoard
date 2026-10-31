import express from "express";
import * as db from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const app = express();
const PORT = 3000;

app.use(express.json());

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    res.render("index.ejs");
});

app.get("/messages", async (req, res) => {
    const messages = await db.getMessages();
    res.render("messages.ejs", { messages });
});

app.get("/createMessage", async (req, res) => {
    res.render("createMessage.ejs");
});

app.post("/messages", async (req, res) => {
    const data = req.body;
    if (!data.username) {
        data.username = "Anonymous";
    }
    data.user_id = 1; // Hardcoded user_id for demonstration purposes
    await db.createMessage(data.user_id, data.message, data.username);
    res.redirect("/messages");
});

app.delete("/messages/:id", async (req, res) => {
    const id = +req.params.id;
    const success = await db.deleteMessage(id);
    if (success) {
        res.status(200).send({ message: "Message deleted successfully" });
    } else {
        res.status(404).send({ message: "Message not found" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).send("Username and password are required");
    }

    const user = await db.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
        res.json({ accessToken: accessToken })
    } else {
        return res.status(401).send("Invalid username or password");
    }
});

app.get("/login", async (req, res) => {
    res.render('login.ejs');
});

app.get("/register", async (req, res) => {
    res.render('register.ejs');
});

app.get("/myposts", authenticateToken, async (req, res) => {
    const posts = await db.getMessages();
    res.json(posts.filter(post => post.user_id === req.user.id));
});

app.post("/updatePassword", async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await db.updatePassword(username, hashedPassword);
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

app.get("/users", async (req, res) => {
    const users = await db.getUsers();
    res.json(users);
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});