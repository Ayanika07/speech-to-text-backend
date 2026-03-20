require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Audio = require("./models/Audio");
const Transcription = require("./models/Transcription");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: "*" }));
app.use(express.json());

/* ---------------- MONGODB ---------------- */

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};

connectDB();

/* ---------------- UPLOAD FOLDER ---------------- */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ---------------- MULTER ---------------- */

const upload = multer({ dest: "uploads/" });

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.send("Speech to Text Backend Running");
});

/* ---------------- GET HISTORY ---------------- */

app.get("/transcriptions", async (req, res) => {
  try {
    const { userId } = req.query;

    const data = await Transcription.find({ userId }).sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transcriptions" });
  }
});

/* ---------------- TRANSCRIBE (WORKING VERSION) ---------------- */

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    console.log("API HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File:", req.file.path);

    // ✅ TEMP TRANSCRIPTION (since Whisper won't work on Render)
    const transcription = "Test transcription working ✅";

    const userId = req.body.userId || "test-user";

    await Transcription.create({
      transcription,
      userId
    });

    res.json({
      message: "Success",
      transcription
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});