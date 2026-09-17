import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Render UI immediately so the native splash screen icon is dismissed without delay
  runApp(const ProviderScope(child: StiApp()));

  // Initialize Firebase Cloud Messaging (FCM) asynchronously in background
  unawaited(FcmService.initialize());
}

class StiApp extends StatelessWidget {
  const StiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'STI Distribution',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: appRouter,
    );
  }
}
