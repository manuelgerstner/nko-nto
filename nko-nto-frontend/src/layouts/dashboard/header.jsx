import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  AppBar, Avatar, Box, Chip, Divider, IconButton, ListItemIcon,
  Menu, MenuItem, Stack, Toolbar, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

import { HEADER_HEIGHT, NAV_WIDTH } from './layout-config';
import { useAuth } from '../../contexts/use-auth';

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
        <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{displayName}</Typography>
        </Box>
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.25}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
              {displayName}
            </Typography>
            <Chip
              label={isAdmin ? 'Admin' : 'User'}
              size="small"
              color={isAdmin ? 'warning' : 'default'}
              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email}
          </Typography>
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
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ height: 1, px: { xs: 2, sm: 3 }, gap: 2 }}>
        <IconButton onClick={onOpenNav} sx={{ display: { lg: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <UserPopover />
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = { onOpenNav: PropTypes.func };
