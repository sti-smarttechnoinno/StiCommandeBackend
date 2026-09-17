import 'dart:convert';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/services/delegate_heartbeat_service.dart';
import '../../../../core/services/fcm_service.dart';
import '../../../../core/services/notification_realtime_service.dart';
import '../../../../core/storage/session_storage.dart';

enum AuthStatus { initial, loading, authenticated, error }

class AuthState {
  final AuthStatus status;
  final String? errorMessage;
  final bool rememberMe;
  final Map<String, dynamic>? user;
  final String? token;

  const AuthState({
    this.status = AuthStatus.initial,
    this.errorMessage,
    this.rememberMe = false,
    this.user,
    this.token,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? errorMessage,
    bool? rememberMe,
    Map<String, dynamic>? user,
    String? token,
  }) {
    return AuthState(
      status: status ?? this.status,
      errorMessage: errorMessage,
      rememberMe: rememberMe ?? this.rememberMe,
      user: user ?? this.user,
      token: token ?? this.token,
    );
  }

  String get delegateId =>
      user?['delegate_id']?.toString() ??
      user?['delegateId']?.toString() ??
      user?['id']?.toString() ??
      '';

  String get assignedRegion =>
      user?['region'] as String? ??
      user?['assigned_region'] as String? ??
      'Région Centre';

  List<String> get assignedWilayas {
    final rawWilayas = user?['assigned_wilayas'] ?? user?['wilayas'] ?? user?['assignedWilayas'];
    if (rawWilayas is List) {
      return rawWilayas.map((e) => e.toString()).toList();
    }
    return const [];
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _loadSavedSession();
  }

  Future<void> _loadSavedSession() async {
    final sessionData = await SessionStorage.loadSession();
    if (sessionData != null) {
      final user = sessionData['user'] as Map<String, dynamic>?;
      final token = sessionData['token'] as String?;

      // Only restore genuine authenticated backend sessions
      if (user != null && token != null && !token.startsWith('mock_') && !token.startsWith('sess_token_demo')) {
        ApiService.setTokens(accessToken: token);

        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          token: token,
          rememberMe: true,
        );

        final identifier = user['employee_id']?.toString() ??
            user['username']?.toString() ??
            user['email']?.toString() ??
            user['name']?.toString() ??
            '';
        if (identifier.isNotEmpty) {
          DelegateHeartbeatService.instance.start(identifier);
        }

        NotificationRealtimeService.instance.start();

        if (FcmService.token != null) {
          FcmService.syncTokenWithBackend(FcmService.token!);
        }
      } else {
        // Clear stale mock session
        await SessionStorage.clearSession();
      }
    }
  }

  Future<void> login(String username, String password) async {
    if (username.trim().isEmpty || password.isEmpty) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Veuillez remplir tous les champs obligatoires.',
      );
      return;
    }

    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);

    final String trimmedUsername = username.trim();

    final List<String> candidateBaseUrls = [
      'http://${AppConstants.serverIp}:${AppConstants.serverPort}/api',
      AppConfig.apiBaseUrl,
      ...AppConfig.candidateBaseUrls,
      'http://10.0.2.2:8000/api',
      'http://127.0.0.1:8000/api',
      'http://localhost:8000/api',
    ];

    // Deduplicate candidate URLs
    final uniqueCandidateUrls = candidateBaseUrls.toSet().toList();

    String? serverErrorMessage;
    bool reachedServer = false;

    for (final baseUrl in uniqueCandidateUrls) {
      try {
        final client = HttpClient();
        client.connectionTimeout = const Duration(seconds: 4);

        final request = await client.postUrl(Uri.parse('$baseUrl/auth/login'));
        request.headers.set('content-type', 'application/json');
        request.headers.set('accept', 'application/json');

        final body = jsonEncode({
          'username': trimmedUsername,
          'email': trimmedUsername,
          'login': trimmedUsername,
          'password': password,
        });

        request.add(utf8.encode(body));
        final response = await request.close();
        final responseBody = await response.transform(utf8.decoder).join();
        client.close();

        reachedServer = true;

        if (response.statusCode == 200) {
          final data = jsonDecode(responseBody);
          if (data is Map<String, dynamic> && data['user'] != null && data['token'] != null) {
            final user = data['user'] as Map<String, dynamic>;
            final token = data['token'] as String;

            ApiService.setTokens(accessToken: token);
            await SessionStorage.saveSession(user, token);

            state = state.copyWith(
              status: AuthStatus.authenticated,
              user: user,
              token: token,
              errorMessage: null,
            );

            // Sync device FCM push token with backend user record
            if (FcmService.token != null) {
              FcmService.syncTokenWithBackend(FcmService.token!);
            }

            final identifier = user['employee_id']?.toString() ??
                user['username']?.toString() ??
                user['email']?.toString() ??
                user['name']?.toString() ??
                trimmedUsername;
            DelegateHeartbeatService.instance.start(identifier);
            NotificationRealtimeService.instance.start();

            return; // Successfully authenticated
          }
        } else if (response.statusCode == 401 || response.statusCode == 422) {
          // Explicit authentication failure from backend database
          try {
            final data = jsonDecode(responseBody);
            final msg = data['message'] ??
                (data['errors'] is Map && (data['errors'] as Map).values.isNotEmpty
                    ? ((data['errors'] as Map).values.first as List?)?.first
                    : null);

            if (msg != null && msg.toString().contains('deactivated')) {
              serverErrorMessage = 'Votre compte utilisateur a été désactivé.';
            } else {
              serverErrorMessage = 'Identifiants ou mot de passe incorrects.';
            }
          } catch (_) {
            serverErrorMessage = 'Identifiants ou mot de passe incorrects.';
          }

          // Stop searching candidate URLs since the backend rejected the credentials
          break;
        }
      } catch (_) {
        // Continue attempting next candidate endpoint
      }
    }

    // Strict rejection - Zero mock fallback
    if (serverErrorMessage != null) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: serverErrorMessage,
      );
    } else if (reachedServer) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Identifiants ou mot de passe incorrects.',
      );
    } else {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Impossible de joindre le serveur backend. Vérifiez votre connexion.',
      );
    }
  }

  Future<void> logout() async {
    DelegateHeartbeatService.instance.stop();
    NotificationRealtimeService.instance.stop();
    ApiService.setTokens(accessToken: null, refreshToken: null);
    await SessionStorage.clearSession();
    state = const AuthState();
  }

  void toggleRememberMe() {
    state = state.copyWith(rememberMe: !state.rememberMe);
  }

  void reset() {
    DelegateHeartbeatService.instance.stop();
    NotificationRealtimeService.instance.stop();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
