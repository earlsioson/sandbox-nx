import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  defaultToolbarConfig,
  matchRoute,
  routeToolbarConfig,
} from '../config/toolbar';
import {
  normalizeBreadcrumb,
  useToolbarContext,
} from '../contexts/ToolbarContext';
import { BreadcrumbItem, ToolbarAction, ToolbarConfig } from '../types/toolbar';

// Enhanced params type for dynamic route handling
interface RouteParams {
  [key: string]: string | undefined;
}

// Hook return type
interface UseToolbarReturn {
  config: ToolbarConfig;
  updateToolbar: (config: Partial<ToolbarConfig>) => void;
  resetToolbar: () => void;
  isRouteManaged: boolean;
}

/**
 * Main toolbar hook that provides route-aware toolbar management
 * Automatically updates toolbar based on current route and provides manual override capabilities
 */
export const useToolbar = (): UseToolbarReturn => {
  const location = useLocation();
  const params = useParams<RouteParams>();
  const { config, updateToolbar, resetToolbar, setToolbarConfig } =
    useToolbarContext();

  // Memoized route matching to avoid recalculation
  const matchedRoute = useMemo(() => {
    return matchRoute(location.pathname);
  }, [location.pathname]);

  // Check if current route is managed by configuration
  const isRouteManaged = matchedRoute !== null;

  // Enhanced breadcrumb with dynamic data injection
  const enhanceBreadcrumb = useCallback(
    (
      breadcrumb: (string | BreadcrumbItem)[],
      params: RouteParams
    ): BreadcrumbItem[] => {
      return normalizeBreadcrumb(breadcrumb).map((item: BreadcrumbItem) => {
        let enhancedLabel = item.label;

        // Replace parameter placeholders with actual values
        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            enhancedLabel = enhancedLabel.replace(`{${key}}`, value);
            // Common patterns for patient names, facility names, etc.
            enhancedLabel = enhancedLabel.replace(
              '{patientName}',
              `Patient ${value}`
            );
            enhancedLabel = enhancedLabel.replace(
              '{facilityName}',
              `Facility ${value}`
            );
          }
        });

        return {
          ...item,
          label: enhancedLabel,
        };
      });
    },
    []
  );

  // Get actions for the current route, with dynamic generation support
  const getRouteActions = useCallback(
    (
      routeConfig: typeof defaultToolbarConfig,
      params: RouteParams
    ): ToolbarAction[] => {
      // If route has dynamic action generation, use it
      if (routeConfig.getActions) {
        return routeConfig.getActions(params);
      }

      // Otherwise use static actions
      return routeConfig.actions;
    },
    []
  );

  // Effect to update toolbar when route changes
  useEffect(() => {
    if (!matchedRoute) {
      // Route not managed by configuration, use default
      setToolbarConfig({
        breadcrumb: normalizeBreadcrumb(defaultToolbarConfig.breadcrumb),
        actions: defaultToolbarConfig.actions,
      });
      return;
    }

    const routeConfig = routeToolbarConfig[matchedRoute];

    // Build enhanced configuration
    const enhancedConfig: ToolbarConfig = {
      breadcrumb: enhanceBreadcrumb(routeConfig.breadcrumb, params),
      actions: getRouteActions(routeConfig, params),
    };

    setToolbarConfig(enhancedConfig);
  }, [
    matchedRoute,
    params,
    enhanceBreadcrumb,
    getRouteActions,
    setToolbarConfig,
  ]);

  // Enhanced update function that preserves route-based config when appropriate
  const enhancedUpdateToolbar = useCallback(
    (newConfig: Partial<ToolbarConfig>) => {
      updateToolbar(newConfig);
    },
    [updateToolbar]
  );

  // Enhanced reset that returns to route-based config if available
  const enhancedResetToolbar = useCallback(() => {
    if (matchedRoute) {
      const routeConfig = routeToolbarConfig[matchedRoute];
      const enhancedConfig: ToolbarConfig = {
        breadcrumb: enhanceBreadcrumb(routeConfig.breadcrumb, params),
        actions: getRouteActions(routeConfig, params),
      };
      setToolbarConfig(enhancedConfig);
    } else {
      resetToolbar();
    }
  }, [
    matchedRoute,
    params,
    enhanceBreadcrumb,
    getRouteActions,
    setToolbarConfig,
    resetToolbar,
  ]);

  return {
    config,
    updateToolbar: enhancedUpdateToolbar,
    resetToolbar: enhancedResetToolbar,
    isRouteManaged,
  };
};

/**
 * Simplified hook for components that just need to update toolbar temporarily
 * Automatically resets to route-based config when component unmounts
 */
export const useToolbarOverride = (overrideConfig: Partial<ToolbarConfig>) => {
  const { updateToolbar, resetToolbar } = useToolbar();

  useEffect(() => {
    // Apply override on mount
    updateToolbar(overrideConfig);

    // Reset on unmount
    return () => {
      resetToolbar();
    };
  }, [updateToolbar, resetToolbar, overrideConfig]);
};

/**
 * Hook for getting current route information useful for toolbar logic
 */
export const useToolbarRoute = () => {
  const location = useLocation();
  const params = useParams<RouteParams>();

  const matchedRoute = useMemo(() => {
    return matchRoute(location.pathname);
  }, [location.pathname]);

  return {
    pathname: location.pathname,
    params,
    matchedRoute,
    isManaged: matchedRoute !== null,
  };
};
