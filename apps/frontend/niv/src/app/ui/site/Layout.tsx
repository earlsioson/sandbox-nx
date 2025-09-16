import ChecklistIcon from '@mui/icons-material/Checklist';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar as MuiToolbar,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import logo from '../../../assets/logo-centara.svg';
import { ToolbarProvider } from '../../contexts/ToolbarContext';
import Toolbar from './Toolbar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#344037',
    },
    secondary: {
      main: '#004ECC',
    },
    success: {
      main: '#008A22',
    },
  },
});

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <ToolbarProvider>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />

          {/* App Bar with Dynamic Toolbar */}
          <AppBar
            color="transparent"
            position="fixed"
            sx={{
              width: `calc(100% - ${drawerWidth}px)`,
              ml: `${drawerWidth}px`,
            }}
          >
            <Toolbar />
          </AppBar>

          {/* Side Navigation Drawer */}
          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
            }}
            variant="permanent"
            anchor="left"
          >
            {/* Logo and Title */}
            <MuiToolbar>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  py: 2,
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="Centara"
                  sx={{ height: 32 }}
                />
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>
                  NIV Onboarding
                </Typography>
              </Box>
            </MuiToolbar>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            {/* Navigation Menu */}
            <List sx={{ flexGrow: 1, px: 1 }}>
              <ListItem disablePadding>
                <ListItemButton
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <ChecklistIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Patient Onboarding"
                    slotProps={{
                      primary: { fontSize: 14 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              minHeight: '100vh',
              pt: '64px', // Account for fixed toolbar
            }}
          >
            {children}
          </Box>
        </Box>
      </ToolbarProvider>
    </ThemeProvider>
  );
}

export default Layout;
