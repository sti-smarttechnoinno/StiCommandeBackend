import type { IntegrationStatus, SystemInfo, StorageItem, RecentChange } from '../types';

export const MOCK_INTEGRATIONS: IntegrationStatus[] = [
  { id: '1', name: 'Ooredoo API', status: 'connected', lastSync: '2 min ago', description: 'Mobile credit and SIM distribution' },
  { id: '2', name: 'SMTP Mail', status: 'connected', lastSync: '5 min ago', description: 'Email notification service' },
  { id: '3', name: 'SMS Gateway', status: 'connected', lastSync: '10 min ago', description: 'SMS notification delivery' },
  { id: '4', name: 'Firebase Cloud Messaging', status: 'connected', lastSync: '1 min ago', description: 'Push notification service' },
  { id: '5', name: 'PostgreSQL', status: 'connected', lastSync: 'Real-time', description: 'Primary database' },
  { id: '6', name: 'Redis', status: 'connected', lastSync: 'Real-time', description: 'Caching and sessions' },
  { id: '7', name: 'Socket.IO', status: 'connected', lastSync: 'Real-time', description: 'Real-time communication' },
];

export const MOCK_SYSTEM_INFO: SystemInfo = {
  version: '1.0.0',
  build: '2026.08.01',
  environment: 'Production',
  framework: 'Next.js 16',
  database: 'PostgreSQL 16',
  runtime: 'Node.js 22',
  license: 'Enterprise',
  serverStatus: 'Online',
};

export const MOCK_STORAGE: StorageItem[] = [
  { name: 'Database', used: 45, total: 100, color: '#2563EB' },
  { name: 'Documents', used: 32, total: 100, color: '#22C55E' },
  { name: 'Backups', used: 60, total: 100, color: '#F59E0B' },
  { name: 'Images', used: 28, total: 100, color: '#8B5CF6' },
];

export const MOCK_RECENT_CHANGES: RecentChange[] = [
  { id: '1', user: 'Ahmed Benali', action: 'changed Security Settings', timestamp: '5 min ago', category: 'security' },
  { id: '2', user: 'System', action: 'Backup completed successfully', timestamp: '1 hour ago', category: 'backup' },
  { id: '3', user: 'Fatima Zeroual', action: 'API key regenerated', timestamp: '3 hours ago', category: 'api' },
  { id: '4', user: 'Karim Hadj', action: 'Company logo updated', timestamp: '1 day ago', category: 'company' },
  { id: '5', user: 'System', action: 'Notification preferences modified', timestamp: '2 days ago', category: 'notifications' },
];

export const SYSTEM_HEALTH = [
  { name: 'API Server', status: 'operational' as const, latency: 18 },
  { name: 'PostgreSQL', status: 'operational' as const, latency: 12 },
  { name: 'Redis', status: 'operational' as const, latency: 3 },
  { name: 'Storage', status: 'operational' as const, latency: 15 },
  { name: 'Socket.IO', status: 'operational' as const, latency: 8 },
  { name: 'Background Jobs', status: 'operational' as const, latency: 24 },
];
