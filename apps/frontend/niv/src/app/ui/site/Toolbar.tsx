import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
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
import { BreadcrumbItem, ToolbarAction } from '../../types/toolbar';

// Breadcrumb component optimized for performance
function BreadcrumbSection() {
  const { config } = useToolbar();

  if (config.breadcrumb.length === 0) {
    return null;
  }

  // If only one item, show as simple text
  if (config.breadcrumb.length === 1) {
    return (
      <Typography variant="h6" component="div" noWrap>
        {config.breadcrumb[0].label}
      </Typography>
    );
  }

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ flexGrow: 1 }}
    >
      {config.breadcrumb.map((item: BreadcrumbItem, index: number) => {
        const isLast = index === config.breadcrumb.length - 1;

        if (isLast) {
          // Last item is current page - not clickable
          return (
            <Typography
              key={index}
              variant="h6"
              component="div"
              color="text.primary"
              sx={{ fontWeight: 'medium' }}
            >
              {item.label}
            </Typography>
          );
        }

        if (item.href) {
          // Clickable breadcrumb with link
          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.href}
              underline="hover"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {item.label}
            </Link>
          );
        }

        // Non-clickable breadcrumb
        return (
          <Typography
            key={index}
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {item.label}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
}

const MemoizedBreadcrumbSection = memo(BreadcrumbSection);
MemoizedBreadcrumbSection.displayName = 'BreadcrumbSection';

// Actions component optimized for performance
function ActionsSection() {
  const { config } = useToolbar();

  if (config.actions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {config.actions.map((action: ToolbarAction) => {
        const IconComponent = action.icon;

        return (
          <Button
            key={action.id}
            variant={action.variant || 'text'}
            color={action.color || 'primary'}
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
  const { config } = useToolbar();

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
