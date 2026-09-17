import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../domain/entities/notification.dart';
import '../../data/datasources/mock_notifications.dart';

// All notifications
final notificationsProvider =
    NotifierProvider<NotificationsNotifier, List<AppNotification>>(
        NotificationsNotifier.new);

class NotificationsNotifier extends Notifier<List<AppNotification>> {
  @override
  List<AppNotification> build() {
    loadRealNotifications();
    return List.from(mockNotifications);
  }

  Future<void> loadRealNotifications() async {
    try {
      final res = await ApiService.get('/notifications', queryParams: {'pageSize': '50'});
      if (res is Map<String, dynamic> && res['data'] is List) {
        final rawList = res['data'] as List;
        if (rawList.isNotEmpty) {
          final items = rawList
              .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
              .toList();
          state = items;
        }
      }
    } catch (_) {
      // Retain current state or mock on offline
    }
  }

  void markAsRead(String id) {
    state = [
      for (final n in state)
        if (n.id == id) n.copyWith(isRead: true) else n,
    ];
    try {
      ApiService.put('/notifications/$id/read');
    } catch (_) {}
  }

  void markAllAsRead() {
    state = [for (final n in state) n.copyWith(isRead: true)];
    try {
      ApiService.post('/notifications/read-all');
    } catch (_) {}
  }

  /// Optimistically add a synthetic unread notification from a foreground FCM message.
  /// This ensures the badge count updates instantly before the API re-fetch completes.
  void handleForegroundNotification(RemoteMessage message) {
    final data = message.data;
    final title = message.notification?.title ??
        data['title']?.toString() ??
        data['header']?.toString() ??
        'New Notification';
    final body = message.notification?.body ??
        data['body']?.toString() ??
        data['message']?.toString() ??
        data['description']?.toString() ??
        '';

    final syntheticId = 'fcm_${DateTime.now().millisecondsSinceEpoch}';

    final syntheticNotification = AppNotification(
      id: syntheticId,
      title: title,
      description: body,
      type: NotificationType.systemAnnouncement,
      isRead: false,
      createdAt: DateTime.now(),
      referenceId: data['order_id']?.toString() ?? data['client_id']?.toString(),
    );

    // Prepend so it appears at the top
    state = [syntheticNotification, ...state];
  }

  void togglePin(String id) {
    state = [
      for (final n in state)
        if (n.id == id) n.copyWith(isPinned: !n.isPinned) else n,
    ];
  }

  void deleteNotification(String id) {
    state = state.where((n) => n.id != id).toList();
    try {
      ApiService.delete('/notifications/$id');
    } catch (_) {}
  }
}

// Unread count
final unreadCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.where((n) => !n.isRead).length;
});

// Today count
final todayCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  final today = DateTime.now();
  return notifications
      .where((n) =>
          n.createdAt.year == today.year &&
          n.createdAt.month == today.month &&
          n.createdAt.day == today.day)
      .length;
});

// This week count
final weekCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider);
  final now = DateTime.now();
  final weekAgo = now.subtract(const Duration(days: 7));
  return notifications.where((n) => n.createdAt.isAfter(weekAgo)).length;
});

// Search
final notificationSearchProvider = StateProvider<String>((ref) => '');

// Filter
final notificationFilterProvider =
    StateProvider<NotificationFilter>((ref) => NotificationFilter.all);

// Grouped notifications
final groupedNotificationsProvider = Provider<Map<String, List<AppNotification>>>((ref) {
  final notifications = ref.watch(notificationsProvider);
  final query = ref.watch(notificationSearchProvider).toLowerCase();
  final filter = ref.watch(notificationFilterProvider);

  var filtered = notifications;

  // Filter by category
  if (filter != NotificationFilter.all) {
    filtered = filtered.where((n) {
      switch (filter) {
        case NotificationFilter.unread:
          return !n.isRead;
        case NotificationFilter.orders:
          return n.category == NotificationCategory.orders;
        case NotificationFilter.clients:
          return n.category == NotificationCategory.clients;
        case NotificationFilter.inventory:
          return n.category == NotificationCategory.inventory;
        case NotificationFilter.system:
          return n.category == NotificationCategory.system;
        case NotificationFilter.security:
          return n.category == NotificationCategory.security;
        case NotificationFilter.all:
          return true;
      }
    }).toList();
  }

  // Search
  if (query.isNotEmpty) {
    filtered = filtered.where((n) {
      return n.title.toLowerCase().contains(query) ||
          n.description.toLowerCase().contains(query) ||
          (n.referenceNumber?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  // Sort: pinned first, then by date
  filtered.sort((a, b) {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.compareTo(a.createdAt);
  });

  // Group by date
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final yesterday = today.subtract(const Duration(days: 1));
  final weekAgo = today.subtract(const Duration(days: 7));

  final groups = <String, List<AppNotification>>{};

  for (final n in filtered) {
    final date = DateTime(n.createdAt.year, n.createdAt.month, n.createdAt.day);
    String key;

    if (!date.isBefore(today)) {
      key = 'Aujourd\'hui';
    } else if (!date.isBefore(yesterday)) {
      key = 'Hier';
    } else if (!date.isBefore(weekAgo)) {
      key = 'Il y a 7 jours';
    } else {
      key = 'Plus tôt';
    }

    groups.putIfAbsent(key, () => []).add(n);
  }

  return groups;
});
