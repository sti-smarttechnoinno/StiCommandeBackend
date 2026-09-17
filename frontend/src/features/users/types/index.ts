export type UserRole = 'administrator' | 'manager' | 'delegate' | 'viewer' | 'commercial' | 'charge_compte' | string;
export type UserStatus = 'authorized' | 'blocked' | 'online' | 'offline' | 'locked' | 'suspended' | 'invited' | string;

export interface UserRow {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  employeeId: string;
  role: UserRole;
  region: string;
  wilaya: string;
  status: UserStatus;
  password?: string;
  lastLogin: string;
  lastLoginDate: string;
  twoFactorEnabled: boolean;
  avatar: string;
  department: string;
  permissions: UserPermission[];
  loginHistory: LoginEvent[];
  devices: UserDevice[];
}

export interface UserPermission {
  module: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface LoginEvent {
  id: string;
  type: 'login' | 'logout' | 'password_changed' | 'role_updated' | 'failed_login';
  timestamp: string;
  ipAddress: string;
  device: string;
  status: 'success' | 'warning' | 'danger';
}

export interface UserDevice {
  type: 'Desktop' | 'Android' | 'iOS' | 'Browser';
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
}

export interface PasswordExpiry {
  name: string;
  daysLeft: number;
}

export interface SecurityEvent {
  id: string;
  time: string;
  user: string;
  event: string;
  ipAddress: string;
  device: string;
  status: 'success' | 'warning' | 'danger';
}

export interface UsersState {
  searchQuery: string;
  selectedRoles: string[];
  selectedRegions: string[];
  selectedStatuses: string[];
  selectedRole: string;
  selectedRegion: string;
  selectedWilaya: string;
  selectedStatus: string;
  selectedLastLogin: string;
  selectedTwoFactor: string;
  selectedUsers: Set<string>;
  isNewUserDialogOpen: boolean;
  isDetailsDrawerOpen: boolean;
  selectedUserId: string | null;
  setSearchQuery: (q: string) => void;
  setSelectedRoles: (roles: string[]) => void;
  setSelectedRegions: (regions: string[]) => void;
  setSelectedStatuses: (statuses: string[]) => void;
  setSelectedRole: (r: string) => void;
  setSelectedRegion: (r: string) => void;
  setSelectedWilaya: (w: string) => void;
  setSelectedStatus: (s: string) => void;
  setSelectedLastLogin: (l: string) => void;
  setSelectedTwoFactor: (t: string) => void;
  toggleUserSelection: (id: string) => void;
  selectAllUsers: (ids: string[]) => void;
  clearSelection: () => void;
  setNewUserDialogOpen: (open: boolean) => void;
  setDetailsDrawerOpen: (open: boolean, userId?: string) => void;
  resetFilters: () => void;
}
