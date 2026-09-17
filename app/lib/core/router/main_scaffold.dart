import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../../features/dashboard/presentation/widgets/bottom_navigation.dart';

class MainScaffold extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainScaffold({
    super.key,
    required this.navigationShell,
  });

  int _getBottomNavIndex(int branchIndex) {
    switch (branchIndex) {
      case 0:
        return 0; // Dashboard
      case 1:
        return 1; // Orders
      case 2:
        return 3; // Clients
      case 3:
        return 4; // Profile
      default:
        return 0;
    }
  }

  void _onBottomNavTap(BuildContext context, int navIndex) {
    switch (navIndex) {
      case 0:
        navigationShell.goBranch(0, initialLocation: navigationShell.currentIndex == 0);
        break;
      case 1:
        navigationShell.goBranch(1, initialLocation: navigationShell.currentIndex == 1);
        break;
      case 3:
        navigationShell.goBranch(2, initialLocation: navigationShell.currentIndex == 2);
        break;
      case 4:
        navigationShell.goBranch(3, initialLocation: navigationShell.currentIndex == 3);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final navIndex = _getBottomNavIndex(navigationShell.currentIndex);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          top: true,
          bottom: false,
          child: Stack(
            children: [
              // Shell view (Dashboard, Orders, Clients, Profile)
              navigationShell,

              // Shared persistent Bottom Navigation Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: AppBottomNav(
                  currentIndex: navIndex,
                  onTap: (index) => _onBottomNavTap(context, index),
                  onFabPressed: () {
                    context.push('/orders/new');
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
