import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import VoiceOrb from '../components/voice/VoiceOrb';
import checkinService from '../services/checkinService';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

// Scripted conversational flow designed specifically for elderly wellness
const conversationScript = [
  {
    saanidhya:
      'Good morning! It is so wonderful to hear your voice today. How did you sleep last night?',
    quickReplies: ['I slept well, thank you', 'My sleep was a bit restless', 'Woke up early today'],
  },
  {
    saanidhya:
      'I am glad you got some rest. How are your knees and joints feeling this morning?',
    quickReplies: ['My knees were hurting a little', 'Feeling comfortable today', 'A little stiff in the cold air'],
  },
  {
    saanidhya:
      'I will make a gentle note about the knee discomfort so your family knows to check on you. Did you take your morning blood pressure tablet after breakfast?',
    quickReplies: ['Yes, took it right after food', 'Not yet, taking it in 10 minutes', 'Yes, with a glass of warm water'],
  },
  {
    saanidhya:
      'Wonderful! Taking your medicine on time keeps your heart healthy. What are you planning to do this afternoon?',
    quickReplies: ['Sit in the garden and read', 'Rest and listen to music', 'Wait for my daughter’s call'],
  },
  {
    saanidhya:
      'That sounds very peaceful! You have completed your morning wellness check-in. I will share a reassuring update with your family right away. Have a lovely day! 💙',
    quickReplies: ['Thank you, Saanidhya!', 'Goodbye and take care!'],
  },
];

