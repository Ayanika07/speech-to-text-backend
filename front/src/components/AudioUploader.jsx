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

  // ✅ UPLOAD AUDIO
  const uploadAudio = async (inputFile) => {
    if (!inputFile) return;

    const formData = new FormData();
    formData.append("audio", inputFile);
    formData.append("userId", user?.id);

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        "https://speech-to-text-backend-17.onrender.com/upload-audio",
        formData
      );

      setTranscription(res.data.transcription);

    } catch (err) {
      console.error(err);
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
      setError("❌ Invalid file type.");
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

  // ✅ STOP RECORDING
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // FETCH HISTORY
  useEffect(() => {
    if (!user) return;

    const fetchTranscriptions = async () => {
      try {
        const res = await axios.get("https://speech-to-text-backend-17.onrender.com/transcriptions");
        setHistory(res.data);

      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to load history.");
      }
    };

    fetchTranscriptions();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center
    bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white px-4">

      <h1 className="text-6xl font-bold mb-4">
        🎤 Speech Recorder
      </h1>

      <p className="mb-6 text-gray-300">
        Upload or record audio to transcribe instantly
      </p>

      {/* LOGIN */}

<button
  onClick={async () => {
    if (cooldown) {
      alert("⏳ Please wait before requesting again");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: prompt("Enter your email")
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email");
      setCooldown(true);

      setTimeout(() => {
        setCooldown(false);
      }, 60000); // 1 min cooldown
    }
  }}
  className="mb-4 px-4 py-2 bg-blue-500 rounded"
>
  Login
</button>

      <div className="bg-white/10 p-6 rounded-xl w-full max-w-xl">

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
          className="w-full py-3 mb-3 bg-purple-500 rounded"
        >
          Upload Audio
        </button>

        {/* RECORD */}
        {!recording ? (
          <button
            onClick={startRecording}
            className="w-full py-3 bg-green-500 rounded"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-full py-3 bg-red-500 rounded"
          >
            Stop Recording
          </button>
        )}

        {/* STATUS */}
        {recording && <p className="mt-2 text-red-400">Recording...</p>}
        {loading && <p className="mt-2 text-yellow-400">Transcribing...</p>}
        {error && <p className="mt-2 text-red-400">{error}</p>}

        {/* TRANSCRIPTION */}
        <div className="mt-4 p-3 bg-black/40 rounded">
          <h2 className="font-semibold">Result:</h2>
          <p>{transcription || "No transcription yet"}</p>
        </div>

        {/* HISTORY */}
        <div className="mt-4">
          <h2 className="font-semibold mb-2">History</h2>

          {history.map((item) => (
            <div key={item._id} className="bg-black/50 p-2 mb-2 rounded">
              {item.transcription}
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}

export default AudioUploader;