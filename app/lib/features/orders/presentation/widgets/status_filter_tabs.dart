import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/order.dart';
import '../providers/orders_history_provider.dart';

class StatusFilterTabs extends ConsumerWidget {
  const StatusFilterTabs({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allOrders = ref.watch(monthOrdersProvider);
    final activeFilter = ref.watch(activeStatusFilterProvider);

    // Calculate actual status counts from all loaded orders
    final Map<OrderStatus, int> statusCounts = {};
    for (final order in allOrders) {
      statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    }

    final List<_FilterData> filters = [
      _FilterData(
        label: allOrders.isNotEmpty ? 'Toutes (${allOrders.length})' : 'Toutes',
        status: null,
      ),
    ];

    // Order of priority for known statuses
    const statusDisplayOrder = [
      OrderStatus.approved,
      OrderStatus.pending,
      OrderStatus.partiallyValidated,
      OrderStatus.preparing,
      OrderStatus.delivered,
      OrderStatus.rejected,
      OrderStatus.cancelled,
    ];

    const statusLabels = {
      OrderStatus.approved: 'Validées',
      OrderStatus.pending: 'En attente',
      OrderStatus.partiallyValidated: 'Partielle',
      OrderStatus.preparing: 'Préparation',
      OrderStatus.delivered: 'Livrées',
      OrderStatus.rejected: 'Rejetées',
      OrderStatus.cancelled: 'Annulées',
    };

    for (final status in statusDisplayOrder) {
      final count = statusCounts[status];
      if (count != null && count > 0) {
        final label = statusLabels[status] ?? status.name;
        filters.add(_FilterData(label: '$label ($count)', status: status));
      }
    }

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        physics: const BouncingScrollPhysics(),
        itemCount: filters.length,
        separatorBuilder: (_, _) => const SizedBox(width: 6),
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isActive = activeFilter == filter.status;

          return GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              ref.read(activeStatusFilterProvider.notifier).state =
                  filter.status;
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isActive
                      ? AppColors.primary
                      : AppColors.border.withAlpha(80),
                  width: 1,
                ),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(35),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Text(
                filter.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    )
        .animate()
        .fadeIn(delay: 250.ms, duration: 300.ms)
        .slideY(begin: 0.05, end: 0, delay: 250.ms, duration: 300.ms);
  }
}

class _FilterData {
  final String label;
  final OrderStatus? status;
  const _FilterData({required this.label, required this.status});
}
