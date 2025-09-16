export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: React.ComponentType;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  onClick: () => void;
  disabled?: boolean;
}

export interface ToolbarConfig {
  breadcrumb: BreadcrumbItem[];
  actions: ToolbarAction[];
}

export interface RouteToolbarConfig {
  breadcrumb: (string | BreadcrumbItem)[];
  actions: ToolbarAction[];
  getActions?: (params: Record<string, string>) => ToolbarAction[];
}

export interface ToolbarContextValue {
  config: ToolbarConfig;
  updateToolbar: (config: Partial<ToolbarConfig>) => void;
  resetToolbar: () => void;
  setToolbarConfig: (config: ToolbarConfig) => void;
}

export type UserRole = 'RT' | 'NURSE' | 'ADMIN' | 'DON' | 'MANAGER';

export type PatientStatus =
  | 'NEW'
  | 'WATCHLIST'
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED';
