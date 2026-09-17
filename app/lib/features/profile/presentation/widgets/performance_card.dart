import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/profile_provider.dart';

class PerformanceCard extends ConsumerWidget {
  const PerformanceCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final perf = ref.watch(performanceProvider);

    String formatCurrency(double amount) {
      if (amount >= 1000000) {
        return '${(amount / 1000000).toStringAsFixed(1)}M DA';
      } else if (amount >= 1000) {
        return '${(amount / 1000).toStringAsFixed(1)}K DA';
      } else {
        return '${amount.toStringAsFixed(0)} DA';
      }
    }

    final hasObj = perf.hasObjective && perf.monthlyTarget > 0;
    final targetVal = hasObj ? perf.monthlyTarget : 1.0;
    final progressVal = (perf.monthlyAchieved / targetVal).clamp(0.0, 1.0);
    final percentAchieved = hasObj
        ? ((perf.monthlyAchieved / perf.monthlyTarget) * 100).toInt()
        : 0;

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border.withAlpha(50)),
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
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: hasObj
                        ? AppColors.success.withAlpha(15)
                        : const Color(0xFFF59E0B).withAlpha(18),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Icon(
                    hasObj ? Icons.insights_rounded : Icons.flag_outlined,
                    color: hasObj ? AppColors.success : const Color(0xFFD97706),
                    size: 17,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Performance Commerciale',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: hasObj
                        ? AppColors.successLight
                        : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: hasObj
                          ? AppColors.success.withAlpha(40)
                          : const Color(0xFFFDE68A),
                    ),
                  ),
                  child: Text(
                    hasObj ? perf.performanceLabel : 'Non défini',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: hasObj
                          ? AppColors.success
                          : const Color(0xFFB45309),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            if (hasObj) ...[
              // Circular progress + stats
              Row(
                children: [
                  CircularPercentIndicator(
                    radius: 42,
                    lineWidth: 7,
                    percent: (perf.performancePercent / 100).clamp(0.0, 1.0),
                    animation: true,
                    animationDuration: 1000,
                    center: Text(
                      '${perf.performancePercent.toInt()}%',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    progressColor: AppColors.success,
                    backgroundColor: AppColors.successLight,
                    circularStrokeCap: CircularStrokeCap.round,
                  ),
                  const SizedBox(width: 16),

                  // Right side stats
                  Expanded(
                    child: Column(
                      children: [
                        _PerfStat(
                          label: 'Aujourd\'hui',
                          value: '${perf.todayOrders} commandes',
                          icon: Icons.receipt_long_rounded,
                          color: AppColors.info,
                        ),
                        const SizedBox(height: 8),
                        _PerfStat(
                          label: 'Commissions',
                          value: formatCurrency(perf.commissions),
                          icon: Icons.payments_rounded,
                          color: AppColors.success,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Monthly target
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Objectif ${perf.monthName}',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        '${formatCurrency(perf.monthlyAchieved)} / ${formatCurrency(perf.monthlyTarget)}',
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progressVal,
                      minHeight: 6,
                      backgroundColor: AppColors.primaryLight.withAlpha(30),
                      valueColor:
                          const AlwaysStoppedAnimation(AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '$percentAchieved% atteint',
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (perf.targetOrders > 0)
                        Text(
                          '${perf.achievedOrders} / ${perf.targetOrders} cmd',
                          style: const TextStyle(
                            fontSize: 10.5,
                            color: AppColors.textTertiary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ] else ...[
              // Feedback View: Objective not set yet
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: const Color(0xFFFDE68A),
                    width: 1,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withAlpha(30),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.info_outline_rounded,
                        color: Color(0xFFD97706),
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Objectif mensuel non encore défini',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF92400E),
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            "L'administration n'a pas encore configuré votre objectif pour ce mois. Vos ventes et commissions restent comptabilisées en temps réel.",
                            style: TextStyle(
                              fontSize: 11,
                              height: 1.35,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFFB45309),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Real performance metrics in 2x2 grid
              Row(
                children: [
                  Expanded(
                    child: _PerfStat(
                      label: 'Ventes du mois',
                      value: formatCurrency(perf.monthlyAchieved),
                      icon: Icons.trending_up_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _PerfStat(
                      label: 'Commissions',
                      value: formatCurrency(perf.commissions),
                      icon: Icons.payments_rounded,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _PerfStat(
                      label: "Aujourd'hui",
                      value: '${perf.todayOrders} cmd',
                      icon: Icons.receipt_long_rounded,
                      color: AppColors.info,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _PerfStat(
                      label: 'Total mois',
                      value: '${perf.achievedOrders} cmd',
                      icon: Icons.inventory_2_outlined,
                      color: AppColors.purple,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PerfStat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _PerfStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: color.withAlpha(10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(25)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 10.5,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
