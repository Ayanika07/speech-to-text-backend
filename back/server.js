require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const axios = require("axios");

const Transcription = require("./models/Transcription");

const app = express();
/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
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
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

/* ---------------- MULTER ---------------- */

const ALLOWED_MIME_TYPES = new Set([
   "audio/wav",
  "audio/wave",      // ← add this
  "audio/x-wav",     // ← some older browsers send this too
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
]);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB cap
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/* ---------------- HELPERS ---------------- */

// Always clean up the temp file, even on error
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.warn("⚠️ Could not delete temp file:", err.message);
  });
};

/* ---------------- ROUTES ---------------- */

app.get("/", (_req, res) => {
  res.send("Speech to Text Backend Running");
});

/* ---------------- TRANSCRIPTION ROUTE ---------------- */

app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;

  try {
    const audioBuffer = fs.readFileSync(filePath);

   const { data } = await axios.post(
  "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3",
  audioBuffer,
  {
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": req.file.mimetype,
      "Accept": "application/json", // ← add this
    },
    timeout: 300_000,
  }
);
    // Validate HF actually returned text before saving
    if (!data?.text) {
      throw new Error("Hugging Face returned no transcription text");
    }

    // TODO: replace with real auth — e.g. req.user.id from JWT middleware
    const userId = req.body.userId || "guest";

    await Transcription.create({ transcription: data.text, userId });

    res.json({ message: "Transcription successful", text: data.text });
  } catch (error) {
    console.error("Transcription error:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    res.status(status).json({
      error: "Transcription failed",
      details: error.response?.data || error.message,
    });
  } finally {
    deleteFile(filePath); // always runs, success or failure
  }
});

/* ---------------- GET HISTORY ---------------- */

app.get("/transcriptions", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // TODO: verify userId matches authenticated user before querying
    const data = await Transcription.find({ userId }).sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch transcriptions" });
  }
});

/* ---------------- ERROR HANDLER ---------------- */

// Catches multer errors (file too large, wrong type) centrally
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message.startsWith("Unsupported")) {
    return res.status(400).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));