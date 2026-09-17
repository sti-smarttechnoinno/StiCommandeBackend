import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/fcm_service.dart';
import '../providers/notifications_provider.dart';
import '../widgets/notifications_header.dart';
import '../widgets/notification_statistics.dart';
import '../widgets/notification_filters.dart';
import '../widgets/notification_list.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  StreamSubscription? _fcmSubscription;

  @override
  void initState() {
    super.initState();
    // Real-time live reload when FCM push arrives in foreground
    _fcmSubscription = FcmService.onMessageReceived.listen((_) {
      if (mounted) {
        ref.read(notificationsProvider.notifier).loadRealNotifications();
      }
    });
  }

  @override
  void dispose() {
    _fcmSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          top: true,
          bottom: false,
          child: RefreshIndicator(
            onRefresh: () => ref.read(notificationsProvider.notifier).loadRealNotifications(),
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              slivers: [
                // Header
                const NotificationsHeader(),

                const SliverToBoxAdapter(
                    child: SizedBox(height: AppConstants.xxl)),

                // Statistics
                const NotificationStatistics(),

                const SliverToBoxAdapter(
                    child: SizedBox(height: AppConstants.xl)),

                // Filters
                const NotificationFilters(),

                const SliverToBoxAdapter(
                    child: SizedBox(height: AppConstants.lg)),

                // Notification list
                const NotificationList(),

                const SliverToBoxAdapter(
                  child: SizedBox(
                    height: AppConstants.bottomNavHeight + AppConstants.xxl,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
