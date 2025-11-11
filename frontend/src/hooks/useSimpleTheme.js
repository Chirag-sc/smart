import { useContext } from 'react';
import { SimpleThemeContext } from '../context/themeContext';

export const useSimpleTheme = () => useContext(SimpleThemeContext);
