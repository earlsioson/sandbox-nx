import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ToolbarConfig, ToolbarContextValue } from '../types/toolbar';

// Default state - defined outside component to prevent recreation
const defaultConfig: ToolbarConfig = {
  breadcrumb: [{ label: 'Home' }],
  actions: [],
};

// Create context with undefined default (will throw if used outside provider)
const ToolbarContext = createContext<ToolbarContextValue | undefined>(
  undefined
);

// Custom hook to use toolbar context with error handling
export const useToolbarContext = (): ToolbarContextValue => {
  const context = useContext(ToolbarContext);

  if (context === undefined) {
    throw new Error('useToolbarContext must be used within a ToolbarProvider');
  }

  return context;
};

// Props for the provider
interface ToolbarProviderProps {
  children: ReactNode;
  initialConfig?: ToolbarConfig;
}

function ToolbarProvider({
  children,
  initialConfig = defaultConfig,
}: ToolbarProviderProps) {
  const [config, setConfig] = useState<ToolbarConfig>(initialConfig);

  // Stable callback functions using useCallback
  const setToolbarConfig = useCallback((newConfig: ToolbarConfig) => {
    setConfig(newConfig);
  }, []);

  const resetToolbar = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  // React 19 pattern: Use useMemo to create stable context value object
  const contextValue = useMemo(
    (): ToolbarContextValue => ({
      config,
      setToolbarConfig,
      resetToolbar,
    }),
    [config, setToolbarConfig, resetToolbar]
  );

  return (
    <ToolbarContext.Provider value={contextValue}>
      {children}
    </ToolbarContext.Provider>
  );
}

export { ToolbarProvider };

// Export context for testing purposes
export { ToolbarContext };
