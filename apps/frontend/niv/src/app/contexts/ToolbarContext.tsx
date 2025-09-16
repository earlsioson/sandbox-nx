import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
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

// Default state
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

  // Memoized update function to prevent unnecessary re-renders
  const updateToolbar = useCallback((newConfig: Partial<ToolbarConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
  }, []);

  // Memoized reset function
  const resetToolbar = useCallback(() => {
    dispatch({ type: 'RESET_CONFIG', payload: defaultState });
  }, []);

  // Internal function to set complete config (used by useToolbar hook)
  const setToolbarConfig = useCallback((newConfig: ToolbarConfig) => {
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue: ToolbarContextValue = {
    config,
    updateToolbar,
    resetToolbar,
    setToolbarConfig,
  };

  return (
    <ToolbarContext.Provider value={contextValue}>
      {children}
    </ToolbarContext.Provider>
  );
}

export { ToolbarProvider };

// Utility function to convert string breadcrumbs to BreadcrumbItem objects
export const normalizeBreadcrumb = (
  breadcrumb: (string | BreadcrumbItem)[]
): BreadcrumbItem[] => {
  return breadcrumb.map((item) =>
    typeof item === 'string' ? { label: item } : item
  );
};

// Export context for testing purposes
export { ToolbarContext };
