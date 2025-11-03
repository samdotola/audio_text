import React from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Upload, Sparkles, Languages, Download, Clock } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload Audio Files",
      description: "Support for MP3, WAV, M4A, and more formats"
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Live Recording",
      description: "Record directly from your microphone"
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: "Multi-Language",
      description: "Transcribe audio in multiple languages"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered",
      description: "Powered by OpenAI Whisper technology"
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Export Options",
      description: "Copy, download, or save your transcriptions"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "History",
      description: "Access your past transcriptions anytime"
    }
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#13131d] to-[#0a0a0f]" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-Powered Transcription</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent" data-testid="landing-title">
            Audio to Text in Seconds
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10" data-testid="landing-subtitle">
            Transform your audio recordings into accurate text transcriptions using advanced AI technology.
            Upload files or record live - it's fast, simple, and reliable.
          </p>
          
          <button
            onClick={() => navigate('/transcribe')}
            className="btn-primary inline-flex items-center gap-2 text-lg"
            data-testid="start-transcribing-btn"
          >
            <Mic className="w-5 h-5" />
            Start Transcribing
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-effect p-6 rounded-2xl hover:bg-opacity-80 transition-all hover:scale-105 cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`feature-card-${index}`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="text-center glass-effect rounded-3xl p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-white" data-testid="how-it-works-title">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-1">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/40">
                <span className="text-2xl font-bold text-purple-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Upload or Record</h3>
              <p className="text-gray-400">Choose an audio file or record live with your microphone</p>
            </div>
            
            <div className="text-center" data-testid="step-2">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/40">
                <span className="text-2xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">AI Processing</h3>
              <p className="text-gray-400">Our AI transcribes your audio with high accuracy</p>
            </div>
            
            <div className="text-center" data-testid="step-3">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/40">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Get Your Text</h3>
              <p className="text-gray-400">Copy, download, or save your transcription</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;