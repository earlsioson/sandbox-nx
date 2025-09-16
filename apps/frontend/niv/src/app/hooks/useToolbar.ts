import { useCallback, useEffect } from 'react';
import { useToolbarContext } from '../contexts/ToolbarContext';
import { ToolbarConfig } from '../types/toolbar';

// Simple hook return type
interface UseToolbarReturn {
  config: ToolbarConfig;
  setToolbarConfig: (config: ToolbarConfig) => void;
  resetToolbar: () => void;
}

/**
 * Simple toolbar hook that provides clean toolbar management
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
 * Hook for setting toolbar configuration with cleanup
 * More explicit version of useToolbarConfig
 */
export const useToolbarEffect = () => {
  const { setToolbarConfig, resetToolbar } = useToolbar();

  const setToolbar = useCallback(
    (config: ToolbarConfig) => {
      setToolbarConfig(config);
    },
    [setToolbarConfig]
  );

  const clearToolbar = useCallback(() => {
    resetToolbar();
  }, [resetToolbar]);

  return { setToolbar, clearToolbar };
};
