import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Initialize SQLite DB
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) console.error("Error:", err);
  else console.log("Connected to SQLite");
});

// Users table with name and prePrompt
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    prePrompt TEXT
  )
`);

// Chat sessions table
db.run(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Chat messages table
db.run(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    message_type TEXT CHECK(message_type IN ('user', 'ai')),
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
  )
`);

// --- SIGNUP ---
app.post("/signup", (req, res) => {
  let { email, password, name } = req.body;
  if (!email || !password) return res.json({ success: false, error: "Missing fields" });

  email = email.trim().toLowerCase();

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    "INSERT INTO users (email, password, name, prePrompt) VALUES (?, ?, ?, ?)",
    [email, hashedPassword, name, ""],
    function (err) {
      if (err) return res.json({ success: false, error: "User already exists" });
      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: "12h" });
      res.json({ success: true, token, user: { id: this.lastID, email, name, prePrompt: "" } });
    }
  );
});

// --- LOGIN ---
app.post("/login", (req, res) => {
  let { email, password } = req.body;
  email = email.trim().toLowerCase();
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.json({ success: false, error: "User not found" });
    // If user was created via Google, password will be empty
    if (!user.password) return res.json({ success: false, error: "Please login with Google" });
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.json({ success: false, error: "Invalid password" });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "12h" });
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, prePrompt: user.prePrompt || "" } });
  });
});

// --- GOOGLE LOGIN ---
app.post("/google-login", (req, res) => {
  const { email, name } = req.body;
  const userName = name || email.split("@")[0];

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.json({ success: false, error: "Database error" });
    if (user) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "12h" });
      return res.json({ success: true, token, user });
    }

    // create user
    db.run(
      "INSERT INTO users (email, password, name, prePrompt) VALUES (?, ?, ?, ?)",
      [email, "", userName, ""],
      function (err2) {
        if (err2) return res.json({ success: false, error: "Error creating user" });
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: "12h" });
        res.json({ success: true, token, user: { id: this.lastID, email, name: userName, prePrompt: "" } });
      }
    );
  });
});

// --- UPDATE SETTINGS ---
app.put("/user/update", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    const { name, prePrompt } = req.body;

    db.run("UPDATE users SET name = ?, prePrompt = ? WHERE id = ?", [name, prePrompt, decoded.id], (err2) => {
      if (err2) return res.json({ success: false, error: "Update failed" });
      res.json({ success: true, message: "Settings updated", name, prePrompt });
    });
  });
});

// --- CREATE NEW CHAT SESSION ---
app.post("/chat/session/new", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    const { title } = req.body;

    db.run("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", [decoded.id, title || "New Chat"], function(err2) {
      if (err2) return res.json({ success: false, error: "Could not create session" });
      res.json({ success: true, sessionId: this.lastID });
    });
  });
});

// --- SAVE CHAT MESSAGE ---
app.post("/chat/message", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    const { sessionId, messageType, content } = req.body;

    db.run("INSERT INTO chat_messages (session_id, message_type, content) VALUES (?, ?, ?)", [sessionId, messageType, content], (err2) => {
      if (err2) return res.json({ success: false, error: "Could not save message" });
      
      // Update session timestamp
      db.run("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [sessionId]);
      
      res.json({ success: true, message: "Message saved" });
    });
  });
});

// --- GET CHAT SESSIONS ---
app.get("/chat/sessions", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    db.all("SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC", [decoded.id], (err2, rows) => {
      if (err2) return res.json({ success: false, error: "Could not retrieve sessions" });
      res.json({ success: true, sessions: rows });
    });
  });
});

// --- GET CHAT MESSAGES ---
app.get("/chat/messages/:sessionId", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    const { sessionId } = req.params;
    
    // Verify session belongs to user
    db.get("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", [sessionId, decoded.id], (err2, session) => {
      if (err2 || !session) return res.json({ success: false, error: "Session not found" });
      
      db.all("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC", [sessionId], (err3, messages) => {
        if (err3) return res.json({ success: false, error: "Could not retrieve messages" });
        res.json({ success: true, messages });
      });
    });
  });
});

