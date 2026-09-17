import 'package:flutter/material.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/client.dart';

class FinancialSummaryCard extends StatelessWidget {
  final Client client;

  const FinancialSummaryCard({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    final usagePercent = client.creditUsagePercent.clamp(0, 100) / 100;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withAlpha(50)),
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
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.account_balance_wallet_rounded,
                    color: AppColors.success, size: 15),
              ),
              const SizedBox(width: 8),
              const Text(
                'Résumé financier',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Three columns
          Row(
            children: [
              Expanded(
                child: _FinanceColumn(
                  label: 'Crédit dispo.',
                  value: _format(client.availableCredit),
                  color: AppColors.success,
                ),
              ),
              Expanded(
                child: _FinanceColumn(
                  label: 'Solde dû',
                  value: _format(client.outstandingBalance),
                  color: client.outstandingBalance > 0 ? AppColors.danger : AppColors.success,
                ),
              ),
              Expanded(
                child: _FinanceColumn(
                  label: 'Limite crédit',
                  value: _format(client.creditLimit),
                  color: AppColors.info,
                ),
              ),
            ],
          ),

          if (client.outstandingBalance > 0) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECDD3), width: 0.8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, size: 15, color: Color(0xFFE11D48)),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      'Créance en cours : ${_format(client.outstandingBalance)} restant dû',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF9F1239),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Progress bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Utilisation du crédit',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '${(usagePercent * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: usagePercent > 0.8
                          ? AppColors.danger
                          : AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              LinearPercentIndicator(
                padding: EdgeInsets.zero,
                lineHeight: 8,
                percent: usagePercent,
                backgroundColor: AppColors.border.withAlpha(80),
                linearGradient: LinearGradient(
                  colors: usagePercent > 0.8
                      ? [AppColors.danger, AppColors.danger]
                      : usagePercent > 0.5
                          ? [AppColors.warning, AppColors.warning]
                          : [AppColors.success, AppColors.success],
                ),
                barRadius: const Radius.circular(5),
                animation: false,
              ),
            ],
          ),

          const SizedBox(height: 16),
          Divider(height: 1, color: AppColors.border.withAlpha(60)),
          const SizedBox(height: 14),

          // Section: Dernier Règlement / Encaissement
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.success.withAlpha(8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.success.withAlpha(30)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: AppColors.success.withAlpha(20),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(
                            Icons.receipt_rounded,
                            size: 14,
                            color: AppColors.success,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Dernier Règlement',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    if (client.lastPaymentStatus != null && client.lastPaymentStatus!.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.success.withAlpha(20),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          client.lastPaymentStatus!,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),

                if (client.lastPaymentAmount != null && client.lastPaymentAmount! > 0) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      const Text(
                        'Montant payé',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        _formatAmount(client.lastPaymentAmount!),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.success,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (client.lastPaymentDate != null)
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, size: 12, color: AppColors.textTertiary),
                            const SizedBox(width: 4),
                            Text(
                              _formatDate(client.lastPaymentDate!),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        )
                      else
                        const SizedBox.shrink(),

                      if (client.lastPaymentMode != null && client.lastPaymentMode!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withAlpha(15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            client.lastPaymentMode!,
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                    ],
                  ),

                  if (client.lastPaymentReference != null && client.lastPaymentReference!.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      'Réf: ${client.lastPaymentReference}',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textTertiary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ] else ...[
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      'Aucun règlement récent enregistré pour ce client.',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],

                // Footer: Date de la dernière importation Excel
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.sync_rounded,
                      size: 11,
                      color: AppColors.textTertiary.withAlpha(150),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      client.lastImportDate != null
                          ? 'Dernière synchro import : ${_formatDateTime(client.lastImportDate!)}'
                          : 'Données issues du journal des encaissements',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textTertiary.withAlpha(180),
                      ),
                    ),
                  ],
                ),
              ],
            ),
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

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} à ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _format(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    }
    if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K';
    }
    return amount.toStringAsFixed(0);
  }
}

class _FinanceColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _FinanceColumn({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withAlpha(20),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '${value.substring(0, 1)}M',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: AppTypography.headlineSmall.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.textSecondary,
            fontSize: 11,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
