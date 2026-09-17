import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/constants/app_constants.dart';
import '../providers/dashboard_provider.dart';

class StatisticsSection extends ConsumerWidget {
  const StatisticsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(dashboardProvider.select((s) => s.stats));

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Aperçu aujourd\'hui',
                      style: AppTypography.sectionTitle,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Statistiques en temps réel',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textTertiary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.border.withAlpha(60),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(4),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Aujourd\'hui',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppConstants.md),

            // 2x2 Grid of Executive KPI Cards
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: AppConstants.md,
              crossAxisSpacing: AppConstants.md,
              childAspectRatio: 1.35,
              children: [
                _StatCard(
                  value: '${stats.pendingOrders}',
                  label: 'En attente',
                  badgeText: 'À traiter',
                  icon: Icons.hourglass_top_rounded,
                  color: AppColors.warning,
                  bgColor: AppColors.warningLight,
                  delay: 450.ms,
                ),
                _StatCard(
                  value: '${stats.validatedOrders}',
                  label: 'Commandes validées',
                  badgeText: '+12%',
                  icon: Icons.verified_rounded,
                  color: AppColors.success,
                  bgColor: AppColors.successLight,
                  delay: 520.ms,
                ),
                _StatCard(
                  value: '${stats.deliveringOrders}',
                  label: 'En livraison',
                  badgeText: 'En route',
                  icon: Icons.local_shipping_rounded,
                  color: AppColors.info,
                  bgColor: AppColors.infoLight,
                  delay: 590.ms,
                ),
                _StatCard(
                  value: '${stats.productsOrdered}',
                  label: 'Produits commandés',
                  badgeText: stats.productsGrowth != null && stats.productsGrowth != 0.0
                      ? '${stats.productsGrowth! > 0 ? "+" : ""}${stats.productsGrowth!.toStringAsFixed(0)}%'
                      : 'Articles',
                  icon: Icons.inventory_2_rounded,
                  color: AppColors.purple,
                  bgColor: AppColors.purpleLight,
                  delay: 660.ms,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final String badgeText;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final Duration delay;

  const _StatCard({
    required this.value,
    required this.label,
    required this.badgeText,
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.go('/orders'),
        borderRadius: BorderRadius.circular(AppConstants.radiusLg),
        child: Container(
          padding: const EdgeInsets.all(AppConstants.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppConstants.radiusLg),
            border: Border.all(
              color: AppColors.border.withAlpha(50),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(6),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Row: Icon + Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius:
                          BorderRadius.circular(AppConstants.radiusSm),
                    ),
                    child: Center(
                      child: Icon(icon, color: color, size: 18),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withAlpha(15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(
                        color: color,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),

              // Bottom Section: Big Value + Title Label
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: AppTypography.statNumber.copyWith(
                      color: AppColors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
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
}

