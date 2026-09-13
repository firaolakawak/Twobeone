import { useEffect, useSyncExternalStore } from 'react';
import type { Language } from './i18n';

export const LANGUAGE_STORAGE_KEY = 'twobeone_language';
export const LANGUAGE_CHANGE_EVENT = 'twobeone:language-change';
let memoryLanguage: Language = 'en';
let lastStoredValue: string | null | undefined;
const listeners = new Set<() => void>();

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'am' || value === 'om';
}

export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved !== lastStoredValue) {
      lastStoredValue = saved;
      memoryLanguage = isLanguage(saved) ? saved : 'en';
    }
  } catch {
    // The in-memory preference still works when browser storage is unavailable.
  }
  return memoryLanguage;
}

function rememberLanguage(language: Language) {
  memoryLanguage = language;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    lastStoredValue = language;
  } catch {
    // Private or restricted browsing must not prevent language switching.
  }
}

export function setCurrentLanguage(language: Language) {
  if (!isLanguage(language) || typeof window === 'undefined') return;
  rememberLanguage(language);
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: language }));
}

function onLanguageChange(event: Event) {
  const language = (event as CustomEvent<unknown>).detail;
  if (!isLanguage(language)) return;
  // Legacy entry points also dispatch this event; persist once for all consumers.
  if (getCurrentLanguage() !== language) rememberLanguage(language);
  listeners.forEach(listener => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) listeners.forEach(listener => listener());
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) {
    window.addEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
    window.addEventListener('storage', onStorage);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function useCurrentLanguage(): Language {
  const language = useSyncExternalStore(subscribe, getCurrentLanguage, () => 'en' as Language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.body.dataset.language = language;
  }, [language]);
  return language;
}
