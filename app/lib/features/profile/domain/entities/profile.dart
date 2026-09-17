class UserProfile {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String employeeId;
  final String region;
  final String wilaya;
  final DateTime employeeSince;
  final String? avatarUrl;
  final bool isOnline;

  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.employeeId,
    required this.region,
    required this.wilaya,
    required this.employeeSince,
    this.avatarUrl,
    this.isOnline = true,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final rawRole = json['role']?.toString() ?? 'delegate';
    final formattedRole = rawRole == 'delegate' ? 'Délégué Commercial' : rawRole;

    return UserProfile(
      id: json['id']?.toString() ?? '1',
      name: json['name']?.toString() ?? 'Délégué Commercial',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: formattedRole,
      employeeId: json['delegateCode']?.toString() ?? json['employee_id']?.toString() ?? 'DEL-2026-000001',
      region: json['region']?.toString() ?? 'Algiers',
      wilaya: json['wilaya']?.toString() ?? '16 - Alger',
      employeeSince: DateTime.now().subtract(const Duration(days: 90)),
      avatarUrl: json['avatarUrl']?.toString(),
      isOnline: json['status'] == 'online' || json['is_active'] == true,
    );
  }

  String get initials {
    final trimmed = name.trim();
    final words = trimmed.split(' ');
    if (words.length >= 2 && words[0].isNotEmpty && words[1].isNotEmpty) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return trimmed.isNotEmpty ? trimmed.substring(0, trimmed.length.clamp(0, 2)).toUpperCase() : 'DEL';
  }
}

class PerformanceData {
  final double performancePercent;
  final String performanceLabel;
  final double monthlyTarget;
  final double monthlyAchieved;
  final int todayOrders;
  final double commissions;
  final bool hasObjective;
  final String monthName;
  final int targetOrders;
  final int achievedOrders;

  const PerformanceData({
    required this.performancePercent,
    required this.performanceLabel,
    required this.monthlyTarget,
    required this.monthlyAchieved,
    required this.todayOrders,
    required this.commissions,
    this.hasObjective = false,
    this.monthName = 'Ce mois',
    this.targetOrders = 0,
    this.achievedOrders = 0,
  });

  factory PerformanceData.fromJson(Map<String, dynamic> json) {
    final obj = json['objective'] is Map<String, dynamic>
        ? json['objective'] as Map<String, dynamic>
        : <String, dynamic>{};

    final target = (obj['targetRevenue'] as num?)?.toDouble() ??
        (json['monthlyTarget'] as num?)?.toDouble() ??
        0.0;

    final isConfigured = (obj['isConfigured'] as bool?) ??
        (json['hasObjective'] as bool?) ??
        false;

    final hasObjective = isConfigured && target > 0;

    final achieved = (obj['achievedRevenue'] as num?)?.toDouble() ??
        (json['monthlyAchieved'] as num?)?.toDouble() ??
        (json['balance'] as num?)?.toDouble() ??
        0.0;

    final pct = hasObjective && target > 0
        ? ((achieved / target) * 100).clamp(0.0, 100.0)
        : (json['performancePercent'] as num?)?.toDouble() ??
            (obj['revenuePercentage'] as num?)?.toDouble() ??
            0.0;

    final label = json['performanceLabel']?.toString() ??
        (hasObjective
            ? (pct >= 90
                ? 'Excellente'
                : pct >= 70
                    ? 'Bonne'
                    : pct >= 50
                        ? 'Moyenne'
                        : 'À améliorer')
            : 'Non défini');

    final today = (json['todayOrders'] as num?)?.toInt() ?? 0;
    final balance = (json['balance'] as num?)?.toDouble();
    final comm = (json['commissions'] as num?)?.toDouble() ??
        (balance != null ? balance * 0.025 : 0.0);

    return PerformanceData(
      performancePercent: pct.clamp(0.0, 100.0),
      performanceLabel: label,
      monthlyTarget: target,
      monthlyAchieved: achieved,
      todayOrders: today,
      commissions: comm,
      hasObjective: hasObjective,
      monthName: obj['monthName']?.toString() ?? 'Ce mois',
      targetOrders: (obj['targetOrders'] as num?)?.toInt() ?? 0,
      achievedOrders: (obj['achievedOrders'] as num?)?.toInt() ??
          (json['monthlyOrdersCount'] as num?)?.toInt() ??
          0,
    );
  }
}

class ProfileStatistics {
  final int totalOrders;
  final double totalRevenue;
  final int activeClients;
  final double successRate;
  final String ordersTrend;
  final bool ordersTrendUp;
  final String revenueTrend;
  final bool revenueTrendUp;
  final String clientsTrend;
  final bool clientsTrendUp;
  final String successTrend;
  final bool successTrendUp;

  const ProfileStatistics({
    required this.totalOrders,
    required this.totalRevenue,
    required this.activeClients,
    required this.successRate,
    this.ordersTrend = '+0%',
    this.ordersTrendUp = true,
    this.revenueTrend = '+0%',
    this.revenueTrendUp = true,
    this.clientsTrend = '+0%',
    this.clientsTrendUp = true,
    this.successTrend = '+0%',
    this.successTrendUp = true,
  });

  factory ProfileStatistics.fromJson(Map<String, dynamic> json) {
    final ordGrowth = (json['ordersGrowth'] as num?)?.toDouble() ?? 0.0;
    final revGrowth = (json['revenueGrowth'] as num?)?.toDouble() ?? 0.0;

    return ProfileStatistics(
      totalOrders: (json['totalOrders'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      activeClients: (json['activeClients'] as num?)?.toInt() ?? 0,
      successRate: (json['successRate'] as num?)?.toDouble() ?? 0.0,
      ordersTrend: '${ordGrowth >= 0 ? '+' : ''}${ordGrowth.toStringAsFixed(0)}%',
      ordersTrendUp: ordGrowth >= 0,
      revenueTrend: '${revGrowth >= 0 ? '+' : ''}${revGrowth.toStringAsFixed(0)}%',
      revenueTrendUp: revGrowth >= 0,
      clientsTrend: '+0%',
      clientsTrendUp: true,
      successTrend: '+0%',
      successTrendUp: true,
    );
  }
}

class SystemStatus {
  final bool apiOnline;
  final bool socketOnline;
  final bool databaseOnline;
  final Duration lastSync;
  final String appVersion;

  const SystemStatus({
    required this.apiOnline,
    required this.socketOnline,
    required this.databaseOnline,
    required this.lastSync,
    required this.appVersion,
  });
}

class AppSettings {
  final String language;
  final bool darkMode;
  final bool notificationsEnabled;
  final bool biometricEnabled;

  const AppSettings({
    required this.language,
    required this.darkMode,
    required this.notificationsEnabled,
    required this.biometricEnabled,
  });

  AppSettings copyWith({
    String? language,
    bool? darkMode,
    bool? notificationsEnabled,
    bool? biometricEnabled,
  }) {
    return AppSettings(
      language: language ?? this.language,
      darkMode: darkMode ?? this.darkMode,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
    );
  }
}
