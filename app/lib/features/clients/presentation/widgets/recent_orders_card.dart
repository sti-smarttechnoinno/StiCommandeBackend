import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../orders/domain/entities/order.dart';
import '../providers/client_details_provider.dart';

class RecentOrdersCard extends ConsumerWidget {
  final String clientId;

  const RecentOrdersCard({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final details = ref.watch(clientDetailsProvider(clientId));

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.receipt_long_rounded,
                        color: AppColors.primary, size: 15),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Commandes récentes',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                ],
              ),
              TextButton(
                onPressed: () => context.go('/orders'),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Voir tout',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (details.recentOrders.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(
                child: Text(
                  'Aucune commande récente',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            )
          else
            ...List.generate(details.recentOrders.length * 2 - 1, (index) {
              if (index.isOdd) {
                return const Divider(
                    height: 1, color: AppColors.border, indent: 44);
              }
              final i = index ~/ 2;
              final order = details.recentOrders[i];
              return _OrderRow(
                order: order,
                index: i,
                onTap: () => context.push('/orders/${order.id}'),
              );
            }),
        ],
      ),
    );
  }
}

class _OrderRow extends StatelessWidget {
  final Order order;
  final int index;
  final VoidCallback onTap;

  const _OrderRow({
    required this.order,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppConstants.md),
        child: Row(
          children: [
            // Timeline dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: _statusColor(order.status, order.isVirtualOnly),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: AppConstants.md),
            // Order info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.orderNumber,
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formatDate(order.createdAt),
                    style: const TextStyle(
                      color: AppColors.textTertiary,
                      fontSize: 11.5,
                    ),
                  ),
                ],
              ),
            ),
            // Amount + status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${_format(order.totalAmount)} DA',
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                _MiniStatusBadge(
                  status: order.status,
                  isVirtualOnly: order.isVirtualOnly,
                ),
              ],
            ),
            const SizedBox(width: AppConstants.sm),
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.textTertiary, size: 18),
          ],
        ),
      ),
    ).animate().fadeIn(
          delay: Duration(milliseconds: 650 + index * 60),
          duration: const Duration(milliseconds: 200),
        );
  }

  Color _statusColor(OrderStatus status, bool isVirtual) {
    switch (status) {
      case OrderStatus.pending:
        return AppColors.warning;
      case OrderStatus.partiallyValidated:
        return AppColors.info;
      case OrderStatus.approved:
        return AppColors.success;
      case OrderStatus.rejected:
        return AppColors.danger;
      case OrderStatus.preparing:
        return AppColors.info;
      case OrderStatus.delivered:
        return isVirtual ? AppColors.success : AppColors.info;
      case OrderStatus.cancelled:
        return AppColors.danger;
      case OrderStatus.draft:
        return AppColors.textTertiary;
    }
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

  String _formatDate(DateTime dt) {
    const months = ['', 'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    return '${dt.day} ${months[dt.month]} ${dt.year}';
  }
}

class _MiniStatusBadge extends StatelessWidget {
  final OrderStatus status;
  final bool isVirtualOnly;

  const _MiniStatusBadge({
    required this.status,
    this.isVirtualOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _colors();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        _label(status),
        style: AppTypography.labelSmall.copyWith(
          color: colors.$2,
          fontSize: 9,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  (Color, Color) _colors() {
    switch (status) {
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
        return isVirtualOnly
            ? (AppColors.successLight, AppColors.success)
            : (AppColors.infoLight, AppColors.info);
      case OrderStatus.cancelled:
        return (AppColors.dangerLight, AppColors.danger);
      case OrderStatus.draft:
        return (AppColors.background, AppColors.textTertiary);
    }
  }

  String _label(OrderStatus s) {
    switch (s) {
      case OrderStatus.draft:
        return 'Brouillon';
      case OrderStatus.pending:
        return 'En attente';
      case OrderStatus.partiallyValidated:
        return 'Validée (Partielle)';
      case OrderStatus.approved:
        return isVirtualOnly ? 'Validée' : 'Validée';
      case OrderStatus.rejected:
        return 'Rejetée';
      case OrderStatus.preparing:
        return 'Préparation';
      case OrderStatus.delivered:
        return isVirtualOnly ? 'Validée' : 'Livrée';
      case OrderStatus.cancelled:
        return 'Annulée';
    }
  }
}
