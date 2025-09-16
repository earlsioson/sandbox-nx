import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToolbarEffect } from '../hooks/useToolbar';

function OnboardingLandingPage() {
  const navigate = useNavigate();
  const { setToolbar, clearToolbar } = useToolbarEffect();

  useEffect(() => {
    setToolbar({
      breadcrumb: [{ label: 'Home', href: '/' }, { label: 'NIV Onboarding' }],
      actions: [
        {
          id: 'add-patient',
          label: 'Add Patient',
          icon: AddIcon,
          variant: 'contained',
          color: 'primary',
          onClick: () => navigate('/onboarding/create'),
        },
      ],
    });

    return () => clearToolbar();
  }, [setToolbar, clearToolbar, navigate]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        NIV Patient Onboarding
      </Typography>

      <Typography variant="body1" paragraph>
        Welcome to the NIV Patient Onboarding system. Manage patient onboarding
        for non-invasive ventilation therapy across your healthcare facilities.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/onboarding/create')}
                  fullWidth
                >
                  Add New Patient
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ListIcon />}
                  onClick={() => navigate('/patients')}
                  fullWidth
                >
                  View All Patients
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 3 patients added today
                <br />
                • 5 assessments pending
                <br />• 2 patients activated this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default OnboardingLandingPage;
