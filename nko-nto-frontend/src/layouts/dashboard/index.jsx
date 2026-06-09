import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import Header from './header';
import Nav from './nav';
import { HEADER_HEIGHT, NAV_WIDTH } from './layout-config';

export default function DashboardLayout() {
  const [openNav, setOpenNav] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onOpenNav={() => setOpenNav(true)} />
      <Nav openNav={openNav} onCloseNav={() => setOpenNav(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          width: { lg: `calc(100% - ${NAV_WIDTH}px)` },
          bgcolor: 'background.default',
          pt: `${HEADER_HEIGHT + 32}px`,
          pb: 6,
          px: { xs: 2, sm: 4 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