export const VoiceCheckin = () => {
  const navigate = useNavigate();

  // Voice Interaction State: 'idle' | 'listening' | 'processing' | 'speaking' | 'completed' | 'error'
  const [voiceState, setVoiceState] = useState('idle');
  const [speechMuted, setSpeechMuted] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Conversation turns history
  const [messages, setMessages] = useState([
    {
      speaker: 'saanidhya',
      text: conversationScript[0].saanidhya,
      time: 'Just now',
    },
  ]);

  const messagesEndRef = useRef(null);

  // Auto scroll transcript to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState]);

  // Web Speech Synthesis (TTS)
  const speakText = useCallback(
    (text, targetStep) => {
      if (speechMuted || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92; // Slightly gentler pace for elderly ear
        utterance.pitch = 1.05;

        // Select a warm English or Indian English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.includes('en-IN') ||
            v.name.includes('India') ||
            v.name.includes('Natural') ||
            v.name.includes('Google')
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setVoiceState('speaking');
        utterance.onend = () => {
          const currentStep = targetStep !== undefined ? targetStep : stepIndex;
          if (currentStep >= conversationScript.length - 1) {
            setVoiceState('completed');
          } else {
            setVoiceState('idle');
          }
        };
        utterance.onerror = () => setVoiceState('idle');

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
        setVoiceState('idle');
      }
    },
    [speechMuted, stepIndex]
  );

  // Speak initial greeting on load
  useEffect(() => {
    const timer = setTimeout(() => {
      speakText(conversationScript[0].saanidhya, 0);
    }, 400);
    return () => clearTimeout(timer);
  }, [speakText]);

  // Handle user response (from mic or quick reply)
  const handleUserResponse = (userText) => {
    if (!userText.trim()) return;

    // 1. Add user turn
    const newMessages = [
      ...messages,
      {
        speaker: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(newMessages);
    setInputMessage('');

    // 2. Transition to processing (Evon reasoning)
    setVoiceState('processing');

    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);

    setTimeout(() => {
      if (nextIndex < conversationScript.length) {
        const nextAiTurn = conversationScript[nextIndex].saanidhya;
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'saanidhya',
            text: nextAiTurn,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        speakText(nextAiTurn, nextIndex);
      } else {
        setVoiceState('completed');
      }
    }, 1200);
  };

  // Trigger microphone recording simulation or Web Speech API
  const handleMicClick = () => {
    if (voiceState === 'listening') {
      setVoiceState('idle');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setVoiceState('listening');
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          handleUserResponse(transcript);
        };
        recognition.onerror = () => {
          fallbackMicPrompt();
        };
        recognition.start();
        return;
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }

    fallbackMicPrompt();
  };

  const fallbackMicPrompt = () => {
    setVoiceState('listening');
    setTimeout(() => {
      const currentReplies = conversationScript[stepIndex]?.quickReplies || [
        'I am feeling well today.',
      ];
      const selected = currentReplies[0];
      handleUserResponse(selected);
    }, 2000);
  };

  // Complete and save check-in to backend
  const handleFinishCheckin = async () => {
    setIsSaving(true);
    try {
      const payload = {
        sessionType: 'daily_morning',
        dialogue: messages.map((m) => ({
          speaker: m.speaker,
          text: m.text,
          timestamp: m.time,
        })),
        mood: 'Peaceful',
        medicationConfirmed: true,
        medicationDetails: 'Morning BP tablet confirmed after breakfast',
        physicalComfort: 'Mild knee stiffness noted',
        summary:
          'Morning check-in successfully completed. Senior rested well, confirmed BP medication, and reported mild knee ache.',
      };

      await checkinService.saveCheckin(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.warn('Error saving checkin:', err);
      navigate('/dashboard', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextMute = !speechMuted;
                setSpeechMuted(nextMute);
                if (nextMute && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title={speechMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {speechMuted ? <VolumeX size={15} className="text-rose-500" /> : <Volume2 size={15} className="text-blue-600" />}
              <span>{speechMuted ? 'Voice Muted' : 'Voice Speaking'}</span>
            </button>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Check-in
            </span>
          </div>
        </div>

        {/* Centerpiece: Voice Orb Area */}
        <div className="my-auto py-4">
          <VoiceOrb state={voiceState} size="lg" onOrbClick={handleMicClick} />
        </div>

        {/* Conversation Stream & Transcription Area */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 max-h-[320px] overflow-y-auto mb-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Conversation Transcript</span>
            <span>Prisma STT &bull; Timbre TTS</span>
          </div>

          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-sm leading-relaxed ${
                  msg.speaker === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.speaker === 'saanidhya' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-2xs">
                    💙
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl ${
                    msg.speaker === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 text-slate-900 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1 ${
                      msg.speaker === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Interactive Controls & Input Bar */}
        <div className="space-y-3">
          {/* Quick Response Suggestions for Elderly Users (One-tap reply) */}
          {voiceState !== 'completed' &&
            conversationScript[stepIndex]?.quickReplies && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-400 font-semibold mr-1">Tap to answer:</span>
                {conversationScript[stepIndex].quickReplies.map((replyText, i) => (
                  <button
                    key={i}
                    onClick={() => handleUserResponse(replyText)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    &ldquo;{replyText}&rdquo;
                  </button>
                ))}
              </div>
            )}

          {/* Main Action Bar */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            {/* Microphone button */}
            <button
              onClick={handleMicClick}
              disabled={voiceState === 'completed'}
              className={`p-3.5 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                voiceState === 'listening'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
              }`}
              title="Click to speak"
            >
              {voiceState === 'listening' ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Text input for seniors who prefer typing or when mic is muted */}
            <input
              type="text"
              placeholder={
                voiceState === 'completed'
                  ? 'Conversation completed'
                  : 'Speak into microphone or type your response here...'
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputMessage.trim()) {
                  handleUserResponse(inputMessage);
                }
              }}
              disabled={voiceState === 'completed'}
              className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
            />

            {/* Send button */}
            {inputMessage.trim() && (
              <button
                onClick={() => handleUserResponse(inputMessage)}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send size={16} />
              </button>
            )}

            {/* Finish & Save Check-in Button */}
            <button
              onClick={handleFinishCheckin}
              disabled={isSaving}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
            >
              <CheckCircle2 size={16} />
              <span>{isSaving ? 'Saving...' : 'Finish Check-in'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoiceCheckin;
