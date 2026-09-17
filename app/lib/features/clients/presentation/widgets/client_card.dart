import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/client.dart';
import 'client_status_badge.dart';

class ClientCard extends StatelessWidget {
  final Client client;
  final int index;

  const ClientCard({
    super.key,
    required this.client,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(client.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Icon(
          Icons.shopping_cart_outlined,
          color: Colors.white,
          size: 22,
        ),
      ),
      confirmDismiss: (_) async {
        context.push('/orders/new', extra: {'clientId': client.id});
        return false;
      },
      child: GestureDetector(
        onTap: () => context.push('/clients/${client.id}'),
        child: Container(
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
              // Top row
              Row(
                children: [
                  // Avatar
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: client.logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              client.logoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => Center(
                                child: Text(
                                  client.initials,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ),
                          )
                        : Center(
                            child: Text(
                              client.initials,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          client.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppColors.border.withAlpha(60)),
                          ),
                          child: Text(
                            client.code,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  ClientStatusBadge(status: client.status),
                ],
              ),

              const SizedBox(height: 12),

              // Info rows
              _InfoRow(
                icon: Icons.location_on_outlined,
                text: '${client.wilaya} • ${client.region}',
              ),
              const SizedBox(height: 5),
              _InfoRow(
                icon: Icons.phone_outlined,
                text: client.phone,
              ),
              const SizedBox(height: 5),
              _InfoRow(
                icon: Icons.storefront_outlined,
                text: client.businessTypeLabel,
              ),

              const SizedBox(height: 8),

              // Client Balance (Solde) Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: client.outstandingBalance > 0
                      ? const Color(0xFFFFF1F2)
                      : const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: client.outstandingBalance > 0
                        ? const Color(0xFFFECDD3)
                        : const Color(0xFFBBF7D0),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          client.outstandingBalance > 0
                              ? Icons.account_balance_wallet_outlined
                              : Icons.check_circle_outline_rounded,
                          size: 14,
                          color: client.outstandingBalance > 0
                              ? const Color(0xFFE11D48)
                              : const Color(0xFF16A34A),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          client.outstandingBalance > 0 ? 'Solde impayé :' : 'Solde client :',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: client.outstandingBalance > 0
                                ? const Color(0xFF9F1239)
                                : const Color(0xFF166534),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${_formatDA(client.outstandingBalance)} DA',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'monospace',
                        color: client.outstandingBalance > 0
                            ? const Color(0xFFBE123C)
                            : const Color(0xFF15803D),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // Client Monthly Objective Section
              _ClientObjectiveSection(objective: client.objective),

              const SizedBox(height: 12),

              // Quick actions
              Row(
                children: [
                  _QuickActionButton(
                    icon: Icons.call_outlined,
                    color: AppColors.success,
                    onTap: () {},
                  ),
                  const SizedBox(width: 8),
                  _QuickActionButton(
                    icon: Icons.chat_outlined,
                    color: AppColors.success,
                    onTap: () {},
                  ),
                  const SizedBox(width: 8),
                  _QuickActionButton(
                    icon: Icons.location_on_outlined,
                    color: AppColors.info,
                    onTap: () {},
                  ),
                  const SizedBox(width: 8),
                  _QuickActionButton(
                    icon: Icons.visibility_outlined,
                    color: AppColors.textSecondary,
                    onTap: () => context.push('/clients/${client.id}'),
                  ),
                  const SizedBox(width: 8),
                  // Main action button
                  Expanded(
                    child: SizedBox(
                      height: 36,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          context.push('/orders/new', extra: {
                            'clientId': client.id,
                          });
                        },
                        icon: const Icon(Icons.shopping_cart_outlined,
                            size: 14),
                        label: const Text(
                          'Commander',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Bottom info
              Row(
                children: [
                  const Icon(Icons.receipt_long_outlined,
                      size: 13, color: AppColors.textTertiary),
                  const SizedBox(width: 4),
                  Text(
                    '${client.totalOrders} cmd',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Icon(Icons.calendar_today_outlined,
                      size: 13, color: AppColors.textTertiary),
                  const SizedBox(width: 4),
                  Text(
                    'Depuis ${client.customerSince.year}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const Spacer(),
                  if (client.lastOrderDate != null)
                    Text(
                      _formatLastOrder(client.lastOrderDate!),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatLastOrder(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inHours < 1) return 'Il y a ${diff.inMinutes} min';
    if (diff.inDays < 1) return 'Il y a ${diff.inHours}h';
    if (diff.inDays == 1) return 'Hier';
    return 'Il y a ${diff.inDays}j';
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}


class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 16),
      ),
    );
  }
}

class _ClientObjectiveSection extends StatelessWidget {
  final ClientObjectiveSummary? objective;

  const _ClientObjectiveSection({this.objective});

  @override
  Widget build(BuildContext context) {
    final obj = objective;
    final isSet = obj != null && obj.isSet;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: isSet ? const Color(0xFFF8FAFC) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSet ? AppColors.border.withAlpha(60) : const Color(0xFFFDE68A),
          width: 0.8,
        ),
      ),
      child: isSet
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.track_changes_rounded,
                          size: 14,
                          color: obj.revenuePercentage >= 100
                              ? const Color(0xFF16A34A)
                              : AppColors.primary,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Objectif (${obj.monthName})',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: obj.revenuePercentage >= 100
                            ? const Color(0xFF22C55E).withAlpha(25)
                            : AppColors.primary.withAlpha(15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: obj.revenuePercentage >= 100
                              ? const Color(0xFF22C55E).withAlpha(80)
                              : AppColors.primary.withAlpha(60),
                          width: 0.6,
                        ),
                      ),
                      child: Text(
                        '${obj.revenuePercentage.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: obj.revenuePercentage >= 100
                              ? const Color(0xFF16A34A)
                              : AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 7),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (obj.revenuePercentage / 100).clamp(0.0, 1.0),
                    backgroundColor: AppColors.border.withAlpha(80),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      obj.revenuePercentage >= 100
                          ? const Color(0xFF16A34A)
                          : AppColors.primary,
                    ),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Réalisé : ${_formatDA(obj.achievedRevenue)} DA',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      'Cible : ${_formatDA(obj.targetRevenue)} DA',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            )
          : Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withAlpha(30),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.info_outline_rounded,
                    color: Color(0xFFD97706),
                    size: 13,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Objectif non encore défini",
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF92400E),
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        obj != null && obj.achievedRevenue > 0
                            ? "Ventes ce mois : ${_formatDA(obj.achievedRevenue)} DA"
                            : "Aucun quota mensuel fixé pour ce client.",
                        style: const TextStyle(
                          fontSize: 9.5,
                          color: Color(0xFFB45309),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFF59E0B).withAlpha(70),
                      width: 0.7,
                    ),
                  ),
                  child: const Text(
                    'Non défini',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFD97706),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

String _formatDA(double amount) {
  return amount
      .toStringAsFixed(0)
      .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
}
