import 'dart:async';
import 'package:flutter/widgets.dart';
import '../network/api_service.dart';

class DelegateHeartbeatService with WidgetsBindingObserver {
  static final DelegateHeartbeatService instance = DelegateHeartbeatService._internal();

  DelegateHeartbeatService._internal();

  Timer? _heartbeatTimer;
  String? _currentDelegateIdentifier;
  bool _isListening = false;

  void start(String delegateIdentifier) {
    _currentDelegateIdentifier = delegateIdentifier;

    if (!_isListening) {
      WidgetsBinding.instance.addObserver(this);
      _isListening = true;
    }

    _sendHeartbeat();

    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _sendHeartbeat();
    });
  }

  void stop() {
    _sendOfflineSignal();
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _currentDelegateIdentifier = null;

    if (_isListening) {
      WidgetsBinding.instance.removeObserver(this);
      _isListening = false;
    }
  }

  Future<void> _sendHeartbeat() async {
    if (_currentDelegateIdentifier == null || _currentDelegateIdentifier!.isEmpty) return;
    try {
      await ApiService.post('/delegates/heartbeat', body: {
        'identifier': _currentDelegateIdentifier,
      });
    } catch (_) {}
  }

  Future<void> _sendOfflineSignal() async {
    if (_currentDelegateIdentifier == null || _currentDelegateIdentifier!.isEmpty) return;
    try {
      await ApiService.post('/delegates/offline', body: {
        'identifier': _currentDelegateIdentifier,
      });
    } catch (_) {}
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    if (state == AppLifecycleState.resumed) {
      _sendHeartbeat();
    } else {
      _sendOfflineSignal();
    }
  }
}
