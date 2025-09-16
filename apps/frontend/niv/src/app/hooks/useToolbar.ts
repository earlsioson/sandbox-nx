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

  // React 19 pattern: Memoize the pathname to prevent unnecessary recalculations
  const pathname = location.pathname;

  // React 19 pattern: Memoize route matching with stable dependency
  const matchedRoute = useMemo(() => {
    return matchRoute(pathname);
  }, [pathname]);

  // React 19 pattern: Memoize params as a stable object
  // This prevents infinite re-renders caused by params object reference changes
  const stableParams = useMemo(() => {
    return params;
  }, [JSON.stringify(params)]);

  // Check if current route is managed by configuration
  const isRouteManaged = matchedRoute !== null;

  // React 19 pattern: Enhanced breadcrumb function with stable dependencies
  const enhanceBreadcrumb = useCallback(
    (
      breadcrumb: (string | BreadcrumbItem)[],
      routeParams: RouteParams
    ): BreadcrumbItem[] => {
      return normalizeBreadcrumb(breadcrumb).map((item: BreadcrumbItem) => {
        let enhancedLabel = item.label;

        // Replace parameter placeholders with actual values
        Object.entries(routeParams).forEach(([key, value]) => {
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
    [] // No dependencies - pure function
  );

  // React 19 pattern: Get actions function with stable dependencies
  const getRouteActions = useCallback(
    (
      routeConfig: typeof defaultToolbarConfig,
      routeParams: RouteParams
    ): ToolbarAction[] => {
      // If route has dynamic action generation, use it
      if (routeConfig.getActions) {
        // Convert RouteParams to Record<string, string> by filtering out undefined values
        const cleanParams: Record<string, string> = Object.entries(routeParams)
          .filter(([, value]) => value !== undefined)
          .reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value! }),
            {} as Record<string, string>
          );

        return routeConfig.getActions(cleanParams);
      }

      // Otherwise use static actions
      return routeConfig.actions;
    },
    [] // No dependencies - pure function
  );

  // React 19 pattern: Memoize the toolbar configuration to prevent unnecessary updates
  const toolbarConfig = useMemo(() => {
    if (!matchedRoute) {
      // Route not managed by configuration, use default
      return {
        breadcrumb: normalizeBreadcrumb(defaultToolbarConfig.breadcrumb),
        actions: defaultToolbarConfig.actions,
      };
    }

    const routeConfig = routeToolbarConfig[matchedRoute];

    // Build enhanced configuration
    return {
      breadcrumb: enhanceBreadcrumb(routeConfig.breadcrumb, stableParams),
      actions: getRouteActions(routeConfig, stableParams),
    };
  }, [matchedRoute, stableParams, enhanceBreadcrumb, getRouteActions]);

  // React 19 pattern: Effect with stable dependencies
  useEffect(() => {
    setToolbarConfig(toolbarConfig);
  }, [toolbarConfig, setToolbarConfig]);

  // React 19 pattern: Enhanced reset that uses memoized values
  const enhancedResetToolbar = useCallback(() => {
    if (matchedRoute) {
      const routeConfig = routeToolbarConfig[matchedRoute];
      const enhancedConfig: ToolbarConfig = {
        breadcrumb: enhanceBreadcrumb(routeConfig.breadcrumb, stableParams),
        actions: getRouteActions(routeConfig, stableParams),
      };
      setToolbarConfig(enhancedConfig);
    } else {
      resetToolbar();
    }
  }, [
    matchedRoute,
    stableParams,
    enhanceBreadcrumb,
    getRouteActions,
    setToolbarConfig,
    resetToolbar,
  ]);

  return {
    config,
    updateToolbar,
    resetToolbar: enhancedResetToolbar,
    isRouteManaged,
  };
};

/**
 * React 19 pattern: Simplified hook for temporary toolbar overrides
 * Automatically resets to route-based config when component unmounts
 */
export const useToolbarOverride = (overrideConfig: Partial<ToolbarConfig>) => {
  const { updateToolbar, resetToolbar } = useToolbar();

  // React 19 pattern: Memoize the override config to prevent unnecessary effects
  const stableOverrideConfig = useMemo(
    () => overrideConfig,
    [JSON.stringify(overrideConfig)]
  );

  useEffect(() => {
    // Apply override on mount
    updateToolbar(stableOverrideConfig);

    // Reset on unmount
    return () => {
      resetToolbar();
    };
  }, [updateToolbar, resetToolbar, stableOverrideConfig]);
};

/**
 * Hook for getting current route information useful for toolbar logic
 */
export const useToolbarRoute = () => {
  const location = useLocation();
  const params = useParams<RouteParams>();

  const pathname = location.pathname;
  const stableParams = useMemo(() => params, [JSON.stringify(params)]);

  const matchedRoute = useMemo(() => {
    return matchRoute(pathname);
  }, [pathname]);

  return useMemo(
    () => ({
      pathname,
      params: stableParams,
      matchedRoute,
      isManaged: matchedRoute !== null,
    }),
    [pathname, stableParams, matchedRoute]
  );
};
