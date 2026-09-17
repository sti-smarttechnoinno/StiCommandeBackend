import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/orders_history_provider.dart';

class OrdersStatistics extends ConsumerWidget {
  const OrdersStatistics({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(ordersStatisticsProvider);

    return SizedBox(
      height: 108,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        physics: const BouncingScrollPhysics(),
        children: [
          _StatCard(
            label: 'Total Commandes',
            value: '${stats.total}',
            icon: Icons.receipt_long_rounded,
            color: AppColors.primary,
            bgColor: AppColors.primary.withAlpha(15),
            delay: 100,
          ),
          const SizedBox(width: 10),
          _StatCard(
            label: 'En attente',
            value: '${stats.pending}',
            icon: Icons.schedule_rounded,
            color: AppColors.warning,
            bgColor: AppColors.warning.withAlpha(15),
            delay: 140,
          ),
          const SizedBox(width: 10),
          _StatCard(
            label: 'Validées',
            value: '${stats.approved}',
            icon: Icons.check_circle_outline_rounded,
            color: AppColors.success,
            bgColor: AppColors.success.withAlpha(15),
            delay: 180,
          ),
          const SizedBox(width: 10),
          _StatCard(
            label: 'Montant Total',
            value: _formatAmount(stats.totalAmount),
            icon: Icons.account_balance_wallet_rounded,
            color: AppColors.info,
            bgColor: AppColors.info.withAlpha(15),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 15),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textTertiary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: delay), duration: 300.ms)
        .slideX(
            begin: 0.1,
            end: 0,
            delay: Duration(milliseconds: delay),
            duration: 300.ms);
  }
}
