import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';

class NotificationEmptyState extends StatelessWidget {
  final VoidCallback onRefresh;

  const NotificationEmptyState({super.key, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.infoLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: AppColors.info,
                size: 50,
              ),
            ).animate().scale(
                  begin: const Offset(0.8, 0.8),
                  end: const Offset(1, 1),
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeOut,
                ),
            const SizedBox(height: AppConstants.xxl),
            Text(
              'Aucune notification',
              style: AppTypography.headlineSmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ).animate().fadeIn(
                  delay: const Duration(milliseconds: 200),
                  duration: const Duration(milliseconds: 300),
                ),
            const SizedBox(height: AppConstants.sm),
            Text(
              'Vous êtes à jour. Aucune notification à afficher.',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ).animate().fadeIn(
                  delay: const Duration(milliseconds: 300),
                  duration: const Duration(milliseconds: 300),
                ),
            const SizedBox(height: AppConstants.xxl),
            FilledButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: const Text('Rafraîchir'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ).animate().fadeIn(
                  delay: const Duration(milliseconds: 400),
                  duration: const Duration(milliseconds: 300),
                ),
          ],
        ),
      ),
    );
  }
}
