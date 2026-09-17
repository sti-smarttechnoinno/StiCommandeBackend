import 'dart:convert';
import 'dart:io';
import '../config/app_config.dart';

class ApiService {
  static String? _accessToken;
  static String? _refreshToken;

  static void setTokens({String? accessToken, String? refreshToken}) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
  }

  static String? get accessToken => _accessToken;
  static String? get refreshToken => _refreshToken;

  static Future<dynamic> get(String endpoint, {Map<String, String>? queryParams}) async {
    return _sendRequest('GET', endpoint, queryParams: queryParams);
  }

  static Future<dynamic> post(String endpoint, {dynamic body}) async {
    return _sendRequest('POST', endpoint, body: body);
  }

  static Future<dynamic> put(String endpoint, {dynamic body}) async {
    return _sendRequest('PUT', endpoint, body: body);
  }

  static Future<dynamic> delete(String endpoint) async {
    return _sendRequest('DELETE', endpoint);
  }

  static Future<dynamic> _sendRequest(
    String method,
    String endpoint, {
    Map<String, String>? queryParams,
    dynamic body,
  }) async {
    final candidateUrls = AppConfig.candidateBaseUrls;

    for (final baseUrl in candidateUrls) {
      try {
        final client = HttpClient();
        client.connectionTimeout = Duration(milliseconds: AppConfig.timeoutMs);

        String fullPath = '$baseUrl$endpoint';
        if (queryParams != null && queryParams.isNotEmpty) {
          final queryStr = Uri(queryParameters: queryParams).query;
          fullPath += '?$queryStr';
        }

        final uri = Uri.parse(fullPath);
        late HttpClientRequest request;

        switch (method.toUpperCase()) {
          case 'POST':
            request = await client.postUrl(uri);
            break;
          case 'PUT':
            request = await client.putUrl(uri);
            break;
          case 'DELETE':
            request = await client.deleteUrl(uri);
            break;
          case 'GET':
          default:
            request = await client.getUrl(uri);
            break;
        }

        // Security headers (same as web frontend api.ts)
        request.headers.set('Accept', 'application/json');
        request.headers.set('Content-Type', 'application/json');

        if (_accessToken != null && _accessToken!.isNotEmpty) {
          request.headers.set('Authorization', 'Bearer $_accessToken');
        }

        if (body != null) {
          request.write(json.encode(body));
        }

        final response = await request.close();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final responseBody = await response.transform(utf8.decoder).join();
          if (responseBody.isEmpty) return null;
          return json.decode(responseBody);
        } else if (response.statusCode == 401) {
          // Token expired handling - attempt refresh
          final refreshed = await _tryTokenRefresh(baseUrl);
          if (refreshed) {
            return await _sendRequest(method, endpoint, queryParams: queryParams, body: body);
          }
        }
      } catch (_) {
        // Try next candidate base URL
      }
    }

    throw Exception('API Request Failed: Unable to reach backend server ($endpoint)');
  }

  static Future<bool> _tryTokenRefresh(String baseUrl) async {
    if (_refreshToken == null || _refreshToken!.isEmpty) return false;
    try {
      final client = HttpClient();
      final uri = Uri.parse('$baseUrl/auth/refresh');
      final request = await client.postUrl(uri);
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      request.write(json.encode({'refreshToken': _refreshToken}));

      final response = await request.close();
      if (response.statusCode == 200) {
        final bodyStr = await response.transform(utf8.decoder).join();
        final decoded = json.decode(bodyStr);
        if (decoded is Map<String, dynamic> && decoded['accessToken'] != null) {
          _accessToken = decoded['accessToken'] as String;
          if (decoded['refreshToken'] != null) {
            _refreshToken = decoded['refreshToken'] as String;
          }
          return true;
        }
      }
    } catch (_) {}
    return false;
  }
}
