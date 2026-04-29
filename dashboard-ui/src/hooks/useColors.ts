import { useState, useEffect } from "react";

export interface Colors {
  P:    string;  // accent / primary
  CARD: string;  // card surface
  BDR:  string;  // border
  TXT:  string;  // primary text
  TXT2: string;  // secondary / muted text
  BG:   string;  // page background
  dark: boolean; // true when dark mode active
}

const LIGHT: Colors = {
  P:    "#7B2FF7",
  CARD: "#FFFFFF",
  BDR:  "#EBE8F4",
  TXT:  "#1A1A2E",
  TXT2: "#6B7280",
  BG:   "#F4F2FA",
};

const DARK: Colors = {
  P:    "#9D7FFF",
  CARD: "#1A1D27",
  BDR:  "#252836",
  TXT:  "#E2E6F0",
  TXT2: "#8B92A8",
  BG:   "#0F1117",
};

function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function useColors(): Colors {
  const [dark, setDark] = useState(isDarkMode);

  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDarkMode()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return dark ? { ...DARK, dark: true } : { ...LIGHT, dark: false };
}
