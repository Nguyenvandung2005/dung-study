import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState(null);
  const [themes, setThemes] = useState([]);

  useEffect(() => {
    api.get('/admin/animation-themes')
      .then(({ data }) => {
        setThemes(data);
        const active = data.find(t => t.isActive);
        if (active) {
          setActiveTheme(active);
          document.documentElement.setAttribute('data-theme', active.config.colorTheme || 'ruby-red');
        } else {
          document.documentElement.setAttribute('data-theme', 'ruby-red');
        }
      })
      .catch(() => {
        // Use default theme if API not available
        setActiveTheme({ name: 'ruby-particles', config: { type: 'particles', colorTheme: 'ruby-red' } });
        document.documentElement.setAttribute('data-theme', 'ruby-red');
      });
  }, []);

  const changeTheme = async (themeId) => {
    try {
      const res = await api.put('/admin/animation-themes/active', { themeId });
      const updatedThemes = themes.map(t => ({ ...t, isActive: t.id === themeId }));
      setThemes(updatedThemes);
      const active = updatedThemes.find(t => t.isActive);
      if (active) {
        setActiveTheme(active);
        document.documentElement.setAttribute('data-theme', active.config.colorTheme || 'ruby-red');
      }
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme, themes, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
