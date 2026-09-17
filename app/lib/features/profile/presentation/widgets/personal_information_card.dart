import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/profile_provider.dart';

class PersonalInformationCard extends ConsumerWidget {
  const PersonalInformationCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);

    final rows = [
      _InfoRow(
        icon: Icons.phone_outlined,
        label: 'Téléphone',
        value: profile.phone,
        color: AppColors.success,
      ),
      _InfoRow(
        icon: Icons.email_outlined,
        label: 'Email',
        value: profile.email,
        color: AppColors.info,
      ),
      _InfoRow(
        icon: Icons.location_on_outlined,
        label: 'Région assignée',
        value: profile.region,
        color: AppColors.purple,
      ),
      _InfoRow(
        icon: Icons.map_outlined,
        label: 'Wilaya',
        value: profile.wilaya,
        color: AppColors.warning,
      ),
      _InfoRow(
        icon: Icons.calendar_today_outlined,
        label: 'Employé depuis',
        value: DateFormat('dd/MM/yyyy').format(profile.employeeSince),
        color: AppColors.primary,
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
                    color: AppColors.primary.withAlpha(15),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(Icons.person_outline_rounded,
                      color: AppColors.primary, size: 17),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Informations Personnelles',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...List.generate(rows.length * 2 - 1, (index) {
              if (index.isOdd) {
                return Divider(height: 1, color: AppColors.border.withAlpha(60));
              }
              final rowIndex = index ~/ 2;
              return rows[rowIndex];
            }),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
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
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right_rounded,
              color: AppColors.textTertiary, size: 16),
        ],
      ),
    );
  }
}
