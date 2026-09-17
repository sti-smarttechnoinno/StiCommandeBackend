import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/extensions/string_extensions.dart';
import '../../../../core/shared/widgets/status_badge.dart';
import '../../domain/models/dashboard_models.dart';
import '../providers/dashboard_provider.dart';

class RecentOrdersSection extends ConsumerWidget {
  const RecentOrdersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(dashboardProvider.select((s) => s.recentOrders));

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Commandes récentes',
                      style: AppTypography.sectionTitle,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Dernières opérations enregistrées',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textTertiary,
                        fontSize: 12,
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
                  child: Text(
                    'Voir tout',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppConstants.md),

            // Order List or Empty State Feedback
            if (orders.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppConstants.lg,
                  vertical: AppConstants.xxl,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppConstants.radiusLg),
                  border: Border.all(
                    color: AppColors.border.withAlpha(50),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(5),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(16),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          Icons.receipt_long_rounded,
                          size: 26,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppConstants.md),
                    Text(
                      'Aucune commande récente',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Vos dernières commandes enregistrées et synchronisées s\'afficheront ici.',
                      textAlign: TextAlign.center,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textTertiary,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: AppConstants.lg),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/orders/new'),
                      icon: const Icon(Icons.add_shopping_cart_rounded, size: 16),
                      label: const Text('Nouvelle commande'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppConstants.radiusMd),
                        ),
                        textStyle: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: orders.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppConstants.md),
                itemBuilder: (context, index) {
                  final order = orders[index];
                  return _RecentOrderCard(
                    order: order,
                    delay: Duration(
                        milliseconds:
                            700 + index * AppConstants.animDelayStepMs),
                  );
                },
              ),

            const SizedBox(height: AppConstants.xxxl),
          ],
        ),
      ),
    );
  }
}

class _RecentOrderCard extends StatelessWidget {
  final Order order;
  final Duration delay;

  const _RecentOrderCard({required this.order, required this.delay});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          final targetId = order.id.isNotEmpty ? order.id : (order.realId ?? '');
          if (targetId.isNotEmpty) {
            context.push('/orders/$targetId');
          }
        },
        borderRadius: BorderRadius.circular(AppConstants.radiusLg),
        child: Container(
          padding: const EdgeInsets.all(AppConstants.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppConstants.radiusLg),
            border: Border.all(
              color: AppColors.border.withAlpha(50),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(6),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Top Row: Order Reference Tag + Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: AppColors.border.withAlpha(80),
                      ),
                    ),
                    child: Text(
                      order.id,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                  StatusBadge(
                    label: order.statusLabel,
                    status: _badgeStatus(order.status, order.isVirtual),
                    compact: true,
                  ),
                ],
              ),

              const SizedBox(height: AppConstants.sm + 2),

              // Main Row: Icon, Client Details, Amount & Arrow
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: order.statusColor.withAlpha(18),
                      borderRadius:
                          BorderRadius.circular(AppConstants.radiusSm),
                    ),
                    child: Center(
                      child: Icon(
                        _orderIcon(order.status, order.isVirtual),
                        color: order.statusColor,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppConstants.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.clientName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodyMedium.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(
                              Icons.access_time_rounded,
                              size: 12,
                              color: AppColors.textTertiary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${order.date.shortFrenchDate} • ${order.time}',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.textTertiary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppConstants.sm),
                  Text(
                    order.amount.formattedDA,
                    style: AppTypography.bodyLarge.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: AppColors.textTertiary.withAlpha(140),
                    size: 13,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _orderIcon(OrderStatus status, bool isVirtual) {
    switch (status) {
      case OrderStatus.pending:
        return Icons.hourglass_top_rounded;
      case OrderStatus.validated:
        return isVirtual ? Icons.bolt_rounded : Icons.verified_rounded;
      case OrderStatus.rejected:
        return Icons.cancel_rounded;
      case OrderStatus.delivered:
        return isVirtual ? Icons.bolt_rounded : Icons.local_shipping_rounded;
    }
  }

  BadgeStatus _badgeStatus(OrderStatus status, bool isVirtual) {
    switch (status) {
      case OrderStatus.pending:
        return BadgeStatus.pending;
      case OrderStatus.validated:
        return BadgeStatus.validated;
      case OrderStatus.rejected:
        return BadgeStatus.rejected;
      case OrderStatus.delivered:
        return isVirtual ? BadgeStatus.validated : BadgeStatus.delivered;
    }
  }
}

