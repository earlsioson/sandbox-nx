import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  PatientStatus,
  RouteToolbarConfig,
  ToolbarAction,
} from '../types/toolbar';

// Status-specific actions for patient detail pages
const getPatientActions = (status: PatientStatus): ToolbarAction[] => {
  const baseActions: ToolbarAction[] = [
    {
      id: 'view-history',
      label: 'View History',
      icon: HistoryIcon,
      variant: 'text',
      color: 'primary',
      onClick: () => console.log('View History clicked'),
    },
    {
      id: 'save-progress',
      label: 'Save Progress',
      icon: SaveIcon,
      variant: 'outlined',
      color: 'primary',
      onClick: () => console.log('Save Progress clicked'),
    },
  ];

  // Add status-specific actions
  switch (status) {
    case 'NEW':
      return [
        ...baseActions,
        {
          id: 'sync-ehr',
          label: 'Sync EHR',
          variant: 'contained',
          color: 'secondary',
          onClick: () => console.log('Sync EHR clicked'),
        },
      ];

    case 'WATCHLIST':
      return [
        ...baseActions,
        {
          id: 'mark-qualified',
          label: 'Mark Qualified',
          variant: 'contained',
          color: 'success',
          onClick: () => console.log('Mark Qualified clicked'),
        },
        {
          id: 'request-labs',
          label: 'Request Labs',
          variant: 'outlined',
          color: 'secondary',
          onClick: () => console.log('Request Labs clicked'),
        },
      ];

    case 'PENDING':
      return [
        ...baseActions,
        {
          id: 'activate-program',
          label: 'Activate Program',
          variant: 'contained',
          color: 'success',
          onClick: () => console.log('Activate Program clicked'),
        },
      ];

    case 'ACTIVE':
      return [
        {
          id: 'view-history',
          label: 'View History',
          icon: HistoryIcon,
          variant: 'text',
          color: 'primary',
          onClick: () => console.log('View History clicked'),
        },
        {
          id: 'download-report',
          label: 'Download Report',
          icon: DownloadIcon,
          variant: 'outlined',
          color: 'primary',
          onClick: () => console.log('Download Report clicked'),
        },
        {
          id: 'schedule-review',
          label: 'Schedule Re-Review',
          variant: 'contained',
          color: 'primary',
          onClick: () => console.log('Schedule Re-Review clicked'),
        },
      ];

    default:
      return baseActions;
  }
};

export const routeToolbarConfig: Record<string, RouteToolbarConfig> = {
  // Landing page - search and actions
  '/onboarding': {
    breadcrumb: ['Home', 'Onboarding'],
    actions: [
      {
        id: 'import-patients',
        label: 'Import Patients',
        icon: UploadFileIcon,
        variant: 'text',
        color: 'secondary',
        onClick: () => console.log('Import Patients clicked'),
      },
      {
        id: 'onboard-patient',
        label: 'Onboard Patient',
        icon: PersonAddIcon,
        variant: 'contained',
        color: 'success',
        onClick: () => console.log('Onboard Patient clicked'),
      },
    ],
  },

  // Patient creation flow
  '/onboarding/create': {
    breadcrumb: ['Home', 'Onboarding', 'Create Patient'],
    actions: [
      {
        id: 'cancel-create',
        label: 'Cancel',
        icon: CancelIcon,
        variant: 'outlined',
        color: 'error',
        onClick: () => console.log('Cancel clicked'),
      },
    ],
  },

  // Admission confirmation
  '/onboarding/create/confirm': {
    breadcrumb: ['Home', 'Onboarding', 'Create Patient', 'Confirm'],
    actions: [
      {
        id: 'cancel-admission',
        label: 'Cancel',
        icon: CancelIcon,
        variant: 'outlined',
        color: 'error',
        onClick: () => console.log('Cancel clicked'),
      },
      {
        id: 'confirm-admission',
        label: 'Confirm Admission',
        icon: CheckIcon,
        variant: 'contained',
        color: 'success',
        onClick: () => console.log('Confirm Admission clicked'),
      },
    ],
  },

  // Patient onboarding detail (dynamic based on status)
  '/onboarding/:id': {
    breadcrumb: ['Home', 'Onboarding', 'Patient Details'], // Will be enhanced with real patient name
    actions: [], // Will be populated by getActions function
    getActions: (_params) => {
      // In real app, you'd fetch patient status from API or context
      // For now, default to NEW status
      const status: PatientStatus = 'NEW';
      return getPatientActions(status);
    },
  },

  // History view
  '/onboarding/:id/history': {
    breadcrumb: ['Home', 'Onboarding', 'Patient Details', 'History'],
    actions: [
      {
        id: 'back-to-patient',
        label: 'Back to Patient',
        icon: ArrowBackIcon,
        variant: 'outlined',
        color: 'primary',
        onClick: () => console.log('Back to Patient clicked'),
      },
      {
        id: 'download-audit',
        label: 'Download Audit',
        icon: DownloadIcon,
        variant: 'contained',
        color: 'primary',
        onClick: () => console.log('Download Audit clicked'),
      },
    ],
  },
};

// Default toolbar config
export const defaultToolbarConfig: RouteToolbarConfig = {
  breadcrumb: ['Home'],
  actions: [],
};

// Utility function to match dynamic routes
export const matchRoute = (pathname: string): string | null => {
  const routes = Object.keys(routeToolbarConfig);

  // First try exact match
  if (routes.includes(pathname)) {
    return pathname;
  }

  // Then try pattern matching for dynamic routes
  for (const route of routes) {
    if (route.includes(':')) {
      const pattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return route;
      }
    }
  }

  return null;
};
