import 'dart:convert';
import 'dart:io';
import '../network/api_service.dart';

class SessionStorage {
  static File _getSessionFile() {
    final tempDir = Directory.systemTemp;
    return File('${tempDir.path}/sti_user_session.json');
  }

  static Future<void> saveSession(Map<String, dynamic> user, String token) async {
    try {
      final file = _getSessionFile();
      final payload = {
        'user': user,
        'token': token,
        'savedAt': DateTime.now().toIso8601String(),
      };
      await file.writeAsString(jsonEncode(payload));
      ApiService.setTokens(accessToken: token);
    } catch (_) {}
  }

  static Future<Map<String, dynamic>?> loadSession() async {
    try {
      final file = _getSessionFile();
      if (await file.exists()) {
        final content = await file.readAsString();
        final decoded = jsonDecode(content);
        if (decoded is Map<String, dynamic> && decoded['user'] != null) {
          final token = decoded['token'] as String? ?? '';
          if (token.isNotEmpty) {
            ApiService.setTokens(accessToken: token);
          }
          return decoded;
        }
      }
    } catch (_) {}
    return null;
  }

  static Future<void> clearSession() async {
    try {
      final file = _getSessionFile();
      if (await file.exists()) {
        await file.delete();
      }
      ApiService.setTokens(accessToken: null);
    } catch (_) {}
  }
}
