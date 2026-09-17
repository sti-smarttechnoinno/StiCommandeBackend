import '../../domain/entities/profile.dart';

final mockProfile = UserProfile(
  id: 'USR-001',
  name: 'Ahmed Benali',
  email: 'ahmed.benali@sti.dz',
  phone: '0550 25 36 98',
  role: 'Délégué',
  employeeId: 'DEL-2024-0158',
  region: 'Région Est',
  wilaya: 'Sétif',
  employeeSince: DateTime(2024, 1, 15),
  isOnline: true,
);

const mockPerformance = PerformanceData(
  performancePercent: 92,
  performanceLabel: 'Excellente',
  monthlyTarget: 15000000,
  monthlyAchieved: 12560000,
  todayOrders: 15,
  commissions: 320500,
);

const mockStatistics = ProfileStatistics(
  totalOrders: 248,
  totalRevenue: 12560000,
  activeClients: 124,
  successRate: 92,
);

const mockSystemStatus = SystemStatus(
  apiOnline: true,
  socketOnline: true,
  databaseOnline: true,
  lastSync: Duration(minutes: 2),
  appVersion: '1.0.0',
);

AppSettings mockSettings = const AppSettings(
  language: 'Français',
  darkMode: false,
  notificationsEnabled: true,
  biometricEnabled: false,
);
