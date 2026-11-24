'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type RecognitionAlternative = { transcript: string };
type RecognitionResult = {
  isFinal: boolean;
  [index: number]: RecognitionAlternative;
};
type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};
type RecognitionErrorEvent = { error: string; message?: string };

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

export interface UseSpeechToTextOptions {
  /** BCP 47 language tag. Defaults to the browser's language. */
  lang?: string;
  /** Keep listening until stop() is called. Defaults to true. */
  continuous?: boolean;
  /** Include interim results. Defaults to true. */
  interimResults?: boolean;
  onTranscript?: (transcript: string) => void;
}

export interface UseSpeechToTextReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  error: string | null;
}

/**
 * Browser-native speech recognition. Availability varies by browser/version:
 * Chromium generally supports it, Safari support varies, and Firefox support
 * is not consistently available. Use HTTPS (or localhost) and grant mic access.
 */
export function useSpeechToText(
  options: UseSpeechToTextOptions = {},
): UseSpeechToTextReturn {
  const {
    lang,
    continuous = true,
    interimResults = true,
    onTranscript,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const speechWindow = window as SpeechWindow;
    setIsSupported(
      typeof speechWindow.SpeechRecognition === 'function' ||
        typeof speechWindow.webkitSpeechRecognition === 'function',
    );

    return () => {
      mountedRef.current = false;
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onstart = null;
        try {
          recognition.abort();
        } catch {
          // It may already have stopped.
        }
      }
    };
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setIsListening(false);
      return;
    }
    try {
      recognition.stop();
    } catch {
      setIsListening(false);
    }
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') {
      setError('Speech recognition is not available in this environment.');
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setIsSupported(false);
      setError(
        'Speech recognition is not supported by this browser. Try a supported version of Chrome or Safari.',
      );
      return;
    }

    if (recognitionRef.current && isListening) return;

    setError(null);
    setTranscript('');

    let recognition: RecognitionLike;
    try {
      recognition = new Recognition();
    } catch {
      setError('Could not initialize speech recognition in this browser.');
      return;
    }

    let receivedTranscript = false;
    let receivedRecognitionError = false;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang =
      lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

    recognition.onstart = () => {
      if (mountedRef.current) setIsListening(true);
    };

    recognition.onresult = (event) => {
      let combined = '';
      for (let index = 0; index < event.results.length; index += 1) {
        combined += event.results[index]?.[0]?.transcript ?? '';
      }
      const nextTranscript = combined.trim();
      if (nextTranscript) receivedTranscript = true;
      if (mountedRef.current) {
        setTranscript(nextTranscript);
        onTranscript?.(nextTranscript);
      }
    };

    recognition.onerror = (event) => {
      receivedRecognitionError = true;
      if (!mountedRef.current) return;
      const messages: Record<string, string> = {
        'not-allowed':
          'Microphone permission was denied. Allow microphone access in your browser settings and try again.',
        'service-not-allowed':
          'The browser is not allowed to use its speech recognition service.',
        'audio-capture':
          'No microphone was found. Connect or enable a microphone and try again.',
        'no-speech': 'No speech was detected. Please try speaking again.',
        network:
          'The speech recognition service could not be reached. Check your connection and try again.',
        'language-not-supported':
          'Speech recognition is not available for the selected language.',
        aborted: 'Speech recognition was stopped.',
      };
      setError(
        messages[event.error] ??
          event.message ??
          'Speech recognition encountered an unexpected error.',
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      if (mountedRef.current) {
        setIsListening(false);
        if (!receivedTranscript && !receivedRecognitionError) {
          setError(
            'Chrome stopped listening without returning text. Check microphone access, your spoken language, and your internet connection, then try again.',
          );
        }
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (startError) {
      recognitionRef.current = null;
      setIsListening(false);
      setError(
        startError instanceof Error
          ? startError.message
          : 'Could not start speech recognition. Please try again.',
      );
    }
  }, [continuous, interimResults, isListening, lang, onTranscript]);

  return { isSupported, isListening, transcript, start, stop, error };
}

export default useSpeechToText;
