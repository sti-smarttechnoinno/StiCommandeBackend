import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../providers/notifications_provider.dart';
import 'notification_card.dart';

class NotificationList extends ConsumerWidget {
  const NotificationList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final grouped = ref.watch(groupedNotificationsProvider);

    if (grouped.isEmpty) {
      return const SliverFillRemaining(
        child: _EmptyNotifications(),
      );
    }

    final sections = grouped.entries.toList();

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          // Section headers
          int itemCount = 0;
          for (final entry in sections) {
            if (index == itemCount) {
              return _SectionHeader(title: entry.key);
            }
            itemCount++;
            for (int i = 0; i < entry.value.length; i++) {
              if (index == itemCount) {
                return NotificationCard(
                  notification: entry.value[i],
                  index: itemCount,
                );
              }
              itemCount++;
            }
          }
          return null;
        },
        childCount: _totalItemCount(sections),
      ),
    );
  }

  int _totalItemCount(List<MapEntry<String, List<dynamic>>> sections) {
    int count = 0;
    for (final entry in sections) {
      count += 1 + entry.value.length; // header + items
    }
    return count;
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppConstants.xl,
        AppConstants.lg,
        AppConstants.xl,
        AppConstants.sm,
      ),
      child: Text(
        title,
        style: AppTypography.bodySmall.copyWith(
          fontWeight: FontWeight.w600,
          color: AppColors.textTertiary,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.infoLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: AppColors.info,
                size: 40,
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
            ).animate().fadeIn(
                  delay: const Duration(milliseconds: 200),
                  duration: const Duration(milliseconds: 300),
                ),
            const SizedBox(height: AppConstants.sm),
            Text(
              'Vous êtes à jour.',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ).animate().fadeIn(
                  delay: const Duration(milliseconds: 300),
                  duration: const Duration(milliseconds: 300),
                ),
          ],
        ),
      ),
    );
  }
}
