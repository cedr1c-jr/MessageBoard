import express from "express";
import { getMessages, getMessageById, createMessage, createUser, getUserByUsername } from './db.js';
const app = express();
const PORT = 3000;
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    res.render("index.ejs");
});

app.get("/messages", async (req, res) => {
    const messages = await getMessages();
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
    await createMessage(data.user_id, data.message, data.username);
    res.redirect("/messages");
});

app.delete("/messages/:id", async (req, res) => {
    const id = +req.params.id;
    const success = await deleteMessage(id);
    if (success) {
        res.status(200).send({ message: "Message deleted successfully" });
    } else {
        res.status(404).send({ message: "Message not found" });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = getUserByUsername(username);
    if (user && user.password === password) {
        res.redirect("/messages");
    } else {
        res.status(401).send("Invalid username or password");
    }
});

app.post("/register", async (req, res) => {
    const { username, password} = req.body;
    if (username && password) {
        await createUser(username, password);
        res.redirect("/login"); 
    } else {
        res.status(400).send("Bad Request")
    }
    
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});