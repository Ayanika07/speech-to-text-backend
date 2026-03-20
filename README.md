Speech-to-Text Web Application
A full-stack web application that converts audio input into text using AI-based speech recognition.
🚀 Features
🎙️ Record audio directly from the browser
📁 Upload audio files
🔊 Convert speech to text instantly
📝 Display transcription results in real-time
📜 View past transcriptions (stored in database)
🌐 Fully deployed and accessible online
🛠️ Tech Stack
🔹 Frontend
React.js
Tailwind CSS
Axios
🔹 Backend
Node.js
Express.js
Multer (file upload handling)
Whisper (speech-to-text processing)
🔹 Database
MongoDB (with Mongoose)
🔹 Deployment
Frontend: Netlify
Backend: Render
📂 Project Structure

Speech-text-project/
│
├── front/
│   ├── src/
│   ├── package.json
│
├── back/
│   ├── models/
│   ├── uploads/
│   ├── server.js
⚙️ Prerequisites
Make sure the following are installed:
Python
FFmpeg
Required Python packages:
Bash
pip install openai-whisper
pip install torch
⚙️ Setup Instructions
🔹 Step 1: Clone Repository
Bash
git clone <https://github.com/Ayanika07/speech-to-text-backend.git>
cd Speech-text-project
🔹 Step 2: Backend Setup
Bash
cd back
npm install
Create a .env file:

MONGO_URI=mongodb://AYA270:AYA270@ac-ryefjtr-shard-00-00.tafkoln.mongodb.net:27017,ac-ryefjtr-shard-00-01.tafkoln.mongodb.net:27017,ac-ryefjtr-shard-00-02.tafkoln.mongodb.net:27017/speechDB?ssl=true&replicaSet=atlas-973p5y-shard-0&authSource=admin&retryWrites=true&w=majority
Run backend:
Bash
node server.js
🔹 Step 3: Frontend Setup
Bash
cd front
npm install
npm run dev
🔗 How It Works
🔁 Application Flow
User records or uploads audio
Audio is sent to backend via HTTP request
Backend processes audio using Whisper
Transcription is generated
Data is stored in MongoDB
Result is sent back to frontend
Transcription is displayed to the user
🖥️ Frontend
Handles user interaction and UI
Sends audio data to backend
JavaScript
axios.post("/api/transcribe", formData);
⚙️ Backend
Receives audio file using Multer
Stores file temporarily
Processes audio using Whisper
Sends transcription response
🎙️ Speech-to-Text Processing
Audio is processed using Whisper
Converts speech into readable text
🗄️ Database (MongoDB)
Stores:
File name
Transcription text
User ID (optional)
🔁 API Response
JSON
{
  "message": "Audio uploaded and transcribed",
  "transcription": "Hello, this is a speech test"
}
🧪 API Testing (Postman)
Steps:
Open Postman
Select POST request
URL: /api/transcribe
Go to Body → form-data
Add key: audio (type: file)
Upload audio file
Click Send
🌐 Deployment
🔹 Backend (Render)
Connect GitHub repository
Add environment variables
Deploy service
🔹 Frontend (Netlify)
Connect repository
Set build directory
Deploy
📌 How to Use
Open the web app
Upload or record audio
Wait for processing
View transcription
Check saved history
⚠️ Notes
First request may be slow (cold start)
Large audio files take more processing time
Ensure FFmpeg is properly installed
🔐 Environment Variables

MONGO_URI=your_database_url
🎯 Future Improvements
User authentication
Download transcription feature
Multi-language support
Improved UI/UX
Regards Ayanika
Built using the MERN stack.
