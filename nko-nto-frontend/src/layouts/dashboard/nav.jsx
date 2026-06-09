import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Collapse, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Stack,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import navConfig from './config-navigation';
import { NAV_WIDTH } from './layout-config';
import { useAuth } from '../../contexts/use-auth';

// Sidebar colour tokens — dark mahogany surface matching logo palette
const NAV_BG        = '#1C0806';
const NAV_TEXT      = 'rgba(255,255,255,0.62)';
const NAV_ACTIVE_BG = 'rgba(194,74,8,0.20)';
const NAV_ACTIVE_FG = '#F4A946';
const NAV_HOVER_BG  = 'rgba(255,255,255,0.05)';

const PAPER_SX = {
  width: NAV_WIDTH,
  boxSizing: 'border-box',
  overflowX: 'hidden',
  bgcolor: NAV_BG,
  borderRight: 'none',
  backgroundImage: 'none',
};

const itemSx = (active) => ({
  borderRadius: 1.5,
  pl: 1.5,
  mb: 0.5,
  minWidth: 0,
  color: active ? NAV_ACTIVE_FG : NAV_TEXT,
  bgcolor: active ? NAV_ACTIVE_BG : 'transparent',
  '&:hover': { bgcolor: active ? NAV_ACTIVE_BG : NAV_HOVER_BG },
  transition: 'background-color 0.15s',
});

export default function Nav({ openNav, onCloseNav }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (openNav) onCloseNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const content = (
    <Box sx={{ height: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Branding */}
      <Stack alignItems="flex-start" sx={{ px: 2, pt: 2.5, pb: 2, flexShrink: 0 }}>
        <Box
          sx={{
            bgcolor: '#FAF5EE',
            borderRadius: 2,
            px: 1,
            py: 0.5,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src="/nko-nto-logo.png"
            alt="nko-nto"
            sx={{ height: 150, display: 'block' }}
          />
        </Box>
      </Stack>

      {/* Divider */}
      <Box sx={{ mx: 2, mb: 2, height: '1px', bgcolor: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Nav items */}
      <Box sx={{ flexGrow: 1, px: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
        <List disablePadding>
          {navConfig.map((item) =>
            item.children
              ? <NavGroupItem key={item.title} item={item} isAdmin={isAdmin} />
              : <NavLeafItem key={item.title} item={item} />
          )}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ flexShrink: { lg: 0 }, width: { lg: NAV_WIDTH } }}>
      {/* Mobile */}
      <Drawer
        variant="temporary"
        open={openNav}
        onClose={onCloseNav}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': PAPER_SX }}
      >
        {content}
      </Drawer>

      {/* Desktop */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: NAV_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': PAPER_SX,
        }}
      >
        {content}
      </Drawer>
    </Box>
  );
}

Nav.propTypes = { openNav: PropTypes.bool, onCloseNav: PropTypes.func };

function NavLeafItem({ item, indent = false }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={NavLink}
        to={item.path}
        end={item.path === '/'}
        sx={{ ...itemSx(active), pl: indent ? 4.5 : 1.5 }}
      >
        <ListItemIcon sx={{ minWidth: 34, flexShrink: 0, color: 'inherit', opacity: active ? 1 : 0.7 }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={t(item.title)}
          primaryTypographyProps={{ variant: 'body2', fontWeight: active ? 700 : 500, noWrap: true, color: 'inherit' }}
        />
      </ListItemButton>
    </ListItem>
  );
}

NavLeafItem.propTypes = { item: PropTypes.object, indent: PropTypes.bool };

function NavGroupItem({ item, isAdmin }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const visibleChildren = item.children.filter((c) => !c.adminOnly || isAdmin);
  const isChildActive = visibleChildren.some((c) => pathname.startsWith(c.path));
  const [open, setOpen] = useState(isChildActive);

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={() => setOpen((p) => !p)} sx={itemSx(false)}>
          <ListItemIcon sx={{ minWidth: 34, flexShrink: 0, color: 'inherit', opacity: 0.7 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={t(item.title)}
            primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true, color: 'inherit' }}
          />
          {open
            ? <ExpandLessIcon fontSize="small" sx={{ opacity: 0.6, flexShrink: 0 }} />
            : <ExpandMoreIcon fontSize="small" sx={{ opacity: 0.6, flexShrink: 0 }} />}
        </ListItemButton>
      </ListItem>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ mb: 0.5 }}>
          {visibleChildren.map((child) => (
            <NavLeafItem key={child.title} item={child} indent />
          ))}
        </List>
      </Collapse>
    </>
  );
}

NavGroupItem.propTypes = { item: PropTypes.object, isAdmin: PropTypes.bool };
