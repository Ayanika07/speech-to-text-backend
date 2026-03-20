require("dotenv").config({ path: __dirname + "/.env" });
// redeploy trigger
const { execSync } = require("child_process");

try {
  console.log("Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });
} catch (e) {
  console.log("Install failed:", e);
}
console.log("ENV:", process.env.MONGO_URI);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const Audio = require("./models/Audio");
const Transcription = require("./models/Transcription");

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());
/*---------------- MONGODB CONNECTION ---------------- */

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Atlas Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;

/* ---------------- UPLOAD FOLDER ---------------- */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ---------------- MULTER STORAGE ---------------- */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});



/* ---------------- TEST ROUTE ---------------- */

app.get("/", (req, res) => {
  res.send("Speech to Text Backend Running");
});

/* ---------------- GET USER TRANSCRIPTIONS ---------------- */

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

/* ---------------- AUDIO UPLOAD + WHISPER ---------------- */

app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    console.log("API HIT");
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audioPath = req.file.path;

    console.log("Processing audio:", audioPath);

    const outputBase = path.basename(audioPath, path.extname(audioPath));
    const outputTextPath = path.join(uploadDir, `${outputBase}.txt`);

    const whisperCommand = `whisper "${audioPath}" --model small --output_dir "${uploadDir}" --output_format txt`;
    console.log("Running Whisper command:", whisperCommand);
    exec(whisperCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("Whisper CLI error:", error);
      console.error("Whisper stderr:", stderr);
      return res.status(500).json({ error: "Whisper transcription failed" });
    }

    // ✅ Wait a bit to ensure file is created (VERY IMPORTANT)
    setTimeout(() => {

      fs.readFile(outputTextPath, "utf8", async (readErr, transcription) => {

        if (readErr) {
          console.error("Failed to read Whisper output:", readErr);
          return res.status(500).json({ error: "Failed to read transcription" });
        }

        transcription = transcription.trim();
        console.log("Transcription:", transcription);

        const userId = req.body.userId;

        const newAudio = new Audio({
          filename: req.file.filename,
          transcription
        });

        await newAudio.save();

    await Transcription.create({
      transcription,
      userId
    });

        res.json({
          message: "Audio uploaded and transcribed",
          transcription
        });

      });

    }, 1000); // ⏱️ delay fix

  }
);

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


app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audioPath = req.file.path;

    const outputBase = path.basename(audioPath, path.extname(audioPath));
    const outputTextPath = path.join(uploadDir, `${outputBase}.txt`);

    const command = `whisper "${audioPath}" --model small --output_dir "${uploadDir}" --output_format txt`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Whisper failed" });
      }

      // Wait for file to be created
      setTimeout(() => {
        fs.readFile(outputTextPath, "utf8", (err, data) => {
          if (err) {
            return res.status(500).json({ error: "File read failed" });
          }

          res.json({
            transcription: data.trim()
          });
        });
      }, 1000);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const upload = multer({ dest: "uploads/" });

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", req.file.path);

    // TEMP RESPONSE (for testing)
    res.json({
      transcription: "Test transcription working ✅"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});
