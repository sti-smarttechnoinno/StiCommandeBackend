import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/profile_provider.dart';

class SettingsCard extends ConsumerWidget {
  const SettingsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final notifier = ref.read(settingsProvider.notifier);

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
                    color: AppColors.textSecondary.withAlpha(15),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(Icons.settings_outlined,
                      color: AppColors.textSecondary, size: 17),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Paramètres de l\'application',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Language
            _SettingsRow(
              icon: Icons.language_rounded,
              label: 'Langue',
              trailing: Text(
                settings.language,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              color: AppColors.info,
            ),
            Divider(height: 1, color: AppColors.border.withAlpha(60)),

            // Dark Mode
            _SettingsSwitch(
              icon: Icons.dark_mode_outlined,
              label: 'Mode sombre',
              value: settings.darkMode,
              onChanged: (_) => notifier.toggleDarkMode(),
              color: AppColors.purple,
            ),
            Divider(height: 1, color: AppColors.border.withAlpha(60)),

            // Notifications
            _SettingsSwitch(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              value: settings.notificationsEnabled,
              onChanged: (_) => notifier.toggleNotifications(),
              color: AppColors.warning,
            ),
            Divider(height: 1, color: AppColors.border.withAlpha(60)),

            // Biometric
            _SettingsSwitch(
              icon: Icons.fingerprint_rounded,
              label: 'Connexion biométrique',
              value: settings.biometricEnabled,
              onChanged: (_) => notifier.toggleBiometric(),
              color: AppColors.success,
            ),
            Divider(height: 1, color: AppColors.border.withAlpha(60)),

            // Sync
            _SettingsRow(
              icon: Icons.sync_rounded,
              label: 'Synchronisation',
              trailing: const Text(
                'Il y a 2 min',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.success,
                ),
              ),
              color: AppColors.success,
            ),
            Divider(height: 1, color: AppColors.border.withAlpha(60)),

            // About
            const _SettingsRow(
              icon: Icons.info_outline_rounded,
              label: 'À propos',
              trailing: Text(
                'v1.0.0',
                style: TextStyle(
                  fontSize: 11.5,
                  color: AppColors.textTertiary,
                ),
              ),
              color: AppColors.textSecondary,
              showChevron: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget trailing;
  final Color color;
  final bool showChevron;

  const _SettingsRow({
    required this.icon,
    required this.label,
    required this.trailing,
    required this.color,
    this.showChevron = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: color.withAlpha(15),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Icon(icon, color: color, size: 14),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12.5,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          trailing,
          if (showChevron) ...[
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.textTertiary, size: 16),
          ],
        ],
      ),
    );
  }
}

class _SettingsSwitch extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color color;

  const _SettingsSwitch({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: color.withAlpha(15),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Icon(icon, color: color, size: 14),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12.5,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch(
              value: value,
              onChanged: onChanged,
              activeThumbColor: AppColors.success,
              activeTrackColor: AppColors.success.withAlpha(60),
              inactiveTrackColor: AppColors.border,
            ),
          ),
        ],
      ),
    );
  }
}
