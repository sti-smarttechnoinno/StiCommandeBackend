import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../../domain/entities/notification.dart';
import '../providers/notifications_provider.dart';
import 'notification_icon.dart';
import 'notification_time_label.dart';
import 'notification_actions_sheet.dart';

class NotificationCard extends ConsumerWidget {
  final AppNotification notification;
  final int index;

  const NotificationCard({
    super.key,
    required this.notification,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 4,
      ),
      child: Dismissible(
        key: ValueKey(notification.id),
        direction: DismissDirection.horizontal,
        background: _swipeBackground(
          alignment: Alignment.centerLeft,
          icon: Icons.archive_rounded,
          label: 'Archiver',
          color: AppColors.info,
        ),
        secondaryBackground: _swipeBackground(
          alignment: Alignment.centerRight,
          icon: Icons.delete_outline_rounded,
          label: 'Supprimer',
          color: AppColors.danger,
        ),
        confirmDismiss: (direction) async {
          if (direction == DismissDirection.endToStart) {
            return await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                title: const Text(
                  'Supprimer',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                content: const Text(
                  'Voulez-vous vraiment supprimer cette notification ?',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(false),
                    child: const Text('Annuler'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.of(ctx).pop(true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.danger,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Supprimer'),
                  ),
                ],
              ),
            );
          }
          return true;
        },
        onDismissed: (direction) {
          HapticFeedback.lightImpact();
          if (direction == DismissDirection.endToStart) {
            ref
                .read(notificationsProvider.notifier)
                .deleteNotification(notification.id);
          } else {
            ref
                .read(notificationsProvider.notifier)
                .markAsRead(notification.id);
          }
        },
        child: GestureDetector(
          onTap: () => _onTap(context, ref),
          onLongPress: () => _showActionsSheet(context, ref),
          child: RepaintBoundary(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: notification.isRead
                    ? AppColors.surface
                    : AppColors.primary.withAlpha(6),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: notification.isRead
                      ? AppColors.border.withAlpha(50)
                      : AppColors.primary.withAlpha(40),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Icon
                      NotificationIcon(type: notification.type.name),
                      const SizedBox(width: 12),

                      // Title & Subtitle/Meta
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    notification.title,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (!notification.isRead)
                                  Container(
                                    width: 7,
                                    height: 7,
                                    margin: const EdgeInsets.only(left: 6),
                                    decoration: const BoxDecoration(
                                      color: AppColors.danger,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                if (notification.referenceNumber != null) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(5),
                                      border: Border.all(
                                          color: AppColors.border.withAlpha(60)),
                                    ),
                                    child: Text(
                                      notification.referenceNumber!,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textSecondary,
                                        fontFamily: 'monospace',
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                NotificationTimeLabel(
                                    dateTime: notification.createdAt),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 6),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.textTertiary,
                        size: 17,
                      ),
                    ],
                  ),

                  // Full Width Description
                  if (notification.description.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: Text(
                        notification.description,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _swipeBackground({
    required Alignment alignment,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppConstants.radiusXl),
      ),
      alignment: alignment,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (alignment == Alignment.centerRight) ...[
            Text(
              label,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textOnPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Icon(icon, color: AppColors.textOnPrimary, size: 24),
          if (alignment == Alignment.centerLeft) ...[
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textOnPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _onTap(BuildContext context, WidgetRef ref) {
    ref.read(notificationsProvider.notifier).markAsRead(notification.id);

    switch (notification.type) {
      case NotificationType.orderApproved:
      case NotificationType.orderRejected:
      case NotificationType.orderDelivered:
      case NotificationType.orderPreparing:
        context.push('/orders');
        break;
      case NotificationType.clientUpdate:
        context.push('/clients');
        break;
      default:
        break;
    }
  }

  void _showActionsSheet(BuildContext context, WidgetRef ref) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => NotificationActionsSheet(
        notification: notification,
        onMarkRead: () {
          Navigator.of(ctx).pop();
          ref
              .read(notificationsProvider.notifier)
              .markAsRead(notification.id);
        },
        onTogglePin: () {
          Navigator.of(ctx).pop();
          ref
              .read(notificationsProvider.notifier)
              .togglePin(notification.id);
        },
        onCopyRef: () {
          Navigator.of(ctx).pop();
          if (notification.referenceNumber != null) {
            Clipboard.setData(
                ClipboardData(text: notification.referenceNumber!));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content:
                    Text('Référence copiée: ${notification.referenceNumber}'),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            );
          }
        },
        onDelete: () {
          Navigator.of(ctx).pop();
          ref
              .read(notificationsProvider.notifier)
              .deleteNotification(notification.id);
        },
      ),
    );
  }
}
