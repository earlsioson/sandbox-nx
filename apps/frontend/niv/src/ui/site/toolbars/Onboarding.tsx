'use client';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

export default function Onboarding() {
  return (
    <Toolbar>
      <Typography variant="h6" noWrap component="div">
        Onboarding
      </Typography>
      <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
        <Button variant="text" color="secondary" startIcon={<UploadFileIcon />}>
          Import Patients
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<PersonAddIcon />}
        >
          Onboard Patient
        </Button>
      </Box>
    </Toolbar>
  );
}
