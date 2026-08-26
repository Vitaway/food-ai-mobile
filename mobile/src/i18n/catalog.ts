import { en, type TranslationTree } from '@/i18n/en';
import { fr } from '@/i18n/fr';
import { rw } from '@/i18n/rw';
import type { AppLocale } from '@/i18n/locales';

const catalogs: Record<AppLocale, TranslationTree> = { en, rw, fr };

export function getCatalog(locale: AppLocale): TranslationTree {
  return catalogs[locale] ?? en;
}
