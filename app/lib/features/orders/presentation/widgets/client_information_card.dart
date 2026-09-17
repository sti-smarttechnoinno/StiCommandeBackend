import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/client.dart';

class ClientInformationCard extends StatelessWidget {
  final Client client;

  const ClientInformationCard({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
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
          // Title
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.info.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.store_outlined,
                    color: AppColors.info, size: 15),
              ),
              const SizedBox(width: 8),
              const Text(
                'Informations du client',
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

          // Client avatar + name + code
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    client.name
                        .split(' ')
                        .take(2)
                        .map((w) => w[0])
                        .join()
                        .toUpperCase(),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      client.name,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Text(
                          client.code,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textTertiary,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: AppColors.purpleLight,
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: const Text(
                            'Grossiste',
                            style: TextStyle(
                              color: AppColors.purple,
                              fontWeight: FontWeight.w600,
                              fontSize: 9.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              _ClientStatusBadge(status: client.status),
            ],
          ),

          const SizedBox(height: 10),

          // Info rows inside container
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border.withAlpha(40)),
            ),
            child: Column(
              children: [
                _InfoRow(
                  icon: Icons.badge_outlined,
                  label: 'ID Client',
                  value: client.id.isNotEmpty ? client.id : client.code,
                  color: AppColors.primary,
                ),
                Divider(height: 1, color: AppColors.border.withAlpha(40)),
                _InfoRow(
                  icon: Icons.phone_outlined,
                  label: 'Téléphone',
                  value: client.phone.isNotEmpty ? client.phone : 'Non renseigné',
                  color: AppColors.success,
                ),
                Divider(height: 1, color: AppColors.border.withAlpha(40)),
                _InfoRow(
                  icon: Icons.location_on_outlined,
                  label: 'Adresse',
                  value: client.address.isNotEmpty ? client.address : '${client.wilaya}, ${client.region}',
                  color: AppColors.warning,
                ),
                Divider(height: 1, color: AppColors.border.withAlpha(40)),
                _InfoRow(
                  icon: Icons.map_outlined,
                  label: 'Wilaya',
                  value: client.wilaya,
                  color: AppColors.info,
                ),
                Divider(height: 1, color: AppColors.border.withAlpha(40)),
                _InfoRow(
                  icon: Icons.public_outlined,
                  label: 'Région',
                  value: client.region,
                  color: AppColors.purple,
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Quick actions
          Row(
            children: [
              Expanded(
                child: _ActionBtn(
                  icon: Icons.call_rounded,
                  label: 'Appeler',
                  color: AppColors.success,
                  onTap: () {},
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionBtn(
                  icon: Icons.chat_rounded,
                  label: 'WhatsApp',
                  color: AppColors.success,
                  onTap: () {},
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionBtn(
                  icon: Icons.map_rounded,
                  label: 'Maps',
                  color: AppColors.info,
                  onTap: () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ClientStatusBadge extends StatelessWidget {
  final ClientStatus status;

  const _ClientStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final isActive = status == ClientStatus.active;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isActive ? AppColors.successLight : AppColors.dangerLight,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        isActive ? 'Actif' : 'Inactif',
        style: TextStyle(
          color: isActive ? AppColors.success : AppColors.danger,
          fontWeight: FontWeight.w700,
          fontSize: 10,
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
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: color.withAlpha(15),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Icon(icon, color: color, size: 13),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 11.5,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withAlpha(12),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(35)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
