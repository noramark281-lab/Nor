import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Play, Pause, Volume2, Image as ImageIcon, Mic, RefreshCw, Clock, Layers, Flame, CheckCircle, Wand2 } from 'lucide-react';
import { MeditationSession, VoiceName, ImageResolution } from '../types';

const PRESET_SESSIONS: MeditationSession[] = [
  {
    id: 'preset-1',
    title: "Trader's Volatility Zen & Focus",
    category: 'Trading Zen',
    description: 'Calm your mind before high-stakes market events or trading sessions.',
    durationMinutes: 5,
    prompt: 'A tranquil mountain summit above a misty sea of clouds at sunrise, hyper-detailed, peaceful ambient glow',
    voice: 'Kore',
    imageResolution: '2K',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    script: 'Welcome to your trading zen session. Close your eyes. Take a deep breath in... center your mind away from market noise... exhale all anxiety. You are composed, disciplined, and focused.',
  },
  {
    id: 'preset-2',
    title: 'Deep Ocean Waves Mindfulness',
    category: 'Mindfulness',
    description: 'Immerse in rhythmic ocean tides to release stress and ground your energy.',
    durationMinutes: 10,
    prompt: 'Golden sunset over a calm ocean beach with gentle crystal clear waves, ultra photorealistic landscape',
    voice: 'Zephyr',
    imageResolution: '4K',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    script: 'Listen to the gentle ebb and flow of the ocean waves. Inhale deeply as the tide comes in... feel the cool ocean air... hold... and release as the water recedes into the golden horizon.',
  },
  {
    id: 'preset-3',
    title: 'Cosmic Starfield & Deep Sleep',
    category: 'Deep Sleep',
    description: 'Drift into restorative sleep under a luminous galactic nebula sky.',
    durationMinutes: 15,
    prompt: 'A breathtaking cosmic nebula with deep purple and turquoise stars softly shimmering over a peaceful dark horizon',
    voice: 'Fenrir',
    imageResolution: '4K',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    script: 'Allow your body to sink weightlessly into the mattress. Look up at the cosmic tapestry of infinite calm. Every breath relaxes your muscles deeper and deeper into serene peace.',
  },
];

