import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ChecklistIcon from '@mui/icons-material/Checklist';
import logo from '../../../assets/logo-centara.svg';
import Onboarding from './toolbars/Onboarding';

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

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                color='transparent'
                position="fixed"
                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
            >
                <Onboarding />
            </AppBar>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText'
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            py: 2
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
                </Toolbar>
                <Divider />
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
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar />
            </Box>
        </Box>
        {children}
    </ThemeProvider>;
}