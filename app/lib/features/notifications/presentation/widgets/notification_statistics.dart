import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/notifications_provider.dart';

class NotificationStatistics extends ConsumerWidget {
  const NotificationStatistics({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final total = ref.watch(notificationsProvider).length;
    final unread = ref.watch(unreadCountProvider);
    final today = ref.watch(todayCountProvider);
    final week = ref.watch(weekCountProvider);

    final items = [
      _StatData(
        icon: Icons.notifications_rounded,
        label: 'Total',
        value: total,
        color: AppColors.info,
      ),
      _StatData(
        icon: Icons.circle,
        label: 'Non lues',
        value: unread,
        color: AppColors.danger,
      ),
      _StatData(
        icon: Icons.check_circle_rounded,
        label: 'Aujourd\'hui',
        value: today,
        color: AppColors.success,
      ),
      _StatData(
        icon: Icons.schedule_rounded,
        label: 'Cette semaine',
        value: week,
        color: AppColors.purple,
      ),
    ];

    return SliverToBoxAdapter(
      child: SizedBox(
        height: 98,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          physics: const BouncingScrollPhysics(),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (context, index) {
            final item = items[index];
            return _StatCard(item: item)
                .animate()
                .fadeIn(
                  delay: Duration(milliseconds: 200 + index * 40),
                  duration: const Duration(milliseconds: 300),
                )
                .slideX(
                  begin: 0.08,
                  end: 0,
                  delay: Duration(milliseconds: 200 + index * 40),
                  duration: const Duration(milliseconds: 300),
                );
          },
        ),
      ),
    );
  }
}

class _StatData {
  final IconData icon;
  final String label;
  final int value;
  final Color color;

  const _StatData({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
}

class _StatCard extends StatelessWidget {
  final _StatData item;

  const _StatCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 138,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withAlpha(60)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: item.color.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(item.icon, color: item.color, size: 16),
              ),
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: item.color,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${item.value}',
                style: const TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                item.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
