import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  AppBar, Avatar, Box, Chip, Divider, IconButton, ListItemIcon,
  Menu, MenuItem, Stack, Toolbar, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

import { HEADER_HEIGHT, NAV_WIDTH } from './layout-config';
import { useAuth } from '../../contexts/use-auth';
import { useSettings } from '../../contexts/settings-context';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'xh', flag: '🇿🇦', label: 'isiXhosa' },
  { code: 'zu', flag: '🇿🇦', label: 'isiZulu' },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { updateSettings } = useSettings();
  const [anchor, setAnchor] = useState(null);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('nko-lang', code);
    updateSettings({ language: code });
    setAnchor(null);
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ cursor: 'pointer', borderRadius: 1, px: 1, py: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Box component="span" sx={{ fontSize: '1.25rem', lineHeight: '30px', display: 'flex', alignItems: 'center' }}>
          {current.flag}
        </Box>
        <Typography variant="body2" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: '30px' }}>
          {current.code.toUpperCase()}
        </Typography>
      </Stack>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160 } } }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === i18n.language}
            onClick={() => handleSelect(lang.code)}
            sx={{ gap: 1.5 }}
          >
            <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{lang.flag}</Typography>
            <Typography variant="body2">{lang.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

const AVATAR_BG = '#C24A08';

function getInitials(displayName, email) {
  const source = displayName || email || '';
  return source
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function UserPopover() {
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  const [anchor, setAnchor] = useState(null);

  const displayName = user?.displayName || user?.email || '—';
  const initials = getInitials(user?.displayName, user?.email);

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ cursor: 'pointer', borderRadius: 1, px: 1, py: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Avatar sx={{ width: 30, height: 30, bgcolor: AVATAR_BG, fontSize: 12, fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: '30px', minWidth: 0 }}
        >
          {displayName}
        </Typography>
      </Stack>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" alignItems="center" mb={0.25}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
              {displayName}
            </Typography>
            <Chip
              label={isAdmin ? 'Admin' : 'User'}
              size="small"
              color={isAdmin ? 'warning' : 'default'}
              sx={{ height: 20, fontSize: 10, fontWeight: 700, ml: 1, flexShrink: 0 }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {user?.email}
          </Typography>
          {settings.companyName && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25, fontWeight: 600 }}>
              {settings.companyName}
            </Typography>
          )}
        </Box>

        <Divider />

        <MenuItem
          onClick={() => { setAnchor(null); logout(); }}
          sx={{ color: 'error.main', mt: 0.5 }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

export default function Header({ onOpenNav }) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: HEADER_HEIGHT,
        width: { lg: `calc(100% - ${NAV_WIDTH}px)` },
        ml: { lg: `${NAV_WIDTH}px` },
        bgcolor: '#FDF9F5',
        borderBottom: '1px solid',
        borderColor: 'rgba(194,74,8,0.15)',
        color: 'text.primary',
        boxShadow: '0 1px 6px rgba(28,8,6,0.07)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(to right, #C24A08, #F4A946)',
        },
      }}
    >
      <Toolbar sx={{ height: 1, px: { xs: 2, sm: 3 }, gap: 2 }}>
        <IconButton onClick={onOpenNav} sx={{ display: { lg: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <LanguageSwitcher />
        <UserPopover />
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = { onOpenNav: PropTypes.func };
