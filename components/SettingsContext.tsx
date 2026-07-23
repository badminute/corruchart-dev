"use client";

import { createContext, useContext, useState, useEffect } from "react";

type StarIconTheme = "default" | "emoji";

interface SettingsContextType {
  colourblindMode: boolean;
  setColourblindMode: (mode: boolean) => void;
  reverseColorCycle: boolean;
  setReverseColorCycle: (mode: boolean) => void;
  scrollCycling: boolean;
  setScrollCycling: (mode: boolean) => void;
  variantSwapEnabled: boolean;
  setVariantSwapEnabled: (enabled: boolean) => void;
  starTheme: StarIconTheme;
  setStarTheme: (theme: StarIconTheme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [colourblindMode, setColourblindModeState] = useState(false);
  const [reverseColorCycle, setReverseColorCycleState] = useState(false);
  const [scrollCycling, setScrollCyclingState] = useState(true);
  const [variantSwapEnabled, setVariantSwapEnabledState] = useState(false);
  const [starTheme, setStarThemeState] = useState<StarIconTheme>("emoji");

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("colourblindMode");
      if (saved === "true") {
        setColourblindModeState(true);
      }
      const savedReverse = localStorage.getItem("reverseColorCycle");
      if (savedReverse === "true") {
        setReverseColorCycleState(true);
      }
      const savedScroll = localStorage.getItem("scrollCycling");
      if (savedScroll === "false") {
        setScrollCyclingState(false);
      }
      const savedSwap = localStorage.getItem("variantSwapEnabled");
      if (savedSwap === "true") {
        setVariantSwapEnabledState(true);
      }
      const savedTheme = localStorage.getItem("starTheme");
      if (savedTheme === "emoji" || savedTheme === "default") {
        setStarThemeState(savedTheme as StarIconTheme);
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

  const setReverseColorCycle = (mode: boolean) => {
    setReverseColorCycleState(mode);
    localStorage.setItem("reverseColorCycle", mode ? "true" : "false");
  };

  const setScrollCycling = (mode: boolean) => {
    setScrollCyclingState(mode);
    localStorage.setItem("scrollCycling", mode ? "true" : "false");
  };

  const setVariantSwapEnabled = (enabled: boolean) => {
    setVariantSwapEnabledState(enabled);
    localStorage.setItem("variantSwapEnabled", enabled ? "true" : "false");
  };

  const setStarTheme = (theme: StarIconTheme) => {
    setStarThemeState(theme);
    localStorage.setItem("starTheme", theme);
  };

  return (
    <SettingsContext.Provider value={{ colourblindMode, setColourblindMode, reverseColorCycle, setReverseColorCycle, scrollCycling, setScrollCycling, variantSwapEnabled, setVariantSwapEnabled, starTheme, setStarTheme }}>
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