import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/widgets.dart';
import '../network/api_service.dart';
import '../shared/widgets/in_app_notification_banner.dart';
import '../utils/notification_translations.dart';
import 'fcm_service.dart';

/// Real-time foreground notification sync service
/// Guarantees instant foreground toast & live screen update without manual reload
class NotificationRealtimeService with WidgetsBindingObserver {
  static final NotificationRealtimeService instance =
      NotificationRealtimeService._internal();

  NotificationRealtimeService._internal();

  Timer? _syncTimer;
  bool _isListening = false;
  bool _isAppInForeground = true;
  final Set<String> _seenNotificationIds = <String>{};
  bool _isFirstCheck = true;

  void start() {
    if (!_isListening) {
      WidgetsBinding.instance.addObserver(this);
      _isListening = true;
    }

    _isFirstCheck = true;
    _checkNewNotifications();

    _syncTimer?.cancel();
    // Fast polling in foreground (every 3 seconds) for instant response
    _syncTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (_isAppInForeground) {
        _checkNewNotifications();
      }
    });
  }

  void stop() {
    _syncTimer?.cancel();
    _syncTimer = null;
    _seenNotificationIds.clear();
    _isFirstCheck = true;

    if (_isListening) {
      WidgetsBinding.instance.removeObserver(this);
      _isListening = false;
    }
  }

  /// Mark notification as already shown (e.g. from FCM directly) to prevent duplicate toast
  void markAsSeen(String id) {
    _seenNotificationIds.add(id);
  }

  Future<void> _checkNewNotifications() async {
    try {
      final res = await ApiService.get('/notifications', queryParams: {
        'pageSize': '5',
        'status': 'unread',
      });

      if (res is Map<String, dynamic> && res['data'] is List) {
        final list = res['data'] as List;

        // On first run, register existing IDs so we only alert on newly created notifications
        if (_isFirstCheck) {
          for (final item in list) {
            if (item is Map<String, dynamic> && item['id'] != null) {
              _seenNotificationIds.add(item['id'].toString());
            }
          }
          _isFirstCheck = false;
          return;
        }

        // Check for new notifications
        for (final item in list) {
          if (item is! Map<String, dynamic>) continue;
          final id = item['id']?.toString() ?? '';
          if (id.isEmpty || _seenNotificationIds.contains(id)) continue;

          _seenNotificationIds.add(id);

          final title = item['title']?.toString() ?? 'Notification';
          final body = item['description']?.toString() ?? item['body']?.toString() ?? '';
          final category = item['category']?.toString() ?? 'system';
          final module = item['module']?.toString() ?? '';
          final refId = item['reference_id']?.toString() ?? '';

          developer.log('Realtime new notification detected: $title - $body', name: 'NotifSync');

          final dataPayload = <String, dynamic>{
            'id': id,
            'title': title,
            'body': body,
            'category': category,
            'type': module.toLowerCase().contains('objective') || category == 'objective'
                ? 'monthly_objective'
                : ((category == 'orders' || module.toLowerCase().contains('order') || title.toLowerCase().contains('order') || title.toLowerCase().contains('commande'))
                    ? 'order_submitted'
                    : 'broadcast_message'),
            'reference_id': refId,
          };

          // Trigger live broadcast to reload providers across the app
          FcmService.emitDirectMessage(dataPayload);

          final localized = NotificationLocalizer.localize(
            type: dataPayload['type'] as String?,
            rawTitle: title,
            rawBody: body,
            data: dataPayload,
          );

          // Display the in-app top toast immediately
          InAppNotificationBanner.show(
            title: localized.title,
            message: localized.body,
            actionLabel: localized.actionLabel,
            icon: dataPayload['type'] == 'monthly_objective'
                ? const IconData(0xf470, fontFamily: 'MaterialIcons')
                : (dataPayload['type'] == 'order_submitted'
                    ? const IconData(0xe0af, fontFamily: 'MaterialIcons') // assignment_turned_in
                    : const IconData(0xe44f, fontFamily: 'MaterialIcons')),
            onTap: () => FcmService.handleDataNavigation(dataPayload),
          );
        }
      }
    } catch (_) {
      // Offline or transient network
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    _isAppInForeground = (state == AppLifecycleState.resumed);

    if (_isAppInForeground) {
      _checkNewNotifications();
    }
  }
}
