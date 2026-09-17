import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/client.dart';

class ClientProfileCard extends StatelessWidget {
  final Client client;

  const ClientProfileCard({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return Container(
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
          // Avatar + Name + Status
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Stack(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, Color(0xFFB81419)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        client.initials,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: client.status == ClientStatus.active
                            ? AppColors.success
                            : AppColors.danger,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.surface,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      client.name,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Text(
                          client.code,
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textTertiary,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () {
                            Clipboard.setData(
                                ClipboardData(text: client.code));
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Code copié: ${client.code}'),
                                backgroundColor: AppColors.success,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10)),
                              ),
                            );
                          },
                          child: const Icon(
                            Icons.copy_rounded,
                            size: 12,
                            color: AppColors.textTertiary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _StatusBadge(status: client.status),
                        if (client.outstandingBalance > 0) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF1F2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFFECDD3), width: 0.8),
                            ),
                            child: Text(
                              'Impayé: ${_format(client.outstandingBalance)}',
                              style: const TextStyle(
                                color: Color(0xFFE11D48),
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),
          // Client Details Column Container
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border.withAlpha(50)),
            ),
            child: Column(
              children: [
                _InfoRowTile(
                  icon: Icons.location_on_rounded,
                  label: 'Wilaya / Ville',
                  value: client.wilaya,
                  color: AppColors.danger,
                ),
                Divider(height: 10, color: AppColors.border.withAlpha(40)),
                _InfoRowTile(
                  icon: Icons.public_rounded,
                  label: 'Région',
                  value: client.region,
                  color: AppColors.info,
                ),
                Divider(height: 10, color: AppColors.border.withAlpha(40)),
                _InfoRowTile(
                  icon: Icons.person_rounded,
                  label: 'Propriétaire',
                  value: client.name,
                  color: AppColors.purple,
                ),
                Divider(height: 10, color: AppColors.border.withAlpha(40)),
                _InfoRowTile(
                  icon: Icons.phone_rounded,
                  label: 'Téléphone',
                  value: client.phone,
                  color: AppColors.success,
                ),
                Divider(height: 10, color: AppColors.border.withAlpha(40)),
                _InfoRowTile(
                  icon: Icons.store_rounded,
                  label: 'Type d\'activité',
                  value: client.businessTypeLabel,
                  color: AppColors.warning,
                ),
                Divider(height: 10, color: AppColors.border.withAlpha(40)),
                _InfoRowTile(
                  icon: Icons.account_balance_wallet_rounded,
                  label: 'Solde impayé',
                  value: client.outstandingBalance > 0
                      ? '${_format(client.outstandingBalance)} restant dû'
                      : '0 DA (À jour)',
                  color: client.outstandingBalance > 0 ? AppColors.danger : AppColors.success,
                ),
                Divider(height: 10, color: AppColors.border.withAlpha(40)),
                _InfoRowTile(
                  icon: Icons.calendar_today_rounded,
                  label: 'Client depuis',
                  value: DateFormat('yyyy').format(client.customerSince),
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final ClientStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final isActive = status == ClientStatus.active;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isActive ? AppColors.successLight : AppColors.dangerLight,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        isActive ? 'Actif' : 'Inactif',
        style: AppTypography.labelSmall.copyWith(
          color: isActive ? AppColors.success : AppColors.danger,
          fontWeight: FontWeight.w600,
          fontSize: 10,
        ),
      ),
    );
  }
}

class _InfoRowTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoRowTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: color.withAlpha(15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 12, color: color),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11.5,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

String _format(double amount) {
  return '${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} DA';
}
