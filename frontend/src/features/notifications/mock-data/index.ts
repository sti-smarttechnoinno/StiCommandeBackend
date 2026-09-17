import type { Notification, Announcement } from '../types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Order #ORD-2045 requires administrator approval', description: 'A new high-value order has been submitted by Ahmed Benali and requires immediate administrator review before processing can begin.', category: 'orders', priority: 'critical', status: 'unread', user: 'Ahmed Benali', region: 'East', module: 'Orders', referenceId: 'ORD-2045', timestamp: '2025-07-30T17:58:00', read: false },
  { id: '2', title: 'Low stock alert: Ooredoo 1000 DA Recharge', description: 'Stock level has dropped below minimum threshold at Setif Central warehouse. Current stock: 45 units, minimum required: 100.', category: 'stock', priority: 'high', status: 'unread', user: 'System', region: 'East', module: 'Stock', referenceId: 'STK-112', timestamp: '2025-07-30T17:55:00', read: false },
  { id: '3', title: 'Delegate Karim Hadj completed daily target', description: 'Delegate has exceeded the daily sales target by 15% with 42 orders processed today. Performance rating: Excellent.', category: 'delegates', priority: 'low', status: 'read', user: 'Karim Hadj', region: 'West', module: 'Delegates', timestamp: '2025-07-30T17:50:00', read: true },
  { id: '4', title: 'Security: Multiple failed login attempts detected', description: 'Three consecutive failed login attempts detected from IP 192.168.7.20 for user sofiane.merah@sti.dz. Account has been temporarily locked.', category: 'security', priority: 'critical', status: 'unread', user: 'System', region: 'West', module: 'Security', timestamp: '2025-07-30T17:45:00', read: false },
  { id: '5', title: 'New client registration: Tech Solutions Algiers', description: 'A new corporate client has been registered in the system. Requires manager verification and credit limit assignment.', category: 'clients', priority: 'medium', status: 'unread', user: 'System', region: 'Center', module: 'Clients', referenceId: 'CLT-892', timestamp: '2025-07-30T17:40:00', read: false },
  { id: '6', title: 'Monthly revenue report generated', description: 'The July 2025 monthly revenue report has been automatically generated and is ready for review. Total revenue: 18.5M DA.', category: 'reports', priority: 'low', status: 'read', user: 'System', region: 'All', module: 'Reports', referenceId: 'RPT-0725', timestamp: '2025-07-30T17:35:00', read: true },
  { id: '7', title: 'Stock transfer completed: Oran → Constantine', description: 'Transfer of 250 units of Djezzy SIM cards from Oran Warehouse to Constantine Hub has been completed successfully.', category: 'stock', priority: 'medium', status: 'read', user: 'Omar Tlemcani', region: 'West', module: 'Stock', referenceId: 'TRF-0089', timestamp: '2025-07-30T17:30:00', read: true },
  { id: '8', title: 'System maintenance scheduled for tonight', description: 'Planned database maintenance window from 22:00 to 02:00. All ERP services will be temporarily unavailable during this period.', category: 'system', priority: 'high', status: 'unread', user: 'System', region: 'All', module: 'System', timestamp: '2025-07-30T17:25:00', read: false },
  { id: '9', title: 'Order #ORD-2043 delivered successfully', description: 'Order has been delivered to the client in Algiers. Delivery confirmed by delegate Yasmine Algiers with client signature.', category: 'orders', priority: 'low', status: 'read', user: 'Yasmine Algiers', region: 'Center', module: 'Orders', referenceId: 'ORD-2043', timestamp: '2025-07-30T17:20:00', read: true },
  { id: '10', title: 'Delegate attendance alert: Aicha Djebbar', description: 'Delegate has not logged in for 14 consecutive days. HR notification triggered for follow-up action.', category: 'delegates', priority: 'high', status: 'unread', user: 'System', region: 'South', module: 'Delegates', timestamp: '2025-07-30T17:15:00', read: false },
  { id: '11', title: 'Invoice #INV-4521 payment received', description: 'Payment of 450,000 DA received from client Tech Solutions Algiers via bank transfer. Invoice marked as paid.', category: 'finance', priority: 'low', status: 'read', user: 'System', region: 'Center', module: 'Finance', referenceId: 'INV-4521', timestamp: '2025-07-30T17:10:00', read: true },
  { id: '12', title: 'Critical: Warehouse capacity exceeded at Oran', description: 'Oran Warehouse has reached 98% capacity. Immediate action required to redirect incoming shipments or initiate stock transfers.', category: 'stock', priority: 'critical', status: 'unread', user: 'System', region: 'West', module: 'Stock', timestamp: '2025-07-30T17:05:00', read: false },
  { id: '13', title: 'New delegate onboarded: Youcef Tlemcani', description: 'A new delegate has been added to the West region team. Pending role assignment and territory configuration.', category: 'delegates', priority: 'medium', status: 'unread', user: 'Karim Hadj', region: 'West', module: 'Delegates', timestamp: '2025-07-30T17:00:00', read: false },
  { id: '14', title: 'Client complaint received: Order delay', description: 'Client Mohamed Hakim has reported a 3-day delay on order #ORD-2038. Customer service follow-up required.', category: 'clients', priority: 'high', status: 'unread', user: 'Mohamed Hakim', region: 'Center', module: 'Clients', referenceId: 'CLT-456', timestamp: '2025-07-30T16:55:00', read: false },
  { id: '15', title: 'Weekly delegate performance report available', description: 'Week 29 performance report has been generated. Top performer: Ahmed Benali (94% completion rate).', category: 'reports', priority: 'low', status: 'read', user: 'System', region: 'All', module: 'Reports', referenceId: 'RPT-W29', timestamp: '2025-07-30T16:50:00', read: true },
  { id: '16', title: 'API rate limit warning', description: 'API usage has reached 85% of the hourly limit. Consider optimizing request patterns or increasing quota.', category: 'system', priority: 'medium', status: 'unread', user: 'System', region: 'All', module: 'System', timestamp: '2025-07-30T16:45:00', read: false },
  { id: '17', title: 'Stock adjustment approved for Batna Depot', description: 'Adjustment of -15 units for damaged goods at Batna Depot has been approved by manager Amina Bouzid.', category: 'stock', priority: 'low', status: 'read', user: 'Amina Bouzid', region: 'South', module: 'Stock', referenceId: 'ADJ-0034', timestamp: '2025-07-30T16:40:00', read: true },
  { id: '18', title: 'Security: Password policy updated', description: 'System password policy has been updated. Minimum length increased to 12 characters. All users will be required to update on next login.', category: 'security', priority: 'high', status: 'unread', user: 'System', region: 'All', module: 'Security', timestamp: '2025-07-30T16:35:00', read: false },
  { id: '19', title: 'Order #ORD-2042 cancelled by client', description: 'Client has cancelled order #ORD-2042 worth 125,000 DA. Reason: found alternative supplier. Refund processing initiated.', category: 'orders', priority: 'medium', status: 'read', user: 'Fatima Zeroual', region: 'Center', module: 'Orders', referenceId: 'ORD-2042', timestamp: '2025-07-30T16:30:00', read: true },
  { id: '20', title: 'Delegate NPS score updated', description: 'Net Promoter Score for delegate team has been updated. Overall score: 78/100 (up from 72).', category: 'delegates', priority: 'low', status: 'read', user: 'System', region: 'All', module: 'Delegates', timestamp: '2025-07-30T16:25:00', read: true },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Server Maintenance Tonight', date: 'Tonight 22:00', status: 'scheduled' },
  { id: '2', title: 'Inventory Audit - August', date: 'Aug 1, 09:00', status: 'scheduled' },
  { id: '3', title: 'Monthly Revenue Report', date: 'Aug 1, 08:00', status: 'published' },
  { id: '4', title: 'Delegate Meeting - Q3 Review', date: 'Aug 5, 14:00', status: 'scheduled' },
];

