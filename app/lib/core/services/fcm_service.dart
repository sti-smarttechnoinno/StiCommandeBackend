import 'dart:async';
import 'dart:developer' as developer;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../firebase_options.dart';
import '../network/api_service.dart';
import '../storage/session_storage.dart';
import '../router/app_router.dart';
import '../shared/widgets/in_app_notification_banner.dart';
import '../shared/widgets/instagram_chat_banner.dart';
import '../../features/chat/domain/services/active_chat_tracker.dart';
import '../utils/notification_translations.dart';

/// Top-level background message handler for FCM
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (_) {
    // If already initialized
  }
  developer.log(
    'FCM Background message received: ${message.messageId} - ${message.notification?.title}',
    name: 'FCMService',
  );

  // If the message does not have a native notification payload (pure data message),
  // show it using local notifications so the user always receives it in background
  try {
    if (message.notification == null && message.data.isNotEmpty) {
      final type = message.data['type']?.toString();
      final isChat = type == 'chat_message';
      final title = isChat
          ? (message.data['sender_name']?.toString() ?? 'Nouveau message')
          : (message.data['title']?.toString() ?? 'STI Commande');
      final body = isChat
          ? (message.data['message_body']?.toString() ??
              message.data['body']?.toString() ??
              '')
          : (message.data['body']?.toString() ??
              message.data['message']?.toString() ??
              message.data['description']?.toString() ??
              '');
      if (body.isNotEmpty || title.isNotEmpty) {
        final localNotifications = FlutterLocalNotificationsPlugin();
        const androidDetails = AndroidNotificationDetails(
          'sti_notifications_channel',
          'STI Notifications',
          channelDescription: 'Notifications from STI Commande',
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          color: Color(0xFFD71920),
          playSound: true,
          enableVibration: true,
        );
        const details = NotificationDetails(android: androidDetails);
        await localNotifications.show(
          DateTime.now().millisecondsSinceEpoch ~/ 1000,
          title,
          body,
          details,
          payload: isChat
              ? 'chat_message:${message.data['sender_id']}'
              : (type ?? ''),
        );
      }
    }
  } catch (e) {
    developer.log('Error showing local notification in background: $e', name: 'FCMService');
  }
}

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static bool _localNotificationsInitialized = false;
  static String? _fcmToken;

  /// Real-time stream of incoming foreground push notifications for state refresh
  static final StreamController<RemoteMessage> _messageStreamController =
      StreamController<RemoteMessage>.broadcast();
  static Stream<RemoteMessage> get onMessageReceived =>
      _messageStreamController.stream;

  /// Current device FCM token
  static String? get token => _fcmToken;

  /// Initialize Firebase & FCM service
  static Future<void> initialize() async {
    try {
      // 1. Initialize Firebase App safely
      try {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        ).timeout(const Duration(seconds: 4));
      } catch (e) {
        // Fallback for native platform config
        try {
          await Firebase.initializeApp().timeout(const Duration(seconds: 3));
        } catch (_) {}
      }

      // 2. Register background message handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 2b. Initialize local notifications & ensure Android notification channel exists
      await _initializeLocalNotifications();

      // 3. Request user permissions (iOS & Android 13+) without aborting prompt prematurely
      try {
        final settings = await _messaging.requestPermission(
          alert: true,
          announcement: false,
          badge: true,
          carPlay: false,
          criticalAlert: false,
          provisional: false,
          sound: true,
        );

        developer.log(
          'FCM Authorization status: ${settings.authorizationStatus}',
          name: 'FCMService',
        );
      } catch (e) {
        developer.log('FCM Permission request error: $e', name: 'FCMService');
      }

      // 4. Foreground notification presentation options
      try {
        await _messaging.setForegroundNotificationPresentationOptions(
          alert: true,
          badge: true,
          sound: true,
        );
      } catch (_) {}

      // 5. Setup message listeners early
      _setupMessageHandlers();

      // 6. Retrieve FCM Device Token in background (non-blocking)
      unawaited(_retrieveToken());

      // 7. Listen to Token refresh events
      _messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        developer.log('FCM Token refreshed: $newToken', name: 'FCMService');
        unawaited(syncTokenWithBackend(newToken));
      });

      // 8. Subscribe to general delegate topic in background
      unawaited(_subscribeToDefaultTopics());
    } catch (e, stack) {
      developer.log('FCM Initialization error: $e', error: e, stackTrace: stack, name: 'FCMService');
    }
  }

  /// Subscribe to default topics with resilient timeout guard
  static Future<void> _subscribeToDefaultTopics() async {
    try {
      await _messaging.subscribeToTopic('sti_delegates').timeout(const Duration(seconds: 15));
      await _messaging.subscribeToTopic('all_orders').timeout(const Duration(seconds: 15));
    } catch (e) {
      developer.log('Topic subscription error (offline/timeout): $e', name: 'FCMService');
    }
  }

  /// Initialize flutter_local_notifications for Android channel + foreground fallback
  static Future<void> _initializeLocalNotifications() async {
    if (_localNotificationsInitialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        final payload = details.payload;
        if (payload != null && payload.startsWith('chat_message:')) {
          final senderId = payload.substring('chat_message:'.length);
          if (senderId.isNotEmpty) {
            appRouter.push('/chat/$senderId');
          } else {
            appRouter.push('/chat');
          }
        }
      },
    );

    // Create the Android notification channel with MAX importance for heads-up & background
    const androidChannel = AndroidNotificationChannel(
      'sti_notifications_channel',
      'STI Notifications',
      description: 'Notifications from STI Commande',
      importance: Importance.max,
      enableVibration: true,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    _localNotificationsInitialized = true;
    developer.log('Local notifications & Android channel initialized with Importance.max', name: 'FCMService');
  }

  /// Retrieve device token with automatic retry if needed
  static Future<String?> _retrieveToken() async {
    try {
      _fcmToken = await _messaging
          .getToken()
          .timeout(const Duration(seconds: 3));
      if (_fcmToken != null) {
        developer.log('FCM Device Token: $_fcmToken', name: 'FCMService');
        unawaited(syncTokenWithBackend(_fcmToken!));
      } else {
        // Retry after a brief delay for slow Google Play Services initialization
        Future.delayed(const Duration(seconds: 4), () async {
          try {
            _fcmToken = await _messaging
                .getToken()
                .timeout(const Duration(seconds: 3));
            if (_fcmToken != null) {
              developer.log('FCM Device Token (retry): $_fcmToken', name: 'FCMService');
              unawaited(syncTokenWithBackend(_fcmToken!));
            }
          } catch (_) {}
        });
      }
      return _fcmToken;
    } catch (e) {
      developer.log('Failed to get FCM token (offline/timeout): $e', name: 'FCMService');
      return null;
    }
  }

  /// Synchronize FCM device token and phone system language with backend
  static Future<void> syncTokenWithBackend(String token) async {
    try {
      final session = await SessionStorage.loadSession();
      final user = session?['user'] as Map<String, dynamic>?;
      final userId = user?['id']?.toString();
      final phoneLocale = NotificationLocalizer.phoneLanguageCode;

      // Subscribe to common notification topics safely with reasonable timeout
      try {
        await _messaging.subscribeToTopic('sti_delegates').timeout(const Duration(seconds: 10));
        await _messaging.subscribeToTopic('all_orders').timeout(const Duration(seconds: 10));
        if (user?['region'] != null) {
          final cleanRegion = user!['region'].toString().replaceAll(' ', '_').toLowerCase();
          await _messaging.subscribeToTopic('region_$cleanRegion').timeout(const Duration(seconds: 10));
        }
      } catch (_) {}

      // Send to backend with strict 4s timeout so candidate URLs loop never delays app
      await ApiService.post('/notifications/fcm-token', body: {
        'fcm_token': token,
        'user_id': userId,
        'locale': phoneLocale,
        'platform': defaultTargetPlatform.name,
      }).timeout(const Duration(seconds: 4));
      developer.log('FCM Token & locale ($phoneLocale) synced with backend', name: 'FCMService');
    } catch (e) {
      // Backend sync error or offline
    }
  }

  /// Setup foreground, background and terminated message listeners
  static void _setupMessageHandlers() {
    // 1. Foreground messages: display in-app top toast bar with phone language localization
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final data = message.data;
      final type = data['type'] as String?;

      // Emit event for real-time provider / UI reload across the entire app
      _messageStreamController.add(message);

      // Special handling for chat messages (Instagram-style heads-up banner)
      if (type == 'chat_message') {
        final senderId = int.tryParse(data['sender_id']?.toString() ?? '');
        final senderName = data['sender_name']?.toString() ??
            message.notification?.title ??
            'Message STI';
        final senderRole = data['sender_role']?.toString();
        final senderAvatar = data['sender_avatar']?.toString();
        final messageBody = data['message_body']?.toString() ??
            message.notification?.body ??
            data['body']?.toString() ??
            'Nouveau message';

        // Check smart suppression: if user is currently looking at this conversation, do NOT show banner!
        if (senderId != null && ActiveChatTracker.isViewing(senderId)) {
          developer.log(
            'Chat banner suppressed: user is already active in conversation with $senderId',
            name: 'FCMService',
          );
          return;
        }

        developer.log(
          'Displaying InstagramChatBanner for message from $senderName ($senderId)',
          name: 'FCMService',
        );

        InstagramChatBanner.show(
          senderId: senderId ?? 0,
          senderName: senderName,
          senderRole: senderRole,
          avatarUrl: senderAvatar,
          message: messageBody,
          onTap: () => _handleNotificationNavigation(data),
        );
        return;
      }

      final rawTitle = message.notification?.title ??
          data['title']?.toString() ??
          data['header']?.toString();

      final rawBody = message.notification?.body ??
          data['body']?.toString() ??
          data['message']?.toString() ??
          data['description']?.toString();

      final localized = NotificationLocalizer.localize(
        type: type,
        rawTitle: rawTitle,
        rawBody: rawBody,
        data: data,
      );

      developer.log(
        'FCM Foreground message received (${NotificationLocalizer.phoneLanguageCode}): ${localized.title} - ${localized.body}',
        name: 'FCMService',
      );

      IconData bannerIcon = Icons.notifications_active_rounded;
      if (type == 'monthly_objective' || type == 'objective') {
        bannerIcon = Icons.track_changes_rounded;
      } else if (type == 'order_validated' || type == 'order_approved') {
        bannerIcon = Icons.check_circle_rounded;
      } else if (type == 'order_partially_validated') {
        bannerIcon = Icons.published_with_changes_rounded;
      } else if (type == 'order_cancelled') {
        bannerIcon = Icons.cancel_rounded;
      } else if (type == 'order_submitted' || type == 'order_created') {
        bannerIcon = Icons.assignment_turned_in_rounded;
      } else if (type == 'task_created' ||
          type == 'task_updated' ||
          type == 'task_status_changed' ||
          type == 'task_assigned' ||
          type == 'task' ||
          (type?.startsWith('task') ?? false) ||
          (type?.startsWith('mission') ?? false)) {
        bannerIcon = Icons.task_alt_rounded;
      }

      InAppNotificationBanner.show(
        title: localized.title,
        message: localized.body,
        actionLabel: localized.actionLabel,
        icon: bannerIcon,
        onTap: () => _handleNotificationNavigation(data),
      );

      // Also show system tray notification as fallback (ensures visibility)
      _showSystemNotification(
        title: localized.title,
        body: localized.body,
        payload: type ?? '',
      );
    });

    // 2. Background tap / opened app
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      developer.log(
        'FCM Message clicked (App in background): ${message.data}',
        name: 'FCMService',
      );
      _handleNotificationNavigation(message.data);
    });

    // 3. Terminated state tap / launch app from notification
    _messaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        developer.log(
          'FCM Message launched app (Terminated state): ${message.data}',
          name: 'FCMService',
        );
        _handleNotificationNavigation(message.data);
      }
    });
  }

  /// Show a system tray notification via flutter_local_notifications (fallback)
  static Future<void> _showSystemNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_localNotificationsInitialized) return;

    const androidDetails = AndroidNotificationDetails(
      'sti_notifications_channel',
      'STI Notifications',
      channelDescription: 'Notifications from STI Commande',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFFD71920),
    );
    const details = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(presentAlert: true, presentSound: true),
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Emit a notification event for live auto-refresh across all listening pages
  static void emitDirectMessage(Map<String, dynamic> data) {
    _messageStreamController.add(
      RemoteMessage(
        data: data,
        notification: RemoteNotification(
          title: data['title']?.toString(),
          body: data['body']?.toString(),
        ),
      ),
    );
  }

  /// Public handler for navigating to the concerned screen
  static void handleDataNavigation(Map<String, dynamic> data) {
    _handleNotificationNavigation(data);
  }

  /// Route user directly to the concerned page based on payload data
  static void _handleNotificationNavigation(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final orderId = data['order_id'] as String?;
    final clientId = data['client_id'] as String?;

    developer.log(
      'Handling push navigation for type: $type, orderId: $orderId, clientId: $clientId',
      name: 'FCMService',
    );

    final navContext = rootNavigatorKey.currentContext;
    if (navContext == null) return;

    if (type == 'chat_message') {
      final senderId = data['sender_id']?.toString();
      if (senderId != null && senderId.isNotEmpty) {
        appRouter.push('/chat/$senderId');
        return;
      }
      appRouter.push('/chat');
      return;
    } else if (type == 'task_created' ||
        type == 'task_updated' ||
        type == 'task_status_changed' ||
        type == 'task_assigned' ||
        type == 'task' ||
        (type?.startsWith('task') ?? false) ||
        (type?.startsWith('mission') ?? false)) {
      appRouter.push('/tasks');
      return;
    } else if (type == 'monthly_objective' || type == 'objective') {
      // Direct navigation to Dashboard focusing on the monthly objective card
    } else if (orderId != null &&
        orderId.isNotEmpty &&
        (type == 'order' ||
            type == 'order_validated' ||
            type == 'order_partially_validated' ||
            type == 'order_cancelled' ||
            type == 'order_submitted' ||
            type == 'order_created' ||
            (type?.startsWith('order') ?? false))) {
      appRouter.push('/orders/$orderId');
    } else if (type == 'client' && clientId != null) {
      appRouter.push('/clients/$clientId');
    } else {
      appRouter.push('/notifications');
    }
  }
}
