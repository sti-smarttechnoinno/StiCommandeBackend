abstract final class AppConstants {
  // API Server Configuration (Local Wi-Fi Network IP)
  static const String serverIp = '192.168.1.109';
  static const String serverPort = '8000';
  static const String apiBaseUrl = 'http://$serverIp:$serverPort/api';

  // Spacing
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;

  // Border Radius
  static const double radiusSm = 12;
  static const double radiusMd = 16;
  static const double radiusLg = 20;
  static const double radiusXl = 22;
  static const double radiusXxl = 26;

  // Elevation
  static const double elevationNone = 0;
  static const double elevationSm = 2;
  static const double elevationMd = 4;
  static const double elevationLg = 8;

  // Card Heights
  static const double balanceCardHeight = 180;
  static const double appBarHeight = 110;
  static const double bottomNavHeight = 74;
  static const double fabSize = 52;

  // Animation
  static const int animDurationMs = 300;
  static const int animDelayStepMs = 80;

  // Logo
  static const double logoSize = 60;
}