// --- GET USER INFO ---
app.get("/user/info", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    db.get("SELECT id, email, name, prePrompt FROM users WHERE id = ?", [decoded.id], (err2, user) => {
      if (err2 || !user) return res.json({ success: false, error: "User not found" });
      res.json({ success: true, user });
    });
  });
});

// --- UPDATE CHAT TITLE ---
app.put("/chat/session/:sessionId/title", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    const { sessionId } = req.params;
    const { title } = req.body;
    
    // Verify session belongs to user
    db.get("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", [sessionId, decoded.id], (err2, session) => {
      if (err2 || !session) return res.json({ success: false, error: "Session not found" });
      
      db.run("UPDATE chat_sessions SET title = ? WHERE id = ?", [title, sessionId], (err3) => {
        if (err3) return res.json({ success: false, error: "Could not update title" });
        res.json({ success: true, message: "Title updated" });
      });
    });
  });
});

// --- AI CHAT ENDPOINT ---
app.post("/chat/ai", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    
    const { message, systemPrompt, conversationHistory } = req.body;
    if (!message) return res.json({ success: false, error: "No message provided" });

    // Get user info for personalized prompt
    db.get("SELECT name, prePrompt FROM users WHERE id = ?", [decoded.id], (err2, user) => {
      if (err2) return res.json({ success: false, error: "User not found" });
      
      // Use provided data or create from user info
      const userName = user.name || "User";
      const userPrompt = user.prePrompt || "";
      const finalSystemPrompt = systemPrompt || `You are Aera, a friendly and knowledgeable AI assistant. The user's name is ${userName}. ${userPrompt} Answer questions clearly and concisely. If the user's request is unclear, ask clarifying questions. Stay focused on what the user asks.`;
      const finalConversationHistory = conversationHistory || "";
        
        // Use main.py AI service with llama model
        const pythonScript = path.join(__dirname, "..", "AI", "ai python", "main.py");
        
        console.log("Starting Llama AI service:", pythonScript);
        
        let pythonProcess = spawn("python", [pythonScript, "--service"]);
        
        let aiResponse = "";
        let errorOutput = "";
        
        pythonProcess.stdout.on("data", (data) => {
          aiResponse += data.toString();
        });
        
        pythonProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });
        
        pythonProcess.on("close", (code) => {
          console.log(`Python process exited with code: ${code}`);
          
          if (code === 0 && aiResponse.trim()) {
            try {
              const result = JSON.parse(aiResponse.trim());
              if (result.response) {
                res.json({ success: true, response: result.response });
              } else {
                console.error("AI Error:", result.error || "Unknown error");
                res.json({ success: false, error: "AI service error" });
              }
            } catch (e) {
              console.error("JSON parse error:", e);
              res.json({ success: false, error: "AI response parsing failed" });
            }
          } else {
            console.log("AI process failed");
            res.json({ success: false, error: "AI service unavailable" });
          }
        });
        
        pythonProcess.on("error", (error) => {
          console.error("Failed to start Python process:", error);
          res.json({ success: false, error: "AI service unavailable" });
        });
        
        // Send input to Python script
        const aiInput = {
          system_prompt: finalSystemPrompt,
          conversation_history: finalConversationHistory,
          user_input: message
        };
        
        pythonProcess.stdin.write(JSON.stringify(aiInput));
        pythonProcess.stdin.end();
    });
  });
});

// --- DELETE CHAT SESSION ---
app.delete("/chat/session/:sessionId", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    const { sessionId } = req.params;
    
    // Verify session belongs to user
    db.get("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", [sessionId, decoded.id], (err2, session) => {
      if (err2 || !session) return res.json({ success: false, error: "Session not found" });
      
      // Delete messages first
      db.run("DELETE FROM chat_messages WHERE session_id = ?", [sessionId], (err3) => {
        if (err3) return res.json({ success: false, error: "Could not delete messages" });
        
        // Delete session
        db.run("DELETE FROM chat_sessions WHERE id = ?", [sessionId], (err4) => {
          if (err4) return res.json({ success: false, error: "Could not delete session" });
          res.json({ success: true, message: "Session deleted" });
        });
      });
    });
  });
});

app.listen(PORT, () => console.log(`Server running on http://0.0.0.0:${PORT}`));
