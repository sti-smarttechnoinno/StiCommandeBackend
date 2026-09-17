import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/clients_provider.dart';

class ClientEmptyState extends ConsumerWidget {
  final String? title;
  final String? subtitle;
  final VoidCallback? onRefresh;

  const ClientEmptyState({
    super.key,
    this.title,
    this.subtitle,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(10),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.people_outline,
                size: 44,
                color: AppColors.primary.withAlpha(150),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title ?? 'Aucun client trouvé',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle ??
                  'Essayez un autre mot-clé ou modifiez les filtres.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: () {
                if (onRefresh != null) {
                  onRefresh!();
                } else {
                  ref.read(searchQueryProvider.notifier).state = '';
                  ref.read(clientsFilterProvider.notifier).state = const ClientsFilter();
                  ref.invalidate(rawClientsProvider);
                }
              },
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: const Text('Actualiser'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 400.ms)
        .scale(
          begin: const Offset(0.95, 0.95),
          end: const Offset(1, 1),
          duration: 400.ms,
          curve: Curves.easeOut,
        );
  }
}
