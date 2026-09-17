class AppConfig {
  static const String defaultApiBaseUrl = 'http://192.168.1.83:8000/api';
  static const int defaultTimeoutMs = 15000;

  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL', defaultValue: defaultApiBaseUrl);
    return fromEnv.isNotEmpty ? fromEnv : defaultApiBaseUrl;
  }

  static int get timeoutMs {
    return const int.fromEnvironment('API_TIMEOUT', defaultValue: defaultTimeoutMs);
  }

  // Host candidate list for fallback discovery (supports Android emulator, physical device SM-A546E, & localhost)
  static List<String> get candidateBaseUrls => [
        apiBaseUrl,
        'http://192.168.1.109:8000/api',
        'http://10.0.2.2:8000/api',
        'http://localhost:8000/api',
        'http://127.0.0.1:8000/api',
      ];
}
