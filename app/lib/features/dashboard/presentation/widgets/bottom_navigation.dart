import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';

import 'dashboard_fab.dart';

class AppBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final VoidCallback? onFabPressed;

  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.onFabPressed,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      const _NavItemData(
        icon: Icons.home_outlined,
        activeIcon: Icons.home_rounded,
        label: 'Accueil',
      ),
      const _NavItemData(
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long_rounded,
        label: 'Commandes',
      ),
      const _NavItemData(
        icon: Icons.add_rounded,
        activeIcon: Icons.add_rounded,
        label: '',
      ),
      const _NavItemData(
        icon: Icons.people_outline,
        activeIcon: Icons.people_rounded,
        label: 'Clients',
      ),
      const _NavItemData(
        icon: Icons.person_outline,
        activeIcon: Icons.person_rounded,
        label: 'Profil',
      ),
    ];

    const double fabOverlap = 14.0;
    final double totalHeight = AppConstants.bottomNavHeight + fabOverlap;

    return SizedBox(
      height: totalHeight,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          // Bottom Navbar Container
          Container(
            height: AppConstants.bottomNavHeight,
            padding: const EdgeInsets.symmetric(horizontal: AppConstants.md),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(12),
                  blurRadius: 20,
                  offset: const Offset(0, -4),
                  spreadRadius: 0,
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: List.generate(items.length, (index) {
                  final item = items[index];
                  final isActive = index == currentIndex;
                  final isCenter = index == 2;

                  if (isCenter) {
                    return const Expanded(child: SizedBox());
                  }

                  return Expanded(
                    child: GestureDetector(
                      onTap: () => onTap(index),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isActive ? item.activeIcon : item.icon,
                            color: isActive
                                ? AppColors.primary
                                : AppColors.textTertiary,
                            size: 22,
                          ),
                          const SizedBox(height: 3),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                item.label,
                                maxLines: 1,
                                softWrap: false,
                                style: AppTypography.bottomNavLabel.copyWith(
                                  color: isActive
                                      ? AppColors.primary
                                      : AppColors.textTertiary,
                                  fontWeight:
                                      isActive ? FontWeight.w600 : FontWeight.w400,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),

          // Central FAB docked directly in the navbar
          Positioned(
            top: 0,
            child: DashboardFAB(
              onPressed: onFabPressed ?? () => onTap(2),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItemData {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItemData({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
