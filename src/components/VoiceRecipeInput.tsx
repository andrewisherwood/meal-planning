"use client";

import { useState, useRef, useEffect } from "react";

type VoiceRecipeInputProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

// Speech Recognition types (not fully available in all TypeScript libs)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function VoiceRecipeInput({ onTranscript, disabled }: VoiceRecipeInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check for browser support
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript + " ");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleDone = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (transcript.trim()) {
      onTranscript(transcript.trim());
    }
  };

  const handleClear = () => {
    setTranscript("");
    setError(null);
  };

  if (!supported) {
    return (
      <div className="p-4 rounded-xl border border-border bg-surface-muted text-center">
        <p className="text-sm text-text-secondary">
          Voice input is not supported in your browser.
        </p>
        <p className="text-xs text-text-muted mt-1">
          Try using Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Microphone button */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          className={`p-6 rounded-full transition-all cursor-pointer ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-surface-muted text-text-secondary hover:bg-surface hover:text-text-primary border border-border"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      </div>

      {/* Status text */}
      <p className="text-sm text-center text-text-secondary">
        {isListening ? "Listening... Tap to stop" : "Tap to start speaking"}
      </p>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Transcript preview - editable */}
      {transcript && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Transcript <span className="text-text-muted font-normal">(edit if needed)</span>:
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full p-4 rounded-xl border border-border bg-surface min-h-[100px] max-h-[200px] text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Edit transcript here..."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={!transcript.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-text-primary text-surface hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              Use this text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
