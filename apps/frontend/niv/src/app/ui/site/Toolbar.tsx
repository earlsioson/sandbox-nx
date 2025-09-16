import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link,
  Toolbar as MuiToolbar,
  Typography,
} from '@mui/material';
import { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useToolbar } from '../../hooks/useToolbar';

// Breadcrumb section - memoized for performance
function BreadcrumbSection() {
  const { config } = useToolbar();

  return (
    <Breadcrumbs separator="›" sx={{ fontWeight: 500 }}>
      {config.breadcrumb.map((item, index) => {
        const isLast = index === config.breadcrumb.length - 1;

        if (isLast || !item.href) {
          return (
            <Typography
              key={`${item.label}-${index}`}
              color={isLast ? 'text.primary' : 'text.secondary'}
              sx={{ fontWeight: isLast ? 600 : 400 }}
            >
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={`${item.label}-${index}`}
            component={RouterLink}
            to={item.href}
            underline="hover"
            color="inherit"
            sx={{ fontWeight: 400 }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

const MemoizedBreadcrumbSection = memo(BreadcrumbSection);
MemoizedBreadcrumbSection.displayName = 'BreadcrumbSection';

// Actions section - memoized for performance
function ActionsSection() {
  const { config } = useToolbar();

  if (config.actions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {config.actions.map((action) => {
        const IconComponent = action.icon;

        return (
          <Button
            key={action.id}
            variant={action.variant || 'contained'}
            color={action.color || 'primary'}
            size="small"
            onClick={action.onClick}
            disabled={action.disabled}
            startIcon={IconComponent ? <IconComponent /> : undefined}
            sx={{
              minWidth: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </Button>
        );
      })}
    </Box>
  );
}

const MemoizedActionsSection = memo(ActionsSection);
MemoizedActionsSection.displayName = 'ActionsSection';

// Debug component to show route management status (development only)
function DebugInfo() {
  const { isRouteManaged } = useToolbar();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Chip
      label={isRouteManaged ? 'Route Managed' : 'Manual'}
      size="small"
      color={isRouteManaged ? 'success' : 'default'}
      sx={{ ml: 1 }}
    />
  );
}

const MemoizedDebugInfo = memo(DebugInfo);
MemoizedDebugInfo.displayName = 'DebugInfo';

// Main toolbar component
function Toolbar() {
  // Fix: Remove unused config variable since it's accessed within memoized components
  // const { config } = useToolbar(); // This was causing the unused variable warning

  return (
    <MuiToolbar
      sx={{
        minHeight: '64px !important',
        px: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Left side - Breadcrumbs */}
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <MemoizedBreadcrumbSection />
        <MemoizedDebugInfo />
      </Box>

      {/* Right side - Actions */}
      <MemoizedActionsSection />
    </MuiToolbar>
  );
}

const MemoizedToolbar = memo(Toolbar);
MemoizedToolbar.displayName = 'Toolbar';

export default MemoizedToolbar;
