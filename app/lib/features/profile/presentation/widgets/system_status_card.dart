import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/profile_provider.dart';

class SystemStatusCard extends ConsumerWidget {
  const SystemStatusCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(systemStatusProvider);

    final items = [
      _StatusItem(
        label: 'Serveur API',
        isOnline: status.apiOnline,
        statusText: status.apiOnline ? 'En ligne' : 'Hors ligne',
      ),
      _StatusItem(
        label: 'Socket.IO',
        isOnline: status.socketOnline,
        statusText: status.socketOnline ? 'Connecté' : 'Déconnecté',
      ),
      _StatusItem(
        label: 'Base PostgreSQL',
        isOnline: status.databaseOnline,
        statusText: status.databaseOnline ? 'En ligne' : 'Hors ligne',
      ),
      const _StatusItem(
        label: 'Synchronisation',
        isOnline: true,
        statusText: 'Il y a 2 min',
      ),
    ];

    return SliverToBoxAdapter(
      child: Container(
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
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.success.withAlpha(15),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(Icons.health_and_safety_outlined,
                      color: AppColors.success, size: 17),
                ),
                const SizedBox(width: 10),
                const Text(
                  'État du Système',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                // Overall status
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: const BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        'Opérationnel',
                        style: TextStyle(
                          fontSize: 10.5,
                          color: AppColors.success,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Status items
            ...List.generate(items.length * 2 - 1, (index) {
              if (index.isOdd) {
                return Divider(height: 1, color: AppColors.border.withAlpha(60));
              }
              final i = index ~/ 2;
              return _StatusItemWidget(item: items[i]);
            }),

            const SizedBox(height: 10),

            // App version
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border.withAlpha(60)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.info_outline_rounded,
                      size: 13, color: AppColors.textTertiary),
                  const SizedBox(width: 6),
                  Text(
                    'STI Commande v${status.appVersion}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textTertiary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusItem {
  final String label;
  final bool isOnline;
  final String statusText;

  const _StatusItem({
    required this.label,
    required this.isOnline,
    required this.statusText,
  });
}

class _StatusItemWidget extends StatelessWidget {
  final _StatusItem item;

  const _StatusItemWidget({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              color: item.isOnline ? AppColors.success : AppColors.danger,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            item.label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textPrimary,
            ),
          ),
          const Spacer(),
          Text(
            item.statusText,
            style: TextStyle(
              fontSize: 11.5,
              color: item.isOnline ? AppColors.success : AppColors.danger,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
