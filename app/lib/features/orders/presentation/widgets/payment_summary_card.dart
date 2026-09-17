import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/order_details_entity.dart';

class PaymentSummaryCard extends StatelessWidget {
  final OrderPaymentSummary payment;

  const PaymentSummaryCard({super.key, required this.payment});

  @override
  Widget build(BuildContext context) {
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
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.purple.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.receipt_long_outlined,
                    color: AppColors.purple, size: 15),
              ),
              const SizedBox(width: 8),
              const Text(
                'Résumé du paiement',
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
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border.withAlpha(40)),
            ),
            child: Column(
              children: [
                _PaymentRow(
                  label: 'Sous-total',
                  value: '${_format(payment.subtotal)} DA',
                ),
                const SizedBox(height: 6),
                _PaymentRow(
                  label: 'Remise',
                  value: '-${_format(payment.discount)} DA',
                  valueColor: AppColors.danger,
                ),
                const SizedBox(height: 6),
                _PaymentRow(
                  label: 'TVA',
                  value: '${_format(payment.vat)} DA',
                ),
                const SizedBox(height: 6),
                _PaymentRow(
                  label: 'Livraison',
                  value: '${_format(payment.delivery)} DA',
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Divider(height: 1, color: AppColors.border.withAlpha(50)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total net à payer',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '${_format(payment.total)} DA',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _format(double number) {
    final parts = number.toStringAsFixed(0).split('');
    final result = StringBuffer();
    for (int i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 == 0) result.write(' ');
      result.write(parts[i]);
    }
    return result.toString();
  }
}

class _PaymentRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _PaymentRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11.5,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
