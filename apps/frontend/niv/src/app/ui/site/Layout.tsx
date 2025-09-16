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
                <Typography
                  variant="subtitle1"
                  sx={{ color: 'primary.contrastText' }}
                >
                  NIV Tracking
                </Typography>
              </Box>
            </MuiToolbar>

            <Divider />

            {/* Navigation Menu */}
            <List>
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                    <ChecklistIcon />
                  </ListItemIcon>
                  <ListItemText primary="Onboarding" />
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              p: 3,
              minHeight: '100vh',
            }}
          >
            {/* Toolbar spacer */}
            <MuiToolbar />

            {/* Page Content */}
            {children}
          </Box>
        </Box>
      </ToolbarProvider>
    </ThemeProvider>
  );
}

export default Layout;
