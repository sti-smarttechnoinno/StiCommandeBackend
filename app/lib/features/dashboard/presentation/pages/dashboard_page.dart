import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/fcm_service.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';
import '../../../orders/presentation/providers/orders_history_provider.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/balance_card.dart';
import '../widgets/objective_card.dart';
import '../widgets/quick_actions_section.dart';
import '../widgets/statistics_section.dart';
import '../widgets/recent_orders_section.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  StreamSubscription? _fcmSubscription;

  @override
  void initState() {
    super.initState();
    _subscribeToFcm();
  }

  void _subscribeToFcm() {
    _fcmSubscription?.cancel();
    _fcmSubscription = FcmService.onMessageReceived.listen((message) {
      if (!mounted) return;

      // 1. Optimistically add notification to state for instant badge update
      ref.read(notificationsProvider.notifier).handleForegroundNotification(message);

      // 2. Re-fetch real data from API in background
      ref.read(dashboardProvider.notifier).loadRealData();
      ref.read(notificationsProvider.notifier).loadRealNotifications();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Re-subscribe if stream was lost (e.g. after navigation pop)
    if (_fcmSubscription == null || _fcmSubscription!.isPaused) {
      _subscribeToFcm();
    }
  }

  @override
  void dispose() {
    _fcmSubscription?.cancel();
    _fcmSubscription = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait<void>([
          ref.read(dashboardProvider.notifier).loadRealData(),
          ref.read(notificationsProvider.notifier).loadRealNotifications(),
          ref.read(ordersProvider.notifier).refresh(),
        ]);
      },
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          const DashboardHeader(),
          const SliverToBoxAdapter(
              child: SizedBox(height: AppConstants.sm)),
          const BalanceCard(),
          const SliverToBoxAdapter(
              child: SizedBox(height: AppConstants.md)),
          const ObjectiveCard(),
          const SliverToBoxAdapter(
              child: SizedBox(height: AppConstants.xl)),
          const QuickActionsSection(),
          const SliverToBoxAdapter(
              child: SizedBox(height: AppConstants.xxl)),
          const StatisticsSection(),
          const SliverToBoxAdapter(
              child: SizedBox(height: AppConstants.xxl)),
          const RecentOrdersSection(),
          SliverToBoxAdapter(
            child: SizedBox(
              height: AppConstants.bottomNavHeight + AppConstants.xxl,
            ),
          ),
        ],
      ),
    );
  }
}
