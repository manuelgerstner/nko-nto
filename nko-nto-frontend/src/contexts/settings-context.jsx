import { createContext, useContext, useEffect, useState } from 'react';
import { getAppSettings, updateAppSettings } from '../utils/api';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  primaryCurrency: 'EUR',
  secondaryCurrencyEnabled: false,
  secondaryCurrency: null,
  taxYearStart: '01-01',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

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
