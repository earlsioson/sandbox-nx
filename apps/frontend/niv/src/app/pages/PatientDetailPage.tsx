import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToolbarEffect } from '../hooks/useToolbar';

// Mock hook - replace with your actual data fetching
const usePatient = (patientId: string) => {
  return {
    id: patientId,
    name: 'John Doe',
    status: 'WATCHLIST' as const,
    // ... other patient data
  };
};

function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { setToolbar, clearToolbar } = useToolbarEffect();

  // Fetch patient data
  const patient = usePatient(patientId!);

  // Set toolbar configuration for this page
  useEffect(() => {
    setToolbar({
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'NIV Onboarding', href: '/onboarding' },
        { label: 'Patients', href: '/patients' },
        { label: patient.name },
      ],
      actions: [
        {
          id: 'edit-patient',
          label: 'Edit Patient',
          icon: EditIcon,
          variant: 'outlined',
          onClick: () => navigate(`/patients/${patientId}/edit`),
        },
        {
          id: 'view-history',
          label: 'View History',
          icon: HistoryIcon,
          variant: 'text',
          onClick: () => navigate(`/patients/${patientId}/history`),
        },
        {
          id: 'start-onboarding',
          label: 'Start Onboarding',
          variant: 'contained',
          color: 'primary',
          onClick: () => navigate(`/patients/${patientId}/onboarding`),
        },
      ],
    });

    // Cleanup when component unmounts
    return () => clearToolbar();
  }, [patient.name, patientId, navigate, setToolbar, clearToolbar]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patient Details
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6">{patient.name}</Typography>
          <Typography color="text.secondary">
            Status: {patient.status}
          </Typography>
          <Typography color="text.secondary">
            Patient ID: {patient.id}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default PatientDetailPage;
