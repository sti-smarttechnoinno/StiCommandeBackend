import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class NotificationIcon extends StatelessWidget {
  final String type;
  final double size;

  const NotificationIcon({
    super.key,
    required this.type,
    this.size = 48,
  });

  @override
  Widget build(BuildContext context) {
    final config = _iconConfig(type);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: config.$1.withAlpha(20),
        shape: BoxShape.circle,
      ),
      child: Icon(
        config.$2,
        color: config.$1,
        size: size * 0.45,
      ),
    );
  }

  (Color, IconData) _iconConfig(String type) {
    switch (type) {
      case 'orderApproved':
        return (AppColors.success, Icons.check_circle_rounded);
      case 'orderRejected':
        return (AppColors.danger, Icons.cancel_rounded);
      case 'orderPreparing':
        return (AppColors.info, Icons.local_shipping_rounded);
      case 'orderDelivered':
        return (AppColors.success, Icons.inventory_2_rounded);
      case 'stockAvailable':
        return (AppColors.warning, Icons.warehouse_rounded);
      case 'productAdded':
        return (AppColors.warning, Icons.add_box_rounded);
      case 'clientUpdate':
        return (AppColors.info, Icons.person_rounded);
      case 'systemAnnouncement':
        return (AppColors.purple, Icons.campaign_rounded);
      case 'syncCompleted':
        return (AppColors.success, Icons.sync_rounded);
      case 'internetRestored':
        return (AppColors.success, Icons.wifi_rounded);
      case 'securityAlert':
        return (AppColors.danger, Icons.shield_rounded);
      default:
        return (AppColors.textTertiary, Icons.notifications_rounded);
    }
  }
}