export const MeditationTab: React.FC = () => {
  // Form State
  const [prompt, setPrompt] = useState("A serene bamboo forest with sunlight filtering through soft green leaves and a quiet crystal stream");
  const [category, setCategory] = useState<MeditationSession['category']>('Mindfulness');
  const [duration, setDuration] = useState(5);
  const [voice, setVoice] = useState<VoiceName>('Kore');
  const [resolution, setResolution] = useState<ImageResolution>('2K');

  // Generation & Player State
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<MeditationSession | null>(PRESET_SESSIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Breathing Circle Animation Cycle
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle Session Generation
  const handleGenerateSession = async () => {
    try {
      setIsGenerating(true);
      setIsPlaying(false);

      // Step 1: Script
      setGenStep('Writing custom meditation script with Gemini...');
      const scriptRes = await fetch('/api/meditation/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, durationMinutes: duration, category }),
      });
      const scriptData = await scriptRes.json();
      const generatedScript = scriptData.script || 'Breathe deeply and relax your mind...';

      // Step 2: Image
      setGenStep(`Generating ${resolution} ambient visual with Gemini Image AI...`);
      const imgRes = await fetch('/api/meditation/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, resolution }),
      });
      const imgData = await imgRes.json();
      const generatedImageUrl = imgData.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop';

      // Step 3: Voiceover TTS
      setGenStep(`Generating soothing voiceover with voice "${voice}" via Gemini TTS...`);
      const ttsRes = await fetch('/api/meditation/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generatedScript, voice }),
      });
      const ttsData = await ttsRes.json();

      let createdAudioUrl = null;
      if (ttsData.audioBase64) {
        // Convert base64 PCM/WAV audio to Blob URL
        const binary = atob(ttsData.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        createdAudioUrl = URL.createObjectURL(blob);
        setAudioUrl(createdAudioUrl);
      }

      const newSession: MeditationSession = {
        id: `gen-${Date.now()}`,
        title: `${category}: ${prompt.slice(0, 30)}...`,
        category,
        description: `Custom ${duration}-min guided meditation generated with ${voice} voice & ${resolution} visual.`,
        durationMinutes: duration,
        prompt,
        voice,
        imageResolution: resolution,
        imageUrl: generatedImageUrl,
        script: generatedScript,
      };

      setCurrentSession(newSession);
      setGenStep('Session generation complete!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate session. Please check your network connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDurationSec(audio.duration);
      audio.onended = () => setIsPlaying(false);
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Toggle visual breathing state even without real audio
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 border border-emerald-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini AI Guided Meditation Studio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Craft Custom Meditation Sessions with Unique Visuals & AI Voiceovers
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Specify your mental clarity theme, choose an AI voiceover narrator, select ultra-HD image resolutions (1K, 2K, 4K), and generate a personalized audio-visual meditation experience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Generator Controls Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <span>Session Creator</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Powered by Gemini</span>
          </div>

          {/* Theme Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Meditation Theme & Visual Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-slate-500"
              placeholder="e.g. A serene misty lake at golden sunrise with pine trees and gentle ripples..."
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Category Focus
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Mindfulness', 'Trading Zen', 'Deep Sleep', 'Focus & Clarity', 'Stress Relief'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                    category === cat
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Narrator Selector (Gemini TTS requirement) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Voiceover Narrator (TTS)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">gemini-3.1-flash-tts-preview</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'] as VoiceName[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    voice === v
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Image Size Selector Affordance (1K, 2K, 4K requirement) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Visual Resolution Quality</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">gemini-3.1-flash-image</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center space-x-1 ${
                    resolution === res
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{res} Resolution</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="uppercase tracking-wider">Duration</span>
              <span className="text-emerald-400 font-mono">{duration} Minutes</span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateSession}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                <span className="text-xs sm:text-sm font-bold">{genStep || 'Generating Session...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Generate Session with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Live Active Player & Ambient Display */}
        <div className="lg:col-span-7 space-y-6">
          {currentSession && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              {/* Visual Display Container */}
              <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-slate-950">
                <img
                  src={currentSession.imageUrl}
                  alt={currentSession.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all duration-1000 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-emerald-300 text-xs font-semibold">
                    {currentSession.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-slate-300 text-xs font-mono">
                    {currentSession.imageResolution} HD Visual
                  </span>
                </div>

                {/* Breathing Visualizer Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div
                    className={`w-32 h-32 rounded-full border-2 border-emerald-400/60 bg-emerald-500/10 flex items-center justify-center backdrop-blur-sm transition-all duration-[4000ms] ${
                      isPlaying
                        ? breathingPhase === 'Inhale'
                          ? 'scale-125 border-emerald-400 bg-emerald-500/25 shadow-2xl shadow-emerald-500/40'
                          : breathingPhase === 'Hold'
                          ? 'scale-125 border-cyan-400 bg-cyan-500/25 shadow-2xl shadow-cyan-500/40'
                          : 'scale-90 border-teal-500 bg-teal-500/10'
                        : 'scale-100'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-xs uppercase font-bold text-emerald-300 tracking-widest block">
                        {isPlaying ? breathingPhase : 'Breathing'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        {isPlaying ? 'Follow Rhythm' : 'Press Play'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute bottom-4 left-6 right-6 space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white shadow-sm">
                    {currentSession.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {currentSession.description}
                  </p>
                </div>
              </div>

              {/* Player Controls Section */}
              <div className="p-6 space-y-4 bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {isPlaying ? 'Playing Meditation Guide' : 'Session Ready'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Voice: {currentSession.voice} • Duration: {currentSession.durationMinutes} mins
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                    {durationSec > 0 && <span>/ {Math.floor(durationSec / 60)}:{(Math.floor(durationSec % 60)).toString().padStart(2, '0')}</span>}
                  </div>
                </div>

                {/* Script readout box */}
                {currentSession.script && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Guided Script Text</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic max-h-32 overflow-y-auto">
                      "{currentSession.script}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Presets Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Featured Preset Sessions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRESET_SESSIONS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentSession(p);
                    setIsPlaying(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    currentSession?.id === p.id
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative h-28 rounded-lg overflow-hidden mb-3">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-emerald-300 font-semibold">
                      {p.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{p.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
