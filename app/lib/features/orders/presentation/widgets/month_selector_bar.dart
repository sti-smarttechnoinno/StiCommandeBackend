import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/orders_history_provider.dart';

class MonthSelectorBar extends ConsumerWidget {
  const MonthSelectorBar({super.key});

  static const List<String> _frenchMonths = [
    '',
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(selectedMonthProvider);
    final monthOrders = ref.watch(monthOrdersProvider);
    final allOrders = ref.watch(ordersProvider).orders;

    final now = DateTime.now();
    final isCurrentMonth = selectedMonth != null &&
        selectedMonth.year == now.year &&
        selectedMonth.month == now.month;

    final isAllMonths = selectedMonth == null;

    final String monthLabel = isAllMonths
        ? 'Tous les mois'
        : '${_frenchMonths[selectedMonth.month]} ${selectedMonth.year}';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border.withAlpha(60)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(6),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Previous month button (<)
            _NavButton(
              icon: Icons.chevron_left_rounded,
              tooltip: 'Mois précédent',
              onTap: () {
                HapticFeedback.selectionClick();
                final current = selectedMonth ?? DateTime(now.year, now.month, 1);
                ref.read(selectedMonthProvider.notifier).state =
                    DateTime(current.year, current.month - 1, 1);
              },
            ),

            // Center month display & selector
            Expanded(
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showMonthPickerModal(context, ref, allOrders, selectedMonth);
                },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isAllMonths
                                ? Icons.calendar_view_month_rounded
                                : Icons.calendar_month_rounded,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            monthLabel,
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.2,
                            ),
                          ),
                          if (isCurrentMonth) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(20),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Ce mois',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 16,
                            color: AppColors.textTertiary,
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${monthOrders.length} commande${monthOrders.length > 1 ? 's' : ''}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Next month button (>)
            _NavButton(
              icon: Icons.chevron_right_rounded,
              tooltip: 'Mois suivant',
              onTap: () {
                HapticFeedback.selectionClick();
                final current = selectedMonth ?? DateTime(now.year, now.month, 1);
                ref.read(selectedMonthProvider.notifier).state =
                    DateTime(current.year, current.month + 1, 1);
              },
            ),

            // Quick reset / all toggle button
            Container(
              height: 30,
              margin: const EdgeInsets.only(left: 4),
              child: TextButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  if (isCurrentMonth) {
                    ref.read(selectedMonthProvider.notifier).state = null;
                  } else {
                    ref.read(selectedMonthProvider.notifier).state =
                        DateTime(now.year, now.month, 1);
                  }
                },
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.background,
                  foregroundColor: AppColors.textSecondary,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: AppColors.border.withAlpha(40)),
                  ),
                ),
                child: Text(
                  isCurrentMonth ? 'Tous' : 'Ce mois',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showMonthPickerModal(
    BuildContext context,
    WidgetRef ref,
    List allOrders,
    DateTime? selectedMonth,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useRootNavigator: true,
      builder: (ctx) {
        final now = DateTime.now();
        final Set<String> availableMonthKeys = {};
        final List<DateTime> monthsList = [];

        for (int i = 0; i < 12; i++) {
          final dt = DateTime(now.year, now.month - i, 1);
          final key = '${dt.year}-${dt.month}';
          if (availableMonthKeys.add(key)) {
            monthsList.add(dt);
          }
        }

        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border.withAlpha(120),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filtrer par mois',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      ref.read(selectedMonthProvider.notifier).state = null;
                      Navigator.pop(ctx);
                    },
                    child: const Text(
                      'Tous les mois',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Flexible(
                child: SingleChildScrollView(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: monthsList.map((dt) {
                      final isSelected = selectedMonth != null &&
                          selectedMonth.year == dt.year &&
                          selectedMonth.month == dt.month;
                      final isCurrent =
                          dt.year == now.year && dt.month == now.month;

                      return ChoiceChip(
                        label: Text(
                          '${_frenchMonths[dt.month]} ${dt.year}${isCurrent ? ' (Actuel)' : ''}',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.background,
                        side: BorderSide(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.border.withAlpha(60),
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            ref.read(selectedMonthProvider.notifier).state = dt;
                          }
                          Navigator.pop(ctx);
                        },
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NavButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  const _NavButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border.withAlpha(40)),
            ),
            child: Icon(
              icon,
              size: 20,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }
}
