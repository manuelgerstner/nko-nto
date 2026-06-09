import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import palette from './palette';
import typography from './typography';
import overrides from './overrides';

export default function ThemeProvider({ children }) {
  const themeOptions = useMemo(() => ({
    palette,
    typography,
    shape: { borderRadius: 10 },
  }), []);

  const theme = createTheme(themeOptions);
  theme.components = overrides(theme);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

ThemeProvider.propTypes = { children: PropTypes.node };
