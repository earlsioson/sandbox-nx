import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToolbarEffect } from '../hooks/useToolbar';

function PatientsListPage() {
  const navigate = useNavigate();
  const { setToolbar, clearToolbar } = useToolbarEffect();

  // Mock patient data - replace with your actual data fetching
  const patients = [
    { id: '1', name: 'John Doe', status: 'NEW', facility: 'Facility A' },
    {
      id: '2',
      name: 'Jane Smith',
      status: 'WATCHLIST',
      facility: 'Facility B',
    },
    { id: '3', name: 'Bob Johnson', status: 'ACTIVE', facility: 'Facility A' },
  ];

  useEffect(() => {
    setToolbar({
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'NIV Onboarding', href: '/onboarding' },
        { label: 'Patients' },
      ],
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'info';
      case 'WATCHLIST':
        return 'warning';
      case 'PENDING':
        return 'secondary';
      case 'ACTIVE':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patients
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Facility</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.name}</TableCell>
                <TableCell>
                  <Chip
                    label={patient.status}
                    color={getStatusColor(patient.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{patient.facility}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default PatientsListPage;
