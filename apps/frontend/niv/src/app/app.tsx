import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useToolbar, useToolbarOverride } from './hooks/useToolbar';
import Layout from './ui/site/Layout';

// Demo: Onboarding Landing Page
function OnboardingLanding() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        NIV Patient Onboarding
      </Typography>

      <Typography variant="body1" paragraph>
        Welcome to the NIV Patient Onboarding system. Use the toolbar actions
        above to get started.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Patients
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="John Doe"
                    secondary="Status: NEW - Awaiting EHR sync"
                  />
                  <Chip label="NEW" color="info" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Jane Smith"
                    secondary="Status: WATCHLIST - Awaiting RT review"
                  />
                  <Chip label="WATCHLIST" color="warning" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Bob Johnson"
                    secondary="Status: ACTIVE - Program running"
                  />
                  <Chip label="ACTIVE" color="success" size="small" />
                </ListItem>
              </List>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/onboarding/123')}
                sx={{ mt: 2 }}
              >
                View Patient Details
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/onboarding/create')}
                >
                  Create New Patient
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/onboarding/456/history')}
                >
                  View Patient History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Demo: Create Patient Page
function CreatePatient() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Patient
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="body1" paragraph>
          This page would contain patient creation forms. Notice how the toolbar
          automatically updated to show relevant actions for this page.
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate('/onboarding/create/confirm')}
          sx={{ mr: 2 }}
        >
          Continue to Confirmation
        </Button>

        <Button variant="outlined" onClick={() => navigate('/onboarding')}>
          Back to Landing
        </Button>
      </Paper>
    </Box>
  );
}

// Demo: Confirm Admission Page
function ConfirmAdmission() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Confirm Patient Admission
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="body1" paragraph>
          Review patient information and confirm admission. The toolbar shows
          confirmation-specific actions.
        </Typography>

        <Button
          variant="contained"
          color="success"
          onClick={() => navigate('/onboarding')}
          sx={{ mr: 2 }}
        >
          Confirm & Create Patient
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate('/onboarding/create')}
        >
          Back to Edit
        </Button>
      </Paper>
    </Box>
  );
}

// Demo: Patient Details Page with dynamic toolbar override
function PatientDetails() {
  const navigate = useNavigate();
  const { updateToolbar, resetToolbar } = useToolbar();

  // Example of manual toolbar override
  const handleEnterEditMode = () => {
    updateToolbar({
      breadcrumb: [
        { label: 'Home' },
        { label: 'Onboarding', href: '/onboarding' },
        { label: 'Patient John Doe' },
        { label: 'Edit Mode' },
      ],
      actions: [
        {
          id: 'save-changes',
          label: 'Save Changes',
          variant: 'contained',
          color: 'success',
          onClick: () => {
            alert('Changes saved!');
            resetToolbar(); // Return to route-based toolbar
          },
        },
        {
          id: 'cancel-edit',
          label: 'Cancel',
          variant: 'outlined',
          color: 'error',
          onClick: () => resetToolbar(),
        },
      ],
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient Details: John Doe
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="body1" paragraph>
          This is a patient details page. The toolbar shows patient-specific
          actions based on the patient's current status (NEW, WATCHLIST,
          PENDING, ACTIVE).
        </Typography>

        <Typography variant="body2" paragraph color="text.secondary">
          Try the buttons below to see how components can manually override the
          toolbar:
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={handleEnterEditMode}>
            Enter Edit Mode (Manual Override)
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/onboarding/123/history')}
          >
            View History
          </Button>

          <Button variant="outlined" onClick={() => navigate('/onboarding')}>
            Back to Landing
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

// Demo: Patient History Page with useToolbarOverride hook
function PatientHistory() {
  const navigate = useNavigate();

  // Example of automatic toolbar override with cleanup
  useToolbarOverride({
    actions: [
      {
        id: 'export-history',
        label: 'Export History',
        variant: 'contained',
        color: 'primary',
        onClick: () => alert('Exporting history...'),
      },
      {
        id: 'back-to-patient',
        label: 'Back to Patient',
        variant: 'outlined',
        onClick: () => navigate('/onboarding/456'),
      },
    ],
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient History: Jane Smith
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="body1" paragraph>
          This page demonstrates automatic toolbar override using the
          `useToolbarOverride` hook. The toolbar actions are automatically
          applied when this component mounts and reset when it unmounts.
        </Typography>

        <List>
          <ListItem>
            <ListItemText
              primary="2024-01-15: Patient onboarded"
              secondary="Status changed to NEW"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="2024-01-16: EHR data synced"
              secondary="RT assigned: Dr. Johnson"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="2024-01-17: Moved to WATCHLIST"
              secondary="Awaiting qualification review"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}

// Main App component with routing
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<OnboardingLanding />} />
        <Route path="/onboarding/create" element={<CreatePatient />} />
        <Route
          path="/onboarding/create/confirm"
          element={<ConfirmAdmission />}
        />
        <Route path="/onboarding/:id" element={<PatientDetails />} />
        <Route path="/onboarding/:id/history" element={<PatientHistory />} />
      </Routes>
    </Layout>
  );
}

export default App;
