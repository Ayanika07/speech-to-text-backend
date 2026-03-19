import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { supabase } from "../supabase";

function AudioUploader() {

  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [transcription, setTranscription] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
  });
}, []);

  // UPLOAD AUDIO
  const uploadAudio = async (inputFile) => {
    if (!inputFile) return;

    const formData = new FormData();
    formData.append("audio", inputFile);
    formData.append("userId", user?.id);

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        "http://localhost:5000/upload-audio",
        formData
      );

      setTranscription(res.data.transcription);

    } catch (error) {
      console.error(error);
      setError("⚠️ Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  // FILE UPLOAD
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      "audio/mp3",
      "audio/wav",
      "audio/mpeg",
      "audio/webm"
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("❌ Invalid file type. Please upload an audio file.");
      return;
    }

    setError("");
    await uploadAudio(selectedFile);
  };

  // START RECORDING
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAudio(blob);
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setRecording(true);

    } catch (err) {
      setError("🎤 Microphone permission denied.");
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // FETCH HISTORY
  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const res = await axios.get("http://localhost:5000/transcriptions");
        setHistory(res.data);
      } catch (err) {
        setError("⚠️ Failed to load history.");
      }
    };

    fetchTranscriptions();
  }, []);

  return (
    <div className="min-h-screen font-poppins flex flex-col items-center justify-center text-center
    bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white px-4">

      {/* HERO TITLE */}
      <h1 className="text-6xl md:text-7xl font-extrabold mb-4 tracking-wide">
        🎤 Speech Recorder
      </h1>

      {/* SUBTITLE */}
      <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl">
        Upload audio or record your voice and convert it instantly
      </p>
      <button
onClick={async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: prompt("Enter your email")
  });

  if (error) alert(error.message);
  else alert("Check your email for login link");
}}
className="mb-4 px-4 py-2 bg-blue-500 rounded"
> 
Login
</button>

      {/* GLASS CARD */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20
      p-10 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-2xl space-y-4">

        {/* FILE INPUT */}
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          hidden
        />

        <button
          onClick={() => fileInputRef.current.click()}
          className="w-full py-4 text-lg rounded-xl
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-semibold hover:scale-105 transition"
        >
          Choose File
        </button>

        {/* RECORD BUTTON */}
        {!recording ? (
          <button
            onClick={startRecording}
            className="w-full py-4 text-lg rounded-xl
            bg-green-500 text-white font-semibold
            hover:bg-green-600 hover:scale-105 transition"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600
            px-10 py-4 text-lg rounded-full shadow-lg transition"
          >
            Stop Recording
          </button>
        )}

        {/* RECORDING STATUS */}
        {recording && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-red-400">Recording...</span>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-red-400 font-medium">
            {error}
          </p>
        )}

        {/* LOADING */}
        {loading && (
          <p className="text-yellow-400 animate-pulse">
            Transcribing...
          </p>
        )}

        {/* TRANSCRIPTION */}
        <div className="bg-black/40 backdrop-blur-md
        p-5 rounded-xl shadow-lg w-full">

          <h2 className="text-xl font-semibold mb-2">
            Transcription
          </h2>

          <p className="text-gray-300">
            {transcription || "Your speech will appear here"}
          </p>
        </div>

        {/* HISTORY */}
        <div className="w-full">

          <h2 className="text-2xl font-bold mb-4">
            Previous Transcriptions
          </h2>

          {history.map((item) => (
            <div
              key={item._id}
              className="bg-black/50 p-4 mb-3 rounded-xl
              shadow-md hover:scale-105 transition"
            >
              <p className="text-gray-200">
                {item.transcription}
              </p>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}

export default AudioUploader;