export const CATEGORY_DISTRIBUTION = [
  { name: 'Orders', value: 156, color: '#2563EB' },
  { name: 'Stock', value: 89, color: '#22C55E' },
  { name: 'Delegates', value: 67, color: '#06B6D4' },
  { name: 'Clients', value: 54, color: '#8B5CF6' },
  { name: 'Reports', value: 45, color: '#6366F1' },
  { name: 'Security', value: 38, color: '#EF4444' },
  { name: 'System', value: 33, color: '#6B7280' },
];

export const ACTIVITY_SUMMARY = [
  { name: 'Orders', value: 76, color: '#2563EB' },
  { name: 'Stock', value: 43, color: '#22C55E' },
  { name: 'Delegates', value: 22, color: '#06B6D4' },
  { name: 'Clients', value: 18, color: '#8B5CF6' },
  { name: 'Reports', value: 11, color: '#6366F1' },
  { name: 'Security', value: 9, color: '#EF4444' },
];

export const STATUS_DISTRIBUTION = [
  { name: 'Read', value: 445, color: '#22C55E' },
  { name: 'Unread', value: 37, color: '#F59E0B' },
  { name: 'Archived', value: 68, color: '#6B7280' },
  { name: 'Pending Action', value: 15, color: '#EF4444' },
];
