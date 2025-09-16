import { useEffect } from 'react';
import { useToolbarContext } from '../contexts/ToolbarContext';
import { ToolbarConfig } from '../types/toolbar';

// Simple hook return type
interface UseToolbarReturn {
  config: ToolbarConfig;
  setToolbarConfig: (config: ToolbarConfig) => void;
  resetToolbar: () => void;
}

/**
 * Simple toolbar hook that provides toolbar management
 * Pages explicitly set their toolbar configuration
 */
export const useToolbar = (): UseToolbarReturn => {
  const { config, setToolbarConfig, resetToolbar } = useToolbarContext();

  return {
    config,
    setToolbarConfig,
    resetToolbar,
  };
};

/**
 * Hook for pages that need to set toolbar configuration
 * Automatically resets to default when component unmounts
 *
 * @param toolbarConfig - The toolbar configuration object (should be memoized)
 */
export const useToolbarConfig = (toolbarConfig: ToolbarConfig) => {
  const { setToolbarConfig, resetToolbar } = useToolbar();

  useEffect(() => {
    // Set toolbar config on mount
    setToolbarConfig(toolbarConfig);

    // Reset to default on unmount
    return () => {
      resetToolbar();
    };
  }, [toolbarConfig, setToolbarConfig, resetToolbar]);
};

/**
 * Hook for setting toolbar configuration with explicit control
 * Use this when you need manual control over when to set/clear toolbar
 *
 * @returns Object with stable setToolbar and clearToolbar functions
 */
export const useToolbarEffect = () => {
  const { setToolbarConfig, resetToolbar } = useToolbar();

  // Return context functions directly - they're already stable
  // No need for additional useCallback wrappers (anti-pattern)
  return {
    setToolbar: setToolbarConfig,
    clearToolbar: resetToolbar,
  };
};
