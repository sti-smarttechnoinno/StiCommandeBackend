export type SettingsTab = 'general' | 'company' | 'catalog' | 'users' | 'security' | 'notifications' | 'localization' | 'integrations' | 'backup' | 'reports' | 'api' | 'appearance' | 'about';

export interface SettingsState {
  activeTab: SettingsTab;
  isSaving: boolean;
  lastSaved: string;
  setActiveTab: (tab: SettingsTab) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSaved: (time: string) => void;
}

export interface CompanyInfo {
  name: string;
  description: string;
  registrationNumber: string;
  taxId: string;
  rcNumber: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  strongPasswords: boolean;
  passwordExpiration: number;
  sessionTimeout: number;
  loginAuditLogs: boolean;
  deviceVerification: boolean;
  ipWhitelist: boolean;
  captchaLogin: boolean;
  singleSession: boolean;
  autoLockout: boolean;
}

export interface NotificationPrefs {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  newOrderAlerts: boolean;
  orderApproval: boolean;
  failedLoginAlerts: boolean;
  backupNotifications: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  description: string;
}

export interface SystemInfo {
  version: string;
  build: string;
  environment: string;
  framework: string;
  database: string;
  runtime: string;
  license: string;
  serverStatus: string;
}

export interface StorageItem {
  name: string;
  used: number;
  total: number;
  color: string;
}

export interface RecentChange {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  category: string;
}
