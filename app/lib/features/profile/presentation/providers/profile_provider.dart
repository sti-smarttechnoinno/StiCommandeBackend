import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../domain/entities/profile.dart';
import '../../data/datasources/mock_profile.dart';

final profileProvider = Provider<UserProfile>((ref) {
  final authState = ref.watch(authProvider);
  if (authState.user != null) {
    return UserProfile.fromJson(authState.user!);
  }
  return mockProfile;
});

// Real KPIs FutureProvider fetching directly from Laravel Backend DB
final rawProfileKpisProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final authState = ref.watch(authProvider);
  final delegateId = authState.delegateId;

  final query = <String, String>{};
  if (delegateId.isNotEmpty) {
    query['delegate_id'] = delegateId;
  }

  try {
    final res = await ApiService.get('/profile/kpis', queryParams: query.isNotEmpty ? query : null);
    if (res is Map<String, dynamic>) {
      return res;
    }
  } catch (_) {
    try {
      final res2 = await ApiService.get('/orders/kpis', queryParams: query.isNotEmpty ? query : null);
      if (res2 is Map<String, dynamic>) {
        return res2;
      }
    } catch (_) {}
  }
  return <String, dynamic>{};
});

final performanceProvider = Provider<PerformanceData>((ref) {
  final asyncKpis = ref.watch(rawProfileKpisProvider);
  final kpis = asyncKpis.value;
  if (kpis != null && kpis.isNotEmpty) {
    return PerformanceData.fromJson(kpis);
  }
  return const PerformanceData(
    performancePercent: 0,
    performanceLabel: 'Non défini',
    monthlyTarget: 0,
    monthlyAchieved: 0,
    todayOrders: 0,
    commissions: 0,
    hasObjective: false,
    monthName: 'Ce mois',
  );
});

final statisticsProvider = Provider<ProfileStatistics>((ref) {
  final asyncKpis = ref.watch(rawProfileKpisProvider);
  final kpis = asyncKpis.value;
  if (kpis != null && kpis.isNotEmpty) {
    return ProfileStatistics.fromJson(kpis);
  }
  return const ProfileStatistics(
    totalOrders: 0,
    totalRevenue: 0,
    activeClients: 0,
    successRate: 0,
  );
});

final systemStatusProvider = Provider<SystemStatus>((ref) {
  final asyncKpis = ref.watch(rawProfileKpisProvider);
  final isLoaded = asyncKpis.hasValue && asyncKpis.value != null && asyncKpis.value!.isNotEmpty;
  return SystemStatus(
    apiOnline: isLoaded || !asyncKpis.hasError,
    socketOnline: true,
    databaseOnline: isLoaded,
    lastSync: const Duration(seconds: 10),
    appVersion: '1.0.0',
  );
});

final settingsProvider =
    NotifierProvider<SettingsNotifier, AppSettings>(SettingsNotifier.new);

class SettingsNotifier extends Notifier<AppSettings> {
  @override
  AppSettings build() => mockSettings;

  void toggleDarkMode() {
    state = state.copyWith(darkMode: !state.darkMode);
  }

  void toggleNotifications() {
    state = state.copyWith(notificationsEnabled: !state.notificationsEnabled);
  }

  void toggleBiometric() {
    state = state.copyWith(biometricEnabled: !state.biometricEnabled);
  }
}
