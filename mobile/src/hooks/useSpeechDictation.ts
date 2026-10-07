import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { AppLocale } from '@/i18n/locales';

export type SpeakStatus = 'idle' | 'listening' | 'unavailable' | 'denied' | 'error';

type UseSpeechDictationOptions = {
  locale: AppLocale;
};

function localeTag(locale: AppLocale): string {
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'rw') return 'rw-RW';
  return 'en-US';
}

type SpeechModule = typeof import('expo-speech-recognition');

/**
 * Device speech-to-text via expo-speech-recognition.
 * Falls back to unavailable when the native module isn't linked (Expo Go / old binary).
 */
export function useSpeechDictation({ locale }: UseSpeechDictationOptions) {
  const [status, setStatus] = useState<SpeakStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [ready, setReady] = useState(false);
  const moduleRef = useRef<SpeechModule | null>(null);

  useEffect(() => {
    let active = true;
    const subs: Array<{ remove: () => void }> = [];

    void (async () => {
      try {
        const mod = await import('expo-speech-recognition');
        if (!active) return;
        moduleRef.current = mod;

        const available = mod.ExpoSpeechRecognitionModule.isRecognitionAvailable();
        if (!available) {
          setStatus('unavailable');
          setReady(true);
          return;
        }

        subs.push(
          mod.ExpoSpeechRecognitionModule.addListener('result', (event) => {
            const text = event.results?.[0]?.transcript?.trim() ?? '';
            if (text) setTranscript(text);
          }),
        );
        subs.push(
          mod.ExpoSpeechRecognitionModule.addListener('end', () => {
            setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
          }),
        );
        subs.push(
          mod.ExpoSpeechRecognitionModule.addListener('error', () => {
            setStatus((prev) =>
              prev === 'unavailable' || prev === 'denied' ? prev : 'error',
            );
          }),
        );

        setReady(true);
      } catch {
        if (!active) return;
        setStatus('unavailable');
        setReady(true);
      }
    })();

    return () => {
      active = false;
      for (const sub of subs) sub.remove();
      try {
        moduleRef.current?.ExpoSpeechRecognitionModule.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(async () => {
    const mod = moduleRef.current;
    if (!mod) {
      setStatus('unavailable');
      return false;
    }

    try {
      const permissions = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissions.granted) {
        setStatus('denied');
        return false;
      }

      if (!mod.ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setStatus('unavailable');
        return false;
      }

      setTranscript('');
      setStatus('listening');
      mod.ExpoSpeechRecognitionModule.start({
        lang: localeTag(locale),
        interimResults: true,
        continuous: Platform.OS === 'android',
        requiresOnDeviceRecognition: false,
      });
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  }, [locale]);

  const stop = useCallback(async () => {
    try {
      moduleRef.current?.ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }
    setStatus('idle');
  }, []);

  const abort = useCallback(async () => {
    try {
      moduleRef.current?.ExpoSpeechRecognitionModule.abort();
    } catch {
      /* ignore */
    }
    setStatus('idle');
  }, []);

  return {
    status,
    transcript,
    setTranscript,
    ready,
    canListen: status !== 'unavailable' && status !== 'denied',
    start,
    stop,
    abort,
  };
}
