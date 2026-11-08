import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import VoiceOrb from '../components/voice/VoiceOrb';
import checkinService from '../services/checkinService';

const stateLabels = {
  idle: 'Ready to talk',
  listening: 'Listening to you...',
  transcribing: 'Transcribing your message...',
  thinking: 'Understanding conversation...',
  speaking: 'Saanidhya is speaking...',
  completed: 'Check-in completed',
  error: 'Voice integration unavailable',
};

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const VoiceCheckin = () => {
  const navigate = useNavigate();
  const [voiceState, setVoiceState] = useState('idle');
  const [speechMuted, setSpeechMuted] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    checkinService.startSession()
      .then((session) => {
        if (active) setSessionId(session.session_id);
      })
      .catch((error) => {
        if (active) {
          setVoiceState('error');
          setErrorMessage(error.response?.data?.detail || error.message);
        }
      });
    return () => {
      active = false;
      if (mediaRecorder.current?.state === 'recording') mediaRecorder.current.stop();
    };
  }, []);

  const handleResponse = useCallback(async (transcript) => {
    if (!transcript.trim() || !sessionId) return;
    setMessages((current) => [...current, { speaker: 'user', text: transcript, time: now() }]);
    setInputMessage('');
    setVoiceState('thinking');
    setErrorMessage('');
    try {
      const result = await checkinService.sendMessage(sessionId, transcript, messages);
      setMessages((current) => [
        ...current,
        { speaker: 'saanidhya', text: result.response.response_text, time: now() },
      ]);
      if (!speechMuted) {
        try {
          const audio = await checkinService.synthesize(
            result.response.response_text,
            result.response.language
          );
          const binary = atob(audio.audio_base64);
          const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
          audioRef.current = new Audio(URL.createObjectURL(
            new Blob([bytes], { type: audio.media_type })
          ));
          setVoiceState('speaking');
          await audioRef.current.play();
          audioRef.current.onended = () => setVoiceState('idle');
        } catch (error) {
          setVoiceState('idle');
          setErrorMessage(error.response?.data?.detail || error.message);
        }
      } else {
        setVoiceState('idle');
      }
    } catch (error) {
      setVoiceState('error');
      setErrorMessage(error.response?.data?.detail || error.message);
    }
  }, [messages, sessionId, speechMuted]);

  const handleMicClick = async () => {
    if (voiceState === 'listening') {
      mediaRecorder.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceState('error');
      setErrorMessage('Audio recording is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size) audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType });
        if (!blob.size) {
          setVoiceState('error');
          setErrorMessage('No audio was recorded. Please try again.');
          return;
        }
        setVoiceState('transcribing');
        try {
          const result = await checkinService.transcribe(blob);
          await handleResponse(result.transcript);
        } catch (error) {
          setVoiceState('error');
          setErrorMessage(error.response?.data?.detail || error.message);
        }
      };
      mediaRecorder.current.start();
      setVoiceState('listening');
      setErrorMessage('');
    } catch (error) {
      setVoiceState('error');
      setErrorMessage(error.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Allow microphone access and try again.'
        : error.message);
    }
  };

  const finishCheckin = async () => {
    if (!sessionId) return;
    setIsSaving(true);
    try {
      await checkinService.endSession(sessionId);
      setVoiceState('completed');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setVoiceState('error');
      setErrorMessage(error.response?.data?.detail || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <button
            onClick={() => setSpeechMuted((muted) => !muted)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
          >
            {speechMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {speechMuted ? 'Voice Muted' : 'Voice Speaking'}
          </button>
        </div>

        <div className="my-4">
          <VoiceOrb state={voiceState === 'transcribing' ? 'processing' : voiceState} onOrbClick={handleMicClick} />
          <p className="text-center text-sm font-semibold text-slate-600">{stateLabels[voiceState]}</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 max-h-[360px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-center text-sm text-slate-500">Start speaking when you are ready.</p>
          )}
          {messages.map((message, index) => (
            <div key={`${message.time}-${index}`} className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${message.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                <p className="text-sm">{message.text}</p>
                <span className="block text-[10px] mt-1 opacity-70">{message.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm mt-4">
          <button
            onClick={handleMicClick}
            disabled={!sessionId || ['transcribing', 'thinking', 'speaking', 'completed'].includes(voiceState)}
            className={`p-3.5 rounded-xl text-white ${voiceState === 'listening' ? 'bg-amber-500' : 'bg-blue-600'}`}
            title="Record a message"
          >
            {voiceState === 'listening' ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleResponse(inputMessage)}
            placeholder="Type a message if you prefer..."
            disabled={!sessionId || voiceState === 'completed'}
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
          {inputMessage.trim() && (
            <button onClick={() => handleResponse(inputMessage)} className="p-3 bg-blue-600 text-white rounded-xl">
              <Send size={16} />
            </button>
          )}
          <button onClick={finishCheckin} disabled={isSaving || !sessionId} className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
            <CheckCircle2 size={16} /> {isSaving ? 'Saving...' : 'Finish'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default VoiceCheckin;
