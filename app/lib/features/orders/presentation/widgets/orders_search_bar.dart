import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/orders_history_provider.dart';

class OrdersSearchBar extends ConsumerWidget {
  const OrdersSearchBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(searchQueryProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border.withAlpha(60)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(5),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: TextField(
          onChanged: (value) {
            ref.read(searchQueryProvider.notifier).state = value;
          },
          style: const TextStyle(
            fontSize: 13.5,
            color: AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: 'Rechercher par N° ou client...',
            hintStyle: const TextStyle(
              color: AppColors.textTertiary,
              fontSize: 13,
            ),
            icon: const Icon(
              Icons.search_rounded,
              color: AppColors.textTertiary,
              size: 20,
            ),
            suffixIcon: query.isNotEmpty
                ? IconButton(
                    icon: const Icon(
                      Icons.close_rounded,
                      color: AppColors.textTertiary,
                      size: 18,
                    ),
                    onPressed: () {
                      ref.read(searchQueryProvider.notifier).state = '';
                    },
                  )
                : null,
            border: InputBorder.none,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 200.ms, duration: 300.ms)
        .slideY(begin: 0.05, end: 0, delay: 200.ms, duration: 300.ms);
  }
}
