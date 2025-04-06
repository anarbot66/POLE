import React, { createContext, useState, useEffect } from "react";
import themes from "./themes"; // твой объект с цветами для каждой команды

export const ThemeContext = createContext();

export const ThemeProvider = ({ children, initialTheme = "default" }) => {
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [theme, setTheme] = useState(themes[initialTheme]);

  useEffect(() => {
    setTheme(themes[selectedTheme] || themes["default"]);
  }, [selectedTheme]);

  return (
    <ThemeContext.Provider value={{ selectedTheme, setSelectedTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
