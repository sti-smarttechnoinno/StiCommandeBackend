import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/notification.dart';
import '../providers/notifications_provider.dart';

class NotificationFilters extends ConsumerWidget {
  const NotificationFilters({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(notificationFilterProvider);

    final filters = [
      _FilterData(label: 'Tout', filter: NotificationFilter.all),
      _FilterData(label: 'Non lues', filter: NotificationFilter.unread),
      _FilterData(label: 'Commandes', filter: NotificationFilter.orders),
      _FilterData(label: 'Clients', filter: NotificationFilter.clients),
      _FilterData(label: 'Inventaire', filter: NotificationFilter.inventory),
      _FilterData(label: 'Système', filter: NotificationFilter.system),
      _FilterData(label: 'Sécurité', filter: NotificationFilter.security),
    ];

    return SliverToBoxAdapter(
      child: SizedBox(
        height: 36,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: filters.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final item = filters[index];
            final isActive = current == item.filter;
            return _FilterChip(
              label: item.label,
              isActive: isActive,
              onTap: () => ref.read(notificationFilterProvider.notifier).state =
                  item.filter,
            ).animate().fadeIn(
                  delay: Duration(milliseconds: 250 + index * 40),
                  duration: const Duration(milliseconds: 200),
                );
          },
        ),
      ),
    );
  }
}

class _FilterData {
  final String label;
  final NotificationFilter filter;

  const _FilterData({required this.label, required this.filter});
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive
                ? AppColors.primary
                : AppColors.border.withAlpha(60),
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(40),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isActive ? Colors.white : AppColors.textSecondary,
              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}
