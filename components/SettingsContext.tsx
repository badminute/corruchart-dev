"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SettingsContextType {
  colourblindMode: boolean;
  setColourblindMode: (mode: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [colourblindMode, setColourblindModeState] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("colourblindMode");
      if (saved === "true") {
        setColourblindModeState(true);
      }
    }
  }, []);

  // Apply to document and save
  const setColourblindMode = (mode: boolean) => {
    setColourblindModeState(mode);
    if (typeof document !== "undefined") {
      if (mode) {
        document.documentElement.setAttribute("data-colourblind-mode", "true");
      } else {
        document.documentElement.removeAttribute("data-colourblind-mode");
      }
    }
    localStorage.setItem("colourblindMode", mode ? "true" : "false");
  };

  return (
    <SettingsContext.Provider value={{ colourblindMode, setColourblindMode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}