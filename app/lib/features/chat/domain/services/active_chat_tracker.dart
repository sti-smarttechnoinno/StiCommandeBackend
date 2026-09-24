import 'package:flutter/foundation.dart';

/// Tracks the interlocutor currently being viewed in the chat conversation screen.
/// Used to suppress in-app heads-up notification banners so they don't block
/// the screen when the user is already engaged in active conversation with that person.
class ActiveChatTracker {
  ActiveChatTracker._();

  static final ValueNotifier<int?> _activeUserNotifier = ValueNotifier<int?>(null);

  /// ValueNotifier for listening to active chat partner changes
  static ValueListenable<int?> get activeUserListenable => _activeUserNotifier;

  /// Currently open chat interlocutor ID
  static int? get activeChatUserId => _activeUserNotifier.value;

  /// Mark user as actively viewing conversation with [userId]
  static void setViewing(int userId) {
    _activeUserNotifier.value = userId;
  }

  /// Clear active viewing state if current partner matches [userId]
  static void clearViewing(int userId) {
    if (_activeUserNotifier.value == userId) {
      _activeUserNotifier.value = null;
    }
  }

  /// Check whether the user is currently viewing the conversation with [userId]
  static bool isViewing(int? userId) {
    if (userId == null) return false;
    return _activeUserNotifier.value == userId;
  }
}
