import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  groqApiKey: '',
  suggestionPrompt: "You are an elite live-meeting assistant...",
  chatPrompt: "You are an expert assistant analyzing an ongoing transcript...",
  contextWindowSize: 5,
  modelSelection: 'llama-3.3-70b-versatile',
  triggerThresholdWords: 15,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('twinmind_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Auto-migrate deprecated models
        if (parsed.modelSelection === 'llama3-70b-8192') {
          parsed.modelSelection = 'llama-3.3-70b-versatile';
        }
        return { ...defaultSettings, ...parsed };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('twinmind_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
