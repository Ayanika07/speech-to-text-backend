const mongoose = require("mongoose");

const transcriptionSchema = new mongoose.Schema({
  transcription: String,
  userId: String
}, { timestamps: true });

module.exports = mongoose.model("Transcription", transcriptionSchema);