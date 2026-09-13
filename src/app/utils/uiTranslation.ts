import { useCallback } from 'react';
import type { Language } from './i18n';
import { getCurrentLanguage, useCurrentLanguage } from './languageStore';
import { commonMessages } from '../locales/common';

/** English source → [Amharic, Afaan Oromo]. Keep IDs and authored content out. */
export type UiMessages = Record<string, readonly [am: string, om: string]>;
export type UiParams = Record<string, string | number>;
const EMPTY_MESSAGES: UiMessages = {};

export function translateUi(language: Language, messages: UiMessages | undefined, source: string, params?: UiParams): string {
  const ownPair = (catalog: UiMessages | undefined) => catalog && Object.prototype.hasOwnProperty.call(catalog, source) ? catalog[source] : undefined;
  const pair = ownPair(messages) ?? ownPair(commonMessages);
  const translated = Array.isArray(pair) ? pair[language === 'am' ? 0 : 1] : undefined;
  const template = language === 'en' || typeof translated !== 'string' || !translated ? source : translated;
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    !params || !Object.prototype.hasOwnProperty.call(params, key) || params[key] === undefined ? placeholder : String(params[key]));
}

/** Works both inside the app provider and on public/loading entry points. */
export function useUiCopy(messages: UiMessages = EMPTY_MESSAGES) {
  const language = useCurrentLanguage();
  // A pending operation may retain an older callback. Its eventual feedback
  // should still use the language selected when that feedback is displayed.
  return useCallback((source: string, params?: UiParams) => translateUi(getCurrentLanguage(), messages, source, params), [language, messages]);
}

export const UI_LOCALES: Record<Language, string> = { en: 'en-US', am: 'am-ET', om: 'om-ET' };
