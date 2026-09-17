import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';

class DashboardHeader extends ConsumerWidget {
  const DashboardHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final userName = authState.user?['name'] as String? ?? 'Délégué';
    final role = authState.user?['role'] as String? ?? 'Délégué';
    final region = authState.user?['region'] as String? ?? '';
    final unreadCount = ref.watch(unreadCountProvider);

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppConstants.xl,
          AppConstants.md,
          AppConstants.xl,
          AppConstants.xl,
        ),
        child: Row(
          children: [
            // Logo
            Container(
              width: AppConstants.logoSize,
              height: AppConstants.logoSize,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(40),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: Image.asset(
                  'assets/images/logo-sti.png',
                  fit: BoxFit.contain,
                ),
              ),
            )
                .animate()
                .fadeIn(delay: 0.ms, duration: 300.ms)
                .slideX(begin: -0.1, end: 0),

            const SizedBox(width: AppConstants.md),

            // Greeting
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour,',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    userName,
                    style: AppTypography.cardTitle,
                  ),
                  Text(
                    region.isNotEmpty ? '$role • $region' : role,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              )
                  .animate()
                  .fadeIn(delay: 80.ms, duration: 300.ms)
                  .slideX(begin: -0.05, end: 0),
            ),

            // Notification Bubble
            _IconBubble(
              icon: Icons.notifications_outlined,
              badgeCount: unreadCount,
              onTap: () => context.push('/notifications'),
            )
                .animate()
                .fadeIn(delay: 160.ms, duration: 300.ms)
                .slideX(begin: 0.1, end: 0),
          ],
        ),
      ),
    );
  }
}

class _IconBubble extends StatelessWidget {
  final IconData icon;
  final int? badgeCount;
  final VoidCallback? onTap;

  const _IconBubble({
    required this.icon,
    this.badgeCount,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final count = badgeCount ?? 0;
    final displayCount = count > 99 ? '99+' : '$count';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(8),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            Icon(icon, size: 22, color: AppColors.textPrimary),
            if (count > 0)
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                  constraints: const BoxConstraints(
                    minWidth: 18,
                    minHeight: 18,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.surface, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withAlpha(80),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      displayCount,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w900,
                        height: 1.0,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
