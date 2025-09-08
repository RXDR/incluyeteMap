import React, { createContext, useContext, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isComponentDark: (componentId: string) => boolean;
  toggleComponentTheme: (componentId: string) => void;
  darkComponents: Set<string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [darkComponents] = useState<Set<string>>(new Set(['default']));

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const isComponentDark = (componentId: string) => {
    return darkComponents.has(componentId);
  };

  const toggleComponentTheme = (componentId: string) => {
    darkComponents.has(componentId) 
      ? darkComponents.delete(componentId)
      : darkComponents.add(componentId);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isComponentDark,
      toggleComponentTheme,
      darkComponents
    }}>
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
