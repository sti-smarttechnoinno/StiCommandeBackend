import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/clients_provider.dart';

class StatisticsCards extends ConsumerWidget {
  const StatisticsCards({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(clientsStatisticsProvider);

    return SizedBox(
      height: 98,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        physics: const BouncingScrollPhysics(),
        children: [
          _StatCard(
            label: 'Total Clients',
            value: '${stats.total}',
            icon: Icons.people_alt_rounded,
            color: AppColors.primary,
            bgColor: AppColors.primary.withAlpha(15),
            delay: 100,
          ),
          const SizedBox(width: 10),
          _StatCard(
            label: 'Clients Actifs',
            value: '${stats.active}',
            icon: Icons.verified_user_rounded,
            color: AppColors.success,
            bgColor: AppColors.success.withAlpha(15),
            delay: 140,
          ),
          const SizedBox(width: 10),
          _StatCard(
            label: 'Commandes (Aujourd\'hui)',
            value: '${stats.todayOrders}',
            icon: Icons.shopping_bag_rounded,
            color: AppColors.info,
            bgColor: AppColors.info.withAlpha(15),
            delay: 180,
          ),
          const SizedBox(width: 10),
          _StatCard(
            label: 'Volume d\'affaires',
            value: _formatAmount(stats.totalRevenue),
            icon: Icons.account_balance_wallet_rounded,
            color: AppColors.purple,
            bgColor: AppColors.purple.withAlpha(15),
            delay: 220,
          ),
        ],
      ),
    );
  }

  String _formatAmount(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M DA';
    }
    if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K DA';
    }
    return '${amount.toStringAsFixed(0)} DA';
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final int delay;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 142,
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
                  color: bgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                label,
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
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: delay), duration: 300.ms)
        .slideY(
            begin: 0.08,
            end: 0,
            delay: Duration(milliseconds: delay),
            duration: 300.ms);
  }
}
