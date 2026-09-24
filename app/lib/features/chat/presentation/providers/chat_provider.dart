import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/services/fcm_service.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../domain/models/chat_models.dart';

/// Provider for list of all available chat contacts
final chatContactsProvider =
    StateNotifierProvider<ChatContactsNotifier, AsyncValue<List<ChatContact>>>((ref) {
  return ChatContactsNotifier();
});

class ChatContactsNotifier extends StateNotifier<AsyncValue<List<ChatContact>>> {
  Timer? _pollingTimer;
  StreamSubscription? _fcmSubscription;

  ChatContactsNotifier() : super(const AsyncValue.loading()) {
    loadContacts();
    _startPolling();
    _listenToFcm();
  }

  void _listenToFcm() {
    _fcmSubscription = FcmService.onMessageReceived.listen((msg) {
      if (msg.data['type'] == 'chat_message') {
        loadContacts(silent: true);
      }
    });
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      loadContacts(silent: true);
    });
  }

  @override
  void dispose() {
    _fcmSubscription?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> loadContacts({bool silent = false}) async {
    if (!silent && state.value == null) {
      state = const AsyncValue.loading();
    }
    try {
      final res = await ApiService.get('/chat/contacts');
      if (res is Map<String, dynamic> && res['contacts'] is List) {
        final list = (res['contacts'] as List)
            .map((c) => ChatContact.fromJson(c as Map<String, dynamic>))
            .toList();
        state = AsyncValue.data(list);
      }
    } catch (e, st) {
      if (!silent || state.value == null) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  void markContactRead(int contactId) {
    state.whenData((contacts) {
      state = AsyncValue.data(
        contacts.map((c) {
          if (c.id == contactId) {
            return ChatContact(
              id: c.id,
              name: c.name,
              username: c.username,
              email: c.email,
              phone: c.phone,
              role: c.role,
              department: c.department,
              region: c.region,
              wilaya: c.wilaya,
              isOnline: c.isOnline,
              lastSeenAt: c.lastSeenAt,
              conversationId: c.conversationId,
              unreadCount: 0,
              latestMessage: c.latestMessage != null
                  ? ChatMessageSnippet(
                      id: c.latestMessage!.id,
                      body: c.latestMessage!.body,
                      senderId: c.latestMessage!.senderId,
                      isRead: true,
                      readAt: DateTime.now(),
                      createdAt: c.latestMessage!.createdAt,
                    )
                  : null,
            );
          }
          return c;
        }).toList(),
      );
    });
  }
}

/// Provider computing total unread messages count across all chat contacts
final chatUnreadCountProvider = Provider<int>((ref) {
  final contactsAsync = ref.watch(chatContactsProvider);
  return contactsAsync.maybeWhen(
    data: (contacts) => contacts.fold<int>(0, (sum, c) => sum + c.unreadCount),
    orElse: () => 0,
  );
});

/// Provider for messages inside a specific conversation
final chatMessagesProvider = StateNotifierProvider.family<ChatMessagesNotifier,
    AsyncValue<List<ChatMessage>>, int>((ref, conversationId) {
  final authState = ref.watch(authProvider);
  final currentUserId = int.tryParse(authState.user?['id']?.toString() ?? '0') ?? 0;
  return ChatMessagesNotifier(conversationId, currentUserId, ref);
});

class ChatMessagesNotifier extends StateNotifier<AsyncValue<List<ChatMessage>>> {
  final int conversationId;
  final int currentUserId;
  final Ref ref;
  Timer? _pollingTimer;
  StreamSubscription? _fcmSubscription;

  ChatMessagesNotifier(this.conversationId, this.currentUserId, this.ref)
      : super(const AsyncValue.loading()) {
    loadMessages();
    _startPolling();
    _listenToFcm();
  }

  void _listenToFcm() {
    _fcmSubscription = FcmService.onMessageReceived.listen((msg) {
      if (msg.data['type'] == 'chat_message') {
        final convId = int.tryParse(msg.data['conversation_id']?.toString() ?? '');
        if (convId == conversationId) {
          loadMessages(silent: true);
        }
      }
    });
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      loadMessages(silent: true);
    });
  }

  @override
  void dispose() {
    _fcmSubscription?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> loadMessages({bool silent = false}) async {
    if (!silent && state.value == null) {
      state = const AsyncValue.loading();
    }
    try {
      final res = await ApiService.get('/chat/conversations/$conversationId/messages');
      if (res is Map<String, dynamic> && res['messages'] is List) {
        final list = (res['messages'] as List)
            .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
            .toList();

        state = AsyncValue.data(list);

        // Check if there are unread messages received from partner
        final hasUnread = list.any((m) => m.senderId != currentUserId && !m.isRead);
        if (hasUnread) {
          markAsRead();
        }
      }
    } catch (e, st) {
      if (!silent || state.value == null) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  Future<void> markAsRead() async {
    try {
      await ApiService.put('/chat/conversations/$conversationId/read');
      // Mark incoming messages as read in local state
      state.whenData((msgs) {
        final now = DateTime.now();
        state = AsyncValue.data(
          msgs.map((m) {
            if (m.senderId != currentUserId && !m.isRead) {
              return m.copyWith(isRead: true, readAt: now);
            }
            return m;
          }).toList(),
        );
      });
    } catch (_) {}
  }

  Future<bool> sendMessage(String body) async {
    final trimmed = body.trim();
    if (trimmed.isEmpty) return false;

    final tempId = DateTime.now().millisecondsSinceEpoch;
    final optimistic = ChatMessage(
      id: tempId,
      conversationId: conversationId,
      senderId: currentUserId,
      body: trimmed,
      isRead: false,
      createdAt: DateTime.now(),
      isOptimistic: true,
    );

    // Optimistic addition
    state.whenData((msgs) {
      state = AsyncValue.data([...msgs, optimistic]);
    });

    try {
      final res = await ApiService.post(
        '/chat/conversations/$conversationId/messages',
        body: {'body': trimmed},
      );

      if (res is Map<String, dynamic> && res['message'] is Map<String, dynamic>) {
        final saved = ChatMessage.fromJson(res['message'] as Map<String, dynamic>);
        state.whenData((msgs) {
          state = AsyncValue.data(
            msgs.map((m) => m.id == tempId ? saved : m).toList(),
          );
        });
        // Also refresh contacts list
        ref.read(chatContactsProvider.notifier).loadContacts(silent: true);
        return true;
      }
    } catch (e) {
      // Remove optimistic message on failure
      state.whenData((msgs) {
        state = AsyncValue.data(msgs.where((m) => m.id != tempId).toList());
      });
    }
    return false;
  }
}

/// Helper provider to get or create direct conversation ID with a specific user
final directConversationIdProvider = FutureProvider.family<int, int>((ref, userId) async {
  // First check if contacts list already has an active conversationId for this user
  final contacts = ref.read(chatContactsProvider).valueOrNull;
  final found = contacts?.where((c) => c.id == userId).firstOrNull;
  if (found != null && found.conversationId != null) {
    return found.conversationId!;
  }

  final res = await ApiService.post('/chat/conversations/direct/$userId');
  if (res is Map<String, dynamic> && res['conversation'] is Map<String, dynamic>) {
    final conv = res['conversation'] as Map<String, dynamic>;
    final convId = conv['id'] is int ? conv['id'] as int : int.tryParse(conv['id'].toString()) ?? 0;
    // Refresh contacts to register conversationId
    ref.read(chatContactsProvider.notifier).loadContacts(silent: true);
    return convId;
  }
  throw Exception('Impossible d\'ouvrir la conversation');
});

