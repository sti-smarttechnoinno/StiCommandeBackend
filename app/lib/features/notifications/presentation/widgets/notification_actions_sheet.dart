import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../../domain/entities/notification.dart';

class NotificationActionsSheet extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onMarkRead;
  final VoidCallback onTogglePin;
  final VoidCallback onCopyRef;
  final VoidCallback onDelete;

  const NotificationActionsSheet({
    super.key,
    required this.notification,
    required this.onMarkRead,
    required this.onTogglePin,
    required this.onCopyRef,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppConstants.lg),
            Text(
              notification.title,
              style: AppTypography.titleMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.xl),
            _ActionRow(
              icon: Icons.mark_email_read_rounded,
              label: notification.isRead ? 'Marquer non lu' : 'Marquer comme lu',
              color: AppColors.info,
              onTap: onMarkRead,
            ),
            _ActionRow(
              icon: notification.isPinned
                  ? Icons.push_pin_rounded
                  : Icons.push_pin_outlined,
              label: notification.isPinned ? 'Désépingler' : 'Épingler',
              color: AppColors.warning,
              onTap: onTogglePin,
            ),
            if (notification.referenceNumber != null)
              _ActionRow(
                icon: Icons.copy_rounded,
                label: 'Copier la référence',
                color: AppColors.textSecondary,
                onTap: onCopyRef,
              ),
            _ActionRow(
              icon: Icons.share_rounded,
              label: 'Partager',
              color: AppColors.purple,
              onTap: () => Navigator.of(context).pop(),
            ),
            const Divider(color: AppColors.border),
            _ActionRow(
              icon: Icons.delete_outline_rounded,
              label: 'Supprimer',
              color: AppColors.danger,
              onTap: onDelete,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionRow({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        label,
        style: AppTypography.bodyMedium.copyWith(
          color: color == AppColors.danger ? AppColors.danger : AppColors.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      contentPadding: EdgeInsets.zero,
      visualDensity: VisualDensity.compact,
    );
  }
}
