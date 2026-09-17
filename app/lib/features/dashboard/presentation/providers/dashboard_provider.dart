import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/storage/session_storage.dart';
import '../../domain/models/dashboard_models.dart';

class DashboardState {
  final double balance;
  final int monthlyOrdersCount;
  final ObjectiveData objective;
  final DashboardStats stats;
  final List<Order> recentOrders;
  final bool isLoading;
  final bool isInitialLoading;
  final bool balanceVisible;

  const DashboardState({
    this.balance = 0.0,
    this.monthlyOrdersCount = 0,
    this.objective = const ObjectiveData(),
    required this.stats,
    required this.recentOrders,
    this.isLoading = false,
    this.isInitialLoading = true,
    this.balanceVisible = true,
  });

  DashboardState copyWith({
    double? balance,
    int? monthlyOrdersCount,
    ObjectiveData? objective,
    DashboardStats? stats,
    List<Order>? recentOrders,
    bool? isLoading,
    bool? isInitialLoading,
    bool? balanceVisible,
  }) {
    return DashboardState(
      balance: balance ?? this.balance,
      monthlyOrdersCount: monthlyOrdersCount ?? this.monthlyOrdersCount,
      objective: objective ?? this.objective,
      stats: stats ?? this.stats,
      recentOrders: recentOrders ?? this.recentOrders,
      isLoading: isLoading ?? this.isLoading,
      isInitialLoading: isInitialLoading ?? this.isInitialLoading,
      balanceVisible: balanceVisible ?? this.balanceVisible,
    );
  }
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final Ref? ref;

  DashboardNotifier([this.ref])
      : super(
          const DashboardState(
            isInitialLoading: true,
            objective: ObjectiveData(),
            stats: DashboardStats(
              pendingOrders: 0,
              validatedOrders: 0,
              deliveringOrders: 0,
              productsOrdered: 0,
            ),
            recentOrders: [],
          ),
        ) {
    loadRealData();
  }

  Future<void> loadRealData() async {
    state = state.copyWith(isLoading: true);
    try {
      // 1. Fetch KPIs, Balance & Objective
      final kpiRes = await ApiService.get('/orders/kpis');
      if (kpiRes is Map<String, dynamic>) {
        final balanceVal = (kpiRes['balance'] as num?)?.toDouble() ?? 0.0;
        final monthlyOrders = (kpiRes['monthlyOrdersCount'] as num?)?.toInt() ?? 0;
        final stats = DashboardStats.fromJson(kpiRes);

        ObjectiveData objective = state.objective;
        if (kpiRes['objective'] is Map<String, dynamic>) {
          objective = ObjectiveData.fromJson(kpiRes['objective'] as Map<String, dynamic>);
        }

        state = state.copyWith(
          balance: balanceVal,
          monthlyOrdersCount: monthlyOrders,
          stats: stats,
          objective: objective,
        );
      }

      // 2. Fetch Recent Orders
      final ordersRes = await ApiService.get('/orders', queryParams: {'pageSize': '5'});
      if (ordersRes is Map<String, dynamic> && ordersRes['data'] is List) {
        final rawList = ordersRes['data'] as List;
        final ordersList = rawList
            .map((item) => Order.fromJson(item as Map<String, dynamic>))
            .toList();
        state = state.copyWith(recentOrders: ordersList);
      }

      // 3. Fetch Delegate-Specific Objective & Current Month Balance
      try {
        final sessionData = await SessionStorage.loadSession();
        final user = sessionData?['user'] as Map<String, dynamic>?;
        final delegateId = user?['id']?.toString() ?? user?['delegate_id']?.toString() ?? '3';

        final objRes = await ApiService.get('/delegates/$delegateId/objectives');
        if (objRes is Map<String, dynamic> && objRes['currentMonth'] is Map<String, dynamic>) {
          final currentMonthJson = objRes['currentMonth'] as Map<String, dynamic>;
          final objective = ObjectiveData.fromJson(currentMonthJson);
          final currentMonthBalance = (currentMonthJson['achievedRevenue'] as num?)?.toDouble();
          final currentMonthOrders = (currentMonthJson['achievedOrders'] as num?)?.toInt();

          state = state.copyWith(
            objective: objective,
            balance: currentMonthBalance ?? state.balance,
            monthlyOrdersCount: currentMonthOrders ?? state.monthlyOrdersCount,
          );
        }
      } catch (_) {
        // Retain KPI objective
      }
    } catch (_) {
      // Retain current state on error
    } finally {
      state = state.copyWith(isLoading: false, isInitialLoading: false);
    }
  }

  void toggleBalanceVisibility() {
    state = state.copyWith(balanceVisible: !state.balanceVisible);
  }
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  return DashboardNotifier(ref);
});
