import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import {
  BreadcrumbItem,
  ToolbarConfig,
  ToolbarContextValue,
} from '../types/toolbar';

// Action types for reducer
type ToolbarAction =
  | { type: 'SET_CONFIG'; payload: ToolbarConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<ToolbarConfig> }
  | { type: 'RESET_CONFIG'; payload: ToolbarConfig };

// Reducer for toolbar state management
const toolbarReducer = (
  state: ToolbarConfig,
  action: ToolbarAction
): ToolbarConfig => {
  switch (action.type) {
    case 'SET_CONFIG':
      return action.payload;

    case 'UPDATE_CONFIG':
      return {
        ...state,
        ...action.payload,
        // Merge breadcrumb if provided
        breadcrumb: action.payload.breadcrumb ?? state.breadcrumb,
        // Merge actions if provided
        actions: action.payload.actions ?? state.actions,
      };

    case 'RESET_CONFIG':
      return action.payload;

    default:
      return state;
  }
};

// Default state - defined outside component to prevent recreation
const defaultState: ToolbarConfig = {
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

// Provider component using React 19 patterns
function ToolbarProvider({
  children,
  initialConfig = defaultState,
}: ToolbarProviderProps) {
  const [config, dispatch] = useReducer(toolbarReducer, initialConfig);

  // Stable callback functions using useCallback with empty dependencies
  // These functions only depend on dispatch which is stable from useReducer
  const updateToolbar = useCallback((newConfig: Partial<ToolbarConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
  }, []);

  const resetToolbar = useCallback(() => {
    dispatch({ type: 'RESET_CONFIG', payload: defaultState });
  }, []);

  const setToolbarConfig = useCallback((newConfig: ToolbarConfig) => {
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
  }, []);

  // React 19 pattern: Use useMemo to create stable context value object
  // This prevents the context value from changing on every render
  const contextValue = useMemo(
    (): ToolbarContextValue => ({
      config,
      updateToolbar,
      resetToolbar,
      setToolbarConfig,
    }),
    [config, updateToolbar, resetToolbar, setToolbarConfig]
  );

  return (
    <ToolbarContext.Provider value={contextValue}>
      {children}
    </ToolbarContext.Provider>
  );
}

export { ToolbarProvider };

// Utility function to convert string breadcrumbs to BreadcrumbItem objects
// Pure function - no dependencies, safe to call anywhere
export const normalizeBreadcrumb = (
  breadcrumb: (string | BreadcrumbItem)[]
): BreadcrumbItem[] => {
  return breadcrumb.map((item) =>
    typeof item === 'string' ? { label: item } : item
  );
};

// Export context for testing purposes
export { ToolbarContext };
