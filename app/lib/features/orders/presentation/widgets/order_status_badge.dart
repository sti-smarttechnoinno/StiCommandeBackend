import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/order.dart';

class OrderStatusBadge extends StatelessWidget {
  final OrderStatus status;
  final bool isVirtualOnly;

  const OrderStatusBadge({
    super.key,
    required this.status,
    this.isVirtualOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _statusLabel,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: colors.$2,
        ),
      ),
    );
  }

  String get _statusLabel {
    switch (status) {
      case OrderStatus.draft:
        return 'Brouillon';
      case OrderStatus.pending:
        return 'En attente';
      case OrderStatus.partiallyValidated:
        return 'Validée (Partielle)';
      case OrderStatus.approved:
        return 'Validée';
      case OrderStatus.preparing:
        return 'Préparation';
      case OrderStatus.delivered:
        return isVirtualOnly ? 'Validée' : 'Livrée';
      case OrderStatus.rejected:
        return 'Rejetée';
      case OrderStatus.cancelled:
        return 'Annulée';
    }
  }

  (Color, Color) _statusColors() {
    switch (status) {
      case OrderStatus.draft:
        return (const Color(0xFFF3F4F6), AppColors.textTertiary);
      case OrderStatus.pending:
        return (AppColors.warningLight, AppColors.warning);
      case OrderStatus.partiallyValidated:
        return (AppColors.infoLight, AppColors.info);
      case OrderStatus.approved:
        return (AppColors.successLight, AppColors.success);
      case OrderStatus.preparing:
        return (AppColors.infoLight, AppColors.info);
      case OrderStatus.delivered:
        return isVirtualOnly
            ? (AppColors.successLight, AppColors.success)
            : (const Color(0xFFE0F2FE), const Color(0xFF06B6D4));
      case OrderStatus.rejected:
        return (AppColors.dangerLight, AppColors.danger);
      case OrderStatus.cancelled:
        return (const Color(0xFFF3F4F6), AppColors.textTertiary);
    }
  }
}
