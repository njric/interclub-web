import { useState, useEffect } from 'react';
import frTranslations from '../translations/fr.json';

type TranslationKey = string;

interface UseTranslationReturn {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

export const useTranslation = (): UseTranslationReturn => {
  const [translations, setTranslations] = useState<any>(frTranslations);
  const [isLoading, setIsLoading] = useState(false);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }

    // Replace parameters in the translation
    if (params) {
      return value.replace(/{(\w+)}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return { t, isLoading };
};
