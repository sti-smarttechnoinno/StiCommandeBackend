import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/client.dart';

class ClientStatusBadge extends StatelessWidget {
  final ClientStatus status;

  const ClientStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _statusLabel,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: colors.$2,
        ),
      ),
    );
  }

  String get _statusLabel {
    switch (status) {
      case ClientStatus.active:
        return 'Actif';
      case ClientStatus.inactive:
        return 'Inactif';
      case ClientStatus.suspended:
        return 'Suspendu';
    }
  }

  (Color, Color) _statusColors() {
    switch (status) {
      case ClientStatus.active:
        return (AppColors.successLight, AppColors.success);
      case ClientStatus.inactive:
        return (const Color(0xFFF3F4F6), AppColors.textTertiary);
      case ClientStatus.suspended:
        return (AppColors.dangerLight, AppColors.danger);
    }
  }
}
