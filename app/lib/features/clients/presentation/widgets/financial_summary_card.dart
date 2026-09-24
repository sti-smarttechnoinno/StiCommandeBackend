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
                  icon: Icons.account_balance_wallet_rounded,
                ),
              ),
              Expanded(
                child: _FinanceColumn(
                  label: 'Solde impayé',
                  value: _format(client.outstandingBalance),
                  color: client.outstandingBalance > 0 ? const Color(0xFFE11D48) : AppColors.success,
                  icon: Icons.receipt_long_rounded,
                ),
              ),
              Expanded(
                child: _FinanceColumn(
                  label: 'Limite crédit',
                  value: _format(client.creditLimit),
                  color: AppColors.info,
                  icon: Icons.credit_card_rounded,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Solde non payé (Impayé) detailed callout
          if (client.outstandingBalance > 0)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECDD3), width: 1),
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
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Color(0xFFE11D48),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.priority_high_rounded,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Solde Non Payé (Créance)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF9F1239),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE11D48).withAlpha(20),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'Impayé',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFFE11D48),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      const Text(
                        'Total restant dû :',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF881337),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        _formatAmount(client.outstandingBalance),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFE11D48),
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.success.withAlpha(12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.success.withAlpha(40), width: 1),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle_rounded, size: 16, color: AppColors.success),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Situation à jour : Aucun solde impayé',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                ],
              ),
            ),

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
                          'Dernier Encaissement',
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

                if ((client.lastPaymentAmount != null && client.lastPaymentAmount! > 0) || client.lastPaymentDate != null) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      const Text(
                        'Montant encaissé',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        _formatAmount(client.lastPaymentAmount ?? 0),
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

                  if ((client.lastPaymentReference != null && client.lastPaymentReference!.isNotEmpty) ||
                      (client.lastPaymentOrderNumber != null && client.lastPaymentOrderNumber!.isNotEmpty) ||
                      (client.lastPaymentAccount != null && client.lastPaymentAccount!.isNotEmpty)) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        if (client.lastPaymentOrderNumber != null && client.lastPaymentOrderNumber!.isNotEmpty)
                          Text(
                            'N° #${client.lastPaymentOrderNumber}',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textTertiary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        if (client.lastPaymentAccount != null && client.lastPaymentAccount!.isNotEmpty)
                          Text(
                            'Compte: ${client.lastPaymentAccount}',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textTertiary,
                            ),
                          ),
                        if (client.lastPaymentReference != null && client.lastPaymentReference!.isNotEmpty)
                          Text(
                            'Réf: ${client.lastPaymentReference}',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textTertiary,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                      ],
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
  final IconData icon;

  const _FinanceColumn({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withAlpha(22),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(
              icon,
              size: 20,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 8),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            style: AppTypography.headlineSmall.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              fontSize: 15,
            ),
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
