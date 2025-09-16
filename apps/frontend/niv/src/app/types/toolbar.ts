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

export interface ToolbarContextValue {
  config: ToolbarConfig;
  setToolbarConfig: (config: ToolbarConfig) => void;
  resetToolbar: () => void;
}

export type UserRole = 'RT' | 'NURSE' | 'ADMIN' | 'DON' | 'MANAGER';

export type PatientStatus =
  | 'NEW'
  | 'WATCHLIST'
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED';
