import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToolbarConfig } from '../hooks/useToolbar';

// Mock hooks - replace with your actual data fetching
const usePatient = (patientId: string) => {
  return {
    id: patientId,
    name: 'John Doe',
    status: 'WATCHLIST' as const,
  };
};

const useOnboardingStep = (step: string | undefined) => {
  const steps = ['assessment', 'qualification', 'device-fitting', 'activation'];
  const currentIndex = step ? steps.indexOf(step) : 0;

  return {
    currentStep: step || 'assessment',
    currentIndex: Math.max(0, currentIndex),
    totalSteps: steps.length,
    isFirst: currentIndex <= 0,
    isLast: currentIndex >= steps.length - 1,
    nextStep:
      currentIndex < steps.length - 1 && currentIndex >= 0
        ? steps[currentIndex + 1]
        : null,
    prevStep: currentIndex > 0 ? steps[currentIndex - 1] : null,
  };
};

function OnboardingStepPage() {
  const { patientId, step } = useParams<{
    patientId?: string;
    step?: string;
  }>();
  const navigate = useNavigate();

  // Fetch data
  const patient = usePatient(patientId || '');
  const stepInfo = useOnboardingStep(step);

  // Define toolbar configuration using useMemo for performance
  const toolbarConfig = useMemo(() => {
    if (!patientId || !step) {
      return {
        breadcrumb: [{ label: 'Home', href: '/' }, { label: 'Onboarding' }],
        actions: [],
      };
    }

    return {
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'NIV Onboarding', href: '/onboarding' },
        { label: 'Patients', href: '/patients' },
        { label: patient.name, href: `/patients/${patientId}` },
        { label: `Step: ${step}` },
      ],
      actions: [
        ...(!stepInfo.isFirst
          ? [
              {
                id: 'previous-step',
                label: 'Previous',
                icon: ArrowBackIcon,
                variant: 'outlined' as const,
                onClick: () =>
                  navigate(
                    `/patients/${patientId}/onboarding/${stepInfo.prevStep}`
                  ),
              },
            ]
          : []),
        {
          id: 'save-progress',
          label: 'Save Progress',
          icon: SaveIcon,
          variant: 'outlined' as const,
          color: 'secondary' as const,
          onClick: () => {
            // Save logic here
            console.log('Saving progress...');
          },
        },
        ...(!stepInfo.isLast
          ? [
              {
                id: 'next-step',
                label: 'Next Step',
                icon: ArrowForwardIcon,
                variant: 'contained' as const,
                color: 'primary' as const,
                onClick: () =>
                  navigate(
                    `/patients/${patientId}/onboarding/${stepInfo.nextStep}`
                  ),
              },
            ]
          : [
              {
                id: 'complete-onboarding',
                label: 'Complete Onboarding',
                variant: 'contained' as const,
                color: 'success' as const,
                onClick: () => navigate(`/patients/${patientId}/complete`),
              },
            ]),
      ],
    };
  }, [patient.name, patientId, step, stepInfo, navigate]);

  // Use the simpler hook that handles useEffect automatically
  useToolbarConfig(toolbarConfig);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        NIV Onboarding - {patient.name}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={stepInfo.currentIndex} alternativeLabel>
          <Step>
            <StepLabel>Assessment</StepLabel>
          </Step>
          <Step>
            <StepLabel>Qualification</StepLabel>
          </Step>
          <Step>
            <StepLabel>Device Fitting</StepLabel>
          </Step>
          <Step>
            <StepLabel>Activation</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {step && step.length > 0
            ? `${step.charAt(0).toUpperCase()}${step.slice(1)} Step`
            : 'Onboarding Step'}
        </Typography>

        <Typography variant="body1">
          This is the {step || 'current'} step of the NIV onboarding process for{' '}
          {patient.name}. Use the toolbar actions above to navigate between
          steps or save your progress.
        </Typography>
      </Paper>
    </Box>
  );
}

export default OnboardingStepPage;
