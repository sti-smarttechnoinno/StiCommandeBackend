import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

enum BadgeStatus { pending, validated, rejected, delivered }

class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeStatus status;
  final bool compact;

  const StatusBadge({
    super.key,
    required this.label,
    required this.status,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors();

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: AppTypography.badgeText.copyWith(
          color: colors.$2,
          fontSize: compact ? 10 : 11,
        ),
      ),
    );
  }

  (Color, Color) _statusColors() {
    switch (status) {
      case BadgeStatus.pending:
        return (AppColors.warningLight, AppColors.warning);
      case BadgeStatus.validated:
        return (AppColors.successLight, AppColors.success);
      case BadgeStatus.rejected:
        return (AppColors.dangerLight, AppColors.danger);
      case BadgeStatus.delivered:
        return (AppColors.infoLight, AppColors.info);
    }
  }
}
