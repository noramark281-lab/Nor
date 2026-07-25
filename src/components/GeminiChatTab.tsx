import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Volume2, Trash2, Cpu, Zap, Brain, Shield } from 'lucide-react';
import { ChatMessage, ChatModel } from '../types';

export const GeminiChatTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً بك! أنا مساعد Gemini الذكي لمشروعك. أستطيع مساعدتك في الاستراتيجيات لتداول العقود الآجلة للأحداث على MEXC، وإعداد جلسات التأمل الموجه، وأيضاً متابعة بناء تطبيق الأندرويد في GitHub.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ChatModel>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<'meditation_master' | 'mexc_trader' | 'github_engineer'>('mexc_trader');
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel,
          systemRole: selectedRole,
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'أعتذر، حدث خطأ أثناء معالجة الطلب.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        role: 'assistant',
        content: 'تعذر الاتصال بالخادم. يرجى التحقق من المفاتيح والشبكة.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio version of message using Gemini TTS
  const handleSpeakMessage = async (msgId: string, text: string) => {
    try {
      setIsTtsPlaying(msgId);
      const res = await fetch('/api/meditation/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setIsTtsPlaying(null);
        audio.play();
      } else {
        setIsTtsPlaying(null);
      }
    } catch (err) {
      console.error(err);
      setIsTtsPlaying(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans" dir="rtl">
      {/* Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">مساعد Gemini الذكي متعدد النماذج</h2>
              <p className="text-xs text-slate-400">دعم متكامل لاستراتيجيات التداول، البناء البرمجي والتأمل</p>
            </div>
          </div>

          {/* Model Selector Buttons */}
          <div className="flex items-center space-x-2 space-x-reverse text-xs font-mono">
            <button
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>gemini-3.5-flash (عام)</span>
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>gemini-3.1-pro (تحليل معقد)</span>
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>gemini-3.1-flash-lite (سريع)</span>
            </button>
          </div>
        </div>

        {/* System Role Selector */}
        <div className="flex items-center space-x-2 space-x-reverse text-xs">
          <span className="text-slate-400 font-bold">تخصص المساعد:</span>
          {[
            { id: 'mexc_trader', label: 'مستشار تداول MEXC' },
            { id: 'meditation_master', label: 'خبير التأمل والصفاء الذهني' },
            { id: 'github_engineer', label: 'مهندس أندرويد و GitHub Actions' },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id as any)}
              className={`px-3 py-1 rounded-lg border transition-all ${
                selectedRole === role.id
                  ? 'bg-slate-800 border-slate-600 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 h-[500px] flex flex-col justify-between shadow-2xl">
        <div className="overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 space-x-reverse ${
                msg.role === 'user' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] opacity-75 font-mono pb-1 border-b border-white/10">
                  <span className="font-bold">{msg.role === 'user' ? 'أنت' : 'Gemini AI'}</span>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {msg.modelUsed && <span className="text-cyan-400 font-semibold">{msg.modelUsed}</span>}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                {msg.role === 'assistant' && (
                  <div className="pt-2 flex justify-start">
                    <button
                      onClick={() => handleSpeakMessage(msg.id, msg.content)}
                      disabled={isTtsPlaying === msg.id}
                      className="inline-flex items-center space-x-1 space-x-reverse text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isTtsPlaying === msg.id ? 'animate-bounce' : ''}`} />
                      <span>{isTtsPlaying === msg.id ? 'جاري التشغيل الصوتى...' : 'استماع بالصوت (TTS)'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center space-x-2 space-x-reverse">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>جاري معالجة الإجابة بواسطة {selectedModel}...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 space-x-reverse">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اكتب سؤالك هنا لمساعد Gemini..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center space-x-2 space-x-reverse shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>إرسال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
