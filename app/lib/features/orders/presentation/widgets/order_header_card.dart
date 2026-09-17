import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/order.dart';
import '../providers/order_details_entity.dart';

class OrderHeaderCard extends StatelessWidget {
  final OrderDetailsData details;

  const OrderHeaderCard({super.key, required this.details});

  @override
  Widget build(BuildContext context) {
    final order = details.order;

    return Container(
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
          // Order number + status
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Text(
                      order.orderNumber,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(
                            ClipboardData(text: order.orderNumber));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content:
                                Text('Numéro copié: ${order.orderNumber}'),
                            backgroundColor: AppColors.success,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.border.withAlpha(60)),
                        ),
                        child: const Icon(
                          Icons.copy_rounded,
                          size: 12,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              _StatusBadge(
                status: order.status,
                isVirtualOnly: order.isVirtualOnly,
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Date and time
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 14, color: AppColors.textTertiary),
              const SizedBox(width: 6),
              Text(
                '${order.createdAt.day.toString().padLeft(2, '0')} ${_monthName(order.createdAt.month)} ${order.createdAt.year}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 14),
              const Icon(Icons.access_time_rounded,
                  size: 14, color: AppColors.textTertiary),
              const SizedBox(width: 6),
              Text(
                '${order.createdAt.hour.toString().padLeft(2, '0')}:${order.createdAt.minute.toString().padLeft(2, '0')}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Total amount
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(12),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.primary.withAlpha(30)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Montant total net',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_formatNumber(order.totalAmount)} DA',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                    letterSpacing: -0.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _monthName(int month) {
    const names = [
      '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return names[month];
  }

  String _formatNumber(double number) {
    final parts = number.toStringAsFixed(0).split('');
    final result = StringBuffer();
    for (int i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 == 0) result.write(' ');
      result.write(parts[i]);
    }
    return result.toString();
  }
}

class _StatusBadge extends StatelessWidget {
  final OrderStatus status;
  final bool isVirtualOnly;

  const _StatusBadge({
    required this.status,
    this.isVirtualOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              color: colors.$2,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            _statusLabel(status),
            style: TextStyle(
              fontSize: 11,
              color: colors.$2,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color) _statusColors() {
    switch (status) {
      case OrderStatus.draft:
        return (AppColors.textTertiary.withAlpha(30), AppColors.textSecondary);
      case OrderStatus.pending:
        return (AppColors.warningLight, AppColors.warning);
      case OrderStatus.partiallyValidated:
        return (AppColors.infoLight, AppColors.info);
      case OrderStatus.approved:
        return (AppColors.successLight, AppColors.success);
      case OrderStatus.rejected:
        return (AppColors.dangerLight, AppColors.danger);
      case OrderStatus.preparing:
        return (AppColors.infoLight, AppColors.info);
      case OrderStatus.delivered:
        return (AppColors.successLight, AppColors.success);
      case OrderStatus.cancelled:
        return (AppColors.dangerLight, AppColors.danger);
    }
  }

  String _statusLabel(OrderStatus s) {
    switch (s) {
      case OrderStatus.draft:
        return 'Brouillon';
      case OrderStatus.pending:
        return 'En attente';
      case OrderStatus.partiallyValidated:
        return 'Validée (Partielle)';
      case OrderStatus.approved:
        return isVirtualOnly ? 'Validée' : 'Validée (Totale)';
      case OrderStatus.rejected:
        return 'Rejetée';
      case OrderStatus.preparing:
        return 'En préparation';
      case OrderStatus.delivered:
        return isVirtualOnly ? 'Validée' : 'Livrée';
      case OrderStatus.cancelled:
        return 'Annulée';
    }
  }
}
