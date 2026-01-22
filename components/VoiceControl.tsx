
import React, { useState, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface VoiceControlProps {
  onShapeUpdate: (params: any) => void;
}

// Helper functions for audio encoding as per Gemini API guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ onShapeUpdate }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setError(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices API not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                // Clipping protection and conversion to PCM16
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              const pcmData = new Uint8Array(int16.buffer);
              const base64Data = encode(pcmData);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.outputTranscription) {
               setTranscription(prev => prev + message.serverContent?.outputTranscription?.text);
             }
             if (message.serverContent?.inputTranscription) {
               // Optional: handle user input transcription if needed
             }
          },
          onerror: (e) => {
            console.error('Gemini Live Error:', e);
            setError('Connection error. Please try again.');
            stopSession();
          },
          onclose: () => {
            setIsListening(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are a CAD assistant. Listen to shape descriptions and help the user refine their 3D models.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });
      
      sessionRef.current = await sessionPromise;
      setIsListening(true);
    } catch (err: any) {
      console.error('Failed to start voice session:', err);
      let userFriendlyError = 'Could not access microphone.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyError = 'No microphone found on this device.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyError = 'Microphone permission denied.';
      }
      setError(userFriendlyError);
      setIsListening(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400">VOICE COMMANDS</h3>
        <button
          onClick={isListening ? stopSession : startSession}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {isListening ? (
            <><MicOff className="w-4 h-4" /> Stop</>
          ) : (
            <><Mic className="w-4 h-4" /> Start</>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-[10px] text-red-400">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="h-20 bg-slate-950 rounded-lg p-3 overflow-y-auto text-xs text-slate-400 border border-slate-800">
        {transcription || (isListening ? "Listening for your shape description..." : "Click start and describe: 'A box 50x50x50 mm'")}
      </div>
      
      {isListening && (
        <div className="mt-3 flex justify-center gap-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  );
};
