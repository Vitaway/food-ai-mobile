import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import * as Localization from 'expo-localization';

import { getCatalog } from '@/i18n/catalog';
import { APP_LOCALES, normalizeLocale, type AppLocale } from '@/i18n/locales';
import type { TranslationTree } from '@/i18n/en';
import { tf } from '@/i18n/en';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export { tf };

const LOCALE_KEY = '@mirafood/locale';

type LocaleContextValue = {
  locale: AppLocale;
  detectedLocale: AppLocale;
  t: TranslationTree;
  locales: typeof APP_LOCALES;
  setLocale: (next: AppLocale) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function deviceLocale(): AppLocale {
  const locales = Localization.getLocales();
  const primary = locales[0];
  const tag = primary?.languageTag ?? primary?.languageCode ?? '';
  return normalizeLocale(tag);
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const detectedLocale = useMemo(() => deviceLocale(), []);
  const [locale, setLocaleState] = useState<AppLocale>(detectedLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getStorageItem<string | null>(LOCALE_KEY, null).then((stored) => {
      if (!active) return;
      if (stored) setLocaleState(normalizeLocale(stored));
      else setLocaleState(detectedLocale);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [detectedLocale]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    void setStorageItem(LOCALE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      detectedLocale,
      t: getCatalog(locale),
      locales: APP_LOCALES,
      setLocale,
      ready,
    }),
    [detectedLocale, locale, setLocale, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useI18n must be used within LocaleProvider');
  return context;
}
