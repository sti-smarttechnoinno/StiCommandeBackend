import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class NotificationTimeLabel extends StatelessWidget {
  final DateTime dateTime;

  const NotificationTimeLabel({super.key, required this.dateTime});

  @override
  Widget build(BuildContext context) {
    return Text(
      _formatTime(dateTime),
      style: AppTypography.bodySmall.copyWith(
        color: AppColors.textTertiary,
        fontSize: 12,
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    if (diff.inDays == 1) return 'Hier';
    if (diff.inDays < 7) return 'Il y a ${diff.inDays} jours';
    const months = ['', 'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    return '${dt.day} ${months[dt.month]}';
  }
}
