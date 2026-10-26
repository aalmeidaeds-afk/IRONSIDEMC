import React, { createContext, useContext, useState, useEffect } from 'react';

export type RoadTheme = 'padrao' | 'noturno_tatico' | 'solar_alto_contraste';

interface RoadThemeContextType {
  theme: RoadTheme;
  setTheme: (theme: RoadTheme) => void;
  cycleTheme: () => void;
  themeLabel: string;
}

const RoadThemeContext = createContext<RoadThemeContextType | undefined>(undefined);

export const RoadThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<RoadTheme>('padrao');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ironside_road_theme') as RoadTheme;
      if (saved && ['padrao', 'noturno_tatico', 'solar_alto_contraste'].includes(saved)) {
        setThemeState(saved);
        applyThemeClass(saved);
      }
    } catch {}
  }, []);

  const applyThemeClass = (targetTheme: RoadTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('theme-noturno-tatico', 'theme-solar-alto-contraste');

    if (targetTheme === 'noturno_tatico') {
      root.classList.add('theme-noturno-tatico');
    } else if (targetTheme === 'solar_alto_contraste') {
      root.classList.add('theme-solar-alto-contraste');
    }
  };

  const setTheme = (newTheme: RoadTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('ironside_road_theme', newTheme);
    } catch {}
    applyThemeClass(newTheme);
  };

  const cycleTheme = () => {
    const next: Record<RoadTheme, RoadTheme> = {
      padrao: 'noturno_tatico',
      noturno_tatico: 'solar_alto_contraste',
      solar_alto_contraste: 'padrao',
    };
    setTheme(next[theme]);
  };

  const themeLabel =
    theme === 'noturno_tatico'
      ? 'Noturno Tático'
      : theme === 'solar_alto_contraste'
      ? 'Solar Alto Contraste'
      : 'Modo Estrada';

  return (
    <RoadThemeContext.Provider value={{ theme, setTheme, cycleTheme, themeLabel }}>
      {children}
    </RoadThemeContext.Provider>
  );
};

export const useRoadTheme = () => {
  const context = useContext(RoadThemeContext);
  if (!context) {
    return {
      theme: 'padrao' as RoadTheme,
      setTheme: () => {},
      cycleTheme: () => {},
      themeLabel: 'Modo Estrada',
    };
  }
  return context;
};
