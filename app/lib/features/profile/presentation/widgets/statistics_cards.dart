import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/profile_provider.dart';

class StatisticsCards extends ConsumerWidget {
  const StatisticsCards({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(statisticsProvider);

    String formatCurrency(double amount) {
      if (amount >= 1000000) {
        return '${(amount / 1000000).toStringAsFixed(1)}M DA';
      } else if (amount >= 1000) {
        return '${(amount / 1000).toStringAsFixed(1)}K DA';
      } else {
        return '${amount.toStringAsFixed(0)} DA';
      }
    }

    final items = [
      _StatItem(
        icon: Icons.receipt_long_rounded,
        label: 'Commandes Totales',
        value: stats.totalOrders.toString(),
        trend: stats.ordersTrend,
        trendUp: stats.ordersTrendUp,
        color: AppColors.primary,
      ),
      _StatItem(
        icon: Icons.account_balance_wallet_rounded,
        label: 'Chiffre d\'affaires',
        value: formatCurrency(stats.totalRevenue),
        trend: stats.revenueTrend,
        trendUp: stats.revenueTrendUp,
        color: AppColors.success,
      ),
      _StatItem(
        icon: Icons.people_rounded,
        label: 'Clients Actifs',
        value: stats.activeClients.toString(),
        trend: stats.clientsTrend,
        trendUp: stats.clientsTrendUp,
        color: AppColors.info,
      ),
      _StatItem(
        icon: Icons.gps_fixed_rounded,
        label: 'Taux de réussite',
        value: '${stats.successRate.toStringAsFixed(0)}%',
        trend: stats.successTrend,
        trendUp: stats.successTrendUp,
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

class _StatItem {
  final IconData icon;
  final String label;
  final String value;
  final String trend;
  final bool trendUp;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.trend,
    required this.trendUp,
    required this.color,
  });
}

class _StatCard extends StatelessWidget {
  final _StatItem item;

  const _StatCard({required this.item});

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
                  color: item.color.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(item.icon, color: item.color, size: 16),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      item.trendUp
                          ? Icons.trending_up_rounded
                          : Icons.trending_down_rounded,
                      size: 9,
                      color: AppColors.success,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      item.trend,
                      style: const TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
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
