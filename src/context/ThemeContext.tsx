"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export const PALETTES = {
  tropical: {
    cream: "#F7F1E3", "cream-soft": "#FBF7EC", ink: "#0E1B2C", "ink-soft": "#2A3A50",
    muted: "#6E7686", line: "#E6DDC6", "line-soft": "#EFE7D3", paper: "#FFFFFF",
    turq: "#00B5B0", "turq-deep": "#008A87", coral: "#FF6A4D", "coral-deep": "#E94F30",
    sun: "#FFC42F", moss: "#2D6B3A", sky: "#4FB7E8",
  },
  sunset: {
    cream: "#FFF3EB", "cream-soft": "#FFF9F2", ink: "#2C0E1B", "ink-soft": "#502A3A",
    muted: "#866E75", line: "#F0DDD2", "line-soft": "#F8EAE0", paper: "#FFFFFF",
    turq: "#E94F71", "turq-deep": "#C03555", coral: "#FF8A3D", "coral-deep": "#E97020",
    sun: "#FFC42F", moss: "#A03050", sky: "#FF6B9D",
  },
  ocean: {
    cream: "#EDF4F7", "cream-soft": "#F5F9FB", ink: "#0A1828", "ink-soft": "#22384F",
    muted: "#6B7B8C", line: "#D2DEE6", "line-soft": "#E3EBF1", paper: "#FFFFFF",
    turq: "#0090C8", "turq-deep": "#006B96", coral: "#FF6A4D", "coral-deep": "#E94F30",
    sun: "#FFD03F", moss: "#0E6B6E", sky: "#3FB0E0",
  },
  jungle: {
    cream: "#F2F4E8", "cream-soft": "#F8FAEE", ink: "#0E2C1B", "ink-soft": "#2A503A",
    muted: "#6E866E", line: "#D7DEC8", "line-soft": "#E5EBD8", paper: "#FFFFFF",
    turq: "#2F8F70", "turq-deep": "#1F6B52", coral: "#E0593F", "coral-deep": "#B83A24",
    sun: "#E8B72F", moss: "#1F6B3A", sky: "#5BB298",
  },
};

export const FONTS = {
  "Bricolage Grotesque": `"Bricolage Grotesque", system-ui, sans-serif`,
  "Instrument Serif": `"Instrument Serif", Georgia, serif`,
  "Space Grotesk": `"Space Grotesk", system-ui, sans-serif`,
  "DM Serif Display": `"DM Serif Display", Georgia, serif`,
};

export interface TweakValues {
  palette: keyof typeof PALETTES;
  displayFont: keyof typeof FONTS;
  density: 'cozy' | 'compact';
  shareEmphasis: 'loud' | 'quiet';
}

interface ThemeContextType {
  tweaks: TweakValues;
  setTweak: (key: keyof TweakValues, value: any) => void;
  resetTweaks: () => void;
}

const DEFAULT_TWEAKS: TweakValues = {
  palette: 'tropical',
  displayFont: 'Bricolage Grotesque',
  density: 'cozy',
  shareEmphasis: 'loud',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tweaks, setTweaks] = useState<TweakValues>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bora_tweaks');
        return saved ? JSON.parse(saved) : DEFAULT_TWEAKS;
      } catch (e) {
        return DEFAULT_TWEAKS;
      }
    }
    return DEFAULT_TWEAKS;
  });

  const setTweak = (key: keyof TweakValues, value: any) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bora_tweaks', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const resetTweaks = () => {
    setTweaks(DEFAULT_TWEAKS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bora_tweaks', JSON.stringify(DEFAULT_TWEAKS));
      } catch (e) {}
    }
  };

  // Sync with document element variables
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Apply Palette
    const p = PALETTES[tweaks.palette] || PALETTES.tropical;
    Object.entries(p).forEach(([key, val]) => {
      document.documentElement.style.setProperty(`--${key}`, val);
    });

    // Apply Display Font
    const fontVal = FONTS[tweaks.displayFont] || FONTS["Bricolage Grotesque"];
    document.documentElement.style.setProperty("--font-display", fontVal);

    // Apply Density
    const densityVal = tweaks.density === "compact" ? "0.85" : "1";
    document.documentElement.style.setProperty("--density", densityVal);
  }, [tweaks]);

  // Load dynamically secondary fonts from Google Fonts on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600;700&family=DM+Serif+Display&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <ThemeContext.Provider value={{ tweaks, setTweak, resetTweaks }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
