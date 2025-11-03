import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Upload,
  Mic,
  MicOff,
  Copy,
  Download,
  Save,
  ArrowLeft,
  Loader2,
  FileAudio,
  Trash2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TranscriptionPage = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("en");
  const [history, setHistory] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const languages = [
    { code: "auto", name: "Auto Detect" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/transcriptions`);
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        await handleTranscribe(audioFile);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to access microphone");
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      toast.info("Processing recording...");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleTranscribe(file);
    }
  };

  const handleTranscribe = async (file) => {
    if (!file) return;

    setIsTranscribing(true);
    setTranscription("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    try {
      const response = await axios.post(`${API}/transcribe?language=${language}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setTranscription(response.data.text);
      toast.success("Transcription complete!");
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Transcription failed");
      console.error("Transcription error:", error);
    } finally {
      setIsTranscribing(false);
      setSelectedFile(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/transcriptions/${id}`);
      toast.success("Deleted successfully");
      fetchHistory();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#13131d] to-[#0a0a0f]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-gray-400 hover:text-white"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload/Record Section */}
            <div className="glass-effect rounded-2xl p-8" data-testid="upload-section">
              <h2 className="text-2xl font-bold mb-6 text-white">Transcribe Audio</h2>

              {/* Language Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full bg-[#1a1a24] border-gray-700 text-white" data-testid="language-selector">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a24] border-gray-700">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-gray-800">
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upload/Record Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTranscribing || isRecording}
                  className="glass-effect p-6 rounded-xl hover:bg-opacity-80 transition-all border border-purple-500/30 hover:border-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="upload-file-btn"
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                  <p className="font-semibold text-white">Upload File</p>
                  <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A</p>
                </button>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`glass-effect p-6 rounded-xl transition-all border ${
                    isRecording
                      ? "border-red-500/60 bg-red-500/10"
                      : "border-blue-500/30 hover:border-blue-500/60 hover:bg-opacity-80"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  data-testid="record-audio-btn"
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8 mx-auto mb-3 text-red-400 animate-pulse" />
                  ) : (
                    <Mic className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                  )}
                  <p className="font-semibold text-white">
                    {isRecording ? `Recording ${formatTime(recordingTime)}` : "Record Audio"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRecording ? "Click to stop" : "Click to start"}
                  </p>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />

              {/* Progress Indicator */}
              {isTranscribing && (
                <div className="text-center py-8" data-testid="progress-indicator">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                  <p className="text-gray-400">Transcribing your audio...</p>
                </div>
              )}
            </div>

            {/* Transcription Result */}
            {transcription && (
              <div className="glass-effect rounded-2xl p-8 fade-in" data-testid="transcription-result">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Transcription</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:text-white"
                      data-testid="copy-btn"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:text-white"
                      data-testid="download-btn"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div
                  className="bg-[#0a0a0f] rounded-xl p-6 text-gray-300 leading-relaxed min-h-[200px] max-h-[400px] overflow-y-auto"
                  data-testid="transcription-text"
                >
                  {transcription}
                </div>
              </div>
            )}
          </div>

          {/* History Panel */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-6 sticky top-8" data-testid="history-panel">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                History
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No transcriptions yet</p>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-[#0a0a0f] rounded-lg p-4 hover:bg-opacity-80 transition-all cursor-pointer border border-gray-800 hover:border-purple-500/30"
                      onClick={() => setTranscription(item.text)}
                      data-testid={`history-item-${index}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileAudio className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-white truncate">{item.filename}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                          data-testid={`delete-btn-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{formatDate(item.timestamp)}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;