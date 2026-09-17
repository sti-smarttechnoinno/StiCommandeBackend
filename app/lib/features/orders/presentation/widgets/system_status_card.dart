import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class SystemStatusCard extends StatelessWidget {
  const SystemStatusCard({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      _StatusItem(label: 'API', statusText: 'En ligne', isOnline: true),
      _StatusItem(
          label: 'Socket.IO', statusText: 'Connecté', isOnline: true),
      _StatusItem(
          label: 'Base de données', statusText: 'Connectée', isOnline: true),
      _StatusItem(
          label: 'Synchronisation', statusText: 'Terminée', isOnline: true),
    ];

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
                  color: AppColors.info.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.dns_outlined,
                    color: AppColors.info, size: 15),
              ),
              const SizedBox(width: 8),
              const Text(
                'Statut du système',
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
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border.withAlpha(40)),
            ),
            child: Column(
              children: List.generate(items.length * 2 - 1, (index) {
                if (index.isOdd) {
                  return Divider(height: 1, color: AppColors.border.withAlpha(40));
                }
                final i = index ~/ 2;
                return _StatusRow(item: items[i]);
              }),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.access_time_rounded,
                  size: 12, color: AppColors.textTertiary),
              const SizedBox(width: 4),
              Text(
                'Dernière mise à jour: ${_formatDateTime(DateTime.now())}',
                style: const TextStyle(
                  color: AppColors.textTertiary,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    const months = ['', 'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    final time = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    return '${dt.day} ${months[dt.month]} ${dt.year} • $time';
  }
}

class _StatusItem {
  final String label;
  final String statusText;
  final bool isOnline;

  const _StatusItem({
    required this.label,
    required this.statusText,
    required this.isOnline,
  });
}

class _StatusRow extends StatelessWidget {
  final _StatusItem item;

  const _StatusRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
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
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
          const Spacer(),
          Text(
            item.statusText,
            style: TextStyle(
              fontSize: 11,
              color: item.isOnline ? AppColors.success : AppColors.danger,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
