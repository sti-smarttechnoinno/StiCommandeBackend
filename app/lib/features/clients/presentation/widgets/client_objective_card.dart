import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/client.dart';

class ClientObjectiveCard extends StatelessWidget {
  final Client client;

  const ClientObjectiveCard({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    final obj = client.objective;
    final isSet = obj != null && obj.isSet;

    // When no objective is set, do not display the card and do not offer definition
    if (!isSet) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: obj.revenuePercentage >= 100
              ? const Color(0xFF22C55E).withAlpha(80)
              : AppColors.primary.withAlpha(50),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row (read-only, no definition/modification buttons)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: obj.revenuePercentage >= 100
                          ? const Color(0xFF22C55E).withAlpha(20)
                          : AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.track_changes_rounded,
                      size: 17,
                      color: obj.revenuePercentage >= 100
                          ? const Color(0xFF16A34A)
                          : AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Objectif commercial',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.2,
                        ),
                      ),
                      Text(
                        obj.monthName,
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: obj.revenuePercentage >= 100
                      ? const Color(0xFF22C55E).withAlpha(20)
                      : AppColors.primary.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: obj.revenuePercentage >= 100
                        ? const Color(0xFF22C55E).withAlpha(60)
                        : AppColors.primary.withAlpha(50),
                    width: 0.8,
                  ),
                ),
                child: Text(
                  obj.revenuePercentage >= 100 ? 'Atteint 🎉' : 'En cours',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: obj.revenuePercentage >= 100
                        ? const Color(0xFF16A34A)
                        : AppColors.primary,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Progress Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Progression du chiffre d\'affaires',
                style: TextStyle(
                  fontSize: 11.5,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '${obj.revenuePercentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: obj.revenuePercentage >= 100
                      ? const Color(0xFF16A34A)
                      : AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (obj.revenuePercentage / 100).clamp(0.0, 1.0),
              backgroundColor: AppColors.border.withAlpha(70),
              valueColor: AlwaysStoppedAnimation<Color>(
                obj.revenuePercentage >= 100
                    ? const Color(0xFF16A34A)
                    : AppColors.primary,
              ),
              minHeight: 8,
            ),
          ),

          const SizedBox(height: 12),

          // Metric Cards Row
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border.withAlpha(40)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _ObjectiveMetric(
                    label: 'Objectif CA',
                    value: _formatAmount(obj.targetRevenue),
                    color: AppColors.textPrimary,
                  ),
                ),
                Container(
                  width: 1,
                  height: 28,
                  color: AppColors.border.withAlpha(60),
                ),
                Expanded(
                  child: _ObjectiveMetric(
                    label: 'Réalisé',
                    value: _formatAmount(obj.achievedRevenue),
                    color: obj.revenuePercentage >= 100
                        ? const Color(0xFF16A34A)
                        : AppColors.primary,
                  ),
                ),
                if (obj.targetOrders > 0) ...[
                  Container(
                    width: 1,
                    height: 28,
                    color: AppColors.border.withAlpha(60),
                  ),
                  Expanded(
                    child: _ObjectiveMetric(
                      label: 'Commandes',
                      value: '${obj.achievedOrders} / ${obj.targetOrders}',
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Remaining to achieve banner
          if (obj.targetRevenue > obj.achievedRevenue)
            Row(
              children: [
                const Icon(
                  Icons.info_outline_rounded,
                  size: 13,
                  color: AppColors.textTertiary,
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    'Reste à réaliser : ${_formatAmount(obj.targetRevenue - obj.achievedRevenue)}',
                    style: const TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            )
          else
            const Row(
              children: [
                Icon(
                  Icons.check_circle_outline_rounded,
                  size: 13,
                  color: Color(0xFF16A34A),
                ),
                SizedBox(width: 5),
                Expanded(
                  child: Text(
                    'Objectif mensuel de chiffre d\'affaires dépassé avec succès !',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF16A34A),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  String _formatAmount(double amount) {
    final s = amount.toStringAsFixed(0);
    final reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    return '${s.replaceAllMapped(reg, (Match m) => '${m[1]} ')} DA';
  }
}

class _ObjectiveMetric extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _ObjectiveMetric({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.textTertiary,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 3),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ),
      ],
    );
  }
}
