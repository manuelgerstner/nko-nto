import { createContext, useContext, useEffect, useState } from 'react';
import { getAppSettings, updateAppSettings } from '../utils/api';
import { useAuth } from './use-auth';
import i18n from '../i18n';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  primaryCurrency: 'EUR',
  secondaryCurrencyEnabled: false,
  secondaryCurrency: null,
  taxYearStart: '01-01',
  language: 'en',
  companyName: null,
};

function applyLanguage(lang) {
  if (lang && lang !== i18n.language) {
    i18n.changeLanguage(lang);
    localStorage.setItem('nko-lang', lang);
  }
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    setLoading(true);
    getAppSettings()
      .then((res) => {
        setSettings(res.data);
        applyLanguage(res.data.language);
      })
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, [user]);

  const updateSettings = async (patch) => {
    const merged = { ...settings, ...patch };
    setSettings(merged);
    try {
      const res = await updateAppSettings(merged);
      setSettings(res.data);
    } catch {
      // revert optimistic update on error
      setSettings(settings);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
